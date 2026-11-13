/**
 * SoundPort — audio interface.
 * The domain expects an object implementing these methods.
 * Implemented in the composition root (js/game.js) over adapters/sound.js.
 */
const SoundPort = {
    playBounce() {},
    playPaddleHit() {},
    playBrickBreak() {},
    playSpecialBrickBreak() {},
    playPowerUp() {},
    playLoseLife() {},
    playLevelComplete() {},
    playGameOver() {},
    /** Start the background music (no-op when already playing). */
    startBgm() {},
    /** Pause the background music (scheduler stops). */
    pauseBgm() {},
    /** Resume the background music. */
    resumeBgm() {},
    /** Fade the background music out over `seconds`, then stop it. @param {number} seconds */
    fadeOutBgm(seconds) {},
};
