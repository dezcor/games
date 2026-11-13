/**
 * LocalStorageAdapter — implements RepositoryPort.
 * Keys and value formats are the ones documented in AGENTS.md.
 */
const LocalStorageAdapter = {
    HIGHSCORES_KEY: 'arkanoid_highscores',
    NAME_KEY: 'arkanoid_player_name',

    loadHighScores() {
        try {
            const data = localStorage.getItem(this.HIGHSCORES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    saveHighScore(entry) {
        const highScores = this.loadHighScores();
        const now = new Date();
        highScores.push({
            score: entry.score,
            name: entry.name,
            date: now.toLocaleDateString('en-US'),
        });
        highScores.sort((a, b) => b.score - a.score);
        const top5 = highScores.slice(0, 5);
        localStorage.setItem(this.HIGHSCORES_KEY, JSON.stringify(top5));
    },

    loadName() {
        return localStorage.getItem(this.NAME_KEY) || '';
    },

    saveName(name) {
        localStorage.setItem(this.NAME_KEY, name);
    },
};
