/**
 * ClockPort — frame-loop interface.
 * The domain does not read time; the composition root drives it.
 * Implemented by adapters/frame.js.
 */
const ClockPort = {
    /** Start the loop; cb is called on every frame. @param {function} cb */
    start(cb) {},
    /** Stop the loop. */
    stop() {},
    /** @returns {number} current time in ms. */
    now() { return 0; },
};
