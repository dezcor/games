/**
 * Asteroids composition root: builds the domain game, wires ports to adapters, and starts it.
 */

// ── Sound port over the SoundManager / MusicPlayer adapter ──
const soundAdapter = {
    playShoot: () => SoundManager.playShoot(),
    playThrust: () => SoundManager.playThrust(),
    playExplosion: () => SoundManager.playExplosion(),
    playPlayerHit: () => SoundManager.playPlayerHit(),
    playUFO: () => SoundManager.playUFO(),
    playUfoShoot: () => SoundManager.playUfoShoot(),
    playUfoExplode: () => SoundManager.playUfoExplode(),
    playGameOver: () => SoundManager.playGameOver(),
    playNewHighScore: () => SoundManager.playNewHighScore(),
    playLevelUp: () => SoundManager.playLevelUp(),
    playPowerupSpawn: () => SoundManager.playPowerupSpawn(),
    playPowerupPickup: () => SoundManager.playPowerupPickup(),
    playHyperspace: () => SoundManager.playHyperspace(),
    playHyperspaceFail: () => SoundManager.playHyperspaceFail(),
    startMusic: () => MusicPlayer.start(),
    stopMusic: () => MusicPlayer.stop(),
    pauseMusic: () => MusicPlayer.pause(),
    resumeMusic: () => MusicPlayer.resume(),
    setMusicIntensity: (level) => MusicPlayer.setIntensity(level),
    setUfoMusicActive: (active) => MusicPlayer.setUfoActive(active),
};

// ── Input port: keyboard held-state merged with touch held-state ──
const gameInput = {
    isActive: (code) => KeyboardAdapter.isHeld(code) || TouchAdapter.isHeld(code),
};

// ── Build the domain game ──
const game = new AsteroidsGame(
    { width: GAME_CONFIG.canvasWidth, height: GAME_CONFIG.canvasHeight },
    {
        repository: LocalStorageRepository,
        sound: soundAdapter,
        effects: EffectsAdapter,
        renderer: CanvasRenderer,
        ui: DomUi,
        input: gameInput,
        clock: BrowserClock,
        random: { next: () => Math.random() },
    }
);
game.load();

// ── Touch deck and held-key tracking are live from script load (as before) ──
KeyboardAdapter.track();
TouchAdapter.init({
    getState: () => game.state,
    hyperspace: () => game.tryHyperspace(),
    togglePause: () => game.togglePause(),
    restart: () => game.resetGame(),
});
PinchZoomAdapter.init();

// ── Frame loop: the domain steps and draws from the rAF timestamp ──
const frameTick = (timestamp) => {
    game.frame(timestamp);
    window.requestAnimationFrame(frameTick);
};

// ── Init after the DOM and sprites are ready ──
window.onload = async () => {
    const canvas = document.getElementById('asteroids-canvas');
    CanvasRenderer.init(canvas, game.width, game.height);

    try {
        await CanvasRenderer.loadSprites();
    } catch (error) {
        console.warn('Failed to load SVG sprites, falling back to canvas drawing:', error);
    }

    KeyboardAdapter.bindShortcuts(game, DomUi);
    DomUi.init(game, LocalStorageRepository);
    game.refresh();
    DomUi.maybeShowTutorial(game.state);

    window.requestAnimationFrame(frameTick);
};
