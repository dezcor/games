/**
 * RepositoryPort — persistence interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/localStorage.js.
 */
const RepositoryPort = {
    /** @returns {{score:number, name:string, date:string}[]} top scores, best first (empty when none) */
    loadHighScores() { return []; },
    /** Records a finished game. The adapter stamps the date and keeps the top 5. @param {{score:number, name:string}} entry */
    saveHighScore(entry) {},
    /** @returns {string} the saved player name ('' when none) */
    loadName() { return ''; },
    /** @param {string} name */
    saveName(name) {},
};
