/**
 * ClockPort: time source for the domain (the domain never calls performance.now or Date itself).
 * Implemented by adapters/clock.js (BrowserClock).
 */
const ClockPort = {
    /** Monotonic time in milliseconds (performance.now). */
    now() { return 0; },
    /** ISO timestamp stored with achievement unlocks. */
    isoNow() { return ''; },
    /** Localized date label stored with high score entries. */
    dateLabel() { return ''; },
};
