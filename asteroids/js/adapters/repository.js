/**
 * localStorage adapter (RepositoryPort). Keys and value formats match AGENTS.md.
 * Audio preferences are handled by adapters/sound.js.
 */
const LocalStorageRepository = {
    read(key, fallback = null) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    },

    write(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            // Storage can be unavailable in private browsing contexts.
        }
    },

    loadHighScores() {
        try {
            return ScoreRules.normalizeHighScores(JSON.parse(this.read(STORAGE_KEY, '[]')));
        } catch (error) {
            return [];
        }
    },

    saveHighScores(list) {
        this.write(STORAGE_KEY, JSON.stringify(list));
    },

    loadPlayerName() {
        return this.read(PLAYER_NAME_STORAGE, null);
    },

    savePlayerName(name) {
        this.write(PLAYER_NAME_STORAGE, name);
    },

    loadDifficulty() {
        return this.read(DIFFICULTY_STORAGE, null);
    },

    saveDifficulty(key) {
        this.write(DIFFICULTY_STORAGE, key);
    },

    loadShipSkin() {
        return this.read(SHIP_SKIN_STORAGE, null);
    },

    saveShipSkin(id) {
        this.write(SHIP_SKIN_STORAGE, id);
    },

    loadAchievements() {
        try {
            const raw = JSON.parse(this.read(ACHIEVEMENTS_STORAGE, '{}'));
            return AchievementRules.normalize(raw, new Date().toISOString());
        } catch (error) {
            return {};
        }
    },

    saveAchievements(map) {
        this.write(ACHIEVEMENTS_STORAGE, JSON.stringify(map));
    },

    isTutorialDismissed() {
        return this.read(TUTORIAL_DISMISSED_STORAGE, 'false') === 'true';
    },

    dismissTutorial() {
        this.write(TUTORIAL_DISMISSED_STORAGE, 'true');
    },
};
