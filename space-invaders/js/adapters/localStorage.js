/**
 * LocalStorageAdapter — implements RepositoryPort.
 * Keys and value formats are the si_* keys listed in AGENTS.md.
 */
const LocalStorageAdapter = {
    readStorage(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    },

    writeStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            // Storage can be unavailable in private browsing contexts.
        }
    },

    getHighScores() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return HighScoreRules.normalize(data ? JSON.parse(data) : []);
        } catch (e) {
            return [];
        }
    },

    getBestScore() {
        const highScores = this.getHighScores();
        return highScores.length > 0 ? highScores[0].score : 0;
    },

    saveHighScore(sc) {
        const highScores = this.getHighScores();
        const now = new Date();
        const nameInput = document.getElementById('player-name');
        const playerName = HighScoreRules.sanitizePlayerName(
            nameInput ? nameInput.value : this.getSavedName()
        );
        const entry = {
            score: sc,
            name: playerName,
            date: now.toLocaleDateString('es-ES'),
        };
        highScores.push(entry);
        highScores.sort((a, b) => b.score - a.score);
        const top5 = highScores.slice(0, 5);
        this.writeStorage(STORAGE_KEY, JSON.stringify(top5));
    },

    getSavedName() {
        return HighScoreRules.sanitizePlayerName(this.readStorage(PLAYER_NAME_STORAGE, ''));
    },

    savePlayerName(name) {
        this.writeStorage(PLAYER_NAME_STORAGE, name);
    },

    getSavedDifficulty() {
        const saved = this.readStorage(DIFFICULTY_STORAGE, 'normal');
        return DIFFICULTY_PRESETS[saved] ? saved : 'normal';
    },

    saveDifficulty(diff) {
        if (DIFFICULTY_PRESETS[diff]) this.writeStorage(DIFFICULTY_STORAGE, diff);
    },

    getSavedAudioVolume() {
        const saved = Number.parseFloat(this.readStorage(AUDIO_VOLUME_STORAGE, '0.7'));
        return Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 0.7;
    },

    getSavedBgmVolume() {
        const saved = Number.parseFloat(this.readStorage(BGM_VOLUME_STORAGE, '0.1'));
        return Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 0.1;
    },

    getSavedBgmMuted() {
        return this.readStorage(BGM_MUTED_STORAGE, 'false') === 'true';
    },

    saveAudioVolume(vol) {
        this.writeStorage(AUDIO_VOLUME_STORAGE, String(Math.max(0, Math.min(1, vol))));
    },

    saveBgmVolume(vol) {
        this.writeStorage(BGM_VOLUME_STORAGE, String(Math.max(0, Math.min(1, vol))));
    },
};
