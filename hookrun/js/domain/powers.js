/**
 * Powers — pure state of the hunter's power-ups.
 * No DOM, no storage, no audio.
 *
 * Timed powers count down in `timers`; the shield lasts until it takes a hit;
 * the bomb is instant and keeps no state (the game clears the road).
 */
const Powers = {
    create() {
        return { timers: {}, shield: false };
    },

    /** Picking up a timed power again refills its timer. */
    grant(powers, kind) {
        if (kind === 'shield') {
            powers.shield = true;
        } else if (POWER_TYPES[kind].duration > 0) {
            powers.timers[kind] = POWER_TYPES[kind].duration;
        }
    },

    isActive(powers, kind) {
        return kind === 'shield' ? powers.shield : powers.timers[kind] > 0;
    },

    step(powers, dt) {
        for (const kind of Object.keys(powers.timers)) {
            powers.timers[kind] -= dt;
            if (powers.timers[kind] <= 0) delete powers.timers[kind];
        }
    },

    /** Spends the shield. @returns {boolean} true when there was one */
    useShield(powers) {
        if (!powers.shield) return false;
        powers.shield = false;
        return true;
    },
};
