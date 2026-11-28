// Persistence keys
const HOOKRUN_SFX_VOLUME = 'hookrun_audio_volume';
const HOOKRUN_SFX_MUTED = 'hookrun_sfx_muted';
const HOOKRUN_BGM_VOLUME = 'hookrun_bgm_volume';
const HOOKRUN_BGM_MUTED = 'hookrun_bgm_muted';

const BGM_CHANNEL_GAIN = 0.42;   // keeps the music under the effects

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
            this.bgmGain.gain.value = MusicPlayer.bgmMuted ? 0 : BGM_CHANNEL_GAIN;
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

    playJump() {
        this.playSweep(220, 520, 0.14, 'square', 0.07);
    },

    playPower() {
        this.playSweep(520, 1040, 0.18, 'square', 0.08);
        setTimeout(() => this.playOscillator(1320, 0.1, 'triangle', 0.08), 120);
    },

    playShield() {
        this.playSweep(900, 200, 0.3, 'triangle', 0.14);
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

/**
 * "Midnight Hunt": a 16-bar action-horror loop in D minor, all synthesized.
 * Four chords (Dm, B♭, Gm, A) repeat; each 4-bar section adds a layer:
 * 0 build-up · 1 theme · 2 arpeggio and answer · 3 full band with a drum fill.
 */
const MUSIC_STEPS_PER_BAR = 16;
const MUSIC_BARS_PER_SECTION = 4;
const MUSIC_SONG_STEPS = MUSIC_STEPS_PER_BAR * MUSIC_BARS_PER_SECTION * 4;
const MUSIC_REFERENCE_VOLUME = 0.12; // stored volume that plays the mix at unity

// MIDI notes per bar of the progression
const MUSIC_BASS_ROOTS = [50, 46, 43, 45];
const MUSIC_CHORDS = [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]];
// Eighth-note bass line, in semitones above the root
const MUSIC_BASS_LINE = [0, 0, 12, 0, 0, 0, 12, 7];
// Sixteenth-note arpeggio over [root, third, fifth, octave]
const MUSIC_ARPEGGIO = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 2, 1, 3];
// Melodies as [step, note, length in steps] for each bar
const MUSIC_THEME = [
    [[0, 74, 3], [3, 77, 3], [6, 76, 2], [8, 74, 4], [12, 69, 4]],
    [[0, 70, 3], [3, 74, 3], [6, 77, 2], [8, 76, 4], [12, 74, 4]],
    [[0, 79, 3], [3, 77, 3], [6, 74, 2], [8, 70, 4], [12, 74, 4]],
    [[0, 73, 6], [6, 76, 2], [8, 81, 4], [12, 73, 2], [14, 76, 2]],
];
const MUSIC_ANSWER = [
    [[0, 81, 6], [6, 79, 2], [8, 77, 2], [10, 76, 2], [12, 77, 4]],
    [[0, 82, 6], [6, 81, 2], [8, 79, 2], [10, 77, 2], [12, 74, 4]],
    [[0, 79, 4], [4, 82, 4], [8, 81, 4], [12, 79, 4]],
    [[0, 81, 4], [4, 76, 4], [8, 73, 4], [12, 69, 4]],
];

const MusicPlayer = {
    isPlaying: false,
    schedulerTimer: null,
    fadeTimer: null,
    currentStep: 0,
    nextNoteTime: 0,
    tempo: 132,
    lookahead: 25,
    scheduleAheadTime: 0.12,
    bgmMuted: false,
    bgmVolume: MUSIC_REFERENCE_VOLUME,
    bus: null,          // this playback's output; dropping it silences ringing notes
    echo: null,         // input of the lead's delay line
    noise: null,

    stepDuration() {
        return 60 / this.tempo / 4;
    },

    midiToFreq(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    },

    openBus() {
        const ctx = SoundManager.audioCtx;
        this.bus = ctx.createGain();
        this.bus.gain.value = this.bgmVolume / MUSIC_REFERENCE_VOLUME;
        this.bus.connect(SoundManager.bgmGain);

        // Dotted-eighth echo with a dark tail
        this.echo = ctx.createDelay(1);
        this.echo.delayTime.value = this.stepDuration() * 3;
        const damp = ctx.createBiquadFilter();
        damp.type = 'lowpass';
        damp.frequency.value = 2400;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.32;
        this.echo.connect(damp);
        damp.connect(feedback);
        feedback.connect(this.echo);
        damp.connect(this.bus);
    },

    closeBus() {
        const bus = this.bus;
        if (!bus) return;
        this.bus = null;
        this.echo = null;
        bus.gain.setTargetAtTime(0, SoundManager.audioCtx.currentTime, 0.015);
        setTimeout(() => bus.disconnect(), 120);
    },

    /** One enveloped oscillator note. */
    tone({ note, time, length, volume, type, attack = 0.005, cutoff = 0, detune = 0, echo = 0 }) {
        const ctx = SoundManager.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = this.midiToFreq(note);
        osc.detune.value = detune;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(volume, time + attack);
        gain.gain.setValueAtTime(volume, time + Math.max(attack, length * 0.5));
        gain.gain.exponentialRampToValueAtTime(0.0001, time + length);

        let source = osc;
        if (cutoff) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.Q.value = 4;
            filter.frequency.setValueAtTime(cutoff, time);
            filter.frequency.exponentialRampToValueAtTime(cutoff * 0.35, time + length);
            osc.connect(filter);
            source = filter;
        }
        source.connect(gain);
        gain.connect(this.bus);
        if (echo) {
            const send = ctx.createGain();
            send.gain.value = echo;
            gain.connect(send);
            send.connect(this.echo);
        }
        osc.start(time);
        osc.stop(time + length + 0.02);
    },

    /** Filtered noise burst for snare and hats. */
    noiseHit(time, length, volume, filterType, frequency) {
        const ctx = SoundManager.audioCtx;
        if (!this.noise || this.noise.sampleRate !== ctx.sampleRate) {
            this.noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
            const data = this.noise.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = frequency;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.bus);
        source.start(time);
        source.stop(time + length + 0.02);
    },

    /** Pitch-dropping sine: kick drum and toms. */
    drum(time, from, to, length, volume) {
        const ctx = SoundManager.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(from, time);
        osc.frequency.exponentialRampToValueAtTime(to, time + length * 0.8);
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
        osc.connect(gain);
        gain.connect(this.bus);
        osc.start(time);
        osc.stop(time + length + 0.02);
    },

    /** Church bell: inharmonic partials with long decays. */
    bell(time, note) {
        [[0, 0.07, 2.6], [12, 0.03, 1.8], [19.1, 0.02, 1.2], [28.7, 0.012, 0.7]].forEach(([interval, volume, length]) => {
            this.tone({ note: note + interval, time, length, volume, type: 'sine' });
        });
    },

    scheduleStep(step, time) {
        const beat = step % MUSIC_STEPS_PER_BAR;
        const barNumber = Math.floor(step / MUSIC_STEPS_PER_BAR);
        const bar = barNumber % MUSIC_BARS_PER_SECTION;
        const section = Math.floor(barNumber / MUSIC_BARS_PER_SECTION);
        const length = this.stepDuration();
        const chord = MUSIC_CHORDS[bar];
        const fill = section === 3 && bar === 3 && beat >= 10;

        if (beat === 0) {
            // Organ pad: two slightly detuned voices per chord note
            chord.forEach((note) => {
                [-6, 6].forEach((detune) => this.tone({
                    note, time, detune, type: 'triangle', attack: 0.25,
                    length: length * MUSIC_STEPS_PER_BAR, volume: 0.016,
                }));
            });
            if (bar === 0 && (section === 0 || section === 2)) this.bell(time, 62);
        }

        if (beat % 2 === 0) {
            this.tone({
                note: MUSIC_BASS_ROOTS[bar] + MUSIC_BASS_LINE[beat / 2], time,
                length: length * 1.8, volume: 0.085, type: 'sawtooth', cutoff: 900,
            });
        }

        // Drums
        const kick = section === 3 ? beat % 4 === 0 : (beat === 0 || beat === 8 || beat === 10);
        if (kick && !fill) this.drum(time, 150, 45, 0.16, 0.22);
        if (section > 0 && (beat === 4 || beat === 12) && !fill) {
            this.noiseHit(time, 0.14, 0.09, 'bandpass', 1900);
            this.drum(time, 220, 140, 0.08, 0.06);
        }
        if (section >= 2 || beat % 2 === 0) {
            this.noiseHit(time, 0.035, beat % 4 === 2 ? 0.035 : 0.018, 'highpass', 7500);
        }
        if (fill) this.drum(time, 260 - (beat - 10) * 28, 70, 0.14, 0.14);

        // Melody
        if (section > 0) {
            const phrase = section === 2 ? MUSIC_ANSWER : MUSIC_THEME;
            phrase[bar].filter(([at]) => at === beat).forEach(([, note, steps]) => {
                this.tone({
                    note, time, length: length * steps, volume: 0.034,
                    type: 'square', attack: 0.012, echo: 0.4,
                });
                // The last section doubles the theme an octave down
                if (section === 3) {
                    this.tone({ note: note - 12, time, length: length * steps, volume: 0.035, type: 'sawtooth', cutoff: 1800 });
                }
            });
        }

        if (section >= 2) {
            const tones = [...chord, chord[0] + 12];
            this.tone({
                note: tones[MUSIC_ARPEGGIO[beat]] + 12, time, length: length * 0.9,
                volume: 0.022, type: 'triangle', echo: 0.25,
            });
        }
    },

    scheduler() {
        const ctx = SoundManager.audioCtx;
        // After a stall (hidden tab) carry on from now instead of bursting the backlog.
        if (this.nextNoteTime < ctx.currentTime) this.nextNoteTime = ctx.currentTime + 0.05;
        while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextNoteTime);
            this.nextNoteTime += this.stepDuration();
            this.currentStep = (this.currentStep + 1) % MUSIC_SONG_STEPS;
        }
        this.schedulerTimer = setTimeout(() => this.scheduler(), this.lookahead);
    },

    getBgmMuteState() {
        return this.bgmMuted;
    },

    cancelFade() {
        clearTimeout(this.fadeTimer);
        this.fadeTimer = null;
    },

    /** Starts (or keeps) the playback from the current step. */
    begin() {
        SoundManager.ensureAudio();
        this.openBus();
        this.isPlaying = true;
        this.nextNoteTime = SoundManager.audioCtx.currentTime + 0.08;
        this.scheduler();
    },

    start() {
        // A new round during the game-over fade restarts the song from the top.
        if (this.isPlaying && !this.fadeTimer) return;
        this.stop();
        this.currentStep = 0;
        this.begin();
    },

    stop() {
        this.cancelFade();
        clearTimeout(this.schedulerTimer);
        this.schedulerTimer = null;
        this.closeBus();
        this.isPlaying = false;
    },

    /** Silences the music and keeps its place. */
    pause() {
        this.stop();
    },

    resume() {
        if (!this.isPlaying) this.begin();
    },

    fadeOut(duration) {
        if (!this.isPlaying) return;
        duration = duration || 0.8;
        this.cancelFade();
        const now = SoundManager.audioCtx.currentTime;
        this.bus.gain.setValueAtTime(this.bus.gain.value, now);
        this.bus.gain.linearRampToValueAtTime(0.0001, now + duration);
        this.fadeTimer = setTimeout(() => this.stop(), duration * 1000);
    },

    toggleMute() {
        this.bgmMuted = !this.bgmMuted;
        if (SoundManager.bgmGain) {
            SoundManager.bgmGain.gain.setValueAtTime(
                this.bgmMuted ? 0 : BGM_CHANNEL_GAIN, SoundManager.audioCtx.currentTime);
        }
        saveAudioSetting(HOOKRUN_BGM_MUTED, this.bgmMuted);
    },

    getMuteState() {
        return this.bgmMuted;
    }
};

MusicPlayer.bgmVolume = getStoredNumber(HOOKRUN_BGM_VOLUME, MusicPlayer.bgmVolume);
MusicPlayer.bgmMuted = getStoredBoolean(HOOKRUN_BGM_MUTED);
