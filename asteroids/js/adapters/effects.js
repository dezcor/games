/**
 * Visual effects adapter (EffectsPort): debris/exhaust particles and hit flashes.
 * Lives outside the domain because it never affects gameplay.
 */
class FxParticle {
    constructor(x, y, type, angle) {
        this.x = x;
        this.y = y;
        const baseSpeed = (Math.random() * 2 + 2) * PARTICLE_SPEED;
        if (typeof angle === 'number') {
            this.vx = Math.cos(angle) * baseSpeed;
            this.vy = Math.sin(angle) * baseSpeed;
        } else {
            this.vx = (Math.random() - 0.5) * 5;
            this.vy = (Math.random() - 0.5) * 5;
        }
        this.life = (50 + Math.random() * 30) / 60;
        this.maxLife = this.life;

        if (type === 'large') {
            this.color = '#fff';
            this.size = 3;
        } else if (type === 'medium') {
            this.color = '#fbbf24';
            this.size = 2.5;
        } else if (type === 'thrust') {
            this.color = '#fbbf24';
            this.size = 1.8;
        } else if (type === 'player') {
            const colors = ['#06b6d4', '#fff', '#22d3ee', '#fbbf24'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.size = 2 + Math.random() * 1.5;
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

class FxFlash {
    constructor(x, y, color, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.dead = false;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        const t = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = t;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, (1 - t) * 30 + 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

const EffectsAdapter = {
    particles: [],
    flashes: [],

    explode(x, y, type) {
        const count = type === 'large' ? 16 : (type === 'medium' ? 12 : 8);
        for (let i = 0; i < count; i++) {
            this.particles.push(new FxParticle(x, y, type));
        }
    },

    thrust(ship) {
        if (Math.random() > PARTICLE_THRUST_RATE) return;
        if (!ship) return;
        const angle = ship.angle + Math.PI;
        const spread = 0.5;
        const a = angle + (Math.random() - 0.5) * spread;
        const px = ship.x + Math.cos(ship.angle) * -8;
        const py = ship.y + Math.sin(ship.angle) * -8;
        this.particles.push(new FxParticle(px, py, 'thrust', a));
    },

    playerExplosion(ship) {
        if (!ship) return;
        for (let i = 0; i < PARTICLE_PLAYER_EXPLOSION; i++) {
            this.particles.push(new FxParticle(ship.x, ship.y, 'player'));
        }
    },

    flash(x, y, color, life) {
        if (reducedMotion) return;
        this.flashes.push(new FxFlash(x, y, color, life));
    },

    clear() {
        this.particles = [];
        this.flashes = [];
    },

    update(dt) {
        this.flashes.forEach((f) => f.update(dt));
        this.flashes = this.flashes.filter((f) => !f.dead);

        this.particles.forEach((p) => p.update(dt));
        this.particles = this.particles.filter((p) => p.life > 0);
        while (this.particles.length > MAX_PARTICLES) {
            this.particles.shift();
        }
    },

    draw(ctx) {
        this.particles.forEach((p) => p.draw(ctx));
        this.flashes.forEach((f) => f.draw(ctx));
    },
};
