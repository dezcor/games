/**
 * Hyperspace rules: cooldown and safe destination search. Pure.
 */
const HyperspaceRules = {
    // now and ship.lastHyperspace are milliseconds from the clock port.
    isReady(ship, now) {
        const last = ship.lastHyperspace || -Infinity;
        return !(now - last < HYPERSPACE_COOLDOWN);
    },

    // Random points that keep clear of asteroids and the UFO. Returns null when none is found.
    findSafeDestination(asteroids, ufo, width, height, random) {
        for (let i = 0; i < HYPERSPACE_SEARCH_ATTEMPTS; i++) {
            const x = random.next() * width;
            const y = random.next() * height;
            let safe = true;
            for (const a of asteroids) {
                if (Math.hypot(x - a.x, y - a.y) < a.r + HYPERSPACE_SAFE_RADIUS) { safe = false; break; }
            }
            if (safe && ufo) {
                if (Math.hypot(x - ufo.x, y - ufo.y) < ufo.r + HYPERSPACE_SAFE_RADIUS) safe = false;
            }
            if (safe) return { x, y };
        }
        return null;
    },
};
