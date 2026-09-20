/**
 * SoundPort — audio interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/sound.js.
 */
const SoundPort = {
    /** Play a reveal sound. */
    playReveal() {},
    /** Play a flag sound. */
    playFlag() {},
    /** Play an explosion sound. */
    playExplosion() {},
    /** Play a win sound. */
    playWin() {},
    /** Play a game over sound. */
    playGameOver() {},
    /** Play a UI click sound. */
    playClick() {},
    /** Play a new high score sound. */
    playNewHighScore() {},
    /** Ensure the audio context is running (user gesture). */
    ensureAudio() {},
    /** Start the background music. */
    startBgm() {},
    /** Stop the background music. */
    stopBgm() {},
    /** Pause the background music. */
    pauseBgm() {},
    /** Resume the background music. */
    resumeBgm() {},
};
