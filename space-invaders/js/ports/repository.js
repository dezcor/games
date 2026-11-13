/**
 * RepositoryPort — persistence of scores, player name, difficulty and audio prefs.
 * Implemented by adapters/localStorage.js.
 */
const RepositoryPort = {
    /** @returns {Array<{score:number, name:string, date:string}>} top 5, sorted. */
    getHighScores() {},
    /** @returns {number} best score, 0 when none. */
    getBestScore() {},
    /** Records a score in the top 5 (name is read from the player name field). */
    saveHighScore(score) {},
    getSavedName() {},
    savePlayerName(name) {},
    getSavedDifficulty() {},
    saveDifficulty(difficulty) {},
    getSavedAudioVolume() {},
    getSavedBgmVolume() {},
    getSavedBgmMuted() {},
    saveAudioVolume(volume) {},
    saveBgmVolume(volume) {},
};
