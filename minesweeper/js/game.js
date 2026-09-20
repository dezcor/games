/**
 * Minesweeper Composition Root.
 * Wires the domain (Game) to the adapters (ports) and starts the app.
 */

// ── Sound port ──
const soundPort = {
    playReveal: () => SoundManager.playReveal(),
    playFlag: () => SoundManager.playFlag(),
    playExplosion: () => SoundManager.playExplosion(),
    playWin: () => SoundManager.playWin(),
    playGameOver: () => SoundManager.playGameOver(),
    playClick: () => SoundManager.playClick(),
    playNewHighScore: () => SoundManager.playNewHighScore(),
    ensureAudio: () => ensureAudio(),
    startBgm: () => MusicPlayer.start(),
    stopBgm: () => MusicPlayer.stop(),
    pauseBgm: () => MusicPlayer.pause(),
    resumeBgm: () => MusicPlayer.resume(),
};

// ── Create the domain ──
const game = new Game(DIFFICULTY_PRESETS[DEFAULT_DIFFICULTY], {
    repository: LocalStorageAdapter,
    renderer: CanvasRendererAdapter,
    input: null,
    sound: soundPort,
    clock: TimerAdapter,
});
window.game = game;

// ── Wire the input port ──
window.inputPort = {
    onCellClick: (r, c) => game.onCellClick(r, c),
    onCellFlag: (r, c) => game.onCellFlag(r, c),
    onChord: (r, c) => game.onChord(r, c),
    onRestart: () => game.restart(),
    onSelectDifficulty: (diff) => game.start(diff),
    onPause: () => game.togglePause(),
};
game.input = window.inputPort;

// ── Initialize ──
game.init();
CanvasRendererAdapter.init(game);

// ── UI wiring ──
function updateDifficultyButtons() {
    Object.entries(DIFFICULTY_PRESETS).forEach(([key, preset]) => {
        const btn = document.getElementById(`diff-btn-${key}`);
        if (!btn) return;
        btn.classList.toggle('active', key === game.difficulty);
    });
}

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
        bgmMuteBtn.setAttribute('aria-pressed', String(MusicPlayer.getMuteState()));
        bgmMuteBtn.textContent = MusicPlayer.getMuteState() ? '🎵' : '🎶';
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

function setupUI() {
    // Difficulty buttons
    Object.entries(DIFFICULTY_PRESETS).forEach(([key]) => {
        const btn = document.getElementById(`diff-btn-${key}`);
        if (!btn) return;
        btn.addEventListener('click', () => {
            game.difficulty = key;
            game.repository.saveDifficulty(key);
            updateDifficultyButtons();
            SoundManager.playClick();
        });
    });
    updateDifficultyButtons();

    // Start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.addEventListener('click', () => {
        game.start(game.difficulty);
    });

    // Quick restart
    const quickRestartBtn = document.getElementById('quick-restart-btn');
    if (quickRestartBtn) quickRestartBtn.addEventListener('click', () => {
        game.restart();
    });

    // Pause button
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.addEventListener('click', () => {
        game.togglePause();
    });

    // Player name
    const nameInput = document.getElementById('player-name');
    if (nameInput) {
        nameInput.value = game.playerName;
        nameInput.addEventListener('change', () => {
            game.setPlayerName(nameInput.value);
        });
    }

    // Sound controls
    setupSoundControls();
}

setupUI();

// ── Initial state: show the menu overlay ──
CanvasRendererAdapter.showOverlay('menu');
CanvasRendererAdapter.beginFrame();
CanvasRendererAdapter.drawHud(game);
