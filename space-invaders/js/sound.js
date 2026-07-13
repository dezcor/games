const SoundManager = {
    audioCtx: null,
    masterGain: null,
    isMuted: false,
    volume: 0.7,

    ensureAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioCtx.destination);
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
        gain.connect(this.masterGain);
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
        gain.connect(this.masterGain);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + duration);
    },

    playNoise(duration, volume) {
        this.ensureAudio();
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start(this.audioCtx.currentTime);
    },

    playShoot() {
        this.playSweep(880, 440, 0.08, 'square', 0.1);
    },

    playExplosion() {
        this.playNoise(0.15, 0.15);
    },

    playAlienMove() {
        this.playOscillator(220, 0.06, 'sine', 0.08);
    },

    playGameOver() {
        this.playSweep(440, 55, 0.8, 'sawtooth', 0.15);
    },

    playNewHighScore() {
        this.playOscillator(523, 0.15, 'triangle', 0.15);
        setTimeout(() => this.playOscillator(659, 0.15, 'triangle', 0.15), 120);
        setTimeout(() => this.playOscillator(784, 0.15, 'triangle', 0.15), 240);
        setTimeout(() => this.playOscillator(1047, 0.3, 'triangle', 0.18), 360);
    },

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
        }
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
        }
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
    }
};

const MusicPlayer = {
    isPlaying: false,
    schedulerTimer: null,
    currentStep: 0,
    nextNoteTime: 0,
    tempo: 110,
    lookahead: 25,
    scheduleAheadTime: 0.1,
    bgmMuted: false,
    bgmVolume: 0.1,
    stepsPerBeat: 4,
    totalSteps: 64,

    melodyPattern: [
        0, -5, 0, 7, 0, -5, 0, 2,
        0, -5, 0, 7, 0, -5, 0, -1,
        0, 2, 0, 7, 0, -5, 0, 2,
        0, -5, 7, 0, -5, 0, 2, -5,
    ],

    bassPattern: [
        0, 0, 0, 0, -5, -5, -5, -5,
        0, 0, 0, 0, -5, -5, -5, -5,
        2, 2, 2, 2, 0, 0, 0, 0,
        2, 2, 2, 2, 0, 0, -5, 0,
    ],

    kickPattern: [
        1, 0, 0, 0, 1, 0, 0, 0,
        1, 0, 0, 0, 1, 0, 0, 0,
        1, 0, 0, 0, 1, 0, 0, 0,
        1, 0, 0, 0, 1, 0, 0, 0,
    ],

    snarePattern: [
        0, 0, 1, 0, 0, 0, 1, 0,
        0, 0, 1, 0, 0, 0, 1, 0,
        0, 0, 1, 0, 0, 0, 1, 0,
        0, 0, 1, 0, 0, 0, 1, 0,
    ],

    noteToFreq(semitones) {
        const baseFreq = 261.63;
        if (semitones <= 0) return 0;
        return baseFreq * Math.pow(2, semitones / 12);
    },

    scheduleNote(step, time) {
        const ctx = SoundManager.audioCtx;
        const master = SoundManager.masterGain;
        const beatDuration = 60 / this.tempo;
        const stepDuration = beatDuration / this.stepsPerBeat;

        const melodyIndex = step % this.melodyPattern.length;
        const melodySemitones = this.melodyPattern[melodyIndex];
        if (melodySemitones > 0) {
            const freq = this.noteToFreq(melodySemitones);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            const vol = (this.bgmMuted ? 0 : this.bgmVolume) * 0.08;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 1.5);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + stepDuration * 1.5);
        }

        const bassIndex = step % this.bassPattern.length;
        const bassSemitones = this.bassPattern[bassIndex];
        if (bassSemitones > 0) {
            const freq = this.noteToFreq(bassSemitones);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const vol = (this.bgmMuted ? 0 : this.bgmVolume) * 0.25;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 3);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + stepDuration * 3);
        }

        if (this.kickPattern[step % this.kickPattern.length]) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
            const vol = (this.bgmMuted ? 0 : this.bgmVolume) * 0.2;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + 0.1);
        }

        if (this.snarePattern[step % this.snarePattern.length]) {
            const bufferSize = ctx.sampleRate * 0.1;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 3000;
            const gain = ctx.createGain();
            const vol = (this.bgmMuted ? 0 : this.bgmVolume) * 0.08;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
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

    start() {
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
        const steps = 10;
        const stepTime = (duration * 1000) / steps;
        for (let i = 1; i <= steps; i++) {
            setTimeout(() => {
                this.isPlaying = false;
            }, stepTime * i);
        }
        setTimeout(() => this.stop(), duration * 1000);
    },

    toggleMute() {
        this.bgmMuted = !this.bgmMuted;
    },

    setVolume(value) {
        this.bgmVolume = Math.max(0, Math.min(1, value));
        SoundManager.setVolume(SoundManager.getVolume());
    },

    getMuteState() {
        return this.bgmMuted;
    }
};
