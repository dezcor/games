/**
 * HudPort — DOM output interface (HUD text, overlay, high-score table, name field, alerts).
 * The domain expects an object implementing these methods.
 * Implemented by adapters/dom.js.
 */
const HudPort = {
    /** @param {{score:number, level:number, lives:number}} hud */
    updateHud(hud) {},
    /** @param {number} best best score shown in the top bar */
    setBest(best) {},
    /** Show or hide the overlay (display flex/none). @param {boolean} visible */
    setOverlayVisible(visible) {},
    /** @param {string} text */
    setOverlayTitle(text) {},
    /** Show or hide the START button inside the overlay. @param {boolean} visible */
    setStartButtonVisible(visible) {},
    /** @param {{score:number, name:string, date:string}[]} entries */
    showHighScores(entries) {},
    hideHighScores() {},
    /** @param {string} name fills the player name field */
    setPlayerName(name) {},
    alertGameOver() {},
};
