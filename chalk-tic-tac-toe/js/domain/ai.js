/**
 * Cat opponent — pure move selection: no DOM, no storage, no audio.
 *   easy   — random empty cell
 *   normal — wins if it can, blocks the player's winning cell, else the first free cell in AI_MOVE_ORDER
 *   hard   — minimax over the remaining cells: the cat never loses
 */

// Preference order: centre, corners, edges. Also the tie-break for equal scores.
const AI_MOVE_ORDER = [4, 0, 2, 6, 8, 1, 3, 5, 7];

const AI = {
  /** @returns {number} index of the cell the cat (O) plays. */
  chooseMove(cells, difficulty) {
    if (difficulty === "easy") return this.randomMove(cells);
    if (difficulty === "normal") return this.smartMove(cells);
    return this.bestMove(cells);
  },

  randomMove(cells) {
    const empty = Board.emptyCells(cells);
    return empty[Math.floor(Math.random() * empty.length)];
  },

  smartMove(cells) {
    const empty = Board.emptyCells(cells);
    for (const index of empty) {
      const trial = cells.slice();
      trial[index] = "O";
      if (Board.findWin(trial, "O")) return index;
    }
    for (const index of empty) {
      const trial = cells.slice();
      trial[index] = "X";
      if (Board.findWin(trial, "X")) return index;
    }
    return AI_MOVE_ORDER.find((index) => empty.includes(index));
  },

  bestMove(cells) {
    const work = cells.slice();
    let bestScore = -Infinity;
    let best = null;
    for (const index of AI_MOVE_ORDER) {
      if (work[index] !== null) continue;
      work[index] = "O";
      const score = this.minimax(work, "X", 1, -Infinity, Infinity);
      work[index] = null;
      // Strict comparison: among equal scores the earlier (preferred) cell wins.
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    }
    return best;
  },

  /**
   * Minimax with alpha-beta pruning, scored from O's point of view:
   * O wins = 10 - depth (faster wins first), X wins = depth - 10, draw = 0.
   * `cells` is used as scratch space and restored before returning.
   */
  minimax(cells, turn, depth, alpha, beta) {
    if (Board.findWin(cells, "O")) return 10 - depth;
    if (Board.findWin(cells, "X")) return depth - 10;
    const empty = Board.emptyCells(cells);
    if (empty.length === 0) return 0;

    if (turn === "O") {
      let best = -Infinity;
      for (const index of empty) {
        cells[index] = "O";
        best = Math.max(best, this.minimax(cells, "X", depth + 1, alpha, beta));
        cells[index] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }

    let best = Infinity;
    for (const index of empty) {
      cells[index] = "X";
      best = Math.min(best, this.minimax(cells, "O", depth + 1, alpha, beta));
      cells[index] = null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  },
};
