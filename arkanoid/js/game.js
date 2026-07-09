const canvas = document.getElementById('arkanoid');
const context = canvas.getContext('2d');

let paddle, balls, bricks, powerUps;
let score, lives, level, gameOver, isPaused, gameStarted;
let currentLayout;
let powerUpSpawnQueue = [];
let particles = [];

const STORAGE_KEY = 'arkanoid_highscores';
const PLAYER_NAME_STORAGE = 'arkanoid_player_name';
let previousBestScore = 0;

function getPaddleX() {
    return paddle.x;
}

function setPaddleX(val) {
    paddle.x = Math.max(0, Math.min(canvas.width - PADDLE_WIDTH, val));
}

function initGame() {
    paddle = {
        x: (canvas.width - PADDLE_WIDTH) / 2,
        y: canvas.height - 30,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
    };

    balls = [];
    spawnBall();

    bricks = [];
    powerUps = [];
    powerUpSpawnQueue = [];
    particles = [];

    score = 0;
    lives = 3;
    level = 1;
    gameOver = false;
    isPaused = true;
    gameStarted = false;

    loadLevel(level);
    updateUI();
}

function spawnBall() {
    balls.push({
        x: canvas.width / 2,
        y: canvas.height - 50,
        dx: (Math.random() > 0.5 ? 1 : -1) * (BASE_SPEED + (level - 1) * 0.2),
        dy: -(BASE_SPEED + (level - 1) * 0.2),
        radius: BALL_RADIUS,
    });
}

function loadLevel(lvl) {
    const layout = getBrickLayout(lvl);
    currentLayout = layout;

    const brickColors = getBrickColors(lvl);
    const brickWidth = (canvas.width - 40) / layout.cols;
    const brickHeight = 20;
    const brickOffsetX = 20;
    const brickOffsetY = 30;

    bricks = [];
    for (let row = 0; row < layout.rows; row++) {
        for (let col = 0; col < layout.cols; col++) {
            if (layout.grid[row][col] > 0) {
                const isSpecial = isSpecialBrick(lvl, row, col);
                const brickColor = isSpecial ? '#fbbf24' : (brickColors[layout.grid[row][col]] || brickColors[1]);
                bricks.push({
                    x: brickOffsetX + col * brickWidth,
                    y: brickOffsetY + row * brickHeight,
                    width: brickWidth - 4,
                    height: brickHeight - 3,
                    hp: isSpecial ? 3 : 1,
                    maxHp: isSpecial ? 3 : 1,
                    color: brickColor,
                    isSpecial: isSpecial,
                    alive: true,
                    row: row,
                    col: col,
                    flashTimer: 0,
                });
            }
        }
    }
}

function updateUI() {
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const livesEl = document.getElementById('lives');
    if (scoreEl) scoreEl.textContent = `Score: ${score}`;
    if (levelEl) levelEl.textContent = `Level: ${level}`;
    if (livesEl) livesEl.textContent = `Lives: ${lives}`;
    updateBestScoreDisplay();
}

function getHighScores() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function getSavedName() {
    return localStorage.getItem(PLAYER_NAME_STORAGE) || '';
}

function saveHighScore(sc) {
    const highScores = getHighScores();
    const now = new Date();
    const nameInput = document.getElementById('player-name');
    const playerName = nameInput ? nameInput.value.trim() : '';
    const entry = {
        score: sc,
        name: playerName || 'Anonymous',
        date: now.toLocaleDateString('en-US'),
    };
    highScores.push(entry);
    highScores.sort((a, b) => b.score - a.score);
    const top5 = highScores.slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top5));
}

function getBestScore() {
    const highScores = getHighScores();
    return highScores.length > 0 ? highScores[0].score : 0;
}

function updateBestScoreDisplay() {
    const bestScoreEl = document.getElementById('best-score-value');
    if (bestScoreEl) {
        bestScoreEl.textContent = getBestScore();
    }
}

function renderHighScoresTable() {
    const highScores = getHighScores();
    const tableContainer = document.getElementById('high-scores-table');
    const table = document.getElementById('high-scores-list');

    if (!tableContainer || !table || highScores.length === 0) {
        return;
    }

    table.innerHTML = '';
    const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}', '4.', '5.'];

    highScores.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.className = `hs-row hs-row-${index + 1}`;
        row.innerHTML = `
            <td class="hs-rank">${medals[index]}</td>
            <td class="hs-name">${entry.name}</td>
            <td class="hs-score">${entry.score}</td>
            <td class="hs-date">${entry.date}</td>
        `;
        table.appendChild(row);
    });

    tableContainer.style.display = 'block';
}

function showNewHighScoreNotice() {
    const existing = document.getElementById('new-highscore-notice');
    if (existing) existing.remove();

    const notice = document.createElement('div');
    notice.id = 'new-highscore-notice';
    notice.textContent = 'NEW HIGH SCORE!';
    canvas.parentElement.appendChild(notice);

    setTimeout(() => notice.remove(), 2500);
}

function handleGameOver() {
    gameOver = true;
    isPaused = true;

    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const startBtn = document.getElementById('start-btn');
    if (overlay) overlay.style.display = 'flex';
    if (startBtn) startBtn.style.display = 'none';
    if (overlayTitle) overlayTitle.textContent = 'GAME OVER';

    updateBestScoreDisplay();
    saveHighScore(score);
    renderHighScoresTable();

    SoundManager.playGameOver();
    MusicPlayer.fadeOut(0.8);
    alert('Game Over! Press R to restart');
}

function handleLevelComplete() {
    if (level >= 3) {
        handleGameOver();
        return;
    }

    level++;
    loadLevel(level);
    balls = [];
    spawnBall();
    powerUps = [];
    powerUpSpawnQueue = [];
    particles = [];

    isPaused = true;
    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    if (overlay) overlay.style.display = 'flex';
    if (overlayTitle) overlayTitle.textContent = `LEVEL ${level}`;

    SoundManager.playLevelComplete();
    MusicPlayer.pause();
}

function spawnPowerUp(x, y, type) {
    powerUps.push({
        x: x,
        y: y,
        width: 20,
        height: 14,
        dy: 2,
        type: type,
        color: POWER_UP_COLORS[type] || '#22d3ee',
    });
}

function applyPowerUp(type) {
    SoundManager.playPowerUp();

    if (type === POWER_UP_TYPES.MULTI_BALL) {
        const originalBall = balls[0];
        if (originalBall) {
            for (let i = 0; i < 2; i++) {
                balls.push({
                    x: originalBall.x,
                    y: originalBall.y,
                    dx: originalBall.dx + (i === 0 ? 1 : -1) * 1,
                    dy: originalBall.dy,
                    radius: BALL_RADIUS,
                });
            }
        }
    } else if (type === POWER_UP_TYPES.EXTRA_LIFE) {
        lives = Math.min(lives + 1, 9);
        updateUI();
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4,
            radius: Math.random() * 2 + 1,
            color: color,
            alpha: 1,
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        context.globalAlpha = p.alpha;
        context.fillStyle = p.color;
        context.beginPath();
        context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        context.fill();
    });
    context.globalAlpha = 1;
}

function updateBalls() {
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];

        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collisions
        if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.dx = Math.abs(ball.dx);
            SoundManager.playBounce();
        }
        if (ball.x + ball.radius >= canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.dx = -Math.abs(ball.dx);
            SoundManager.playBounce();
        }
        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.dy = Math.abs(ball.dy);
            SoundManager.playBounce();
        }

        // Bottom - lose ball
        if (ball.y + ball.radius >= canvas.height) {
            balls.splice(i, 1);
            if (balls.length === 0) {
                lives--;
                updateUI();
                if (lives <= 0) {
                    handleGameOver();
                    return;
                } else {
                    SoundManager.playLoseLife();
                    balls.push({
                        x: canvas.width / 2,
                        y: canvas.height - 50,
                        dx: (Math.random() > 0.5 ? 1 : -1) * (BASE_SPEED + (level - 1) * 0.3),
                        dy: -(BASE_SPEED + (level - 1) * 0.3),
                        radius: BALL_RADIUS,
                    });
                }
            }
        }

        // Paddle collision
        if (
            ball.dy > 0 &&
            ball.y + ball.radius >= paddle.y &&
            ball.y + ball.radius <= paddle.y + paddle.height + 4 &&
            ball.x >= paddle.x - ball.radius &&
            ball.x <= paddle.x + paddle.width + ball.radius
        ) {
            const hitPos = (ball.x - paddle.x) / paddle.width;
            const angle = hitPos * Math.PI * 0.7 + Math.PI * 0.15;
            const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            ball.dx = Math.cos(angle) * speed;
            ball.dy = -Math.abs(Math.sin(angle) * speed);
            ball.y = paddle.y - ball.radius;
            SoundManager.playPaddleHit();
        }

        // Brick collisions
        for (const brick of bricks) {
            if (!brick.alive) continue;

            const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
            const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
            const distX = ball.x - closestX;
            const distY = ball.y - closestY;
            const dist = Math.sqrt(distX * distX + distY * distY);

            if (dist <= ball.radius) {
                brick.hp--;
                brick.flashTimer = 4;

                if (brick.hp <= 0) {
                    brick.alive = false;
                    score += brick.isSpecial ? 30 : 10;
                    updateUI();
                    createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 8);

                    if (brick.isSpecial) {
                        SoundManager.playSpecialBrickBreak();
                        powerUpSpawnQueue.push({ x: brick.x + brick.width / 2, y: brick.y + brick.height / 2 });
                    } else {
                        SoundManager.playBrickBreak();
                    }
                } else {
                    SoundManager.playBrickBreak();
                }

                if (brick.flashTimer > 0) {
                    brick.flashTimer--;
                }

                // Reflect ball
                const overlapX = ball.radius - Math.abs(distX);
                const overlapY = ball.radius - Math.abs(distY);

                if (overlapX < overlapY) {
                    ball.dx = -ball.dx;
                } else {
                    ball.dy = -ball.dy;
                }

                break;
            }
        }
    }
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const pu = powerUps[i];
        pu.y += pu.dy;

        if (pu.y > canvas.height) {
            powerUps.splice(i, 1);
            continue;
        }

        if (
            pu.y + pu.height >= paddle.y &&
            pu.y <= paddle.y + paddle.height &&
            pu.x + pu.width >= paddle.x &&
            pu.x <= paddle.x + paddle.width
        ) {
            applyPowerUp(pu.type);
            createParticles(pu.x + pu.width / 2, pu.y + pu.height / 2, pu.color, 12);
            powerUps.splice(i, 1);
        }
    }

    if (powerUpSpawnQueue.length > 0 && powerUps.length < 2) {
        const spawn = powerUpSpawnQueue.shift();
        const type = getPowerUpType();
        powerUps.push({
            x: spawn.x,
            y: spawn.y,
            width: 20,
            height: 14,
            dy: 2,
            type: type,
            color: POWER_UP_COLORS[type],
        });
    }
}

function checkLevelComplete() {
    for (const brick of bricks) {
        if (brick.alive) return;
    }
    handleLevelComplete();
}

function drawPaddle() {
    context.fillStyle = '#22d3ee';
    context.shadowColor = '#22d3ee';
    context.shadowBlur = 10;
    context.beginPath();
    context.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
    context.fill();
    context.shadowBlur = 0;
}

function drawBalls() {
    balls.forEach(ball => {
        context.fillStyle = '#fff';
        context.shadowColor = '#22d3ee';
        context.shadowBlur = 8;
        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
    });
}

function drawBricks() {
    bricks.forEach(brick => {
        if (!brick.alive) return;

        let color = brick.color;
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
}

function drawPowerUps() {
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
}

function handleDAS(direction, action) {
    const keyCode = direction === 'left' ? 'ArrowLeft' : 'ArrowRight';
    const isDown = keys[keyCode];

    if (isDown) {
        if (!direction._pressed) {
            action();
            direction._pressed = true;
            direction._timer = 0;
            direction._state = 'das_wait';
        } else if (direction._state === 'das_wait') {
            direction._timer++;
            if (direction._timer >= 10) {
                action();
                direction._state = 'arr';
                direction._timer = 0;
            }
        } else if (direction._state === 'arr') {
            direction._timer++;
            if (direction._timer >= 3) {
                action();
                direction._timer = 0;
            }
        }
    } else {
        direction._pressed = false;
        direction._timer = 0;
        direction._state = 'idle';
    }
}

let dasLeft = { _pressed: false, _timer: 0, _state: 'idle' };
let dasRight = { _pressed: false, _timer: 0, _state: 'idle' };

function handleInput() {
    if (isPaused || gameOver) return;

    handleDAS(dasLeft, () => {
        setPaddleX(paddle.x - 6);
    });
    handleDAS(dasRight, () => {
        setPaddleX(paddle.x + 6);
    });
}

function draw() {
    handleInput();

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

    if (!isPaused && !gameOver && gameStarted) {
        updateBalls();
        updatePowerUps();
        updateParticles();
        checkLevelComplete();
    }

    drawBricks();
    drawPaddle();
    drawBalls();
    drawPowerUps();
    drawParticles();

    requestAnimationFrame(draw);
}

function togglePause() {
    if (!gameStarted) return;
    isPaused = !isPaused;
    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    if (overlay) {
        overlay.style.display = isPaused ? 'flex' : 'none';
    }
    if (!isPaused && overlayTitle) {
        overlayTitle.textContent = 'ARKANOID';
    }
    if (isPaused) {
        MusicPlayer.pause();
    } else {
        MusicPlayer.resume();
    }
}

document.addEventListener('keydown', (e) => {
    if (!gameStarted) {
        if (e.key === 'Enter') {
            startGame();
        }
        return;
    }
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
    }
    if (gameOver) return;
    if (isPaused && e.key === 'Enter') {
        togglePause();
        const overlayTitle = document.getElementById('overlay-title');
        if (overlayTitle) overlayTitle.textContent = 'ARKANOID';
        return;
    }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        togglePause();
        return;
    }
});

// Mouse control
canvas.addEventListener('mousemove', (e) => {
    if (!gameStarted || isPaused || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    setPaddleX(mouseX - paddle.width / 2);
});

canvas.addEventListener('click', () => {
    if (!gameStarted) {
        startGame();
    } else if (isPaused && !gameOver) {
        togglePause();
        const overlayTitle = document.getElementById('overlay-title');
        if (overlayTitle) overlayTitle.textContent = 'ARKANOID';
    }
});

// Touch controls
function setupTouchButton(selector, onStart, onEnd) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
        if (e.cancelable) e.preventDefault();
        btn.classList.add('pressed');
        if (onStart) onStart();
    }, { passive: false });
    btn.addEventListener('touchend', (e) => {
        if (e.cancelable) e.preventDefault();
        btn.classList.remove('pressed');
        if (onEnd) onEnd();
    }, { passive: false });
    btn.addEventListener('touchcancel', (e) => {
        btn.classList.remove('pressed');
        if (onEnd) onEnd();
    });
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        if (onStart) onStart();
    });
    btn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        if (onEnd) onEnd();
    });
    btn.addEventListener('mouseleave', (e) => {
        btn.classList.remove('pressed');
        if (onEnd) onEnd();
    });
}

setupTouchButton('[data-action="left"]',
    () => { keys['ArrowLeft'] = true; },
    () => { keys['ArrowLeft'] = false; }
);

setupTouchButton('[data-action="right"]',
    () => { keys['ArrowRight'] = true; },
    () => { keys['ArrowRight'] = false; }
);

setupTouchButton('[data-action="restart"]', resetGame);

function resetGame() {
    if (!gameStarted) return;
    initGame();
    isPaused = false;
    gameStarted = true;

    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'none';

    const overlayTitle = document.getElementById('overlay-title');
    if (overlayTitle) overlayTitle.textContent = 'ARKANOID';

    const highScoresTable = document.getElementById('high-scores-table');
    if (highScoresTable) highScoresTable.style.display = 'none';

    previousBestScore = getBestScore();
    updateBestScoreDisplay();

    SoundManager.startBgm();
}

const playerNameInput = document.getElementById('player-name');
if (playerNameInput) {
    const savedName = getSavedName();
    playerNameInput.value = savedName;

    playerNameInput.addEventListener('input', () => {
        localStorage.setItem(PLAYER_NAME_STORAGE, playerNameInput.value);
    });
}

// Sound controls
const muteBtn = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');

function updateMuteIcon() {
    if (muteBtn) {
        if (SoundManager.getMuteState() || SoundManager.getVolume() === 0) {
            muteBtn.textContent = '\u{1F507}';
        } else {
            muteBtn.textContent = '\u{1F50A}';
        }
    }
}

if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        SoundManager.toggleMute();
        updateMuteIcon();
    });
}

if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        SoundManager.setVolume(parseFloat(e.target.value));
        updateMuteIcon();
    });
}

SoundManager.setVolume(0.7);
updateMuteIcon();

const bgmMuteBtn = document.getElementById('bgm-mute-btn');
if (bgmMuteBtn) {
    bgmMuteBtn.addEventListener('click', () => {
        MusicPlayer.toggleMute();
    });
}

const pauseBtn = document.getElementById('pause-btn');
if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
}

// Initialize
initGame();

// Show start screen
const overlay = document.getElementById('pause-overlay');
const overlayTitle = document.getElementById('overlay-title');
const startBtn = document.getElementById('start-btn');
if (overlay) overlay.style.display = 'flex';
if (overlayTitle) overlayTitle.textContent = 'ARKANOID';
if (startBtn) startBtn.style.display = 'block';

function startGame() {
    gameStarted = true;
    isPaused = false;
    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const startBtn = document.getElementById('start-btn');
    if (overlay) overlay.style.display = 'none';
    if (overlayTitle) overlayTitle.textContent = 'ARKANOID';
    if (startBtn) startBtn.style.display = 'none';
    SoundManager.startBgm();
}

if (startBtn) {
    startBtn.addEventListener('click', startGame);
}

// Start game loop
previousBestScore = getBestScore();
updateBestScoreDisplay();
draw();
