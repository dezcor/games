/**
 * TimerPort — delayed call interface (used for the cat's move).
 * The domain expects an object implementing these methods.
 * Implemented by adapters/timer.js.
 */
const TimerPort = {
  /** Run `callback` after `ms` milliseconds, replacing any pending call. */
  schedule(callback, ms) {},
  /** Cancel the pending call, if any. */
  cancel() {},
};
