/**
 * SoundManager and MusicPlayer for Asteroids
 * All audio synthesized via Web Audio API (no files needed)
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
let ufoLayerGain = null;
let ufoLayerActive = false;

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
        ufoLayerGain = audioCtx.createGain();
        sfxGain.connect(audioCtx.destination);
        bgmGain.connect(audioCtx.destination);
        ufoLayerGain.connect(audioCtx.destination);
        updateSfxGain();
        updateBgmGain();
        if (ufoLayerGain) ufoLayerGain.gain.setValueAtTime(0, audioCtx.currentTime);
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
    const vol = volume;

    const start = audioCtx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(vol, start);
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
    const vol = volume;

    gain.gain.setValueAtTime(vol, start);
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
    const vol = volume;

    const start = audioCtx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    noise.connect(gain);
    gain.connect(sfxGain);
    noise.start(start);
}

// ── Asteroids-Specific Sounds ──
const SoundManager = {
    playThrust() {
        playSweep(100, 40, 0.1, 'sawtooth', 0.12);
    },

    playShoot() {
        playSweep(880, 440, 0.08, 'square', 0.1);
    },

    playExplosion() {
        playNoise(0.2, 0.25);
        playSweep(150, 80, 0.15, 'sawtooth', 0.15, 0.05);
        playSweep(100, 60, 0.1, 'sawtooth', 0.1, 0.1);
    },

    playPlayerHit() {
        playNoise(0.3, 0.3);
        playSweep(200, 100, 0.4, 'sawtooth', 0.15, 0.05);
        playSweep(150, 50, 0.3, 'sawtooth', 0.1, 0.15);
    },

    playUFO() {
        playSweep(300, 600, 0.4, 'sine', 0.08, 0);
        playSweep(600, 300, 0.4, 'sine', 0.08, 0.4);
        playSweep(400, 800, 0.4, 'sine', 0.08, 0.8);
    },

    playUfoShoot() {
        playSweep(500, 200, 0.12, 'square', 0.08);
    },

    playUfoExplode() {
        playNoise(0.35, 0.3);
        playSweep(180, 60, 0.3, 'sawtooth', 0.18, 0.05);
    },

    playGameOver() {
        playSweep(440, 100, 0.5, 'sawtooth', 0.2);
        playSweep(300, 80, 0.4, 'sawtooth', 0.15, 0.3);
        playSweep(200, 50, 0.5, 'sawtooth', 0.1, 0.7);
    },

    playNewHighScore() {
        playTone(523, 'triangle', 0.15, 0.15, 0);
        playTone(659, 'triangle', 0.15, 0.15, 0.12);
        playTone(784, 'triangle', 0.15, 0.15, 0.24);
        playTone(1047, 'triangle', 0.3, 0.18, 0.36);
    },

    playLevelUp() {
        playTone(523, 'sine', 0.15, 0.1, 0);
        playTone(659, 'sine', 0.15, 0.1, 0.12);
        playTone(784, 'sine', 0.15, 0.1, 0.24);
        playTone(1047, 'sine', 0.3, 0.12, 0.36);
    },

    playPowerupSpawn() {
        playSweep(400, 800, 0.12, 'sine', 0.08);
    },

    playPowerupPickup() {
        playTone(523, 'triangle', 0.1, 0.12, 0);
        playTone(784, 'triangle', 0.1, 0.12, 0.08);
        playTone(1047, 'triangle', 0.18, 0.14, 0.16);
    },

    playHyperspace() {
        playSweep(220, 1200, 0.25, 'sawtooth', 0.12);
    },

    playHyperspaceFail() {
        playSweep(800, 200, 0.18, 'square', 0.08);
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
    getVolume() { return sfxVolume; }
};

// ── Music Player (procedural BGM with intensity) ──
let bgmTimer = null;
let bgmStep = 0;
let bgmNextNoteTime = 0;
let bgmTempo = 110;
let bgmIntensity = 0;
let ufoLayerOsc = null;
let ufoLayerStep = 0;

const lookahead = 25;
const stepsPerBeat = 4;

const melodyNotes = [261, 330, 0, 392, 0, 330, 0, 523,
                    0, 392, 0, 330, 0, 523, 0, 261];
const bassNotes = [0, 0, 0, 261,
                   0, 0, 0, 261,
                   0, 0, 261, 261,
                   0, 0, 0, 261];
const kickPattern = [1, 0, 0, 0,
                    1, 0, 0, 0,
                    1, 0, 0, 0,
                    1, 0, 0, 0];
const snarePattern = [0, 0, 1, 0,
                      0, 0, 1, 0,
                      0, 0, 1, 0,
                      0, 0, 1, 0];

function scheduleNote(step, time) {
    const beatDuration = 60 / bgmTempo;
    const stepDuration = beatDuration / stepsPerBeat;
    const intensityVol = BGM_VOLUME[bgmIntensity] || 0.10;

    const melodyNote = melodyNotes[step % melodyNotes.length];
    if (melodyNote > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = bgmIntensity >= 2 ? 'square' : 'sawtooth';
        osc.frequency.value = melodyNote * (bgmIntensity >= 1 ? 1.005 : 1.0);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.05, time + 0.01);
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
        gain.gain.linearRampToValueAtTime(0.12, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 2);
        osc.connect(gain);
        gain.connect(bgmGain);
        osc.start(time);
        osc.stop(time + stepDuration * 2);
    }

    // Kick / snare density scales with intensity
    const kickGain = (kickPattern[step % kickPattern.length]) * (bgmIntensity >= 1 ? 1 : 0.7);
    if (kickGain > 0) {
        const bufferSize = audioCtx.sampleRate * 0.1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15 * kickGain, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(bgmGain);
        noise.start(time);
    }

    const snareHit = (snarePattern[step % snarePattern.length]) * (bgmIntensity >= 1 ? 1 : 0.6);
    if (snareHit > 0) {
        const bufferSize = audioCtx.sampleRate * 0.1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.08 * snareHit, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(bgmGain);
        noise.start(time);
    }

    // UFO siren layer (only when active)
    if (ufoLayerActive && ufoLayerGain) {
        const sirenFreq = 200 + Math.sin(time * 6) * 200;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = sirenFreq;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.06, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 0.9);
        osc.connect(gain);
        gain.connect(ufoLayerGain);
        osc.start(time);
        osc.stop(time + stepDuration);
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
    const target = BGM_VOLUME[bgmIntensity] || 0.10;
    const now = audioCtx.currentTime;
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
    bgmGain.gain.linearRampToValueAtTime(bgmMuted ? 0 : target, now + 0.5);
}

function applyUfoLayerVolume() {
    if (!ufoLayerGain) return;
    const now = audioCtx.currentTime;
    ufoLayerGain.gain.cancelScheduledValues(now);
    ufoLayerGain.gain.setValueAtTime(ufoLayerGain.gain.value, now);
    const target = ufoLayerActive ? 1.0 : 0.0;
    ufoLayerGain.gain.linearRampToValueAtTime(bgmMuted ? 0 : target, now + 0.4);
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
        if (ufoLayerGain) {
            const now = audioCtx.currentTime;
            ufoLayerGain.gain.cancelScheduledValues(now);
            ufoLayerGain.gain.setValueAtTime(ufoLayerGain.gain.value, now);
            ufoLayerGain.gain.linearRampToValueAtTime(0, now + 0.3);
        }
        ufoLayerActive = false;
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
        bgmTempo = BGM_TEMPO[bgmIntensity] || 110;
        applyBgmVolume();
    },

    getIntensity() { return bgmIntensity; },

    setUfoActive(active) {
        const next = !!active;
        if (next === ufoLayerActive) return;
        ufoLayerActive = next;
        applyUfoLayerVolume();
    },

    isUfoActive() { return ufoLayerActive; },

    toggleMute() {
        bgmMuted = !bgmMuted;
        saveAudioSetting(BGM_MUTED_STORAGE, bgmMuted);
        updateBgmGain();
        applyBgmVolume();
        applyUfoLayerVolume();
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
        applyUfoLayerVolume();
    },

    getVolume() { return bgmVolume; },
};
