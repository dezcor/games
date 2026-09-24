/**
 * InputPort — user interaction interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/keyboard.js and adapters/touch.js.
 */
const InputPort = {
    /** @param {number} r @param {number} c */
    onCellClick(r, c) {},
    /** @param {number} r @param {number} c */
    onCellFlag(r, c) {},
    /** @param {number} r @param {number} c */
    onChord(r, c) {},
    /** Restart the game. */
    onRestart() {},
    /** @param {string} difficulty */
    onSelectDifficulty(difficulty) {},
    /** Pause / resume. */
    onPause() {},
};
