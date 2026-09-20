/**
 * LocalStorageAdapter — implements RepositoryPort.
 */

function readStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        // Storage can be unavailable in private browsing contexts.
    }
}

function normalizeHighScores(value) {
    if (!Array.isArray(value)) return [];
    return value
        .filter((entry) => entry && Number.isFinite(Number(entry.score)))
        .map((entry) => ({
            score: Math.max(0, Math.floor(Number(entry.score))),
            name: String(entry.name || 'Player').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12) || 'Player',
            date: typeof entry.date === 'string' ? entry.date.slice(0, 40) : '',
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

const LocalStorageAdapter = {
    loadHighScores() {
        try {
            return normalizeHighScores(JSON.parse(readStorage(STORAGE_KEY, '[]')));
        } catch (error) {
            return [];
        }
    },

    saveHighScores(scores) {
        writeStorage(STORAGE_KEY, JSON.stringify(scores));
    },

    loadPlayerName() {
        return readStorage(PLAYER_NAME_STORAGE, 'Player');
    },

    savePlayerName(name) {
        writeStorage(PLAYER_NAME_STORAGE, name);
    },

    loadDifficulty() {
        const saved = readStorage(DIFFICULTY_STORAGE);
        if (saved && DIFFICULTY_PRESETS[saved]) return saved;
        return null;
    },

    saveDifficulty(difficulty) {
        writeStorage(DIFFICULTY_STORAGE, difficulty);
    },

    loadAudioPrefs() {
        return {
            sfxVolume: Number.parseFloat(readStorage(AUDIO_VOLUME_STORAGE, '0.7')) || 0.7,
            bgmVolume: Number.parseFloat(readStorage(BGM_VOLUME_STORAGE, '0.1')) || 0.1,
            sfxMuted: readStorage(SFX_MUTED_STORAGE, 'false') === 'true',
            bgmMuted: readStorage(BGM_MUTED_STORAGE, 'false') === 'true',
        };
    },

    saveAudioPrefs(prefs) {
        writeStorage(AUDIO_VOLUME_STORAGE, String(prefs.sfxVolume));
        writeStorage(BGM_VOLUME_STORAGE, String(prefs.bgmVolume));
        writeStorage(SFX_MUTED_STORAGE, String(prefs.sfxMuted));
        writeStorage(BGM_MUTED_STORAGE, String(prefs.bgmMuted));
    },
};
