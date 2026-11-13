/**
 * Canvas renderer adapter (RendererPort) and SVG sprite loader.
 * Draw code formerly lived on the entity classes; the domain entities are now plain data.
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

const CanvasRenderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    colorIndexes: new WeakMap(), // asteroid -> palette index, picked once per asteroid

    init(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        canvas.width = width;
        canvas.height = height;
    },

    async loadSprites() {
        await SpriteLoader.loadAll({
            ship: 'sprites/ship.svg',
            asteroid: 'sprites/asteroid.svg',
            ufo: 'sprites/ufo.svg',
            bullet: 'sprites/bullet.svg',
            ufoBullet: 'sprites/ufo-bullet.svg',
            powerupShield: 'sprites/powerup-shield.svg',
            powerupDouble: 'sprites/powerup-double.svg',
            powerupLife: 'sprites/powerup-life.svg',
        });
    },

    draw(view) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (view.ship) this.drawShip(view.ship, view.shipEffects, view.shipColor);
        view.bullets.forEach((b) => this.drawBullet(b));
        view.asteroids.forEach((a) => this.drawAsteroid(a));
        if (view.ufo) this.drawUfo(view.ufo);
        view.ufoBullets.forEach((b) => this.drawUfoBullet(b));
        view.powerups.forEach((p) => this.drawPowerup(p));
        EffectsAdapter.draw(ctx);
    },

    drawShip(ship, effects, color) {
        const ctx = this.ctx;

        // Shield ring
        if (effects && effects.shield > 0) {
            const alpha = 0.5 + Math.sin(performance.now() / 100) * 0.2;
            ctx.save();
            ctx.strokeStyle = POWERUP_TYPES.shield.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 12;
            ctx.shadowColor = POWERUP_TYPES.shield.color;
            ctx.beginPath();
            ctx.arc(ship.x, ship.y, ship.r + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (ship.invulnerable > 0 && Math.floor(ship.invulnerable * 60) % 4 > 0) return;

        const shipSprite = SpriteLoader.get('ship');

        if (shipSprite) {
            ctx.save();
            ctx.translate(ship.x, ship.y);
            ctx.rotate(ship.angle);
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.drawImage(shipSprite, -15, -15, 30, 30);
            ctx.globalCompositeOperation = 'source-in';
            ctx.shadowBlur = 0;
            ctx.fillStyle = color;
            ctx.fillRect(-20, -20, 40, 40);
            ctx.globalCompositeOperation = 'source-over';
            if (ship.thrusting) {
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
        } else {
            // Fallback: canvas drawing
            ctx.save();
            ctx.translate(ship.x, ship.y);
            ctx.rotate(ship.angle);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-10, 10);
            ctx.lineTo(-5, 0);
            ctx.lineTo(-10, -10);
            ctx.closePath();
            ctx.stroke();
            if (ship.thrusting) {
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
    },

    drawAsteroid(asteroid) {
        const ctx = this.ctx;
        if (!this.colorIndexes.has(asteroid)) {
            this.colorIndexes.set(asteroid, Math.floor(Math.random() * 3));
        }
        const color = GAME_CONFIG.asteroidColors[this.colorIndexes.get(asteroid)];
        const sprite = SpriteLoader.get('asteroid');
        const shadowBlur = asteroid.type === 'large' ? 10 : (asteroid.type === 'medium' ? 6 : 3);

        if (sprite) {
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            ctx.shadowColor = color;
            ctx.shadowBlur = shadowBlur;
            const size = asteroid.r * 2;
            ctx.drawImage(sprite, -asteroid.r, -asteroid.r, size, size);
            ctx.restore();
        } else {
            // Fallback: canvas drawing
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);

            ctx.strokeStyle = color;
            ctx.lineWidth = asteroid.type === 'large' ? 3 : (asteroid.type === 'medium' ? 2 : 1);
            ctx.shadowBlur = shadowBlur;
            ctx.shadowColor = color;

            ctx.beginPath();
            const points = asteroid.type === 'large' ? 12 : (asteroid.type === 'medium' ? 10 : 8);
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const mut = 0.6 + Math.random() * 0.4;
                const px = Math.cos(angle) * asteroid.r * mut;
                const py = Math.sin(angle) * asteroid.r * mut;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }
    },

    drawBullet(bullet) {
        const ctx = this.ctx;
        const sprite = SpriteLoader.get('bullet');
        if (sprite) {
            ctx.drawImage(sprite, bullet.x - 2, bullet.y - 2, 4, 4);
        } else {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawUfoBullet(bullet) {
        const ctx = this.ctx;
        const sprite = SpriteLoader.get('ufoBullet');
        if (sprite) {
            ctx.save();
            ctx.shadowColor = '#f87171';
            ctx.shadowBlur = 8;
            ctx.drawImage(sprite, bullet.x - bullet.r, bullet.y - bullet.r, bullet.r * 2, bullet.r * 2);
            ctx.restore();
        } else {
            ctx.fillStyle = '#f87171';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#f87171';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawUfo(ufo) {
        const ctx = this.ctx;
        const blink = reducedMotion ? 1 : (0.7 + Math.sin(performance.now() / 120) * 0.3);
        const sprite = SpriteLoader.get('ufo');
        if (sprite) {
            ctx.save();
            ctx.translate(ufo.x, ufo.y);
            ctx.globalAlpha = blink;
            ctx.shadowColor = '#f87171';
            ctx.shadowBlur = 12;
            const w = ufo.r * 2.2;
            const h = ufo.r * 0.9;
            ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
            ctx.restore();
        } else {
            // Fallback
            ctx.save();
            ctx.translate(ufo.x, ufo.y);
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#f87171';
            ctx.globalAlpha = blink;
            ctx.beginPath();
            ctx.ellipse(0, 0, ufo.r, ufo.r * 0.4, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, -ufo.r * 0.3, ufo.r * 0.55, ufo.r * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    },

    drawPowerup(p) {
        const ctx = this.ctx;
        const blink = p.life < 3 && Math.floor(p.life * 8) % 2 === 0;
        if (blink) return;

        const spriteName = `powerup${p.type.charAt(0).toUpperCase() + p.type.slice(1)}`;
        const sprite = SpriteLoader.get(spriteName);

        if (sprite) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.shadowColor = p.def.color;
            ctx.shadowBlur = 10;
            const size = p.r * 2.4;
            ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
            ctx.restore();
        } else {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.strokeStyle = p.def.color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.def.color;
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            if (p.def.shape === 'ring') {
                ctx.beginPath();
                ctx.arc(0, 0, p.r * 0.55, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.def.shape === 'arrow') {
                ctx.beginPath();
                ctx.moveTo(0, -p.r * 0.55);
                ctx.lineTo(p.r * 0.45, 0);
                ctx.lineTo(0, p.r * 0.55);
                ctx.lineTo(-p.r * 0.45, 0);
                ctx.closePath();
                ctx.stroke();
            } else if (p.def.shape === 'plus') {
                ctx.beginPath();
                ctx.moveTo(-p.r * 0.55, 0);
                ctx.lineTo(p.r * 0.55, 0);
                ctx.moveTo(0, -p.r * 0.55);
                ctx.lineTo(0, p.r * 0.55);
                ctx.stroke();
            }
            ctx.restore();
        }
    },
};
