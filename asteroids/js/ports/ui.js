/**
 * UiPort: DOM-facing presentation the domain asks for. The adapter diffs and renders.
 * Implemented by adapters/dom-ui.js (DomUi).
 */
const UiPort = {
    /** @param {{score:number, lives:number, level:number, best:number}} hud */
    setHud(hud) {},
    /** @param {{shield:number, double:number}} timers remaining seconds */
    setPowerupHud(timers) {},
    /** Shows or hides the overlay for the given state. */
    setOverlay(state) {},
    showLevelBanner(level) {},
    /** @param {{score:number, level:number, highScores:Array, newRecord:boolean}} info */
    showGameOver(info) {},
    /** Renders the achievements list and queues toasts for newly unlocked definitions. */
    setAchievements(map, newlyUnlocked) {},
};
