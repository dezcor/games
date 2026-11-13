/**
 * RepositoryPort — persistence interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/localStorage.js.
 */
const RepositoryPort = {
    /** @returns {number} best score (0 when none) */
    loadHighScore() {},
    /** @param {number} score */
    saveHighScore(score) {},
};
