/**
 * Board rules — pure: no DOM, no storage, no audio.
 * A board is an array of 9 cells: null | "X" | "O".
 */
const Board = {
  create() {
    return Array(9).fill(null);
  },

  emptyCells(cells) {
    const empty = [];
    cells.forEach((value, index) => {
      if (value === null) empty.push(index);
    });
    return empty;
  },

  isFull(cells) {
    return cells.every((value) => value !== null);
  },

  /** @returns {number[] | null} the winning line for `player`, or null. */
  findWin(cells, player) {
    for (const line of LINES) {
      if (line.every((index) => cells[index] === player)) return line;
    }
    return null;
  },
};
