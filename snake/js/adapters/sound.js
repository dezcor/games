/**
 * SoundAdapter — implements SoundPort.
 * Wraps the existing SoundManager and MusicPlayer to implement the SoundPort interface.
 */
const SoundAdapter = {
    playEat() {
        SoundManager.playEat();
    },

    playGameOver() {
        SoundManager.playGameOver();
    },

    playMove() {
        SoundManager.playMove();
    },

    playNewHighScore() {
        SoundManager.playNewHighScore();
    },

    startBgm() {
        SoundManager.startBgm();
    },

    pauseBgm() {
        SoundManager.pauseBgm();
    },

    resumeBgm() {
        SoundManager.resumeBgm();
    },

    ensureAudio() {
        SoundManager.ensureAudio();
    },
};
