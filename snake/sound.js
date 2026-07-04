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
        gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
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
        gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + duration);
    },

    playMove() {
        this.playOscillator(300, 0.08, 'sine', 0.12);
    },

    playEat() {
        this.ensureAudio();
        const now = this.audioCtx.currentTime;
        [400, 600].forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = now + i * 0.08;
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.12);
        });
    },

    playGameOver() {
        this.playSweep(440, 110, 0.6, 'sawtooth', 0.15);
    },

    playNewHighScore() {
        this.ensureAudio();
        const now = this.audioCtx.currentTime;
        [523, 659, 784, 1047].forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const t = now + i * 0.1;
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(t);
            osc.stop(t + 0.2);
        });
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
    },
};

const MusicPlayer = {
    isPlaying: false,
    schedulerTimer: null,
    currentStep: 0,
    nextNoteTime: 0,
    tempo: 100,
    lookahead: 25,
    scheduleAheadTime: 0.1,
    bgmMuted: false,
    bgmVolume: 0.1,
    stepsPerBeat: 4,
    totalSteps: 32,

    melodyPattern: [
        0, -1, 4, -1, 7, -1, 4, -1,
        0, -1, 5, -1, 9, -1, 5, -1,
        -2, -1, 2, -1, 7, -1, 2, -1,
        0, -1, 4, -1, 7, -1, 12, -1,
    ],

    bassPattern: [
        -12, -1, -1, -1, -8, -1, -1, -1,
        -10, -1, -1, -1, -5, -1, -1, -1,
        -14, -1, -1, -1, -8, -1, -1, -1,
        -12, -1, -1, -1, -7, -1, -1, -1,
    ],

    noteToFreq(semitones) {
        const baseFreq = 261.63;
        if (semitones <= -12) return 0;
        return baseFreq * Math.pow(2, semitones / 12);
    },

    scheduleNote(step, time) {
        const ctx = SoundManager.audioCtx;
        const master = SoundManager.masterGain;
        const beatDuration = 60 / this.tempo;
        const stepDuration = beatDuration / this.stepsPerBeat;

        const melodyIndex = step % this.melodyPattern.length;
        const melodySemitones = this.melodyPattern[melodyIndex];
        if (melodySemitones > -12) {
            const freq = this.noteToFreq(melodySemitones);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const vol = (this.bgmMuted ? 0 : this.bgmVolume) * 0.12;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 3);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + stepDuration * 3);
        }

        const bassIndex = step % this.bassPattern.length;
        const bassSemitones = this.bassPattern[bassIndex];
        if (bassSemitones > -12) {
            const freq = this.noteToFreq(bassSemitones);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const vol = (this.bgmMuted ? 0 : this.bgmVolume) * 0.35;
            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 4);
            osc.connect(gain);
            gain.connect(master);
            osc.start(time);
            osc.stop(time + stepDuration * 4);
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

    toggleMute() {
        this.bgmMuted = !this.bgmMuted;
    },

    getMuteState() {
        return this.bgmMuted;
    },
};
