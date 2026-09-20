/**
 * SoundAdapter — implements SoundPort.
 * SoundManager + MusicPlayer, all synthesized via Web Audio API.
 */

let audioCtx = null;
let sfxGain = null;
let bgmGain = null;
let sfxVolume = 0.7;
let bgmVolume = 0.1;
let sfxMuted = false;
let bgmMuted = false;
let musicScheduler = null;
let bgmRunning = false;
let bgmIntensity = 0;

function getStoredNumber(key, fallback) {
    try {
        const value = Number.parseFloat(localStorage.getItem(key));
        return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
    } catch (error) {
        return fallback;
    }
}

function getStoredBoolean(key) {
    try {
        return localStorage.getItem(key) === 'true';
    } catch (error) {
        return false;
    }
}

function saveAudioSetting(key, value) {
    try {
        localStorage.setItem(key, String(value));
    } catch (error) {
        // Storage can be unavailable in private browsing contexts.
    }
}

sfxVolume = getStoredNumber(AUDIO_VOLUME_STORAGE, sfxVolume);
bgmVolume = getStoredNumber(BGM_VOLUME_STORAGE, bgmVolume);
sfxMuted = getStoredBoolean(SFX_MUTED_STORAGE);
bgmMuted = getStoredBoolean(BGM_MUTED_STORAGE);

function updateSfxGain() {
    if (sfxGain) sfxGain.gain.setValueAtTime(sfxMuted ? 0 : sfxVolume, audioCtx.currentTime);
}

function updateBgmGain() {
    if (bgmGain) bgmGain.gain.setValueAtTime(bgmMuted ? 0 : bgmVolume, audioCtx.currentTime);
}

// ── Initialize ──
function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        sfxGain = audioCtx.createGain();
        bgmGain = audioCtx.createGain();
        sfxGain.connect(audioCtx.destination);
        bgmGain.connect(audioCtx.destination);
        updateSfxGain();
        updateBgmGain();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// ── Sound Helpers ──
function playTone(freq, type, duration, volume, delay) {
    ensureAudio();
    if (sfxMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = audioCtx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(start);
    osc.stop(start + duration);
}

function playSweep(startFreq, endFreq, duration, type, volume, delay) {
    ensureAudio();
    if (sfxMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    const start = audioCtx.currentTime + (delay || 0);
    osc.frequency.setValueAtTime(startFreq, start);
    osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(start);
    osc.stop(start + duration);
}

function playNoise(duration, volume, delay) {
    ensureAudio();
    if (sfxMuted) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (volume || 0.5);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    const start = audioCtx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    noise.connect(gain);
    gain.connect(sfxGain);
    noise.start(start);
}

// ── Minesweeper Sounds ──
const SoundManager = {
    playReveal() {
        playTone(600, 'sine', 0.06, 0.08);
    },

    playFlag() {
        playSweep(300, 500, 0.08, 'triangle', 0.1);
    },

    playExplosion() {
        playNoise(0.3, 0.3);
        playSweep(150, 60, 0.2, 'sawtooth', 0.2, 0.05);
    },

    playWin() {
        playTone(523, 'triangle', 0.15, 0.15, 0);
        playTone(659, 'triangle', 0.15, 0.15, 0.12);
        playTone(784, 'triangle', 0.15, 0.15, 0.24);
        playTone(1047, 'triangle', 0.3, 0.18, 0.36);
    },

    playGameOver() {
        playSweep(440, 100, 0.5, 'sawtooth', 0.2);
        playSweep(300, 80, 0.4, 'sawtooth', 0.15, 0.3);
        playSweep(200, 50, 0.5, 'sawtooth', 0.1, 0.7);
    },

    playClick() {
        playTone(800, 'sine', 0.04, 0.06);
    },

    playNewHighScore() {
        playTone(523, 'triangle', 0.15, 0.15, 0);
        playTone(659, 'triangle', 0.15, 0.15, 0.12);
        playTone(784, 'triangle', 0.15, 0.15, 0.24);
        playTone(1047, 'triangle', 0.3, 0.18, 0.36);
    },

    // ── API ──
    setVolume(value) {
        const normalized = Number(value);
        if (!Number.isFinite(normalized)) return;
        sfxVolume = Math.max(0, Math.min(1, normalized));
        saveAudioSetting(AUDIO_VOLUME_STORAGE, sfxVolume);
        updateSfxGain();
    },

    toggleMute() {
        sfxMuted = !sfxMuted;
        saveAudioSetting(SFX_MUTED_STORAGE, sfxMuted);
        updateSfxGain();
        return sfxMuted;
    },

    getMuteState() { return sfxMuted; },
    getVolume() { return sfxVolume; },
};

// ── Music Player (procedural BGM) ──
let bgmTimer = null;
let bgmStep = 0;
let bgmNextNoteTime = 0;
let bgmTempo = 100;

const lookahead = 25;
const stepsPerBeat = 4;

const melodyNotes = [261, 0, 330, 0, 392, 0, 330, 0,
                     261, 0, 330, 0, 392, 0, 523, 0];
const bassNotes = [0, 0, 261, 0,
                   0, 0, 330, 0,
                   0, 0, 261, 0,
                   0, 0, 330, 0];

function scheduleNote(step, time) {
    const beatDuration = 60 / bgmTempo;
    const stepDuration = beatDuration / stepsPerBeat;
    const intensityVol = BGM_VOLUME[bgmIntensity] || 0.08;

    const melodyNote = melodyNotes[step % melodyNotes.length];
    if (melodyNote > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = bgmIntensity >= 2 ? 'square' : 'sine';
        osc.frequency.value = melodyNote;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.04 * intensityVol, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration);
        osc.connect(gain);
        gain.connect(bgmGain);
        osc.start(time);
        osc.stop(time + stepDuration);
    }

    const bassNote = bassNotes[step % bassNotes.length];
    if (bassNote > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = bassNote;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.08 * intensityVol, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 2);
        osc.connect(gain);
        gain.connect(bgmGain);
        osc.start(time);
        osc.stop(time + stepDuration * 2);
    }
}

function schedule() {
    while (bgmNextNoteTime < audioCtx.currentTime + lookahead) {
        scheduleNote(bgmStep, bgmNextNoteTime);
        bgmStep++;
        bgmNextNoteTime += (60 / bgmTempo) / stepsPerBeat;
    }
    bgmTimer = setTimeout(schedule, lookahead);
}

function applyBgmVolume() {
    if (!bgmGain) return;
    const target = BGM_VOLUME[bgmIntensity] || 0.08;
    const now = audioCtx.currentTime;
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
    bgmGain.gain.linearRampToValueAtTime(bgmMuted ? 0 : target, now + 0.5);
}

// ── MusicPlayer API ──
const MusicPlayer = {
    start() {
        ensureAudio();
        if (bgmRunning) return;
        bgmRunning = true;
        bgmStep = 0;
        bgmNextNoteTime = audioCtx.currentTime + 0.1;
        schedule();
        applyBgmVolume();
    },

    stop() {
        if (bgmTimer) {
            clearTimeout(bgmTimer);
            bgmTimer = null;
        }
        bgmRunning = false;
    },

    pause() {
        if (bgmTimer) {
            clearTimeout(bgmTimer);
            bgmTimer = null;
        }
        bgmRunning = false;
    },

    resume() {
        if (!bgmRunning) {
            bgmRunning = true;
            bgmStep = 0;
            bgmNextNoteTime = audioCtx.currentTime + 0.1;
            schedule();
        }
    },

    setIntensity(level) {
        const clamped = Math.max(0, Math.min(2, level | 0));
        if (clamped === bgmIntensity) return;
        bgmIntensity = clamped;
        bgmTempo = BGM_TEMPO[bgmIntensity] || 100;
        applyBgmVolume();
    },

    getIntensity() { return bgmIntensity; },

    toggleMute() {
        bgmMuted = !bgmMuted;
        saveAudioSetting(BGM_MUTED_STORAGE, bgmMuted);
        updateBgmGain();
        applyBgmVolume();
        return bgmMuted;
    },

    getMuteState() { return bgmMuted; },

    setVolume(value) {
        const normalized = Number(value);
        if (!Number.isFinite(normalized)) return;
        bgmVolume = Math.max(0, Math.min(1, normalized));
        saveAudioSetting(BGM_VOLUME_STORAGE, bgmVolume);
        updateBgmGain();
        applyBgmVolume();
    },

    getVolume() { return bgmVolume; },
};
