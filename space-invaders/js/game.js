/**
 * Composition root — builds the domain game and wires the ports to adapters.
 */

// ── Sound port over the SoundManager / MusicPlayer adapter ──
const soundPort = {
    playShoot: () => SoundManager.playShoot(),
    playBulletClash: () => SoundManager.playBulletClash(),
    playExplosion: () => SoundManager.playExplosion(),
    playAlienMove: () => SoundManager.playAlienMove(),
    playAlienShoot: (alienType) => SoundManager.playAlienShoot(alienType),
    playUFO: () => SoundManager.playUFO(),
    playGameOver: () => SoundManager.playGameOver(),
    playNewHighScore: () => SoundManager.playNewHighScore(),
    startBgm: () => SoundManager.startBgm(),
    pauseBgm: () => MusicPlayer.pause(),
    resumeBgm: () => MusicPlayer.resume(),
    fadeOutBgm: (duration) => MusicPlayer.fadeOut(duration),
};

// ── Build the domain game ──
const game = new InvadersGame({
    repository: LocalStorageAdapter,
    sound: soundPort,
    hud: DomHudAdapter,
    input: InputAdapter,
    clock: FrameAdapter,
    environment: EnvironmentAdapter,
});
window.game = game;

// ── Wire input, sound controls and buttons ──
game.init();
CanvasRendererAdapter.init();
InputAdapter.init();
TouchAdapter.init(game);
KeyboardAdapter.init(game);
SoundControlsAdapter.init(LocalStorageAdapter);
DomHudAdapter.bindPlayerName(LocalStorageAdapter);
DomHudAdapter.bindDifficultyButtons(game, LocalStorageAdapter);

const pauseBtn = document.getElementById('pause-btn');
if (pauseBtn) {
    pauseBtn.addEventListener('click', () => game.togglePause());
}

const startBtn = document.getElementById('start-btn');
if (startBtn) {
    startBtn.addEventListener('click', () => game.startGame());
}

const quickRestartBtn = document.getElementById('quick-restart-btn');
if (quickRestartBtn) {
    quickRestartBtn.addEventListener('click', () => {
        if (game.gameOver) {
            game.resetGame();
        }
    });
}

CanvasRendererAdapter.canvas.addEventListener('click', () => {
    if (!game.gameStarted) {
        game.startGame();
    } else if (game.isPaused && !game.gameOver) {
        game.togglePause();
    }
});

// ── Start screen ──
game.showStartScreen();
game.updatePauseControl();
game.refreshBest();

// Sprites load asynchronously; the board draws canvas fallbacks until they are ready.
(async () => {
    try {
        await CanvasRendererAdapter.loadSprites();
    } catch (error) {
        console.warn('Failed to load SVG sprites, falling back to canvas drawing:', error);
    }
    game.initGame();
})();

// ── Frame loop: simulate, then draw ──
game.startLoop(() => CanvasRendererAdapter.draw(game));
