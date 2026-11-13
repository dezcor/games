/**
 * ParticleRules — pure explosion particle logic.
 * Randomness and reduced-motion preference are passed in by the caller.
 */
const ParticleRules = {
    // Appends up to `count` particles to `list` (capped at MAX_PARTICLES).
    spawn(list, { x, y, color, count, reducedMotion, random }) {
        const remainingSlots = Math.max(0, MAX_PARTICLES - list.length);
        const motionScale = reducedMotion ? 0.5 : 1;
        const total = Math.min(count, remainingSlots);

        for (let i = 0; i < total; i++) {
            const lifetime = Math.min(PARTICLE_LIFETIME, PARTICLE_LIFETIME * motionScale);
            list.push({
                x,
                y,
                vx: (random() - 0.5) * PARTICLE_SPEED * 4 * motionScale,
                vy: (random() - 0.5) * PARTICLE_SPEED * 4 * motionScale,
                life: lifetime,
                maxLife: lifetime,
                color: color,
                size: random() * 4 + 2,
            });
        }
    },

    // Advances particles and removes the expired ones. Returns the surviving list.
    step(list, delta) {
        const frameScale = delta / (1000 / 60);
        return list.filter((p) => {
            p.x += p.vx * frameScale;
            p.y += p.vy * frameScale;
            p.life -= delta;
            return p.life > 0;
        });
    },
};
