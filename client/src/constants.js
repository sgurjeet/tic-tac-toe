module.exports = {
  GAME_STATUS: {
    YET_TO_START: 0,
    IN_PROGRESS: 1,
    OVER: 2,
    DRAW: 3,
  },
  ROLES: {
    PLAYER: 'player',
    SPECTATOR: 'spectator',
  },
  ACTION_TYPES: {
    GET_GAME_STATUS: 'getGameStatus',
    SELECT_ROLE: 'selectRole',
    NEW_MOVE: 'newMove',
    SEND_MESSAGE: 'sendMessage',
  },
  MESSAGE_TYPES: {
    NEW_CHAT_MESSAGE: 'NEW_CHAT_MESSAGE',
    GAME_STATUS: 'GAME_STATUS',
    GAME_START: 'GAME_START',
    ROLE_SELECTED: 'ROLE_SELECTED',
    NEW_USER: 'NEW_USER',
    NEW_MOVE: 'NEW_MOVE',
  },
  SIDE_MAP: {
    0: 'O',
    1: 'X',
  },
};
