/**
 * BrickLevels — level layouts, brick palettes and special-brick rules.
 * Pure functions: no DOM, no storage, no audio. Randomness comes in through
 * a RandomPort (any object with next() returning a number in [0, 1)).
 */
const BrickLevels = {
    /** @returns {{rows:number, cols:number, grid:number[][], speed:number}} a fresh copy of the level layout */
    layout(level) {
        const layout = BRICK_LAYOUTS[level - 1] || BRICK_LAYOUTS[0];
        return {
            rows: layout.rows,
            cols: layout.cols,
            grid: layout.grid.map(row => [...row]),
            speed: layout.speed,
        };
    },

    /** @returns {Object<number,string>} colour per brick variant (grid value) */
    colors(level) {
        const levelColors = {
            1: { 1: '#22d3ee', 2: '#06b6d4' },
            2: { 1: '#06b6d4', 2: '#67e8f9', 3: '#22d3ee' },
            3: { 1: '#67e8f9', 2: '#22d3ee', 3: '#06b6d4', 4: '#a5f3fc' },
        };
        return levelColors[level] || levelColors[1];
    },

    /** Rolls whether a brick is special (3 hits, bonus score, drops a power-up). */
    isSpecial(level, random) {
        const chance = SPECIAL_BRICK_CHANCES[level - 1] || 0.1;
        return random.next() < chance;
    },
};
