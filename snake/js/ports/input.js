/**
 * InputPort — user interaction interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/keyboard.js and adapters/touch.js.
 */
const InputPort = {
    /** @param {number} dx @param {number} dy */
    onDirectionChange(dx, dy) {},
    /** Restart the game. */
    onRestart() {},
};
