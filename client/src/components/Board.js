import React from "react";
import { SIDE_MAP } from '../constants';

const Board = ({ squares, handleClick, isDisabled, userSide }) => (
    <div className="board">
    {squares.map((squareCols, row) => (
      squareCols.map((cell, col) => {
        const disabled = isDisabled || (cell !== -1 && cell !== userSide);
        return (
          <button
            disabled={disabled}
            key={`${row}${col}`}
            className={`squares ${SIDE_MAP[cell]}`}
            onClick={() => handleClick(row, col)}
            style={{ cursor: `${disabled ? 'not-allowed' : 'pointer'}` }}
          >
            {SIDE_MAP[cell]}
          </button>
        )
      })
    ))}
  </div>
);

export default Board;