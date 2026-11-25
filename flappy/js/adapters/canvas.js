/**
 * CanvasRendererAdapter - implements RendererPort.
 * Draws the board from the domain state: synthwave sky, pipes, bird, ground.
 * The North easter egg swaps the neon sunset palette for cold Stark blues.
 */
const CanvasRendererAdapter = {
    canvas: null,
    context: null,

    init() {
        this.canvas = document.getElementById('flappy');
        this.context = this.canvas.getContext('2d');
    },

    draw(game) {
        const context = this.context;
        const canvas = this.canvas;
        const north = document.body.classList.contains('north-theme');
        const palette = north ? {
            skyTop: '#060c1a',
            skyMid: '#0c1530',
            skyBottom: '#152746',
            sun: '#88ccff',
            scan: 'rgba(0, 0, 0, 0.10)',
            pipe: '#5f8fd0',
            pipeCap: '#b7d6f2',
            glow: '#88ccff',
            bird: '#cfe9ff',
            wing: '#88ccff',
            eye: '#0a1224',
            ground: '#0a1224',
            groundLine: '#88ccff',
            count: '#cfe9ff',
            countSub: 'rgba(228, 240, 255, 0.85)',
        } : {
            skyTop: '#0b0714',
            skyMid: '#1a0f2e',
            skyBottom: '#2b1240',
            sun: '#ff5e3a',
            scan: 'rgba(0, 0, 0, 0.12)',
            pipe: '#ff5e3a',
            pipeCap: '#ff8a5a',
            glow: '#ff5e3a',
            bird: '#ffd60a',
            wing: '#ff8a5a',
            eye: '#0b0714',
            ground: '#1a0f2e',
            groundLine: '#ff5e3a',
            count: '#ffd60a',
            countSub: 'rgba(244, 233, 255, 0.85)',
        };

        context.clearRect(0, 0, canvas.width, canvas.height);

        this.drawSky(context, canvas, palette);
        this.drawPipes(context, game.pipes, canvas, palette);
        this.drawBird(context, game.bird, palette);
        this.drawGround(context, canvas, palette);

        if (game.countdown > 0) {
            this.drawCountdown(context, canvas, Math.ceil(game.countdown), palette);
        }
    },

    drawSky(context, canvas, p) {
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, p.skyTop);
        gradient.addColorStop(0.55, p.skyMid);
        gradient.addColorStop(1, p.skyBottom);
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Sun
        context.save();
        context.shadowColor = p.glow;
        context.shadowBlur = 24;
        context.fillStyle = p.sun;
        context.beginPath();
        context.arc(canvas.width / 2, canvas.height * 0.32, 46, 0, Math.PI * 2);
        context.fill();
        context.restore();

        // Scanlines
        context.fillStyle = p.scan;
        for (let y = 0; y < canvas.height; y += 4) {
            context.fillRect(0, y, canvas.width, 1);
        }
    },

    drawPipes(context, pipes, canvas, p) {
        pipes.forEach((pipe) => {
            const topBottom = pipe.gapY;
            const bottomTop = pipe.gapY + pipe.gapHeight;

            context.fillStyle = p.pipe;
            context.shadowColor = p.glow;
            context.shadowBlur = 10;

            // Top pipe
            context.fillRect(pipe.x, 0, pipe.width, topBottom);
            // Bottom pipe
            context.fillRect(pipe.x, bottomTop, pipe.width, canvas.height - bottomTop);

            // Pipe caps
            context.fillStyle = p.pipeCap;
            context.fillRect(pipe.x - 4, topBottom - 14, pipe.width + 8, 14);
            context.fillRect(pipe.x - 4, bottomTop, pipe.width + 8, 14);

            context.shadowBlur = 0;
        });
    },

    drawBird(context, bird, p) {
        context.save();
        context.shadowColor = p.glow;
        context.shadowBlur = 14;
        context.fillStyle = p.bird;
        context.beginPath();
        context.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();

        // Wing
        context.fillStyle = p.wing;
        context.beginPath();
        context.ellipse(bird.x - 4, bird.y + 2, 8, 5, 0.4, 0, Math.PI * 2);
        context.fill();

        // Eye
        context.fillStyle = p.eye;
        context.beginPath();
        context.arc(bird.x + 5, bird.y - 4, 3, 0, Math.PI * 2);
        context.fill();
    },

    drawGround(context, canvas, p) {
        context.fillStyle = p.ground;
        context.fillRect(0, canvas.height - 12, canvas.width, 12);
        context.fillStyle = p.groundLine;
        context.fillRect(0, canvas.height - 12, canvas.width, 2);
    },

    drawCountdown(context, canvas, value, p) {
        const cx = canvas.width / 2;
        const cy = canvas.height * 0.36;

        context.save();
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        context.font = '700 84px "Chakra Petch", sans-serif';
        context.fillStyle = p.count;
        context.shadowColor = p.glow;
        context.shadowBlur = 28;
        context.fillText(String(value), cx, cy);

        context.shadowBlur = 0;
        context.font = '600 15px "Chakra Petch", sans-serif';
        context.fillStyle = p.countSub;
        context.fillText('GET READY', cx, cy + 62);
        context.restore();
    },
};
