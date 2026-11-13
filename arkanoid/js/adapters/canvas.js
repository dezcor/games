/**
 * CanvasRendererAdapter — implements RendererPort.
 * Draws the board from the domain state: background grid, bricks, paddle, balls,
 * power-ups and particles.
 */
const CanvasRendererAdapter = {
    canvas: null,
    context: null,

    init() {
        this.canvas = document.getElementById('arkanoid');
        this.context = this.canvas.getContext('2d');
    },

    draw(game) {
        const context = this.context;
        const canvas = this.canvas;

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Background grid
        context.strokeStyle = 'rgba(34, 211, 238, 0.03)';
        context.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
        }

        this.drawBricks(context, game.bricks);
        this.drawPaddle(context, game.paddle);
        this.drawBalls(context, game.balls);
        this.drawPowerUps(context, game.powerUps);
        this.drawParticles(context, game.particles);
    },

    drawPaddle(context, paddle) {
        context.fillStyle = '#22d3ee';
        context.shadowColor = '#22d3ee';
        context.shadowBlur = 10;
        context.beginPath();
        context.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
        context.fill();
        context.shadowBlur = 0;
    },

    drawBalls(context, balls) {
        balls.forEach(ball => {
            context.fillStyle = '#fff';
            context.shadowColor = '#22d3ee';
            context.shadowBlur = 8;
            context.beginPath();
            context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            context.fill();
            context.shadowBlur = 0;
        });
    },

    getSpecialBrickColor(hp) {
        const hpColors = { 3: '#fbbf24', 2: '#fb923c', 1: '#f87171' };
        return hpColors[hp] || '#fbbf24';
    },

    drawBricks(context, bricks) {
        bricks.forEach(brick => {
            if (!brick.alive) return;

            let color = brick.color;
            if (brick.isSpecial) {
                color = this.getSpecialBrickColor(brick.hp);
            }
            if (brick.flashTimer > 0) {
                color = '#fff';
            }

            context.fillStyle = color;
            context.shadowColor = color;
            context.shadowBlur = brick.isSpecial ? 6 : 3;
            context.beginPath();
            context.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
            context.fill();
            context.shadowBlur = 0;

            if (brick.isSpecial && brick.hp < brick.maxHp) {
                context.fillStyle = 'rgba(255,255,255,0.5)';
                context.font = '10px Inter';
                context.textAlign = 'center';
                context.fillText(brick.hp, brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
            }
        });
    },

    drawPowerUps(context, powerUps) {
        powerUps.forEach(pu => {
            context.fillStyle = pu.color;
            context.shadowColor = pu.color;
            context.shadowBlur = 8;
            context.beginPath();
            context.roundRect(pu.x - pu.width / 2, pu.y, pu.width, pu.height, 4);
            context.fill();
            context.shadowBlur = 0;

            context.fillStyle = '#1a1028';
            context.font = 'bold 9px Inter';
            context.textAlign = 'center';
            const icon = pu.type === POWER_UP_TYPES.MULTI_BALL ? 'M' : '+';
            context.fillText(icon, pu.x, pu.y + 10);
        });
    },

    drawParticles(context, particles) {
        particles.forEach(p => {
            context.globalAlpha = p.alpha;
            context.fillStyle = p.color;
            context.beginPath();
            context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            context.fill();
        });
        context.globalAlpha = 1;
    },
};
