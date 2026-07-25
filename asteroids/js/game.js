/**
 * Asteroids Game Engine
 */

// --- State Management ---
function readStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        // Storage can be unavailable in private browsing contexts.
    }
}

function sanitizePlayerName(value) {
    if (typeof value !== 'string') return 'Player';
    const name = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
    return name || 'Player';
}

function normalizeHighScores(value) {
    if (!Array.isArray(value)) return [];

    return value
        .filter((entry) => entry && Number.isFinite(Number(entry.score)))
        .map((entry) => ({
            score: Math.max(0, Math.floor(Number(entry.score))),
            name: sanitizePlayerName(entry.name),
            date: typeof entry.date === 'string' ? entry.date.slice(0, 40) : '',
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

function loadHighScores() {
    try {
        return normalizeHighScores(JSON.parse(readStorage(STORAGE_KEY, '[]')));
    } catch (error) {
        return [];
    }
}

const game = {
    canvas: null,
    ctx: null,
    width: GAME_CONFIG.canvasWidth,
    height: GAME_CONFIG.canvasHeight,

    state: 'MENU', // MENU, PLAYING, PAUSED, GAME_OVER

    difficulty: 'normal',
    currentConfig: null,

    score: 0,
    lives: GAME_CONFIG.lives,
    level: 1,
    playerName: sanitizePlayerName(readStorage(PLAYER_NAME_STORAGE, 'Player')),
    highScores: loadHighScores(),

    entities: {
        ship: null,
        asteroids: [],
        bullets: [],
        particles: []
    },

    lastTime: 0,

    // ── Difficulty Selection ──
    getSelectedConfig() {
        const diff = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
        return {
            ...GAME_CONFIG,
            ...diff,
        };
    },

    updateConfig() {
        this.currentConfig = this.getSelectedConfig();
    },

    init() {
        this.canvas = document.getElementById('asteroids-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Load saved difficulty
        const savedDiff = readStorage(DIFFICULTY_STORAGE);
        if (savedDiff && DIFFICULTY_PRESETS[savedDiff]) {
            this.difficulty = savedDiff;
        }

        this.updateConfig();

        this.setupInput();
        this.setupUI();

        window.requestAnimationFrame((t) => this.loop(t));
    },

    /**
     * Select difficulty and start game
     */
    setDifficulty(difficulty) {
        if (!DIFFICULTY_PRESETS[difficulty] || ['PLAYING', 'PAUSED'].includes(this.state)) return;

        this.difficulty = difficulty;
        writeStorage(DIFFICULTY_STORAGE, difficulty);
        this.updateConfig();
        this.updateDifficultyButtons();
    },

    updateDifficultyButtons() {
        Object.entries(DIFFICULTY_PRESETS).forEach(([key, preset]) => {
            const btn = document.querySelector(`[data-diff="${key}"]`);
            if (!btn) return;

            const selected = key === this.difficulty;
            btn.classList.toggle('active', selected);
            btn.style.borderColor = selected ? preset.color : 'rgba(255, 255, 255, 0.1)';
            btn.style.color = selected ? preset.color : '#c4b5d4';
        });
    },

    setupInput() {
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            if (e.key === 'r' || e.key === 'R') {
                if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'GAME_OVER') {
                    this.resetGame();
                }
            } else if (e.key === 'Escape') {
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    this.togglePause();
                }
            } else if (e.key === 'Enter') {
                if (this.state === 'MENU' || this.state === 'GAME_OVER') {
                    this.startGame();
                }
            }
        });
    },

    setupUI() {
        // UI elements
        const startBtn = document.getElementById('start-btn');
        const mainStartBtn = document.getElementById('main-start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const quickBtn = document.getElementById('quick-restart-btn');
        const highScoreValue = document.getElementById('best-score-value');

        // Load initial high score
        if (highScoreValue && this.highScores.length > 0) {
            highScoreValue.textContent = this.highScores[0].score;
        }

        // Start buttons
        if (startBtn) startBtn.addEventListener('click', () => this.startGame());
        if (mainStartBtn) mainStartBtn.addEventListener('click', () => this.startGame());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());
        if (quickBtn) quickBtn.addEventListener('click', () => this.resetGame());

        // Name Input
        const nameInput = document.getElementById('player-name');
        if (nameInput) {
            nameInput.value = this.playerName;
            nameInput.addEventListener('change', (e) => {
                this.playerName = sanitizePlayerName(e.target.value);
                e.target.value = this.playerName;
                writeStorage(PLAYER_NAME_STORAGE, this.playerName);
                this.displayPlayerName();
            });
        }

        this.displayPlayerName();

        // ── Sound Controls ──

        const muteBtn = document.getElementById('mute-btn');
        const volumeSlider = document.getElementById('volume-slider');
        const bgmMuteBtn = document.getElementById('bgm-mute-btn');

        function updateMuteIcon() {
            if (muteBtn) {
                muteBtn.textContent = SoundManager.getMuteState() || SoundManager.getVolume() === 0
                    ? '🔇' : '🔊';
            }
        }

       function updateMusicIcon() {
            if (bgmMuteBtn) {
                bgmMuteBtn.textContent = MusicPlayer.getMuteState() ? '🔇' : '🎵';
            }
        }

        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                SoundManager.toggleMute();
                updateMuteIcon();
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
            });
        }

        updateMuteIcon();
        updateMusicIcon();

        // ── Difficulty Buttons ──
        Object.entries(DIFFICULTY_PRESETS).forEach(([key, preset]) => {
            const btn = document.getElementById(`diff-btn-${key}`);
            if (btn) {
                btn.addEventListener('click', () => this.setDifficulty(key));
            }
        });
        this.updateDifficultyButtons();
    },

    /**
     * Display player name in the UI
     */
    displayPlayerName() {
        const playerNameDisplay = document.getElementById('player-display');
        const playerNameSpan = document.getElementById('current-player-name');
        if (playerNameDisplay) {
            playerNameDisplay.style.display = 'inline';
        }
        if (playerNameSpan) {
            playerNameSpan.textContent = this.playerName || 'Player';
        }
    },

    updateOverlay() {
        const overlay = document.getElementById('pause-overlay');
        const title = document.getElementById('overlay-title');
        const startBtn = document.getElementById('start-btn');
        const mainStartBtn = document.getElementById('main-start-btn');
        const quickRestartBtn = document.getElementById('quick-restart-btn');
        const stats = document.getElementById('game-over-stats');
        const scores = document.getElementById('high-scores-table');
        const nameInput = document.getElementById('player-name');
        const difficulty = document.getElementById('difficulty-selection');

        const isMenu = this.state === 'MENU';
        const isPaused = this.state === 'PAUSED';
        const isGameOver = this.state === 'GAME_OVER';

        if (overlay) overlay.style.display = this.state === 'PLAYING' ? 'none' : 'flex';
        if (title) title.textContent = isGameOver ? 'GAME OVER' : isPaused ? 'PAUSED' : 'ASTEROIDS';
        if (startBtn) startBtn.style.display = isMenu ? 'block' : 'none';
        if (mainStartBtn) mainStartBtn.style.display = isMenu ? 'block' : 'none';
        if (quickRestartBtn) quickRestartBtn.style.display = isGameOver ? 'flex' : 'none';
        if (stats) stats.style.display = isGameOver ? 'flex' : 'none';
        if (scores) scores.style.display = isGameOver && this.highScores.length ? 'block' : 'none';
        if (nameInput) nameInput.style.display = isMenu ? 'block' : 'none';
        if (difficulty) difficulty.style.display = isMenu ? 'block' : 'none';
    },

    startGame() {
        const config = this.currentConfig;

        this.state = 'PLAYING';
        this.score = 0;
        this.lives = config.lives;
        this.level = 1;
        this.entities.asteroids = [];
        this.entities.bullets = [];
        this.entities.particles = [];

        this.entities.ship = new Ship(config);
        this.spawnWave();
        this.lastTime = performance.now();
        this.updateHud();
        this.updateOverlay();
        this.displayPlayerName();

        MusicPlayer.start();
    },

    spawnWave() {
        const count = ASTEROID_INITIAL_COUNT + (this.level - 1) * EXTRA_ASTEROID_PER_LEVEL;
        for (let i = 0; i < count; i++) {
            this.spawnAsteroid('large');
        }
    },

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.updateOverlay();
            MusicPlayer.pause();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.lastTime = performance.now();
            this.updateOverlay();
            MusicPlayer.resume();
        }
    },

    resetGame() {
        this.state = 'MENU';
        this.score = 0;
        this.lives = this.currentConfig?.lives || GAME_CONFIG.lives;
        this.level = 1;
        this.displayPlayerName();

        // Clear everything
        this.entities.ship = null;
        this.entities.asteroids = [];
        this.entities.bullets = [];
        this.entities.particles = [];

        MusicPlayer.stop();
        this.updateHud();
        this.updateOverlay();
    },

    spawnAsteroid(type, atX = null, atY = null, target = this.entities.asteroids) {
        const size = type === 'large' ? ASTEROID_SIZE : (type === 'medium' ? ASTEROID_SIZE / 2 : ASTEROID_SIZE / 4);
        let asteroid = null;
        let safeSpawn = false;
        let attempts = 0;

        while (!safeSpawn && attempts < 10) {
            const x = atX !== null ? atX : Math.random() * game.width;
            const y = atY !== null ? atY : Math.random() * game.height;

            const ship = this.entities.ship;
            if (ship && atX === null) {
                const dist = Math.sqrt((x - ship.x) ** 2 + (y - ship.y) ** 2);
                // Ensure asteroid is at least 50px away from the ship's radius
                if (dist < ship.r + size + 50) {
                    attempts++;
                    continue;
                }
            }

            asteroid = new Asteroid(size, x, y, type, this.currentConfig);
            safeSpawn = true;
        }

        if (asteroid) {
            target.push(asteroid);
        }
    },

    splitAsteroid(asteroid, target) {
        const childType = asteroid.type === 'large' ? 'medium' : asteroid.type === 'medium' ? 'small' : null;
        if (!childType) return;

        this.spawnAsteroid(childType, asteroid.x, asteroid.y, target);
        this.spawnAsteroid(childType, asteroid.x, asteroid.y, target);
    },

    updateHud() {
        const scoreEl = document.getElementById('score');
        const livesEl = document.getElementById('lives');
        const levelEl = document.getElementById('level');
        const bestEl = document.getElementById('best-score-value');

        if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
        if (livesEl) livesEl.textContent = `Lives: ${this.lives}`;
        if (levelEl) levelEl.textContent = `Level: ${this.level}`;
        if (bestEl) bestEl.textContent = this.highScores[0]?.score || 0;
    },

    destroyAsteroid(asteroid, target, awardScore = true) {
        asteroid.hit();
        if (awardScore) this.score += SCORE_TABLE[asteroid.type] || 0;
        this.splitAsteroid(asteroid, target);
        createExplosion(asteroid.x, asteroid.y, asteroid.type);
        SoundManager.playExplosion();
    },

    update(dt) {
        const config = this.currentConfig;

        if (this.state !== 'PLAYING') return;

        // Update Ship
        this.entities.ship.update(dt, keys, config);
        if (isKeyActive('ArrowUp')) SoundManager.playThrust();

        // Update Bullets
        this.entities.bullets.forEach((bullet) => bullet.update(dt));
        this.entities.bullets = this.entities.bullets.filter((bullet) => !bullet.offscreen);

        // Resolve asteroid collisions separately so fragments are not lost during filtering.
        const survivors = [];
        const spawnedAsteroids = [];
        this.entities.asteroids.forEach((asteroid) => {
            if (asteroid.dead) return;
            asteroid.update(dt);

            for (const bullet of this.entities.bullets) {
                if (!bullet.active || bullet.offscreen || asteroid.dead) continue;
                if (!checkCollision(bullet, asteroid)) continue;

                bullet.offscreen = true;
                bullet.active = false;
                this.destroyAsteroid(asteroid, spawnedAsteroids);
            }

            if (!asteroid.dead && checkCollision(this.entities.ship, asteroid)) {
                if (this.entities.ship.invulnerable <= 0) {
                    this.handlePlayerHit(asteroid);
                }
                this.destroyAsteroid(asteroid, spawnedAsteroids, false);
            }

            if (!asteroid.dead) survivors.push(asteroid);
        });

        this.entities.asteroids = survivors.concat(spawnedAsteroids);
        this.entities.bullets = this.entities.bullets.filter((bullet) => !bullet.offscreen);

        // Ship wrap
        this.entities.ship.wrap(this.width, this.height);

        // A wave advances only after every asteroid and fragment is gone.
        if (this.entities.asteroids.length === 0) {
            this.level += 1;
            this.spawnWave();
            this.updateHud();
            const banner = document.getElementById('level-banner');
            if (banner) {
                banner.textContent = `LEVEL ${this.level}`;
                banner.style.display = 'block';
                setTimeout(() => { banner.style.display = 'none'; }, 1800);
            }
            SoundManager.playLevelUp();
        }

        // Update particles
        this.entities.particles = this.entities.particles.filter(p => {
            p.update(dt);
            return p.life > 0;
        });

        this.updateHud();
    },

    handlePlayerHit(asteroid) {
        SoundManager.playPlayerHit();
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.entities.ship = new Ship(this.currentConfig); // Respawn
        }

        // Visual effect
        this.updateHud();
    },

    gameOver() {
        this.state = 'GAME_OVER';
        SoundManager.playGameOver();

        const previousBest = this.highScores[0]?.score || 0;
        const qualifies = this.score > 0 && (
            this.highScores.length < 5 ||
            this.score >= this.highScores[this.highScores.length - 1].score
        );

        if (qualifies) {
            this.highScores = normalizeHighScores([...this.highScores, {
                score: this.score,
                name: sanitizePlayerName(this.playerName),
                date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
            }]);
            writeStorage(STORAGE_KEY, JSON.stringify(this.highScores));

            if (this.score > previousBest) {
                const existingNotice = document.getElementById('new-highscore-notice');
                if (existingNotice) existingNotice.remove();
                const notice = document.createElement('div');
                notice.id = 'new-highscore-notice';
                notice.textContent = '¡NUEVO RÉCORD!';
                document.body.appendChild(notice);
                setTimeout(() => notice.remove(), 3000);
                SoundManager.playNewHighScore();
            }
        }

        MusicPlayer.stop();
        const finalScore = document.getElementById('final-score');
        const finalLevel = document.getElementById('final-level');
        if (finalScore) finalScore.textContent = `Score: ${this.score}`;
        if (finalLevel) finalLevel.textContent = `Level: ${this.level}`;
        this.renderHighScores();
        this.updateHud();
        this.updateOverlay();
    },

    renderHighScores() {
        const table = document.getElementById('high-scores-list');
        if (!table) return;

        table.replaceChildren();
        this.highScores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.className = `hs-row-${index + 1}`;

            const rank = document.createElement('td');
            rank.className = 'hs-rank';
            rank.textContent = String(index + 1);

            const name = document.createElement('td');
            name.className = `hs-name ${this.getMedalClass(entry.name, entry.score)}`;
            name.textContent = entry.name;

            const score = document.createElement('td');
            score.className = 'hs-score';
            score.textContent = String(entry.score);

            const date = document.createElement('td');
            date.className = 'hs-date';
            date.textContent = entry.date;

            row.append(rank, name, score, date);
            table.appendChild(row);
        });
    },

    /**
     * Helper: Get medal class based on score and name (easter egg)
     */
    getMedalClass(name, score) {
        const nameLower = sanitizePlayerName(name).toLowerCase().replace(/\s/g, '');
        if (nameLower === 'jsnof' || nameLower === 'jonsnow' || nameLower === 'jon') {
            return 'hs-gold'; // Easter egg
        }
        if (score >= 50000) return 'hs-gold';
        if (score >= 20000) return 'hs-silver';
        if (score >= 5000) return 'hs-bronze';
        return 'hs-none';
    },

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Entities
        if (this.entities.ship) this.entities.ship.draw(this.ctx);
        this.entities.bullets.forEach(b => b.draw(this.ctx));
        this.entities.asteroids.forEach(a => a.draw(this.ctx));
        this.entities.particles.forEach(p => p.draw(this.ctx));

        // UI overlay
        this.updateHud();
    },

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }
        this.draw();

        window.requestAnimationFrame((t) => this.loop(t));
    }
};

// ── Classes ──

class Ship {
    constructor(config) {
        this.x = game.width / 2;
        this.y = game.height / 2;
        this.r = 15;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.rotation = 0;
        this.thrusting = false;
        this.invulnerable = config.invulnTime / 1000;
        this.fireCooldown = 0;
        this.config = config;
    }

    update(dt, keys, config) {
        const frameScale = dt * 60;
        this.thrusting = isKeyActive('ArrowUp');

        if (isKeyActive('ArrowLeft')) this.rotation = -config.rotationSpeed;
        else if (isKeyActive('ArrowRight')) this.rotation = config.rotationSpeed;
        else this.rotation = 0;

        this.angle += this.rotation * dt;

        if (this.thrusting) {
            this.vx += Math.cos(this.angle) * config.thrust * frameScale;
            this.vy += Math.sin(this.angle) * config.thrust * frameScale;
        }

        const friction = Math.pow(config.friction, frameScale);
        this.vx *= friction;
        this.vy *= friction;

        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;

        this.invulnerable = Math.max(0, this.invulnerable - dt);
        this.fireCooldown = Math.max(0, this.fireCooldown - dt);

        const activeBullets = game.entities.bullets.filter((bullet) => bullet.active).length;
        if (isKeyActive('Space') && this.fireCooldown <= 0 && activeBullets < config.maxBullets) {
            game.entities.bullets.push(new Bullet(this.x, this.y, this.angle, config));
            this.fireCooldown = config.fireRate / 1000;
            SoundManager.playShoot();
        }
    }

    wrap(w, h) {
        if (this.x < -this.r) this.x = w + this.r;
        else if (this.x > w + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = h + this.r;
        else if (this.y > h + this.r) this.y = -this.r;
    }

    draw(ctx) {
        if (Math.floor(this.invulnerable * 60) % 4 > 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.strokeStyle = GAME_CONFIG.shipColor;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = GAME_CONFIG.shipColor;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, -10);
        ctx.closePath();
        ctx.stroke();

        // Thrust flame
        if (this.thrusting) {
            const flameLength = 15 + Math.random() * 10;
            ctx.strokeStyle = '#fbbf24';
            ctx.shadowColor = '#fbbf24';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(-7, 0);
            ctx.lineTo(-flameLength, 0);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Asteroid {
    constructor(radius, x, y, type = 'medium', config = GAME_CONFIG) {
        this.x = x ?? (Math.random() * game.width);
        this.y = y ?? (Math.random() * game.height);
        this.r = radius || (type === 'large' ? ASTEROID_SIZE : (type === 'medium' ? ASTEROID_SIZE / 2 : ASTEROID_SIZE / 4));
        this.type = type;

        const speed = config.asteroidMinSpeed + Math.random() * (config.asteroidMaxSpeed - config.asteroidMinSpeed);
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.05;
        this.dead = false;
    }

    update(dt) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        this.rotation += this.rotSpeed * frameScale;

        if (this.x < -this.r) this.x = game.width + this.r;
        else if (this.x > game.width + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = game.height + this.r;
        else if (this.y > game.height + this.r) this.y = -this.r;
    }

    hit() {
        this.dead = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.strokeStyle = GAME_CONFIG.asteroidColors[Math.floor(Math.random() * 3)];
        ctx.lineWidth = this.type === 'large' ? 3 : (this.type === 'medium' ? 2 : 1);
        ctx.shadowBlur = this.type === 'large' ? 10 : (this.type === 'medium' ? 6 : 3);
        ctx.shadowColor = ctx.strokeStyle;

        ctx.beginPath();
        const points = this.type === 'large' ? 12 : (this.type === 'medium' ? 10 : 8);
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const mut = 0.6 + Math.random() * 0.4;
            const px = Math.cos(angle) * this.r * mut;
            const py = Math.sin(angle) * this.r * mut;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        if (this.type === 'large') {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2 + this.rotation;
                const cratX = Math.cos(angle) * this.r * 0.5;
                const cratY = Math.sin(angle) * this.r * 0.5;
                ctx.beginPath();
                ctx.arc(cratX, cratY, this.r * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, angle, config) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * config.bulletSpeed;
        this.vy = Math.sin(angle) * config.bulletSpeed;
        this.life = config.bulletLifetime / 60;
        this.offscreen = false;
        this.active = true;
        this.owner = 'ship';
    }

    update(dt) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        this.life -= dt;
        if (this.life <= 0 || this.x < 0 || this.x > game.width || this.y < 0 || this.y > game.height) {
            this.offscreen = true;
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createExplosion(x, y, type) {
    const count = type === 'large' ? 16 : (type === 'medium' ? 12 : 8);
    for (let i = 0; i < count; i++) {
        game.entities.particles.push(new Particle(x, y, type));
    }
}

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = (50 + Math.random() * 30) / 60;
        this.maxLife = this.life;

        if (type === 'large') {
            this.color = '#fff';
            this.size = 3;
        } else if (type === 'medium') {
            this.color = '#fbbf24';
            this.size = 2.5;
        } else {
            this.color = '#f6e05e';
            this.size = 2;
        }
    }

    update(dt) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        this.life -= dt;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.r || 2) + (obj2.r || 2);
}

// Init
window.onload = () => game.init();
