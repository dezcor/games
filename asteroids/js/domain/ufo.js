/**
 * UFO: spawn timing and size choice, flight, aiming and firing. Pure.
 */
const UfoRules = {
    // Delay until the next UFO; shrinks with the level, never below 6 s.
    rollDelay(level, random) {
        const reduction = Math.max(0, level - 1) * UFO_SPAWN_INTERVAL_LEVEL_REDUCTION;
        const minDelay = Math.max(6, UFO_SPAWN_INTERVAL_MIN - reduction);
        const maxDelay = Math.max(minDelay + 4, UFO_SPAWN_INTERVAL_MAX - reduction);
        return minDelay + random.next() * (maxDelay - minDelay);
    },

    // Small UFOs only appear from minLevel on.
    chooseSize(level, random) {
        const allowSmall = level >= UFO_SIZES.small.minLevel;
        return allowSmall && random.next() < 0.4 ? 'small' : 'large';
    },
};

class Ufo {
    constructor(size, fromLeft, width, height, random) {
        const def = UFO_SIZES[size] || UFO_SIZES.large;
        this.size = size;
        this.r = def.r;
        this.x = fromLeft ? -this.r : width + this.r;
        this.y = this.r + random.next() * (height * UFO_Y_FRACTION - this.r * 2);
        const dir = fromLeft ? 1 : -1;
        this.vx = dir * def.speed;
        this.vy = 0;
        this.def = def;
        this.fireCooldown = def.fireInterval;
        this.directionTimer = UFO_DIRECTION_CHANGE_MIN + random.next() * (UFO_DIRECTION_CHANGE_MAX - UFO_DIRECTION_CHANGE_MIN);
        this.targetVy = 0;
        this.dead = false;
    }

    // Returns the UfoBullet fired this step, or null.
    update(dt, ship, random, width) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;

        // Random vertical drift
        this.directionTimer -= dt;
        if (this.directionTimer <= 0) {
            this.targetVy = (random.next() - 0.5) * this.def.speed * 0.6;
            this.directionTimer = UFO_DIRECTION_CHANGE_MIN + random.next() * (UFO_DIRECTION_CHANGE_MAX - UFO_DIRECTION_CHANGE_MIN);
        }
        this.vy += (this.targetVy - this.vy) * 0.05;

        let shot = null;
        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0 && ship) {
            const angle = Math.atan2(ship.y - this.y, ship.x - this.x);
            const jitter = (random.next() - 0.5) * 0.3; // slight inaccuracy
            shot = new UfoBullet(this.x, this.y, angle + jitter);
            this.fireCooldown = this.def.fireInterval;
        }

        // Off-screen horizontally: gone
        if (this.x < -this.r - 40 || this.x > width + this.r + 40) {
            this.dead = true;
        }
        return shot;
    }

    wrap(w, h) {
        if (this.y < this.r) this.y = h - this.r;
        else if (this.y > h - this.r) this.y = this.r;
    }
}
