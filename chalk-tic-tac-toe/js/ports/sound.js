/**
 * SoundPort — audio interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/sound.js.
 */
const SoundPort = {
  /** Enable or silence all effects. @param {boolean} on */
  setEnabled(on) {},
  /** Mark placed. @param {"X"|"O"} who */
  place(who) {},
  /** The player wins. */
  win() {},
  /** The cat wins. */
  lose() {},
  /** Draw. */
  tie() {},
  /** UI click. */
  ui() {},
};
