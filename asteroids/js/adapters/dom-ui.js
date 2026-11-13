/**
 * DOM UI adapter (UiPort): HUD, power-up bar, overlays, difficulty and skin pickers,
 * achievements list and toasts, tutorial, high scores table, and sound controls.
 * Element ids and classes are the contract with index.html and css/style.css.
 */
const DomUi = {
    game: null,
    repository: null,
    showAchievements: false,
    tutorialStep: 0,
    toastQueue: [],
    toastActive: false,
    hudPrev: { score: -1, lives: -1, level: -1, best: -1 },
    hudEls: null,

    el(id) {
        return document.getElementById(id);
    },

    // game: AsteroidsGame (commands + read-only state). repository: LocalStorageRepository.
    init(game, repository) {
        this.game = game;
        this.repository = repository;

        const highScoreValue = this.el('best-score-value');
        if (highScoreValue && game.highScores.length > 0) {
            highScoreValue.textContent = game.highScores[0].score;
        }

        const startBtn = this.el('start-btn');
        const pauseBtn = this.el('pause-btn');
        const quickBtn = this.el('quick-restart-btn');
        if (startBtn) startBtn.addEventListener('click', () => game.startGame());
        if (pauseBtn) pauseBtn.addEventListener('click', () => game.togglePause());
        if (quickBtn) quickBtn.addEventListener('click', () => game.resetGame());

        const nameInput = this.el('player-name');
        if (nameInput) {
            nameInput.value = game.playerName;
            nameInput.addEventListener('change', (e) => {
                e.target.value = game.setPlayerName(e.target.value);
            });
        }

        this.bindSoundControls();

        Object.keys(DIFFICULTY_PRESETS).forEach((key) => {
            const btn = this.el(`diff-btn-${key}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (game.setDifficulty(key)) this.setDifficultyButtons(game.difficulty);
                });
            }
        });
        this.setDifficultyButtons(game.difficulty);

        this.renderSkinSwatches();

        this.renderAchievementsList(game.achievements);
        const achBtn = this.el('achievements-btn');
        if (achBtn) achBtn.addEventListener('click', () => this.toggleAchievementsPanel());

        const tPrev = this.el('tutorial-prev');
        const tNext = this.el('tutorial-next');
        const tSkip = this.el('tutorial-skip');
        if (tPrev) tPrev.addEventListener('click', () => this.tutorialPrev());
        if (tNext) tNext.addEventListener('click', () => this.tutorialNext());
        if (tSkip) tSkip.addEventListener('click', () => this.closeTutorialFromCheckbox());
    },

    // ── Sound controls (SFX mute, music mute, volume) ──
    bindSoundControls() {
        const muteBtn = this.el('mute-btn');
        const volumeSlider = this.el('volume-slider');
        const bgmMuteBtn = this.el('bgm-mute-btn');

        const updateMuteIcon = () => {
            if (muteBtn) {
                muteBtn.textContent = SoundManager.getMuteState() || SoundManager.getVolume() === 0
                    ? '🔇' : '🔊';
            }
        };

        const updateMusicIcon = () => {
            if (bgmMuteBtn) {
                bgmMuteBtn.textContent = MusicPlayer.getMuteState() ? '🔇' : '🎵';
            }
        };

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
    },

    // ── UiPort ──
    setHud(hud) {
        if (!this.hudEls) {
            this.hudEls = {
                score: this.el('score'),
                lives: this.el('lives'),
                level: this.el('level'),
                best: this.el('best-score-value'),
            };
        }
        const h = this.hudEls;
        const prev = this.hudPrev;

        if (h.score && prev.score !== hud.score) h.score.textContent = `Score: ${hud.score}`;
        if (h.lives && prev.lives !== hud.lives) h.lives.textContent = `Lives: ${hud.lives}`;
        if (h.level && prev.level !== hud.level) h.level.textContent = `Level: ${hud.level}`;
        if (h.best && prev.best !== hud.best) h.best.textContent = hud.best;

        prev.score = hud.score;
        prev.lives = hud.lives;
        prev.level = hud.level;
        prev.best = hud.best;
    },

    setPowerupHud(timers) {
        const container = this.el('powerup-status');
        if (!container) return;

        container.innerHTML = '';

        if (timers.shield > 0) {
            container.appendChild(this.powerupSlot('pu-shield', '🛡', timers.shield / POWERUP_TYPES.shield.duration));
        }

        if (timers.double > 0) {
            container.appendChild(this.powerupSlot('pu-double', '⇉', timers.double / POWERUP_TYPES.double.duration));
        }
    },

    powerupSlot(className, iconText, fraction) {
        const slot = document.createElement('div');
        slot.className = `pu-slot ${className}`;
        const icon = document.createElement('span');
        icon.className = 'pu-icon';
        icon.textContent = iconText;
        const bar = document.createElement('div');
        bar.className = 'pu-bar';
        const fill = document.createElement('div');
        fill.className = 'pu-fill';
        fill.style.width = `${fraction * 100}%`;
        bar.appendChild(fill);
        slot.append(icon, bar);
        return slot;
    },

    setOverlay(state) {
        const overlay = this.el('pause-overlay');
        const title = this.el('overlay-title');
        const startBtn = this.el('start-btn');
        const gameOverCard = this.el('game-over-card');
        const nameInput = this.el('name-input-container');
        const difficulty = this.el('difficulty-selection');
        const shipSkin = this.el('ship-skin-selection');
        const achievementsBtn = this.el('achievements-btn');
        const achievementsPanel = this.el('achievements-panel');

        const isMenu = state === 'MENU';
        const isPaused = state === 'PAUSED';
        const isGameOver = state === 'GAME_OVER';

        if (overlay) overlay.style.display = state === 'PLAYING' ? 'none' : 'flex';
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

    showLevelBanner(level) {
        const banner = this.el('level-banner');
        if (banner) {
            banner.textContent = `LEVEL ${level}`;
            banner.style.display = 'block';
            setTimeout(() => { banner.style.display = 'none'; }, 1800);
        }
    },

    showGameOver(info) {
        if (info.newRecord) {
            const existingNotice = this.el('new-highscore-notice');
            if (existingNotice) existingNotice.remove();
            const notice = document.createElement('div');
            notice.id = 'new-highscore-notice';
            notice.textContent = '¡NUEVO RÉCORD!';
            document.body.appendChild(notice);
            setTimeout(() => notice.remove(), 3000);
        }

        const finalScore = this.el('final-score');
        const finalLevel = this.el('final-level');
        if (finalScore) finalScore.textContent = `Score: ${info.score}`;
        if (finalLevel) finalLevel.textContent = `Level: ${info.level}`;
        this.renderHighScores(info.highScores);
    },

    setAchievements(map, newlyUnlocked) {
        newlyUnlocked.forEach((def) => this.toastQueue.push(def));
        if (!this.toastActive) this.processToastQueue();
        this.renderAchievementsList(map);
    },

    // ── Difficulty and skin pickers ──
    setDifficultyButtons(difficulty) {
        Object.entries(DIFFICULTY_PRESETS).forEach(([key, preset]) => {
            const btn = document.querySelector(`[data-diff="${key}"]`);
            if (!btn) return;

            const selected = key === difficulty;
            btn.classList.toggle('active', selected);
            btn.style.borderColor = selected ? preset.color : 'rgba(255, 255, 255, 0.1)';
            btn.style.color = selected ? preset.color : '#c4b5d4';
        });
    },

    renderSkinSwatches() {
        const container = this.el('skin-swatches');
        if (!container) return;
        const current = this.game.shipSkin;
        container.innerHTML = '';
        SHIP_SKINS.forEach((skin) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'skin-swatch';
            btn.dataset.skin = skin.id;
            btn.style.color = skin.color;
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', skin.id === current ? 'true' : 'false');
            btn.setAttribute('aria-label', skin.name);
            btn.title = skin.name;
            if (skin.id === current) btn.classList.add('active');
            btn.addEventListener('click', () => {
                this.game.setShipSkin(skin.id);
                this.renderSkinSwatches();
            });
            container.appendChild(btn);
        });
    },

    // ── Achievements ──
    processToastQueue() {
        if (this.toastQueue.length === 0) {
            this.toastActive = false;
            return;
        }
        this.toastActive = true;
        const def = this.toastQueue.shift();
        const toast = this.el('achievement-toast');
        const iconEl = this.el('achievement-toast-icon');
        const textEl = this.el('achievement-toast-text');
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

    renderAchievementsList(map) {
        const list = this.el('achievements-list');
        if (!list) return;
        list.innerHTML = '';
        ACHIEVEMENTS.forEach((def) => {
            const entry = map[def.id];
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
        const panel = this.el('achievements-panel');
        const btn = this.el('achievements-btn');
        if (panel) panel.style.display = this.showAchievements ? 'block' : 'none';
        if (btn) {
            btn.classList.toggle('active', this.showAchievements);
            btn.setAttribute('aria-expanded', this.showAchievements ? 'true' : 'false');
        }
    },

    // ── High scores ──
    renderHighScores(highScores) {
        const table = this.el('high-scores-list');
        if (!table) return;

        table.replaceChildren();
        highScores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.className = `hs-row-${index + 1}`;

            const rank = document.createElement('td');
            rank.className = 'hs-rank';
            rank.textContent = String(index + 1);

            const name = document.createElement('td');
            name.className = `hs-name ${ScoreRules.medalClass(entry.name, entry.score)}`;
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

    // ── Tutorial ──
    isTutorialOpen() {
        const overlay = this.el('tutorial-overlay');
        return !!overlay && overlay.style.display === 'flex';
    },

    maybeShowTutorial(state) {
        if (this.repository.isTutorialDismissed()) return;
        if (state !== 'MENU') return;
        this.openTutorial();
    },

    openTutorial() {
        this.tutorialStep = 0;
        const overlay = this.el('tutorial-overlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        this.renderTutorial();
        const firstBtn = this.el('tutorial-next');
        if (firstBtn) firstBtn.focus();
    },

    closeTutorial(persistDismiss) {
        const overlay = this.el('tutorial-overlay');
        if (overlay) overlay.style.display = 'none';
        if (persistDismiss) {
            this.repository.dismissTutorial();
        }
    },

    closeTutorialFromCheckbox() {
        const cb = this.el('tutorial-dismiss-cb');
        this.closeTutorial(cb && cb.checked);
    },

    renderTutorial() {
        const step = TUTORIAL_STEPS[this.tutorialStep];
        if (!step) return;
        const icon = this.el('tutorial-icon');
        const title = this.el('tutorial-title');
        const body = this.el('tutorial-body');
        if (icon) icon.textContent = step.icon;
        if (title) title.textContent = step.title;
        if (body) body.textContent = step.body;

        const dots = this.el('tutorial-dots');
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

        const prev = this.el('tutorial-prev');
        const next = this.el('tutorial-next');
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
};
