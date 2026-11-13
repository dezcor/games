/**
 * RendererPort — drawing interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/canvas.js.
 */
const RendererPort = {
    /** Draw one frame of the board. @param {SnakeGame} game */
    drawFrame(game) {},
    /** Update the score display. @param {number} score */
    updateScore(score) {},
    /** Update the BEST display. @param {number} highScore */
    updateHighScore(highScore) {},
    /** Show the game-over overlay with the final score. @param {number} score */
    showGameOver(score) {},
    /** Hide the game-over overlay. */
    hideGameOver() {},
};
