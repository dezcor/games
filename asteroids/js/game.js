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
    score: 0,
    lives: GAME_CONFIG.lives,
    playerName: localStorage.getItem('asteroids_player_name') || 'Player',
    highScores: JSON.parse(localStorage.getItem('asteroids_highscores') || '[]'),

    entities: {
        ship: null,
        asteroids: [],
        bullets: [],
        particles: []
    },

    lastTime: 0,

    init() {
        this.canvas = document.getElementById('asteroids-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.setupInput();
        this.setupUI();

        window.requestAnimationFrame((t) => this.loop(t));
    },

    setupInput() {
        // Basic keys are handled by input.js
    },

    setupUI() {
        // UI elements
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const quickBtn = document.getElementById('quick-restart-btn');
        const highScoreValue = document.getElementById('best-score-value');

        // Load initial high score
        if (this.highScores.length > 0) {
            highScoreValue.textContent = this.highScores[0].score;
        }

        startBtn.addEventListener('click', () => this.startGame());
        pauseBtn.addEventListener('click', () => this.togglePause());
        quickBtn.addEventListener('click', () => this.resetGame());

        // Name Input
        const nameInput = document.getElementById('player-name');
        nameInput.addEventListener('change', (e) => {
            this.playerName = e.target.value.trim() || 'Player';
            localStorage.setItem('asteroids_player_name', this.playerName);
        });
    },

    startGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.lives = GAME_CONFIG.lives;
        this.entities.asteroids = [];
        this.entities.bullets = [];
        this.entities.particles = [];

        this.entities.ship = new Ship();

        // Initial Asteroids
        for (let i = 0; i < 5; i++) {
            this.spawnAsteroid('large');
        }

        document.getElementById('pause-overlay').style.display = 'none';
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('player-name').style.display = 'none';

        SoundManager.startBgm();
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
        document.getElementById('player-name').style.display = 'block';
        document.getElementById('quick-restart-btn').style.display = 'none';

        // Clear everything
        this.entities.ship = null;
        this.entities.asteroids = [];
        this.entities.bullets = [];
        this.entities.particles = [];

        MusicPlayer.stop();
        MusicPlayer.resume(); // Restart BGM logic
    },

    spawnAsteroid(type) {
        const size = type === 'large' ? 40 : (type === 'medium' ? 20 : 10);
        let asteroid = null;
        let safeSpawn = false;
        let attempts = 0;

        while (!safeSpawn && attempts < 10) {
            const x = Math.random() * game.width;
            const y = Math.random() * game.height;

            const ship = this.entities.ship;
            if (ship) {
                const dist = Math.sqrt((x - ship.x) ** 2 + (y - ship.y) ** 2);
                // Ensure asteroid is at least 50px away from the ship's radius
                if (dist < ship.r + size + 50) {
                    attempts++;
                    continue;
                }
            }

            asteroid = new Asteroid(size, x, y, type);
            safeSpawn = true;
        }

        if (asteroid) {
            this.entities.asteroids.push(asteroid);
        }
    },

    update(dt) {
        if (this.state !== 'PLAYING') return;

        // Update Ship
        this.entities.ship.update(dt, keys);
        if (keys['ArrowUp']) SoundManager.playThrust();

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
                this.handlePlayerHit(a);
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
            this.entities.ship = new Ship(); // Respawn
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
            this.highScores.unshift({ score: this.score, name: this.playerName, date: new Date().toLocaleDateString() });
            this.highScores = this.highScores.slice(0, 5);
            localStorage.setItem('asteroids_highscores', JSON.stringify(this.highScores));

            // Show High Score Notice
            const notice = document.createElement('div');
            notice.id = 'new-highscore-notice';
            notice.textContent = 'NEW HIGH SCORE!';
            document.body.appendChild(notice);
            setTimeout(() => notice.remove(), 3000);
        }

        document.getElementById('pause-overlay').style.display = 'flex';
        document.getElementById('game-over-stats').style.display = 'flex';
        document.getElementById('final-score').textContent = `Score: ${this.score}`;
        document.getElementById('quick-restart-btn').style.display = 'block';

        // Render scores
        const table = document.getElementById('high-scores-list');
        table.innerHTML = this.highScores.map((hs, i) => `
            <tr class="hs-row-${i+1}">
                <td class="hs-rank">${i+1}</td>
                <td class="hs-name">${hs.name}</td>
                <td class="hs-score">${hs.score}</td>
                <td class="hs-date">${hs.date}</td>
            </tr>
        `).join('');
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
        }

        requestAnimationFrame(() => this.loop());
    },

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }
        this.draw();
    }
};


// --- Classes ---

class Ship {
    constructor() {
        this.x = game.width / 2;
        this.y = game.height / 2;
        this.r = 15;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.rotation = 0;
        this.thrusting = false;
        this.invulnerable = 120; // Frames
    }

    update(dt, keys) {
        this.thrusting = keys['ArrowUp'];

        if (keys['ArrowLeft']) this.rotation = -GAME_CONFIG.rotationSpeed;
        else if (keys['ArrowRight']) this.rotation = GAME_CONFIG.rotationSpeed;
        else this.rotation = 0;

        this.angle += this.rotation * dt;

        if (this.thrusting) {
            this.vx += Math.cos(this.angle) * GAME_CONFIG.acceleration;
            this.vy += Math.sin(this.angle) * GAME_CONFIG.acceleration;
        }

        this.vx *= GAME_CONFIG.friction;
        this.vy *= GAME_CONFIG.friction;

        this.x += this.vx;
        this.y += this.vy;

        if (this.invulnerable > 0) this.invulnerable--;

        if (keys['Space']) {
            if (!game.entities.bullets.some(b => b.active && b.owner === this)) {
                game.entities.bullets.push(new Bullet(this.x, this.y, this.angle));
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
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, -10);
        ctx.closePath();
        ctx.stroke();

        // Thrust flame
        if (this.thrusting) {
            ctx.beginPath();
            ctx.strokeStyle = '#fbbf24';
            ctx.moveTo(-7, 0);
            ctx.lineTo(-15, 0);
            ctx.stroke();
        }

        ctx.restore();
    }
}


class Asteroid {
    constructor(radius, x, y, type = 'medium') {
        this.x = x || (Math.random() * game.width);
        this.y = y || (Math.random() * game.height);
        this.r = radius || (type === 'large' ? 40 : (type === 'medium' ? 20 : 10));
        this.type = type;

        const speed = GAME_CONFIG.asteroidMinSpeed + Math.random() * (GAME_CONFIG.asteroidMaxSpeed - GAME_CONFIG.asteroidMinSpeed);
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
        ctx.lineWidth = 2;

        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const mut = 0.8 + Math.random() * 0.4;
            const px = Math.cos(angle) * this.r * mut;
            const py = Math.sin(angle) * this.r * mut;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}


class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * GAME_CONFIG.bulletSpeed;
        this.vy = Math.sin(angle) * GAME_CONFIG.bulletSpeed;
        this.life = 60;
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
    for (let i = 0; i < 8; i++) {
        game.entities.particles.push(new Particle(x, y, type));
    }
}


class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30 + Math.random() * 30;
        this.color = type === 'large' ? '#fff' : '#fbbf24';
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life / 60;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 2, 2);
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