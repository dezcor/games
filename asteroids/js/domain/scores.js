/**
 * Score and player-name rules. Pure: no DOM, storage, or time.
 */
const ScoreRules = {
    DEFAULT_NAME: 'Player',
    MAX_ENTRIES: 5,

    sanitizePlayerName(value) {
        if (typeof value !== 'string') return ScoreRules.DEFAULT_NAME;
        const name = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
        return name || ScoreRules.DEFAULT_NAME;
    },

    normalizeHighScores(value) {
        if (!Array.isArray(value)) return [];

        return value
            .filter((entry) => entry && Number.isFinite(Number(entry.score)))
            .map((entry) => ({
                score: Math.max(0, Math.floor(Number(entry.score))),
                name: ScoreRules.sanitizePlayerName(entry.name),
                date: typeof entry.date === 'string' ? entry.date.slice(0, 40) : '',
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, ScoreRules.MAX_ENTRIES);
    },

    // A finished run makes the table when it scores and the table has room or it beats the last entry.
    qualifies(highScores, score) {
        return score > 0 && (
            highScores.length < ScoreRules.MAX_ENTRIES ||
            score >= highScores[highScores.length - 1].score
        );
    },

    addEntry(highScores, score, name, dateLabel) {
        return ScoreRules.normalizeHighScores([...highScores, {
            score,
            name: ScoreRules.sanitizePlayerName(name),
            date: dateLabel,
        }]);
    },

    // Easter egg: a few aliases always get gold, otherwise medals by score.
    medalClass(name, score) {
        const nameLower = ScoreRules.sanitizePlayerName(name).toLowerCase().replace(/\s/g, '');
        if (nameLower === 'jsnow' || nameLower === 'jsnof' || nameLower === 'jonsnow' || nameLower === 'jon') {
            return 'hs-gold';
        }
        if (score >= 50000) return 'hs-gold';
        if (score >= 20000) return 'hs-silver';
        if (score >= 5000) return 'hs-bronze';
        return 'hs-none';
    },
};
