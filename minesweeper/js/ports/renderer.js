/**
 * RendererPort — drawing interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/canvas.js.
 */
const RendererPort = {
    /** Begin a new draw frame (clear canvas). */
    beginFrame() {},
    /** Draw a single cell. @param {object} cell @param {number} r @param {number} c */
    drawCell(cell, r, c) {},
    /** Draw the HUD (mines remaining, timer, difficulty). @param {Game} game */
    drawHud(game) {},
    /** Draw the timer. @param {number} seconds */
    drawTimer(seconds) {},
    /** Show/hide overlay. @param {'none'|'pause'|'won'|'lost'} type */
    showOverlay(type) {},
    /** Render the high scores table. @param {Array} scores */
    renderHighScores(scores) {},
    /** Show a "new high score" notice. */
    showNewHighScoreNotice() {},
};
