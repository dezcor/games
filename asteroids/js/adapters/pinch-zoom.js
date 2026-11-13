/**
 * Pinch-to-zoom (1x-2x) and double-tap reset on the board, for portrait phones.
 */
const PinchZoomAdapter = {
    init() {
        const wrapper = document.getElementById('board-wrapper');
        const canvas = document.getElementById('asteroids-canvas');
        const indicator = document.getElementById('zoom-indicator');
        if (!wrapper || !canvas) return;

        const MIN_SCALE = 1;
        const MAX_SCALE = 2;
        let scale = 1;
        let pinchStartDist = 0;
        let pinchStartScale = 1;
        let lastTap = 0;
        let indicatorTimer = null;

        function isPortrait() {
            return window.matchMedia && window.matchMedia('(orientation: portrait)').matches;
        }

        function getDistance(t1, t2) {
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            return Math.hypot(dx, dy);
        }

        function applyScale(next) {
            scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
            if (scale === 1) {
                wrapper.style.transform = '';
            } else {
                wrapper.style.transform = `scale(${scale})`;
            }
            if (indicator) {
                indicator.textContent = `${Math.round(scale * 100)}%`;
                indicator.classList.add('visible');
                clearTimeout(indicatorTimer);
                indicatorTimer = setTimeout(() => indicator.classList.remove('visible'), 900);
            }
        }

        function resetZoom() {
            scale = 1;
            wrapper.style.transform = '';
            if (indicator) {
                indicator.textContent = '100%';
                indicator.classList.add('visible');
                clearTimeout(indicatorTimer);
                indicatorTimer = setTimeout(() => indicator.classList.remove('visible'), 900);
            }
        }

        wrapper.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                pinchStartDist = getDistance(e.touches[0], e.touches[1]);
                pinchStartScale = scale;
                if (e.cancelable) e.preventDefault();
            } else if (e.touches.length === 1) {
                const now = Date.now();
                if (now - lastTap < 300) {
                    resetZoom();
                }
                lastTap = now;
            }
        }, { passive: false });

        wrapper.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const d = getDistance(e.touches[0], e.touches[1]);
                if (pinchStartDist > 0) {
                    const ratio = d / pinchStartDist;
                    applyScale(pinchStartScale * ratio);
                }
                if (e.cancelable) e.preventDefault();
            }
        }, { passive: false });

        wrapper.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                pinchStartDist = 0;
            }
        });

        function onOrientationChange() {
            if (!isPortrait()) resetZoom();
        }
        window.addEventListener('orientationchange', onOrientationChange);
        window.addEventListener('resize', onOrientationChange);
    },
};
