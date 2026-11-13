/**
 * RandomPort — randomness source.
 * The domain expects an object implementing this method.
 * Implemented by adapters/clock.js.
 */
const RandomPort = {
    /** @returns {number} value in [0, 1) */
    next() {},
};
