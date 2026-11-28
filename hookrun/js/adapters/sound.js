// Persistence keys
const HOOKRUN_SFX_VOLUME = 'hookrun_audio_volume';
const HOOKRUN_SFX_MUTED = 'hookrun_sfx_muted';
const HOOKRUN_BGM_VOLUME = 'hookrun_bgm_volume';
const HOOKRUN_BGM_MUTED = 'hookrun_bgm_muted';

const BGM_CHANNEL_GAIN = 0.7;

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

const SoundManager = {
    audioCtx: null,
    sfxGain: null,
    bgmGain: null,
    isMuted: false,
    volume: 0.7,

    ensureAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.sfxGain = this.audioCtx.createGain();
            this.sfxGain.gain.value = this.isMuted ? 0 : this.volume;
            this.sfxGain.connect(this.audioCtx.destination);
            // Music has its own channel: the effects mute and volume leave it alone.
            this.bgmGain = this.audioCtx.createGain();
            this.bgmGain.gain.value = BGM_CHANNEL_GAIN;
            this.bgmGain.connect(this.audioCtx.destination);
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    },

    playOscillator(freq, duration, type, volume) {
        this.ensureAudio();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + duration);
    },

    playSweep(startFreq, endFreq, duration, type, volume) {
        this.ensureAudio();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.audioCtx.currentTime + duration);
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + duration);
    },

    playShoot() {
        this.playSweep(640, 140, 0.12, 'square', 0.1);
    },

    playHook() {
        this.playSweep(240, 620, 0.16, 'sawtooth', 0.07);
        setTimeout(() => this.playOscillator(980, 0.05, 'square', 0.05), 160);
    },

    playKill() {
        this.playSweep(480, 90, 0.2, 'sawtooth', 0.13);
    },

    playLand() {
        this.playOscillator(130, 0.11, 'sine', 0.1);
    },

    playGameOver() {
        this.playSweep(440, 60, 0.85, 'sawtooth', 0.15);
    },

    playCountdownTick() {
        this.playOscillator(440, 0.07, 'square', 0.06);
    },

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.sfxGain) {
            this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
        }
        saveAudioSetting(HOOKRUN_SFX_VOLUME, this.volume);
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.sfxGain) {
            this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
        }
        saveAudioSetting(HOOKRUN_SFX_MUTED, this.isMuted);
    },

    getVolume() {
        return this.volume;
    },

    getMuteState() {
        return this.isMuted;
    },

    startBgm() {
        MusicPlayer.start();
    },

    pauseBgm() {
        MusicPlayer.pause();
    },

    resumeBgm() {
        MusicPlayer.resume();
    },

    fadeOutBgm() {
        MusicPlayer.fadeOut();
    }
};

SoundManager.volume = getStoredNumber(HOOKRUN_SFX_VOLUME, SoundManager.volume);
SoundManager.isMuted = getStoredBoolean(HOOKRUN_SFX_MUTED);

const MusicPlayer = {
    isPlaying: false,
    schedulerTimer: null,
    fadeTimer: null,
    currentStep: 0,
    nextNoteTime: 0,
    tempo: 96,
    lookahead: 25,
    scheduleAheadTime: 0.1,
    bgmMuted: false,
    bgmVolume: 0.12,
    stepsPerBeat: 4,
    totalSteps: 64,

    melodyPattern: [
        0, 0, 7, 0, 10, 7, 0, -1,
        0, 0, 5, 0, 7, 5, 0, -1,
        0, 0, 7, 0, 10, 7, 5, -1,
        0, 0, 5, 0, 0, 0, 0, -1,
    ],

    bassPattern: [
        0, 0, 0, 0, 0, 0, 5, 0,
        0, 0, 0, 0, 3, 3, 0, 0,
        0, 0, 0, 0, 0, 0, 5, 0,
        0, 0, 0, 0, 3, 3, 0, 0,
    ],

    kickPattern: [
        1, 0, 0, 0, 1, 0, 0, 0,
        0, 0, 0, 0, 1, 0, 0, 0,
        1, 0, 0, 0, 1, 0, 0, 0,
        0, 0, 0, 0, 1, 0, 0, 0,
    ],

    snarePattern: [
        0, 0, 0, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 0, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
    ],

    noteToFreq(semitones) {
        const baseFreq = 146.83; // D3
        if (semitones <= 0) return 0;
        return baseFreq * Math.pow(2, semitones / 12);
    },

    scheduleNote(step, time) {
        const ctx = SoundManager.audioCtx;
        const master = SoundManager.bgmGain;
        const beatDuration = 60 / this.tempo;
        const stepDuration = beatDuration / this.stepsPerBeat;

        const melodyIndex = step % this.melodyPattern.length;
        const melodySemitones = this.melodyPattern[melodyIndex];
        if (melodySemitones > 0) {
            const freq = this.noteToFreq(melodySemitones);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const vol = (this.bgmMuted ? 0 : this.bgmVolume) * 0.12;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 1.8);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + stepDuration * 1.8);
        }

        const bassIndex = step % this.bassPattern.length;
        const bassSemitones = this.bassPattern[bassIndex];
        if (bassSemitones > 0) {
            const freq = this.noteToFreq(bassSemitones);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const vol = (this.bgmMuted ? 0 : this.bgmVolume) * 0.32;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 3.2);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + stepDuration * 3.2);
        }

        if (this.kickPattern[step % this.kickPattern.length]) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(110, time);
            osc.frequency.exponentialRampToValueAtTime(28, time + 0.16);
            const vol = (this.bgmMuted ? 0 : this.bgmVolume) * 0.22;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + 0.16);
        }

        if (this.snarePattern[step % this.snarePattern.length]) {
            const bufferSize = Math.floor(ctx.sampleRate * 0.09);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2200;
            const gain = ctx.createGain();
            const vol = (this.bgmMuted ? 0 : this.bgmVolume) * 0.1;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(master);
            noise.start(time);
        }
    },

    scheduler() {
        const ctx = SoundManager.audioCtx;
        while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentStep, this.nextNoteTime);
            const beatDuration = 60 / this.tempo;
            this.nextNoteTime += (beatDuration / this.stepsPerBeat);
            this.currentStep = (this.currentStep + 1) % this.totalSteps;
        }
        this.schedulerTimer = setTimeout(this.scheduler.bind(this), this.lookahead);
    },

    getBgmMuteState() {
        return this.bgmMuted;
    },

    cancelFade() {
        clearTimeout(this.fadeTimer);
        this.fadeTimer = null;
    },

    start() {
        // A new round must not be silenced by the previous game over.
        this.cancelFade();
        SoundManager.ensureAudio();
        const ctx = SoundManager.audioCtx;
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                if (this.isPlaying) return;
                this.isPlaying = true;
                this.currentStep = 0;
                this.nextNoteTime = ctx.currentTime + 0.1;
                this.scheduler();
            });
            return;
        }
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = ctx.currentTime + 0.1;
        this.scheduler();
    },

    stop() {
        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        this.isPlaying = false;
    },

    pause() {
        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
        this.isPlaying = false;
    },

    resume() {
        if (!this.isPlaying) {
            const ctx = SoundManager.audioCtx;
            if (ctx.state === 'suspended') {
                ctx.resume().then(() => {
                    this.isPlaying = true;
                    this.nextNoteTime = ctx.currentTime + 0.1;
                    this.scheduler();
                });
                return;
            }
            this.isPlaying = true;
            this.nextNoteTime = ctx.currentTime + 0.1;
            this.scheduler();
        }
    },

    fadeOut(duration) {
        if (!this.isPlaying) return;
        duration = duration || 0.8;
        this.cancelFade();
        this.fadeTimer = setTimeout(() => this.stop(), duration * 1000);
    },

    toggleMute() {
        this.bgmMuted = !this.bgmMuted;
        saveAudioSetting(HOOKRUN_BGM_MUTED, this.bgmMuted);
    },

    getMuteState() {
        return this.bgmMuted;
    }
};

MusicPlayer.bgmVolume = getStoredNumber(HOOKRUN_BGM_VOLUME, MusicPlayer.bgmVolume);
MusicPlayer.bgmMuted = getStoredBoolean(HOOKRUN_BGM_MUTED);
