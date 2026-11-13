/**
 * RendererPort — board drawing interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/canvas.js. Called once per frame after the domain tick.
 */
const RendererPort = {
    /** Draw one frame of the board. @param {ArkanoidGame} game read-only view of the domain state */
    draw(game) {},
};
