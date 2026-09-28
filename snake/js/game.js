/**
 * Snake Game — Composition Root.
 * Wires the domain (SnakeGame) to the adapters (ports) and starts the app.
 */

// ── Wire input port ──
window.inputPort = {
    onDirectionChange: (dx, dy) => SnakeGame.setDirection(dx, dy),
    onRestart: () => SnakeGame.reset(),
};

// ── Create the domain ──
SnakeGame.init({
    repository: LocalStorageAdapter,
    renderer: CanvasAdapter,
    input: window.inputPort,
    sound: SoundAdapter,
});
window.game = SnakeGame;

// ── Initialize adapters ──
CanvasAdapter.init('gameCanvas');
KeyboardAdapter.init(SnakeGame);
TouchAdapter.init(SnakeGame);

// ── UI wiring ──
function setupSoundControls() {
    const muteBtn = document.getElementById('mute-btn');
    const bgmMuteBtn = document.getElementById('bgm-mute-btn');
    const volumeSlider = document.getElementById('volume-slider');

    if (muteBtn) {
        muteBtn.setAttribute('aria-pressed', String(SoundManager.getMuteState()));
        muteBtn.textContent = SoundManager.getMuteState() ? '🔇' : '🔊';
        muteBtn.addEventListener('click', () => {
            const muted = SoundManager.toggleMute();
            muteBtn.setAttribute('aria-pressed', String(muted));
            muteBtn.textContent = muted ? '🔇' : '🔊';
        });
    }

    if (bgmMuteBtn) {
        bgmMuteBtn.setAttribute('aria-pressed', String(MusicPlayer.getBgmMuteState()));
        bgmMuteBtn.textContent = MusicPlayer.getBgmMuteState() ? '🎵' : '🎶';
        bgmMuteBtn.addEventListener('click', () => {
            const muted = MusicPlayer.toggleMute();
            bgmMuteBtn.setAttribute('aria-pressed', String(muted));
            bgmMuteBtn.textContent = muted ? '🎵' : '🎶';
        });
    }

    if (volumeSlider) {
        volumeSlider.value = String(SoundManager.getVolume());
        volumeSlider.addEventListener('input', () => {
            SoundManager.setVolume(Number(volumeSlider.value));
        });
    }
}

function updateHighScoreDisplay() {
    const highScoreElement = document.getElementById('highScore');
    if (highScoreElement) {
        const highScore = LocalStorageAdapter.loadHighScore();
        highScoreElement.textContent = `BEST: ${highScore}`;
    }
}

// ── Setup UI ──
setupSoundControls();
updateHighScoreDisplay();

// ── Start game on load ──
SnakeGame.start();
SnakeGame.rafId = requestAnimationFrame((t) => SnakeGame.loop(t));

// ── Expose resetGame globally for the game-over overlay button ──
window.resetGame = () => {
    SnakeGame.reset();
};
