/**
 * TimerAdapter — implements ClockPort.
 * Uses requestAnimationFrame; preserves elapsed time across pause/resume.
 */
const TimerAdapter = {
    running: false,
    elapsed: 0,
    baseElapsed: 0,
    startTimestamp: 0,
    rafId: null,
    lastSecond: 0,

    start(cb) {
        this.stop();
        this.running = true;
        this.baseElapsed = this.elapsed;
        this.startTimestamp = performance.now();
        this.lastSecond = this.elapsed;

        const tick = (now) => {
            if (!this.running) return;
            const elapsed = this.baseElapsed + Math.floor((now - this.startTimestamp) / 1000);
            if (elapsed !== this.lastSecond) {
                this.lastSecond = elapsed;
                this.elapsed = elapsed;
                cb(elapsed);
            }
            this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);
    },

    stop() {
        this.running = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
    },

    reset() {
        this.elapsed = 0;
        this.baseElapsed = 0;
        this.lastSecond = 0;
    },

    now() {
        return this.elapsed;
    },
};
