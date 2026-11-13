/**
 * UfoRules — pure UFO spawn and movement rules.
 * Randomness is passed in as a `random()` callback.
 */
const UfoRules = {
    spawnDelay(level, diff, random) {
        const levelFactor = Math.pow(UFO_LEVEL_INTERVAL_FACTOR, Math.max(0, level - 1));
        const minDelay = Math.max(
            UFO_MIN_INTERVAL,
            UFO_SPAWN_MIN * levelFactor * diff.ufoIntervalFactor
        );
        const maxDelay = Math.max(
            minDelay + 1000,
            UFO_SPAWN_MAX * levelFactor * diff.ufoIntervalFactor
        );
        return minDelay + random() * (maxDelay - minDelay);
    },

    create(level, diff, random) {
        const direction = random() < 0.5 ? 1 : -1;
        return {
            x: direction === 1 ? -UFO_WIDTH : CANVAS_WIDTH,
            y: UFO_Y,
            direction: direction,
            score: Math.floor(random() * (UFO_SCORE_RANGE[1] - UFO_SCORE_RANGE[0] + 1) + UFO_SCORE_RANGE[0]),
            width: UFO_WIDTH,
            height: UFO_HEIGHT,
            speed: UFO_SPEED * diff.ufoSpeedFactor * (1 + (level - 1) * UFO_LEVEL_SPEED_FACTOR),
            alive: true,
        };
    },

    hasActive(ufos) {
        return ufos.some((ufo) => ufo.alive);
    },

    // Moves flying UFOs and drops the ones that left the screen. Returns the surviving list.
    move(ufos, delta) {
        const frameScale = delta / (1000 / 60);
        ufos.forEach((ufo) => {
            if (!ufo.alive) return;
            ufo.x += ufo.speed * ufo.direction * frameScale;

            if ((ufo.direction === 1 && ufo.x > CANVAS_WIDTH + ufo.width) ||
                (ufo.direction === -1 && ufo.x + ufo.width < 0)) {
                ufo.alive = false;
            }
        });
        return ufos.filter((u) => u.alive);
    },
};
