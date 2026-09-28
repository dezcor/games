/**
 * SoundPort — audio interface.
 * The domain expects an object implementing these methods.
 * Implemented by adapters/sound.js.
 */
const SoundPort = {
    /** Play the eat sound. */
    playEat() {},
    /** Play the game over sound. */
    playGameOver() {},
    /** Play the move sound. */
    playMove() {},
    /** Play the new high score sound. */
    playNewHighScore() {},
    /** Start the background music. */
    startBgm() {},
    /** Pause the background music. */
    pauseBgm() {},
    /** Resume the background music. */
    resumeBgm() {},
    /** Ensure the audio context is running (user gesture). */
    ensureAudio() {},
};
