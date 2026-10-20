/**
 * SENTINEL-Drone 3D WebGL Tactical Simulation Engine (Three.js)
 * High-fidelity 3D tactical environment: Urban FOB, Rural Field, Coastal Shoreline;
 * Day/Night/Rain/Fog lighting; realistic 3D drone models (Quads, Fixed-Wing, FPV Kamikaze,
 * Payload Droppers, Decoy Chaff, Swarm Mesh Links), and full weapon FX.
 */
window.Simulation3D = {
    container: null,
    scene: null,
    camera: null,
    renderer: null,
    terrainMesh: null,
    droneMeshes: {},
    swarmLinesMesh: null,
    activeFx3D: [],
    searchlights: [],
    rainParticles: null,
    currentTerrain: 'urban',
    currentWeather: 'clear',
    currentTimeOfDay: 'night',

    // Camera modes: 'tactical_orbit', 'top_down', 'target_follow'
    cameraMode: 'tactical_orbit',
    cameraAngle: 0,
    orbitRadius: 450,
    orbitHeight: 220,

    init: function(containerId) {
        this.container = document.getElementById(containerId || 'simContainer3D');
        if (!this.container || typeof THREE === 'undefined') {
            console.warn('[Simulation3D] THREE is undefined or container not found. Running in 2D mode.');
            return false;
        }

        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 500;

        // 1. Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x060d17);
        this.scene.fog = new THREE.FogExp2(0x060d17, 0.0012);

        // 2. Camera setup
        this.camera = new THREE.PerspectiveCamera(55, width / height, 1, 6000);
        this.updateCameraPosition();

        // 3. WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // 4. Build Environment & FOB Base
        this.setupLighting();
        this.buildTerrain('urban');
        this.buildBaseStructures();

        // 5. Orbit controls (mouse drag)
        let isDragging = false;
        let prevMouseX = 0;
        let prevMouseY = 0;

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            prevMouseX = e.clientX;
            prevMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => { isDragging = false; });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - prevMouseX;
            const deltaY = e.clientY - prevMouseY;
            prevMouseX = e.clientX;
            prevMouseY = e.clientY;

            this.cameraAngle -= deltaX * 0.006;
            this.orbitHeight = Math.max(50, Math.min(600, this.orbitHeight - deltaY * 1.2));
            this.updateCameraPosition();
        });

        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.orbitRadius = Math.max(150, Math.min(1200, this.orbitRadius + e.deltaY * 0.5));
            this.updateCameraPosition();
        }, { passive: false });

        window.addEventListener('resize', () => this.resize());
        return true;
    },

    resize: function() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },

    setCameraMode: function(mode) {
        this.cameraMode = mode;
        if (mode === 'top_down') {
            this.camera.position.set(0, 750, 0);
            this.camera.lookAt(0, 0, 0);
        } else {
            this.updateCameraPosition();
        }
    },

    updateCameraPosition: function() {
        if (this.cameraMode === 'top_down') return;
        const x = Math.sin(this.cameraAngle) * this.orbitRadius;
        const z = Math.cos(this.cameraAngle) * this.orbitRadius;
        this.camera.position.set(x, this.orbitHeight, z);
        this.camera.lookAt(0, 20, 0);
    },

    setupLighting: function() {
        this.ambientLight = new THREE.AmbientLight(0x1a2b3c, 1.2);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
        this.dirLight.position.set(200, 450, 250);
        this.dirLight.castShadow = true;
        this.scene.add(this.dirLight);
    },

    setEnvironmentMode: function(terrain, timeOfDay, weather) {
        this.currentTerrain = terrain || 'urban';
        this.currentTimeOfDay = timeOfDay || 'night';
        this.currentWeather = weather || 'clear';

        // Adjust Background & Fog
        if (timeOfDay === 'day') {
            this.scene.background = new THREE.Color(weather === 'fog' ? 0x8899a6 : 0x1e3a5f);
            this.scene.fog = new THREE.FogExp2(weather === 'fog' ? 0x8899a6 : 0x1e3a5f, weather === 'fog' ? 0.0035 : 0.0008);
            this.ambientLight.color.setHex(0x94a3b8);
            this.ambientLight.intensity = 2.0;
            this.dirLight.color.setHex(0xfff7ed);
            this.dirLight.intensity = 2.2;
        } else {
            // Night
            this.scene.background = new THREE.Color(0x060d17);
            this.scene.fog = new THREE.FogExp2(0x060d17, weather === 'sandstorm' ? 0.004 : 0.0012);
            this.ambientLight.color.setHex(0x0f172a);
            this.ambientLight.intensity = 0.8;
            this.dirLight.color.setHex(0x38bdf8);
            this.dirLight.intensity = 0.6;
        }

        this.buildTerrain(terrain);
        this.setupWeatherParticles(weather);
    },

    buildTerrain: function(type) {
        if (this.terrainMesh) {
            this.scene.remove(this.terrainMesh);
        }

        const size = 3000;
        const geo = new THREE.PlaneGeometry(size, size, 40, 40);
        geo.rotateX(-Math.PI / 2);

        let color = 0x091422;
        if (type === 'rural') color = 0x0c1e15;
        if (type === 'coastal') color = 0x071526;

        const mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.85,
            metalness: 0.15
        });

        this.terrainMesh = new THREE.Mesh(geo, mat);
        this.terrainMesh.receiveShadow = true;
        this.scene.add(this.terrainMesh);

        // Grid helper for military coordinates
        if (this.gridHelper) this.scene.remove(this.gridHelper);
        this.gridHelper = new THREE.GridHelper(2400, 48, 0x38bdf8, 0x1e293b);
        this.gridHelper.position.y = 0.2;
        this.scene.add(this.gridHelper);
    },

    buildBaseStructures: function() {
        this.baseGroup = new THREE.Group();

        // 1. Central Command Radome
        const domeGeo = new THREE.SphereGeometry(24, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const domeMat = new THREE.MeshStandardMaterial({ color: 0xdae3f1, roughness: 0.3, metalness: 0.7 });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(0, 0, 0);
        this.baseGroup.add(dome);

        // Radome base ring
        const ringGeo = new THREE.CylinderGeometry(25, 26, 6, 24);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(0, 3, 0);
        this.baseGroup.add(ring);

        // 2. Ammunition Depot S7
        const depotGeo = new THREE.BoxGeometry(45, 14, 28);
        const depotMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const depot = new THREE.Mesh(depotGeo, depotMat);
        depot.position.set(-140, 7, 120);
        this.baseGroup.add(depot);

        // 3. Helipad Alpha
        const padGeo = new THREE.CylinderGeometry(35, 35, 1.5, 32);
        const padMat = new THREE.MeshStandardMaterial({ color: 0x172554 });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(80, 0.75, -140);
        this.baseGroup.add(pad);

        // 4. Perimeter Watchtowers & Searchlights
        const towerGeo = new THREE.CylinderGeometry(3, 4, 38, 8);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const towerCoords = [
            { x: -180, z: -180 }, { x: 180, z: -180 },
            { x: -180, z: 180 }, { x: 180, z: 180 }
        ];

        towerCoords.forEach(c => {
            const tower = new THREE.Mesh(towerGeo, towerMat);
            tower.position.set(c.x, 19, c.z);
            this.baseGroup.add(tower);

            // Spotlight beacon on tower top
            const spotLight = new THREE.SpotLight(0x38bdf8, 2.5, 380, Math.PI / 6, 0.4);
            spotLight.position.set(c.x, 38, c.z);
            spotLight.target.position.set(c.x * 1.5, 0, c.z * 1.5);
            this.scene.add(spotLight.target);
            this.scene.add(spotLight);
            this.searchlights.push(spotLight);
        });

        // 5. Perimeter Blast Wall
        const wallGeo = new THREE.BoxGeometry(380, 8, 3);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const wallN = new THREE.Mesh(wallGeo, wallMat); wallN.position.set(0, 4, -190);
        const wallS = new THREE.Mesh(wallGeo, wallMat); wallS.position.set(0, 4, 190);
        const wallW = new THREE.Mesh(wallGeo, wallMat); wallW.position.set(-190, 4, 0); wallW.rotateY(Math.PI / 2);
        const wallE = new THREE.Mesh(wallGeo, wallMat); wallE.position.set(190, 4, 0); wallE.rotateY(Math.PI / 2);

        this.baseGroup.add(wallN);
        this.baseGroup.add(wallS);
        this.baseGroup.add(wallW);
        this.baseGroup.add(wallE);

        this.scene.add(this.baseGroup);
    },

    setupWeatherParticles: function(weather) {
        if (this.rainParticles) {
            this.scene.remove(this.rainParticles);
            this.rainParticles = null;
        }

        if (weather === 'rain' || weather === 'sandstorm') {
            const count = 1800;
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);

            for (let i = 0; i < count * 3; i += 3) {
                pos[i] = (Math.random() - 0.5) * 1200;
                pos[i + 1] = Math.random() * 350;
                pos[i + 2] = (Math.random() - 0.5) * 1200;
            }

            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({
                color: weather === 'sandstorm' ? 0xd97706 : 0x38bdf8,
                size: weather === 'sandstorm' ? 3.0 : 1.8,
                transparent: true,
                opacity: 0.5
            });

            this.rainParticles = new THREE.Points(geo, mat);
            this.scene.add(this.rainParticles);
        }
    },

    createDrone3D: function(target) {
        const droneGroup = new THREE.Group();

        if (target.type === 'fixed_wing') {
            // Delta Wing Airframe
            const bodyGeo = new THREE.ConeGeometry(3, 14, 5);
            bodyGeo.rotateX(Math.PI / 2);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            const wingGeo = new THREE.BoxGeometry(22, 0.4, 6);
            const wing = new THREE.Mesh(wingGeo, bodyMat);
            wing.position.set(0, 0, 1);

            droneGroup.add(body);
            droneGroup.add(wing);
        } else if (target.isDecoy) {
            // Decoy Corner Cube Reflector
            const decGeo = new THREE.OctahedronGeometry(4);
            const decMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true });
            const decMesh = new THREE.Mesh(decGeo, decMat);
            droneGroup.add(decMesh);
        } else {
            // Commercial Quadcopter or FPV Kamikaze
            const hubGeo = new THREE.BoxGeometry(4, 1.5, 4);
            const hubMat = new THREE.MeshStandardMaterial({
                color: target.type === 'fpv_kamikaze' ? 0xef4444 : (target.type === 'payload_dropper' ? 0x9333ea : 0x0284c7)
            });
            const hub = new THREE.Mesh(hubGeo, hubMat);
            droneGroup.add(hub);

            // 4 Arms & Rotors
            const armMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
            const rotorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });

            const armCoords = [
                { x: 3.5, z: 3.5 }, { x: -3.5, z: 3.5 },
                { x: 3.5, z: -3.5 }, { x: -3.5, z: -3.5 }
            ];

            armCoords.forEach(ac => {
                const armGeo = new THREE.CylinderGeometry(0.3, 0.3, 5);
                armGeo.rotateZ(Math.PI / 4);
                const arm = new THREE.Mesh(armGeo, armMat);
                arm.position.set(ac.x * 0.5, 0, ac.z * 0.5);
                droneGroup.add(arm);

                // Rotor disc
                const rGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.1, 12);
                const rotor = new THREE.Mesh(rGeo, rotorMat);
                rotor.position.set(ac.x, 0.8, ac.z);
                droneGroup.add(rotor);
            });

            // Blinking strobe light
            const strobeLight = new THREE.PointLight(target.isHostile ? 0xef4444 : 0x10b981, 2.0, 30);
            strobeLight.position.set(0, 1.2, 0);
            droneGroup.add(strobeLight);
        }

        droneGroup.position.set(target.pos.x, target.pos.z, -target.pos.y);
        this.scene.add(droneGroup);
        this.drone3DMeshes[target.id] = droneGroup;
        return droneGroup;
    },

    addWeaponEffect3D: function(type, startPos, endPos, durationSec) {
        this.activeFx3D.push({
            type: type, // 'laser', 'jam', 'interceptor', 'explosion'
            start: new THREE.Vector3(startPos.x, startPos.z || 12, -startPos.y),
            end: new THREE.Vector3(endPos.x, endPos.z || 60, -endPos.y),
            duration: durationSec || 0.8,
            elapsed: 0,
            mesh: null
        });
    },

    update: function(targets, deltaTime, selectedTargetId) {
        if (!this.renderer || !this.scene) return;

        // 1. Update Searchlights animation
        this.searchlights.forEach((sl, idx) => {
            const angle = Date.now() * 0.001 + idx * (Math.PI / 2);
            sl.target.position.x = Math.sin(angle) * 350;
            sl.target.position.z = Math.cos(angle) * 350;
        });

        // 2. Update Weather particles
        if (this.rainParticles) {
            const pos = this.rainParticles.geometry.attributes.position.array;
            for (let i = 1; i < pos.length; i += 3) {
                pos[i] -= deltaTime * 300;
                if (pos[i] < 0) pos[i] = 350;
            }
            this.rainParticles.geometry.attributes.position.needsUpdate = true;
        }

        // 3. Sync and update 3D Drone Meshes
        if (!this.drone3DMeshes) this.drone3DMeshes = {};

        const activeIds = new Set();
        if (targets && targets.length > 0) {
            targets.forEach(t => {
                activeIds.add(t.id);
                let mesh = this.drone3DMeshes[t.id];
                if (!mesh) {
                    mesh = this.createDrone3D(t);
                }

                if (t.status === 'destroyed') {
                    // Falling debris
                    mesh.position.y = Math.max(0, mesh.position.y - deltaTime * 45);
                    mesh.rotation.x += deltaTime * 4;
                    mesh.rotation.z += deltaTime * 5;
                } else {
                    mesh.position.set(t.pos.x, t.pos.z, -t.pos.y);
                    mesh.rotation.y += deltaTime * 2.5; // Rotate rotors
                }
            });
        }

        // Remove old meshes
        for (const id in this.drone3DMeshes) {
            if (!activeIds.has(id)) {
                this.scene.remove(this.drone3DMeshes[id]);
                delete this.drone3DMeshes[id];
            }
        }

        // 4. Update Weapon Visual FX (Lasers, RF Jammer Waves)
        for (let i = this.activeFx3D.length - 1; i >= 0; i--) {
            const fx = this.activeFx3D[i];
            fx.elapsed += deltaTime;
            const progress = fx.elapsed / fx.duration;

            if (progress >= 1.0) {
                if (fx.mesh) this.scene.remove(fx.mesh);
                this.activeFx3D.splice(i, 1);
                continue;
            }

            if (fx.type === 'laser') {
                if (!fx.mesh) {
                    // Create cylinder connecting base to target
                    const dist = fx.start.distanceTo(fx.end);
                    const cylGeo = new THREE.CylinderGeometry(0.8, 0.8, dist, 8);
                    cylGeo.rotateX(Math.PI / 2);
                    const cylMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.9 });
                    fx.mesh = new THREE.Mesh(cylGeo, cylMat);
                    this.scene.add(fx.mesh);
                }
                fx.mesh.position.copy(fx.start).lerp(fx.end, 0.5);
                fx.mesh.lookAt(fx.end);
            }
        }

        // 5. Target Follow Camera Mode
        if (this.cameraMode === 'target_follow' && selectedTargetId && this.drone3DMeshes[selectedTargetId]) {
            const targetPos = this.drone3DMeshes[selectedTargetId].position;
            this.camera.position.set(targetPos.x + 40, targetPos.y + 25, targetPos.z + 50);
            this.camera.lookAt(targetPos);
        }

        this.renderer.render(this.scene, this.camera);
    }
};
