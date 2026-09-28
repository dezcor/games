/**
 * LocalStorageAdapter — implements RepositoryPort.
 * Handles persistence for Snake game.
 */

const STORAGE_KEY = 'snakeHighScore';
const AUDIO_VOLUME_KEY = 'snake_audio_volume';
const AUDIO_MUTED_KEY = 'snake_sfx_muted';

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

function getStoredNumber(key, fallback) {
    try {
        const value = Number.parseFloat(localStorage.getItem(key));
        return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
    } catch (error) {
        return fallback;
    }
}

function getStoredBoolean(key) {
    try {
        return localStorage.getItem(key) === 'true';
    } catch (error) {
        return false;
    }
}

const LocalStorageAdapter = {
    loadHighScore() {
        return parseInt(readStorage(STORAGE_KEY)) || 0;
    },

    saveHighScore(score) {
        writeStorage(STORAGE_KEY, String(score));
    },

    loadAudioPrefs() {
        return {
            sfxVolume: getStoredNumber(AUDIO_VOLUME_KEY, 0.7),
            sfxMuted: getStoredBoolean(AUDIO_MUTED_KEY),
        };
    },

    saveAudioPrefs(prefs) {
        writeStorage(AUDIO_VOLUME_KEY, String(prefs.sfxVolume));
        writeStorage(AUDIO_MUTED_KEY, String(prefs.sfxMuted));
    },
};
