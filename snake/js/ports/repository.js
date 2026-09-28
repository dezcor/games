/**
 * RepositoryPort — persistence interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/localStorage.js.
 */
const RepositoryPort = {
    /** @returns {number} high score */
    loadHighScore() {},
    /** @param {number} score */
    saveHighScore(score) {},
    /** @returns {{sfxVolume:number,sfxMuted:boolean}} */
    loadAudioPrefs() {},
    /** @param {object} prefs */
    saveAudioPrefs(prefs) {},
};
