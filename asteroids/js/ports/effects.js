/**
 * EffectsPort: purely visual, non-gameplay effects (particles and flashes).
 * Implemented by adapters/effects.js (EffectsAdapter).
 */
const EffectsPort = {
    /** Debris burst. type: 'large' | 'medium' | 'small' (UFO bursts use 'large'). */
    explode(x, y, type) {},
    /** Exhaust particles behind a thrusting ship. */
    thrust(ship) {},
    /** Burst when the ship is destroyed. */
    playerExplosion(ship) {},
    /** Brief flash (suppressed when the player prefers reduced motion). */
    flash(x, y, color, life) {},
    /** Advances particles and flashes by dt seconds, applying the particle cap. */
    update(dt) {},
    /** Removes all particles and flashes. */
    clear() {},
};
