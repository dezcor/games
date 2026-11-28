/**
 * HookrunGame — pure domain state machine.
 * Auto-runs right at a fixed screen position (PLAYER_X), swings over walls and pits
 * with the hook, and shoots pellets to drop zombies. World state lives in world.js;
 * figure state lives in player.js. The composition root drives tick().
 */
class HookrunGame {
    constructor(config, ports) {
        this.width = config.width;
        this.height = config.height;
        this.repository = ports.repository;
        this.hud = ports.hud;
        this.sound = ports.sound;
        this.random = ports.random;

        this.player = null;
        this.world = null;
        this.score = 0;
        this.gameOver = false;
        this.isPaused = true;
        this.gameStarted = false;
        this.playerName = '';
        this.countdown = 0;
        this.hookHeld = false;
        this.pelletCooldown = 0;
    }

    // ── Setup ──

    /** Loads the saved player name and builds the first (not yet started) game. */
    boot() {
        this.playerName = this.repository.loadName();
        this.hud.setPlayerName(this.playerName);
        this.initGame();
        this.hud.setOverlayVisible(true);
        this.hud.setOverlayTitle('HOOK RUN');
        this.hud.setStartButtonVisible(true);
        this.hud.setBest(this.getBestScore());
    }

    initGame() {
        this.player = Player.create();
        this.world = World.create();
        this.score = 0;
        this.gameOver = false;
        this.isPaused = true;
        this.gameStarted = false;
        this.countdown = 0;
        this.hookHeld = false;
        this.pelletCooldown = 0;
        this.updateUI();
    }

    // ── Scores and persistence ──

    getBestScore() {
        const highScores = this.repository.loadHighScores();
        return highScores.length > 0 ? highScores[0].score : 0;
    }

    updateUI() {
        this.hud.updateHud({ score: this.score });
        this.hud.setBest(this.getBestScore());
    }

    // ── Flow: game over, start, pause, restart ──

    handleGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.isPaused = true;
        this.hookHeld = false;

        this.hud.setOverlayVisible(true);
        this.hud.setOverlayTitle('GAME OVER');
        this.hud.setStartButtonVisible(false);

        this.hud.setBest(this.getBestScore());
        const name = this.playerName.trim();
        this.repository.saveHighScore({ score: this.score, name: name || 'Anonymous' });
        this.hud.showHighScores(this.repository.loadHighScores());

        this.sound.playGameOver();
        this.sound.fadeOutBgm(0.8);
    }

    /** Starts a round with a 3s countdown, then starts the auto-run. */
    startGame() {
        if (this.gameStarted) return;
        this.initGame();
        this.countdown = COUNTDOWN_SECONDS;
        this.gameStarted = true;
        this.isPaused = false;

        this.hud.setOverlayVisible(false);
        this.hud.setStartButtonVisible(false);
        this.hud.hideHighScores();
        this.hud.setOverlayTitle('HOOK RUN');
        this.updateUI();

        // Called from the start gesture, so the audio context can unlock.
        this.sound.startBgm();
    }

    /** Re-inits and starts a fresh round. */
    resetGame() {
        this.initGame();
        this.startGame();
    }

    togglePause() {
        if (!this.gameStarted || this.gameOver || this.countdown > 0) return;
        this.isPaused = !this.isPaused;
        this.hookHeld = false;
        this.hud.setOverlayVisible(this.isPaused);
        if (this.isPaused) {
            this.hud.setOverlayTitle('PAUSED');
            this.hud.setStartButtonVisible(false);
            this.sound.pauseBgm();
        } else {
            this.hud.setOverlayTitle('HOOK RUN');
            this.sound.resumeBgm();
        }
    }

    beginPlay() {
        this.hud.setOverlayVisible(false);
        this.hud.setOverlayTitle('HOOK RUN');
        this.sound.playCountdownTick();
    }

    // ── Hook mechanics ──

    /** Finds the nearest unhooked obstacle in the trigger window and hooks it. */
    tryHookTrigger() {
        if (this.player.phase !== 'ground') return false;
        for (const ob of this.world.obstacles) {
            if (ob.hooked) continue;
            const sx = ob.worldX - this.world.distance;
            if (sx >= HOOK_TRIGGER_MIN && sx <= HOOK_TRIGGER_MAX) {
                ob.hooked = true;
                this.world.hookedObstacle = ob;
                Player.startHook(this.player, sx + ob.width / 2);
                this.sound.playHook();
                return true;
            }
        }
        return false;
    }

    /** Released the hold mid-hook: cancel — the hunter drops straight down. */
    cancelHook() {
        const p = this.player;
        if (p.phase === 'fly' || p.phase === 'latch' || p.phase === 'hoist' || p.phase === 'swing') {
            // Keep an obstacle not yet crossed so the player can re-hook it;
            // a crossed one stays committed and is removed on landing.
            const ob = this.world.hookedObstacle;
            if (ob && p.x <= ob.worldX - this.world.distance + ob.width) {
                ob.hooked = false;
                this.world.hookedObstacle = null;
            }
            Player.cancelHook(p);
        }
    }

    // ── Physics ──

    /** The gate X for the committed swing: obstacle right edge plus a margin. */
    hookGateX() {
        const ob = this.world.hookedObstacle;
        if (!ob) return Infinity;
        const sx = ob.worldX - this.world.distance;
        return sx + ob.width + GATE_MARGIN;
    }

    /** Drop the hooked obstacle on the landing instant; the world resumes. */
    clearHookedObstacle() {
        const ob = this.world.hookedObstacle;
        if (!ob) return;
        const idx = this.world.obstacles.indexOf(ob);
        if (idx >= 0) this.world.obstacles.splice(idx, 1);
        this.world.hookedObstacle = null;
    }

    firePellet() {
        if (!this.gameStarted || this.gameOver || this.isPaused || this.countdown > 0) return;
        if (this.player.phase !== 'ground' || this.pelletCooldown > 0) return;
        World.fire(this.world, this.player.x, GROUND_Y);
        this.pelletCooldown = PELLET_FIRE_COOLDOWN;
        this.sound.playShoot();
    }

    checkCollisions() {
        const p = this.player;
        if (p.phase !== 'ground') return; // hooking/falling/can't-collide phases

        // Obstacles (walls + pits) in the run line.
        for (const ob of this.world.obstacles) {
            const sx = ob.worldX - this.world.distance;
            if (sx + ob.width < -20 || sx > BOARD_WIDTH + 20) continue;
            if (ob.type === 'wall') {
                if (p.x + PLAYER_HALF_WIDTH > sx && p.x - PLAYER_HALF_WIDTH < sx + ob.width) {
                    this.handleGameOver();
                    return;
                }
            } else {
                if (p.x > sx && p.x < sx + ob.width) {
                    this.handleGameOver();
                    return;
                }
            }
        }

        // Zombie body contact.
        for (let i = 0; i < this.world.zombies.length; i++) {
            const z = this.world.zombies[i];
            if (Math.abs(z.x - p.x) < 22) {
                this.handleGameOver();
                return;
            }
        }
    }

    // ── Input handling ──

    onHookStart() {
        if (!this.gameStarted) {
            this.startGame();
        } else if (this.gameOver) {
            this.resetGame();
        }
        // Set after (re)starting, which clears it: a held control carries into the round.
        this.hookHeld = true;
        if (!this.isPaused && this.countdown <= 0) {
            this.tryHookTrigger();
        }
    }

    onHookEnd() {
        this.hookHeld = false;
        this.cancelHook();
    }

    onShoot() {
        if (!this.gameStarted) {
            this.startGame();
            return;
        }
        if (this.gameOver) {
            this.resetGame();
            return;
        }
        this.firePellet();
    }

    onKey(key) {
        if (!this.gameStarted) {
            if (key === 'Enter') {
                this.startGame();
            }
            return;
        }
        if (key === 'r' || key === 'R') {
            this.resetGame();
            return;
        }
        if (this.gameOver) {
            if (key === 'Enter') this.resetGame();
            return;
        }
        if (this.isPaused && key === 'Enter') {
            this.togglePause();
            return;
        }
        if (key === 'p' || key === 'P' || key === 'Escape') {
            this.togglePause();
        }
    }

    onStart() {
        this.startGame();
    }

    onTogglePause() {
        this.togglePause();
    }

    onRestart() {
        this.resetGame();
    }

    setPlayerName(name) {
        this.playerName = name;
        this.repository.saveName(name);
    }

    // ── Step ──

    tick(dt = 1 / 60) {
        if (this.countdown > 0) {
            const prev = Math.ceil(this.countdown);
            this.countdown -= dt;
            const now = Math.ceil(this.countdown);
            if (now !== prev && now >= 1 && now <= COUNTDOWN_SECONDS && this.gameStarted) {
                this.sound.playCountdownTick();
            }
            if (this.countdown <= 0) {
                this.countdown = 0;
                this.beginPlay();
            }
            return;
        }

        if (this.isPaused || this.gameOver || !this.gameStarted) return;

        const wasHooking = Player.isHooking(this.player);
        const killsBefore = this.world.kills;

        // Hold triggers fire asynchronously: while held, try each frame.
        if (this.hookHeld) {
            this.tryHookTrigger();
        }

        if (this.pelletCooldown > 0) this.pelletCooldown = Math.max(0, this.pelletCooldown - dt);

        Player.step(this.player, dt, this.hookGateX());

        // Landing instant: the world resumes and the hooked obstacle is removed.
        if (wasHooking && !Player.isHooking(this.player)) {
            this.clearHookedObstacle();
            if (this.player.phase === 'recenter') this.sound.playLand();
        }

        const frozen = Player.isHooking(this.player);
        World.step(this.world, dt, this.random, frozen);
        // Score first: a collision saves it as part of ending the round.
        this.score = Math.floor(this.world.distance / DISTANCE_PER_POINT) + this.world.kills * SCORE_PER_KILL;
        this.checkCollisions();

        if (this.world.kills > killsBefore) {
            this.sound.playKill();
        }

        this.updateUI();
    }
}
