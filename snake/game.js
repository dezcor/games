class Game {
    start() {
        throw new Error("Method 'start()' must be implemented.");
    }
}

class SnakeGame extends Game {
    constructor(canvasId, scoreId, gameOverId) {
        super();
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById(scoreId);
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverScreen = document.getElementById(gameOverId);

        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.highScoreElement.innerText = `BEST: ${this.highScore}`;
        this.dx = 1;
        this.dy = 0;

        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.food = { x: 15, y: 15 };
        this.gameSpeed = 100;
        this.lastTime = 0;
        this.isGameOver = false;

        this.init();
    }

    init() {
        this.generateFood();
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.setupTouchButtons();
        this.setupSwipe();
    }

    start() {
        SoundManager.startBgm();
        requestAnimationFrame((currentTime) => this.main(currentTime));
    }

    main(currentTime) {
        if (this.isGameOver) return;

        if (currentTime - this.lastTime > this.gameSpeed) {
            this.lastTime = currentTime;
            this.update();
            this.draw();
        }
        requestAnimationFrame((t) => this.main(t));
    }

    update() {
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return this.endGame();
        }

        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return this.endGame();
            }
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.scoreElement.innerText = this.score;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
                this.highScoreElement.innerText = `BEST: ${this.highScore}`;
                SoundManager.playNewHighScore();
            } else {
                SoundManager.playEat();
            }
            this.generateFood();
            if (this.gameSpeed > 50) this.gameSpeed -= 2;
        } else {
            this.snake.pop();
        }
    }

    draw() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);

        this.snake.forEach((part, index) => {
            this.ctx.fillStyle = index === 0 ? 'green' : 'lime';
            this.ctx.fillRect(part.x * this.gridSize, part.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
        });
    }

    generateFood() {
        this.food.x = Math.floor(Math.random() * this.tileCount);
        this.food.y = Math.floor(Math.random() * this.tileCount);

        this.snake.forEach(part => {
            if (part.x === this.food.x && part.y === this.food.y) {
                this.generateFood();
            }
        });
    }

    endGame() {
        this.isGameOver = true;
        this.gameOverScreen.classList.remove('hidden');
        const finalScoreEl = document.getElementById('final-score-text');
        if (finalScoreEl) {
            finalScoreEl.textContent = `Score: ${this.score}`;
        }
        SoundManager.playGameOver();
    }

    resetGame() {
        this.score = 0;
        this.dx = 1;
        this.dy = 0;
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.food = { x: 15, y: 15 };
        this.gameSpeed = 100;
        this.isGameOver = false;
        this.scoreElement.innerText = this.score;
        this.gameOverScreen.classList.add('hidden');
        this.generateFood();
        this.lastTime = performance.now();
        SoundManager.startBgm();
        requestAnimationFrame((t) => this.main(t));
    }

    setDirection(dx, dy) {
        if (this.isGameOver) return;
        if (this.dx === -dx && this.dy === -dy) return;
        this.dx = dx;
        this.dy = dy;
        SoundManager.playMove();
    }

    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                this.setDirection(0, -1);
                break;
            case 'ArrowDown':
            case 's':
                this.setDirection(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
                this.setDirection(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
                this.setDirection(1, 0);
                break;
            case ' ':
                if (this.isGameOver) {
                    this.resetGame();
                }
                break;
        }
    }

    setupTouchButtons() {
        const dirMap = {
            'up': [0, -1],
            'down': [0, 1],
            'left': [-1, 0],
            'right': [1, 0],
        };

        document.querySelectorAll('.touch-btn').forEach(btn => {
            const action = btn.dataset.action;

            const onStart = () => {
                btn.classList.add('pressed');
                if (dirMap[action]) {
                    this.setDirection(dirMap[action][0], dirMap[action][1]);
                } else if (action === 'restart') {
                    this.resetGame();
                }
            };

            const onEnd = () => {
                btn.classList.remove('pressed');
            };

            btn.addEventListener('touchstart', (e) => {
                if (e.cancelable) e.preventDefault();
                onStart();
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                if (e.cancelable) e.preventDefault();
                onEnd();
            }, { passive: false });

            btn.addEventListener('touchcancel', () => {
                onEnd();
            });

            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                onStart();
            });

            btn.addEventListener('mouseup', () => {
                onEnd();
            });

            btn.addEventListener('mouseleave', () => {
                onEnd();
            });
        });
    }

    setupSwipe() {
        let startX = 0;
        let startY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            const minSwipe = 20;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipe) {
                    this.setDirection(deltaX > 0 ? 1 : -1, 0);
                }
            } else {
                if (Math.abs(deltaY) > minSwipe) {
                    this.setDirection(0, deltaY > 0 ? 1 : -1);
                }
            }
        }, { passive: true });
    }
}

const muteBtn = document.getElementById('mute-btn');
const bgmMuteBtn = document.getElementById('bgm-mute-btn');
const volumeSlider = document.getElementById('volume-slider');

function updateMuteIcon() {
    if (muteBtn) {
        muteBtn.textContent = SoundManager.getMuteState() || SoundManager.getVolume() === 0 ? '🔇' : '🔊';
    }
}

function updateMusicIcon() {
    if (bgmMuteBtn) {
        bgmMuteBtn.textContent = MusicPlayer.getBgmMuteState() ? '🔇' : '🎵';
    }
}

if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        SoundManager.toggleMute();
        updateMuteIcon();
    });
}

if (bgmMuteBtn) {
    bgmMuteBtn.addEventListener('click', () => {
        MusicPlayer.toggleMute();
        updateMusicIcon();
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

const game = new SnakeGame('gameCanvas', 'score', 'game-over');
game.start();

window.resetGame = game.resetGame.bind(game);
