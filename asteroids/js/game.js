/**
 * Asteroids Game Engine
 */

// --- State Management ---
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
    if (typeof value !== 'string') return 'Player';
    const name = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
    return name || 'Player';
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

function loadHighScores() {
    try {
        return normalizeHighScores(JSON.parse(readStorage(STORAGE_KEY, '[]')));
    } catch (error) {
        return [];
    }
}

function loadShipSkin() {
    const saved = readStorage(SHIP_SKIN_STORAGE, DEFAULT_SHIP_SKIN);
    return SHIP_SKINS.some((s) => s.id === saved) ? saved : DEFAULT_SHIP_SKIN;
}

function getShipColor(skinId) {
    const skin = SHIP_SKINS.find((s) => s.id === skinId);
    return (skin && skin.color) || GAME_CONFIG.shipColor;
}

function loadAchievements() {
    try {
        const raw = JSON.parse(readStorage(ACHIEVEMENTS_STORAGE, '{}'));
        if (!raw || typeof raw !== 'object') return {};
        const out = {};
        for (const def of ACHIEVEMENTS) {
            const entry = raw[def.id];
            if (entry && entry.unlocked) {
                out[def.id] = {
                    unlocked: true,
                    date: typeof entry.date === 'string' ? entry.date.slice(0, 40) : new Date().toISOString(),
                };
            }
        }
        return out;
    } catch (error) {
        return {};
    }
}

function saveAchievements(map) {
    writeStorage(ACHIEVEMENTS_STORAGE, JSON.stringify(map));
}

function isTutorialDismissed() {
    return readStorage(TUTORIAL_DISMISSED_STORAGE, 'false') === 'true';
}

const reducedMotion = (() => {
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (error) {
        return false;
    }
})();

const game = {
    canvas: null,
    ctx: null,
    width: GAME_CONFIG.canvasWidth,
    height: GAME_CONFIG.canvasHeight,

    state: 'MENU', // MENU, PLAYING, PAUSED, GAME_OVER

    difficulty: 'normal',
    currentConfig: null,

    score: 0,
    lives: GAME_CONFIG.lives,
    level: 1,
    playerName: sanitizePlayerName(readStorage(PLAYER_NAME_STORAGE, 'Player')),
    highScores: loadHighScores(),

    shipSkin: loadShipSkin(),
    achievements: loadAchievements(),

    achievementState: {
        ufoDestroyed: false,
        powerupCollected: false,
        hyperspaceSafe: false,
        maxLevel: 1,
        maxScore: 0,
    },

    toastQueue: [],
    toastActive: false,

    tutorialStep: 0,
    showAchievements: false,

    entities: {
        ship: null,
        asteroids: [],
        bullets: [],
        particles: [],
        powerups: [],
        ufo: null,
        ufoBullets: [],
        effects: [],
    },

    shipEffects: {
        shield: 0,
        double: 0,
    },

    lastTime: 0,
    lastUfoSpawn: 0,
    nextUfoDelay: UFO_SPAWN_INTERVAL_MIN + Math.random() * (UFO_SPAWN_INTERVAL_MAX - UFO_SPAWN_INTERVAL_MIN),
    lastIntensity: 0,

    // ── Difficulty Selection ──
    getSelectedConfig() {
        const diff = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
        return {
            ...GAME_CONFIG,
            ...diff,
        };
    },

    updateConfig() {
        this.currentConfig = this.getSelectedConfig();
    },

    init() {
        this.canvas = document.getElementById('asteroids-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Load saved difficulty
        const savedDiff = readStorage(DIFFICULTY_STORAGE);
        if (savedDiff && DIFFICULTY_PRESETS[savedDiff]) {
            this.difficulty = savedDiff;
        }

        this.updateConfig();

        this.setupInput();
        this.setupUI();
        this.updateOverlay();
        this.updateHud();
        this.updatePowerupHud();

        this.maybeShowTutorial();

        window.requestAnimationFrame((t) => this.loop(t));
    },

    /**
     * Select difficulty and start game
     */
    setDifficulty(difficulty) {
        if (!DIFFICULTY_PRESETS[difficulty] || ['PLAYING', 'PAUSED'].includes(this.state)) return;

        this.difficulty = difficulty;
        writeStorage(DIFFICULTY_STORAGE, difficulty);
        this.updateConfig();
        this.updateDifficultyButtons();
    },

    updateDifficultyButtons() {
        Object.entries(DIFFICULTY_PRESETS).forEach(([key, preset]) => {
            const btn = document.querySelector(`[data-diff="${key}"]`);
            if (!btn) return;

            const selected = key === this.difficulty;
            btn.classList.toggle('active', selected);
            btn.style.borderColor = selected ? preset.color : 'rgba(255, 255, 255, 0.1)';
            btn.style.color = selected ? preset.color : '#c4b5d4';
        });
    },

    // ── Ship Skin ──
    setShipSkin(skinId) {
        if (!SHIP_SKINS.some((s) => s.id === skinId)) return;
        this.shipSkin = skinId;
        writeStorage(SHIP_SKIN_STORAGE, skinId);
        this.updateSkinSwatches();
    },

    updateSkinSwatches() {
        const container = document.getElementById('skin-swatches');
        if (!container) return;
        container.innerHTML = '';
        SHIP_SKINS.forEach((skin) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'skin-swatch';
            btn.dataset.skin = skin.id;
            btn.style.color = skin.color;
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', skin.id === this.shipSkin ? 'true' : 'false');
            btn.setAttribute('aria-label', skin.name);
            btn.title = skin.name;
            if (skin.id === this.shipSkin) btn.classList.add('active');
            btn.addEventListener('click', () => this.setShipSkin(skin.id));
            container.appendChild(btn);
        });
    },

    // ── Achievements ──
    checkAchievements() {
        if (this.state !== 'PLAYING' && this.state !== 'GAME_OVER') return;
        ACHIEVEMENTS.forEach((def) => {
            if (this.achievements[def.id]) return;
            if (!def.check(this.achievementState)) return;
            const entry = { unlocked: true, date: new Date().toISOString() };
            this.achievements[def.id] = entry;
            this.toastQueue.push(def);
            saveAchievements(this.achievements);
        });
        if (!this.toastActive) this.processToastQueue();
        this.renderAchievementsList();
    },

    processToastQueue() {
        if (this.toastQueue.length === 0) {
            this.toastActive = false;
            return;
        }
        this.toastActive = true;
        const def = this.toastQueue.shift();
        const toast = document.getElementById('achievement-toast');
        const iconEl = document.getElementById('achievement-toast-icon');
        const textEl = document.getElementById('achievement-toast-text');
        if (toast && iconEl && textEl) {
            iconEl.textContent = def.icon;
            textEl.textContent = def.label;
            toast.style.display = 'flex';
            const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const duration = reduced ? 2000 : 3000;
            setTimeout(() => {
                toast.style.display = 'none';
                this.processToastQueue();
            }, duration);
        } else {
            this.processToastQueue();
        }
    },

    renderAchievementsList() {
        const list = document.getElementById('achievements-list');
        if (!list) return;
        list.innerHTML = '';
        ACHIEVEMENTS.forEach((def) => {
            const entry = this.achievements[def.id];
            const li = document.createElement('li');
            li.className = 'ach-item' + (entry ? ' unlocked' : '');
            li.setAttribute('role', 'listitem');

            const icon = document.createElement('span');
            icon.className = 'ach-item-icon';
            icon.textContent = def.icon;
            icon.setAttribute('aria-hidden', 'true');

            const body = document.createElement('div');
            body.className = 'ach-item-body';
            const label = document.createElement('div');
            label.className = 'ach-item-label';
            label.textContent = def.label;
            const desc = document.createElement('div');
            desc.className = 'ach-item-desc';
            desc.textContent = def.description;
            body.appendChild(label);
            body.appendChild(desc);

            const status = document.createElement('span');
            status.className = 'ach-item-date';
            if (entry) {
                const d = new Date(entry.date);
                status.textContent = isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-ES');
            } else {
                const hidden = document.createElement('span');
                hidden.className = 'sr-only';
                hidden.textContent = 'Bloqueado';
                status.textContent = '—';
                status.appendChild(hidden);
            }

            li.appendChild(icon);
            li.appendChild(body);
            li.appendChild(status);
            list.appendChild(li);
        });
    },

    toggleAchievementsPanel() {
        this.showAchievements = !this.showAchievements;
        const panel = document.getElementById('achievements-panel');
        const btn = document.getElementById('achievements-btn');
        if (panel) panel.style.display = this.showAchievements ? 'block' : 'none';
        if (btn) {
            btn.classList.toggle('active', this.showAchievements);
            btn.setAttribute('aria-expanded', this.showAchievements ? 'true' : 'false');
        }
    },

    // ── Tutorial ──
    maybeShowTutorial() {
        if (isTutorialDismissed()) return;
        if (this.state !== 'MENU') return;
        this.openTutorial();
    },

    openTutorial() {
        this.tutorialStep = 0;
        const overlay = document.getElementById('tutorial-overlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        this.renderTutorial();
        const firstBtn = document.getElementById('tutorial-next');
        if (firstBtn) firstBtn.focus();
    },

    closeTutorial(persistDismiss) {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.style.display = 'none';
        if (persistDismiss) {
            writeStorage(TUTORIAL_DISMISSED_STORAGE, 'true');
        }
    },

    renderTutorial() {
        const step = TUTORIAL_STEPS[this.tutorialStep];
        if (!step) return;
        const icon = document.getElementById('tutorial-icon');
        const title = document.getElementById('tutorial-title');
        const body = document.getElementById('tutorial-body');
        if (icon) icon.textContent = step.icon;
        if (title) title.textContent = step.title;
        if (body) body.textContent = step.body;

        const dots = document.getElementById('tutorial-dots');
        if (dots) {
            dots.innerHTML = '';
            TUTORIAL_STEPS.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'tutorial-dot' + (i === this.tutorialStep ? ' active' : '');
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-selected', i === this.tutorialStep ? 'true' : 'false');
                dot.setAttribute('aria-label', `Paso ${i + 1} de ${TUTORIAL_STEPS.length}`);
                dot.addEventListener('click', () => {
                    this.tutorialStep = i;
                    this.renderTutorial();
                });
                dots.appendChild(dot);
            });
        }

        const prev = document.getElementById('tutorial-prev');
        const next = document.getElementById('tutorial-next');
        if (prev) prev.disabled = this.tutorialStep === 0;
        if (next) next.disabled = this.tutorialStep === TUTORIAL_STEPS.length - 1;
    },

    tutorialNext() {
        if (this.tutorialStep < TUTORIAL_STEPS.length - 1) {
            this.tutorialStep += 1;
            this.renderTutorial();
        }
    },

    tutorialPrev() {
        if (this.tutorialStep > 0) {
            this.tutorialStep -= 1;
            this.renderTutorial();
        }
    },

    setupInput() {
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const tutorialOpen = document.getElementById('tutorial-overlay') &&
                document.getElementById('tutorial-overlay').style.display === 'flex';
            if (tutorialOpen) {
                if (e.key === 'Escape') {
                    const cb = document.getElementById('tutorial-dismiss-cb');
                    this.closeTutorial(cb && cb.checked);
                    e.preventDefault();
                    return;
                }
                if (e.key === 'ArrowRight' || e.key === ' ') {
                    this.tutorialNext();
                    e.preventDefault();
                    return;
                }
                if (e.key === 'ArrowLeft') {
                    this.tutorialPrev();
                    e.preventDefault();
                    return;
                }
                return;
            }
            if (e.key === 'r' || e.key === 'R') {
                if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'GAME_OVER') {
                    this.resetGame();
                }
            } else if (e.key === 'Escape') {
                if (this.state === 'PLAYING' || this.state === 'PAUSED') {
                    this.togglePause();
                }
            } else if (e.key === 'Enter') {
                if (this.state === 'MENU' || this.state === 'GAME_OVER') {
                    this.startGame();
                }
            } else if (e.key === 'h' || e.key === 'H') {
                if (this.state === 'PLAYING') {
                    this.tryHyperspace();
                }
            }
        });
    },

    setupUI() {
        // UI elements
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const quickBtn = document.getElementById('quick-restart-btn');
        const highScoreValue = document.getElementById('best-score-value');

        // Load initial high score
        if (highScoreValue && this.highScores.length > 0) {
            highScoreValue.textContent = this.highScores[0].score;
        }

        // Start buttons
        if (startBtn) startBtn.addEventListener('click', () => this.startGame());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());
        if (quickBtn) quickBtn.addEventListener('click', () => this.resetGame());

        // Name Input
        const nameInput = document.getElementById('player-name');
        if (nameInput) {
            nameInput.value = this.playerName;
            nameInput.addEventListener('change', (e) => {
                this.playerName = sanitizePlayerName(e.target.value);
                e.target.value = this.playerName;
                writeStorage(PLAYER_NAME_STORAGE, this.playerName);
            });
        }

        // ── Sound Controls ──

        const muteBtn = document.getElementById('mute-btn');
        const volumeSlider = document.getElementById('volume-slider');
        const bgmMuteBtn = document.getElementById('bgm-mute-btn');

        function updateMuteIcon() {
            if (muteBtn) {
                muteBtn.textContent = SoundManager.getMuteState() || SoundManager.getVolume() === 0
                    ? '🔇' : '🔊';
            }
        }

       function updateMusicIcon() {
            if (bgmMuteBtn) {
                bgmMuteBtn.textContent = MusicPlayer.getMuteState() ? '🔇' : '🎵';
            }
        }

        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                SoundManager.toggleMute();
                updateMuteIcon();
            });
        }

        if (volumeSlider) {
            volumeSlider.value = String(SoundManager.getVolume());
            volumeSlider.addEventListener('input', (e) => {
                SoundManager.setVolume(parseFloat(e.target.value));
                updateMuteIcon();
            });
        }

        if (bgmMuteBtn) {
            bgmMuteBtn.addEventListener('click', () => {
                MusicPlayer.toggleMute();
                updateMusicIcon();
            });
        }

        updateMuteIcon();
        updateMusicIcon();

        // ── Difficulty Buttons ──
        Object.entries(DIFFICULTY_PRESETS).forEach(([key, preset]) => {
            const btn = document.getElementById(`diff-btn-${key}`);
            if (btn) {
                btn.addEventListener('click', () => this.setDifficulty(key));
            }
        });
        this.updateDifficultyButtons();

        // ── Ship Skin ──
        this.updateSkinSwatches();

        // ── Achievements ──
        this.renderAchievementsList();
        const achBtn = document.getElementById('achievements-btn');
        if (achBtn) achBtn.addEventListener('click', () => this.toggleAchievementsPanel());

        // ── Tutorial ──
        const tPrev = document.getElementById('tutorial-prev');
        const tNext = document.getElementById('tutorial-next');
        const tSkip = document.getElementById('tutorial-skip');
        if (tPrev) tPrev.addEventListener('click', () => this.tutorialPrev());
        if (tNext) tNext.addEventListener('click', () => this.tutorialNext());
        if (tSkip) tSkip.addEventListener('click', () => {
            const cb = document.getElementById('tutorial-dismiss-cb');
            this.closeTutorial(cb && cb.checked);
        });
    },

    updateOverlay() {
        const overlay = document.getElementById('pause-overlay');
        const title = document.getElementById('overlay-title');
        const startBtn = document.getElementById('start-btn');
        const gameOverCard = document.getElementById('game-over-card');
        const nameInput = document.getElementById('name-input-container');
        const difficulty = document.getElementById('difficulty-selection');
        const shipSkin = document.getElementById('ship-skin-selection');
        const achievementsBtn = document.getElementById('achievements-btn');
        const achievementsPanel = document.getElementById('achievements-panel');

        const isMenu = this.state === 'MENU';
        const isPaused = this.state === 'PAUSED';
        const isGameOver = this.state === 'GAME_OVER';

        if (overlay) overlay.style.display = this.state === 'PLAYING' ? 'none' : 'flex';
        if (title) {
            if (isGameOver) {
                title.style.display = 'none';
            } else {
                title.style.display = 'block';
                title.textContent = isPaused ? 'PAUSED' : 'ASTEROIDS';
            }
        }
        if (startBtn) startBtn.style.display = isMenu ? 'block' : 'none';
        if (gameOverCard) gameOverCard.style.display = isGameOver ? 'flex' : 'none';
        if (nameInput) nameInput.style.display = isMenu ? 'inline-block' : 'none';
        if (difficulty) difficulty.style.display = isMenu ? 'block' : 'none';
        if (shipSkin) shipSkin.style.display = isMenu ? 'flex' : 'none';
        if (achievementsBtn) achievementsBtn.style.display = isMenu ? 'inline-block' : 'none';
        if (achievementsPanel) achievementsPanel.style.display = (isMenu && this.showAchievements) ? 'block' : 'none';
    },

    startGame() {
        const config = this.currentConfig;

        this.state = 'PLAYING';
        this.score = 0;
        this.lives = config.lives;
        this.level = 1;
        this.shipEffects.shield = 0;
        this.shipEffects.double = 0;
        this.entities.asteroids = [];
        this.entities.bullets = [];
        this.entities.particles = [];
        this.entities.powerups = [];
        this.entities.ufo = null;
        this.entities.ufoBullets = [];
        this.entities.effects = [];
        this.lastUfoSpawn = 0;
        this.nextUfoDelay = this.rollUfoDelay();
        this.lastIntensity = -1;

        this.entities.ship = new Ship(config);
        this.spawnWave();
        this.lastTime = performance.now();
        this.updateHud();
        this.updatePowerupHud();
        this.updateOverlay();

        MusicPlayer.start();
        MusicPlayer.setIntensity(0);
        MusicPlayer.setUfoActive(false);
    },

    rollUfoDelay() {
        const reduction = Math.max(0, this.level - 1) * UFO_SPAWN_INTERVAL_LEVEL_REDUCTION;
        const minDelay = Math.max(6, UFO_SPAWN_INTERVAL_MIN - reduction);
        const maxDelay = Math.max(minDelay + 4, UFO_SPAWN_INTERVAL_MAX - reduction);
        return minDelay + Math.random() * (maxDelay - minDelay);
    },

    spawnWave() {
        const count = ASTEROID_INITIAL_COUNT + (this.level - 1) * EXTRA_ASTEROID_PER_LEVEL;
        for (let i = 0; i < count; i++) {
            this.spawnAsteroid('large');
        }
    },

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.updateOverlay();
            MusicPlayer.pause();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.lastTime = performance.now();
            this.updateOverlay();
            MusicPlayer.resume();
        }
    },

    resetGame() {
        this.state = 'MENU';
        this.score = 0;
        this.lives = this.currentConfig?.lives || GAME_CONFIG.lives;
        this.level = 1;
        this.shipEffects.shield = 0;
        this.shipEffects.double = 0;

        // Clear everything
        this.entities.ship = null;
        this.entities.asteroids = [];
        this.entities.bullets = [];
        this.entities.particles = [];
        this.entities.powerups = [];
        this.entities.ufo = null;
        this.entities.ufoBullets = [];
        this.entities.effects = [];

        MusicPlayer.stop();
        MusicPlayer.setIntensity(0);
        MusicPlayer.setUfoActive(false);
        this.updateHud();
        this.updatePowerupHud();
        this.updateOverlay();
    },

    spawnAsteroid(type, atX = null, atY = null, target = this.entities.asteroids) {
        const size = type === 'large' ? ASTEROID_SIZE : (type === 'medium' ? ASTEROID_SIZE / 2 : ASTEROID_SIZE / 4);
        let asteroid = null;
        let safeSpawn = false;
        let attempts = 0;

        while (!safeSpawn && attempts < 10) {
            const x = atX !== null ? atX : Math.random() * game.width;
            const y = atY !== null ? atY : Math.random() * game.height;

            const ship = this.entities.ship;
            if (ship && atX === null) {
                const dist = Math.sqrt((x - ship.x) ** 2 + (y - ship.y) ** 2);
                if (dist < ship.r + size + 50) {
                    attempts++;
                    continue;
                }
            }

            asteroid = new Asteroid(size, x, y, type, this.currentConfig);
            safeSpawn = true;
        }

        if (asteroid) {
            target.push(asteroid);
        }
    },

    spawnPowerup(x, y) {
        const keys = Object.keys(POWERUP_TYPES);
        const typeKey = keys[Math.floor(Math.random() * keys.length)];
        const def = POWERUP_TYPES[typeKey];
        const angle = Math.random() * Math.PI * 2;
        const speed = POWERUP_SPEED;
        this.entities.powerups.push(new PowerUp(x, y, typeKey, def, Math.cos(angle) * speed, Math.sin(angle) * speed));
        SoundManager.playPowerupSpawn();
    },

    trySpawnPowerup(asteroid) {
        const rate = POWERUP_DROP_RATE[asteroid.type] || 0;
        if (Math.random() < rate) {
            this.spawnPowerup(asteroid.x, asteroid.y);
        }
    },

    splitAsteroid(asteroid, target) {
        const childType = asteroid.type === 'large' ? 'medium' : asteroid.type === 'medium' ? 'small' : null;
        if (!childType) return;

        this.spawnAsteroid(childType, asteroid.x, asteroid.y, target);
        this.spawnAsteroid(childType, asteroid.x, asteroid.y, target);
    },

    updateHud() {
        const scoreEl = document.getElementById('score');
        const livesEl = document.getElementById('lives');
        const levelEl = document.getElementById('level');
        const bestEl = document.getElementById('best-score-value');

        if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
        if (livesEl) livesEl.textContent = `Lives: ${this.lives}`;
        if (levelEl) levelEl.textContent = `Level: ${this.level}`;
        if (bestEl) bestEl.textContent = this.highScores[0]?.score || 0;
    },

    updatePowerupHud() {
        const container = document.getElementById('powerup-status');
        if (!container) return;
        const shield = this.shipEffects.shield;
        const double = this.shipEffects.double;

        container.innerHTML = '';

        if (shield > 0) {
            const slot = document.createElement('div');
            slot.className = 'pu-slot pu-shield';
            const icon = document.createElement('span');
            icon.className = 'pu-icon';
            icon.textContent = '🛡';
            const bar = document.createElement('div');
            bar.className = 'pu-bar';
            const fill = document.createElement('div');
            fill.className = 'pu-fill';
            fill.style.width = `${(shield / POWERUP_TYPES.shield.duration) * 100}%`;
            bar.appendChild(fill);
            slot.append(icon, bar);
            container.appendChild(slot);
        }

        if (double > 0) {
            const slot = document.createElement('div');
            slot.className = 'pu-slot pu-double';
            const icon = document.createElement('span');
            icon.className = 'pu-icon';
            icon.textContent = '⇉';
            const bar = document.createElement('div');
            bar.className = 'pu-bar';
            const fill = document.createElement('div');
            fill.className = 'pu-fill';
            fill.style.width = `${(double / POWERUP_TYPES.double.duration) * 100}%`;
            bar.appendChild(fill);
            slot.append(icon, bar);
            container.appendChild(slot);
        }
    },

    destroyAsteroid(asteroid, target, awardScore = true) {
        asteroid.hit();
        if (awardScore) this.score += SCORE_TABLE[asteroid.type] || 0;
        this.splitAsteroid(asteroid, target);
        this.trySpawnPowerup(asteroid);
        createExplosion(asteroid.x, asteroid.y, asteroid.type);
        SoundManager.playExplosion();
    },

    destroyUfo(ufo) {
        if (!ufo || ufo.dead) return;
        ufo.dead = true;
        this.score += SCORE_TABLE[`ufo${ufo.size.charAt(0).toUpperCase()}${ufo.size.slice(1)}`] || 0;
        this.achievementState.ufoDestroyed = true;
        createExplosion(ufo.x, ufo.y, 'large');
        SoundManager.playUfoExplode();
        if (this.entities.ufo === ufo) {
            this.entities.ufo = null;
            MusicPlayer.setUfoActive(false);
        }
        this.updateHud();
        this.checkAchievements();
    },

    tryHyperspace() {
        const ship = this.entities.ship;
        if (!ship) return;
        const now = performance.now();
        const last = ship.lastHyperspace || -Infinity;
        if (now - last < HYPERSPACE_COOLDOWN) {
            SoundManager.playHyperspaceFail();
            return;
        }
        ship.lastHyperspace = now;

        // Risk: 10% self-destruct
        if (Math.random() < HYPERSPACE_SELF_DESTRUCT_CHANCE) {
            SoundManager.playHyperspace();
            this.handlePlayerHit(null, { hyperspace: true });
            return;
        }

        // Find safe destination
        let dest = null;
        for (let i = 0; i < HYPERSPACE_SEARCH_ATTEMPTS; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            let safe = true;
            for (const a of this.entities.asteroids) {
                const d = Math.hypot(x - a.x, y - a.y);
                if (d < a.r + HYPERSPACE_SAFE_RADIUS) { safe = false; break; }
            }
            if (safe && this.entities.ufo) {
                const d = Math.hypot(x - this.entities.ufo.x, y - this.entities.ufo.y);
                if (d < this.entities.ufo.r + HYPERSPACE_SAFE_RADIUS) safe = false;
            }
            if (safe) { dest = { x, y }; break; }
        }

        if (!dest) {
            SoundManager.playHyperspaceFail();
            return;
        }

        SoundManager.playHyperspace();
        ship.x = dest.x;
        ship.y = dest.y;
        ship.vx = 0;
        ship.vy = 0;
        ship.invulnerable = Math.max(ship.invulnerable, HYPERSPACE_REENTRY_INVULN);
        ship.hyperspaceCooldownUntil = now + HYPERSPACE_COOLDOWN;
        this.achievementState.hyperspaceSafe = true;
        if (!reducedMotion) {
            this.entities.effects.push(new FlashEffect(ship.x, ship.y, '#ffffff', 0.15, HYPERSPACE_FLASH_FRAMES));
        }
        this.checkAchievements();
    },

    applyPowerup(type) {
        SoundManager.playPowerupPickup();
        this.score += SCORE_TABLE.powerup || 0;
        this.achievementState.powerupCollected = true;
        this.updateHud();
        this.checkAchievements();
        if (type === 'shield') {
            this.shipEffects.shield = POWERUP_TYPES.shield.duration;
        } else if (type === 'double') {
            this.shipEffects.double = POWERUP_TYPES.double.duration;
        } else if (type === 'life') {
            this.lives = Math.min(MAX_LIVES, this.lives + 1);
            this.updateHud();
        }
        this.updatePowerupHud();
        window.__lastPowerup = { type, time: performance.now(), effects: { ...this.shipEffects } };
    },

    trySpawnUfo(dt) {
        if (this.entities.ufo || this.state !== 'PLAYING') return;
        this.lastUfoSpawn += dt;
        if (this.lastUfoSpawn < this.nextUfoDelay) return;

        // Choose size based on level: small only after level 3
        const allowSmall = this.level >= UFO_SIZES.small.minLevel;
        const size = allowSmall && Math.random() < 0.4 ? 'small' : 'large';
        const fromLeft = Math.random() < 0.5;
        this.entities.ufo = new Ufo(size, fromLeft, this.currentConfig);
        this.lastUfoSpawn = 0;
        this.nextUfoDelay = this.rollUfoDelay();
        MusicPlayer.setUfoActive(true);
        SoundManager.playUFO();
    },

    updateBgmIntensity() {
        const largeCount = this.entities.asteroids.filter(a => a.type === 'large').length;
        const intensity = getBgmIntensity(this.level, largeCount, !!this.entities.ufo);
        if (intensity !== this.lastIntensity) {
            MusicPlayer.setIntensity(intensity);
            this.lastIntensity = intensity;
        }
    },

    update(dt) {
        const config = this.currentConfig;

        if (this.state !== 'PLAYING') return;

        // Update Ship
        this.entities.ship.update(dt, keys, config);
        if (isKeyActive('ArrowUp')) {
            SoundManager.playThrust();
            createThrustParticles(this.entities.ship);
        }

        // Ship power-up timers
        if (this.shipEffects.shield > 0) {
            this.shipEffects.shield = Math.max(0, this.shipEffects.shield - dt);
        }
        if (this.shipEffects.double > 0) {
            this.shipEffects.double = Math.max(0, this.shipEffects.double - dt);
        }

        // Update Bullets
        this.entities.bullets.forEach((bullet) => bullet.update(dt));
        this.entities.bullets = this.entities.bullets.filter((bullet) => !bullet.offscreen);

        // Power-ups
        this.entities.powerups.forEach((p) => p.update(dt));
        this.entities.powerups = this.entities.powerups.filter((p) => !p.dead);

        // UFO + UFO bullets
        if (this.entities.ufo) {
            this.entities.ufo.update(dt, this.entities.ship, this.entities.ufoBullets);
            if (this.entities.ufo.dead) {
                this.entities.ufo = null;
                MusicPlayer.setUfoActive(false);
            }
        }
        this.entities.ufoBullets.forEach((b) => b.update(dt));
        this.entities.ufoBullets = this.entities.ufoBullets.filter((b) => !b.offscreen);

        // Asteroid collisions
        const survivors = [];
        const spawnedAsteroids = [];
        this.entities.asteroids.forEach((asteroid) => {
            if (asteroid.dead) return;
            asteroid.update(dt);

            for (const bullet of this.entities.bullets) {
                if (!bullet.active || bullet.offscreen || asteroid.dead) continue;
                if (!checkCollision(bullet, asteroid)) continue;

                bullet.offscreen = true;
                bullet.active = false;
                this.destroyAsteroid(asteroid, spawnedAsteroids);
            }

            // Ship vs asteroid
            if (!asteroid.dead && this.entities.ship && checkCollision(this.entities.ship, asteroid)) {
                if (this.entities.ship.invulnerable <= 0) {
                    if (this.shipEffects.shield > 0) {
                        // Shield absorbs the hit, asteroid is destroyed, shield consumed
                        this.shipEffects.shield = 0;
                        this.entities.ship.invulnerable = 0.5;
                        this.updatePowerupHud();
                        this.destroyAsteroid(asteroid, spawnedAsteroids, false);
                        SoundManager.playExplosion();
                    } else {
                        this.handlePlayerHit(asteroid);
                        this.destroyAsteroid(asteroid, spawnedAsteroids, false);
                    }
                } else {
                    this.destroyAsteroid(asteroid, spawnedAsteroids, false);
                }
            }

            if (!asteroid.dead) survivors.push(asteroid);
        });

        // Ship vs power-up
        if (this.entities.ship) {
            this.entities.powerups.forEach((p) => {
                if (p.dead) return;
                if (checkCollision(this.entities.ship, p)) {
                    p.dead = true;
                    this.applyPowerup(p.type);
                }
            });
        }

        // Ship vs UFO bullets
        if (this.entities.ship && this.entities.ship.invulnerable <= 0 && this.shipEffects.shield <= 0) {
            this.entities.ufoBullets.forEach((b) => {
                if (b.offscreen) return;
                if (checkCollision(this.entities.ship, b)) {
                    b.offscreen = true;
                    this.handlePlayerHit(null, { ufoBullet: true });
                }
            });
        } else if (this.entities.ship) {
            // Shield absorbs UFO bullet
            this.entities.ufoBullets.forEach((b) => {
                if (b.offscreen) return;
                if (this.shipEffects.shield > 0 && checkCollision(this.entities.ship, b)) {
                    b.offscreen = true;
                    this.shipEffects.shield = 0;
                    this.updatePowerupHud();
                    SoundManager.playExplosion();
                }
            });
        }

        // Ship vs UFO collision
        if (this.entities.ship && this.entities.ufo && checkCollision(this.entities.ship, this.entities.ufo)) {
            if (this.entities.ship.invulnerable <= 0) {
                if (this.shipEffects.shield > 0) {
                    this.shipEffects.shield = 0;
                    this.updatePowerupHud();
                    this.destroyUfo(this.entities.ufo);
                    SoundManager.playExplosion();
                } else {
                    this.handlePlayerHit(null, { ufo: true });
                    this.destroyUfo(this.entities.ufo);
                }
            }
        }

        // Bullets vs UFO
        if (this.entities.ufo) {
            this.entities.bullets.forEach((bullet) => {
                if (!bullet.active || bullet.offscreen) return;
                if (checkCollision(bullet, this.entities.ufo)) {
                    bullet.offscreen = true;
                    bullet.active = false;
                    this.destroyUfo(this.entities.ufo);
                }
            });
        }

        // UFO vs asteroid (UFO dies on contact)
        if (this.entities.ufo) {
            for (const a of this.entities.asteroids) {
                if (a.dead) continue;
                if (checkCollision(this.entities.ufo, a)) {
                    a.hit();
                    this.destroyUfo(this.entities.ufo);
                    break;
                }
            }
        }

        this.entities.asteroids = survivors.concat(spawnedAsteroids);
        this.entities.bullets = this.entities.bullets.filter((bullet) => !bullet.offscreen);
        this.entities.powerups = this.entities.powerups.filter((p) => !p.dead);
        this.entities.ufoBullets = this.entities.ufoBullets.filter((b) => !b.offscreen);

        // Ship wrap
        this.entities.ship.wrap(this.width, this.height);

        // Wrap power-ups and UFO
        this.entities.powerups.forEach((p) => p.wrap(this.width, this.height));
        if (this.entities.ufo) this.entities.ufo.wrap(this.width, this.height);

        // Effects
        this.entities.effects.forEach((e) => e.update(dt));
        this.entities.effects = this.entities.effects.filter((e) => !e.dead);

        // A wave advances only after every asteroid and fragment is gone.
        if (this.entities.asteroids.length === 0) {
            this.level += 1;
            if (this.level > this.achievementState.maxLevel) {
                this.achievementState.maxLevel = this.level;
            }
            this.spawnWave();
            this.updateHud();
            this.checkAchievements();
            const banner = document.getElementById('level-banner');
            if (banner) {
                banner.textContent = `LEVEL ${this.level}`;
                banner.style.display = 'block';
                setTimeout(() => { banner.style.display = 'none'; }, 1800);
            }
            SoundManager.playLevelUp();
        }

        if (this.score > this.achievementState.maxScore) {
            this.achievementState.maxScore = this.score;
            this.checkAchievements();
        }

        // Update particles with global cap
        this.entities.particles.forEach((p) => p.update(dt));
        this.entities.particles = this.entities.particles.filter((p) => p.life > 0);
        while (this.entities.particles.length > MAX_PARTICLES) {
            this.entities.particles.shift();
        }

        // UFO spawn scheduling
        this.trySpawnUfo(dt);

        // BGM intensity
        this.updateBgmIntensity();

        // Update power-up HUD if timers changed
        if ((this.shipEffects.shield > 0) || (this.shipEffects.double > 0)) {
            this.updatePowerupHud();
        }

        this.updateHud();
    },

    handlePlayerHit(asteroid, opts = {}) {
        SoundManager.playPlayerHit();
        if (this.entities.ship) createPlayerExplosion(this.entities.ship);
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.entities.ship = new Ship(this.currentConfig);
        }

        this.updateHud();
    },

    gameOver() {
        this.state = 'GAME_OVER';
        SoundManager.playGameOver();

        const previousBest = this.highScores[0]?.score || 0;
        const qualifies = this.score > 0 && (
            this.highScores.length < 5 ||
            this.score >= this.highScores[this.highScores.length - 1].score
        );

        if (qualifies) {
            this.highScores = normalizeHighScores([...this.highScores, {
                score: this.score,
                name: sanitizePlayerName(this.playerName),
                date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
            }]);
            writeStorage(STORAGE_KEY, JSON.stringify(this.highScores));

            if (this.score > previousBest) {
                const existingNotice = document.getElementById('new-highscore-notice');
                if (existingNotice) existingNotice.remove();
                const notice = document.createElement('div');
                notice.id = 'new-highscore-notice';
                notice.textContent = '¡NUEVO RÉCORD!';
                document.body.appendChild(notice);
                setTimeout(() => notice.remove(), 3000);
                SoundManager.playNewHighScore();
            }
        }

        MusicPlayer.stop();
        MusicPlayer.setIntensity(0);
        MusicPlayer.setUfoActive(false);
        const finalScore = document.getElementById('final-score');
        const finalLevel = document.getElementById('final-level');
        if (finalScore) finalScore.textContent = `Score: ${this.score}`;
        if (finalLevel) finalLevel.textContent = `Level: ${this.level}`;
        this.renderHighScores();
        this.updateHud();
        this.updatePowerupHud();
        this.updateOverlay();
    },

    renderHighScores() {
        const table = document.getElementById('high-scores-list');
        if (!table) return;

        table.replaceChildren();
        this.highScores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.className = `hs-row-${index + 1}`;

            const rank = document.createElement('td');
            rank.className = 'hs-rank';
            rank.textContent = String(index + 1);

            const name = document.createElement('td');
            name.className = `hs-name ${this.getMedalClass(entry.name, entry.score)}`;
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
    },

    getMedalClass(name, score) {
        const nameLower = sanitizePlayerName(name).toLowerCase().replace(/\s/g, '');
        if (nameLower === 'jsnof' || nameLower === 'jonsnow' || nameLower === 'jon') {
            return 'hs-gold';
        }
        if (score >= 50000) return 'hs-gold';
        if (score >= 20000) return 'hs-silver';
        if (score >= 5000) return 'hs-bronze';
        return 'hs-none';
    },

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Entities
        if (this.entities.ship) this.entities.ship.draw(this.ctx, this.shipEffects);
        this.entities.bullets.forEach(b => b.draw(this.ctx));
        this.entities.asteroids.forEach(a => a.draw(this.ctx));
        if (this.entities.ufo) this.entities.ufo.draw(this.ctx);
        this.entities.ufoBullets.forEach(b => b.draw(this.ctx));
        this.entities.powerups.forEach(p => p.draw(this.ctx));
        this.entities.particles.forEach(p => p.draw(this.ctx));
        this.entities.effects.forEach(e => e.draw(this.ctx));

        // UI overlay
        this.updateHud();
    },

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }
        this.draw();

        window.requestAnimationFrame((t) => this.loop(t));
    }
};

// ── Classes ──

class Ship {
    constructor(config) {
        this.x = game.width / 2;
        this.y = game.height / 2;
        this.r = 15;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.rotation = 0;
        this.thrusting = false;
        this.invulnerable = config.invulnTime / 1000;
        this.fireCooldown = 0;
        this.config = config;
        this.lastHyperspace = 0;
    }

    update(dt, keys, config) {
        const frameScale = dt * 60;
        this.thrusting = isKeyActive('ArrowUp');

        if (isKeyActive('ArrowLeft')) this.rotation = -config.rotationSpeed;
        else if (isKeyActive('ArrowRight')) this.rotation = config.rotationSpeed;
        else this.rotation = 0;

        this.angle += this.rotation * dt;

        if (this.thrusting) {
            this.vx += Math.cos(this.angle) * config.thrust * frameScale;
            this.vy += Math.sin(this.angle) * config.thrust * frameScale;
        }

        const friction = Math.pow(config.friction, frameScale);
        this.vx *= friction;
        this.vy *= friction;

        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;

        this.invulnerable = Math.max(0, this.invulnerable - dt);
        this.fireCooldown = Math.max(0, this.fireCooldown - dt);

        const activeBullets = game.entities.bullets.filter((bullet) => bullet.active).length;
        if (isKeyActive('Space') && this.fireCooldown <= 0 && activeBullets < config.maxBullets) {
            const doubleActive = game.shipEffects.double > 0;
            const offset = doubleActive ? 0.18 : 0;
            this.fireBullet(this.angle - offset, config);
            if (doubleActive) this.fireBullet(this.angle + offset, config);
            this.fireCooldown = config.fireRate / 1000;
            SoundManager.playShoot();
        }
    }

    fireBullet(angle, config) {
        game.entities.bullets.push(new Bullet(this.x, this.y, angle, config));
    }

    wrap(w, h) {
        if (this.x < -this.r) this.x = w + this.r;
        else if (this.x > w + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = h + this.r;
        else if (this.y > h + this.r) this.y = -this.r;
    }

    draw(ctx, effects) {
        if (this.invulnerable > 0 && Math.floor(this.invulnerable * 60) % 4 > 0) {
            // still draw shield if active while blinking
        }

        // Shield ring
        if (effects && effects.shield > 0) {
            const alpha = 0.5 + Math.sin(performance.now() / 100) * 0.2;
            ctx.save();
            ctx.strokeStyle = POWERUP_TYPES.shield.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 12;
            ctx.shadowColor = POWERUP_TYPES.shield.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (this.invulnerable > 0 && Math.floor(this.invulnerable * 60) % 4 > 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.strokeStyle = getShipColor(game.shipSkin);
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = getShipColor(game.shipSkin);
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, -10);
        ctx.closePath();
        ctx.stroke();

        if (this.thrusting) {
            const flameLength = 15 + Math.random() * 10;
            ctx.strokeStyle = '#fbbf24';
            ctx.shadowColor = '#fbbf24';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(-7, 0);
            ctx.lineTo(-flameLength, 0);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Asteroid {
    constructor(radius, x, y, type = 'medium', config = GAME_CONFIG) {
        this.x = x ?? (Math.random() * game.width);
        this.y = y ?? (Math.random() * game.height);
        this.r = radius || (type === 'large' ? ASTEROID_SIZE : (type === 'medium' ? ASTEROID_SIZE / 2 : ASTEROID_SIZE / 4));
        this.type = type;

        const speed = config.asteroidMinSpeed + Math.random() * (config.asteroidMaxSpeed - config.asteroidMinSpeed);
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.05;
        this.dead = false;
    }

    update(dt) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        this.rotation += this.rotSpeed * frameScale;

        if (this.x < -this.r) this.x = game.width + this.r;
        else if (this.x > game.width + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = game.height + this.r;
        else if (this.y > game.height + this.r) this.y = -this.r;
    }

    hit() {
        this.dead = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.strokeStyle = GAME_CONFIG.asteroidColors[Math.floor(Math.random() * 3)];
        ctx.lineWidth = this.type === 'large' ? 3 : (this.type === 'medium' ? 2 : 1);
        ctx.shadowBlur = this.type === 'large' ? 10 : (this.type === 'medium' ? 6 : 3);
        ctx.shadowColor = ctx.strokeStyle;

        ctx.beginPath();
        const points = this.type === 'large' ? 12 : (this.type === 'medium' ? 10 : 8);
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const mut = 0.6 + Math.random() * 0.4;
            const px = Math.cos(angle) * this.r * mut;
            const py = Math.sin(angle) * this.r * mut;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        if (this.type === 'large') {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 0;
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2 + this.rotation;
                const cratX = Math.cos(angle) * this.r * 0.5;
                const cratY = Math.sin(angle) * this.r * 0.5;
                ctx.beginPath();
                ctx.arc(cratX, cratY, this.r * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, angle, config) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * config.bulletSpeed;
        this.vy = Math.sin(angle) * config.bulletSpeed;
        this.life = config.bulletLifetime / 60;
        this.offscreen = false;
        this.active = true;
        this.owner = 'ship';
    }

    update(dt) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        this.life -= dt;
        if (this.life <= 0 || this.x < 0 || this.x > game.width || this.y < 0 || this.y > game.height) {
            this.offscreen = true;
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class UfoBullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * UFO_BULLET_SPEED;
        this.vy = Math.sin(angle) * UFO_BULLET_SPEED;
        this.life = UFO_BULLET_LIFETIME;
        this.offscreen = false;
        this.r = 3;
    }

    update(dt) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.life -= dt;
        if (this.life <= 0 || this.x < -10 || this.x > game.width + 10 || this.y < -10 || this.y > game.height + 10) {
            this.offscreen = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#f87171';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#f87171';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Ufo {
    constructor(size = 'large', fromLeft = true, config = GAME_CONFIG) {
        const def = UFO_SIZES[size] || UFO_SIZES.large;
        this.size = size;
        this.r = def.r;
        this.x = fromLeft ? -this.r : game.width + this.r;
        this.y = this.r + Math.random() * (game.height * UFO_Y_FRACTION - this.r * 2);
        const dir = fromLeft ? 1 : -1;
        this.vx = dir * def.speed;
        this.vy = 0;
        this.def = def;
        this.fireCooldown = def.fireInterval;
        this.directionTimer = UFO_DIRECTION_CHANGE_MIN + Math.random() * (UFO_DIRECTION_CHANGE_MAX - UFO_DIRECTION_CHANGE_MIN);
        this.targetVy = 0;
        this.dead = false;
    }

    update(dt, ship, bulletList) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;

        // Random vertical drift
        this.directionTimer -= dt;
        if (this.directionTimer <= 0) {
            this.targetVy = (Math.random() - 0.5) * this.def.speed * 0.6;
            this.directionTimer = UFO_DIRECTION_CHANGE_MIN + Math.random() * (UFO_DIRECTION_CHANGE_MAX - UFO_DIRECTION_CHANGE_MIN);
        }
        this.vy += (this.targetVy - this.vy) * 0.05;

        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0 && ship) {
            const angle = Math.atan2(ship.y - this.y, ship.x - this.x);
            // Add slight inaccuracy
            const jitter = (Math.random() - 0.5) * 0.3;
            bulletList.push(new UfoBullet(this.x, this.y, angle + jitter));
            this.fireCooldown = this.def.fireInterval;
            SoundManager.playUfoShoot();
        }

        // Off-screen horizontal -> die
        if (this.x < -this.r - 40 || this.x > game.width + this.r + 40) {
            this.dead = true;
        }
    }

    wrap(w, h) {
        if (this.y < this.r) this.y = h - this.r;
        else if (this.y > h - this.r) this.y = this.r;
    }

    draw(ctx) {
        const blink = reducedMotion ? 1 : (0.7 + Math.sin(performance.now() / 120) * 0.3);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f87171';
        ctx.globalAlpha = blink;
        ctx.beginPath();
        // Saucer shape: ellipse with two arcs
        ctx.ellipse(0, 0, this.r, this.r * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -this.r * 0.3, this.r * 0.55, this.r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Lights
        if (this.size === 'large' && !reducedMotion) {
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.arc(i * (this.r * 0.2), this.r * 0.05, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#22d3ee';
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y, type, def, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.def = def;
        this.r = POWERUP_RADIUS;
        this.life = POWERUP_LIFETIME;
        this.dead = false;
        this.rotation = 0;
    }

    update(dt) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        this.rotation += dt * 1.2;
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }

    wrap(w, h) {
        if (this.x < -this.r) this.x = w + this.r;
        else if (this.x > w + this.r) this.x = -this.r;
        if (this.y < -this.r) this.y = h + this.r;
        else if (this.y > h + this.r) this.y = -this.r;
    }

    draw(ctx) {
        const blink = this.life < 3 && Math.floor(this.life * 8) % 2 === 0;
        if (blink) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = this.def.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.def.color;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Icon by shape
        if (this.def.shape === 'ring') {
            ctx.beginPath();
            ctx.arc(0, 0, this.r * 0.55, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.def.shape === 'arrow') {
            ctx.beginPath();
            ctx.moveTo(0, -this.r * 0.55);
            ctx.lineTo(this.r * 0.45, 0);
            ctx.lineTo(0, this.r * 0.55);
            ctx.lineTo(-this.r * 0.45, 0);
            ctx.closePath();
            ctx.stroke();
        } else if (this.def.shape === 'plus') {
            ctx.beginPath();
            ctx.moveTo(-this.r * 0.55, 0);
            ctx.lineTo(this.r * 0.55, 0);
            ctx.moveTo(0, -this.r * 0.55);
            ctx.lineTo(0, this.r * 0.55);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class FlashEffect {
    constructor(x, y, color, life, frames) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.frames = frames;
        this.dead = false;
    }

    update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
    }

    draw(ctx) {
        const t = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = t;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, (1 - t) * 30 + 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createExplosion(x, y, type) {
    const count = type === 'large' ? 16 : (type === 'medium' ? 12 : 8);
    for (let i = 0; i < count; i++) {
        game.entities.particles.push(new Particle(x, y, type));
    }
}

function createThrustParticles(ship) {
    if (Math.random() > PARTICLE_THRUST_RATE) return;
    if (!ship) return;
    const angle = ship.angle + Math.PI;
    const spread = 0.5;
    const a = angle + (Math.random() - 0.5) * spread;
    const px = ship.x + Math.cos(ship.angle) * -8;
    const py = ship.y + Math.sin(ship.angle) * -8;
    game.entities.particles.push(new Particle(px, py, 'thrust', a));
}

function createPlayerExplosion(ship) {
    if (!ship) return;
    for (let i = 0; i < PARTICLE_PLAYER_EXPLOSION; i++) {
        game.entities.particles.push(new Particle(ship.x, ship.y, 'player'));
    }
}

class Particle {
    constructor(x, y, type, angle) {
        this.x = x;
        this.y = y;
        const baseSpeed = (Math.random() * 2 + 2) * PARTICLE_SPEED;
        if (typeof angle === 'number') {
            this.vx = Math.cos(angle) * baseSpeed;
            this.vy = Math.sin(angle) * baseSpeed;
        } else {
            this.vx = (Math.random() - 0.5) * 5;
            this.vy = (Math.random() - 0.5) * 5;
        }
        this.life = (50 + Math.random() * 30) / 60;
        this.maxLife = this.life;

        if (type === 'large') {
            this.color = '#fff';
            this.size = 3;
        } else if (type === 'medium') {
            this.color = '#fbbf24';
            this.size = 2.5;
        } else if (type === 'thrust') {
            this.color = '#fbbf24';
            this.size = 1.8;
        } else if (type === 'player') {
            const colors = ['#06b6d4', '#fff', '#22d3ee', '#fbbf24'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.size = 2 + Math.random() * 1.5;
        } else {
            this.color = '#f6e05e';
            this.size = 2;
        }
    }

    update(dt) {
        const frameScale = dt * 60;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
        this.life -= dt;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.r || 2) + (obj2.r || 2);
}

// Init
window.onload = () => game.init();
