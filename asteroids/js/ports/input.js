/**
 * InputPort: held-state queries for the ship controls.
 * Codes: 'ArrowLeft', 'ArrowRight', 'ArrowUp' (thrust), 'Space' (fire).
 * Implemented in game.js by merging adapters/keyboard.js and adapters/touch.js.
 */
const InputPort = {
    /** @returns {boolean} true while the control is held. */
    isActive(code) { return false; },
};
