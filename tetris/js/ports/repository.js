/**
 * RepositoryPort — persistence interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/localStorage.js.
 */
const RepositoryPort = {
    /** @returns {Array<{score: number, name: string, date: string}>} stored top list ([] when none) */
    loadHighScores() {},
    /** @param {Array<{score: number, name: string, date: string}>} entries */
    saveHighScores(entries) {},
    /** @returns {string} saved player name ('' when none) */
    loadPlayerName() {},
    /** @param {string} name */
    savePlayerName(name) {},
};
