import React from "react";

const sideMap = {
  0: 'O',
  1: 'X',
};

const Board = ({ squares, handleClick, isDisabled, userSide }) => (
  <div className="board">
    {squares.map((squareCols, row) => (
      squareCols.map((cell, col) => (
        <button
          disabled={isDisabled || (cell !== -1 && cell !== userSide)}
          key={`${row}${col}`}
          className={`squares ${sideMap[cell]}`}
          onClick={() => handleClick(row, col)}
        >
          {sideMap[cell]}
        </button>
      ))
    ))}
  </div>
);

export default Board;