/**
 * HookrunGame — pure domain state machine.
 * Auto-runs right at a fixed screen position (PLAYER_X), swings over walls and pits
 * with the hook, and shoots pellets forward to drop zombies. World state lives in world.js;
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
        this.hookArmed = false;     // the current press has not thrown its hook yet
        this.pelletCooldown = 0;
        this.powers = null;
        this.invulnerable = 0;      // grace seconds after the shield breaks
        this.notice = null;         // last pickup, shown for a moment
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
        this.hookArmed = false;
        this.pelletCooldown = 0;
        this.powers = Powers.create();
        this.invulnerable = 0;
        this.notice = null;
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
        this.hookArmed = false;

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
        this.hookArmed = false;
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

    /** Throws this press's hook at the first beam inside its trigger window. */
    tryHookTrigger() {
        if (Player.isHooking(this.player)) return false;
        for (const ob of this.world.obstacles) {
            if (ob.hooked || !OBSTACLE_TYPES[ob.type].hookable) continue;
            const sx = ob.worldX - this.world.distance;
            const min = ob.type === 'anchor' ? ANCHOR_TRIGGER_MIN : HOOK_TRIGGER_MIN;
            if (sx >= min && sx <= HOOK_TRIGGER_MAX) {
                // One hook per press: release and press again for the next one.
                this.hookArmed = false;
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
            // An obstacle not yet crossed can be hooked again.
            const ob = this.world.hookedObstacle;
            if (ob && p.x <= ob.worldX - this.world.distance + ob.width) {
                ob.hooked = false;
            }
            this.world.hookedObstacle = null;
            Player.release(p);
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

    firePellet() {
        if (!this.gameStarted || this.gameOver || this.isPaused || this.countdown > 0) return;
        if (this.player.phase !== 'ground' || this.pelletCooldown > 0) return;
        const hits = Powers.isActive(this.powers, 'pierce') ? PIERCE_HITS : 1;
        World.fire(this.world, this.player.x, GROUND_Y, hits);
        this.pelletCooldown = Powers.isActive(this.powers, 'rapid') ? RAPID_FIRE_COOLDOWN : PELLET_FIRE_COOLDOWN;
        this.sound.playShoot();
    }

    /** The hunter touched down: let go of the obstacle and crush what is underneath. */
    land() {
        this.world.hookedObstacle = null;
        if (this.player.fallHeight >= STOMP_MIN_HEIGHT) {
            World.stomp(this.world, this.player.x, this.random);
        }
        this.sound.playLand();
    }

    /** Picks up every power-up the hunter's body touches. */
    collectPowers() {
        const p = this.player;
        for (let i = this.world.powers.length - 1; i >= 0; i--) {
            const power = this.world.powers[i];
            const x = power.worldX - this.world.distance;
            if (Math.abs(x - p.x) >= PLAYER_HALF_WIDTH + POWER_RADIUS) continue;
            if (p.feetY <= POWER_Y - POWER_RADIUS || p.feetY - PLAYER_BODY_HEIGHT >= POWER_Y + POWER_RADIUS) continue;
            this.world.powers.splice(i, 1);
            Powers.grant(this.powers, power.kind);
            if (power.kind === 'bomb') World.clearZombies(this.world, this.random);
            this.notice = { kind: power.kind, time: POWER_NOTICE_TIME };
            this.sound.playPower();
        }
    }

    /** A hit: the shield takes it if there is one, otherwise the run ends. @returns {boolean} survived */
    absorbHit() {
        if (!Powers.useShield(this.powers)) {
            this.handleGameOver();
            return false;
        }
        this.invulnerable = SHIELD_GRACE;
        this.sound.playShield();
        return true;
    }

    checkCollisions() {
        if (this.invulnerable > 0) return;
        const p = this.player;

        // Obstacles are solid in every phase: the hook or the jump has to clear them.
        for (const ob of this.world.obstacles) {
            if (ob.type === 'anchor') continue; // just a beam over open road
            const sx = ob.worldX - this.world.distance;
            let hit;
            if (ob.type === 'pit') {
                hit = p.x > sx && p.x < sx + ob.width && p.feetY >= GROUND_Y;
            } else {
                const inset = ob.type === 'wall' ? 0 : TRAP_INSET;
                hit = p.x + PLAYER_HALF_WIDTH > sx + inset
                    && p.x - PLAYER_HALF_WIDTH < sx + ob.width - inset
                    && p.feetY > GROUND_Y - ob.height;
            }
            if (hit) {
                this.absorbHit();
                return;
            }
        }

        // Zombie body contact; a hunter dropping from the rope lands on top of them.
        if (p.phase === 'fall' && p.fallHeight >= STOMP_MIN_HEIGHT) return;
        for (let i = 0; i < this.world.zombies.length; i++) {
            const z = this.world.zombies[i];
            const type = ZOMBIE_TYPES[z.kind];
            if (Math.abs(z.x - p.x) < type.contact && p.feetY > GROUND_Y - type.height) {
                // A shield also knocks out the zombie that hit it.
                if (this.absorbHit()) World.killZombie(this.world, i, this.random);
                return;
            }
        }
    }

    // ── Input handling ──

    onHookStart() {
        const newPress = !this.hookHeld;
        if (!this.gameStarted) {
            this.startGame();
        } else if (this.gameOver) {
            this.resetGame();
        }
        // Set after (re)starting, which clears them: a held control carries into the round.
        this.hookHeld = true;
        if (newPress) this.hookArmed = true;
        if (this.hookArmed && !this.isPaused && this.countdown <= 0) {
            this.tryHookTrigger();
        }
    }

    onHookEnd() {
        this.hookHeld = false;
        this.hookArmed = false;
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

    onJump() {
        if (!this.gameStarted) {
            this.startGame();
            return;
        }
        if (this.gameOver) {
            this.resetGame();
            return;
        }
        if (this.isPaused || this.countdown > 0) return;
        const p = this.player;
        const doubleJump = p.phase === 'jump' && !p.airJumpUsed && Powers.isActive(this.powers, 'doubleJump');
        if (p.phase !== 'ground' && !doubleJump) return;
        Player.jump(p);
        this.sound.playJump();
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

        const killsBefore = this.world.kills;

        // A press made early waits, while held, for a beam to come into reach.
        if (this.hookArmed) {
            this.tryHookTrigger();
        }

        if (this.pelletCooldown > 0) this.pelletCooldown = Math.max(0, this.pelletCooldown - dt);
        if (this.invulnerable > 0) this.invulnerable = Math.max(0, this.invulnerable - dt);
        if (this.notice) {
            this.notice.time -= dt;
            if (this.notice.time <= 0) this.notice = null;
        }
        Powers.step(this.powers, dt);

        const wasHooking = Player.isHooking(this.player);
        const wasAirborne = this.player.phase !== 'ground';
        Player.step(this.player, dt, this.hookGateX());
        World.step(this.world, dt, this.random);

        // The plank travels with its obstacle.
        const hooked = this.world.hookedObstacle;
        if (hooked) {
            this.player.anchorX = hooked.worldX - this.world.distance + hooked.width / 2;
        }

        if (wasAirborne && this.player.phase === 'ground') {
            if (wasHooking) this.land();
            else this.sound.playLand();
        }

        this.collectPowers();

        // Score first: a collision saves it as part of ending the round.
        this.score = Math.floor(this.world.distance / DISTANCE_PER_POINT) + this.world.killScore;
        this.checkCollisions();

        if (this.world.kills > killsBefore) {
            this.sound.playKill();
        }

        this.updateUI();
    }
}
