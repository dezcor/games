/**
 * ClockPort — frame loop and date source.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/clock.js.
 */
const ClockPort = {
    /** Calls cb once per frame for the lifetime of the page. @param {function} cb */
    start(cb) {},
    /** @returns {string} locale date label stored with high scores */
    today() {},
};
