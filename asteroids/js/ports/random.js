/**
 * RandomPort: the only source of randomness in the domain.
 * Implemented in game.js as { next: () => Math.random() }; tests inject a seeded generator.
 */
const RandomPort = {
    /** Uniform float in [0, 1). */
    next() { return 0; },
};
