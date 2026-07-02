const lerp = (start, end, t) => start + (end - start) * t;
const ANIMATION_SPEED = 0.15;
let rowsToClear = [];
let gravityTimer = 0;

function getGravityInterval() {
    const speeds = [60, 50, 40, 30, 20, 15, 10, 5];
    return speeds[Math.min(player.level - 1, speeds.length - 1)] || 5;
}

// DAS (Delayed Auto Shift) constants
const DAS_DELAY = 10;  // ~170ms at 60fps
const ARR_RATE = 3;    // ~50ms at 60fps
let dasTimers = { left: 0, right: 0, down: 0 };
let dasStates = { left: 'idle', right: 'idle', down: 'idle' };
let rotationQueue = [];

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextContext = nextCanvas.getContext('2d');

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

context.scale(BLOCK_SIZE, BLOCK_SIZE);
nextContext.scale(BLOCK_SIZE, BLOCK_SIZE);

const grid = createGrid();

let gameOver = false;
let isPaused = false;
const STORAGE_KEY = 'tetris_highscores';
let previousBestScore = 0;


function createGrid() {
    const arena = [];
    for (let row = 0; row < ROWS; row++) {
        const newRow = [];
        for (let col = 0; col < COLS; col++) {
            newRow[col] = 0;
        }
        arena.push(newRow);
    }
    return arena;
}

const player = {
    pos: {x: 0, y: 0},
    currentPos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    level: 1,
    linesCleared: 0,
    state: 'idle',
    oldMatrix: null,
    rotationProgress: 0,
};

let nextMatrix = null;

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0) {
                if (o.y + y >= ROWS || o.x + x >= COLS || o.y + y < 0 || o.x + x < 0) {
                    return true;
                }
                if (arena[y + o.y] && arena[y + o.y][x + o.x] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function movePlayer(dx, dy) {
    if (gameOver || isPaused) return;
    player.pos.x += dx;
    player.pos.y += dy;
    if (collide(grid, player)) {
        player.pos.x -= dx;
        player.pos.y -= dy;
        if (dy > 0) {
            merge(grid, player);
            clearLines();
            player.pos.y = 0;
            player.currentPos.y = 0;
            player.matrix = nextMatrix;
            player.rotationProgress = 0;
            player.oldMatrix = null;
            nextMatrix = createPiece();
            player.pos.x = Math.floor((COLS - player.matrix[0].length) / 2);
            player.currentPos.x = player.pos.x;
            if (collide(grid, player)) {
                handleGameOver();
            }
        }
    }
    scoreUpdate();
    if (dx !== 0) {
        SoundManager.playMove();
    }
}

function playerDrop() {
    movePlayer(0, 1);
}



function playerMove(dir) {
    movePlayer(dir, 0);
}



function playerRotate(dir) {
    if (gameOver || isPaused) return;
    
    // Save old matrix for rotation animation
    player.oldMatrix = player.matrix.map(row => [...row]);
    player.rotationProgress = 1;
    
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(grid, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix.length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
    player.currentPos.x = player.pos.x;
    SoundManager.playRotate();
}

function createPiece() {
    const pieces = 'IJLOSTZ';
    const type = pieces[pieces.length * Math.random() | 0];
    const piece = TETRIMINOS[type];
    const matrix = piece.shape.map((row, y) => row.map((val, x) => (val !== 0 ? type : 0)));
    return matrix;
}

function spawnPiece() {
    const matrix = nextMatrix || createPiece();
    nextMatrix = createPiece();
    player.pos.x = Math.floor((COLS - matrix[0].length) / 2);
    player.pos.y = 0;
    player.currentPos.x = player.pos.x;
    player.currentPos.y = player.pos.y;
    player.rotationProgress = 0;
    player.oldMatrix = null;
    return matrix;
}

function clearLines() {
    const fullRows = [];
    for (let y = ROWS - 1; y >= 0; y--) {
        if (grid[y].every(value => value !== 0)) {
            fullRows.push(y);
        }
    }
    
    if (fullRows.length > 0) {
        player.score += fullRows.length * 100;
        player.linesCleared += fullRows.length;
        player.level = Math.floor(player.linesCleared / 10) + 1;
        
        fullRows.forEach(y => {
            rowsToClear.push({ y, data: [...grid[y]], alpha: 1.0 });
        });
        
        fullRows.sort((a, b) => b - a).forEach(y => {
            grid.splice(y, 1);
        });
        
        for (let i = 0; i < fullRows.length; i++) {
            grid.unshift(new Array(COLS).fill(0));
        }
        
        if (player.score > previousBestScore) {
            previousBestScore = player.score;
            updateBestScoreDisplay();
            showNewHighScoreNotice();
        }
        
        SoundManager.playLineClear(fullRows.length);
    }
}

function getHighScores() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveHighScore(score) {
    const highScores = getHighScores();
    const now = new Date();
    const entry = {
        score: score,
        date: now.toLocaleDateString('es-ES')
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
    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
    
    highScores.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.className = `hs-row hs-row-${index + 1}`;
        row.innerHTML = `
            <td class="hs-rank">${medals[index]}</td>
            <td class="hs-score">${entry.score}</td>
            <td class="hs-date">${entry.date}</td>
        `;
        table.appendChild(row);
    });
    
    tableContainer.style.display = 'block';
}

function showNewHighScoreNotice() {
    const existing = document.getElementById('new-highscore-notice');
    if (existing) {
        existing.remove();
    }
    
    const notice = document.createElement('div');
    notice.id = 'new-highscore-notice';
    notice.textContent = '¡NUEVO RECORD!';
    canvas.parentElement.appendChild(notice);
    
    setTimeout(() => {
        notice.remove();
    }, 2500);
}




function handleGameOver() {
    gameOver = true;
    isPaused = true;
    dasStates = { left: 'idle', right: 'idle', down: 'idle' };
    dasTimers = { left: 0, right: 0, down: 0 };
    rotationQueue = [];

    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    if (overlay) {
        overlay.style.display = 'flex';
    }
    if (overlayTitle) {
        overlayTitle.textContent = 'GAME OVER';
    }
    
    updateBestScoreDisplay();
    saveHighScore(player.score);
    renderHighScoresTable();
    
    SoundManager.playGameOver();
    alert('Game Over! Presiona R para reiniciar');
}

function scoreUpdate() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = `Puntos: ${player.score}`;
    }
    const levelElement = document.getElementById('level');
    if (levelElement) {
        levelElement.textContent = `Nivel: ${player.level}`;
    }
    updateBestScoreDisplay();
}

function handleDAS(direction, action) {
    const keyCode = direction === 'left' ? 'ArrowLeft' : direction === 'right' ? 'ArrowRight' : 'ArrowDown';
    const isDown = keys[keyCode];
    const state = dasStates[direction];

    if (isDown) {
        if (state === 'idle') {
            action();
            dasStates[direction] = 'das_wait';
            dasTimers[direction] = 0;
        } else if (state === 'das_wait') {
            dasTimers[direction]++;
            if (dasTimers[direction] >= DAS_DELAY) {
                action();
                dasStates[direction] = 'arr';
                dasTimers[direction] = 0;
            }
        } else if (state === 'arr') {
            dasTimers[direction]++;
            if (dasTimers[direction] >= ARR_RATE) {
                action();
                dasTimers[direction] = 0;
            }
        }
    } else {
        dasStates[direction] = 'idle';
        dasTimers[direction] = 0;
    }
}

function handleInput() {
    if (isPaused || gameOver) return;

    handleDAS('left', () => playerMove(-1));
    handleDAS('right', () => playerMove(1));
    handleDAS('down', () => playerDrop());

    if (rotationQueue.length > 0) {
        const event = rotationQueue.shift();
        if (event.type === 'rotate') {
            playerRotate(event.dir);
        }
    }
}

function draw() {
    handleInput();

    context.fillStyle = '#000';
    context.fillRect(0, 0, COLS, ROWS);

    // Smoothly interpolate currentPos towards pos
    player.currentPos.x = lerp(player.currentPos.x, player.pos.x, ANIMATION_SPEED);
    player.currentPos.y = lerp(player.currentPos.y, player.pos.y, ANIMATION_SPEED);
    
    // Handle rotation animation
    if (player.rotationProgress > 0) {
        player.rotationProgress -= 0.08;
        if (player.rotationProgress < 0) {
            player.rotationProgress = 0;
            player.oldMatrix = null;
        }
    }

    // Handle Gravity (timer-based)
    if (!isPaused && !gameOver) {
        gravityTimer++;
        if (gravityTimer >= getGravityInterval()) {
            gravityTimer = 0;
            if (!collide(grid, { pos: {x: player.pos.x, y: player.pos.y + 1}, matrix: player.matrix })) {
                player.pos.y++;
            } else {
                merge(grid, player);
                clearLines();
                scoreUpdate();
                player.pos.y = 0;
                player.currentPos.y = 0;
                player.matrix = nextMatrix;
                player.rotationProgress = 0;
                player.oldMatrix = null;
                nextMatrix = createPiece();
                player.pos.x = Math.floor((COLS - player.matrix[0].length) / 2);
                player.currentPos.x = player.pos.x;
                if (collide(grid, player)) {
                    handleGameOver();
                }
            }
        }
    }

    drawMatrix(grid, {x: 0, y: 0});

    // Render Clearing Rows Animation (single flash frame)
    if (rowsToClear.length > 0) {
        for (let i = rowsToClear.length - 1; i >= 0; i--) {
            const rowObj = rowsToClear[i];
            rowObj.alpha -= 0.2;

            if (rowObj.alpha > 0) {
                context.globalAlpha = rowObj.alpha > 0.5 ? 1.0 : rowObj.alpha * 2;
                context.fillStyle = '#fff';
                context.fillRect(0, rowObj.y, COLS, 1);
                context.globalAlpha = 1.0;
            }

            if (rowObj.alpha <= 0) {
                rowsToClear.splice(i, 1);
            }
        }
    }

    // Ghost Piece logic
    const ghostPos = { ...player.pos };
    while (!collide(grid, { pos: ghostPos, matrix: player.matrix })) {
        ghostPos.y++;
    }
    ghostPos.y--;

    context.globalAlpha = 0.3;
    drawMatrix(player.matrix, ghostPos);
    context.globalAlpha = 1.0;

    // Draw player piece with rotation animation
    if (player.rotationProgress > 0 && player.oldMatrix) {
        const cols = player.oldMatrix[0].length;
        const rows = player.oldMatrix.length;
        const centerX = player.currentPos.x + cols / 2;
        const centerY = player.currentPos.y + rows / 2;
        const angle = (1 - player.rotationProgress) * Math.PI / 2;

        context.save();
        context.translate(centerX, centerY);
        context.rotate(angle);
        drawMatrix(player.oldMatrix, {x: -cols / 2, y: -rows / 2});
        context.restore();
    } else {
        drawMatrix(player.matrix, player.currentPos);
    }

    // Draw Next Piece Preview
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, 4, 4);
    if (nextMatrix) {
        const offsetX = Math.floor((4 - nextMatrix[0].length) / 2);
        const offsetY = Math.floor((4 - nextMatrix.length) / 2);
        drawMatrix(nextMatrix, {x: offsetX, y: offsetY}, nextContext);
    }

    context.fillStyle = 'white';
    context.font = '1px Arial';
    context.fillText(`Puntos: ${player.score}`, 0.5, 1);
    context.fillText(`Nivel: ${player.level}`, 0.5, 2);

    requestAnimationFrame(draw);
}


function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value] || '#fff';
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            } else {
                ctx.strokeStyle = '#111';
                ctx.lineWidth = 0.05;
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// Initialize
player.matrix = spawnPiece();

function togglePause() {
    isPaused = !isPaused;
    const overlay = document.getElementById('pause-overlay');
    if (overlay) {
        overlay.style.display = isPaused ? 'flex' : 'none';
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
    }
    if (gameOver) return;
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        togglePause();
        return;
    }
    if (e.key === 'ArrowUp') {
        if (rotationQueue.length < 3) {
            rotationQueue.push({ type: 'rotate', dir: 1 });
        }
    } else if (e.key === ' ') {
        while (!collide(grid, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(grid, player);
        clearLines();
        scoreUpdate();
        SoundManager.playHardDrop();
        player.matrix = spawnPiece();
        player.currentPos.x = player.pos.x;
        player.currentPos.y = player.pos.y;
        if (collide(grid, player)) {
            handleGameOver();
        }
    }
});

const pauseBtn = document.getElementById('pause-btn');
if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
}

const muteBtn = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');

function updateMuteIcon() {
    if (muteBtn) {
        if (SoundManager.getMuteState() || SoundManager.getVolume() === 0) {
            muteBtn.textContent = '🔇';
        } else {
            muteBtn.textContent = '🔊';
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

// Touch controls
function setupTouchButton(selector, onStart, onEnd) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        if (onStart) onStart();
    }, { passive: false });
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
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
setupTouchButton('[data-action="down"]',
    () => { keys['ArrowDown'] = true; },
    () => { keys['ArrowDown'] = false; }
);
setupTouchButton('[data-action="rotate"]',
    () => {
        if (!gameOver && !isPaused && rotationQueue.length < 3) {
            rotationQueue.push({ type: 'rotate', dir: 1 });
        }
    }
);
setupTouchButton('[data-action="drop"]',
    () => {
        if (gameOver || isPaused) return;
        while (!collide(grid, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(grid, player);
        clearLines();
        scoreUpdate();
        SoundManager.playHardDrop();
        player.matrix = spawnPiece();
        player.currentPos.x = player.pos.x;
        player.currentPos.y = player.pos.y;
        if (collide(grid, player)) {
            handleGameOver();
        }
    }
);
setupTouchButton('[data-action="restart"]', resetGame);

function resetGame() {
    grid.forEach(row => row.fill(0));
    player.score = 0;
    player.level = 1;
    player.linesCleared = 0;
    player.matrix = spawnPiece();
    gameOver = false;
    isPaused = false;
    dasStates = { left: 'idle', right: 'idle', down: 'idle' };
    dasTimers = { left: 0, right: 0, down: 0 };
    rotationQueue = [];
    rowsToClear = [];
    previousBestScore = getBestScore();
    
    const overlay = document.getElementById('pause-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    const overlayTitle = document.getElementById('overlay-title');
    if (overlayTitle) {
        overlayTitle.textContent = 'PAUSA';
    }
    
    const highScoresTable = document.getElementById('high-scores-table');
    if (highScoresTable) {
        highScoresTable.style.display = 'none';
    }
    
    updateBestScoreDisplay();
}

// Start game loop
previousBestScore = getBestScore();
updateBestScoreDisplay();
draw();
