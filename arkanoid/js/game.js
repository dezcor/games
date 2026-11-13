/**
 * Composition root — builds the domain, wires every port to its adapter and starts the loop.
 */

// ── Sound port over the SoundManager / MusicPlayer adapter ──
const soundPort = {
    playBounce: () => SoundManager.playBounce(),
    playPaddleHit: () => SoundManager.playPaddleHit(),
    playBrickBreak: () => SoundManager.playBrickBreak(),
    playSpecialBrickBreak: () => SoundManager.playSpecialBrickBreak(),
    playPowerUp: () => SoundManager.playPowerUp(),
    playLoseLife: () => SoundManager.playLoseLife(),
    playLevelComplete: () => SoundManager.playLevelComplete(),
    playGameOver: () => SoundManager.playGameOver(),
    startBgm: () => SoundManager.startBgm(),
    pauseBgm: () => MusicPlayer.pause(),
    resumeBgm: () => MusicPlayer.resume(),
    fadeOutBgm: (seconds) => MusicPlayer.fadeOut(seconds),
};

// ── Build the domain game ──
const game = new ArkanoidGame(
    { width: BOARD_WIDTH, height: BOARD_HEIGHT },
    {
        repository: LocalStorageAdapter,
        hud: DomHudAdapter,
        sound: soundPort,
        random: RandomAdapter,
    }
);
window.game = game;

// ── Wire the input port (adapters send commands to the domain) ──
KeyboardAdapter.attach(game);
PointerAdapter.attach(game);
TouchAdapter.attach(game);
DomControlsAdapter.attach(game);

// ── Initialize ──
CanvasRendererAdapter.init();
game.boot();

// ── Sound controls (SFX mute, music mute, SFX volume) ──
(function bindSoundControls() {
    const muteBtn = document.getElementById('mute-btn');
    const volumeSlider = document.getElementById('volume-slider');

    function updateMuteIcon() {
        if (muteBtn) {
            if (SoundManager.getMuteState() || SoundManager.getVolume() === 0) {
                muteBtn.textContent = '\u{1F507}';
            } else {
                muteBtn.textContent = '\u{1F50A}';
            }
        }
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            SoundManager.toggleMute();
            updateMuteIcon();
            muteBtn.setAttribute('aria-pressed', SoundManager.getMuteState() ? 'true' : 'false');
        });
    }

    if (volumeSlider) {
        volumeSlider.value = String(SoundManager.getVolume());
        volumeSlider.addEventListener('input', (e) => {
            SoundManager.setVolume(parseFloat(e.target.value));
            updateMuteIcon();
        });
    }

    updateMuteIcon();
    if (muteBtn) muteBtn.setAttribute('aria-pressed', SoundManager.getMuteState() ? 'true' : 'false');

    const bgmMuteBtn = document.getElementById('bgm-mute-btn');
    if (bgmMuteBtn) {
        bgmMuteBtn.addEventListener('click', () => {
            MusicPlayer.toggleMute();
            bgmMuteBtn.setAttribute('aria-pressed', MusicPlayer.getBgmMuteState() ? 'true' : 'false');
        });
        bgmMuteBtn.setAttribute('aria-pressed', MusicPlayer.getBgmMuteState() ? 'true' : 'false');
    }
})();

// ── Frame loop: domain tick, then draw. The first frame is drawn synchronously, as before. ──
const frame = () => {
    game.tick();
    CanvasRendererAdapter.draw(game);
};
frame();
FrameAdapter.start(frame);
