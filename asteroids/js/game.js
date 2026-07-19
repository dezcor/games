/**
 * Asteroids Game Engine
 */

// --- State Management ---
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
    playerName: localStorage.getItem(PLAYER_NAME_STORAGE) || 'Player',
    highScores: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),

    entities: {
        ship: null,
        asteroids: [],
        bullets: [],
        particles: []
    },

    lastTime: 0,

    // ── Difficulty Selection ──
    getSelectedConfig() {
        const diff = DIFFICULTY_PRESETS[this.difficulty];
        return {
            ...diff,
            ...GAME_CONFIG,
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
        const savedDiff = localStorage.getItem(DIFFICULTY_STORAGE);
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
        this.difficulty = difficulty;
        localStorage.setItem(DIFFICULTY_STORAGE, difficulty);
        this.updateConfig();

        // Update difficulty button visual state
        Object.entries(DIFFICULTY_PRESETS).forEach(([key, preset]) => {
            const btn = document.querySelector(`[data-diff="${key}"]`);
            if (btn) {
                if (key === difficulty) {
                    btn.classList.add('active');
                    btn.style.borderColor = preset.color;
                    btn.style.color = preset.color;
                } else {
                    btn.classList.remove('active');
                    btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    btn.style.color = '#c4b5d4';
                }
            }
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
        if (this.highScores.length > 0) {
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
            nameInput.addEventListener('change', (e) => {
                this.playerName = e.target.value.trim() || 'Player';
                localStorage.setItem(PLAYER_NAME_STORAGE, this.playerName);
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

    startGame() {
        const config = this.currentConfig;

        this.state = 'PLAYING';
        this.score = 0;
        this.lives = config.lives;
        this.entities.asteroids = [];
        this.entities.bullets = [];
        this.entities.particles = [];

        this.entities.ship = new Ship(config);

        // Initial Asteroids
        for (let i = 0; i < 5; i++) {
            this.spawnAsteroid('large');
        }

        document.getElementById('pause-overlay').style.display = 'none';
        document.getElementById('start-btn').style.display = 'none';
        const mainStartBtn = document.getElementById('main-start-btn');
        if (mainStartBtn) mainStartBtn.style.display = 'none';
        document.getElementById('player-name').style.display = 'none';
        this.displayPlayerName();

        MusicPlayer.start();
    },

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            document.getElementById('pause-overlay').style.display = 'flex';
            MusicPlayer.pause();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            document.getElementById('pause-overlay').style.display = 'none';
            MusicPlayer.resume();
        }
    },

    resetGame() {
        this.state = 'MENU';
        document.getElementById('start-btn').style.display = 'block';
        const mainStartBtn = document.getElementById('main-start-btn');
        if (mainStartBtn) mainStartBtn.style.display = 'block';
        document.getElementById('player-name').style.display = 'block';
        document.getElementById('quick-restart-btn').style.display = 'none';
        this.displayPlayerName();

        // Clear everything
        this.entities.ship = null;
        this.entities.asteroids = [];
        this.entities.bullets = [];
        this.entities.particles = [];

        MusicPlayer.stop();
    },

    spawnAsteroid(type, atX = null, atY = null) {
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
            this.entities.asteroids.push(asteroid);
        }
    },

    update(dt) {
        const config = this.currentConfig;

        if (this.state !== 'PLAYING') return;

        // Update Ship
        this.entities.ship.update(dt, keys, config);
        if (isKeyActive('ArrowUp')) SoundManager.playThrust();

        // Update Bullets
        this.entities.bullets = this.entities.bullets.filter(b => {
            b.update(dt);
            return !b.offscreen;
        });

        // Update Asteroids
        this.entities.asteroids = this.entities.asteroids.filter(a => {
            a.update(dt);

            // Bullet collisions
            this.entities.bullets.forEach(b => {
                if (checkCollision(b, a)) {
                    a.hit();
                    b.offscreen = true;
                    this.score += 10;
                    document.getElementById('score').textContent = `Score: ${this.score}`;

                    // Break asteroid
                    if (a.type === 'large') {
                        this.spawnAsteroid('medium', a.x, a.y);
                        this.spawnAsteroid('medium', a.x, a.y);
                    } else if (a.type === 'medium') {
                        this.spawnAsteroid('small', a.x, a.y);
                        this.spawnAsteroid('small', a.x, a.y);
                    }

                    createExplosion(a.x, a.y, a.type);
                    SoundManager.playExplosion();
                }
            });

            // Ship collisions
            if (checkCollision(this.entities.ship, a)) {
                if (this.entities.ship.invulnerable > 0) {
                    a.hit();
                    if (a.type === 'large') {
                        this.spawnAsteroid('medium', a.x, a.y);
                        this.spawnAsteroid('medium', a.x, a.y);
                    } else if (a.type === 'medium') {
                        this.spawnAsteroid('small', a.x, a.y);
                        this.spawnAsteroid('small', a.x, a.y);
                    }
                    createExplosion(a.x, a.y, a.type);
                    SoundManager.playExplosion();
                } else {
                    this.handlePlayerHit(a);
                }
            }

            return !a.dead;
        });

        // Ship wrap
        this.entities.ship.wrap(this.width, this.height);

        // Spawn new asteroids if empty
        if (this.entities.asteroids.length < 3) {
            this.spawnAsteroid('large');
        }

        // Update particles
        this.entities.particles = this.entities.particles.filter(p => {
            p.update(dt);
            return p.life > 0;
        });
    },

    handlePlayerHit(asteroid) {
        SoundManager.playExplosion();
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.entities.ship = new Ship(this.currentConfig); // Respawn
        }

        // Visual effect
        document.getElementById('lives').textContent = `Lives: ${this.lives}`;
    },

    gameOver() {
        this.state = 'GAME_OVER';
        SoundManager.playGameOver();

        // Save High Score
        const currentHigh = this.highScores[0]?.score || 0;
        if (this.score > currentHigh) {
            this.highScores.unshift({
                score: this.score,
                name: this.playerName,
                date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
            });
            this.highScores = this.highScores.slice(0, 5);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.highScores));

            // Show High Score Notice
            const notice = document.createElement('div');
            notice.id = 'new-highscore-notice';
            notice.textContent = '¡NUEVO RÉCORD!';
            document.body.appendChild(notice);
            setTimeout(() => notice.remove(), 3000);
        }

        document.getElementById('pause-overlay').style.display = 'flex';
        document.getElementById('game-over-stats').style.display = 'flex';
        document.getElementById('final-score').textContent = `Score: ${this.score}`;
        document.getElementById('quick-restart-btn').style.display = 'block';

        // Render scores with medals
        const table = document.getElementById('high-scores-list');
        table.innerHTML = this.highScores.map((hs, i) => `
            <tr class="hs-row-${i+1}">
                <td class="hs-rank">${i + 1}</td>
                <td class="hs-name ${this.getMedalClass(hs.name, hs.score)}">${hs.name}</td>
                <td class="hs-score">${hs.score}</td>
                <td class="hs-date">${hs.date}</td>
            </tr>
        `).join('');
    },

    /**
     * Helper: Get medal class based on score and name (easter egg)
     */
    getMedalClass(name, score) {
        const nameLower = name.toLowerCase().replace(/\s/g, '');
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
        if (this.state === 'PLAYING') {
            document.getElementById('score').textContent = `Score: ${this.score}`;
            document.getElementById('lives').textContent = `Lives: ${this.lives}`;
            document.getElementById('level').textContent = `Level: ${this.level}`;
        }
    },

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
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
        this.invulnerable = 120; // Frames
        this.config = config;
    }

    update(dt, keys, config) {
        this.thrusting = keys['ArrowUp'];

        if (keys['ArrowLeft']) this.rotation = -config.rotationSpeed;
        else if (keys['ArrowRight']) this.rotation = config.rotationSpeed;
        else this.rotation = 0;

        this.angle += this.rotation * dt;

        if (this.thrusting) {
            this.vx += Math.cos(this.angle) * config.thrust;
            this.vy += Math.sin(this.angle) * config.thrust;
        }

        this.vx *= config.friction;
        this.vy *= config.friction;

        this.x += this.vx;
        this.y += this.vy;

        if (this.invulnerable > 0) this.invulnerable--;

        if (keys['Space']) {
            if (!game.entities.bullets.some(b => b.active && b.owner === 'ship')) {
                game.entities.bullets.push(new Bullet(this.x, this.y, this.angle, config));
                SoundManager.playShoot();
            }
            keys['Space'] = false; // Simple fire-on-press
        }
    }

    wrap(w, h) {
        if (this.x < -this.r) this.x = w + this.r;
        else if (this.x > w + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = h + this.r;
        else if (this.y > h + this.r) this.y = -this.r;
    }

    draw(ctx) {
        if (this.invulnerable % 4 > 0) return;

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
        this.x = x || (Math.random() * game.width);
        this.y = y || (Math.random() * game.height);
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
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;

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
        this.life = config.bulletLifetime;
        this.offscreen = false;
        this.active = true;
        this.owner = 'ship';
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
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
        this.life = 50 + Math.random() * 30;
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
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
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
