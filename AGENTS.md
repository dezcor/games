# Games Hub

Static HTML/JS/CSS games collection (Snake, Tetris). No build tools, no dependencies, no tests.

## Serve locally

```sh
# Any static server works, e.g.:
python3 -m http.server 8000
npx serve .
```

## Structure

- `index.html` — games hub listing (links to both games)
- `snake/` — self-contained Snake game
  - Scripts loaded in order: `sound.js` → `game.js`
  - `SnakeGame` class extends `Game` base
- `tetris/` — Tetris with modular JS
  - Script load order (HTML order): `constants.js` → `tetriminos.js` → `input.js` → `sound.js` → `game.js`
  - Flat functions (no classes), module-level state (`player`, `grid`, `keys`)
  - Board: 12×20 grid, 20px blocks

## Game controls

**Snake:** Arrow keys / WASD to steer, Space to restart after game over. Direction reversal blocked.

**Tetris:** ← → ↓ to move, ↑ to rotate, Space hard-drop, P / Escape pause, R restart, Enter start. DAS/ARR input system (170ms delay, 50ms repeat).

## Audio

Both games use Web Audio API with synthesized oscillators (no audio files). `SoundManager` handles SFX, `MusicPlayer` handles BGM via scheduler. Code is duplicated between the two games (not shared).

Audio requires a user gesture to start (browser autoplay policy). Both games call `SoundManager.ensureAudio()` on first sound play.

## localStorage keys

- `snakeHighScore` — Snake high score (number)
- `tetris_highscores` — Tetris top 5 (JSON array)
- `tetris_player_name` — Tetris player name (string)

## Easter egg

Tetris player name `JonSnow` / `Jon` / `JSnof` (case-insensitive, whitespace-stripped) activates a "North theme": GoT-flavored game over messages, blue accent color (`#88ccff`), and darker CSS theme.

## Touch controls

Both games have on-screen touch buttons using `touchstart`/`touchend` events with `e.preventDefault()`. Snake also supports swipe gestures on the canvas. Touch buttons toggle `keys` object state (DAS system in Tetris handles held keys).

## No tests, no CI, no linting, no formatting config
