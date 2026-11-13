/**
 * HudPort — DOM HUD, overlays, banners and the high score table.
 * Implemented by adapters/hud.js.
 */
const HudPort = {
    /** @param {{score:number, lives:number, comboCount:number}} state */
    updateHud(state) {},
    /** @param {number} best top score */
    setBest(best) {},
    /** @param {{label:string, paused:boolean}} control */
    setPauseControl(control) {},
    /** @param {{visible:boolean, title:string}} overlay */
    setOverlay(overlay) {},
    showStartButton() {},
    hideStartButton() {},
    /** @param {{score:number, level:number}} stats */
    showGameOver(stats) {},
    hideGameOverView() {},
    /** @param {Array<{score:number, name:string, date:string}>} entries */
    renderHighScores(entries) {},
    hideHighScores() {},
    showNewHighScore() {},
    /** @param {string} text @param {string} color */
    showLevelBanner(text, color) {},
    /** @param {string} text @param {string} color */
    showScoreFeedback(text, color) {},
    flashScore() {},
    /** Replays a CSS animation class on the board wrapper. @param {string} className */
    restartBoardAnimation(className) {},
};
