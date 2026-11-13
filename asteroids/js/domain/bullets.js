/**
 * Projectiles fired by the ship and by UFOs. Pure.
 */
class Bullet {
    constructor(x, y, angle, config) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * config.bulletSpeed;
        this.vy = Math.sin(angle) * config.bulletSpeed;
        this.life = config.bulletLifetime / 60;
        this.offscreen = false;
        this.active = true;
    }

    update(dt, width, height) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        this.life -= dt;
        if (this.life <= 0 || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.offscreen = true;
            this.active = false;
        }
    }
}

class UfoBullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * UFO_BULLET_SPEED;
        this.vy = Math.sin(angle) * UFO_BULLET_SPEED;
        this.life = UFO_BULLET_LIFETIME;
        this.offscreen = false;
        this.r = 3;
    }

    update(dt, width, height) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.life -= dt;
        if (this.life <= 0 || this.x < -10 || this.x > width + 10 || this.y < -10 || this.y > height + 10) {
            this.offscreen = true;
        }
    }
}
