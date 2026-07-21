/**
 * SoundManager and MusicPlayer for Asteroids
 * All audio synthesized via Web Audio API (no files needed)
 */

let audioCtx = null;
let masterGain = null;
let sfxVolume = 0.7;
let bgmVolume = 0.1;
let sfxMuted = false;
let bgmMuted = false;
let musicScheduler = null;
let bgmRunning = false;

// ── Initialize ──
function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = sfxVolume;
        masterGain.connect(audioCtx.destination);
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
    const vol = volume * sfxVolume;

    const start = audioCtx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + duration);
}

function playSweep(startFreq, endFreq, duration, type, volume, delay) {
    ensureAudio();
    if (sfxMuted) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, delay || 0);
    osc.frequency.exponentialRampToValueAtTime(endFreq, (delay || 0) + duration);
    const vol = volume * sfxVolume;

    const start = audioCtx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(masterGain);
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
    const vol = volume * sfxVolume;

    const start = audioCtx.currentTime + (delay || 0);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    noise.connect(gain);
    gain.connect(masterGain);
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

    // ── API ──
    setVolume(value) {
        sfxVolume = Math.max(0, Math.min(1, value));
        if (masterGain) {
            masterGain.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
        }
    },

    toggleMute() {
        sfxMuted = !sfxMuted;
        return sfxMuted;
    },

    getMuteState() { return sfxMuted; },
    getVolume() { return sfxVolume; }
};

// ── Music Player (procedural BGM) ──
let bgmTimer = null;
let bgmStep = 0;
let bgmNextNoteTime = 0;
const tempo = 110;
const lookahead = 25;
const stepsPerBeat = 4;

// Notes: C4 (262), E4 (330), G4 (392), C5 (523)
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
    const beatDuration = 60 / tempo;
    const stepDuration = beatDuration / stepsPerBeat;

    const melodyNote = melodyNotes[step % melodyNotes.length];
    if (melodyNote > 0) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = melodyNote;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.05 * bgmVolume, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration);
        osc.connect(gain);
        gain.connect(masterGain);
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
        gain.gain.linearRampToValueAtTime(0.12 * bgmVolume, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + stepDuration * 2);
    }

    if (kickPattern[step % kickPattern.length]) {
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
        gain.gain.linearRampToValueAtTime(0.15 * bgmVolume, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(time);
    }

    if (snarePattern[step % snarePattern.length]) {
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
        gain.gain.linearRampToValueAtTime(0.08 * bgmVolume, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(time);
    }
}

function schedule() {
    while (bgmNextNoteTime < audioCtx.currentTime + lookahead) {
        scheduleNote(bgmStep, bgmNextNoteTime);
        bgmStep++;
        bgmNextNoteTime += (60 / tempo) / stepsPerBeat;
    }
    bgmTimer = setTimeout(schedule, lookahead);
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

    toggleMute() {
        bgmMuted = !bgmMuted;
        return bgmMuted;
    },

    getMuteState() { return bgmMuted; },

    setVolume(value) {
        bgmVolume = Math.max(0, Math.min(1, value));
    },
};

// ── Initialize volume on page load ──
const savedVol = localStorage.getItem(AUDIO_VOLUME_STORAGE);
if (savedVol !== null) {
    sfxVolume = parseFloat(savedVol);
    if (masterGain) masterGain.gain.setValueAtTime(sfxVolume, audioCtx.currentTime);
}

const savedBgmVol = localStorage.getItem(BGM_VOLUME_STORAGE);
if (savedBgmVol !== null) {
    bgmVolume = parseFloat(savedBgmVol);
}
