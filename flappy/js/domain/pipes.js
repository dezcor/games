/**
 * Pipes - pure pipe generation and movement.
 * No DOM, no storage, no audio. Randomness comes in through a RandomPort.
 */
const Pipes = {
    /**
     * @returns {Object} a fresh pipe with a random gap position.
     * @param {RandomPort} random
     */
    create(random) {
        const gapY = PIPE_MIN_GAP_Y + random.next() * (PIPE_MAX_GAP_Y - PIPE_MIN_GAP_Y);
        return {
            x: BOARD_WIDTH,
            gapY: gapY,
            gapHeight: PIPE_GAP,
            width: PIPE_WIDTH,
            passed: false,
        };
    },

    /** Move a pipe left by `dx` pixels. */
    step(pipe, dx) {
        pipe.x -= dx;
    },

    /** @returns {boolean} true when the pipe has fully passed the bird */
    isPassed(pipe) {
        return pipe.x + pipe.width < BIRD_X;
    },

    /** @returns {boolean} true when the bird collides with the pipe */
    collides(pipe, bird) {
        // Bird x-range vs pipe x-range
        if (bird.x + bird.radius < pipe.x || bird.x - bird.radius > pipe.x + pipe.width) {
            return false;
        }
        // Bird y-range vs pipe top/bottom segments
        const topBottom = pipe.gapY;
        const bottomTop = pipe.gapY + pipe.gapHeight;
        if (bird.y - bird.radius < topBottom || bird.y + bird.radius > bottomTop) {
            return true;
        }
        return false;
    },
};
