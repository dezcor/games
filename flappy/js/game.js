/**
 * Composition root — builds the domain, wires every port to its adapter and starts the loop.
 */

// ── Sound port over the SoundManager / MusicPlayer adapter ──
const soundPort = {
    playFlap: () => SoundManager.playFlap(),
    playScore: () => SoundManager.playScore(),
    playGameOver: () => SoundManager.playGameOver(),
    startBgm: () => SoundManager.startBgm(),
    pauseBgm: () => MusicPlayer.pause(),
    resumeBgm: () => MusicPlayer.resume(),
    fadeOutBgm: (seconds) => MusicPlayer.fadeOut(seconds),
};

// ── Build the domain game ──
const game = new FlappyGame(
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

// ── Frame loop: time-based, so the game runs at the same speed on any display. ──
let lastFrameTime = 0;
const frame = (timestamp) => {
    const now = typeof timestamp === 'number' ? timestamp : FrameAdapter.now();
    if (!lastFrameTime) lastFrameTime = now;

    let dt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    // Clamp long pauses (tab in the background) and guard against clock jumps.
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;

    game.tick(dt);
    CanvasRendererAdapter.draw(game);
};
frame(FrameAdapter.now());
FrameAdapter.start(frame);
