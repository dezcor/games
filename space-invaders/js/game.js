const canvas = document.getElementById('invaders');
const ctx = canvas.getContext('2d');

// Global variables
let score, lives, gameOver, isPaused, gameStarted;
let alienColors = ['#ff6b8a', '#ff8fa3', '#ff2060', '#ff4080', '#ff6b8a'];
let bullets = [];
let alienBullets = [];
let particles = [];
let ufos = [];
let playerX;
let aliens = [];
let alienDirection = 1;
let alienMoveTimer = 0;
let alienMoveInterval = 600;
let alienSpeed = ALIEN_BASE_SPEED;
let lastTime = 0;
let shootCooldown = 0;
let ufoSpawnTimer = 0;
let alienShootTimer = 0;
let previousBestScore = 0;
let level = 1;
let levelBonus = 0;
let selectedDifficulty = 'normal';

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

function initAliens() {
    aliens = [];
    for (let r = 0; r < ALIEN_ROWS; r++) {
        for (let c = 0; c < ALIEN_COLS; c++) {
            aliens.push({
                x: ALIEN_START_X + c * (ALIEN_WIDTH + ALIEN_X_GAP),
                y: ALIEN_START_Y + r * (ALIEN_HEIGHT + ALIEN_Y_GAP),
                alive: true,
                row: r,
                type: r < 2 ? 'TYPE_1' : r < 4 ? 'TYPE_2' : 'TYPE_3',
                baseSpeed: r < 2 ? 0.5 : r < 4 ? 0.6 : 0.7
            });
        }
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: x + ALIEN_WIDTH / 2,
            y: y + ALIEN_HEIGHT / 2,
            vx: (Math.random() - 0.5) * PARTICLE_SPEED * 4,
            vy: (Math.random() - 0.5) * PARTICLE_SPEED * 4,
            life: PARTICLE_LIFETIME,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles(delta) {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= delta;
        return p.life > 0;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / PARTICLE_LIFETIME;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
}

function initGame() {
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    score = 0;
    lives = diff.lives;
    level = 1;
    gameOver = false;
    isPaused = true;
    gameStarted = false;
    bullets = [];
    alienBullets = [];
    ufos = [];
    particles = [];
    ufoSpawnTimer = 0;
    alienShootTimer = 0;
    alienDirection = 1;
    alienMoveTimer = 0;
    alienMoveInterval = 600;
    alienSpeed = diff.alienSpeed;
    shootCooldown = 0;
    previousBestScore = 0;
    levelBonus = 0;
    playerX = canvas.width / 2 - PLAYER_WIDTH / 2;

    initAliens();
    updateUI();
}

function updateUI() {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    if (scoreEl) scoreEl.textContent = `Score: ${score}`;
    if (livesEl) livesEl.textContent = `Lives: ${lives}`;
    updateBestScoreDisplay();
}

function resetAliens() {
    initAliens();
    alienDirection = 1;
    alienShootTimer = 0;
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    alienMoveInterval = Math.max(150, 600 - (level - 1) * 100);
    alienSpeed = diff.alienSpeed + (level - 1) * 0.3;
    if (level > 1) {
        levelBonus = Math.floor(LEVEL_BASE_SCORE * Math.pow(LEVEL_BONUS_MULTIPLIER, level - 1));
        score += levelBonus;
        updateUI();
    }
}

// ── Alien Shooting ──

function spawnAlienShots(delta) {
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    const aliveAliens = aliens.filter(a => a.alive).length;
    if (aliveAliens === 0) return;

    alienShootTimer += delta;

    // Shorter interval as fewer aliens remain (more aggressive)
    const aliveRatio = aliveAliens / (ALIEN_ROWS * ALIEN_COLS);
    const interval = diff.shootInterval * (0.4 + aliveRatio * 0.6);

    if (alienShootTimer >= interval) {
        alienShootTimer = 0;

        // Number of shots scales with difficulty and remaining aliens
        const aliveList = aliens.filter(a => a.alive);
        if (aliveList.length === 0) return;

        // Easy: 1 shot, Normal: 1-2, Hard: 2-3, Insane: 3-4
        const shotsCount = diff.shootInterval <= 1000
            ? 2 + Math.floor(Math.random() * 3)
            : diff.shootInterval <= 2000
                ? 1 + Math.floor(Math.random() * 2)
                : 1;

        for (let i = 0; i < shotsCount; i++) {
            const shooter = aliveList[Math.floor(Math.random() * aliveList.length)];
            alienBullets.push({
                x: shooter.x + ALIEN_WIDTH / 2,
                y: shooter.y + ALIEN_HEIGHT,
                speed: diff.alienBulletSpeed,
            });
            SoundManager.playAlienShoot();
        }
    }
}

// ── UFO ──

function spawnUFO() {
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    const direction = Math.random() < 0.5 ? 1 : -1;
    ufos.push({
        x: direction === 1 ? -UFO_WIDTH : CANVAS_WIDTH,
        y: UFO_Y,
        direction: direction,
        score: Math.floor(Math.random() * (UFO_SCORE_RANGE[1] - UFO_SCORE_RANGE[0] + 1) + UFO_SCORE_RANGE[0]),
        alive: true,
    });
}


function drawUFO() {
    ufos.forEach(ufo => {
        if (!ufo.alive) return;

        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;

        // Dome
        ctx.beginPath();
        ctx.arc(ufo.x + UFO_WIDTH / 2, ufo.y + UFO_HEIGHT - 2, UFO_WIDTH / 4, Math.PI, 0);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.shadowBlur = 0;

        // Body
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(ufo.x, ufo.y + UFO_HEIGHT / 2 - 2, UFO_WIDTH, UFO_HEIGHT / 2 - 2);

        // Bottom
        ctx.fillStyle = '#ff6b8a';
        ctx.fillRect(ufo.x + 8, ufo.y + UFO_HEIGHT - 2, UFO_WIDTH - 16, 2);
        ctx.shadowBlur = 0;
    });
}

function updateUFOs(delta) {
    // Spawn UFO
    ufoSpawnTimer += delta;
    if (ufoSpawnTimer > UFO_SPAWN_MIN + Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN)) {
        ufoSpawnTimer = 0;
        if (!ufos.find(u => u.alive)) {
            spawnUFO();
        }
    }

    // Move UFOs
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    ufos.forEach(ufo => {
        if (!ufo.alive) return;
        ufo.x += UFO_SPEED * ufo.direction * diff.alienBulletSpeed / 1.5;

        // Remove if off screen
        if ((ufo.direction === 1 && ufo.x > CANVAS_WIDTH + UFO_WIDTH) ||
            (ufo.direction === -1 && ufo.x + UFO_WIDTH < 0)) {
            ufo.alive = false;
        }
    });

    ufos = ufos.filter(u => u.alive);
}

// ── Difficulty Persistence ──

function getSavedDifficulty() {
    return localStorage.getItem('si_difficulty') || 'normal';
}

function saveDifficulty(diff) {
    localStorage.setItem('si_difficulty', diff);
}

function applyDifficulty(diff) {
    selectedDifficulty = diff;
    const d = DIFFICULTY_PRESETS[diff];
    alienSpeed = d.alienSpeed;
    if (level === 1) {
        lives = d.lives;
        updateUI();
    }
}

// ── Main update ──

function update(delta) {
    if (isPaused || gameOver) return;

    // Player movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        playerX -= 2.5;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        playerX += 2.5;
    }
    if (playerX < 0) playerX = 0;
    if (playerX + PLAYER_WIDTH > canvas.width) playerX = canvas.width - PLAYER_WIDTH;

    // Player shooting
    shootCooldown -= delta;
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    if ((keys['Space'] || keys['Enter']) && shootCooldown <= 0) {
        bullets.push({
            x: playerX + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
            y: PLAYER_Y,
        });
        SoundManager.playShoot();
        shootCooldown = 250;
    }

    // Update player bullets
    bullets = bullets.filter(b => b.y > 0);
    bullets.forEach(b => { b.y -= diff.bulletSpeed; });

    // Alien shooting
    spawnAlienShots(delta);

    // Update alien bullets
    alienBullets = alienBullets.filter(b => b.y < CANVAS_HEIGHT);
    alienBullets.forEach(b => { b.y += b.speed; });

    // Alien movement timing
    alienMoveTimer += delta;
    const aliveAliens = aliens.filter(a => a.alive).length;
    const speedMultiplier = Math.max(0.2, aliveAliens / (ALIEN_ROWS * ALIEN_COLS));
    const currentInterval = alienMoveInterval * speedMultiplier;

    if (alienMoveTimer > currentInterval) {
        alienMoveTimer = 0;
        let moveDown = false;
        aliens.forEach(a => {
            if (!a.alive) return;
            a.x += alienSpeed * alienDirection * 8 * (a.baseSpeed / ALIEN_BASE_SPEED);
            if (a.x <= 2 || a.x + ALIEN_WIDTH >= canvas.width - 2) {
                moveDown = true;
            }
        });
        if (moveDown) {
            alienDirection *= -1;
            aliens.forEach(a => {
                if (a.alive) a.y += ALIEN_DROP;
            });
        }
        SoundManager.playAlienMove();
    }

    // Update UFOs
    updateUFOs(delta);

   // Collision: bullets vs aliens
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        for (let ai = 0; ai < aliens.length; ai++) {
            const a = aliens[ai];
            if (!a.alive) continue;
            if (b.x < a.x + ALIEN_WIDTH && b.x + BULLET_WIDTH > a.x &&
                b.y < a.y + ALIEN_HEIGHT && b.y + BULLET_HEIGHT > a.y) {
                a.alive = false;
                bullets.splice(bi, 1);
                const points = Math.max(10, 30 - a.row * 5);
                score += points;
                updateUI();
                SoundManager.playExplosion();
                createExplosion(a.x + ALIEN_WIDTH / 2, a.y + ALIEN_HEIGHT / 2, alienColors[a.row]);
                break;
            }
        }
    }

    // Collision: bullets vs UFOs
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        for (let ui = 0; ui < ufos.length; ui++) {
            const u = ufos[ui];
            if (!u.alive) continue;
            if (b.x < u.x + UFO_WIDTH && b.x + BULLET_WIDTH > u.x &&
                b.y < u.y + UFO_HEIGHT && b.y + BULLET_HEIGHT > u.y) {
                u.alive = false;
                bullets.splice(bi, 1);
                score += u.score;
                updateUI();
                SoundManager.playExplosion();
                createExplosion(u.x + UFO_WIDTH / 2, u.y + UFO_HEIGHT / 2, '#fbbf24');
                showUfoScore(u.score);
                break;
            }
        }
    }

    // Collision: alienBullets vs player
    for (let bi = alienBullets.length - 1; bi >= 0; bi--) {
        const b = alienBullets[bi];
        if (b.x < playerX + PLAYER_WIDTH && b.x + 2 > playerX &&
            b.y < PLAYER_Y + PLAYER_HEIGHT && b.y + b.speed > PLAYER_Y) {
            alienBullets.splice(bi, 1);
            createExplosion(playerX + PLAYER_WIDTH / 2, PLAYER_Y + PLAYER_HEIGHT / 2, '#4ade80');
            lives--;
            updateUI();

            if (lives <= 0) {
                handleGameOver();
                return;
            }
            bullets = [];
        }
    }

    // Check if aliens reach bottom
    const reachedBottom = aliens.some(a => a.alive && a.y + ALIEN_HEIGHT >= PLAYER_Y);
    if (reachedBottom) {
        lives--;
        updateUI();
        if (lives <= 0) {
            handleGameOver();
            return;
        }
        bullets = [];
        alienBullets = [];
        resetAliens();
    }

    // Check level complete
    if (aliens.every(a => !a.alive)) {
        level++;
        if (level > 1) {
            levelBonus = Math.floor(LEVEL_BASE_SCORE * Math.pow(LEVEL_BONUS_MULTIPLIER, level - 1));
            score += levelBonus;
            updateUI();
        }
        resetAliens();
        bullets = [];
        alienBullets = [];
    }
}

// ── Show UFO score popup ──

function showUfoScore(score) {
    const existing = document.getElementById('ufo-score-popup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'ufo-score-popup';
    popup.style.cssText = `
        position: absolute; left: 50%; top: 30%;
        transform: translateX(-50%);
        color: #fbbf24;
        font-family: 'Press Start 2P', monospace;
        font-size: 12px;
        pointer-events: none;
        z-index: 30;
        animation: popupFloat 1.5s ease-out forwards;
        text-shadow: 0 0 10px #fbbf24;
    `;
    popup.textContent = `+${score}`;
    canvas.parentElement.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);

    // Add keyframe if not exists
    let style = document.getElementById('ufo-popup-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'ufo-popup-style';
        style.textContent = `
            @keyframes popupFloat {
                0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-40px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// ── Draw ──

function draw() {
    ctx.fillStyle = '#0d0714';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Star field background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    const starSeed = 42;
    for (let i = 0; i < 30; i++) {
        const sx = ((i * 73 + starSeed) % canvas.width);
        const sy = ((i * 97 + starSeed) % canvas.height);
        ctx.fillRect(sx, sy, 1, 1);
    }

    // Draw player
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(playerX + PLAYER_WIDTH / 2, PLAYER_Y);
    ctx.lineTo(playerX + PLAYER_WIDTH, PLAYER_Y + PLAYER_HEIGHT);
    ctx.lineTo(playerX, PLAYER_Y + PLAYER_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw UFOs
    drawUFO();

    // Draw aliens
    aliens.forEach(a => {
        if (!a.alive) return;
        ctx.fillStyle = alienColors[a.row] || '#ff6b8a';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 4;

        if (a.type === 'TYPE_3') {
            ctx.fillRect(a.x, a.y + 4, ALIEN_WIDTH, ALIEN_HEIGHT - 8);
            ctx.fillStyle = '#0d0714';
            ctx.fillRect(a.x + 5, a.y + 6, 8, 8);
            ctx.fillRect(a.x + ALIEN_WIDTH - 13, a.y + 6, 8, 8);
        } else if (a.type === 'TYPE_2') {
            ctx.fillRect(a.x, a.y + 3, ALIEN_WIDTH, ALIEN_HEIGHT - 6);
            ctx.fillStyle = '#0d0714';
            ctx.fillRect(a.x + 6, a.y + 4, 6, 6);
            ctx.fillRect(a.x + ALIEN_WIDTH - 12, a.y + 4, 6, 6);
        } else {
            ctx.fillRect(a.x, a.y + 5, ALIEN_WIDTH, ALIEN_HEIGHT - 10);
            ctx.fillStyle = '#0d0714';
            ctx.fillRect(a.x + 7, a.y + 6, 4, 4);
            ctx.fillRect(a.x + ALIEN_WIDTH - 11, a.y + 6, 4, 4);
        }
        ctx.shadowBlur = 0;
    });

    // Draw player bullets
    bullets.forEach(b => {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT);
        ctx.shadowBlur = 0;
    });

    // Draw alien bullets
    alienBullets.forEach(b => {
        ctx.fillStyle = '#ff2060';
        ctx.shadowColor = '#ff2060';
        ctx.shadowBlur = 4;
        ctx.fillRect(b.x, b.y, 2, b.speed);
        ctx.shadowBlur = 0;
    });
}

// ── Loop ──

function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (delta < 100) {
        update(delta);
        updateParticles(delta);
    }
    draw();
    drawParticles();
    requestAnimationFrame(loop);
}

// ── Game Over ──

function handleGameOver() {
    gameOver = true;
    isPaused = true;
    particles = [];

    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const startBtn = document.getElementById('start-btn');
    if (overlay) overlay.style.display = 'flex';
    if (startBtn) startBtn.style.display = 'none';
    if (overlayTitle) overlayTitle.textContent = 'GAME OVER';

    updateBestScoreDisplay();

    const highScores = getHighScores();
    const isNewBest = highScores.length === 0 || score > highScores[0].score;
    saveHighScore(score);
    renderHighScoresTable();

    if (isNewBest && score > 0) {
        showNewHighScoreNotice();
        SoundManager.playNewHighScore();
    }

    SoundManager.playGameOver();
    MusicPlayer.fadeOut(0.8);
}

// ── Pause ──

function togglePause() {
    if (!gameStarted) return;
    isPaused = !isPaused;
    particles = [];
    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    if (overlay) {
        overlay.style.display = isPaused ? 'flex' : 'none';
    }
    if (!isPaused && overlayTitle) {
        overlayTitle.textContent = 'SPACE INVADERS';
    }
    if (isPaused) {
        MusicPlayer.pause();
    } else {
        MusicPlayer.resume();
    }
}

// ── Reset ──

function resetGame() {
    if (!gameStarted) return;
    initGame();
    isPaused = false;
    gameStarted = true;

    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'none';

    const overlayTitle = document.getElementById('overlay-title');
    if (overlayTitle) overlayTitle.textContent = 'SPACE INVADERS';

    const highScoresTable = document.getElementById('high-scores-table');
    if (highScoresTable) highScoresTable.style.display = 'none';

    previousBestScore = getBestScore();
    updateBestScoreDisplay();

    SoundManager.startBgm();
}

// ── Player Name ──

const playerNameInput = document.getElementById('player-name');
if (playerNameInput) {
    const savedName = getSavedName();
    playerNameInput.value = savedName;

    playerNameInput.addEventListener('input', () => {
        localStorage.setItem(PLAYER_NAME_STORAGE, playerNameInput.value);
    });
}

// ── Sound Controls ──

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

// ── Difficulty Buttons ──

function setupDifficultyButtons() {
    const container = document.getElementById('difficulty-buttons');
    if (!container) return;

    const savedDiff = getSavedDifficulty();

    Object.keys(DIFFICULTY_PRESETS).forEach(diff => {
        const btn = container.querySelector(`[data-diff="${diff}"]`);
        if (!btn) return;

        if (diff === savedDiff) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', () => {
            Object.keys(DIFFICULTY_PRESETS).forEach(d => {
                const b = container.querySelector(`[data-diff="${d}"]`);
                if (b) b.classList.remove('active');
            });
            btn.classList.add('active');
            saveDifficulty(diff);
            applyDifficulty(diff);
            // If game not started, apply immediately
            if (!gameStarted || gameOver) {
                initGame();
                updateUI();
            } else {
                lives = DIFFICULTY_PRESETS[diff].lives;
                updateUI();
            }
        });
    });
}

// ── Keyboard Controls ──

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
        if (overlayTitle) overlayTitle.textContent = 'SPACE INVADERS';
        return;
    }
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        togglePause();
        return;
    }
});

canvas.addEventListener('click', () => {
    if (!gameStarted) {
        startGame();
    } else if (isPaused && !gameOver) {
        togglePause();
        const overlayTitle = document.getElementById('overlay-title');
        if (overlayTitle) overlayTitle.textContent = 'SPACE INVADERS';
    }
});

function startGame() {
    gameStarted = true;
    isPaused = false;
    particles = [];
    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const startBtn = document.getElementById('start-btn');
    if (overlay) overlay.style.display = 'none';
    if (overlayTitle) overlayTitle.textContent = 'SPACE INVADERS';
    if (startBtn) startBtn.style.display = 'none';
    SoundManager.startBgm();
}

const startBtn = document.getElementById('start-btn');
if (startBtn) {
    startBtn.addEventListener('click', startGame);
}

// Restart touch button
setupTouchButton('[data-action="restart"]',
    () => { resetGame(); },
    () => {}
);

// ── Initialize ──

initGame();

// Apply saved difficulty
applyDifficulty(getSavedDifficulty());

// Setup difficulty buttons
setupDifficultyButtons();

// Show start screen
const overlay = document.getElementById('pause-overlay');
const overlayTitle = document.getElementById('overlay-title');
const startBtnEl = document.getElementById('start-btn');
if (overlay) overlay.style.display = 'flex';
if (overlayTitle) overlayTitle.textContent = 'SPACE INVADERS';
if (startBtnEl) startBtnEl.style.display = 'block';

previousBestScore = getBestScore();
updateBestScoreDisplay();

lastTime = performance.now();
requestAnimationFrame(loop);
