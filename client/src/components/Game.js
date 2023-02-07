import React, { useEffect, useState } from "react";
import Board from "./Board";
import { ACTION_TYPES, SIDE_MAP, ROLES, GAME_STATUS } from '../constants';

const Game = (props) => {
  const { game, userId, role } = props;
  const [isTurn, setIsTurn] = useState(props.userId === props.game.nextTurn);
  const userSide = props.game.players[props.userId];

  useEffect(() => {
    const { userId, game } = props;
    setIsTurn(userId === game.nextTurn);
  }, [props]);

  const handleClick = (row, col) => {
    const { board } = props.game;
    if (board[row][col] !== -1 || board[row][col] === !userSide) {
      return;
    }
    props.sendMessage({
      action: ACTION_TYPES.NEW_MOVE,
      data: {
        row,
        col,
        sign: userSide,
      },
    });
  };

  const showTurnMsg = game && game.gameStatus && game.gameStatus === GAME_STATUS.IN_PROGRESS && role === ROLES.PLAYER;

  return (
    <>
      <h3>You are&nbsp;
        {role === ROLES.SPECTATOR ? 'Spectating' : (
          <span className={`${SIDE_MAP[userSide]}`}>{SIDE_MAP[userSide]}</span>
        )}
      </h3>
      {showTurnMsg ? (
        <h3>{userId === game.nextTurn ? "It's your turn" : "Wait for your turn"}</h3>)
        : ''
      }
      <Board squares={game.board} userSide={userSide} isDisabled={!isTurn} handleClick={handleClick} />
    </>
  );
};

export default Game;
