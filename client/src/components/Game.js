import React, { useEffect, useState } from "react";
import Board from "./Board";
import { GAME_STATUS, ACTION_TYPES } from '../constants';

const Game = (props) => {
  const [isTurn, setIsTurn] = useState(props.userId === props.game.nextTurn);
  // const [board, updateBoard] = useState(props.game.board);
  
  const userSide = props.game.players[props.userId];

  useEffect(() => {
    setIsTurn(props.userId === props.game.nextTurn);
  }, [props.userId, props.game.nextTurn]);

  const handleClick = (row, col) => {
    const { board } = props.game;
    console.log(board, row, col)
    if (board[row][col] !== -1 || board[row][col] === !userSide) {
      return;
    }
    // const updatedBoard = [...board];
    // updatedBoard[row][col] = userSide;
    // updateBoard(updatedBoard);
    props.sendMessage({
      action: ACTION_TYPES.NEW_MOVE,
      data: {
        row,
        col,
        sign: userSide,
      },
    });
  };

  return (
    <>
      <h1>Tic Tac Toe</h1>
      <Board squares={props.game.board} userSide={userSide} isDisabled={!isTurn} handleClick={handleClick} />
      {/* <h3>{winner ? "Winner: " + winner : "Next Player: " + xO}</h3> */}
    </>
  );
};

export default Game;
