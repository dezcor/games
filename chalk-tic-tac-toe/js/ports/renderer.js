/**
 * RendererPort — board, status and HUD interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/dom.js.
 */
const RendererPort = {
  /** Rebuild the board for a fresh round. @param {(string|null)[]} cells */
  renderBoard(cells) {},
  /** Draw the mark of `who` ("X" | "O") on cell `index`. */
  placeMark(index, who) {},
  /** Interaction state: "play" (player may move), "lock" (cat thinking) or "end". */
  setBoardState(state) {},
  /** Cat face: "neutral" | "think" | "happy" | "sad" | "draw". */
  setMood(mood) {},
  /** Status line: "start" | "think" | "turn" | "you" | "cat" | "tie". */
  setStatus(key) {},
  /** Result markers on the board and status line; null clears them. @param {string|null} who */
  setResult(who) {},
  /** Draw the winning line and highlight its marks. @param {number[]} line */
  highlightWin(line) {},
  /** Hide the winning line. */
  clearWinLine() {},
  /** Shake the board (the cat won). */
  shakeBoard() {},
  /** Scores, round and streak. @param {{score: object, round: number, streak: number}} stats */
  renderTallies(stats) {},
  /** Highlight the active difficulty button. @param {string} difficulty */
  setDifficulty(difficulty) {},
  /** Sound toggle state. @param {boolean} on */
  setSoundButton(on) {},
};
