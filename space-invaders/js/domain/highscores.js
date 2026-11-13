/**
 * HighScoreRules — pure high score data rules (no storage access).
 */
const HighScoreRules = {
    sanitizePlayerName(value) {
        if (typeof value !== 'string') return 'Anonymous';
        const name = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
        return name || 'Anonymous';
    },

    normalize(value) {
        if (!Array.isArray(value)) return [];

        return value
            .filter((entry) => entry && Number.isFinite(Number(entry.score)))
            .map((entry) => ({
                score: Math.max(0, Math.floor(Number(entry.score))),
                name: HighScoreRules.sanitizePlayerName(entry.name),
                date: typeof entry.date === 'string' ? entry.date.slice(0, 40) : '',
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    },
};
