/**
 * Browser clock adapter (ClockPort). Also holds the reduced-motion preference.
 */
const reducedMotion = (() => {
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (error) {
        return false;
    }
})();

const BrowserClock = {
    now() {
        return performance.now();
    },

    isoNow() {
        return new Date().toISOString();
    },

    dateLabel() {
        return new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    },
};
