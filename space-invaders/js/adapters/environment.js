/**
 * EnvironmentAdapter — implements EnvironmentPort.
 */
const EnvironmentAdapter = {
    random() {
        return Math.random();
    },

    prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
};
