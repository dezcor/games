/**
 * AlienRules — pure alien formation logic.
 * No DOM, no audio, no clock. Randomness is passed in as a `random()` callback.
 */
const AlienRules = {
    totalAliens() {
        return ALIEN_ROWS * ALIEN_COLS;
    },

    createFormation() {
        const aliens = [];
        for (let r = 0; r < ALIEN_ROWS; r++) {
            for (let c = 0; c < ALIEN_COLS; c++) {
                const type = ALIEN_ROW_TYPES[r] || 'TYPE_1';
                const metadata = ALIEN_TYPES[type];
                aliens.push({
                    x: ALIEN_START_X + c * (metadata.width + ALIEN_X_GAP),
                    y: ALIEN_START_Y + r * (metadata.height + ALIEN_Y_GAP),
                    alive: true,
                    row: r,
                    column: c,
                    type,
                    width: metadata.width,
                    height: metadata.height,
                    shape: metadata.shape,
                    color: metadata.color,
                });
            }
        }
        return aliens;
    },

    aliveCount(aliens) {
        return aliens.filter((a) => a.alive).length;
    },

    allDefeated(aliens) {
        return aliens.every((a) => !a.alive);
    },

    reachedBottom(aliens, lineY) {
        return aliens.some((a) => a.alive && a.y + a.height >= lineY);
    },

    // Speed-up: the move interval shrinks as fewer aliens remain.
    moveInterval(baseInterval, aliveCount) {
        const speedMultiplier = Math.max(0.2, aliveCount / AlienRules.totalAliens());
        return baseInterval * speedMultiplier;
    },

    // Shots get more frequent as the formation thins out.
    shootInterval(baseInterval, aliveCount) {
        const aliveRatio = aliveCount / AlienRules.totalAliens();
        return baseInterval * (0.45 + aliveRatio * 0.55);
    },

    // Moves every live alien one step. Returns true when the formation touches a side edge.
    step(aliens, alienSpeed, direction, width) {
        let moveDown = false;
        aliens.forEach((a) => {
            if (!a.alive) return;
            const metadata = ALIEN_TYPES[a.type];
            a.x += alienSpeed * direction * 8 * (metadata.speed / ALIEN_BASE_SPEED);
            if (a.x <= 2 || a.x + a.width >= width - 2) {
                moveDown = true;
            }
        });
        return moveDown;
    },

    drop(aliens, amount) {
        aliens.forEach((a) => {
            if (a.alive) a.y += amount;
        });
    },

    columnShooters(aliens) {
        const shooters = new Map();
        aliens.forEach((alien) => {
            if (!alien.alive) return;
            const current = shooters.get(alien.column);
            if (!current || alien.y > current.y) {
                shooters.set(alien.column, alien);
            }
        });
        return Array.from(shooters.values());
    },

    chooseWeighted(candidates, random) {
        const totalWeight = candidates.reduce((total, alien) => {
            return total + (ALIEN_TYPES[alien.type]?.shootWeight || 1);
        }, 0);

        if (totalWeight <= 0) return null;

        let target = random() * totalWeight;
        for (const alien of candidates) {
            target -= ALIEN_TYPES[alien.type]?.shootWeight || 1;
            if (target <= 0) return alien;
        }

        return candidates[candidates.length - 1] || null;
    },

    pickShooter(aliens, random) {
        return AlienRules.chooseWeighted(AlienRules.columnShooters(aliens), random);
    },
};
