/**
 * Composition root — builds the domain and wires all ports to adapters.
 */

// ── Sound port over the SoundManager / MusicPlayer adapter ──
const soundPort = {
    playMove: () => SoundManager.playMove(),
    playEat: () => SoundManager.playEat(),
    playGameOver: () => SoundManager.playGameOver(),
    playNewHighScore: () => SoundManager.playNewHighScore(),
    startBgm: () => SoundManager.startBgm(),
};

// ── Build the domain game ──
const game = new SnakeGame(
    { tileCount: TILE_COUNT },
    {
        repository: LocalStorageAdapter,
        renderer: CanvasRendererAdapter,
        input: null, // wired below once the domain exists
        sound: soundPort,
        clock: FrameAdapter,
    }
);

window.game = game;

// ── Wire the input port (keyboard + touch adapters route through it) ──
window.inputPort = {
    onDirection: (dx, dy) => game.onDirection(dx, dy),
    onRestart: () => game.onRestart(),
};
game.input = window.inputPort;

// ── Initialize ──
CanvasRendererAdapter.init();
game.init();
game.start();

window.resetGame = () => game.onRestart();

// ── Sound controls (SFX mute, BGM mute, volume) ──
const muteBtn = document.getElementById('mute-btn');
const bgmMuteBtn = document.getElementById('bgm-mute-btn');
const volumeSlider = document.getElementById('volume-slider');

function updateMuteIcon() {
    if (muteBtn) {
        muteBtn.textContent = SoundManager.getMuteState() || SoundManager.getVolume() === 0 ? '🔇' : '🔊';
    }
}

function updateMusicIcon() {
    if (bgmMuteBtn) {
        bgmMuteBtn.textContent = MusicPlayer.getBgmMuteState() ? '🔇' : '🎵';
    }
}

if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        SoundManager.toggleMute();
        updateMuteIcon();
        muteBtn.setAttribute('aria-pressed', SoundManager.getMuteState() ? 'true' : 'false');
    });
}

if (bgmMuteBtn) {
    bgmMuteBtn.addEventListener('click', () => {
        MusicPlayer.toggleMute();
        updateMusicIcon();
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
updateMusicIcon();
if (muteBtn) muteBtn.setAttribute('aria-pressed', SoundManager.getMuteState() ? 'true' : 'false');
