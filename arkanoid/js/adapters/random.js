/**
 * RandomAdapter — implements RandomPort over Math.random.
 */
const RandomAdapter = {
    next() {
        return Math.random();
    },
};
