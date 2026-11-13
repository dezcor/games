/**
 * InvadersGame — pure domain state machine for Space Invaders.
 * No DOM, no localStorage, no audio, no canvas, no globals for time or randomness.
 * Everything external arrives through `ports` (see js/ports/*.js):
 *   repository, sound, hud, input, clock, environment.
 */
class InvadersGame {
    constructor(ports) {
        this.ports = ports;

        this.score = 0;
        this.lives = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = true;
        this.gameStarted = false;
        this.selectedDifficulty = 'normal';

        this.bullets = [];
        this.alienBullets = [];
        this.particles = [];
        this.ufos = [];
        this.aliens = [];
        this.playerX = 0;

        this.alienDirection = 1;
        this.alienMoveTimer = 0;
        this.alienMoveInterval = 600;
        this.alienSpeed = ALIEN_BASE_SPEED;
        this.alienShootTimer = 0;

        this.shootCooldown = 0;
        this.ufoSpawnTimer = 0;
        this.ufoSpawnDelay = 0;

        this.gameTime = 0;
        this.comboCount = 0;
        this.comboExpiresAt = 0;
        this.playerInvulnerabilityUntil = 0;
        this.lastTime = 0;
    }

    // ── Helpers ──

    rand() {
        return this.ports.environment.random();
    }

    difficulty() {
        return DIFFICULTY_PRESETS[this.selectedDifficulty];
    }

    // ── Setup and frame loop ──

    // Loads the saved difficulty and sets up a valid first game.
    init() {
        this.selectedDifficulty = this.ports.repository.getSavedDifficulty();
        this.initGame();
    }

    // Starts the frame clock. `render` is called after every simulation step.
    startLoop(render) {
        this.lastTime = this.ports.clock.now();
        this.ports.clock.start((timestamp) => {
            this.frame(timestamp);
            render();
        });
    }

    frame(timestamp) {
        const delta = Math.min(100, Math.max(0, timestamp - this.lastTime));
        this.lastTime = timestamp;
        this.update(delta);
        this.updateParticles(delta);
    }

    // ── Setup / reset ──

    initGame() {
        const diff = this.difficulty();
        this.score = 0;
        this.lives = diff.lives;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = true;
        this.gameStarted = false;
        this.bullets = [];
        this.alienBullets = [];
        this.ufos = [];
        this.particles = [];
        this.ufoSpawnTimer = 0;
        this.ufoSpawnDelay = this.getUfoSpawnDelay();
        this.alienShootTimer = 0;
        this.alienDirection = 1;
        this.alienMoveTimer = 0;
        this.alienMoveInterval = 600;
        this.alienSpeed = diff.alienSpeed;
        this.shootCooldown = 0;
        this.gameTime = 0;
        this.comboCount = 0;
        this.comboExpiresAt = 0;
        this.playerInvulnerabilityUntil = 0;
        this.playerX = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;

        this.aliens = AlienRules.createFormation();
        this.updateUI();
    }

    resetAliens() {
        this.aliens = AlienRules.createFormation();
        this.alienDirection = 1;
        this.alienShootTimer = 0;
        const diff = this.difficulty();
        this.alienMoveInterval = Math.max(150, 600 - (this.level - 1) * 100);
        this.alienSpeed = diff.alienSpeed + (this.level - 1) * 0.3;
    }

    showStartScreen() {
        this.ports.hud.setOverlay({ visible: true, title: 'SPACE INVADERS' });
        this.ports.hud.showStartButton();
    }

    startGame() {
        this.gameStarted = true;
        this.isPaused = false;
        this.particles = [];
        this.updatePauseControl();
        this.ports.hud.setOverlay({ visible: false, title: 'SPACE INVADERS' });
        this.ports.hud.hideStartButton();
        this.ports.hud.hideGameOverView();
        this.ports.hud.hideHighScores();
        this.ports.hud.restartBoardAnimation('level-enter');
        this.ports.sound.startBgm();
    }

    resetGame() {
        if (!this.gameStarted) return;
        this.initGame();
        this.isPaused = false;
        this.gameStarted = true;
        this.updatePauseControl();

        this.ports.hud.setOverlay({ visible: false, title: 'SPACE INVADERS' });
        this.ports.hud.hideHighScores();
        this.ports.hud.hideGameOverView();

        this.refreshBest();
        this.ports.sound.startBgm();
    }

    togglePause() {
        if (!this.gameStarted || this.gameOver) return;
        this.isPaused = !this.isPaused;
        this.ports.hud.setOverlay({
            visible: this.isPaused,
            title: this.isPaused ? 'PAUSED' : 'SPACE INVADERS',
        });
        this.updatePauseControl();
        if (this.isPaused) {
            this.ports.sound.pauseBgm();
        } else {
            this.lastTime = this.ports.clock.now();
            this.ports.sound.resumeBgm();
        }
    }

    setDifficulty(diff) {
        if (!DIFFICULTY_PRESETS[diff] || (this.gameStarted && !this.gameOver)) return false;
        this.selectedDifficulty = diff;
        this.alienSpeed = DIFFICULTY_PRESETS[diff].alienSpeed;
        this.updateUI();
        return true;
    }

    // ── HUD ──

    updateUI() {
        this.ports.hud.updateHud({
            score: this.score,
            lives: this.lives,
            comboCount: this.comboCount,
        });
        this.refreshBest();
    }

    refreshBest() {
        this.ports.hud.setBest(this.ports.repository.getBestScore());
    }

    updatePauseControl() {
        const label = this.gameStarted && this.isPaused && !this.gameOver ? 'Resume' : 'Pause';
        this.ports.hud.setPauseControl({ label, paused: this.isPaused });
    }

    // ── Scoring and combo ──

    resetCombo() {
        this.comboCount = 0;
        this.comboExpiresAt = 0;
        this.updateUI();
    }

    awardScore(points, { countsForCombo = false, feedbackColor = '#fbbf24' } = {}) {
        let awardedPoints = Math.max(0, Math.floor(points));

        if (countsForCombo) {
            this.comboCount = this.gameTime <= this.comboExpiresAt ? this.comboCount + 1 : 1;
            this.comboExpiresAt = this.gameTime + COMBO_WINDOW;
            const comboBonus = Math.min(
                Math.max(0, this.comboCount - 1) * COMBO_BONUS_STEP,
                MAX_COMBO_BONUS
            );
            awardedPoints += comboBonus;

            if (this.comboCount > 1) {
                this.ports.hud.showScoreFeedback(`COMBO x${this.comboCount} +${awardedPoints}`, feedbackColor);
            }
        }

        this.score += awardedPoints;
        this.updateUI();
        return awardedPoints;
    }

    // ── Particles ──

    explode(x, y, color, count = PARTICLE_COUNT) {
        ParticleRules.spawn(this.particles, {
            x,
            y,
            color,
            count,
            reducedMotion: this.ports.environment.prefersReducedMotion(),
            random: () => this.rand(),
        });
    }

    updateParticles(delta) {
        this.particles = ParticleRules.step(this.particles, delta);
    }

    // ── Aliens ──

    spawnAlienShots(delta) {
        const diff = this.difficulty();
        const aliveAliens = AlienRules.aliveCount(this.aliens);
        if (aliveAliens === 0) return;

        this.alienShootTimer += delta;
        const interval = AlienRules.shootInterval(diff.shootInterval, aliveAliens);
        if (this.alienShootTimer < interval) return;
        this.alienShootTimer = 0;

        if (this.alienBullets.length >= diff.maxAlienBullets) return;

        const shooter = AlienRules.pickShooter(this.aliens, () => this.rand());
        if (!shooter) return;

        this.alienBullets.push({
            x: shooter.x + shooter.width / 2 - ALIEN_BULLET_WIDTH / 2,
            y: shooter.y + shooter.height,
            width: ALIEN_BULLET_WIDTH,
            height: ALIEN_BULLET_HEIGHT,
            speed: diff.alienBulletSpeed,
            type: shooter.type,
        });
        this.ports.sound.playAlienShoot(shooter.type);
    }

    // ── UFO ──

    getUfoSpawnDelay() {
        return UfoRules.spawnDelay(this.level, this.difficulty(), () => this.rand());
    }

    scheduleNextUFO() {
        this.ufoSpawnTimer = 0;
        this.ufoSpawnDelay = this.getUfoSpawnDelay();
    }

    spawnUFO() {
        this.ufos.push(UfoRules.create(this.level, this.difficulty(), () => this.rand()));
        this.ports.sound.playUFO();
    }

    updateUFOs(delta) {
        if (!UfoRules.hasActive(this.ufos)) {
            this.ufoSpawnTimer += delta;
            if (this.ufoSpawnTimer >= this.ufoSpawnDelay) {
                this.spawnUFO();
                this.ufoSpawnTimer = 0;
            }
        }

        this.ufos = UfoRules.move(this.ufos, delta);
        if (this.ufos.length === 0 && this.ufoSpawnTimer === 0) {
            this.scheduleNextUFO();
        }
    }

    // ── Main update (one simulation step) ──

    update(delta) {
        if (this.isPaused || this.gameOver) return;

        const frameScale = delta / (1000 / 60);
        const diff = this.difficulty();
        const input = this.ports.input;
        this.gameTime += delta;

        if (this.comboCount > 0 && this.gameTime >= this.comboExpiresAt) {
            this.resetCombo();
        }

        // Player movement
        if (input.isDown('ArrowLeft') || input.isDown('KeyA')) {
            this.playerX -= 2.5 * frameScale;
        }
        if (input.isDown('ArrowRight') || input.isDown('KeyD')) {
            this.playerX += 2.5 * frameScale;
        }
        if (this.playerX < 0) this.playerX = 0;
        if (this.playerX + PLAYER_WIDTH > CANVAS_WIDTH) this.playerX = CANVAS_WIDTH - PLAYER_WIDTH;

        // Player shooting
        this.shootCooldown -= delta;
        if ((input.isDown('Space') || input.isDown('Enter')) && this.shootCooldown <= 0) {
            this.bullets.push({
                x: this.playerX + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
                y: PLAYER_Y,
            });
            this.ports.sound.playShoot();
            this.shootCooldown = 250;
        }

        // Update player bullets
        this.bullets = this.bullets.filter((b) => b.y > 0);
        this.bullets.forEach((b) => { b.y -= diff.bulletSpeed * frameScale; });

        // Alien shooting
        this.spawnAlienShots(delta);

        // Update alien bullets
        this.alienBullets = this.alienBullets.filter((b) => b.y < CANVAS_HEIGHT + b.height);
        this.alienBullets.forEach((b) => { b.y += b.speed * frameScale; });

        // Alien movement timing (formation speeds up as aliens die)
        this.alienMoveTimer += delta;
        const aliveAliens = AlienRules.aliveCount(this.aliens);
        if (this.alienMoveTimer > AlienRules.moveInterval(this.alienMoveInterval, aliveAliens)) {
            this.alienMoveTimer = 0;
            const moveDown = AlienRules.step(this.aliens, this.alienSpeed, this.alienDirection, CANVAS_WIDTH);
            if (moveDown) {
                this.alienDirection *= -1;
                AlienRules.drop(this.aliens, diff.alienDrop);
            }
            this.ports.sound.playAlienMove();
        }

        // Update UFOs
        this.updateUFOs(delta);

        // Collision: player bullets vs alien bullets
        for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
            const playerBullet = this.bullets[bi];
            for (let abi = this.alienBullets.length - 1; abi >= 0; abi--) {
                const alienBullet = this.alienBullets[abi];
                if (playerBullet.x < alienBullet.x + alienBullet.width &&
                    playerBullet.x + BULLET_WIDTH > alienBullet.x &&
                    playerBullet.y < alienBullet.y + alienBullet.height &&
                    playerBullet.y + BULLET_HEIGHT > alienBullet.y) {
                    this.bullets.splice(bi, 1);
                    this.alienBullets.splice(abi, 1);
                    this.explode(
                        alienBullet.x + alienBullet.width / 2,
                        alienBullet.y + alienBullet.height / 2,
                        '#fbbf24',
                        4
                    );
                    this.ports.sound.playBulletClash();
                    break;
                }
            }
        }

        // Collision: bullets vs aliens
        for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
            const b = this.bullets[bi];
            for (let ai = 0; ai < this.aliens.length; ai++) {
                const a = this.aliens[ai];
                if (!a.alive) continue;
                if (b.x < a.x + a.width && b.x + BULLET_WIDTH > a.x &&
                    b.y < a.y + a.height && b.y + BULLET_HEIGHT > a.y) {
                    a.alive = false;
                    this.bullets.splice(bi, 1);
                    this.awardScore(ALIEN_TYPES[a.type].points, { countsForCombo: true });
                    this.ports.sound.playExplosion();
                    this.explode(a.x + a.width / 2, a.y + a.height / 2, a.color);
                    break;
                }
            }
        }

        // Collision: bullets vs UFOs
        for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
            const b = this.bullets[bi];
            for (let ui = 0; ui < this.ufos.length; ui++) {
                const u = this.ufos[ui];
                if (!u.alive) continue;
                if (b.x < u.x + u.width && b.x + BULLET_WIDTH > u.x &&
                    b.y < u.y + u.height && b.y + BULLET_HEIGHT > u.y) {
                    u.alive = false;
                    this.bullets.splice(bi, 1);
                    this.awardScore(u.score);
                    this.ports.sound.playExplosion();
                    this.explode(u.x + u.width / 2, u.y + u.height / 2, '#fbbf24', 12);
                    this.ports.hud.showScoreFeedback(`+${u.score}`, '#fbbf24');
                    break;
                }
            }
        }

        // Collision: alien bullets vs player
        for (let bi = this.alienBullets.length - 1; bi >= 0; bi--) {
            const b = this.alienBullets[bi];
            if (b.x < this.playerX + PLAYER_WIDTH && b.x + b.width > this.playerX &&
                b.y < PLAYER_Y + PLAYER_HEIGHT && b.y + b.height > PLAYER_Y) {
                this.alienBullets.splice(bi, 1);
                if (this.gameTime < this.playerInvulnerabilityUntil) continue;

                this.playerInvulnerabilityUntil = this.gameTime + 700;
                this.resetCombo();
                this.explode(this.playerX + PLAYER_WIDTH / 2, PLAYER_Y + PLAYER_HEIGHT / 2, '#4ade80');
                this.lives--;
                this.updateUI();

                if (this.lives <= 0) {
                    this.handleGameOver();
                    return;
                }
                this.bullets = [];
            }
        }

        // Aliens reached the player line
        if (AlienRules.reachedBottom(this.aliens, PLAYER_Y)) {
            this.resetCombo();
            this.lives--;
            this.updateUI();
            if (this.lives <= 0) {
                this.handleGameOver();
                return;
            }
            this.bullets = [];
            this.alienBullets = [];
            this.playerInvulnerabilityUntil = this.gameTime + 700;
            this.resetAliens();
        }

        // Level complete
        if (AlienRules.allDefeated(this.aliens)) {
            this.completeLevel();
        }
    }

    completeLevel() {
        const clearedLevel = this.level;
        const levelBonus = Math.floor(
            LEVEL_BASE_SCORE * Math.pow(LEVEL_BONUS_MULTIPLIER, clearedLevel - 1)
        );
        const survivalBonus = this.lives * SURVIVAL_BONUS;

        this.score += levelBonus + survivalBonus;
        this.level += 1;
        this.resetCombo();
        this.ports.hud.showLevelBanner(`LEVEL ${this.level}  +${levelBonus + survivalBonus}`, '#4ade80');
        this.ports.hud.restartBoardAnimation('level-complete');
        this.updateUI();
        this.ports.hud.flashScore();
        this.resetAliens();
        this.bullets = [];
        this.alienBullets = [];
        this.ufos = [];
        this.scheduleNextUFO();
    }

    // ── Game over ──

    handleGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.isPaused = true;
        this.resetCombo();
        this.updatePauseControl();

        this.ports.hud.showGameOver({ score: this.score, level: this.level });
        this.refreshBest();

        const repository = this.ports.repository;
        const highScores = repository.getHighScores();
        const isNewBest = highScores.length === 0 || this.score > highScores[0].score;
        repository.saveHighScore(this.score);
        this.ports.hud.renderHighScores(repository.getHighScores());

        if (isNewBest && this.score > 0) {
            this.ports.hud.showNewHighScore();
            this.ports.sound.playNewHighScore();
        }

        this.ports.sound.playGameOver();
        this.ports.sound.fadeOutBgm(0.8);
    }
}
