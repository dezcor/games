/**
 * FrameAdapter — implements ClockPort.
 * Drives the domain frame loop with requestAnimationFrame.
 */
const FrameAdapter = {
    rafId: null,
    running: false,

    start(cb) {
        this.stop();
        this.running = true;

        const tick = (now) => {
            if (!this.running) return;
            cb(now);
            // The callback may stop the clock (e.g. game over): don't reschedule then.
            if (!this.running) return;
            this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);
    },

    stop() {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    },

    now() {
        return performance.now();
    },
};
