/**
 * SENTINEL-Drone Multi-Channel Sensor Fusion & Optical/FLIR PIP Engine
 * Manages:
 * 1. Optical / Thermal FLIR PIP Camera (White-Hot, Black-Hot, Ironbow, NVG Green, Daylight)
 *    - Renders on both Tab 1 (Floating Radar PIP) and Tab 2 (Dedicated Sensor Suite)
 * 2. Real-Time RF Spectrum Waterfall & FFT Oscilloscope (433MHz, 915MHz, 2.4GHz, 5.8GHz)
 * 3. Acoustic Propeller Harmonics (32-band FFT, dynamic dB SPL, interactive motor sound synthesis)
 * 4. Two-Way Perimeter Patrol Radio Console (Interactive transmitter, quick callouts, speech audio)
 * 5. Bayesian Multi-Sensor Fusion Confidence Aggregator
 */
window.SensorFusion = {
    pipCanvas: null,
    pipCtx: null,
    radarPipCanvas: null,
    radarPipCtx: null,
    rfCanvas: null,
    rfCtx: null,
    acousticCanvas: null,
    acousticCtx: null,

    flirMode: 'white_hot', // 'white_hot', 'black_hot', 'ironbow', 'nvg', 'daylight'
    zoomLevel: 1.0,
    lockedTarget: null,
    radioChatterLog: [],
    rfScanTime: 0,
    rotorAngle: 0,
    isAcousticAudioPlaying: false,
    acousticOsc1: null,
    acousticOsc2: null,
    acousticGain: null,

    // Waterfall rolling buffer (canvas offscreen buffer)
    waterfallCanvas: null,
    waterfallCtx: null,

    init: function() {
        this.pipCanvas = document.getElementById('pipCanvas');
        if (this.pipCanvas) this.pipCtx = this.pipCanvas.getContext('2d');

        this.radarPipCanvas = document.getElementById('radarPipCanvas');
        if (this.radarPipCanvas) this.radarPipCtx = this.radarPipCanvas.getContext('2d');

        this.rfCanvas = document.getElementById('rfSpectrumCanvas');
        if (this.rfCanvas) this.rfCtx = this.rfCanvas.getContext('2d');

        this.acousticCanvas = document.getElementById('acousticCanvas');
        if (this.acousticCanvas) this.acousticCtx = this.acousticCanvas.getContext('2d');

        // Initialize offscreen waterfall buffer
        this.initWaterfallBuffer();

        // Seed initial radio messages and render immediately
        this.seedInitialRadioChatter();
        this.renderRadioChatter();
    },

    initWaterfallBuffer: function() {
        this.waterfallCanvas = document.createElement('canvas');
        this.waterfallCanvas.width = 480;
        this.waterfallCanvas.height = 60;
        this.waterfallCtx = this.waterfallCanvas.getContext('2d');
        this.waterfallCtx.fillStyle = '#060f18';
        this.waterfallCtx.fillRect(0, 0, 480, 60);
    },

    setFlirMode: function(mode) {
        this.flirMode = mode;
        const modeLabel = document.getElementById('radarPipModeLabel');
        if (modeLabel) modeLabel.textContent = mode.replace('_', ' ').toUpperCase();

        const tab2ModeLabel = document.getElementById('flirActiveModeText');
        if (tab2ModeLabel) tab2ModeLabel.textContent = mode.replace('_', ' ').toUpperCase();

        if (window.SimulationApp) {
            window.SimulationApp.showToast(`FLIR Camera Mode: ${mode.replace('_', ' ').toUpperCase()}`, 'info');
        }
    },

    setZoom: function(zoom) {
        this.zoomLevel = Math.max(1.0, Math.min(8.0, zoom));
        if (window.SimulationApp) {
            window.SimulationApp.showToast(`Digital Optical Zoom: ${this.zoomLevel}X`, 'info');
        }
    },

    setLockedTarget: function(target) {
        this.lockedTarget = target;
        this.renderTargetSelector();
    },

    // ------------------------------------------------------------------------
    // TAB 2 TARGET SELECTOR PILLS
    // ------------------------------------------------------------------------
    renderTargetSelector: function() {
        const container = document.getElementById('tab2TargetSelector');
        if (!container || !window.SimulationApp || !window.SimulationApp.activeTargets) return;

        const targets = window.SimulationApp.activeTargets;
        container.innerHTML = targets.map(t => {
            const isSelected = this.lockedTarget && this.lockedTarget.id === t.id;
            const dist = Math.round(Math.hypot(t.pos.x, t.pos.y));
            const isDestroyed = t.status === 'destroyed';

            return `
                <button class="px-2.5 py-1 rounded font-mono text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                    isSelected ? 'bg-primary text-on-primary border-primary shadow-[0_0_8px_rgba(78,222,163,0.4)]' :
                    (isDestroyed ? 'bg-surface-container text-on-surface-variant border-surface-container-highest line-through opacity-50' :
                    'bg-surface-container text-on-surface border-surface-container-highest hover:border-tertiary/60')
                }" onclick="SimulationApp.selectTarget('${t.id}')">
                    <span class="w-1.5 h-1.5 rounded-full ${t.isDecoy ? 'bg-secondary' : (t.type === 'bird_flock' ? 'bg-primary' : 'bg-error')}"></span>
                    <span>${t.id}</span>
                    <span class="text-[9px] opacity-75">${dist}m</span>
                </button>
            `;
        }).join('');
    },

    // ------------------------------------------------------------------------
    // TWO-WAY PATROL RADIO SYSTEM
    // ------------------------------------------------------------------------
    seedInitialRadioChatter: function() {
        this.radioChatterLog = [
            { time: 'T-00:25', sender: 'C2 COMMAND', text: 'Air defense perimeter active. DEFCON ALPHA declared. All outer sentries stand by.', isOutgoing: false },
            { time: 'T-00:18', sender: 'OP BRAVO (WEST)', text: 'Acoustic array detects high-RPM motor hum bearing 285°.', isOutgoing: false },
            { time: 'T-00:06', sender: 'RADAR ARRAY', text: 'Primary pulse array tracking airborne contacts penetrating 2000m surveillance envelope.', isOutgoing: false }
        ];
    },

    renderRadioChatter: function() {
        const feedElem = document.getElementById('radioChatterFeed');
        if (!feedElem) return;

        feedElem.innerHTML = this.radioChatterLog.map(m => `
            <div class="text-[10px] font-mono border-b border-surface-container-high py-1 flex items-start gap-1.5 ${m.isOutgoing ? 'bg-primary/5 pl-1 rounded' : ''}">
                <span class="text-tertiary font-bold shrink-0">[${m.time}]</span>
                <span class="font-bold shrink-0 ${m.isOutgoing ? 'text-primary' : 'text-secondary'}">${m.sender}:</span>
                <span class="text-on-surface-variant leading-tight">${m.text}</span>
            </div>
        `).join('');

        // Auto-scroll to top
        feedElem.scrollTop = 0;
    },

    addRadioChatter: function(sender, text, isOutgoing = false) {
        const timeStr = `T+${Math.floor(window.SimulationApp ? window.SimulationApp.simTimeSeconds : 0)}s`;
        this.radioChatterLog.unshift({ time: timeStr, sender: sender, text: text, isOutgoing: isOutgoing });
        if (this.radioChatterLog.length > 12) this.radioChatterLog.pop();

        this.renderRadioChatter();

        // Trigger tactical squelch audio & text-to-speech
        if (window.TacticalAudio) {
            window.TacticalAudio.playRadioSquelch(text);
        }
    },

    // Trainee sends custom message or quick action callout
    sendRadioTransmission: function(customMsg) {
        const inputElem = document.getElementById('radioTransmitInput');
        const msg = customMsg || (inputElem ? inputElem.value.trim() : '');
        if (!msg) return;

        if (inputElem) inputElem.value = '';

        // 1. Log outgoing transmission from Trainee
        this.addRadioChatter('SENTINEL-1 (YOU)', msg, true);

        // 2. Automated field sentry response logic
        setTimeout(() => {
            const lower = msg.toLowerCase();
            if (lower.includes('hostile') || lower.includes('red alert') || lower.includes('engage')) {
                this.addRadioChatter('OP ALPHA (TOWER)', 'Copy Sentinel-1! Target classified hostile. Spotlight engaged, small-arms sentries on high alert!');
            } else if (lower.includes('iff') || lower.includes('identify') || lower.includes('squawk')) {
                this.addRadioChatter('TOC RADAR', 'Interrogation signal pulsed on 1030 MHz... SQUAWK NEGATIVE! No civilian transponder response. Unidentified intruder!');
            } else if (lower.includes('evac') || lower.includes('siren') || lower.includes('shelter')) {
                this.addRadioChatter('SECURITY CHIEF', 'All-hands alert! Sounding siren at Ammo Bunker S7 and Helipad. Personnel taking shelter!');
                if (window.TacticalAudio) window.TacticalAudio.play('alarm');
            } else if (lower.includes('searchlight') || lower.includes('light')) {
                this.addRadioChatter('TOWER 3', '5-million candlepower xenon arc lamp slewed onto target vector. Target illuminated in visual spectrum!');
            } else {
                this.addRadioChatter('OP BRAVO', `Copy transmission: "${msg}". Perimeter guard force acknowledging.`);
            }
        }, 1100);
    },

    // ------------------------------------------------------------------------
    // 1. RENDER OPTICAL / FLIR PIP CAMERA (DUAL CANVAS SYNC)
    // ------------------------------------------------------------------------
    renderPIP: function(target, deltaTime) {
        this.rotorAngle += deltaTime * 25; // Rotor spinning animation

        // Render to Tab 2 Dedicated FLIR Canvas
        if (this.pipCanvas && this.pipCtx) {
            this.drawFlirFrame(this.pipCtx, this.pipCanvas.width, this.pipCanvas.height, target, false);
        }

        // Render to Tab 1 Floating Radar PIP Canvas
        if (this.radarPipCanvas && this.radarPipCtx) {
            this.drawFlirFrame(this.radarPipCtx, this.radarPipCanvas.width, this.radarPipCanvas.height, target, true);
        }
    },

    drawFlirFrame: function(ctx, w, h, target, isMini) {
        ctx.clearRect(0, 0, w, h);

        // Background based on FLIR Palette Mode
        if (this.flirMode === 'white_hot') {
            ctx.fillStyle = '#0a101d';
        } else if (this.flirMode === 'black_hot') {
            ctx.fillStyle = '#dae3f1';
        } else if (this.flirMode === 'ironbow') {
            // Ironbow deep indigo
            ctx.fillStyle = '#1e1135';
        } else if (this.flirMode === 'nvg') {
            ctx.fillStyle = '#021807';
        } else {
            // Daylight Color
            ctx.fillStyle = '#1e293b';
        }
        ctx.fillRect(0, 0, w, h);

        // Thermal Noise Texture
        const noiseCount = isMini ? 15 : 35;
        ctx.fillStyle = this.flirMode === 'black_hot' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
        for (let i = 0; i < noiseCount; i++) {
            ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }

        // NVG Scanlines if active
        if (this.flirMode === 'nvg') {
            ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
            for (let y = 0; y < h; y += 4) {
                ctx.fillRect(0, y, w, 1.5);
            }
        }

        // Crosshairs
        ctx.strokeStyle = this.flirMode === 'nvg' ? '#22c55e' : (this.flirMode === 'black_hot' ? '#0f172a' : (this.flirMode === 'ironbow' ? '#f59e0b' : '#38bdf8'));
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(w / 2 - (isMini ? 25 : 45), h / 2); ctx.lineTo(w / 2 + (isMini ? 25 : 45), h / 2);
        ctx.moveTo(w / 2, h / 2 - (isMini ? 25 : 45)); ctx.lineTo(w / 2, h / 2 + (isMini ? 25 : 45));
        ctx.stroke();
        ctx.setLineDash([]);

        // Center Optical / Thermal Target Silhouette
        if (target && target.status !== 'destroyed') {
            const range = Math.round(Math.hypot(target.pos.x, target.pos.y));
            const baseScale = isMini ? 14 : 26;
            const droneSize = Math.max(isMini ? 10 : 18, Math.min(isMini ? 55 : 95, (1200 / Math.max(80, range)) * baseScale * this.zoomLevel));

            // Small gimbal tracking jitter
            const jitterX = (Math.sin(Date.now() * 0.003) * 2);
            const jitterY = (Math.cos(Date.now() * 0.004) * 2);

            ctx.save();
            ctx.translate(w / 2 + jitterX, h / 2 + jitterY);

            // Thermal Heat Glow & Colors
            if (this.flirMode === 'white_hot') {
                ctx.fillStyle = target.isDecoy ? '#94a3b8' : '#ffffff';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = target.isDecoy ? 2 : 18;
            } else if (this.flirMode === 'black_hot') {
                ctx.fillStyle = target.isDecoy ? '#64748b' : '#000000';
            } else if (this.flirMode === 'ironbow') {
                // Hot core orange/yellow, outer body red
                ctx.fillStyle = target.isDecoy ? '#a855f7' : '#f97316';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 14;
            } else if (this.flirMode === 'nvg') {
                ctx.fillStyle = '#4ade80';
                ctx.shadowColor = '#22c55e';
                ctx.shadowBlur = 12;
            } else {
                ctx.fillStyle = target.type === 'fpv_kamikaze' ? '#ef4444' : '#38bdf8';
            }

            // Draw Silhouette by Threat Type
            if (target.type === 'fixed_wing') {
                // Fixed-Wing Delta Airframe
                ctx.beginPath();
                ctx.moveTo(0, -droneSize * 0.45);
                ctx.lineTo(droneSize * 0.75, droneSize * 0.25);
                ctx.lineTo(-droneSize * 0.75, droneSize * 0.25);
                ctx.closePath();
                ctx.fill();

                // Pusher propeller blur
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, droneSize * 0.3, droneSize * 0.15, 0, Math.PI * 2);
                ctx.stroke();
            } else if (target.isDecoy) {
                // Corner Reflector Chaff Balloon
                ctx.strokeRect(-droneSize * 0.35, -droneSize * 0.35, droneSize * 0.7, droneSize * 0.7);
                ctx.beginPath();
                ctx.moveTo(-droneSize * 0.35, -droneSize * 0.35); ctx.lineTo(droneSize * 0.35, droneSize * 0.35);
                ctx.moveTo(droneSize * 0.35, -droneSize * 0.35); ctx.lineTo(-droneSize * 0.35, droneSize * 0.35);
                ctx.stroke();
            } else if (target.type === 'bird_flock') {
                // Flapping Bird Silhouette
                const wingFlap = Math.sin(Date.now() * 0.008) * droneSize * 0.2;
                ctx.beginPath();
                ctx.moveTo(-droneSize * 0.5, wingFlap);
                ctx.quadraticCurveTo(0, -droneSize * 0.25, droneSize * 0.5, wingFlap);
                ctx.lineTo(0, droneSize * 0.2);
                ctx.closePath();
                ctx.fill();
            } else {
                // Commercial Quadcopter or FPV Kamikaze
                ctx.fillRect(-droneSize * 0.25, -droneSize * 0.2, droneSize * 0.5, droneSize * 0.4);

                // 4 Animated Spinning Rotor Discs
                const rRadius = droneSize * 0.18;
                const armOffset = droneSize * 0.38;

                const rotorCenters = [
                    { x: -armOffset, y: -armOffset },
                    { x: armOffset, y: -armOffset },
                    { x: -armOffset, y: armOffset },
                    { x: armOffset, y: armOffset }
                ];

                rotorCenters.forEach(rc => {
                    ctx.beginPath();
                    ctx.arc(rc.x, rc.y, rRadius, 0, Math.PI * 2);
                    ctx.fill();

                    // Rotor spinning blade lines
                    ctx.strokeStyle = this.flirMode === 'black_hot' ? '#334155' : 'rgba(255,255,255,0.7)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(rc.x - Math.cos(this.rotorAngle) * rRadius, rc.y - Math.sin(this.rotorAngle) * rRadius);
                    ctx.lineTo(rc.x + Math.cos(this.rotorAngle) * rRadius, rc.y + Math.sin(this.rotorAngle) * rRadius);
                    ctx.stroke();
                });
            }
            ctx.restore();

            // Tracking Bounding Box Brackets
            const boxSize = droneSize + (isMini ? 12 : 22);
            ctx.strokeStyle = this.flirMode === 'black_hot' ? '#0f172a' : '#38bdf8';
            ctx.lineWidth = 1.8;
            const b = boxSize / 2;
            const cX = w / 2;
            const cY = h / 2;

            // 4 Corner Brackets
            const cornerLen = isMini ? 4 : 8;
            ctx.beginPath();
            // Top-Left
            ctx.moveTo(cX - b, cY - b + cornerLen); ctx.lineTo(cX - b, cY - b); ctx.lineTo(cX - b + cornerLen, cY - b);
            // Top-Right
            ctx.moveTo(cX + b - cornerLen, cY - b); ctx.lineTo(cX + b, cY - b); ctx.lineTo(cX + b, cY - b + cornerLen);
            // Bottom-Left
            ctx.moveTo(cX - b, cY + b - cornerLen); ctx.lineTo(cX - b, cY + b); ctx.lineTo(cX - b + cornerLen, cY + b);
            // Bottom-Right
            ctx.moveTo(cX + b - cornerLen, cY + b); ctx.lineTo(cX + b, cY + b); ctx.lineTo(cX + b, cY + b - cornerLen);
            ctx.stroke();

            // HUD Readouts
            ctx.fillStyle = this.flirMode === 'black_hot' ? '#0f172a' : '#38bdf8';
            ctx.font = isMini ? 'bold 8px monospace' : 'bold 9px monospace';
            ctx.fillText(`TRK: ${target.id} // ${this.flirMode.toUpperCase()}`, 8, isMini ? 12 : 16);
            ctx.fillText(`RNG: ${range}M // ${(target.speed || 25).toFixed(0)} M/S`, 8, isMini ? 22 : 28);

            if (!isMini) {
                const az = Math.round((Math.atan2(target.pos.x, target.pos.y) * 180 / Math.PI + 360) % 360);
                ctx.fillText(`AZ: ${az}° // ALT: ${Math.round(target.pos.z)}M // ${this.zoomLevel}X`, 8, 40);

                const conf = this.calculateConfidence(target);
                ctx.fillStyle = conf.color;
                ctx.fillText(`AI CONFIDENCE: ${conf.score}% [${conf.classification.toUpperCase()}]`, 8, h - 8);
            }
        } else {
            // No target locked or target destroyed
            ctx.fillStyle = '#64748b';
            ctx.font = isMini ? 'bold 9px monospace' : 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(target && target.status === 'destroyed' ? 'TARGET DESTROYED' : 'NO TARGET LOCKED', w / 2, h / 2);
            ctx.font = isMini ? '7px monospace' : '9px monospace';
            ctx.fillText('SELECT TRACK ON RADAR OR BUTTONS ABOVE', w / 2, h / 2 + (isMini ? 12 : 16));
            ctx.textAlign = 'left';
        }
    },

    // ------------------------------------------------------------------------
    // 2. REAL-TIME RF SPECTRUM OSCILLOSCOPE & CASCADING WATERFALL
    // ------------------------------------------------------------------------
    renderRFSpectrum: function(deltaTime) {
        if (!this.rfCanvas || !this.rfCtx) return;
        const ctx = this.rfCtx;
        const w = this.rfCanvas.width;
        const h = this.rfCanvas.height;

        this.rfScanTime += deltaTime;

        // Split canvas: Top 60% is live FFT Oscilloscope curve; Bottom 40% is rolling waterfall
        const fftHeight = Math.floor(h * 0.62);
        const wfHeight = h - fftHeight;

        // 1. Draw FFT Oscilloscope Grid & Spectrum
        ctx.fillStyle = '#060f18';
        ctx.fillRect(0, 0, w, fftHeight);

        // Grid lines for standard defense ISM frequency bands
        const bands = [
            { freq: '433 MHz', x: w * 0.15 },
            { freq: '915 MHz', x: w * 0.38 },
            { freq: '2.4 GHz', x: w * 0.65 },
            { freq: '5.8 GHz', x: w * 0.88 }
        ];

        ctx.strokeStyle = 'rgba(78, 222, 163, 0.15)';
        ctx.lineWidth = 1;
        bands.forEach(b => {
            ctx.beginPath();
            ctx.moveTo(b.x, 0); ctx.lineTo(b.x, fftHeight);
            ctx.stroke();

            ctx.fillStyle = '#4edea3';
            ctx.font = '8px monospace';
            ctx.fillText(b.freq, b.x - 18, 10);
        });

        // Calculate dynamic RF peak height based on target distance
        const target = this.lockedTarget;
        const activeFreq = target && target.status !== 'destroyed' ? target.rfFrequencyMHz : null;
        const range = target ? Math.max(60, Math.hypot(target.pos.x, target.pos.y)) : 2000;
        const distPowerScale = Math.min(1.0, Math.max(0.2, 1200 / range)); // Friis transmission proxy

        // Frequency hopping jitter if 2.4GHz FHSS
        let hopOffset = 0;
        if (activeFreq === 2400) {
            hopOffset = (Math.sin(this.rfScanTime * 8) * 14);
        }

        ctx.beginPath();
        ctx.moveTo(0, fftHeight - 8);

        const rowPowers = new Array(Math.floor(w / 4)).fill(0);

        for (let x = 0; x < w; x += 4) {
            // Baseline noise floor with realistic Gaussian jitter
            let noise = Math.sin(x * 0.08 + this.rfScanTime * 6) * 3 + (Math.random() - 0.5) * 6;
            let y = fftHeight - 10 + noise;

            let powerNorm = 0.05 + Math.random() * 0.08;

            if (activeFreq && activeFreq > 0) {
                let peakX = -100;
                if (activeFreq === 433) peakX = w * 0.15;
                if (activeFreq === 915) peakX = w * 0.38;
                if (activeFreq === 2400) peakX = w * 0.65 + hopOffset;
                if (activeFreq === 5800) peakX = w * 0.88;

                const dist = Math.abs(x - peakX);
                const peakWidth = activeFreq === 5800 ? 32 : 22; // 5.8G analog is wider band

                if (dist < peakWidth) {
                    const peakFrac = (1 - dist / peakWidth);
                    const peakAmp = peakFrac * (fftHeight * 0.72) * distPowerScale;
                    y -= peakAmp;
                    powerNorm = Math.min(1.0, powerNorm + peakFrac * distPowerScale);
                }
            }

            const colIdx = Math.floor(x / 4);
            if (colIdx < rowPowers.length) rowPowers[colIdx] = powerNorm;

            ctx.lineTo(x, y);
        }

        // Draw FFT Curve
        ctx.strokeStyle = activeFreq ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = activeFreq ? '#38bdf8' : 'transparent';
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 2. Cascade Rolling Waterfall Display (Bottom Pane)
        if (this.waterfallCanvas && this.waterfallCtx) {
            // Scroll waterfall down by 1 pixel
            this.waterfallCtx.drawImage(
                this.waterfallCanvas,
                0, 0, this.waterfallCanvas.width, this.waterfallCanvas.height - 1,
                0, 1, this.waterfallCanvas.width, this.waterfallCanvas.height - 1
            );

            // Paint new top row of waterfall based on rowPowers
            for (let i = 0; i < rowPowers.length; i++) {
                const p = rowPowers[i];
                // Color map: low -> deep navy, mid -> cyan, high -> bright yellow/red
                if (p > 0.65) {
                    this.waterfallCtx.fillStyle = '#ef4444';
                } else if (p > 0.45) {
                    this.waterfallCtx.fillStyle = '#f59e0b';
                } else if (p > 0.25) {
                    this.waterfallCtx.fillStyle = '#38bdf8';
                } else {
                    this.waterfallCtx.fillStyle = '#061727';
                }
                this.waterfallCtx.fillRect(i * 4, 0, 4, 1);
            }

            // Draw waterfall buffer onto bottom half of canvas
            ctx.drawImage(this.waterfallCanvas, 0, fftHeight, w, wfHeight);
        }

        // Divider Line between FFT and Waterfall
        ctx.strokeStyle = 'rgba(78, 222, 163, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, fftHeight); ctx.lineTo(w, fftHeight);
        ctx.stroke();

        // RF Protocol Decode Tag
        ctx.fillStyle = activeFreq ? '#f59e0b' : '#94a3b8';
        ctx.font = 'bold 9px monospace';
        if (target && activeFreq > 0) {
            const snr = Math.round(14 + distPowerScale * 24);
            ctx.fillText(`EMISSION: ${activeFreq} MHz // SNR: +${snr} dB // PROTOCOL: ${target.rfProtocol || 'DIGITAL FHSS'}`, 10, fftHeight - 4);
        } else {
            ctx.fillText('NO RF SIGNATURE DETECTED // RADIO-SILENT OR BIOLOGICAL FLOCK', 10, fftHeight - 4);
        }
    },

    // ------------------------------------------------------------------------
    // 3. REAL-TIME ACOUSTIC HARMONICS & SOUND SYNTHESIS
    // ------------------------------------------------------------------------
    renderAcoustic: function(deltaTime) {
        if (!this.acousticCanvas || !this.acousticCtx) return;
        const ctx = this.acousticCtx;
        const w = this.acousticCanvas.width;
        const h = this.acousticCanvas.height;

        ctx.fillStyle = '#060f18';
        ctx.fillRect(0, 0, w, h);

        const target = this.lockedTarget;
        const range = target ? Math.max(50, Math.hypot(target.pos.x, target.pos.y)) : 2000;
        const isLive = target && target.status !== 'destroyed';

        // Attenuate decibels with distance
        const baseDb = target ? (target.acousticDb || 70) : 38;
        const currentDb = isLive ? Math.round(Math.max(38, baseDb - (range / 70))) : 38;

        // Decibel Meter Progress Bar
        const barWidth = Math.min(w - 20, Math.max(10, ((currentDb - 30) / 70) * (w - 20)));
        ctx.fillStyle = currentDb > 75 ? '#ef4444' : (currentDb > 60 ? '#f59e0b' : '#10b981');
        ctx.fillRect(10, 16, barWidth, 10);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(10, 16, w - 20, 10);

        // Header Readout
        ctx.fillStyle = '#dae3f1';
        ctx.font = 'bold 9px monospace';
        const bpfLabel = target && target.type === 'fpv_kamikaze' ? '410 Hz (HIGH-RPM FPV)' :
            (target && target.type === 'commercial_quad' ? '185 Hz (COMMERCIAL)' :
            (target && target.type === 'fixed_wing' ? '110 Hz (PROP GLIDER)' :
            (target && target.type === 'bird_flock' ? 'FAUNA CHIRP (1.8 kHz)' : 'AMBIENT NOISE')));

        ctx.fillText(`SPL: ${currentDb} dB(A) // BPF PEAK: ${bpfLabel}`, 10, 11);

        // 32-Band FFT Acoustic Spectrum
        const bars = 28;
        const bw = (w - 20) / bars;

        for (let i = 0; i < bars; i++) {
            let harmonicMultiplier = 0.2;

            if (isLive) {
                if (target.type === 'fpv_kamikaze') {
                    // Spikes around bins 10 and 20 (410Hz and 820Hz)
                    if (Math.abs(i - 10) < 2 || Math.abs(i - 20) < 2) harmonicMultiplier = 1.0;
                } else if (target.type === 'commercial_quad') {
                    // Spikes around bin 5 and 10 (185Hz and 370Hz)
                    if (Math.abs(i - 5) < 2 || Math.abs(i - 10) < 2) harmonicMultiplier = 0.85;
                } else if (target.type === 'fixed_wing') {
                    // Spike at bin 3 (110Hz)
                    if (Math.abs(i - 3) < 2) harmonicMultiplier = 0.9;
                }
            }

            const jitter = Math.sin(i * 0.5 + this.rfScanTime * 7) * 4;
            const bh = Math.max(4, (harmonicMultiplier * ((currentDb / 100) * (h * 0.55))) + jitter);

            ctx.fillStyle = harmonicMultiplier > 0.7 ? '#ef4444' : (harmonicMultiplier > 0.4 ? '#f59e0b' : '#38bdf8');
            ctx.fillRect(10 + i * bw, h - bh - 4, bw - 2, bh);
        }

        // Live Audio Pitch/Volume Modulator if listener is active
        this.updateAcousticSynthesizer(target, currentDb);
    },

    toggleAcousticAudio: function() {
        this.isAcousticAudioPlaying = !this.isAcousticAudioPlaying;

        const btn = document.getElementById('acousticAudioToggleBtn');
        if (btn) {
            btn.innerHTML = this.isAcousticAudioPlaying ?
                '<span class="material-symbols-outlined text-[12px]">volume_up</span><span>ACOUSTIC FEED: LIVE</span>' :
                '<span class="material-symbols-outlined text-[12px]">volume_off</span><span>LISTEN TO MOTOR</span>';
            btn.className = `px-2 py-0.5 rounded text-[9px] font-mono border flex items-center gap-1 ${
                this.isAcousticAudioPlaying ? 'bg-primary/20 text-primary border-primary/50 font-bold' : 'bg-surface-container text-on-surface border-surface-container-highest'
            }`;
        }

        if (this.isAcousticAudioPlaying) {
            this.startAcousticSynthesizer();
        } else {
            this.stopAcousticSynthesizer();
        }
    },

    startAcousticSynthesizer: function() {
        if (!window.TacticalAudio || !window.TacticalAudio.ctx) {
            if (window.TacticalAudio) window.TacticalAudio.init();
        }
        const ctx = window.TacticalAudio ? window.TacticalAudio.ctx : null;
        if (!ctx) return;
        window.TacticalAudio.resumeContext();

        try {
            this.acousticOsc1 = ctx.createOscillator();
            this.acousticOsc2 = ctx.createOscillator();
            this.acousticGain = ctx.createGain();

            this.acousticOsc1.type = 'sawtooth';
            this.acousticOsc2.type = 'triangle';

            this.acousticOsc1.frequency.setValueAtTime(180, ctx.currentTime);
            this.acousticOsc2.frequency.setValueAtTime(360, ctx.currentTime);

            this.acousticGain.gain.setValueAtTime(0.04, ctx.currentTime);

            this.acousticOsc1.connect(this.acousticGain);
            this.acousticOsc2.connect(this.acousticGain);
            this.acousticGain.connect(ctx.destination);

            this.acousticOsc1.start();
            this.acousticOsc2.start();
        } catch (e) {}
    },

    updateAcousticSynthesizer: function(target, db) {
        if (!this.isAcousticAudioPlaying || !this.acousticGain || !window.TacticalAudio || !window.TacticalAudio.ctx) return;
        const ctx = window.TacticalAudio.ctx;

        const targetFreq = target && target.type === 'fpv_kamikaze' ? 420 :
            (target && target.type === 'fixed_wing' ? 110 : 185);

        const targetVolume = target && target.status !== 'destroyed' ? Math.max(0.01, (db / 100) * 0.08) : 0.001;

        try {
            this.acousticOsc1.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
            this.acousticOsc2.frequency.setTargetAtTime(targetFreq * 2, ctx.currentTime, 0.1);
            this.acousticGain.gain.setTargetAtTime(targetVolume, ctx.currentTime, 0.1);
        } catch (e) {}
    },

    stopAcousticSynthesizer: function() {
        try {
            if (this.acousticOsc1) { this.acousticOsc1.stop(); this.acousticOsc1.disconnect(); this.acousticOsc1 = null; }
            if (this.acousticOsc2) { this.acousticOsc2.stop(); this.acousticOsc2.disconnect(); this.acousticOsc2 = null; }
            if (this.acousticGain) { this.acousticGain.disconnect(); this.acousticGain = null; }
        } catch (e) {}
    },

    // ------------------------------------------------------------------------
    // 4. BAYESIAN SENSOR FUSION CONFIDENCE CALCULATION
    // ------------------------------------------------------------------------
    calculateConfidence: function(target) {
        if (!target) return { score: 0, classification: 'unknown', color: '#94a3b8' };

        let score = 50;
        let inferredClass = 'unknown';

        // Radar RCS
        if (target.radarCrossSection < 0.025) {
            score += 15;
            inferredClass = 'fpv_kamikaze';
        } else if (target.radarCrossSection > 0.15) {
            score += 25;
            inferredClass = 'decoy_chaff';
        } else if (target.radarCrossSection > 0.08) {
            score += 20;
            inferredClass = 'fixed_wing';
        }

        // RF Telemetry
        if (target.rfFrequencyMHz === 5800) {
            score += 25;
            inferredClass = 'fpv_kamikaze';
        } else if (target.rfFrequencyMHz === 2400) {
            score += 20;
            inferredClass = 'commercial_quad';
        } else if (target.rfFrequencyMHz === 0) {
            if (target.type === 'bird_flock') {
                score += 30;
                inferredClass = 'bird_flock';
            } else {
                score += 10;
                inferredClass = 'decoy_chaff';
            }
        }

        // Acoustic
        if (target.acousticDb > 80) score += 10;

        score = Math.min(98, Math.max(35, score));
        const color = score > 80 ? '#10b981' : (score > 60 ? '#f59e0b' : '#ef4444');

        return {
            score: score,
            classification: inferredClass,
            color: color
        };
    }
};
