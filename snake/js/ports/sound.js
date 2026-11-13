/**
 * SoundPort — audio interface.
 * The domain expects an object implementing these methods.
 * Implemented in the composition root (js/game.js) over adapters/sound.js.
 */
const SoundPort = {
    /** Play the direction-change blip. */
    playMove() {},
    /** Play the eat-food sound. */
    playEat() {},
    /** Play the game-over sweep. */
    playGameOver() {},
    /** Play the new-high-score fanfare. */
    playNewHighScore() {},
    /** Start the background music (no-op when already playing). */
    startBgm() {},
};
