/**
 * BallPhysics — pure ball/paddle/brick geometry.
 * No DOM and no audio. Randomness comes in through a RandomPort.
 */
const BallPhysics = {
    /** Magnitude of the velocity vector (never 0, so callers can divide by it). */
    speed(ball) {
        return Math.hypot(ball.dx, ball.dy) || 1;
    },

    // Keeps trajectories playable: no near-horizontal crawls that bounce side to side
    // forever, and no locked vertical channels between bricks or walls.
    clampAngle(ball, random) {
        const speed = this.speed(ball);
        const minDy = speed * MIN_VERTICAL_SHARE;
        if (Math.abs(ball.dy) < minDy) {
            ball.dy = Math.sign(ball.dy || 1) * minDy;
            ball.dx = Math.sign(ball.dx || 1) * Math.sqrt(Math.max(speed * speed - ball.dy * ball.dy, 0));
        } else if (Math.abs(ball.dx) < speed * 0.05) {
            // Escape perfect vertical loops: nudge sideways without changing speed
            ball.dx = (random.next() < 0.5 ? -1 : 1) * speed * 0.1;
            ball.dy = Math.sign(ball.dy || -1) * Math.sqrt(Math.max(speed * speed - ball.dx * ball.dx, 0));
        }
    },

    // Classic position-based bounce. The ball always leaves upward, at an angle set by
    // where it lands on the paddle, and at the same speed it arrived.
    paddleBounce(ball, paddle, boardWidth, random) {
        const halfW = paddle.width / 2 + ball.radius;
        const hit = Math.max(-1, Math.min(1, (ball.x - (paddle.x + paddle.width / 2)) / halfW));
        const angle = hit * PADDLE_MAX_BOUNCE + (random.next() * 2 - 1) * PADDLE_JITTER;
        const speed = this.speed(ball);
        ball.dx = speed * Math.sin(angle);
        ball.dy = -speed * Math.cos(angle);
        ball.y = paddle.y - ball.radius;
        ball.x = Math.max(ball.radius, Math.min(boardWidth - ball.radius, ball.x));
    },

    /** @returns {{distX:number, distY:number, len:number}|null} contact data when the ball touches the brick */
    brickContact(ball, brick) {
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        if (dist > ball.radius) return null;
        return { distX: distX, distY: distY, len: dist };
    },

    /** Reflects the ball off the brick face it touched and pushes it out of the brick. */
    reflect(ball, contact) {
        const { distX, distY, len } = contact;
        let nx, ny;
        if (len > 0.001) {
            nx = distX / len;
            ny = distY / len;
        } else {
            const vlen = Math.hypot(ball.dx, ball.dy) || 1;
            nx = -ball.dx / vlen;
            ny = -ball.dy / vlen;
        }
        const dot = ball.dx * nx + ball.dy * ny;
        if (dot < 0) {
            ball.dx -= 2 * dot * nx;
            ball.dy -= 2 * dot * ny;
        }
        const push = ball.radius - len + 1;
        ball.x += nx * push;
        ball.y += ny * push;
    },
};
