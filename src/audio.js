/**
 * SENTINEL-Drone Procedural Web Audio Synthesizer Engine
 * Generates realistic military tactical audio effects: radar sweeps, lock alerts,
 * RF jammer hum, kinetic interceptor whooshes, laser pulses, and radio chatter.
 */
window.TacticalAudio = {
    ctx: null,
    isEnabled: true,
    radioChatterTimer: null,

    init: function() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        } catch (e) {
            console.warn('[Audio] Web Audio API initialization deferred until user interaction.');
        }
    },

    resumeContext: function() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleAudio: function() {
        this.isEnabled = !this.isEnabled;
        if (this.isEnabled) {
            this.resumeContext();
            this.play('click');
        }
        return this.isEnabled;
    },

    play: function(type) {
        if (!this.isEnabled) return;
        if (!this.ctx) this.init();
        if (!this.ctx) return;
        this.resumeContext();

        const now = this.ctx.currentTime;

        try {
            switch (type) {
                case 'radar_ping': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1400, now);
                    osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.12);
                    break;
                }
                case 'lock': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(1200, now);
                    osc.frequency.setValueAtTime(1800, now + 0.05);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.10);
                    break;
                }
                case 'alarm': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(880, now);
                    osc.frequency.linearRampToValueAtTime(440, now + 0.15);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.22);
                    break;
                }
                case 'jam': {
                    // RF Jammer electronic hum
                    const osc = this.ctx.createOscillator();
                    const osc2 = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'square';
                    osc2.type = 'sawtooth';
                    osc.frequency.setValueAtTime(2400, now);
                    osc2.frequency.setValueAtTime(120, now);
                    gain.gain.setValueAtTime(0.10, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                    osc.connect(gain);
                    osc2.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc2.start(now);
                    osc.stop(now + 0.45);
                    osc2.stop(now + 0.45);
                    break;
                }
                case 'laser': {
                    // Directed energy thermal burst
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(3200, now);
                    osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
                    gain.gain.setValueAtTime(0.14, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.25);
                    break;
                }
                case 'launch': {
                    // Kinetic interceptor rocket ignition
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
                    gain.gain.setValueAtTime(0.16, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.35);
                    break;
                }
                case 'explosion': {
                    // Airframe destruction
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(140, now);
                    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
                    gain.gain.setValueAtTime(0.24, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.5);
                    break;
                }
                case 'click': {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, now);
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.03);
                    break;
                }
            }
        } catch (e) {
            console.error('[Audio Playback Error]', e);
        }
    },

    // Synthetic Radio Squelch & Chatter for Cognitive Load Mode
    playRadioSquelch: function(messageText) {
        if (!this.isEnabled || !this.ctx) return;
        this.resumeContext();
        const now = this.ctx.currentTime;

        try {
            // White noise burst for squelch
            const bufferSize = this.ctx.sampleRate * 0.08;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1800;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);

            // Optional speech synthesis if supported
            if ('speechSynthesis' in window && messageText) {
                const utterance = new SpeechSynthesisUtterance(messageText);
                utterance.pitch = 0.9;
                utterance.rate = 1.1;
                utterance.volume = 0.6;
                window.speechSynthesis.speak(utterance);
            }
        } catch (e) {}
    }
};

window.addEventListener('click', () => {
    TacticalAudio.resumeContext();
}, { once: true });
