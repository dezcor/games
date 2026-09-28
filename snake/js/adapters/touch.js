/**
 * TouchAdapter — implements InputPort.
 * Handles touch buttons and swipe gestures for Snake game.
 */
const TouchAdapter = {
    /**
     * Initialize touch listeners.
     * @param {SnakeGame} game
     */
    init(game) {
        this.setupTouchButtons(game);
        this.setupSwipe(game);
    },

    /**
     * Setup touch buttons for directional control and restart.
     * @param {SnakeGame} game
     */
    setupTouchButtons(game) {
        const dirMap = {
            'up': [0, -1],
            'down': [0, 1],
            'left': [-1, 0],
            'right': [1, 0],
        };

        document.querySelectorAll('.touch-btn').forEach(btn => {
            const action = btn.dataset.action;

            const onStart = (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                if (dirMap[action]) {
                    game.input.onDirectionChange(dirMap[action][0], dirMap[action][1]);
                } else if (action === 'restart') {
                    game.input.onRestart();
                }
            };

            const onEnd = (e) => {
                e.preventDefault();
                btn.classList.remove('pressed');
            };

            btn.addEventListener('touchstart', onStart, { passive: false });
            btn.addEventListener('touchend', onEnd, { passive: false });
            btn.addEventListener('mousedown', onStart);
            btn.addEventListener('mouseup', onEnd);
            btn.addEventListener('mouseleave', onEnd);
        });
    },

    /**
     * Setup swipe gestures on the canvas.
     * @param {SnakeGame} game
     */
    setupSwipe(game) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        let startX = 0;
        let startY = 0;
        const minSwipeDistance = 30;

        const onStart = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        };

        const onEnd = (e) => {
            e.preventDefault();
            if (game.state !== 'PLAYING') return;

            const touch = e.changedTouches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            // Minimum swipe distance
            if (Math.max(absDx, absDy) < minSwipeDistance) return;

            // Determine primary direction
            if (absDx > absDy) {
                // Horizontal swipe
                game.input.onDirectionChange(dx > 0 ? 1 : -1, 0);
            } else {
                // Vertical swipe
                game.input.onDirectionChange(0, dy > 0 ? 1 : -1);
            }
        };

        canvas.addEventListener('touchstart', onStart, { passive: false });
        canvas.addEventListener('touchend', onEnd, { passive: false });
    },
};
