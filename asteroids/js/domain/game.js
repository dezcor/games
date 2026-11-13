/**
 * AsteroidsGame: pure domain state machine.
 * Receives every side effect through ports (repository, sound, effects, renderer, ui,
 * input, clock, random). No DOM, localStorage, audio, canvas, or direct time/randomness.
 */
class AsteroidsGame {
    constructor(config, ports) {
        this.width = config.width;
        this.height = config.height;
        this.repository = ports.repository;
        this.sound = ports.sound;
        this.effects = ports.effects;
        this.renderer = ports.renderer;
        this.ui = ports.ui;
        this.input = ports.input;
        this.clock = ports.clock;
        this.random = ports.random;

        this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAME_OVER
        this.difficulty = 'normal';
        this.currentConfig = Difficulty.configFor(this.difficulty);

        this.score = 0;
        this.lives = GAME_CONFIG.lives;
        this.level = 1;
        this.playerName = ScoreRules.DEFAULT_NAME;
        this.highScores = [];
        this.shipSkin = DEFAULT_SHIP_SKIN;
        this.achievements = {};

        this.achievementState = {
            ufoDestroyed: false,
            powerupCollected: false,
            hyperspaceSafe: false,
            maxLevel: 1,
            maxScore: 0,
        };

        this.shipEffects = { shield: 0, double: 0 };

        this.entities = {
            ship: null,
            asteroids: [],
            bullets: [],
            powerups: [],
            ufo: null,
            ufoBullets: [],
        };

        this.lastTime = 0;
        this.lastUfoSpawn = 0;
        this.nextUfoDelay = UfoRules.rollDelay(1, this.random);
        this.lastIntensity = 0;
    }

    // ── Persisted state ──
    load() {
        const repo = this.repository;
        this.highScores = repo.loadHighScores();
        this.playerName = ScoreRules.sanitizePlayerName(repo.loadPlayerName());
        this.shipSkin = ShipSkins.resolve(repo.loadShipSkin());
        this.achievements = repo.loadAchievements();
        const savedDifficulty = repo.loadDifficulty();
        if (Difficulty.isValid(savedDifficulty)) this.difficulty = savedDifficulty;
        this.updateConfig();
    }

    // Pushes the current HUD, power-up bar, and overlay to the UI (first paint).
    refresh() {
        this.syncHud();
        this.syncPowerupHud();
        this.ui.setOverlay(this.state);
    }

    updateConfig() {
        this.currentConfig = Difficulty.configFor(this.difficulty);
    }

    // ── Menu settings ──
    setDifficulty(key) {
        if (!Difficulty.isValid(key) || ['PLAYING', 'PAUSED'].includes(this.state)) return false;
        this.difficulty = key;
        this.repository.saveDifficulty(key);
        this.updateConfig();
        return true;
    }

    setShipSkin(id) {
        if (!ShipSkins.isValid(id)) return false;
        this.shipSkin = id;
        this.repository.saveShipSkin(id);
        return true;
    }

    setPlayerName(raw) {
        this.playerName = ScoreRules.sanitizePlayerName(raw);
        this.repository.savePlayerName(this.playerName);
        return this.playerName;
    }

    // ── Lifecycle ──
    startGame() {
        const config = this.currentConfig;

        this.state = 'PLAYING';
        this.score = 0;
        this.lives = config.lives;
        this.level = 1;
        this.achievementState.maxScore = 0;
        this.achievementState.maxLevel = 1;
        this.shipEffects.shield = 0;
        this.shipEffects.double = 0;
        this.entities.asteroids = [];
        this.entities.bullets = [];
        this.entities.powerups = [];
        this.entities.ufo = null;
        this.entities.ufoBullets = [];
        this.effects.clear();
        this.lastUfoSpawn = 0;
        this.nextUfoDelay = this.rollUfoDelay();
        this.lastIntensity = -1;

        this.entities.ship = new Ship(config, this.width, this.height);
        this.spawnWave();
        this.lastTime = this.clock.now();
        this.syncHud();
        this.syncPowerupHud();
        this.ui.setOverlay(this.state);

        this.sound.startMusic();
        this.sound.setMusicIntensity(0);
        this.sound.setUfoMusicActive(false);
    }

    resetGame() {
        this.state = 'MENU';
        this.score = 0;
        this.lives = this.currentConfig.lives || GAME_CONFIG.lives;
        this.level = 1;
        this.achievementState.maxScore = 0;
        this.achievementState.maxLevel = 1;
        this.shipEffects.shield = 0;
        this.shipEffects.double = 0;

        this.entities.ship = null;
        this.entities.asteroids = [];
        this.entities.bullets = [];
        this.entities.powerups = [];
        this.entities.ufo = null;
        this.entities.ufoBullets = [];
        this.effects.clear();

        this.sound.stopMusic();
        this.sound.setMusicIntensity(0);
        this.sound.setUfoMusicActive(false);
        this.syncHud();
        this.syncPowerupHud();
        this.ui.setOverlay(this.state);
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.ui.setOverlay(this.state);
            this.sound.pauseMusic();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.lastTime = this.clock.now();
            this.ui.setOverlay(this.state);
            this.sound.resumeMusic();
        }
    }

    // One rAF tick. timestamp is the frame clock in ms; dt is clamped to 50 ms.
    frame(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }
        this.renderer.draw(this.view());
        this.syncHud();
    }

    view() {
        return {
            width: this.width,
            height: this.height,
            state: this.state,
            ship: this.entities.ship,
            asteroids: this.entities.asteroids,
            bullets: this.entities.bullets,
            ufo: this.entities.ufo,
            ufoBullets: this.entities.ufoBullets,
            powerups: this.entities.powerups,
            shipEffects: this.shipEffects,
            shipColor: ShipSkins.colorOf(this.shipSkin),
        };
    }

    rollUfoDelay() {
        return UfoRules.rollDelay(this.level, this.random);
    }

    // ── Spawning ──
    spawnWave() {
        const count = ASTEROID_INITIAL_COUNT + (this.level - 1) * EXTRA_ASTEROID_PER_LEVEL;
        for (let i = 0; i < count; i++) {
            this.spawnAsteroid('large');
        }
    }

    // Free spawns (atX === null) retry away from the ship; splits pass explicit coordinates.
    spawnAsteroid(type, atX = null, atY = null, target = this.entities.asteroids) {
        const size = AsteroidRules.radiusOf(type);
        let asteroid = null;
        let safeSpawn = false;
        let attempts = 0;

        while (!safeSpawn && attempts < 10) {
            const x = atX !== null ? atX : this.random.next() * this.width;
            const y = atY !== null ? atY : this.random.next() * this.height;

            const ship = this.entities.ship;
            if (ship && atX === null) {
                const dist = Math.sqrt((x - ship.x) ** 2 + (y - ship.y) ** 2);
                if (dist < ship.r + size + 50) {
                    attempts++;
                    continue;
                }
            }

            asteroid = new Asteroid(size, x, y, type, this.currentConfig, this.random);
            safeSpawn = true;
        }

        if (asteroid) {
            target.push(asteroid);
        }
    }

    spawnPowerup(x, y) {
        this.entities.powerups.push(PowerUpRules.spawnAt(x, y, this.random));
        this.sound.playPowerupSpawn();
    }

    trySpawnPowerup(asteroid) {
        if (PowerUpRules.shouldDrop(asteroid.type, this.random)) {
            this.spawnPowerup(asteroid.x, asteroid.y);
        }
    }

    splitAsteroid(asteroid, target) {
        const childType = AsteroidRules.childTypeOf(asteroid.type);
        if (!childType) return;

        this.spawnAsteroid(childType, asteroid.x, asteroid.y, target);
        this.spawnAsteroid(childType, asteroid.x, asteroid.y, target);
    }

    // ── HUD sync (the UI adapter diffs and renders) ──
    syncHud() {
        this.ui.setHud({
            score: this.score,
            lives: this.lives,
            level: this.level,
            best: this.highScores[0]?.score || 0,
        });
    }

    syncPowerupHud() {
        this.ui.setPowerupHud({
            shield: this.shipEffects.shield,
            double: this.shipEffects.double,
        });
    }

    // ── Combat ──
    destroyAsteroid(asteroid, target, awardScore = true) {
        asteroid.hit();
        if (awardScore) this.score += SCORE_TABLE[asteroid.type] || 0;
        this.splitAsteroid(asteroid, target);
        this.trySpawnPowerup(asteroid);
        this.effects.explode(asteroid.x, asteroid.y, asteroid.type);
        this.sound.playExplosion();
    }

    destroyUfo(ufo) {
        if (!ufo || ufo.dead) return;
        ufo.dead = true;
        this.score += SCORE_TABLE[`ufo${ufo.size.charAt(0).toUpperCase()}${ufo.size.slice(1)}`] || 0;
        this.achievementState.ufoDestroyed = true;
        this.effects.explode(ufo.x, ufo.y, 'large');
        this.sound.playUfoExplode();
        if (this.entities.ufo === ufo) {
            this.entities.ufo = null;
            this.sound.setUfoMusicActive(false);
        }
        this.syncHud();
        this.checkAchievements();
    }

    // Callers check the PLAYING state. A 10 % self-destruct risk applies on every attempt.
    tryHyperspace() {
        const ship = this.entities.ship;
        if (!ship) return;
        const now = this.clock.now();
        if (!HyperspaceRules.isReady(ship, now)) {
            this.sound.playHyperspaceFail();
            return;
        }
        ship.lastHyperspace = now;

        if (this.random.next() < HYPERSPACE_SELF_DESTRUCT_CHANCE) {
            this.sound.playHyperspace();
            this.handlePlayerHit();
            return;
        }

        const dest = HyperspaceRules.findSafeDestination(
            this.entities.asteroids, this.entities.ufo, this.width, this.height, this.random
        );
        if (!dest) {
            this.sound.playHyperspaceFail();
            return;
        }

        this.sound.playHyperspace();
        ship.x = dest.x;
        ship.y = dest.y;
        ship.vx = 0;
        ship.vy = 0;
        ship.invulnerable = Math.max(ship.invulnerable, HYPERSPACE_REENTRY_INVULN);
        ship.hyperspaceCooldownUntil = now + HYPERSPACE_COOLDOWN;
        this.achievementState.hyperspaceSafe = true;
        this.effects.flash(ship.x, ship.y, '#ffffff', 0.15);
        this.checkAchievements();
    }

    applyPowerup(type) {
        this.sound.playPowerupPickup();
        this.score += SCORE_TABLE.powerup || 0;
        this.achievementState.powerupCollected = true;
        this.syncHud();
        this.checkAchievements();
        if (type === 'shield') {
            this.shipEffects.shield = POWERUP_TYPES.shield.duration;
        } else if (type === 'double') {
            this.shipEffects.double = POWERUP_TYPES.double.duration;
        } else if (type === 'life') {
            this.lives = Math.min(MAX_LIVES, this.lives + 1);
            this.syncHud();
        }
        this.syncPowerupHud();
    }

    trySpawnUfo(dt) {
        if (this.entities.ufo || this.state !== 'PLAYING') return;
        this.lastUfoSpawn += dt;
        if (this.lastUfoSpawn < this.nextUfoDelay) return;

        const size = UfoRules.chooseSize(this.level, this.random);
        const fromLeft = this.random.next() < 0.5;
        this.entities.ufo = new Ufo(size, fromLeft, this.width, this.height, this.random);
        this.lastUfoSpawn = 0;
        this.nextUfoDelay = this.rollUfoDelay();
        this.sound.setUfoMusicActive(true);
        this.sound.playUFO();
    }

    updateBgmIntensity() {
        const largeCount = this.entities.asteroids.filter((a) => a.type === 'large').length;
        const intensity = getBgmIntensity(this.level, largeCount, !!this.entities.ufo);
        if (intensity !== this.lastIntensity) {
            this.sound.setMusicIntensity(intensity);
            this.lastIntensity = intensity;
        }
    }

    // ── One simulation step (dt in seconds) ──
    update(dt) {
        const config = this.currentConfig;
        if (this.state !== 'PLAYING') return;

        // Ship
        const shots = this.entities.ship.update(dt, config, {
            left: this.input.isActive('ArrowLeft'),
            right: this.input.isActive('ArrowRight'),
            thrust: this.input.isActive('ArrowUp'),
            fire: this.input.isActive('Space'),
        }, this.entities.bullets.filter((b) => b.active).length, this.shipEffects.double > 0);

        if (shots.length > 0) {
            shots.forEach((angle) => {
                this.entities.bullets.push(new Bullet(this.entities.ship.x, this.entities.ship.y, angle, config));
            });
            this.sound.playShoot();
        }

        if (this.input.isActive('ArrowUp')) {
            this.sound.playThrust();
            this.effects.thrust(this.entities.ship);
        }

        // Ship power-up timers
        if (this.shipEffects.shield > 0) {
            this.shipEffects.shield = Math.max(0, this.shipEffects.shield - dt);
        }
        if (this.shipEffects.double > 0) {
            this.shipEffects.double = Math.max(0, this.shipEffects.double - dt);
        }

        // Bullets
        this.entities.bullets.forEach((bullet) => bullet.update(dt, this.width, this.height));
        this.entities.bullets = this.entities.bullets.filter((bullet) => !bullet.offscreen);

        // Power-ups
        this.entities.powerups.forEach((p) => p.update(dt));
        this.entities.powerups = this.entities.powerups.filter((p) => !p.dead);

        // UFO + UFO bullets
        if (this.entities.ufo) {
            const shot = this.entities.ufo.update(dt, this.entities.ship, this.random, this.width);
            if (shot) {
                this.entities.ufoBullets.push(shot);
                this.sound.playUfoShoot();
            }
            if (this.entities.ufo.dead) {
                this.entities.ufo = null;
                this.sound.setUfoMusicActive(false);
            }
        }
        this.entities.ufoBullets.forEach((b) => b.update(dt, this.width, this.height));
        this.entities.ufoBullets = this.entities.ufoBullets.filter((b) => !b.offscreen);

        // Asteroid collisions
        const survivors = [];
        const spawnedAsteroids = [];
        this.entities.asteroids.forEach((asteroid) => {
            if (asteroid.dead) return;
            asteroid.update(dt, this.width, this.height);

            for (const bullet of this.entities.bullets) {
                if (!bullet.active || bullet.offscreen || asteroid.dead) continue;
                if (!CollisionRules.overlaps(bullet, asteroid)) continue;

                bullet.offscreen = true;
                bullet.active = false;
                this.destroyAsteroid(asteroid, spawnedAsteroids);
            }

            // Ship vs asteroid
            if (!asteroid.dead && this.entities.ship && CollisionRules.overlaps(this.entities.ship, asteroid)) {
                if (this.entities.ship.invulnerable <= 0) {
                    if (this.shipEffects.shield > 0) {
                        // Shield absorbs the hit, asteroid is destroyed, shield consumed
                        this.shipEffects.shield = 0;
                        this.entities.ship.invulnerable = 0.5;
                        this.syncPowerupHud();
                        this.destroyAsteroid(asteroid, spawnedAsteroids, false);
                        this.sound.playExplosion();
                    } else {
                        this.handlePlayerHit();
                        this.destroyAsteroid(asteroid, spawnedAsteroids, false);
                    }
                } else {
                    this.destroyAsteroid(asteroid, spawnedAsteroids, false);
                }
            }

            if (!asteroid.dead) survivors.push(asteroid);
        });

        // Ship vs power-up
        if (this.entities.ship) {
            this.entities.powerups.forEach((p) => {
                if (p.dead) return;
                if (CollisionRules.overlaps(this.entities.ship, p)) {
                    p.dead = true;
                    this.applyPowerup(p.type);
                }
            });
        }

        // Ship vs UFO bullets
        if (this.entities.ship && this.entities.ship.invulnerable <= 0 && this.shipEffects.shield <= 0) {
            this.entities.ufoBullets.forEach((b) => {
                if (b.offscreen) return;
                if (CollisionRules.overlaps(this.entities.ship, b)) {
                    b.offscreen = true;
                    this.handlePlayerHit();
                }
            });
        } else if (this.entities.ship) {
            // Shield absorbs UFO bullet
            this.entities.ufoBullets.forEach((b) => {
                if (b.offscreen) return;
                if (this.shipEffects.shield > 0 && CollisionRules.overlaps(this.entities.ship, b)) {
                    b.offscreen = true;
                    this.shipEffects.shield = 0;
                    this.syncPowerupHud();
                    this.sound.playExplosion();
                }
            });
        }

        // Ship vs UFO
        if (this.entities.ship && this.entities.ufo && CollisionRules.overlaps(this.entities.ship, this.entities.ufo)) {
            if (this.entities.ship.invulnerable <= 0) {
                if (this.shipEffects.shield > 0) {
                    this.shipEffects.shield = 0;
                    this.syncPowerupHud();
                    this.destroyUfo(this.entities.ufo);
                    this.sound.playExplosion();
                } else {
                    this.handlePlayerHit();
                    this.destroyUfo(this.entities.ufo);
                }
            }
        }

        // Bullets vs UFO
        if (this.entities.ufo) {
            const ufo = this.entities.ufo;
            this.entities.bullets.forEach((bullet) => {
                if (!bullet.active || bullet.offscreen) return;
                if (CollisionRules.overlaps(bullet, ufo)) {
                    bullet.offscreen = true;
                    bullet.active = false;
                    this.destroyUfo(ufo);
                }
            });
        }

        // UFO vs asteroid (UFO dies on contact)
        if (this.entities.ufo) {
            const ufo = this.entities.ufo;
            for (const a of this.entities.asteroids) {
                if (a.dead) continue;
                if (CollisionRules.overlaps(ufo, a)) {
                    a.hit();
                    this.destroyUfo(ufo);
                    break;
                }
            }
        }

        this.entities.asteroids = survivors.concat(spawnedAsteroids);
        this.entities.bullets = this.entities.bullets.filter((bullet) => !bullet.offscreen);
        this.entities.powerups = this.entities.powerups.filter((p) => !p.dead);
        this.entities.ufoBullets = this.entities.ufoBullets.filter((b) => !b.offscreen);

        // Wrap
        if (this.entities.ship) this.entities.ship.wrap(this.width, this.height);
        this.entities.powerups.forEach((p) => p.wrap(this.width, this.height));
        if (this.entities.ufo) this.entities.ufo.wrap(this.width, this.height);

        // A wave advances only after every asteroid and fragment is gone.
        if (this.entities.asteroids.length === 0) {
            this.level += 1;
            if (this.level > this.achievementState.maxLevel) {
                this.achievementState.maxLevel = this.level;
            }
            this.spawnWave();
            this.syncHud();
            this.checkAchievements();
            this.ui.showLevelBanner(this.level);
            this.sound.playLevelUp();
        }

        if (this.score > this.achievementState.maxScore) {
            this.achievementState.maxScore = this.score;
            this.checkAchievements();
        }

        // Particles and flashes (the effects adapter applies its own cap)
        this.effects.update(dt);

        this.trySpawnUfo(dt);
        this.updateBgmIntensity();

        if ((this.shipEffects.shield > 0) || (this.shipEffects.double > 0)) {
            this.syncPowerupHud();
        }

        this.syncHud();
    }

    handlePlayerHit() {
        this.sound.playPlayerHit();
        if (this.entities.ship) this.effects.playerExplosion(this.entities.ship);
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.entities.ship = new Ship(this.currentConfig, this.width, this.height);
        }

        this.syncHud();
    }

    gameOver() {
        this.state = 'GAME_OVER';
        this.sound.playGameOver();

        const previousBest = this.highScores[0]?.score || 0;
        let newRecord = false;
        if (ScoreRules.qualifies(this.highScores, this.score)) {
            this.highScores = ScoreRules.addEntry(this.highScores, this.score, this.playerName, this.clock.dateLabel());
            this.repository.saveHighScores(this.highScores);
            if (this.score > previousBest) {
                newRecord = true;
                this.sound.playNewHighScore();
            }
        }

        this.sound.stopMusic();
        this.sound.setMusicIntensity(0);
        this.sound.setUfoMusicActive(false);

        this.ui.showGameOver({
            score: this.score,
            level: this.level,
            highScores: this.highScores,
            newRecord,
        });
        this.syncHud();
        this.syncPowerupHud();
        this.ui.setOverlay(this.state);
    }

    // ── Achievements ──
    checkAchievements() {
        if (this.state !== 'PLAYING' && this.state !== 'GAME_OVER') return;
        const newly = AchievementRules.unlockNew(this.achievements, this.achievementState, this.clock.isoNow());
        if (newly.length > 0) this.repository.saveAchievements(this.achievements);
        this.ui.setAchievements(this.achievements, newly);
    }
}
