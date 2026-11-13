/**
 * Player ship: movement, wrap-around, invulnerability, firing cooldown. Pure.
 */
class Ship {
    constructor(config, width, height) {
        this.x = width / 2;
        this.y = height / 2;
        this.r = 15;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.rotation = 0;
        this.thrusting = false;
        this.invulnerable = config.invulnTime / 1000;
        this.fireCooldown = 0;
        this.lastHyperspace = 0;
        this.hyperspaceCooldownUntil = 0; // written by hyperspace, never read (kept from the original)
    }

    // input: { left, right, thrust, fire } booleans sampled by the game this frame.
    // Returns the angles of the bullets fired this step (empty when none).
    update(dt, config, input, activeBullets, doubleActive) {
        const frameScale = dt * 60;
        this.thrusting = input.thrust;

        if (input.left) this.rotation = -config.rotationSpeed;
        else if (input.right) this.rotation = config.rotationSpeed;
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

        const shots = [];
        if (input.fire && this.fireCooldown <= 0 && activeBullets < config.maxBullets) {
            const offset = doubleActive ? 0.18 : 0;
            shots.push(this.angle - offset);
            if (doubleActive) shots.push(this.angle + offset);
            this.fireCooldown = config.fireRate / 1000;
        }
        return shots;
    }

    wrap(w, h) {
        if (this.x < -this.r) this.x = w + this.r;
        else if (this.x > w + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = h + this.r;
        else if (this.y > h + this.r) this.y = -this.r;
    }
}
