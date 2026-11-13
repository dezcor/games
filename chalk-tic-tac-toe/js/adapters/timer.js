/**
 * TimerAdapter — implements TimerPort.
 * A single pending call: scheduling again replaces the previous one.
 */
const TimerAdapter = {
  handle: null,

  schedule(callback, ms) {
    this.cancel();
    this.handle = setTimeout(() => {
      this.handle = null;
      callback();
    }, ms);
  },

  cancel() {
    if (this.handle !== null) {
      clearTimeout(this.handle);
      this.handle = null;
    }
  },
};
