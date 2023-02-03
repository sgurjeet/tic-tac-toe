import React, { useEffect, useRef, useState } from "react";
import { GAME_STATUS, ROLES, MESSAGE_TYPES, ACTION_TYPES } from './constants';
import Game from "./components/Game";
import Chat from "./components/Chat";

const { REACT_APP_WEBSOCKET_URL } = process.env;

const App = () => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [role, setRole] = useState('');
  const [winner, setWinner] = useState(null);
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
      userName: userName === name ? 'You': userName,
      timestamp: (new Date()).toLocaleString(),
    });
    updateChatHistory(chatHistory);
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
        setUsers(users);
        break;
      case MESSAGE_TYPES.GAME_START:
        setGameData(game);
        break;
      case MESSAGE_TYPES.GAME_OVER:
        setGameData({
          ...game,
          gameStatus: GAME_STATUS.OVER,
        });
        setWinner(winner.userId);
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
      {game.gameStatus !== GAME_STATUS.IN_PROGRESS || !role ? (
        <div>
          <input
            type='text'
            placeholder='Enter your name'
            required={true}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <h2>Choose role:</h2>
          <button
            value={ROLES.PLAYER}
            disabled={!name.trim().length || users.players >= 2}
            onClick={() => {
              setRole(role);
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
            value={ROLES.SPECTATOR}
            disabled={!name.trim().length}
            onClick={() => {
              setRole(role);
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
      ) : (
        <div>
          <Game userId={id} game={game} sendMessage={sendMessage} winner={winner} />
          <Chat sendMessage={sendMessage} updateChatHistory={updateChat} chat={chat} name={name} />
        </div>
      )}
      <div>Players: {users.players}</div>
      <div>Spectators: {users.spectators}</div>
    </div>
  );
};

export default App;