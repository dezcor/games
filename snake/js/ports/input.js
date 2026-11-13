/**
 * InputPort — user interaction interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/keyboard.js and adapters/touch.js.
 */
const InputPort = {
    /** Change the snake's direction (reversals are ignored). @param {number} dx @param {number} dy */
    onDirection(dx, dy) {},
    /** Restart the game. */
    onRestart() {},
};
