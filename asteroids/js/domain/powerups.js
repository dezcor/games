/**
 * Power-ups: drop chance, type and drift. Pure; randomness comes from the injected random port.
 */
const PowerUpRules = {
    shouldDrop(asteroidType, random) {
        const rate = POWERUP_DROP_RATE[asteroidType] || 0;
        return random.next() < rate;
    },

    spawnAt(x, y, random) {
        const keys = Object.keys(POWERUP_TYPES);
        const typeKey = keys[Math.floor(random.next() * keys.length)];
        const def = POWERUP_TYPES[typeKey];
        const angle = random.next() * Math.PI * 2;
        return new PowerUp(x, y, typeKey, def, Math.cos(angle) * POWERUP_SPEED, Math.sin(angle) * POWERUP_SPEED);
    },
};

class PowerUp {
    constructor(x, y, type, def, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.def = def;
        this.r = POWERUP_RADIUS;
        this.life = POWERUP_LIFETIME;
        this.dead = false;
        this.rotation = 0;
    }

    update(dt) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        this.rotation += dt * 1.2;
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }

    wrap(w, h) {
        if (this.x < -this.r) this.x = w + this.r;
        else if (this.x > w + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = h + this.r;
        else if (this.y > h + this.r) this.y = -this.r;
    }
}
