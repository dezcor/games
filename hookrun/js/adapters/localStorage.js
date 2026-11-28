/**
 * LocalStorageAdapter — implements RepositoryPort.
 * Keys and value formats are the ones documented in AGENTS.md.
 */
const LocalStorageAdapter = {
    HIGHSCORES_KEY: 'hookrun_highscores',
    NAME_KEY: 'hookrun_player_name',

    /** Values that could not be persisted; they last for this session. */
    session: {},

    read(key) {
        if (key in this.session) return this.session[key];
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },

    write(key, value) {
        try {
            localStorage.setItem(key, value);
            delete this.session[key];
        } catch (e) {
            this.session[key] = value;
        }
    },

    loadHighScores() {
        try {
            const data = this.read(this.HIGHSCORES_KEY);
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
        this.write(this.HIGHSCORES_KEY, JSON.stringify(top5));
    },

    loadName() {
        return this.read(this.NAME_KEY) || '';
    },

    saveName(name) {
        this.write(this.NAME_KEY, name);
    },
};
