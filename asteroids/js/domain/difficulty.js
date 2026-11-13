/**
 * Difficulty presets resolved into a full game config. Pure.
 */
const Difficulty = {
    isValid(key) {
        return typeof key === 'string' && Object.prototype.hasOwnProperty.call(DIFFICULTY_PRESETS, key);
    },

    configFor(key) {
        const preset = DIFFICULTY_PRESETS[key] || DIFFICULTY_PRESETS.normal;
        return { ...GAME_CONFIG, ...preset };
    },
};
