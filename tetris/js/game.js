/**
 * Composition root — builds the domain game and wires the adapters to its ports.
 */

// ── Sound port over the SoundManager / MusicPlayer adapter ──
const soundPort = {
    playMove: () => SoundManager.playMove(),
    playRotate: () => SoundManager.playRotate(),
    playLineClear: (lines) => SoundManager.playLineClear(lines),
    playHardDrop: () => SoundManager.playHardDrop(),
    playGameOver: () => SoundManager.playGameOver(),
    startBgm: () => SoundManager.startBgm(),
    pauseBgm: () => MusicPlayer.pause(),
    resumeBgm: () => MusicPlayer.resume(),
    fadeOutBgm: (seconds) => MusicPlayer.fadeOut(seconds),
};

TetrisRendererAdapter.init();

// ── Build the domain game ──
const game = new TetrisGame({
    repository: LocalStorageAdapter,
    renderer: TetrisRendererAdapter,
    input: KeyboardAdapter,
    sound: soundPort,
    clock: FrameClockAdapter,
    random: RandomAdapter,
});

// ── Player name (persisted; typing it can switch on the North theme) ──
TetrisRendererAdapter.setPlayerName(LocalStorageAdapter.loadPlayerName());
game.refreshNorthTheme();
TetrisRendererAdapter.onPlayerNameInput(() => {
    LocalStorageAdapter.savePlayerName(TetrisRendererAdapter.getPlayerName());
    game.refreshNorthTheme();
});

// ── Input: keyboard commands + held keys, touch controls ──
KeyboardAdapter.attach(game);
TouchAdapter.attach(game, KeyboardAdapter);

const pauseBtn = document.getElementById('pause-btn');
if (pauseBtn) {
    pauseBtn.addEventListener('click', () => game.togglePause());
}

const startBtn = document.getElementById('start-btn');
if (startBtn) {
    startBtn.addEventListener('click', () => game.startGame());
}

// ── Sound controls (SFX mute, BGM mute, volume) ──
const muteBtn = document.getElementById('mute-btn');
const bgmMuteBtn = document.getElementById('bgm-mute-btn');
const volumeSlider = document.getElementById('volume-slider');

function updateMuteIcon() {
    if (muteBtn) {
        if (SoundManager.getMuteState() || SoundManager.getVolume() === 0) {
            muteBtn.textContent = '🔇';
        } else {
            muteBtn.textContent = '🔊';
        }
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

if (volumeSlider) {
    volumeSlider.value = String(SoundManager.getVolume());
    volumeSlider.addEventListener('input', (e) => {
        SoundManager.setVolume(parseFloat(e.target.value));
        updateMuteIcon();
    });
}

if (bgmMuteBtn) {
    bgmMuteBtn.addEventListener('click', () => {
        MusicPlayer.toggleMute();
        updateMusicIcon();
        bgmMuteBtn.setAttribute('aria-pressed', MusicPlayer.getBgmMuteState() ? 'true' : 'false');
    });
    bgmMuteBtn.setAttribute('aria-pressed', MusicPlayer.getBgmMuteState() ? 'true' : 'false');
}

updateMuteIcon();
if (muteBtn) muteBtn.setAttribute('aria-pressed', SoundManager.getMuteState() ? 'true' : 'false');

// ── Start ──
game.init();
game.start();
