import React, { useEffect, useRef, useState } from "react";
import { GAME_STATUS, ROLES, MESSAGE_TYPES, ACTION_TYPES } from './constants';
import Game from "./components/Game";
import Chat from "./components/Chat";

const { REACT_APP_WEBSOCKET_URL } = process.env;

const App = () => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [role, setRole] = useState('');
  const [users, setUsers] = useState({
    players: 0,
    spectators: 0,
  });
  const [game, setGameData] = useState({
    gameStatus: GAME_STATUS.YET_TO_START,
  });
  const [chat, updateChatHistory] = useState([]);

  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(REACT_APP_WEBSOCKET_URL);
    ws.current.onopen = () => {
      console.log('Connected to server!')
      sendMessage({
        action: 'getGameStatus',
      });
    };
    ws.current.onclose = () => console.log('Disconnect!');
    const wsCurrent = ws.current;
    return () => {
      wsCurrent.close();
    };
  }, []);

  useEffect(() => {
    if (!ws.current) return;
    ws.current.onmessage = e => {
      const message = JSON.parse(e.data);
      console.log(message)
      messageHandler(message);
    };
  });

  const updateChat = ({ message, userName }) => {
    const chatHistory = [...chat];
    chatHistory.push({
      message,
      userName: userName,
      timestamp: (new Date()).toLocaleString(),
    });
    updateChatHistory(chatHistory);
  };

  const showWinnerMessage = (winner) => {
    if (game.gameStatus === GAME_STATUS.OVER) {
      if (role === ROLES.SPECTATOR) {
        alert(`Game over! ${winner.name} won.`);
      }
      else if (winner.userId === id) {
        alert('Awesome! You won.');
      } else {
        alert('Oops! You lost.');
      }
    }
    if (game.gameStatus === GAME_STATUS.DRAW) {
      alert("It's a draw!");
    }
  };

  const messageHandler = (message) => {
    let { users, game, userId, winner } = message;
    switch (message.type) {
      case MESSAGE_TYPES.ROLE_SELECTED:
        setUsers(users);
        break;
      case MESSAGE_TYPES.GAME_STATUS:
        if (!game) {
          game = {
            gameStatus: GAME_STATUS.YET_TO_START,
          }
        }
        setId(userId);
        setGameData(game);
        if (users) {
          setUsers(users);
        }
        if (winner) {
          showWinnerMessage(winner);
        }
        break;
      case MESSAGE_TYPES.GAME_START:
        setGameData(game);
        break;  
      case MESSAGE_TYPES.NEW_CHAT_MESSAGE:
        updateChat(message);
        break;
      case MESSAGE_TYPES.NEW_MOVE:
        setGameData(game);
        break;
      default:
        console.log(message.data);
    }
  };

  const sendMessage = (message) => {
    ws.current.send(JSON.stringify(message));
  };

  return (
    <div>
      <h1 className="heading">Tic Tac Toe</h1>
      {game.gameStatus !== GAME_STATUS.IN_PROGRESS || !role ? (
        <div className="row">
          <div className="col"></div>
          <div className="col">
            <input
              type='text'
              placeholder='Enter your name...'
              required={true}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control basic-margin"
            />
          </div>
          <div className="col">
            <button
              className="btn btn-primary basic-margin"
              disabled={!name.trim().length || users.players >= 2}
              onClick={() => {
                setRole(ROLES.PLAYER);
                sendMessage({
                  action: ACTION_TYPES.SELECT_ROLE,
                  data: {
                    type: ROLES.PLAYER,
                    name,
                  },
                });
              }}
            >
              {ROLES.PLAYER.toUpperCase()}
            </button>
            <button
              className="btn btn-secondary basic-margin"
              disabled={!name.trim().length}
              onClick={() => {
                setRole(ROLES.SPECTATOR);
                sendMessage({
                  action: ACTION_TYPES.SELECT_ROLE,
                  data: {
                    type: ROLES.SPECTATOR,
                    name,
                  },
                });
              }}
            >
              {ROLES.SPECTATOR.toUpperCase()}
            </button>
          </div>
          <div className="col"></div>
        </div>
      ) : (
        <div className="row">
          <div className="col">
            <Game userId={id} game={game} sendMessage={sendMessage} role={role}/>
          </div>
          <div className="col">
            <Chat sendMessage={sendMessage} updateChatHistory={updateChat} chat={chat} name={name} />
          </div>
        </div>
      )}
      {game.gameStatus !== GAME_STATUS.IN_PROGRESS ? <h4>Waiting for players to join...</h4> : ''}
      <h4><b>Joined - Players:</b> {users.players} | <b>Spectators:</b> {users.spectators}</h4>
    </div>
  );
};

export default App;