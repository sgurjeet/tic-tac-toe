const {
  DynamoDB,
  ApiGatewayManagementApi,
} = require('aws-sdk');
const {
  ROLES,
  TABLES,
  GAME_STATUS,
  ACTION_TYPES,
  DEFAULT_BOARD,
  MESSAGE_TYPES,
} = require('./constants');
const {
  getGameStatus,
  getUpdatedBoard,
} = require('./gameUtility');

const dynamo = new DynamoDB.DocumentClient();

const getAllConnectionIds = async () => {
  const data = await dynamo.scan({
    TableName: TABLES.USERS,
    ProjectionExpression: 'userId'
  }).promise();
  const { Items = [] } = data;
  return Items.map(({ userId }) => userId);
};

const deleteConnection = async (id) => {
  return dynamo.delete({
    TableName: TABLES.USERS,
    Key: {
      userId: id,
    },
  }).promise();
};

const postMessage = async (params) => {
  const { gwApi, id, message } = params;
  message.userId = id;
  try {
    return gwApi.postToConnection({
      ConnectionId: id,
      Data: JSON.stringify(message),
    }).promise();
  } catch(err) {
    console.log(`Error posting message to ${id}`, err);
    if (err.statusCode === 410) {
      await deleteConnection(id);
    }
  }
};

const broadcastMessage = async (params) => {
  const {
    gwApi,
    currentConnectionId,
    message
  } = params;
  try {
    const connectionIds = await getAllConnectionIds();
    const postAll = connectionIds.map(async (id) => {
      if (id && id !== currentConnectionId) {
        return postMessage({
          id, message, gwApi,
        })
      }
    });
    await Promise.all(postAll);
  } catch(err) {
    console.log('Error posting to all connections', err);
  }
};

const getUsersCount = async () => {
  const {
    Items: users = [],
  } = await dynamo.scan({
    TableName: TABLES.USERS,
  }).promise();
  const playersCount = users.filter(({ type}) => type === ROLES.PLAYER).length;      
  const spectatorsCount = users.filter(({ type}) => type === ROLES.SPECTATOR).length;      
  return {
    playersCount,
    spectatorsCount,
  };
};

const clearOldGame = async () => {
  const { Items } = await dynamo.scan({
    TableName: TABLES.GAMES,
  }).promise();
  await Promise.all(Items.map(({ gameId }) => dynamo.delete({
    TableName: TABLES.GAMES,
    Key: {
      gameId,
    },
  }).promise()));
};

const startNewGame = async (params) => {
  const {
    board,
    gameStatus,
  } = params;
  // clear old game in case it didn't on disconnect
  await clearOldGame();
  try {
    const { Items: players } = await dynamo.scan({
      TableName: TABLES.USERS,
      FilterExpression: '#userType = :type',
      ExpressionAttributeNames: {
        '#userType': 'type',
      },
      ExpressionAttributeValues: {
        ':type': ROLES.PLAYER,
      },
    }).promise();
    
    // assign a side to each player(only 2 so 0/1)
    const playerIdsMap = {};
    players.forEach(({ userId }, ind) => {
      playerIdsMap[userId] = ind;
    });
    
    // create new game obj(using update to get latest obj)
    const { Attributes: gameData } = await dynamo.update({
      TableName: TABLES.GAMES,
      Key: {
        gameId: Date.now(),
      },
      UpdateExpression: 'set board = :board, gameStatus = :gameStatus, players = :players, nextTurn = :nextTurn',
      ExpressionAttributeValues: {
        ':board': board,
        ':gameStatus': gameStatus,
        ':players': playerIdsMap,
        ':nextTurn': players[0].userId,
      },
      ReturnValues: 'ALL_NEW',
    }).promise();
    return gameData;
  } catch (error) {
    console.log(error)
  }
};

exports.handler = async (event, context) => {
  console.log('Received event: ', JSON.stringify(event, null, 2), JSON.stringify(context, null, 2));
  const { requestContext: { domainName, stage, routeKey, connectionId } } = event;
  const gwApi = new ApiGatewayManagementApi({
    endpoint: domainName + '/' + stage
  });
  const { Items: games = [] } = await dynamo.scan({
    TableName: TABLES.GAMES,
  }).promise(); 
  let game = games.length && games[0]; // only 1 active game at once
  if (routeKey === "$connect") {
    await dynamo.put({
      TableName: TABLES.USERS,
      Item: {
        userId: connectionId,
      },
    }).promise();
    const { Count: numberOfUsers } = await dynamo.scan({
      TableName: TABLES.USERS,
    }).promise();
    await broadcastMessage({
      gwApi,
      message: {
        type: MESSAGE_TYPES.NEW_USER,
        message: 'New user joined',
        numberOfUsers, 
      },
      currentConnectionId: connectionId,
    });
    return {
      statusCode: 200,
      body: 'Success',
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
  if (routeKey === "$disconnect") {
    let statusCode = 200, body = '';
    try {
      await deleteConnection(connectionId);
      const {
        playersCount,
        spectatorsCount,
      } = await getUsersCount();
      if (!playersCount) {
        await clearOldGame();
        game = {};
      }
      await broadcastMessage({
        gwApi,
        message: {
          type: MESSAGE_TYPES.GAME_STATUS,
          message: 'Game status',
          users: {
            players: playersCount,
            spectators: spectatorsCount,
          },
          game,
        },
      });
      body = 'Disconnected';
    } catch (err) {
      statusCode = 400;
      body = 'Error in disconnection';
    }
    return {
      statusCode,
      body,
    };
  }
  if (routeKey === ACTION_TYPES.GET_GAME_STATUS) {
    let statusCode = 200, body = 'Success';
    try {
      const {
        playersCount,
        spectatorsCount,
      } = await getUsersCount();
      await broadcastMessage({
        gwApi,
        message: {
          type: MESSAGE_TYPES.GAME_STATUS,
          message: 'Successfully fetched game status',
          users: {
            players: playersCount,
            spectators: spectatorsCount,
          },
          game,
        },
      });
      return {
        statusCode,
        body: JSON.stringify(body),
      };
    } catch (error) {
      console.log(error);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Error in fetching game status', error }),
      };
    }
  }
  if (routeKey === ACTION_TYPES.SELECT_ROLE) {
    const reqBody = JSON.parse(event.body);
    let statusCode = 200, body = { message: 'Successfully selected role' };
    if (!Object.values(ROLES).includes(reqBody.data.type)) {
      statusCode = 400;
      body = { message: 'Invalid role selected' };
    }
    try {
      await dynamo.update({
        TableName: TABLES.USERS,
        Key: {
          userId: connectionId,
        },
        UpdateExpression: 'set #type = :userType, #name = :userName',
        ExpressionAttributeValues: {
          ':userType': reqBody.data.type,
          ':userName': reqBody.data.name,
        },
        ExpressionAttributeNames: {
          '#type': 'type',
          '#name': 'name',
        },
      }).promise();
      const {
        playersCount,
        spectatorsCount,
      } = await getUsersCount();
      await broadcastMessage({
        gwApi,
        message: {
          type: MESSAGE_TYPES.ROLE_SELECTED,
          message: 'New user role selected',
          users: {
            players: playersCount,
            spectators: spectatorsCount,
          }, 
        },
      });
      if (playersCount === 2) {
        game = await startNewGame({
          board: DEFAULT_BOARD,
          gameStatus: GAME_STATUS.IN_PROGRESS,
        });
        await broadcastMessage({
          gwApi,
          message: {
            type: MESSAGE_TYPES.GAME_START,
            message: 'Game Started',
            game,
            users: {
              players: playersCount,
              spectators: spectatorsCount,
            },
          },
        });
      }
    } catch (error) {
      statusCode = 400;
      console.log(error)
      body = { message: 'Error in selecting role', error };
    }
    return {
      statusCode,
      body: JSON.stringify(body),
    };
  }
  if (routeKey === ACTION_TYPES.NEW_MOVE) {
    const reqBody = JSON.parse(event.body);
    let statusCode = 200, body = 'Successfully made move';
    try {
      const updatedBoard = getUpdatedBoard({ game, move: reqBody.data });
      const gameStatus = getGameStatus({ updatedBoard, move: reqBody.data });
      let nextTurn = '';
      Object.keys(game.players).forEach(id => {
        if (id !== connectionId) {
          nextTurn = id;
        }
      });
      const { Attributes: gameData } = await dynamo.update({
        TableName: TABLES.GAMES,
        Key: {
          gameId: game.gameId,
        },
        UpdateExpression: 'set board = :board, gameStatus = :gameStatus, nextTurn = :nextTurn',
        ExpressionAttributeValues: {
          ':board': updatedBoard,
          ':gameStatus': gameStatus,
          ':nextTurn': nextTurn,
        },
        ReturnValues: 'ALL_NEW',
      }).promise();
      game = gameData;
      await broadcastMessage({
        gwApi,
        message: {
          type: MESSAGE_TYPES.NEW_MOVE,
          message: 'New move',
          game,
        },
      });
      const { Items } = await dynamo.scan({
        TableName: TABLES.USERS,
        FilterExpression: '#userId = :userId',
        ExpressionAttributeNames: {
          '#userId': 'userId',
        },
        ExpressionAttributeValues: {
          ':userId': connectionId,
        },
      });
      const currentUserData = Items[0];
      if (gameStatus === GAME_STATUS.OVER) {
        await broadcastMessage({
          gwApi,
          message: {
            type: MESSAGE_TYPES.GAME_OVER,
            message: 'Game Over',
            winner: currentUserData,
          },
        });
      }
    } catch (err) {
      statusCode = 400;
      body = 'Error in updating move';
    }
    return {
      statusCode,
      body,
    };
  }
  if (routeKey === ACTION_TYPES.SEND_MESSAGE || routeKey === '$default') {
    try {
      const { message = '', userName = '' } = JSON.parse(event.body);
      await broadcastMessage({
        gwApi,
        message: {
          type: MESSAGE_TYPES.NEW_CHAT_MESSAGE,
          message,
          userName,
        },
      });
    } catch (error) {
      console.log(error);
      return { statusCode: 500 };
    }
    return { statusCode: 200 };
  }
};
