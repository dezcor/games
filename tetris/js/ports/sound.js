/**
 * SoundPort — audio interface.
 * The domain expects an object implementing these methods.
 * Implemented in the composition root (js/game.js) over adapters/sound.js.
 */
const SoundPort = {
    playMove() {},
    playRotate() {},
    /** @param {number} lines 1-4 */
    playLineClear(lines) {},
    playHardDrop() {},
    playGameOver() {},
    /** Starts the background music (no-op when already playing). */
    startBgm() {},
    pauseBgm() {},
    resumeBgm() {},
    /** @param {number} seconds */
    fadeOutBgm(seconds) {},
};
