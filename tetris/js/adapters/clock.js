/**
 * FrameClockAdapter — implements ClockPort.
 * RandomAdapter — implements RandomPort.
 */
const FrameClockAdapter = {
    start(cb) {
        const tick = () => {
            cb();
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    },

    today() {
        return new Date().toLocaleDateString('en-US');
    },
};

const RandomAdapter = {
    next() {
        return Math.random();
    },
};
