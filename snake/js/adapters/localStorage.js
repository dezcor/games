/**
 * LocalStorageAdapter — implements RepositoryPort.
 */
const LocalStorageAdapter = {
    loadHighScore() {
        try {
            return parseInt(localStorage.getItem(SNAKE_HIGH_SCORE_KEY)) || 0;
        } catch (error) {
            return 0;
        }
    },

    saveHighScore(score) {
        try {
            localStorage.setItem(SNAKE_HIGH_SCORE_KEY, score);
        } catch (error) {
            // Storage can be unavailable in private browsing contexts.
        }
    },
};
