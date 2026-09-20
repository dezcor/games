/**
 * ClockPort — timer interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/timer.js.
 */
const ClockPort = {
    /** Start the timer. @param {function} cb called with elapsed seconds. */
    start(cb) {},
    /** Stop the timer. */
    stop() {},
    /** Reset the timer to zero. */
    reset() {},
    /** @returns {number} elapsed seconds. */
    now() {},
};
