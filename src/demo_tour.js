/**
 * SENTINEL-Drone Guided Demo Tour & Tactical Keyboard Navigation Engine
 * Features:
 * 1. 6-Step Guided Walkthrough for SIH Judges (completable in 30s to 5 mins)
 * 2. Rapid Elevator Pitch Mode
 * 3. Tactical Keyboard Shortcuts (1-8 classify, Q/W/E/R actions, Space pause, Tab toggle 3D/2D, Enter confirm)
 * 4. Interactive Keyboard Help Overlay
 */
window.DemoTourEngine = {
    currentStep: 0,
    isActive: false,

    steps: [
        {
            title: "1. TACTICAL C2 COMMAND INTERFACE & DEFENSE DESIGN",
            badge: "MIL-STD-2525D // OFFLINE EDGE",
            content: "Welcome to <b>SENTINEL-Drone</b>, an AI-enabled Counter-UAS simulation trainer built for unit-level defense readiness. It runs 100% locally on mid-range laptops without cloud dependencies, supporting instant role switching between <b>Trainees</b>, <b>Instructors</b>, and <b>Admins</b>.",
            targetTab: "radar",
            highlightSelector: "#topNavHeader"
        },
        {
            title: "2. 3D WEBGL SIMULATION & 2D PULSE RADAR",
            badge: "DUAL ENGINE SIMULATION",
            content: "Experience real-time 3D tactical environments (Urban FOB, Rural Field, Coastal Shoreline) with realistic lighting and dynamic drone models. For low-end laptops, switch seamlessly to the <b>lightweight 2D Canvas Radar</b> at 60 FPS with zero GPU overhead.",
            targetTab: "radar",
            highlightSelector: "#simViewContainer"
        },
        {
            title: "3. MULTI-CHANNEL SENSOR FUSION & FLIR PIP CAMERA",
            badge: "SENSOR UNCERTAINTY & EW",
            content: "Fuse data across <b>Pulse Radar</b> (RCS, doppler), <b>RF Spectrum Analysis</b> (433MHz to 5.8GHz protocol decode), <b>Acoustic Harmonics</b> (propeller BPF), and <b>Thermal FLIR PIP Camera</b> (White-Hot/Black-Hot) to identify decoys and camouflaged drones.",
            targetTab: "sensors",
            highlightSelector: "#sensorFusionContainer"
        },
        {
            title: "4. THREAT TRIAGE & COUNTERMEASURE DECISION ENGINE",
            badge: "SPLIT-SECOND TACTICAL RESPONSE",
            content: "Use rapid keyboard shortcuts (<b>1–8</b> to classify, <b>Q/W/E/R</b> to act). Choose <b>Soft-Kill (RF Jammer, GPS Spoofing)</b> or <b>Hard-Kill (Laser DEW, Kinetic Interceptor)</b>. Real-time ROE validation enforces civilian protection and collateral limits.",
            targetTab: "triage",
            highlightSelector: "#threatDecisionBoard"
        },
        {
            title: "5. INSTRUCTOR HUB: SCENARIOS & THREAT DNA LAB",
            badge: "REPRODUCIBLE BENCHMARKING",
            content: "Fitted directly into the <b>Instructor & Admin Command Hub</b>, the Scenarios Lab contains the <b>12 Scripted Defense Training Drills</b> catalog, the <b>Visual Scenario Builder</b> (Terrain, Weather, Swarm Size, Tactics), and procedural <b>Threat DNA</b> generation for reproducible benchmarking across units.",
            targetTab: "director",
            highlightSelector: "#instructor-sub-scenarios"
        },
        {
            title: "6. INSTRUCTOR HUB: AFTER-ACTION COHORT ANALYSIS & AI DEBRIEF",
            badge: "6-METRIC WEIGHTED EVALUATION",
            content: "Also housed inside the Instructor section, the <b>After-Action Review (AAR) & Cohort Dossier</b> provides multi-cadet evaluation: <b>6 Weighted Metrics</b>, <b>6-Axis Skill Radar</b>, <b>Timeline Scrubber</b>, <b>Procedural Faults Heatmap</b>, <b>What-You-Did vs Doctrine matrix</b>, <b>Unit Readiness Leaderboard</b>, and one-click printable Dossier exports.",
            targetTab: "aar",
            highlightSelector: "#instructor-sub-analysis"
        }
    ],

    startTour: function() {
        this.currentStep = 0;
        this.isActive = true;
        this.renderTourModal();
    },

    nextStep: function() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderTourModal();
        } else {
            this.closeTour();
        }
    },

    prevStep: function() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderTourModal();
        }
    },

    closeTour: function() {
        this.isActive = false;
        const modal = document.getElementById('demoTourModal');
        if (modal) modal.classList.add('hidden');
    },

    renderTourModal: function() {
        let modal = document.getElementById('demoTourModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'demoTourModal';
            document.body.appendChild(modal);
        }

        const step = this.steps[this.currentStep];

        // Switch to relevant tab with clearance elevation during tour
        if (window.SimulationApp && step.targetTab) {
            if ((step.targetTab === 'director' || step.targetTab === 'aar' || step.targetTab === 'instructor') && window.SimulationApp.currentRole === 'trainee') {
                window.SimulationApp.loginWithRole('instructor', 'USER-INST-01', 'Capt. Ananya Sen', 'Air Defense Academy HQ', 'Captain');
            }
            window.SimulationApp.switchTab(step.targetTab);
        }

        modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4";
        modal.innerHTML = `
            <div class="bg-surface-container border border-primary/50 rounded-lg max-w-xl w-full p-6 shadow-2xl shadow-primary/10 flex flex-col gap-4 font-sans text-on-surface animate-in fade-in zoom-in-95 duration-200">
                <div class="flex items-center justify-between border-b border-surface-container-high pb-3">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                        <span class="font-mono text-xs font-bold text-primary tracking-widest uppercase">SIH DEMO WALKTHROUGH</span>
                        <span class="px-2 py-0.5 rounded bg-surface-container-high font-mono text-[10px] text-tertiary border border-tertiary/30">${step.badge}</span>
                    </div>
                    <span class="font-mono text-xs text-on-surface-variant font-bold">${this.currentStep + 1} / ${this.steps.length}</span>
                </div>

                <div class="flex flex-col gap-2">
                    <h3 class="text-base font-extrabold text-on-surface uppercase tracking-tight">${step.title}</h3>
                    <div class="text-sm text-on-surface-variant leading-relaxed font-sans">${step.content}</div>
                </div>

                <!-- Progress Dots -->
                <div class="flex items-center justify-center gap-1.5 py-1">
                    ${this.steps.map((_, idx) => `
                        <div class="h-1.5 rounded-full transition-all ${idx === this.currentStep ? 'w-6 bg-primary' : 'w-2 bg-surface-container-high'}"></div>
                    `).join('')}
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-surface-container-high">
                    <button class="px-3 py-1.5 rounded font-mono text-xs text-on-surface-variant hover:text-on-surface" onclick="DemoTourEngine.closeTour()">EXIT TOUR</button>
                    <div class="flex items-center gap-2">
                        ${this.currentStep > 0 ? `
                            <button class="px-3 py-1.5 rounded bg-surface-container-high text-on-surface font-mono text-xs hover:bg-surface-container-highest border border-surface-container-highest" onclick="DemoTourEngine.prevStep()">BACK</button>
                        ` : ''}
                        <button class="px-4 py-1.5 rounded bg-primary text-on-primary font-mono text-xs font-bold hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-1" onclick="DemoTourEngine.nextStep()">
                            <span>${this.currentStep === this.steps.length - 1 ? 'FINISH' : 'NEXT STEP'}</span>
                            <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // 2. KEYBOARD SHORTCUTS HANDLER
    setupKeyboardShortcuts: function() {
        window.addEventListener('keydown', (e) => {
            // Ignore keystrokes if typing inside inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

            const key = e.key.toUpperCase();

            // 1-8: Classify Threat
            const classMap = {
                '1': 'bird',
                '2': 'civilian',
                '3': 'recon',
                '4': 'kamikaze',
                '5': 'payload',
                '6': 'decoy',
                '7': 'swarm_node',
                '8': 'unknown'
            };

            if (classMap[key] && window.SimulationApp) {
                e.preventDefault();
                window.SimulationApp.classifySelected(classMap[key]);
                return;
            }

            // Q/W/E/R: Common Actions
            if (key === 'Q' && window.SimulationApp) {
                e.preventDefault();
                window.SimulationApp.executeAction('track');
            } else if (key === 'W' && window.SimulationApp) {
                e.preventDefault();
                window.SimulationApp.executeAction('jam');
            } else if (key === 'E' && window.SimulationApp) {
                e.preventDefault();
                window.SimulationApp.executeAction('laser');
            } else if (key === 'R' && window.SimulationApp) {
                e.preventDefault();
                window.SimulationApp.executeAction('alert');
            } else if (e.code === 'Space' && window.SimulationApp) {
                e.preventDefault();
                window.SimulationApp.togglePause();
            } else if (key === 'TAB' && window.SimulationApp) {
                e.preventDefault();
                window.SimulationApp.toggleView3D2D();
            } else if (key === 'ENTER' && window.SimulationApp) {
                e.preventDefault();
                window.SimulationApp.confirmPrimaryEngagement();
            } else if (key === '?' || (e.shiftKey && e.key === '?')) {
                e.preventDefault();
                this.toggleKeyboardHelpModal();
            }
        });
    },

    toggleKeyboardHelpModal: function() {
        let modal = document.getElementById('keyboardHelpModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'keyboardHelpModal';
            document.body.appendChild(modal);
        }

        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
        } else {
            modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4";
            modal.innerHTML = `
                <div class="bg-surface-container border border-surface-container-highest rounded-lg max-w-lg w-full p-5 shadow-2xl font-mono text-on-surface">
                    <div class="flex items-center justify-between border-b border-surface-container-high pb-2">
                        <span class="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">keyboard</span>
                            TACTICAL KEYBOARD SHORTCUTS
                        </span>
                        <button class="text-on-surface-variant hover:text-on-surface" onclick="document.getElementById('keyboardHelpModal').classList.add('hidden')">✕</button>
                    </div>

                    <div class="grid grid-cols-2 gap-3 py-3 text-xs">
                        <div>
                            <span class="text-secondary font-bold block mb-1">CLASSIFICATION (1–8):</span>
                            <ul class="space-y-1 text-on-surface-variant">
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-bold">1</kbd> Bird / Clutter</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-bold">2</kbd> Civilian Drone</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-bold">3</kbd> Hostile Recon</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-bold">4</kbd> Kamikaze FPV</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-bold">5</kbd> Payload Dropper</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-bold">6</kbd> Decoy Chaff</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-bold">7</kbd> Swarm Node</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-bold">8</kbd> Unknown</li>
                            </ul>
                        </div>
                        <div>
                            <span class="text-secondary font-bold block mb-1">OPERATIONAL CONTROLS:</span>
                            <ul class="space-y-1 text-on-surface-variant">
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-tertiary font-bold">Q</kbd> Track / Designate</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-tertiary font-bold">W</kbd> Soft-Kill Jammer</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-tertiary font-bold">E</kbd> Hard-Kill Laser</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-tertiary font-bold">R</kbd> Alert / Escalate</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-bold">Space</kbd> Pause/Resume</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-bold">Tab</kbd> Toggle 3D / 2D</li>
                                <li><kbd class="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-bold">Enter</kbd> Confirm Decision</li>
                            </ul>
                        </div>
                    </div>

                    <div class="text-right border-t border-surface-container-high pt-2">
                        <button class="bg-primary/20 text-primary px-3 py-1 rounded text-xs hover:bg-primary/30" onclick="document.getElementById('keyboardHelpModal').classList.add('hidden')">DISMISS</button>
                    </div>
                </div>
            `;
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    DemoTourEngine.setupKeyboardShortcuts();
});
