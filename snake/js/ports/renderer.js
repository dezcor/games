/**
 * RendererPort — drawing interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/canvas.js.
 */
const RendererPort = {
    /** Begin a new draw frame (clear canvas). */
    beginFrame() {},
    /** Draw the game frame. @param {object} state @param {number} state.snake @param {object} state.food @param {number} state.score */
    drawFrame(state) {},
    /** Show the game over overlay. @param {number} score */
    showGameOver(score) {},
    /** Hide the game over overlay. */
    hideOverlay() {},
};
