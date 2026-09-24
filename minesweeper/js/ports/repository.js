/**
 * RepositoryPort — persistence interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/localStorage.js.
 */
const RepositoryPort = {
    /** @returns {Array<{score:number,name:string,date:string}>} top 5 */
    loadHighScores() {},
    /** @param {Array} scores */
    saveHighScores(scores) {},
    /** @returns {string} */
    loadPlayerName() {},
    /** @param {string} name */
    savePlayerName(name) {},
    /** @returns {string|null} difficulty id */
    loadDifficulty() {},
    /** @param {string} difficulty */
    saveDifficulty(difficulty) {},
    /** @returns {{sfxVolume:number,bgmVolume:number,sfxMuted:boolean,bgmMuted:boolean}} */
    loadAudioPrefs() {},
    /** @param {object} prefs */
    saveAudioPrefs(prefs) {},
};
