/**
 * High score table rules and the North easter egg name check.
 * Pure domain: no DOM, storage, audio or time.
 */

const HighScores = {
    /** Returns the new top list (sorted by score, capped) without mutating `list`. */
    insert(list, entry) {
        return list
            .concat([entry])
            .sort((a, b) => b.score - a.score)
            .slice(0, HIGH_SCORE_LIMIT);
    },

    best(list) {
        return list.length > 0 ? list[0].score : 0;
    },

    /** Case-insensitive, whitespace-insensitive match for the North theme names. */
    isNorthName(name) {
        const normalized = String(name || '').trim().toLowerCase().replace(/\s+/g, '');
        return normalized === 'jonsnow' || normalized === 'jon' || normalized === 'jsnow';
    },
};
