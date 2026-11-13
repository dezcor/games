/**
 * RandomPort — randomness interface. Injected so the domain stays deterministic under test.
 * Implemented by adapters/random.js.
 */
const RandomPort = {
    /** @returns {number} a number in [0, 1) */
    next() { return 0; },
};
