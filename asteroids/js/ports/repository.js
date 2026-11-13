/**
 * RepositoryPort: persisted game data. Storage keys and formats live in the adapter.
 * Implemented by adapters/repository.js (LocalStorageRepository).
 * Load methods return raw values or null; the domain sanitizes and validates them.
 */
const RepositoryPort = {
    /** @returns {Array<{score:number,name:string,date:string}>} top entries, normalized */
    loadHighScores() { return []; },
    /** @param {Array<{score:number,name:string,date:string}>} list */
    saveHighScores(list) {},
    /** @returns {string|null} */
    loadPlayerName() { return null; },
    savePlayerName(name) {},
    /** @returns {string|null} */
    loadDifficulty() { return null; },
    saveDifficulty(key) {},
    /** @returns {string|null} */
    loadShipSkin() { return null; },
    saveShipSkin(id) {},
    /** @returns {Object} achievement map { id: { unlocked, date } } */
    loadAchievements() { return {}; },
    saveAchievements(map) {},
    isTutorialDismissed() { return false; },
    dismissTutorial() {},
};
