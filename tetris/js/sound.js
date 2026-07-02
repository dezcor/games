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

    playMove() {
        this.playOscillator(220, 0.12, 'sine', 0.15);
    },

    playRotate() {
        this.playOscillator(330, 0.1, 'sine', 0.15);
    },

    playLineClear(lines) {
        if (lines === 4) {
            this.playSweep(220, 1320, 0.5, 'sine', 0.25);
        } else {
            this.playSweep(220, 880, 0.3, 'sine', 0.2);
        }
    },

    playHardDrop() {
        this.playNoise(0.1, 0.2);
    },

    playGameOver() {
        this.playSweep(660, 110, 0.8, 'sawtooth', 0.15);
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
    }
};
