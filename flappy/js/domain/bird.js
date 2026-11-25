/**
 * Bird - pure bird physics.
 * No DOM, no storage, no audio. Randomness comes in through a RandomPort.
 */
const Bird = {
    /** @returns {Object} a fresh bird state */
    create() {
        return {
            x: BIRD_X,
            y: BOARD_HEIGHT / 2,
            vy: 0,
            radius: BIRD_RADIUS,
        };
    },

    /** Flap: start rising at the climb speed. */
    flap(bird) {
        bird.vy = FLAP_VELOCITY;
    },

    /** Release: cut the lift immediately so the bird starts falling right away. */
    stopRise(bird) {
        if (bird.vy < 0) bird.vy = 0;
    },

    /**
     * One physics step. `dt` is in seconds (1/60 = one frame at 60 Hz), so the
     * simulation runs at the same speed on 60 Hz and 144 Hz displays.
     * While `thrusting` (the flap control is held) the bird climbs at a constant
     * speed; as soon as it is released gravity takes over with no leftover lift.
     */
    step(bird, dt = 1 / 60, thrusting = false) {
        const frames = dt * 60;

        if (thrusting) {
            bird.vy = FLAP_VELOCITY;
            bird.y += bird.vy * frames;
        } else {
            // Exact integration of constant gravity keeps the fall identical at any Hz.
            bird.y += bird.vy * frames + 0.5 * GRAVITY * frames * frames;
            bird.vy += GRAVITY * frames;
            if (bird.vy > MAX_FALL_SPEED) bird.vy = MAX_FALL_SPEED;
        }

        // Touching the top edge is allowed: clamp instead of dying.
        if (bird.y - bird.radius < 0) {
            bird.y = bird.radius;
            if (bird.vy < 0) bird.vy = 0;
        }
    },

    /** @returns {boolean} true when the bird is below the ground line */
    isGrounded(bird) {
        return bird.y + bird.radius >= BOARD_HEIGHT;
    },
};
