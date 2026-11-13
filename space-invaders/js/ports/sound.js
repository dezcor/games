/**
 * SoundPort — sound effects and background music.
 * Implemented by the sound port object in js/game.js over adapters/sound.js.
 */
const SoundPort = {
    playShoot() {},
    playBulletClash() {},
    playExplosion() {},
    playAlienMove() {},
    /** @param {string} alienType 'TYPE_1' | 'TYPE_2' | 'TYPE_3' */
    playAlienShoot(alienType) {},
    playUFO() {},
    playGameOver() {},
    playNewHighScore() {},
    startBgm() {},
    pauseBgm() {},
    resumeBgm() {},
    /** @param {number} duration seconds */
    fadeOutBgm(duration) {},
};
