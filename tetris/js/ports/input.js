/**
 * InputPort — held-key state for the DAS system.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/keyboard.js (keyboard and touch both write to it).
 */
const InputPort = {
    /** @param {string} code KeyboardEvent.code, e.g. 'ArrowLeft' @returns {boolean} */
    isHeld(code) {},
    /** @param {string} code @param {boolean} value */
    setHeld(code, value) {},
};
