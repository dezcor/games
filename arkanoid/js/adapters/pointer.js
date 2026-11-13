/**
 * PointerAdapter — mouse control of the paddle and click-to-start/resume on the canvas.
 */
const PointerAdapter = {
    attach(input) {
        const canvas = document.getElementById('arkanoid');

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            input.setPointerX((e.clientX - rect.left) * scaleX);
        });

        canvas.addEventListener('click', () => {
            input.onCanvasClick();
        });
    },
};
