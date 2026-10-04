/**
 * AEGIS-CUAS 2D RADAR & 3D WEBGL SIMULATION ENGINE
 */
window.SimulationEngine = {
    canvas2D: null,
    ctx2D: null,
    pipCanvas: null,
    pipCtx: null,
    container3D: null,
    
    // ThreeJS 3D Scene references
    scene3D: null,
    camera3D: null,
    renderer3D: null,
    drone3DMeshes: {},
    
    // Sim State
    isRunning: false,
    is3DMode: false,
    simTime: 0,
    radarAngle: 0,
    activeScenario: null,
    targets: [],
    selectedTargetId: null,
    selectedCountermeasure: null,
    activeEffects: [], // lasers, jammer waves, tracer streams
    
    // Sensor mode: radar, optics, rf, acoustic
    sensorMode: 'radar',
    
    init: function() {
        this.canvas2D = document.getElementById('simCanvas2D');
        this.ctx2D = this.canvas2D.getContext('2d');
        
        this.pipCanvas = document.getElementById('pipCanvas');
        this.pipCtx = this.pipCanvas.getContext('2d');
        
        this.container3D = document.getElementById('simContainer3D');
        
        this.init3DScene();
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    },

    resize: function() {
        if (!this.canvas2D) return;
        const rect = this.canvas2D.parentElement.getBoundingClientRect();
        this.canvas2D.width = rect.width;
        this.canvas2D.height = rect.height;
        
        if (this.renderer3D) {
            this.camera3D.aspect = rect.width / rect.height;
            this.camera3D.updateProjectionMatrix();
            this.renderer3D.setSize(rect.width, rect.height);
        }
    },

    init3DScene: function() {
        if (typeof THREE === 'undefined') return;
        
        this.scene3D = new THREE.Scene();
        this.scene3D.background = new THREE.Color(0x05080e);
        this.scene3D.fog = new THREE.FogExp2(0x05080e, 0.0015);
        
        this.camera3D = new THREE.PerspectiveCamera(60, 1, 1, 5000);
        this.camera3D.position.set(0, 150, 400);
        this.camera3D.lookAt(0, 20, 0);
        
        this.renderer3D = new THREE.WebGLRenderer({ antialias: true });
        this.renderer3D.setPixelRatio(window.devicePixelRatio);
        this.container3D.appendChild(this.renderer3D.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x223344, 1.5);
        this.scene3D.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.8);
        dirLight.position.set(200, 500, 200);
        this.scene3D.add(dirLight);
        
        // Grid & FOB Base Center
        const gridHelper = new THREE.GridHelper(1000, 40, 0x00f0ff, 0x152238);
        this.scene3D.add(gridHelper);
        
        // Base Dome Indicator
        const domeGeo = new THREE.SphereGeometry(60, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const domeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.15 });
        const domeMesh = new THREE.Mesh(domeGeo, domeMat);
        this.scene3D.add(domeMesh);
    },

    loadScenario: function(scenario) {
        this.activeScenario = scenario;
        this.targets = JSON.parse(JSON.stringify(scenario.targets));
        this.simTime = 0;
        this.selectedTargetId = null;
        this.activeEffects = [];
        
        // Clear 3D drone meshes
        for (let key in this.drone3DMeshes) {
            this.scene3D.remove(this.drone3DMeshes[key]);
        }
        this.drone3DMeshes = {};
        
        // Build 3D Meshes for targets
        if (typeof THREE !== 'undefined') {
            this.targets.forEach(t => {
                const geo = t.type === 'tactical' ? new THREE.ConeGeometry(8, 20, 4) : new THREE.BoxGeometry(10, 4, 10);
                const mat = new THREE.MeshPhongMaterial({ color: t.isFriendly ? 0x00ffa3 : 0xff3366, wireframe: true });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(t.pos.x, t.pos.z, t.pos.y);
                this.scene3D.add(mesh);
                this.drone3DMeshes[t.id] = mesh;
            });
        }
    },

    update: function(dt) {
        if (!this.isRunning) return;
        this.simTime += dt;
        this.radarAngle += dt * 1.5;
        
        // Update Targets Trajectory & Boids flocking
        this.targets.forEach(t => {
            if (t.isNeutralized) return;
            
            // Move toward center (0,0) with minor jitter/evasion
            const dx = -t.pos.x;
            const dy = -t.pos.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 10) {
                const speed = Math.hypot(t.velocity.x, t.velocity.y);
                t.pos.x += (dx / dist) * speed * dt + (Math.random() - 0.5) * (t.behavior === 'evasive' ? 12 : 2);
                t.pos.y += (dy / dist) * speed * dt + (Math.random() - 0.5) * (t.behavior === 'evasive' ? 12 : 2);
            }
            
            // Sync with 3D mesh
            if (this.drone3DMeshes[t.id]) {
                this.drone3DMeshes[t.id].position.set(t.pos.x, t.pos.z, t.pos.y);
                this.drone3DMeshes[t.id].rotation.y += dt * 2;
            }
        });
        
        // Update Countermeasure Effects
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const fx = this.activeEffects[i];
            fx.life -= dt;
            if (fx.life <= 0) {
                this.activeEffects.splice(i, 1);
            }
        }
    },

    render: function() {
        if (this.is3DMode && this.renderer3D) {
            this.renderer3D.render(this.scene3D, this.camera3D);
        } else {
            this.render2DRadar();
        }
        this.renderPIP();
    },

    render2DRadar: function() {
        const ctx = this.ctx2D;
        const w = this.canvas2D.width;
        const h = this.canvas2D.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxRadius = Math.min(w, h) * 0.42;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background Noise / EW Interference
        if (this.activeScenario && this.activeScenario.noise > 0) {
            ctx.fillStyle = `rgba(0, 240, 255, ${this.activeScenario.noise * 0.0015})`;
            for (let n = 0; n < 80; n++) {
                ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
            }
        }
        
        // Range Rings (1km, 2km, 3km)
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
        ctx.lineWidth = 1;
        for (let r = 1; r <= 3; r++) {
            const radius = (maxRadius / 3) * r;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.font = '10px "Share Tech Mono"';
            ctx.fillText(`${r}.0 KM`, cx + 5, cy - radius + 12);
        }
        
        // Crosshair Axes
        ctx.beginPath();
        ctx.moveTo(cx, cy - maxRadius); ctx.lineTo(cx, cy + maxRadius);
        ctx.moveTo(cx - maxRadius, cy); ctx.lineTo(cx + maxRadius, cy);
        ctx.stroke();
        
        // Animated Radar Sweep
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.radarAngle);
        const sweepGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius);
        sweepGradient.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
        sweepGradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, maxRadius, -0.4, 0);
        ctx.closePath();
        ctx.fillStyle = sweepGradient;
        ctx.fill();
        ctx.restore();
        
        // FOB Base Icon in Center
        ctx.fillStyle = '#00ffa3';
        ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#00ffa3'; ctx.strokeRect(cx - 10, cy - 10, 20, 20);
        
        // Render Active Effects (Lasers, Jammers, Guns)
        this.activeEffects.forEach(fx => {
            if (fx.type === 'laser') {
                ctx.strokeStyle = '#ffb700';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#ffb700';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + fx.targetPos.x, cy + fx.targetPos.y);
                ctx.stroke();
                ctx.shadowBlur = 0;
            } else if (fx.type === 'rf_jammer') {
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, cy, (1 - fx.life) * maxRadius * 0.9, 0, Math.PI * 2);
                ctx.stroke();
            } else if (fx.type === 'ciws') {
                ctx.strokeStyle = '#ff3366';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + fx.targetPos.x, cy + fx.targetPos.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
        
        // Render Target Contacts
        this.targets.forEach(t => {
            if (t.isNeutralized) return;
            
            // Map 3D target pos to 2D radar screen coordinates
            const tx = cx + (t.pos.x / 350) * maxRadius;
            const ty = cy + (t.pos.y / 350) * maxRadius;
            
            const isSelected = t.id === this.selectedTargetId;
            
            // Sensor Mode variations
            if (this.sensorMode === 'optics') { // Thermal FLIR Green
                ctx.fillStyle = isSelected ? '#ff3366' : '#00ffa3';
                ctx.beginPath(); ctx.arc(tx, ty, isSelected ? 8 : 5, 0, Math.PI * 2); ctx.fill();
            } else if (this.sensorMode === 'rf') { // Spectrum Waveform Ring
                ctx.strokeStyle = '#ffb700';
                ctx.beginPath(); ctx.arc(tx, ty, 10, 0, Math.PI * 2); ctx.stroke();
            } else { // Standard Radar Blip
                ctx.fillStyle = t.isFriendly ? '#00ffa3' : (isSelected ? '#ff3366' : '#00f0ff');
                ctx.beginPath(); ctx.arc(tx, ty, 5, 0, Math.PI * 2); ctx.fill();
                
                // Track Label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = '10px "Share Tech Mono"';
                ctx.fillText(t.id, tx + 8, ty - 6);
                
                // Selection Box
                if (isSelected) {
                    ctx.strokeStyle = '#ff3366';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(tx - 12, ty - 12, 24, 24);
                }
            }
        });
    },

    renderPIP: function() {
        const ctx = this.pipCtx;
        const w = this.pipCanvas.width;
        const h = this.pipCanvas.height;
        
        ctx.fillStyle = '#08120c'; // FLIR Greenish tint
        ctx.fillRect(0, 0, w, h);
        
        const selTarget = this.targets.find(t => t.id === this.selectedTargetId && !t.isNeutralized);
        if (selTarget) {
            ctx.save();
            ctx.translate(w / 2, h / 2);
            
            // Draw FLIR Thermal Hot Signature
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00ffa3';
            ctx.shadowBlur = 15;
            
            if (selTarget.type === 'tactical') {
                ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(15, 20); ctx.lineTo(-15, 20); ctx.closePath(); ctx.fill();
            } else {
                ctx.fillRect(-15, -6, 30, 12);
                ctx.fillRect(-6, -15, 12, 30);
            }
            ctx.restore();
            document.getElementById('pipTargetLabel').textContent = `LOCK: ${selTarget.id} (${selTarget.typeName})`;
        } else {
            ctx.fillStyle = 'rgba(0, 255, 163, 0.3)';
            ctx.font = '10px "Share Tech Mono"';
            ctx.fillText('SEARCHING SENSOR OPTICS...', 20, h / 2);
            document.getElementById('pipTargetLabel').textContent = 'LOCK: SEARCHING';
        }
    },

    fireCountermeasure: function(targetId, cmType) {
        const target = this.targets.find(t => t.id === targetId);
        if (!target) return;
        
        const maxRadius = Math.min(this.canvas2D.width, this.canvas2D.height) * 0.42;
        const tx = (target.pos.x / 350) * maxRadius;
        const ty = (target.pos.y / 350) * maxRadius;
        
        this.activeEffects.push({
            type: cmType,
            targetPos: { x: tx, y: ty },
            life: 0.8
        });
        
        // Neutralize target after impact
        target.isNeutralized = true;
    }
};
