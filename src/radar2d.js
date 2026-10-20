/**
 * SENTINEL-Drone 2D Pulse Radar & Lightweight Tactical Map Engine
 * Provides 60 FPS hardware-independent tactical radar with range rings,
 * azimuth radials, contact symbols, weapon FX (lasers, jammer waves, missile paths),
 * and interactive target selection.
 */
window.Radar2D = {
    canvas: null,
    ctx: null,
    radarAngle: 0,
    radarSpanMeters: 2000,
    selectedTargetId: null,
    activeEffects: [], // lasers, jammer waves, explosions, interceptors

    init: function(canvasId) {
        this.canvas = document.getElementById(canvasId || 'simCanvas2D');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());

        // Click to select target on radar
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            this.handleRadarClick(clickX, clickY);
        });
    },

    resize: function() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height > 100 ? rect.height : rect.width);
        this.canvas.width = size;
        this.canvas.height = size;
    },

    setSpan: function(spanMeters) {
        this.radarSpanMeters = spanMeters;
    },

    addEffect: function(type, startPos, endPos, durationSec) {
        this.activeEffects.push({
            type: type, // 'laser', 'jam', 'interceptor', 'explosion'
            start: startPos || { x: 0, y: 0 },
            end: endPos,
            duration: durationSec || 1.0,
            elapsed: 0
        });
    },

    worldToCanvas: function(worldX, worldY) {
        const center = this.canvas.width / 2;
        const scale = (this.canvas.width / 2) / this.radarSpanMeters;
        return {
            x: center + worldX * scale,
            y: center - worldY * scale
        };
    },

    canvasToWorld: function(canvasX, canvasY) {
        const center = this.canvas.width / 2;
        const scale = (this.canvas.width / 2) / this.radarSpanMeters;
        return {
            x: (canvasX - center) / scale,
            y: -(canvasY - center) / scale
        };
    },

    handleRadarClick: function(clickX, clickY) {
        if (!window.SimulationApp || !window.SimulationApp.activeTargets) return;
        const worldClick = this.canvasToWorld(clickX, clickY);

        let closest = null;
        let minDist = 150; // Selection threshold in world meters

        window.SimulationApp.activeTargets.forEach(t => {
            if (t.status === 'destroyed') return;
            const d = Math.hypot(t.pos.x - worldClick.x, t.pos.y - worldClick.y);
            if (d < minDist) {
                minDist = d;
                closest = t;
            }
        });

        if (closest) {
            window.SimulationApp.selectTarget(closest.id);
        }
    },

    render: function(targets, deltaTime) {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const center = w / 2;

        // Clear dark tactical background
        ctx.fillStyle = '#060d17';
        ctx.fillRect(0, 0, w, h);

        // Update radar sweep angle (60 RPM)
        this.radarAngle = (this.radarAngle + deltaTime * 1.8) % (Math.PI * 2);

        // 1. Draw Range Rings
        const rings = [
            { dist: 500, label: '500M KILL ZONE', color: 'rgba(239, 68, 68, 0.35)', dash: [4, 4] },
            { dist: 1000, label: '1000M PERIMETER', color: 'rgba(78, 222, 163, 0.30)', dash: [] },
            { dist: 1500, label: '1500M MID RANGE', color: 'rgba(56, 189, 248, 0.20)', dash: [2, 4] },
            { dist: 2000, label: '2000M SURVEILLANCE', color: 'rgba(56, 189, 248, 0.30)', dash: [] }
        ];

        const scale = center / this.radarSpanMeters;

        rings.forEach(r => {
            const radius = r.dist * scale;
            if (radius > center) return;

            ctx.beginPath();
            ctx.setLineDash(r.dash);
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 1.2;
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.fillStyle = r.color;
            ctx.font = '9px monospace';
            ctx.fillText(r.label, center - 45, center - radius + 11);
        });

        // 2. Azimuth Radials & Compass Markers
        ctx.strokeStyle = 'rgba(78, 222, 163, 0.12)';
        ctx.lineWidth = 1;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(center + Math.cos(a) * center, center + Math.sin(a) * center);
            ctx.stroke();
        }

        // Compass Letters
        ctx.fillStyle = '#4edea3';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('000° N', center, 14);
        ctx.fillText('090° E', w - 24, center + 3);
        ctx.fillText('180° S', center, h - 6);
        ctx.fillText('270° W', 24, center + 3);

        // 3. Radar Sweeper Beam with Phosphor Gradient
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(this.radarAngle);

        const sweepGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, center);
        sweepGrad.addColorStop(0, 'rgba(78, 222, 163, 0.4)');
        sweepGrad.addColorStop(1, 'rgba(78, 222, 163, 0.0)');

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, center, -0.45, 0);
        ctx.fillStyle = sweepGrad;
        ctx.fill();

        // Bright sweep line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(center, 0);
        ctx.strokeStyle = 'rgba(78, 222, 163, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // 4. Central Defended FOB Array Symbols
        ctx.save();
        ctx.fillStyle = '#4edea3';
        ctx.shadowColor = '#4edea3';
        ctx.shadowBlur = 8;
        ctx.fillRect(center - 6, center - 6, 12, 12);
        ctx.fillStyle = '#060d17';
        ctx.fillRect(center - 4, center - 4, 8, 8);
        ctx.fillStyle = '#4edea3';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FOB', center, center + 18);
        ctx.restore();

        // Base Assets markers (Ammo Depot S7, Radome, Helipad)
        const assets = [
            { name: 'AMMO S7', x: -140, y: 120, color: '#f59e0b' },
            { name: 'RADOME', x: 120, y: 160, color: '#38bdf8' },
            { name: 'HELIPAD', x: 80, y: -140, color: '#4edea3' }
        ];
        assets.forEach(ass => {
            const pos = this.worldToCanvas(ass.x, ass.y);
            ctx.fillStyle = ass.color;
            ctx.fillRect(pos.x - 3, pos.y - 3, 6, 6);
            ctx.font = '7px monospace';
            ctx.fillText(ass.name, pos.x, pos.y - 6);
        });

        // 5. Draw Active Weapon Effects (Lasers, Jammers, Missiles, Explosions)
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const eff = this.activeEffects[i];
            eff.elapsed += deltaTime;
            const progress = eff.elapsed / eff.duration;

            if (progress >= 1.0) {
                this.activeEffects.splice(i, 1);
                continue;
            }

            const startC = this.worldToCanvas(eff.start.x, eff.start.y);
            const endC = this.worldToCanvas(eff.end.x, eff.end.y);

            if (eff.type === 'laser') {
                // High energy crimson laser beam with glow
                ctx.save();
                ctx.strokeStyle = `rgba(244, 63, 94, ${1 - progress * 0.5})`;
                ctx.lineWidth = 3;
                ctx.shadowColor = '#f43f5e';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(startC.x, startC.y);
                ctx.lineTo(endC.x, endC.y);
                ctx.stroke();

                // Spark particles at target
                ctx.fillStyle = '#fde047';
                for (let s = 0; s < 4; s++) {
                    const sx = endC.x + (Math.random() - 0.5) * 14;
                    const sy = endC.y + (Math.random() - 0.5) * 14;
                    ctx.fillRect(sx, sy, 2, 2);
                }
                ctx.restore();
            } else if (eff.type === 'jam') {
                // Expanding RF jammer conical field
                ctx.save();
                ctx.strokeStyle = `rgba(56, 189, 248, ${0.7 - progress * 0.6})`;
                ctx.fillStyle = `rgba(56, 189, 248, ${0.12 - progress * 0.1})`;
                ctx.lineWidth = 1.5;
                const angle = Math.atan2(eff.end.y - eff.start.y, eff.end.x - eff.start.x);
                const distCanvas = Math.hypot(endC.x - startC.x, endC.y - startC.y);

                ctx.beginPath();
                ctx.moveTo(startC.x, startC.y);
                ctx.arc(startC.x, startC.y, distCanvas * progress, -angle - 0.35, -angle + 0.35);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            } else if (eff.type === 'interceptor') {
                // Interceptor drone en route to contact
                const curX = startC.x + (endC.x - startC.x) * progress;
                const curY = startC.y + (endC.y - startC.y) * progress;

                ctx.save();
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = 'rgba(78, 222, 163, 0.6)';
                ctx.beginPath();
                ctx.moveTo(startC.x, startC.y);
                ctx.lineTo(curX, curY);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#4edea3';
                ctx.shadowColor = '#4edea3';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(curX, curY, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (eff.type === 'explosion') {
                // Expanding shockwave ring
                ctx.save();
                const radius = 22 * progress;
                ctx.strokeStyle = `rgba(249, 115, 22, ${1 - progress})`;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(endC.x, endC.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        // 6. Draw Targets & Tactical Tracks
        if (targets && targets.length > 0) {
            targets.forEach(t => {
                const cPos = this.worldToCanvas(t.pos.x, t.pos.y);
                const isSelected = this.selectedTargetId === t.id;

                if (t.status === 'destroyed') {
                    // Wreckage marker
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(cPos.x - 4, cPos.y - 4);
                    ctx.lineTo(cPos.x + 4, cPos.y + 4);
                    ctx.moveTo(cPos.x + 4, cPos.y - 4);
                    ctx.lineTo(cPos.x - 4, cPos.y + 4);
                    ctx.stroke();
                    return;
                }

                // Lead velocity vector line
                if (t.velocity) {
                    const leadX = cPos.x + t.velocity.x * scale * 4;
                    const leadY = cPos.y - t.velocity.y * scale * 4;
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(cPos.x, cPos.y);
                    ctx.lineTo(leadX, leadY);
                    ctx.stroke();
                }

                // Contact Icon Symbol
                ctx.save();
                if (t.isDecoy) {
                    // Decoy: Yellow Square
                    ctx.strokeStyle = '#f59e0b';
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
                    ctx.lineWidth = 1.5;
                    ctx.fillRect(cPos.x - 5, cPos.y - 5, 10, 10);
                    ctx.strokeRect(cPos.x - 5, cPos.y - 5, 10, 10);
                    ctx.fillStyle = '#f59e0b';
                    ctx.font = 'bold 7px monospace';
                    ctx.fillText('D', cPos.x - 2, cPos.y + 3);
                } else if (t.type === 'bird_flock') {
                    // Bird: Green Triangle
                    ctx.strokeStyle = '#10b981';
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(cPos.x, cPos.y - 6);
                    ctx.lineTo(cPos.x + 5, cPos.y + 4);
                    ctx.lineTo(cPos.x - 5, cPos.y + 4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                } else {
                    // Hostile Drone: Crimson Diamond / Chevron
                    ctx.strokeStyle = '#ef4444';
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
                    ctx.lineWidth = 1.8;
                    ctx.shadowColor = '#ef4444';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.moveTo(cPos.x, cPos.y - 6);
                    ctx.lineTo(cPos.x + 6, cPos.y);
                    ctx.lineTo(cPos.x, cPos.y + 6);
                    ctx.lineTo(cPos.x - 6, cPos.y);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                ctx.restore();

                // Text Tags (ID + Altitude)
                ctx.fillStyle = t.isDecoy ? '#f59e0b' : (t.type === 'bird_flock' ? '#10b981' : '#ef4444');
                ctx.font = '9px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`${t.id}`, cPos.x + 8, cPos.y - 2);
                ctx.fillStyle = '#94a3b8';
                ctx.font = '8px monospace';
                ctx.fillText(`ALT ${Math.round(t.pos.z)}M // ${(t.speed || 25).toFixed(0)}M/S`, cPos.x + 8, cPos.y + 7);

                // Selection Box Brackets
                if (isSelected) {
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = 8;
                    const b = 10;
                    ctx.beginPath();
                    // Top-Left
                    ctx.moveTo(cPos.x - b, cPos.y - b + 4);
                    ctx.lineTo(cPos.x - b, cPos.y - b);
                    ctx.lineTo(cPos.x - b + 4, cPos.y - b);
                    // Top-Right
                    ctx.moveTo(cPos.x + b - 4, cPos.y - b);
                    ctx.lineTo(cPos.x + b, cPos.y - b);
                    ctx.lineTo(cPos.x + b, cPos.y - b + 4);
                    // Bottom-Left
                    ctx.moveTo(cPos.x - b, cPos.y + b - 4);
                    ctx.lineTo(cPos.x - b, cPos.y + b);
                    ctx.lineTo(cPos.x - b + 4, cPos.y + b);
                    // Bottom-Right
                    ctx.moveTo(cPos.x + b - 4, cPos.y + b);
                    ctx.lineTo(cPos.x + b, cPos.y + b);
                    ctx.lineTo(cPos.x + b, cPos.y + b - 4);
                    ctx.stroke();
                }
            });
        }
    }
};
