/**
 * EnvironmentPort — randomness and user preferences.
 * The domain never calls Math.random or matchMedia directly.
 * Implemented by adapters/environment.js.
 */
const EnvironmentPort = {
    /** @returns {number} a random number in [0, 1). */
    random() {},
    /** @returns {boolean} true when the user asks for reduced motion. */
    prefersReducedMotion() {},
};
