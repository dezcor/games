/**
 * Achievement rules. Pure: the caller supplies the state snapshot and the timestamp.
 */
const AchievementRules = {
    // Keeps only unlocked entries known to ACHIEVEMENTS. Missing dates fall back to fallbackIso.
    normalize(raw, fallbackIso) {
        if (!raw || typeof raw !== 'object') return {};
        const out = {};
        for (const def of ACHIEVEMENTS) {
            const entry = raw[def.id];
            if (entry && entry.unlocked) {
                out[def.id] = {
                    unlocked: true,
                    date: typeof entry.date === 'string' ? entry.date.slice(0, 40) : fallbackIso,
                };
            }
        }
        return out;
    },

    // Unlocks every rule that now passes (mutates the map) and returns the newly unlocked definitions.
    unlockNew(achievements, state, nowIso) {
        const newly = [];
        ACHIEVEMENTS.forEach((def) => {
            if (achievements[def.id]) return;
            if (!def.check(state)) return;
            achievements[def.id] = { unlocked: true, date: nowIso };
            newly.push(def);
        });
        return newly;
    },
};
