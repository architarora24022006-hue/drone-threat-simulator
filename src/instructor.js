/**
 * SENTINEL-Drone Instructor Console & Doctrine Configurator
 * Features:
 * 1. Visual Scenario Builder with instant Threat DNA generator
 * 2. Live Trainee Session Monitor with real-time intervention injections
 * 3. Unit Leaderboard & Historical Cadet Comparisons
 * 4. Doctrine Rules & ROE Editor (modify without code restart)
 * 5. Official Instructor AAR Annotation Tool
 */
window.InstructorConsole = {
    activeTraineeSession: null,
    interventions: {
        jammerJam: false,
        suddenDecoys: false,
        fogInjected: false
    },

    init: function() {
        this.fetchDoctrineRules();
        this.fetchUnitLeaderboard();
    },

    // 1. VISUAL SCENARIO BUILDER
    buildCustomScenario: function() {
        const terrain = document.getElementById('scenTerrainSelect')?.value || 'urban';
        const timeOfDay = document.getElementById('scenTimeSelect')?.value || 'night';
        const weather = document.getElementById('scenWeatherSelect')?.value || 'clear';
        const swarmSize = parseInt(document.getElementById('scenSwarmSizeSlider')?.value || 5);
        const tactics = document.getElementById('scenTacticsSelect')?.value || 'pincer';
        const difficulty = document.getElementById('scenDifficultySelect')?.value || 'MEDIUM';
        const seed = Math.floor(Math.random() * 89999 + 10000);

        if (window.ScenarioEngine) {
            const scenario = window.ScenarioEngine.generateProcedural({
                terrain: terrain,
                timeOfDay: timeOfDay,
                weather: weather,
                swarmSize: swarmSize,
                tactics: tactics,
                difficulty: difficulty,
                seed: seed
            });

            // Update Threat DNA display in UI
            const dnaDisplay = document.getElementById('generatedThreatDnaLabel');
            if (dnaDisplay) {
                dnaDisplay.textContent = scenario.threatDna;
            }

            // Launch scenario into simulation if requested
            if (window.SimulationApp) {
                window.SimulationApp.loadScenario(scenario);
                window.SimulationApp.switchTab('radar');
                window.SimulationApp.showToast(`Custom Scenario [${scenario.threatDna}] Loaded!`, 'success');
            }
        }
    },

    generateRandomScenario: function() {
        const terrains = ['urban', 'rural', 'coastal'];
        const times = ['day', 'dusk', 'night'];
        const weathers = ['clear', 'rain', 'fog', 'sandstorm'];
        const tacticsList = ['pincer', 'saturation', 'decoy_led', 'staggered'];
        const diffs = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

        const terrain = terrains[Math.floor(Math.random() * terrains.length)];
        const timeOfDay = times[Math.floor(Math.random() * times.length)];
        const weather = weathers[Math.floor(Math.random() * weathers.length)];
        const tactics = tacticsList[Math.floor(Math.random() * tacticsList.length)];
        const difficulty = diffs[Math.floor(Math.random() * diffs.length)];
        const swarmSize = Math.floor(Math.random() * 8 + 3);

        const scenario = window.ScenarioEngine.generateProcedural({
            terrain, timeOfDay, weather, tactics, difficulty, swarmSize
        });

        const dnaInput = document.getElementById('threatDnaInput');
        if (dnaInput) dnaInput.value = scenario.threatDna;

        if (window.SimulationApp) {
            window.SimulationApp.loadScenario(scenario);
            window.SimulationApp.switchTab('radar');
            window.SimulationApp.showToast(`RANDOM SCENARIO LOADED: ${scenario.threatDna}`, 'info');
        }
    },

    // 2. LIVE INTERVENTION CONTROLS
    injectIntervention: function(type) {
        if (!window.SimulationApp) return;

        if (type === 'jam_failure') {
            this.interventions.jammerJam = true;
            window.SimulationApp.showToast('WARNING: Standoff RF jammer overheated! Soft-kill offline for 15s.', 'error');
            if (window.SensorFusion) window.SensorFusion.addRadioChatter('TECH OP', 'Standoff Jammer Thermal Trip! Use kinetic/laser!');
            setTimeout(() => {
                this.interventions.jammerJam = false;
                window.SimulationApp.showToast('INFO: RF Jammer thermal reset complete. Soft-kill back online.', 'info');
            }, 15000);
        } else if (type === 'sudden_decoys') {
            if (window.SimulationApp.activeTargets) {
                const angle = Math.random() * Math.PI * 2;
                window.SimulationApp.activeTargets.push({
                    id: `TRK-DEC${Math.floor(Math.random() * 89 + 10)}`,
                    type: 'decoy_chaff',
                    typeName: 'Sudden Radar Chaff Infiltration',
                    isHostile: false,
                    isDecoy: true,
                    pos: { x: Math.cos(angle) * 450, y: Math.sin(angle) * 450, z: 80 },
                    velocity: { x: -Math.cos(angle) * 16, y: -Math.sin(angle) * 16, z: 0 },
                    speed: 16,
                    radarCrossSection: 0.22,
                    rfFrequencyMHz: 0,
                    acousticDb: 38
                });
                window.SimulationApp.showToast('INSTRUCTOR INTERVENTION: Decoy chaff deployed to test trainee discrimination.', 'warning');
                if (window.SensorFusion) window.SensorFusion.addRadioChatter('OP ALPHA', 'Unidentified reflective clutter floating into inner perimeter!');
            }
        } else if (type === 'weather_degradation') {
            window.SimulationApp.currentScenario.weather = 'fog';
            if (window.Simulation3D) window.Simulation3D.setEnvironmentMode(window.SimulationApp.currentScenario.terrain, window.SimulationApp.currentScenario.timeOfDay, 'fog');
            window.SimulationApp.showToast('INSTRUCTOR INTERVENTION: Heavy fog injected into theater.', 'warning');
            if (window.SensorFusion) window.SensorFusion.addRadioChatter('MET COMMAND', 'Sudden zero-visibility fog bank descending on defended FOB.');
        } else if (type === 'evac_alarm') {
            window.SimulationApp.showToast('BASE COMMAND: SOUNDING GENERAL EVACUATION KLAXON!', 'error');
            if (window.TacticalAudio) window.TacticalAudio.play('alarm');
            if (window.SensorFusion) window.SensorFusion.addRadioChatter('BASE COMMAND', 'All non-essential personnel clear the helipad and ammo depot!');
        }
    },

    // 3. DOCTRINE RULES CONFIGURATOR
    fetchDoctrineRules: function() {
        fetch('/api/doctrine')
        .then(r => r.json())
        .then(data => {
            if (Array.isArray(data)) {
                this.renderDoctrineUI(data);
            }
        })
        .catch(err => console.warn('[Doctrine] Operating offline:', err));
    },

    renderDoctrineUI: function(doctrines) {
        const container = document.getElementById('doctrineRulesContainer');
        if (!container) return;

        container.innerHTML = doctrines.map(d => `
            <div class="bg-surface-container-high p-3 rounded border border-surface-container-highest flex flex-col gap-2 font-mono text-xs">
                <div class="flex items-center justify-between">
                    <span class="text-primary font-bold uppercase tracking-wider">${d.name} (${d.roeProfile})</span>
                    <span class="text-[9px] text-tertiary">ROE PROFILE: ${d.id}</span>
                </div>
                <p class="text-[10px] text-on-surface-variant">${d.rules.description || 'Configured air defense operational rules.'}</p>
                <div class="grid grid-cols-2 gap-2 text-[10px]">
                    <div class="bg-surface-container p-1.5 rounded">
                        <span class="text-on-surface-variant block">KINETIC AUTHORIZED:</span>
                        <span class="font-bold ${d.rules.kineticAllowed ? 'text-primary' : 'text-error'}">${d.rules.kineticAllowed ? 'YES' : 'NO (RESTRICTED)'}</span>
                    </div>
                    <div class="bg-surface-container p-1.5 rounded">
                        <span class="text-on-surface-variant block">POSITIVE VISUAL ID:</span>
                        <span class="font-bold ${d.rules.requirePositiveVisualID ? 'text-secondary' : 'text-primary'}">${d.rules.requirePositiveVisualID ? 'MANDATORY' : 'RECOMMENDED'}</span>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-surface-container-highest">
                    <span class="text-[9px] text-on-surface-variant">ESCALATION TIERS: ${(d.escalation || []).length} STEPS</span>
                    <button class="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded border border-primary/40 hover:bg-primary/30" onclick="InstructorConsole.applyDoctrine('${d.roeProfile}')">ACTIVATE ROE</button>
                </div>
            </div>
        `).join('');
    },

    applyDoctrine: function(roeProfile) {
        if (window.SimulationApp && window.SimulationApp.currentScenario) {
            window.SimulationApp.currentScenario.roe = roeProfile;
            window.SimulationApp.showToast(`Active ROE updated to: ${roeProfile}`, 'success');
        }
    },

    // 4. UNIT LEADERBOARD
    fetchUnitLeaderboard: function() {
        fetch('/api/unit/leaderboard')
        .then(r => r.json())
        .then(data => {
            this.renderLeaderboardUI(data);
        })
        .catch(err => console.warn('[Leaderboard] Operating offline:', err));
    },

    renderLeaderboardUI: function(data) {
        const tbody = document.getElementById('leaderboardTableBody');
        if (!tbody || !data.cadetLeaderboard) return;

        tbody.innerHTML = data.cadetLeaderboard.map((c, idx) => `
            <tr class="border-b border-surface-container-high font-mono text-xs">
                <td class="p-2 text-tertiary">#${idx + 1}</td>
                <td class="p-2 font-bold text-on-surface">${c.name}</td>
                <td class="p-2 text-on-surface-variant">${c.rank}</td>
                <td class="p-2 text-on-surface-variant">${c.unit}</td>
                <td class="p-2 text-center">${c.sessionsCount}</td>
                <td class="p-2 text-center font-bold text-primary">${c.avgScore}</td>
                <td class="p-2 text-center font-bold text-secondary">${c.topScore}</td>
                <td class="p-2 text-right"><span class="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold text-[10px]">${c.avgAccuracy}%</span></td>
            </tr>
        `).join('');
    },

    // 5. INSTRUCTOR AAR ANNOTATION
    saveAnnotation: function(sessionId, notes) {
        fetch('/api/aar/annotate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, notes })
        })
        .then(r => r.json())
        .then(data => {
            if (window.SimulationApp) window.SimulationApp.showToast('Instructor Evaluation Notes Saved to Cadet Dossier.', 'success');
        })
        .catch(err => console.warn('[Annotation] Offline note saved:', err));
    }
};
