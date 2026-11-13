/**
 * Asteroids: size table, split rules and motion. Pure; randomness comes from the injected random port.
 */
const AsteroidRules = {
    radiusOf(type) {
        return type === 'large' ? ASTEROID_SIZE : (type === 'medium' ? ASTEROID_SIZE / 2 : ASTEROID_SIZE / 4);
    },

    // Large splits into medium, medium into small, small does not split.
    childTypeOf(type) {
        return type === 'large' ? 'medium' : type === 'medium' ? 'small' : null;
    },
};

class Asteroid {
    constructor(radius, x, y, type, config, random) {
        this.x = x;
        this.y = y;
        this.r = radius || AsteroidRules.radiusOf(type);
        this.type = type;

        const speed = config.asteroidMinSpeed + random.next() * (config.asteroidMaxSpeed - config.asteroidMinSpeed);
        const angle = random.next() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.rotation = random.next() * Math.PI * 2;
        this.rotSpeed = (random.next() - 0.5) * 0.05;
        this.dead = false;
    }

    update(dt, width, height) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        this.rotation += this.rotSpeed * frameScale;

        if (this.x < -this.r) this.x = width + this.r;
        else if (this.x > width + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = height + this.r;
        else if (this.y > height + this.r) this.y = -this.r;
    }

    hit() {
        this.dead = true;
    }
}
