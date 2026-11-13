/**
 * Line-clear scoring and level progression.
 * Pure domain: no DOM, storage, audio or time.
 */

const Scoring = {
    /** Points for clearing `lines` rows at `level`; back-to-back tetrises get a bonus. */
    linePoints(lines, level, backToBack) {
        const base = LINE_SCORES[lines] || lines * 100;
        const multiplier = backToBack ? BACK_TO_BACK_MULTIPLIER : 1;
        return Math.round(base * level * multiplier);
    },

    /** Level is 1 + one level per 10 cleared lines. */
    levelFor(linesCleared) {
        return Math.floor(linesCleared / 10) + 1;
    },
};
