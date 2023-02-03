const { GAME_STATUS } = require('./constants');

const getUpdatedBoard = ({ game, move }) => {
  const { board } = game;
  const { row, col, sign } = move;
  board[row][col] = sign;
  return board;
};

const getGameStatus = ({ updatedBoard, move }) => {
  let h = 0, v = 0, d1 = 0, d2 = 0;
  const { row, col } = move;
  const board_size = updatedBoard.length;
  const value = updatedBoard[row][col];
  for (let i = 0; i < board_size; i++) {
    if (updatedBoard[row][i] === value) h++;
    if (updatedBoard[i][col] === value) v++;
    if (updatedBoard[i][i] === value) d1++;
    if (updatedBoard[i][board_size - i - 1] === value) d2++;
  }

  if (h === board_size || v === board_size || d1 === board_size || d2 === board_size) {
    return GAME_STATUS.OVER;
  }
  return GAME_STATUS.IN_PROGRESS;
};

module.exports = {
  getUpdatedBoard,
  getGameStatus,
};