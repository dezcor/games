const canvas = document.getElementById('invaders');
const ctx = canvas.getContext('2d');

// Global variables
let score, lives, gameOver, isPaused, gameStarted;
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
let ufoSpawnDelay = 0;
let alienShootTimer = 0;
let level = 1;
let selectedDifficulty = 'normal';
let gameTime = 0;
let comboCount = 0;
let comboExpiresAt = 0;
let playerInvulnerabilityUntil = 0;

function readStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        // Storage can be unavailable in private browsing contexts.
    }
}

function sanitizePlayerName(value) {
    if (typeof value !== 'string') return 'Anonymous';
    const name = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
    return name || 'Anonymous';
}

function normalizeHighScores(value) {
    if (!Array.isArray(value)) return [];

    return value
        .filter((entry) => entry && Number.isFinite(Number(entry.score)))
        .map((entry) => ({
            score: Math.max(0, Math.floor(Number(entry.score))),
            name: sanitizePlayerName(entry.name),
            date: typeof entry.date === 'string' ? entry.date.slice(0, 40) : '',
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

function getHighScores() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return normalizeHighScores(data ? JSON.parse(data) : []);
    } catch (e) {
        return [];
    }
}

function getSavedName() {
    return sanitizePlayerName(readStorage(PLAYER_NAME_STORAGE, ''));
}

function getSavedAudioVolume() {
    const saved = Number.parseFloat(readStorage(AUDIO_VOLUME_STORAGE, '0.7'));
    return Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 0.7;
}

function getSavedBgmVolume() {
    const saved = Number.parseFloat(readStorage(BGM_VOLUME_STORAGE, '0.1'));
    return Number.isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 0.1;
}

function saveAudioVolume(vol) {
    writeStorage(AUDIO_VOLUME_STORAGE, String(Math.max(0, Math.min(1, vol))));
}

function saveBgmVolume(vol) {
    writeStorage(BGM_VOLUME_STORAGE, String(Math.max(0, Math.min(1, vol))));
}

function saveHighScore(sc) {
    const highScores = getHighScores();
    const now = new Date();
    const nameInput = document.getElementById('player-name');
    const playerName = sanitizePlayerName(nameInput ? nameInput.value : getSavedName());
    const entry = {
        score: sc,
        name: playerName,
        date: now.toLocaleDateString('es-ES'),
    };
    highScores.push(entry);
    highScores.sort((a, b) => b.score - a.score);
    const top5 = highScores.slice(0, 5);
    writeStorage(STORAGE_KEY, JSON.stringify(top5));
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

    if (!tableContainer || !table) {
        return;
    }

    table.replaceChildren();
    const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}', '4.', '5.'];

    highScores.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.className = `hs-row hs-row-${index + 1}`;

        const rank = document.createElement('td');
        rank.className = 'hs-rank';
        rank.textContent = medals[index];

        const name = document.createElement('td');
        name.className = 'hs-name';
        name.textContent = entry.name;

        const score = document.createElement('td');
        score.className = 'hs-score';
        score.textContent = String(entry.score);

        const date = document.createElement('td');
        date.className = 'hs-date';
        date.textContent = entry.date;

        row.append(rank, name, score, date);
        table.appendChild(row);
    });

    tableContainer.style.display = highScores.length > 0 ? 'block' : 'none';
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
            const type = ALIEN_ROW_TYPES[r] || 'TYPE_1';
            const metadata = ALIEN_TYPES[type];
            aliens.push({
                x: ALIEN_START_X + c * (metadata.width + ALIEN_X_GAP),
                y: ALIEN_START_Y + r * (metadata.height + ALIEN_Y_GAP),
                alive: true,
                row: r,
                column: c,
                type,
                width: metadata.width,
                height: metadata.height,
                shape: metadata.shape,
                color: metadata.color,
            });
        }
    }
}

function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function createExplosion(x, y, color, requestedCount = PARTICLE_COUNT) {
    const remainingSlots = Math.max(0, MAX_PARTICLES - particles.length);
    const motionScale = prefersReducedMotion() ? 0.5 : 1;
    const count = Math.min(requestedCount, remainingSlots);

    for (let i = 0; i < count; i++) {
        const lifetime = Math.min(PARTICLE_LIFETIME, PARTICLE_LIFETIME * motionScale);
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * PARTICLE_SPEED * 4 * motionScale,
            vy: (Math.random() - 0.5) * PARTICLE_SPEED * 4 * motionScale,
            life: lifetime,
            maxLife: lifetime,
            color: color,
            size: Math.random() * 4 + 2,
        });
    }
}

function updateParticles(delta) {
    const frameScale = delta / (1000 / 60);
    particles = particles.filter(p => {
        p.x += p.vx * frameScale;
        p.y += p.vy * frameScale;
        p.life -= delta;
        return p.life > 0;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
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
    ufoSpawnDelay = getUfoSpawnDelay();
    alienShootTimer = 0;
    alienDirection = 1;
    alienMoveTimer = 0;
    alienMoveInterval = 600;
    alienSpeed = diff.alienSpeed;
    shootCooldown = 0;
    gameTime = 0;
    comboCount = 0;
    comboExpiresAt = 0;
    playerInvulnerabilityUntil = 0;
    playerX = canvas.width / 2 - PLAYER_WIDTH / 2;

    initAliens();
    updateUI();
}

function updateUI() {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    const comboEl = document.getElementById('combo-display');
    if (scoreEl) scoreEl.textContent = `Score: ${score}`;
    if (livesEl) livesEl.textContent = `Lives: ${lives}`;
    if (comboEl) {
        comboEl.textContent = comboCount > 1 ? `Combo x${comboCount}` : '';
        comboEl.classList.toggle('active', comboCount > 1);
    }
    updateBestScoreDisplay();
}

function resetCombo() {
    comboCount = 0;
    comboExpiresAt = 0;
    updateUI();
}

function awardScore(points, { countsForCombo = false, feedbackColor = '#fbbf24' } = {}) {
    let awardedPoints = Math.max(0, Math.floor(points));

    if (countsForCombo) {
        comboCount = gameTime <= comboExpiresAt ? comboCount + 1 : 1;
        comboExpiresAt = gameTime + COMBO_WINDOW;
        const comboBonus = Math.min(
            Math.max(0, comboCount - 1) * COMBO_BONUS_STEP,
            MAX_COMBO_BONUS
        );
        awardedPoints += comboBonus;

        if (comboCount > 1) {
            showScoreFeedback(`COMBO x${comboCount} +${awardedPoints}`, feedbackColor);
        }
    }

    score += awardedPoints;
    updateUI();
    return awardedPoints;
}

function showLevelBanner(text, color) {
    const banner = document.getElementById('level-banner');
    if (!banner) return;
    banner.textContent = text;
    banner.style.color = color || '#4ade80';
    banner.style.textShadow = `0 0 16px ${color || '#4ade80'}80, 0 0 32px ${color || '#4ade80'}40`;
    banner.style.display = 'block';
    banner.style.animation = 'none';
    banner.offsetHeight;
    banner.style.animation = 'bannerPop 1.8s ease-out forwards';
    setTimeout(() => { banner.style.display = 'none'; }, 1800);
}

function flashScore() {
    const scoreEl = document.getElementById('score');
    if (!scoreEl) return;
    scoreEl.classList.remove('score-flash');
    scoreEl.offsetHeight;
    scoreEl.classList.add('score-flash');
    setTimeout(() => scoreEl.classList.remove('score-flash'), 400);
}

function resetAliens() {
    initAliens();
    alienDirection = 1;
    alienShootTimer = 0;
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    alienMoveInterval = Math.max(150, 600 - (level - 1) * 100);
    alienSpeed = diff.alienSpeed + (level - 1) * 0.3;
}

function completeLevel() {
    const clearedLevel = level;
    const levelBonus = Math.floor(
        LEVEL_BASE_SCORE * Math.pow(LEVEL_BONUS_MULTIPLIER, clearedLevel - 1)
    );
    const survivalBonus = lives * SURVIVAL_BONUS;

    score += levelBonus + survivalBonus;
    level += 1;
    resetCombo();
    showLevelBanner(`LEVEL ${level}  +${levelBonus + survivalBonus}`, '#4ade80');
    const boardWrapper = document.getElementById('board-wrapper');
    if (boardWrapper) {
        boardWrapper.classList.remove('level-complete');
        boardWrapper.offsetHeight;
        boardWrapper.classList.add('level-complete');
    }
    updateUI();
    flashScore();
    resetAliens();
    bullets = [];
    alienBullets = [];
    ufos = [];
    scheduleNextUFO();
}

// ── Alien Shooting ──

function getColumnShooters() {
    const shooters = new Map();

    aliens.forEach((alien) => {
        if (!alien.alive) return;
        const current = shooters.get(alien.column);
        if (!current || alien.y > current.y) {
            shooters.set(alien.column, alien);
        }
    });

    return Array.from(shooters.values());
}

function chooseWeightedAlien(availableAliens) {
    const totalWeight = availableAliens.reduce((total, alien) => {
        return total + (ALIEN_TYPES[alien.type]?.shootWeight || 1);
    }, 0);

    if (totalWeight <= 0) return null;

    let target = Math.random() * totalWeight;
    for (const alien of availableAliens) {
        target -= ALIEN_TYPES[alien.type]?.shootWeight || 1;
        if (target <= 0) return alien;
    }

    return availableAliens[availableAliens.length - 1] || null;
}

function spawnAlienShots(delta) {
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    const aliveAliens = aliens.filter(a => a.alive).length;
    if (aliveAliens === 0) return;

    alienShootTimer += delta;

    // Shorter interval as fewer aliens remain (more aggressive)
    const aliveRatio = aliveAliens / (ALIEN_ROWS * ALIEN_COLS);
    const interval = diff.shootInterval * (0.45 + aliveRatio * 0.55);

    if (alienShootTimer < interval) return;
    alienShootTimer = 0;

    if (alienBullets.length >= diff.maxAlienBullets) return;

    const shooter = chooseWeightedAlien(getColumnShooters());
    if (!shooter) return;

    alienBullets.push({
        x: shooter.x + shooter.width / 2 - ALIEN_BULLET_WIDTH / 2,
        y: shooter.y + shooter.height,
        width: ALIEN_BULLET_WIDTH,
        height: ALIEN_BULLET_HEIGHT,
        speed: diff.alienBulletSpeed,
        type: shooter.type,
    });
    SoundManager.playAlienShoot(shooter.type);
}

// ── UFO ──

function getUfoSpawnDelay() {
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    const levelFactor = Math.pow(UFO_LEVEL_INTERVAL_FACTOR, Math.max(0, level - 1));
    const minDelay = Math.max(
        UFO_MIN_INTERVAL,
        UFO_SPAWN_MIN * levelFactor * diff.ufoIntervalFactor
    );
    const maxDelay = Math.max(
        minDelay + 1000,
        UFO_SPAWN_MAX * levelFactor * diff.ufoIntervalFactor
    );
    return minDelay + Math.random() * (maxDelay - minDelay);
}

function scheduleNextUFO() {
    ufoSpawnTimer = 0;
    ufoSpawnDelay = getUfoSpawnDelay();
}

function spawnUFO() {
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    const direction = Math.random() < 0.5 ? 1 : -1;
    ufos.push({
        x: direction === 1 ? -UFO_WIDTH : CANVAS_WIDTH,
        y: UFO_Y,
        direction: direction,
        score: Math.floor(Math.random() * (UFO_SCORE_RANGE[1] - UFO_SCORE_RANGE[0] + 1) + UFO_SCORE_RANGE[0]),
        width: UFO_WIDTH,
        height: UFO_HEIGHT,
        speed: UFO_SPEED * diff.ufoSpeedFactor * (1 + (level - 1) * UFO_LEVEL_SPEED_FACTOR),
        alive: true,
    });
    SoundManager.playUFO();
}


function drawUFO() {
    ufos.forEach(ufo => {
        if (!ufo.alive) return;

        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;

        // Dome
        ctx.beginPath();
        ctx.arc(ufo.x + ufo.width / 2, ufo.y + ufo.height - 2, ufo.width / 4, Math.PI, 0);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.shadowBlur = 0;

        // Body
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(ufo.x, ufo.y + ufo.height / 2 - 2, ufo.width, ufo.height / 2 - 2);

        // Bottom
        ctx.fillStyle = '#ff6b8a';
        ctx.fillRect(ufo.x + 8, ufo.y + ufo.height - 2, ufo.width - 16, 2);
        ctx.shadowBlur = 0;
    });
}

function updateUFOs(delta) {
    // Spawn UFO
    if (!ufos.some(ufo => ufo.alive)) {
        ufoSpawnTimer += delta;
        if (ufoSpawnTimer >= ufoSpawnDelay) {
            spawnUFO();
            ufoSpawnTimer = 0;
        }
    }

    // Move UFOs
    const frameScale = delta / (1000 / 60);
    ufos.forEach(ufo => {
        if (!ufo.alive) return;
        ufo.x += ufo.speed * ufo.direction * frameScale;

        // Remove if off screen
        if ((ufo.direction === 1 && ufo.x > CANVAS_WIDTH + ufo.width) ||
            (ufo.direction === -1 && ufo.x + ufo.width < 0)) {
            ufo.alive = false;
        }
    });

    ufos = ufos.filter(u => u.alive);
    if (ufos.length === 0 && ufoSpawnTimer === 0) {
        scheduleNextUFO();
    }
}

// ── Difficulty Persistence ──

function getSavedDifficulty() {
    const saved = readStorage(DIFFICULTY_STORAGE, 'normal');
    return DIFFICULTY_PRESETS[saved] ? saved : 'normal';
}

function saveDifficulty(diff) {
    if (DIFFICULTY_PRESETS[diff]) writeStorage(DIFFICULTY_STORAGE, diff);
}

function applyDifficulty(diff) {
    if (!DIFFICULTY_PRESETS[diff] || (gameStarted && !gameOver)) return false;
    selectedDifficulty = diff;
    const d = DIFFICULTY_PRESETS[diff];
    alienSpeed = d.alienSpeed;
    updateUI();
    return true;
}

// ── Main update ──

function update(delta) {
    if (isPaused || gameOver) return;

    const frameScale = delta / (1000 / 60);
    const diff = DIFFICULTY_PRESETS[selectedDifficulty];
    gameTime += delta;

    if (comboCount > 0 && gameTime >= comboExpiresAt) {
        resetCombo();
    }

    // Player movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        playerX -= 2.5 * frameScale;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        playerX += 2.5 * frameScale;
    }
    if (playerX < 0) playerX = 0;
    if (playerX + PLAYER_WIDTH > canvas.width) playerX = canvas.width - PLAYER_WIDTH;

    // Player shooting
    shootCooldown -= delta;
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
    bullets.forEach(b => { b.y -= diff.bulletSpeed * frameScale; });

    // Alien shooting
    spawnAlienShots(delta);

    // Update alien bullets
    alienBullets = alienBullets.filter(b => b.y < CANVAS_HEIGHT + b.height);
    alienBullets.forEach(b => { b.y += b.speed * frameScale; });

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
            const metadata = ALIEN_TYPES[a.type];
            a.x += alienSpeed * alienDirection * 8 * (metadata.speed / ALIEN_BASE_SPEED);
            if (a.x <= 2 || a.x + a.width >= canvas.width - 2) {
                moveDown = true;
            }
        });
        if (moveDown) {
            alienDirection *= -1;
            aliens.forEach(a => {
                if (a.alive) a.y += diff.alienDrop;
            });
        }
        SoundManager.playAlienMove();
    }

    // Update UFOs
    updateUFOs(delta);

    // Collision: player bullets vs alien bullets
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const playerBullet = bullets[bi];
        for (let abi = alienBullets.length - 1; abi >= 0; abi--) {
            const alienBullet = alienBullets[abi];
            if (playerBullet.x < alienBullet.x + alienBullet.width &&
                playerBullet.x + BULLET_WIDTH > alienBullet.x &&
                playerBullet.y < alienBullet.y + alienBullet.height &&
                playerBullet.y + BULLET_HEIGHT > alienBullet.y) {
                bullets.splice(bi, 1);
                alienBullets.splice(abi, 1);
                createExplosion(
                    alienBullet.x + alienBullet.width / 2,
                    alienBullet.y + alienBullet.height / 2,
                    '#fbbf24',
                    4
                );
                SoundManager.playBulletClash();
                break;
            }
        }
    }

    // Collision: bullets vs aliens
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi];
        for (let ai = 0; ai < aliens.length; ai++) {
            const a = aliens[ai];
            if (!a.alive) continue;
            if (b.x < a.x + a.width && b.x + BULLET_WIDTH > a.x &&
                b.y < a.y + a.height && b.y + BULLET_HEIGHT > a.y) {
                a.alive = false;
                bullets.splice(bi, 1);
                awardScore(ALIEN_TYPES[a.type].points, { countsForCombo: true });
                SoundManager.playExplosion();
                createExplosion(a.x + a.width / 2, a.y + a.height / 2, a.color);
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
            if (b.x < u.x + u.width && b.x + BULLET_WIDTH > u.x &&
                b.y < u.y + u.height && b.y + BULLET_HEIGHT > u.y) {
                u.alive = false;
                bullets.splice(bi, 1);
                awardScore(u.score);
                SoundManager.playExplosion();
                createExplosion(u.x + u.width / 2, u.y + u.height / 2, '#fbbf24', 12);
                showUfoScore(u.score);
                break;
            }
        }
    }

    // Collision: alienBullets vs player
    for (let bi = alienBullets.length - 1; bi >= 0; bi--) {
        const b = alienBullets[bi];
        if (b.x < playerX + PLAYER_WIDTH && b.x + b.width > playerX &&
            b.y < PLAYER_Y + PLAYER_HEIGHT && b.y + b.height > PLAYER_Y) {
            alienBullets.splice(bi, 1);
            if (gameTime < playerInvulnerabilityUntil) continue;

            playerInvulnerabilityUntil = gameTime + 700;
            resetCombo();
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
    const reachedBottom = aliens.some(a => a.alive && a.y + a.height >= PLAYER_Y);
    if (reachedBottom) {
        resetCombo();
        lives--;
        updateUI();
        if (lives <= 0) {
            handleGameOver();
            return;
        }
        bullets = [];
        alienBullets = [];
        playerInvulnerabilityUntil = gameTime + 700;
        resetAliens();
    }

    // Check level complete
    if (aliens.every(a => !a.alive)) {
        completeLevel();
    }
}

// ── Score feedback ──

function showScoreFeedback(text, color = '#fbbf24') {
    const feedback = document.createElement('div');
    feedback.className = 'score-feedback';
    feedback.style.setProperty('--feedback-color', color);
    feedback.textContent = text;
    canvas.parentElement.appendChild(feedback);
    setTimeout(() => feedback.remove(), 1500);
}

function showUfoScore(ufoScore) {
    showScoreFeedback(`+${ufoScore}`, '#fbbf24');
}

function drawAlien(alien) {
    const { x, y, width, height, shape, color } = alien;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;

    if (shape === 'large') {
        ctx.fillRect(x, y + 2, width, height - 4);
        ctx.fillRect(x + 3, y, 4, 3);
        ctx.fillRect(x + width - 7, y, 4, 3);
        ctx.fillStyle = '#0d0714';
        ctx.fillRect(x + 4, y + 4, 4, 3);
        ctx.fillRect(x + width - 8, y + 4, 4, 3);
    } else if (shape === 'medium') {
        ctx.fillRect(x + 1, y + 2, width - 2, height - 4);
        ctx.fillRect(x + 4, y, 3, 3);
        ctx.fillRect(x + width - 7, y, 3, 3);
        ctx.fillStyle = '#0d0714';
        ctx.fillRect(x + 5, y + 4, 3, 3);
        ctx.fillRect(x + width - 8, y + 4, 3, 3);
    } else {
        ctx.fillRect(x + 2, y + 3, width - 4, height - 5);
        ctx.fillStyle = '#0d0714';
        ctx.fillRect(x + 6, y + 4, 3, 2);
        ctx.fillRect(x + width - 9, y + 4, 3, 2);
    }

    ctx.shadowBlur = 0;
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
    if (gameTime < playerInvulnerabilityUntil && Math.floor(gameTime / 80) % 2 === 0) {
        ctx.globalAlpha = 0.35;
    }
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(playerX + PLAYER_WIDTH / 2, PLAYER_Y);
    ctx.lineTo(playerX + PLAYER_WIDTH, PLAYER_Y + PLAYER_HEIGHT);
    ctx.lineTo(playerX, PLAYER_Y + PLAYER_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Draw UFOs
    drawUFO();

    // Draw aliens
    aliens.forEach(a => {
        if (!a.alive) return;
        drawAlien(a);
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
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.shadowBlur = 0;
    });
}

// ── Loop ──

function loop(timestamp) {
    const delta = Math.min(100, Math.max(0, timestamp - lastTime));
    lastTime = timestamp;
    update(delta);
    updateParticles(delta);
    draw();
    drawParticles();
    requestAnimationFrame(loop);
}

// ── Game Over ──

function handleGameOver() {
    if (gameOver) return;
    gameOver = true;
    isPaused = true;
    resetCombo();
    updatePauseControl();

    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const startBtn = document.getElementById('start-btn');
    const gameOverStats = document.getElementById('game-over-stats');
    const finalScore = document.getElementById('final-score');
    const finalLevel = document.getElementById('final-level');
    const quickRestartBtn = document.getElementById('quick-restart-btn');

    if (overlay) overlay.style.display = 'flex';
    if (startBtn) startBtn.style.display = 'none';
    if (overlayTitle) overlayTitle.textContent = 'GAME OVER';

    if (finalScore) finalScore.textContent = `Score: ${score}`;
    if (finalLevel) finalLevel.textContent = `Level: ${level}`;
    if (gameOverStats) gameOverStats.style.display = 'flex';
    if (quickRestartBtn) quickRestartBtn.style.display = 'block';

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

function updatePauseControl() {
    const pauseButton = document.getElementById('pause-btn');
    const touchPauseButton = document.querySelector('[data-action="pause"]');
    const label = gameStarted && isPaused && !gameOver ? 'Resume' : 'Pause';

    if (pauseButton) {
        pauseButton.textContent = label;
        pauseButton.setAttribute('aria-label', label);
        pauseButton.setAttribute('aria-pressed', String(isPaused));
    }
    if (touchPauseButton) {
        touchPauseButton.textContent = label === 'Resume' ? '>' : '||';
        touchPauseButton.setAttribute('aria-label', label);
        touchPauseButton.setAttribute('title', label);
        touchPauseButton.setAttribute('aria-pressed', String(isPaused));
    }
}

function togglePause() {
    if (!gameStarted || gameOver) return;
    isPaused = !isPaused;
    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    if (overlay) {
        overlay.style.display = isPaused ? 'flex' : 'none';
    }
    if (overlayTitle) overlayTitle.textContent = isPaused ? 'PAUSED' : 'SPACE INVADERS';
    updatePauseControl();
    if (isPaused) {
        MusicPlayer.pause();
    } else {
        lastTime = performance.now();
        MusicPlayer.resume();
    }
}

// ── Reset ──

function resetGame() {
    if (!gameStarted) return;
    initGame();
    isPaused = false;
    gameStarted = true;
    updatePauseControl();

    const overlay = document.getElementById('pause-overlay');
    if (overlay) overlay.style.display = 'none';

    const overlayTitle = document.getElementById('overlay-title');
    if (overlayTitle) overlayTitle.textContent = 'SPACE INVADERS';

    const highScoresTable = document.getElementById('high-scores-table');
    if (highScoresTable) highScoresTable.style.display = 'none';

    const gameOverStats = document.getElementById('game-over-stats');
    if (gameOverStats) gameOverStats.style.display = 'none';

    const quickRestartBtn = document.getElementById('quick-restart-btn');
    if (quickRestartBtn) quickRestartBtn.style.display = 'none';

    updateBestScoreDisplay();

    SoundManager.startBgm();
}

// ── Player Name ──

const playerNameInput = document.getElementById('player-name');
if (playerNameInput) {
    const savedName = getSavedName();
    playerNameInput.value = savedName;

    playerNameInput.addEventListener('input', () => {
        const sanitized = sanitizePlayerName(playerNameInput.value);
        if (playerNameInput.value !== sanitized) playerNameInput.value = sanitized;
        writeStorage(PLAYER_NAME_STORAGE, sanitized);
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

function updateBgmIcon() {
    if (bgmMuteBtn) {
        bgmMuteBtn.textContent = MusicPlayer.getMuteState() ? '\u{1F507}' : '\u{1F3B5}';
    }
}

if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        SoundManager.toggleMute();
        updateMuteIcon();
    });
}

if (volumeSlider) {
    const savedVol = getSavedAudioVolume();
    volumeSlider.value = savedVol;
    volumeSlider.addEventListener('input', (e) => {
        const vol = parseFloat(e.target.value);
        SoundManager.setVolume(vol);
        saveAudioVolume(vol);
        updateMuteIcon();
    });
}

SoundManager.setVolume(getSavedAudioVolume());
updateMuteIcon();

const bgmMuteBtn = document.getElementById('bgm-mute-btn');
if (bgmMuteBtn) {
    const savedBgmMute = readStorage(BGM_MUTED_STORAGE, 'false') === 'true';
    MusicPlayer.setVolume(getSavedBgmVolume());
    MusicPlayer.setMute(savedBgmMute);
    bgmMuteBtn.addEventListener('click', () => {
        MusicPlayer.toggleMute();
        updateBgmIcon();
    });
    updateBgmIcon();
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
            if (gameStarted && !gameOver) return;
            if (!applyDifficulty(diff)) return;

            Object.keys(DIFFICULTY_PRESETS).forEach(d => {
                const b = container.querySelector(`[data-diff="${d}"]`);
                if (b) b.classList.remove('active');
            });
            btn.classList.add('active');
            saveDifficulty(diff);

            if (!gameStarted || gameOver) {
                initGame();
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
    }
});

function startGame() {
    gameStarted = true;
    isPaused = false;
    particles = [];
    updatePauseControl();
    const overlay = document.getElementById('pause-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const startBtn = document.getElementById('start-btn');
    const gameOverStats = document.getElementById('game-over-stats');
    const quickRestartBtn = document.getElementById('quick-restart-btn');
    const highScoresTable = document.getElementById('high-scores-table');
    if (overlay) overlay.style.display = 'none';
    if (overlayTitle) overlayTitle.textContent = 'SPACE INVADERS';
    if (startBtn) startBtn.style.display = 'none';
    if (gameOverStats) gameOverStats.style.display = 'none';
    if (quickRestartBtn) quickRestartBtn.style.display = 'none';
    if (highScoresTable) highScoresTable.style.display = 'none';
    const boardWrapper = document.getElementById('board-wrapper');
    if (boardWrapper) {
        boardWrapper.classList.remove('level-enter');
        boardWrapper.offsetHeight;
        boardWrapper.classList.add('level-enter');
    }
    SoundManager.startBgm();
}

const startBtn = document.getElementById('start-btn');
if (startBtn) {
    startBtn.addEventListener('click', startGame);
}

const quickRestartBtn = document.getElementById('quick-restart-btn');
if (quickRestartBtn) {
    quickRestartBtn.addEventListener('click', () => {
        if (gameOver) {
            resetGame();
        }
    });
}

// ── Initialize ──

selectedDifficulty = getSavedDifficulty();
initGame();

// Setup difficulty buttons
setupDifficultyButtons();

// Show start screen
const overlay = document.getElementById('pause-overlay');
const overlayTitle = document.getElementById('overlay-title');
const startBtnEl = document.getElementById('start-btn');
if (overlay) overlay.style.display = 'flex';
if (overlayTitle) overlayTitle.textContent = 'SPACE INVADERS';
if (startBtnEl) startBtnEl.style.display = 'block';

updatePauseControl();
updateBestScoreDisplay();

lastTime = performance.now();
requestAnimationFrame(loop);
