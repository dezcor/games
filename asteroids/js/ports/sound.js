/**
 * SoundPort: every audio cue and music command the domain may request.
 * Implemented in game.js over adapters/sound.js (SoundManager and MusicPlayer).
 */
const SoundPort = {
    playShoot() {},
    playThrust() {},
    playExplosion() {},
    playPlayerHit() {},
    playUFO() {},
    playUfoShoot() {},
    playUfoExplode() {},
    playGameOver() {},
    playNewHighScore() {},
    playLevelUp() {},
    playPowerupSpawn() {},
    playPowerupPickup() {},
    playHyperspace() {},
    playHyperspaceFail() {},
    /** Background music. */
    startMusic() {},
    stopMusic() {},
    pauseMusic() {},
    resumeMusic() {},
    /** @param {number} level 0 calm, 1 normal, 2 panic */
    setMusicIntensity(level) {},
    /** @param {boolean} active UFO siren layer on or off */
    setUfoMusicActive(active) {},
};
