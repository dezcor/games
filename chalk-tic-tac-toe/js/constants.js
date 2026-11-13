/**
 * El Gato constants.
 */

// Winning lines on the 3×3 board (cell indices, row by row).
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// ── Difficulty ──
const DIFFICULTIES = ["easy", "normal", "hard"];
const DEFAULT_DIFFICULTY = "easy";

// ── Cat timing: it "thinks" for AI_DELAY_MIN + random * AI_DELAY_JITTER ms ──
const AI_DELAY_MIN = 520;
const AI_DELAY_JITTER = 480;

// ── Persistence: same key and shape as before, { diff, score, round, soundOn } ──
const GATO_STORAGE_KEY = "gatoState";
