/**
 * CanvasRendererAdapter — implements RendererPort.
 * Draws the board with SVG sprites (SpriteLoader); falls back to canvas shapes
 * until a sprite is loaded or when loading fails.
 */

// ── Sprite Loader ──
const SpriteLoader = {
    cache: new Map(),
    async load(name, url) {
        if (this.cache.has(name)) return this.cache.get(name);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load sprite ${name} from ${url}: ${res.status}`);
        const svg = await res.text();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error(`Failed to decode sprite ${name}`));
            img.src = blobUrl;
        });
        this.cache.set(name, img);
        return img;
    },
    async loadAll(map) {
        await Promise.all(Object.entries(map).map(([k, v]) => this.load(k, v)));
    },
    get(name) {
        return this.cache.get(name);
    },
};

const CanvasRendererAdapter = {
    canvas: null,
    ctx: null,

    init() {
        this.canvas = document.getElementById('invaders');
        this.ctx = this.canvas.getContext('2d');
    },

    loadSprites() {
        return SpriteLoader.loadAll({
            'alien-small': 'sprites/alien-small.svg',
            'alien-medium': 'sprites/alien-medium.svg',
            'alien-large': 'sprites/alien-large.svg',
            player: 'sprites/player.svg',
            ufo: 'sprites/ufo.svg',
            bullet: 'sprites/bullet.svg',
            'alien-bullet': 'sprites/alien-bullet.svg',
        });
    },

    draw(game) {
        const ctx = this.ctx;
        const canvas = this.canvas;

        ctx.fillStyle = '#0d0714';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Star field background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        const starSeed = 42;
        for (let i = 0; i < 30; i++) {
            const sx = ((i * 73 + starSeed) % canvas.width);
            const sy = ((i * 97 + starSeed) % canvas.height);
            ctx.fillRect(sx, sy, 1, 1);
        }

        // Draw player
        const playerSprite = SpriteLoader.get('player');
        if (game.gameTime < game.playerInvulnerabilityUntil && Math.floor(game.gameTime / 80) % 2 === 0) {
            ctx.globalAlpha = 0.35;
        }
        if (playerSprite) {
            ctx.save();
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 8;
            ctx.drawImage(playerSprite, game.playerX, PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT);
            ctx.shadowBlur = 0;
            ctx.restore();
        } else {
            ctx.fillStyle = '#4ade80';
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(game.playerX + PLAYER_WIDTH / 2, PLAYER_Y);
            ctx.lineTo(game.playerX + PLAYER_WIDTH, PLAYER_Y + PLAYER_HEIGHT);
            ctx.lineTo(game.playerX, PLAYER_Y + PLAYER_HEIGHT);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        this.drawUFOs(game.ufos);

        game.aliens.forEach((a) => {
            if (!a.alive) return;
            this.drawAlien(a);
        });

        // Draw player bullets
        const bulletSprite = SpriteLoader.get('bullet');
        game.bullets.forEach((b) => {
            if (bulletSprite) {
                ctx.save();
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 6;
                ctx.drawImage(bulletSprite, b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT);
                ctx.shadowBlur = 0;
                ctx.restore();
            } else {
                ctx.fillStyle = '#fbbf24';
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 6;
                ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT);
                ctx.shadowBlur = 0;
            }
        });

        // Draw alien bullets
        const alienBulletSprite = SpriteLoader.get('alien-bullet');
        game.alienBullets.forEach((b) => {
            if (alienBulletSprite) {
                ctx.save();
                ctx.shadowColor = '#ff2060';
                ctx.shadowBlur = 4;
                ctx.drawImage(alienBulletSprite, b.x, b.y, b.width, b.height);
                ctx.shadowBlur = 0;
                ctx.restore();
            } else {
                ctx.fillStyle = '#ff2060';
                ctx.shadowColor = '#ff2060';
                ctx.shadowBlur = 4;
                ctx.fillRect(b.x, b.y, b.width, b.height);
                ctx.shadowBlur = 0;
            }
        });

        this.drawParticles(game.particles);
    },

    drawUFOs(ufos) {
        const ctx = this.ctx;
        const sprite = SpriteLoader.get('ufo');
        ufos.forEach((ufo) => {
            if (!ufo.alive) return;

            if (sprite) {
                ctx.save();
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 10;
                ctx.drawImage(sprite, ufo.x, ufo.y, ufo.width, ufo.height);
                ctx.shadowBlur = 0;
                ctx.restore();
                return;
            }

            // Fallback: canvas drawing
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.arc(ufo.x + ufo.width / 2, ufo.y + ufo.height - 2, ufo.width / 4, Math.PI, 0);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(ufo.x, ufo.y + ufo.height / 2 - 2, ufo.width, ufo.height / 2 - 2);

            ctx.fillStyle = '#ff6b8a';
            ctx.fillRect(ufo.x + 8, ufo.y + ufo.height - 2, ufo.width - 16, 2);
            ctx.shadowBlur = 0;
        });
    },

    drawAlien(alien) {
        const ctx = this.ctx;
        const { x, y, width, height, shape, color } = alien;
        const sprite = SpriteLoader.get(`alien-${shape}`);

        if (sprite) {
            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = 4;
            ctx.drawImage(sprite, x, y, width, height);
            ctx.shadowBlur = 0;
            ctx.restore();
            return;
        }

        // Fallback: canvas drawing
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;

        if (shape === 'large') {
            ctx.fillRect(x, y + 2, width, height - 4);
            ctx.fillRect(x + 3, y, 4, 3);
            ctx.fillRect(x + width - 7, y, 4, 3);
            ctx.fillStyle = '#0d0714';
            ctx.fillRect(x + 4, y + 4, 4, 3);
            ctx.fillRect(x + width - 8, y + 4, 4, 3);
        } else if (shape === 'medium') {
            ctx.fillRect(x + 1, y + 2, width - 2, height - 4);
            ctx.fillRect(x + 4, y, 3, 3);
            ctx.fillRect(x + width - 7, y, 3, 3);
            ctx.fillStyle = '#0d0714';
            ctx.fillRect(x + 5, y + 4, 3, 3);
            ctx.fillRect(x + width - 8, y + 4, 3, 3);
        } else {
            ctx.fillRect(x + 2, y + 3, width - 4, height - 5);
            ctx.fillStyle = '#0d0714';
            ctx.fillRect(x + 6, y + 4, 3, 2);
            ctx.fillRect(x + width - 9, y + 4, 3, 2);
        }

        ctx.shadowBlur = 0;
    },

    drawParticles(particles) {
        const ctx = this.ctx;
        particles.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;
    },
};
