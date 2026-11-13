/**
 * ClockPort — frame-loop interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/frame.js.
 */
const ClockPort = {
    /** Start the loop; cb is called with the rAF timestamp on every frame. @param {function} cb */
    start(cb) {},
    /** Stop the loop. */
    stop() {},
    /** @returns {number} current time in ms. */
    now() {},
};
