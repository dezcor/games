/**
 * LocalStorageAdapter — implements RepositoryPort.
 * Keys and value formats match AGENTS.md (tetris_highscores, tetris_player_name).
 */
const LocalStorageAdapter = {
    loadHighScores() {
        try {
            const data = localStorage.getItem('tetris_highscores');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    saveHighScores(entries) {
        localStorage.setItem('tetris_highscores', JSON.stringify(entries));
    },

    loadPlayerName() {
        return localStorage.getItem('tetris_player_name') || '';
    },

    savePlayerName(name) {
        localStorage.setItem('tetris_player_name', name);
    },
};
