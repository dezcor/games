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
let dropInterval;

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
    matrix: null,
    score: 0,
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

function playerDrop() {
    if (gameOver) return;
    player.pos.y++;
    if (collide(grid, player)) {
        player.pos.y--;
        merge(grid, player);
        clearLines();
        player.pos.y = 0;
        player.matrix = nextMatrix;
        nextMatrix = createPiece();
        if (collide(grid, player)) {
            handleGameOver();
        }
    }
    scoreUpdate();
}

function playerMove(dir) {
    if (gameOver) return;
    player.pos.x += dir;
    if (collide(grid, player)) {
        player.pos.x -= dir;
    }
}

function playerRotate(dir) {
    if (gameOver) return;
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(grid, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix.length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
        }
    }
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
    return matrix;
}

function clearLines() {
    let rowsCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        const row = grid[y];
        if (row.every(value => value !== 0)) {
            grid.splice(y, 1);
            grid.unshift(new Array(COLS).fill(0));
            rowsCleared++;
            y++;
        }
    }
    if (rowsCleared > 0) {
        player.score += rowsCleared * 100;
    }
}

function handleGameOver() {
    gameOver = true;
    clearInterval(dropInterval);
    alert('Game Over! Presiona R para reiniciar');
}

function scoreUpdate() {
    // Logic for score updates can be added here
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, COLS, ROWS);

    drawMatrix(grid, {x: 0, y: 0});

    // Ghost Piece logic
    const ghostPos = { ...player.pos };
    while (!collide(grid, { pos: ghostPos, matrix: player.matrix })) {
        ghostPos.y++;
    }
    ghostPos.y--;

    context.globalAlpha = 0.3;
    drawMatrix(player.matrix, ghostPos);
    context.globalAlpha = 1.0;

    drawMatrix(player.matrix, player.pos);

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

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
    }
    if (gameOver) return;
    if (e.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (e.key === 'ArrowRight') {
        playerMove(1);
    } else if (e.key === 'ArrowDown') {
        playerDrop();
    } else if (e.key === 'ArrowUp') {
        playerRotate(1);
    } else if (e.key === ' ') {
        while (!collide(grid, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(grid, player);
        clearLines();
        player.matrix = spawnPiece();
        if (collide(grid, player)) {
            handleGameOver();
        }
    }
});

function resetGame() {
    grid.forEach(row => row.fill(0));
    player.score = 0;
    player.matrix = spawnPiece();
    gameOver = false;
    clearInterval(dropInterval);
    dropInterval = setInterval(playerDrop, 1000);
}

// Start game loop
dropInterval = setInterval(playerDrop, 1000);
draw();
