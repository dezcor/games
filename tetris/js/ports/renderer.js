/**
 * RendererPort — presentation interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/renderer.js.
 */
const RendererPort = {
    /** Draws a frame. view = { grid, clearingRows: [{y, alpha}], ghost: {matrix, pos}, piece: {matrix, pos, rotation: {from, progress} | null}, next } */
    draw(view) {},
    /** @param {number} score @param {number} level */
    updateHud(score, level) {},
    /** @param {number} value best score shown in the top bar */
    setBestScore(value) {},
    /** @param {string} label @param {number} points */
    showComboBanner(label, points) {},
    /** Shows a short-lived "new high score" notice with the given text. */
    showNewHighScore(text) {},
    /** @param {boolean} visible */
    setOverlayVisible(visible) {},
    /** @param {string} text */
    setOverlayTitle(text) {},
    /** @param {boolean} visible */
    setStartButtonVisible(visible) {},
    /** Renders the high score table (stays hidden when the list is empty). @param {Array} entries */
    setHighScores(entries) {},
    /** Hides the high score table. */
    hideHighScores() {},
    /** @param {boolean} on toggles the North theme class */
    setNorthTheme(on) {},
    /** @returns {string} current value of the player name field */
    getPlayerName() {},
    /** @param {string} name */
    setPlayerName(name) {},
    /** Blocking game-over notice. */
    alertGameOver() {},
};
