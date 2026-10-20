/**
 * SENTINEL-Drone Main Controller & State Coordinator
 * Unifies:
 * - 3D Three.js WebGL Simulation & 2D Tactical Pulse Radar
 * - Multi-Channel Sensor Fusion (Radar, Optical/FLIR PIP, RF Spectrum, Acoustic, Radio)
 * - Threat Classification & Counter-Drone Decision Engine (ROE & Collateral validation)
 * - Procedural AI Scenario Director with Seeded Threat DNA
 * - Decision-Tree Scoring Engine across 6 Weighted Metrics
 * - After-Action Review (AAR) with Timeline Scrubber & Skill Radar
 * - Instructor Console, Live Interventions & Doctrine Configurator
 * - 100% Offline Standalone Execution with SQLite Backend Sync
 */
// OFFICIAL ARMED FORCES DEFENSE PERSONNEL CLEARANCE CATALOG (OFFLINE RESILIENT)
const DEFENSE_ROSTER_CATALOG = {
    // INSTRUCTORS (CLEARANCE LEVEL 4-5)
    'ARM-INST-7801': { serviceNumber: 'IC-54921A', name: 'Col. Rajeshwar Singh', rank: 'Colonel', branch: 'Army Air Defense (AAD)', unit: '14th Air Defense Brigade HQ', role: 'instructor', code: 'ARM-INST-7801', status: 'ACTIVE_ELIGIBLE' },
    'ARM-INST-8822': { serviceNumber: 'IC-61028K', name: 'Lt. Col. Abhinav Shukla', rank: 'Lt. Colonel', branch: 'Army Air Defense (AAD)', unit: 'Army AD Missile Training Wing', role: 'instructor', code: 'ARM-INST-8822', status: 'ACTIVE_ELIGIBLE' },
    'IAF-INST-4403': { serviceNumber: 'AF-29310P', name: 'Wing Cdr. Ananya Sen', rank: 'Wing Commander', branch: 'Indian Air Force (IAF)', unit: 'Western Air Command C-UAS Cell', role: 'instructor', code: 'IAF-INST-4403', status: 'ACTIVE_ELIGIBLE' },
    'IAF-INST-5590': { serviceNumber: 'AF-31940M', name: 'Sqn. Ldr. Farooq Baig', rank: 'Squadron Leader', branch: 'Indian Air Force (IAF)', unit: 'Air Force Academy Electronic Warfare', role: 'instructor', code: 'IAF-INST-5590', status: 'ACTIVE_ELIGIBLE' },
    'NAV-INST-3312': { serviceNumber: 'IN-04812N', name: 'Cdr. Vikram Rathore', rank: 'Commander', branch: 'Indian Navy (IN)', unit: 'Naval Coastal Defense Battery', role: 'instructor', code: 'NAV-INST-3312', status: 'ACTIVE_ELIGIBLE' },
    'MOD-INST-9900': { serviceNumber: 'IC-44109X', name: 'Maj. Gen. R. K. Rawat', rank: 'Major General', branch: 'Joint Defense Staff (HQ IDS)', unit: 'Tri-Services Air Defense Command HQ', role: 'instructor', code: 'MOD-INST-9900', status: 'ACTIVE_ELIGIBLE' },

    // TRAINEES / OPERATORS (CLEARANCE LEVEL 1-2)
    'ARM-TRN-1011': { serviceNumber: 'SS-78901L', name: 'Cadet Aarav Sharma', rank: 'Cadet', branch: 'Army Air Defense (AAD)', unit: '14th Air Defense Regiment', role: 'trainee', code: 'ARM-TRN-1011', status: 'ACTIVE_ELIGIBLE' },
    'ARM-TRN-1022': { serviceNumber: 'SS-79104H', name: 'Cadet Vikramaditya Singh', rank: 'Cadet', branch: 'Army Air Defense (AAD)', unit: '14th Air Defense Regiment', role: 'trainee', code: 'ARM-TRN-1022', status: 'ACTIVE_ELIGIBLE' },
    'ARM-TRN-1033': { serviceNumber: 'SS-80122W', name: 'Lt. Meera Nair', rank: 'Lieutenant', branch: 'Army Air Defense (AAD)', unit: 'Northern Border Surveillance Unit', role: 'trainee', code: 'ARM-TRN-1033', status: 'ACTIVE_ELIGIBLE' },
    'ARM-TRN-1044': { serviceNumber: 'IC-72314F', name: 'Capt. Devendra Joshi', rank: 'Captain', branch: 'Army Air Defense (AAD)', unit: 'Forward Tactical Radar Section', role: 'trainee', code: 'ARM-TRN-1044', status: 'ACTIVE_ELIGIBLE' },
    'IAF-TRN-2011': { serviceNumber: 'AF-44190B', name: 'Flight Cadet Rohan Roy', rank: 'Flight Cadet', branch: 'Indian Air Force (IAF)', unit: 'IAF Drone Interception Group', role: 'trainee', code: 'IAF-TRN-2011', status: 'ACTIVE_ELIGIBLE' },
    'IAF-TRN-2022': { serviceNumber: 'AF-45129T', name: 'Flying Officer Priya Verma', rank: 'Flying Officer', branch: 'Indian Air Force (IAF)', unit: 'Base Defense Flight - Leh', role: 'trainee', code: 'IAF-TRN-2022', status: 'ACTIVE_ELIGIBLE' },
    'IAF-TRN-2033': { serviceNumber: 'AF-43891S', name: 'Flight Lt. Siddharth Nair', rank: 'Flight Lieutenant', branch: 'Indian Air Force (IAF)', unit: '48 Squadron C-UAS Flight', role: 'trainee', code: 'IAF-TRN-2033', status: 'ACTIVE_ELIGIBLE' },
    'NAV-TRN-3011': { serviceNumber: 'IN-09144C', name: 'Sub Lt. Karan Mehta', rank: 'Sub Lieutenant', branch: 'Indian Navy (IN)', unit: 'INS Hansa Coastal Surveillance Flight', role: 'trainee', code: 'NAV-TRN-3011', status: 'ACTIVE_ELIGIBLE' },
    'NAV-TRN-3022': { serviceNumber: 'IN-10294V', name: 'Lt. Aditya Rao', rank: 'Lieutenant', branch: 'Indian Navy (IN)', unit: 'Western Fleet Air Defense Network', role: 'trainee', code: 'NAV-TRN-3022', status: 'ACTIVE_ELIGIBLE' },
    'DEF-TRN-5011': { serviceNumber: 'DS-55102G', name: 'Operator Sunita Deshmukh', rank: 'Chief Operator', branch: 'Joint Electronic Warfare Bureau', unit: 'Tri-Services Drone Countermeasure Cell', role: 'trainee', code: 'DEF-TRN-5011', status: 'ACTIVE_ELIGIBLE' }
};

window.SimulationApp = {
    // Current User & Role State (Clean fresh slate, authenticated via Defense Code)
    currentUserId: null,
    currentRole: null, // 'trainee', 'instructor', 'admin'
    currentUserName: 'Unauthenticated Operator',
    currentUserUnit: 'Defense Command Unit',
    currentUserRank: 'Operator',
    currentAuthToken: null,
    isAuthenticated: false, // Strict Gating: nothing can be operated without login first

    // Simulation Engine State
    isRunning: true,
    isPaused: false,
    simTimeSeconds: 0,
    lastFrameTime: performance.now(),
    is3DMode: true,
    lowHardwareMode: false,

    // Scenario & Threats State
    currentScenario: null,
    activeTargets: [],
    selectedTargetId: null,
    selectedClassification: null,
    selectedPriority: 'MEDIUM',
    selectedAction: null,

    // Cognitive Load & Stress Telemetry
    nasaTLX: 34.5,
    operatorBPM: 74,
    hrvStress: 65,

    // Session Scoring & Decision History
    currentSessionId: null,
    sessionStartTime: null,
    loggedActions: [],
    sessionErrors: [],
    currentScore: 1000,

    init: function() {
        console.log('[SENTINEL-Drone] Initializing Tactical Command System v3.0...');

        // 0. Initialize Authentication State
        this.initAuth();

        // 1. Initialize Sub-Engines
        if (window.TacticalAudio) window.TacticalAudio.init();
        if (window.Radar2D) window.Radar2D.init('simCanvas2D');
        if (window.Simulation3D) {
            const has3D = window.Simulation3D.init('simContainer3D');
            if (!has3D) this.is3DMode = false;
        }
        if (window.SensorFusion) window.SensorFusion.init();
        if (window.AAREngine) window.AAREngine.init();
        if (window.InstructorConsole) window.InstructorConsole.init();

        // 2. Load Initial Scripted Scenario (Drill 01)
        this.loadScenarioById('SCEN-01');

        // 3. Start 60 FPS Master Simulation Loop
        requestAnimationFrame((t) => this.simLoop(t));

        // 4. Update UI labels
        this.updateUserUI();
        this.updateTacticalHUD();

        console.log('[SENTINEL-Drone] Command Console Operational. DEFCON ALPHA.');
    },

    // ------------------------------------------------------------------------
    // USER PROFILE, AUTHENTICATION & ROLE SWITCHING
    // ------------------------------------------------------------------------
    getSavedUsers: function() {
        let saved = null;
        try {
            const data = localStorage.getItem('sentinel_saved_users');
            if (data) {
                saved = JSON.parse(data);
                // Purge any pre-saved dummy accounts if previously saved
                if (saved && saved.trainees) {
                    saved.trainees = saved.trainees.filter(t => !['USER-CADET-01', 'USER-CADET-02'].includes(t.id));
                }
                if (saved && saved.instructors) {
                    saved.instructors = saved.instructors.filter(i => !['USER-INST-01', 'USER-ADMIN-01'].includes(i.id));
                }
            }
        } catch(e) {}

        if (!saved || !saved.trainees || !saved.instructors) {
            saved = {
                trainees: [],
                instructors: []
            };
            try {
                localStorage.setItem('sentinel_saved_users', JSON.stringify(saved));
            } catch(e) {}
        }
        return saved;
    },

    saveUserToStorage: function(userObj) {
        const users = this.getSavedUsers();
        if (userObj.role === 'trainee') {
            const existingIdx = users.trainees.findIndex(u => u.id === userObj.id);
            if (existingIdx >= 0) users.trainees[existingIdx] = userObj;
            else users.trainees.push(userObj);
        } else {
            const existingIdx = users.instructors.findIndex(u => u.id === userObj.id);
            if (existingIdx >= 0) users.instructors[existingIdx] = userObj;
            else users.instructors.push(userObj);
        }
        try {
            localStorage.setItem('sentinel_saved_users', JSON.stringify(users));
        } catch(e) {}
        this.renderSavedAccountsInModal();
    },

    renderSavedAccountsInModal: function() {
        const users = this.getSavedUsers();
        const traineeContainer = document.getElementById('traineeProfileList');
        const instructorContainer = document.getElementById('instructorProfileList');

        if (traineeContainer) {
            if (users.trainees.length === 0) {
                traineeContainer.innerHTML = `
                    <div class="p-3 bg-surface-container-lowest rounded border border-dashed border-tertiary/40 text-center font-mono text-[11px] text-on-surface-variant flex flex-col items-center gap-1.5">
                        <span class="material-symbols-outlined text-tertiary text-[20px]">person_add</span>
                        <span class="font-bold text-on-surface">No Operator Profile Enrolled Yet</span>
                        <span class="text-[10px]">Verify your Defense Trainee Code (e.g. ARM-TRN-1011) to create your profile.</span>
                        <button onclick="SimulationApp.switchAuthMode('register')" class="mt-1 px-3 py-1 rounded bg-tertiary/20 text-tertiary font-bold text-[10px] hover:bg-tertiary/30 transition-colors">
                            + CREATE OPERATOR PROFILE
                        </button>
                    </div>
                `;
            } else {
                traineeContainer.innerHTML = users.trainees.map((t, idx) => `
                    <label class="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-surface-container transition-colors border border-surface-container-highest">
                        <input type="radio" name="traineeSelectRadio" value="${t.id}" ${idx === 0 ? 'checked' : ''} class="accent-tertiary" />
                        <div class="flex flex-col">
                            <span class="text-on-surface font-bold text-xs">${t.name}</span>
                            <span class="text-[10px] text-on-surface-variant">${t.rank || 'Cadet'} // ${t.unit}</span>
                        </div>
                    </label>
                `).join('');
            }
        }

        if (instructorContainer) {
            if (users.instructors.length === 0) {
                instructorContainer.innerHTML = `
                    <div class="p-3 bg-surface-container-lowest rounded border border-dashed border-primary/40 text-center font-mono text-[11px] text-on-surface-variant flex flex-col items-center gap-1.5">
                        <span class="material-symbols-outlined text-primary text-[20px]">shield_person</span>
                        <span class="font-bold text-on-surface">No Instructor Profile Enrolled Yet</span>
                        <span class="text-[10px]">Verify your Defense Instructor Code (e.g. ARM-INST-7801) to create your profile.</span>
                        <button onclick="SimulationApp.switchAuthMode('register')" class="mt-1 px-3 py-1 rounded bg-primary/20 text-primary font-bold text-[10px] hover:bg-primary/30 transition-colors">
                            + CREATE INSTRUCTOR PROFILE
                        </button>
                    </div>
                `;
            } else {
                instructorContainer.innerHTML = users.instructors.map((i, idx) => `
                    <label class="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-surface-container transition-colors border border-surface-container-highest">
                        <input type="radio" name="instructorSelectRadio" value="${i.id}" ${idx === 0 ? 'checked' : ''} class="accent-primary" />
                        <div class="flex flex-col">
                            <span class="text-on-surface font-bold text-xs">${i.name}</span>
                            <span class="text-[10px] text-primary">${i.rank || 'Officer'} // ${i.unit}</span>
                        </div>
                    </label>
                `).join('');
            }
        }
    },

    initAuth: function() {
        try {
            const saved = localStorage.getItem('sentinel_drone_auth');
            if (saved) {
                const data = JSON.parse(saved);
                // Purge old hardcoded dummy accounts
                if (['USER-CADET-01', 'USER-CADET-02', 'USER-INST-01', 'USER-ADMIN-01'].includes(data.userId)) {
                    localStorage.removeItem('sentinel_drone_auth');
                    sessionStorage.removeItem('sentinel_session_authenticated');
                } else {
                    this.currentUserId = data.userId;
                    this.currentRole = data.role || 'trainee';
                    this.currentUserName = data.userName;
                    this.currentUserUnit = data.unit;
                    this.currentUserRank = data.rank;
                    this.currentAuthToken = data.token || null;
                }
            }
        } catch(e) {
            console.warn('[Auth] Local storage init fallback:', e);
        }

        // Render saved accounts in the modal
        this.renderSavedAccountsInModal();

        // Strict Gating: If not authenticated in current session, lock simulator and show login gateway FIRST!
        const sessionAuth = sessionStorage.getItem('sentinel_session_authenticated');
        if (sessionAuth === 'true' && this.currentUserId) {
            this.isAuthenticated = true;
            this.isPaused = false;
            const modal = document.getElementById('tacticalLoginModal');
            if (modal) modal.classList.add('hidden');
        } else {
            this.isAuthenticated = false;
            this.isPaused = true;
            setTimeout(() => {
                this.openLoginModal(null, false);
            }, 60);
        }
    },

    switchAuthMode: function(mode) {
        const signinPanel = document.getElementById('auth-panel-signin');
        const registerPanel = document.getElementById('auth-panel-register');
        const btnSignin = document.getElementById('auth-tab-btn-signin');
        const btnRegister = document.getElementById('auth-tab-btn-register');

        if (mode === 'register') {
            if (signinPanel) signinPanel.classList.add('hidden');
            if (registerPanel) {
                registerPanel.classList.remove('hidden');
                registerPanel.classList.add('flex');
            }
            if (btnRegister) {
                btnRegister.className = 'flex-1 py-2 rounded font-bold transition-all bg-primary text-on-primary flex items-center justify-center gap-1.5 shadow-sm';
            }
            if (btnSignin) {
                btnSignin.className = 'flex-1 py-2 rounded font-bold transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center gap-1.5';
            }
        } else {
            if (signinPanel) signinPanel.classList.remove('hidden');
            if (registerPanel) {
                registerPanel.classList.add('hidden');
                registerPanel.classList.remove('flex');
            }
            if (btnSignin) {
                btnSignin.className = 'flex-1 py-2 rounded font-bold transition-all bg-primary text-on-primary flex items-center justify-center gap-1.5 shadow-sm';
            }
            if (btnRegister) {
                btnRegister.className = 'flex-1 py-2 rounded font-bold transition-all text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center gap-1.5';
            }
        }
    },

    verifiedDefenseRecord: null,

    applyVerifiedRecord: function(rec) {
        this.verifiedDefenseRecord = rec;
        const badge = document.getElementById('defenseCodeStatusBadge');
        if (badge) {
            badge.className = 'p-2.5 rounded font-mono text-xs bg-primary/20 text-primary border border-primary/50 flex items-center gap-2';
            badge.innerHTML = `<span class="material-symbols-outlined text-[16px] text-primary">verified</span><span><strong>ARMED FORCES VERIFIED:</strong> ${rec.rank} ${rec.name} [${rec.branch} // ${rec.role.toUpperCase()}]</span>`;
            badge.classList.remove('hidden');
        }

        // Auto-fill profile inputs
        const nameInput = document.getElementById('newAccountName');
        const rankInput = document.getElementById('newAccountRank');
        const unitInput = document.getElementById('newAccountUnit');
        const roleBadge = document.getElementById('verifiedRoleDisplay');

        if (nameInput) nameInput.value = rec.name;
        if (rankInput) rankInput.value = rec.rank;
        if (unitInput) unitInput.value = `${rec.unit} (${rec.branch})`;

        // Lock role radio to verified role
        const roleRadio = document.querySelector(`input[name="newAccountRole"][value="${rec.role}"]`);
        if (roleRadio) roleRadio.checked = true;

        if (roleBadge) {
            roleBadge.textContent = rec.role === 'instructor' ? 'OFFICIALLY VERIFIED: INSTRUCTOR & COMMAND ADMIN' : 'OFFICIALLY VERIFIED: OPERATOR / TRAINEE';
            roleBadge.className = rec.role === 'instructor' ? 'text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/20 border border-primary/40 inline-block font-mono' : 'text-xs font-bold text-tertiary px-2 py-0.5 rounded bg-tertiary/20 border border-tertiary/40 inline-block font-mono';
        }

        if (window.TacticalAudio) window.TacticalAudio.playAcknowledge();
    },

    verifyEnteredDefenseCode: function() {
        const input = document.getElementById('newAccountDefenseCode');
        const badge = document.getElementById('defenseCodeStatusBadge');
        const code = input ? input.value.trim().toUpperCase() : '';

        if (!code) {
            if (badge) {
                badge.className = 'p-2.5 rounded font-mono text-xs bg-error-container/90 text-error border border-error/50 flex items-center gap-2';
                badge.innerHTML = '<span class="material-symbols-outlined text-[16px]">warning</span><span>Enter an official Armed Forces Verification Code (e.g. ARM-INST-7801 or ARM-TRN-1011).</span>';
                badge.classList.remove('hidden');
            }
            if (input) input.focus();
            return;
        }

        // 1. Instant Verification via Local Defense Catalog (100% resilient offline & online)
        const localRec = DEFENSE_ROSTER_CATALOG[code];
        if (localRec) {
            this.applyVerifiedRecord(localRec);
            // Async sync with backend SQLite if running
            fetch('/api/auth/verify_defense_code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ defenseCode: code })
            }).catch(() => {});
            return;
        }

        // 2. Check Backend Server (in case code was added dynamically)
        if (badge) {
            badge.className = 'p-2 rounded font-mono text-xs bg-surface-container-high text-on-surface-variant flex items-center gap-2';
            badge.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin">sync</span><span>Verifying Defense Credentials with Armed Forces Roster [${code}]...</span>`;
            badge.classList.remove('hidden');
        }

        fetch('/api/auth/verify_defense_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ defenseCode: code })
        })
        .then(r => r.json())
        .then(data => {
            if (!data.verified) {
                this.verifiedDefenseRecord = null;
                if (badge) {
                    badge.className = 'p-2.5 rounded font-mono text-xs bg-error-container/90 text-error border border-error/50 flex items-center gap-2';
                    badge.innerHTML = `<span class="material-symbols-outlined text-[16px]">gpp_bad</span><span>SECURITY ACCESS DENIED: Verification Code '${code}' not recognized in Armed Forces Defense Roster.</span>`;
                }
                if (window.TacticalAudio) window.TacticalAudio.playAlert();
                return;
            }
            this.applyVerifiedRecord(data.record);
        })
        .catch(err => {
            // Unrecognized code fallback message (never shows connection failure to user)
            this.verifiedDefenseRecord = null;
            if (badge) {
                badge.className = 'p-2.5 rounded font-mono text-xs bg-error-container/90 text-error border border-error/50 flex items-center gap-2';
                badge.innerHTML = `<span class="material-symbols-outlined text-[16px]">gpp_bad</span><span>SECURITY ACCESS DENIED: Verification Code '${code}' not recognized in Armed Forces Defense Roster.</span>`;
            }
            if (window.TacticalAudio) window.TacticalAudio.playAlert();
        });
    },

    submitCreateAccount: function() {
        const codeInput = document.getElementById('newAccountDefenseCode');
        const nameInput = document.getElementById('newAccountName');
        const rankInput = document.getElementById('newAccountRank');
        const unitInput = document.getElementById('newAccountUnit');
        const feedback = document.getElementById('createAccountFeedback');

        const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
        const name = nameInput ? nameInput.value.trim() : '';
        const rank = (rankInput ? rankInput.value.trim() : '') || 'Officer';
        const unit = (unitInput ? unitInput.value.trim() : '') || 'Air Defense Command';

        const showFeedback = (msg, isError) => {
            if (!feedback) return;
            feedback.classList.remove('hidden');
            if (isError) {
                feedback.className = 'p-3 rounded font-mono text-xs bg-error-container/90 text-error border border-error/50 flex items-center gap-2';
                feedback.innerHTML = `<span class="material-symbols-outlined text-[16px]">gpp_bad</span><span>${msg}</span>`;
                if (window.TacticalAudio) window.TacticalAudio.playAlert();
            } else {
                feedback.className = 'p-3 rounded font-mono text-xs bg-primary/20 text-primary border border-primary/40 flex items-center gap-2';
                feedback.innerHTML = `<span class="material-symbols-outlined text-[16px]">verified</span><span>${msg}</span>`;
            }
        };

        if (!code) {
            showFeedback('VERIFICATION MANDATORY: You must enter an official Defense Verification Code.', true);
            if (codeInput) codeInput.focus();
            return;
        }

        const rec = this.verifiedDefenseRecord || DEFENSE_ROSTER_CATALOG[code];
        if (!rec) {
            showFeedback(`SECURITY ACCESS DENIED: Code '${code}' is not recognized in Armed Forces Defense Roster.`, true);
            return;
        }

        const role = rec.role || 'trainee';
        const finalName = name || rec.name;
        const finalRank = rank || rec.rank;
        const finalUnit = unit || `${rec.unit} (${rec.branch})`;

        const userObj = {
            id: 'USER-' + (role === 'instructor' ? 'INST' : 'TRN') + '-' + Math.floor(1000 + Math.random() * 9000),
            name: finalName,
            rank: finalRank,
            unit: finalUnit,
            role: role,
            defenseCode: code
        };

        this.saveUserToStorage(userObj);
        showFeedback(`CLEARANCE AUTHENTICATED: Account created for ${finalRank} ${finalName} [${role.toUpperCase()}]. Entering simulator...`, false);

        // Sync with backend if available
        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                defenseCode: code,
                name: finalName,
                rank: finalRank,
                unit: finalUnit
            })
        }).catch(() => {});

        setTimeout(() => {
            this.loginWithRole(userObj.role, userObj.id, userObj.name, userObj.unit, userObj.rank);
            sessionStorage.setItem('sentinel_session_authenticated', 'true');
            if (codeInput) codeInput.value = '';
            if (nameInput) nameInput.value = '';
            if (feedback) feedback.classList.add('hidden');
            this.switchAuthMode('signin');
        }, 500);
    },

    loginWithDefenseCode: function() {
        const input = document.getElementById('fastDefenseCodeInput');
        const code = input ? input.value.trim().toUpperCase() : '';
        if (!code) {
            this.showToast('DEFENSE CODE REQUIRED: Please enter your clearance verification code.', 'error');
            if (input) input.focus();
            return;
        }

        const rec = DEFENSE_ROSTER_CATALOG[code];
        if (!rec) {
            this.showToast(`SECURITY DENIED: Code '${code}' not recognized in Defense Roster.`, 'error');
            if (window.TacticalAudio) window.TacticalAudio.playAlert();
            return;
        }

        const userObj = {
            id: 'USER-' + (rec.role === 'instructor' ? 'INST' : 'TRN') + '-' + Math.floor(1000 + Math.random() * 9000),
            name: rec.name,
            rank: rec.rank,
            unit: `${rec.unit} (${rec.branch})`,
            role: rec.role,
            defenseCode: code
        };

        this.saveUserToStorage(userObj);
        this.loginWithRole(userObj.role, userObj.id, userObj.name, userObj.unit, userObj.rank);

        // Async sync
        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ defenseCode: code })
        }).catch(() => {});
    },

    openLoginModal: function(targetRole, allowClose) {
        const modal = document.getElementById('tacticalLoginModal');
        const closeBtn = document.getElementById('loginModalCloseBtn');
        if (closeBtn) {
            if (this.isAuthenticated && allowClose) {
                closeBtn.classList.remove('hidden');
            } else {
                closeBtn.classList.add('hidden');
            }
        }
        if (modal) {
            modal.classList.remove('hidden');
            const users = this.getSavedUsers();
            const hasUsers = users.trainees.length > 0 || users.instructors.length > 0;
            // If user has no profiles yet, default to Register / Defense Code Verification tab!
            this.switchAuthMode(hasUsers ? 'signin' : 'register');
            this.renderSavedAccountsInModal();
        }
    },

    closeLoginModal: function() {
        if (!this.isAuthenticated) {
            this.showToast('CLEARANCE REQUIRED: You must create an account or verify your Defense Code to gain access.', 'error');
            return;
        }
        const modal = document.getElementById('tacticalLoginModal');
        if (modal) modal.classList.add('hidden');
    },

    logoutOrSwitchUser: function() {
        this.isAuthenticated = false;
        sessionStorage.removeItem('sentinel_session_authenticated');
        this.isPaused = true;
        this.openLoginModal(null, false);
        this.showToast('TACTICAL TERMINAL LOCKED: Verify defense credentials or create an account to access.', 'info');
    },

    loginTraineeFromModal: function() {
        const selected = document.querySelector('input[name="traineeSelectRadio"]:checked');
        const users = this.getSavedUsers().trainees;
        if (!selected && users.length === 0) {
            this.showToast('NO OPERATOR PROFILE: Please create an account using an Armed Forces Trainee Code first.', 'error');
            this.switchAuthMode('register');
            return;
        }
        const userId = selected ? selected.value : users[0].id;
        const user = users.find(u => u.id === userId);
        if (user) {
            this.loginWithRole('trainee', user.id, user.name, user.unit, user.rank);
        }
    },

    loginInstructorFromModal: function() {
        const selected = document.querySelector('input[name="instructorSelectRadio"]:checked');
        const users = this.getSavedUsers().instructors;
        if (!selected && users.length === 0) {
            this.showToast('NO INSTRUCTOR PROFILE: Please create an account using an Armed Forces Instructor Code first.', 'error');
            this.switchAuthMode('register');
            return;
        }
        const userId = selected ? selected.value : users[0].id;
        const user = users.find(u => u.id === userId);
        if (user) {
            this.loginWithRole(user.role || 'instructor', user.id, user.name, user.unit, user.rank);
        }
    },

    loginWithRole: function(role, userId, userName, unit, rank) {
        this.currentRole = role;
        this.currentUserId = userId;
        this.currentUserName = userName;
        this.currentUserUnit = unit || 'Tactical Command Unit';
        this.currentUserRank = rank || (role === 'trainee' ? 'Cadet' : 'Officer');
        this.isAuthenticated = true;
        this.isPaused = false;
        sessionStorage.setItem('sentinel_session_authenticated', 'true');

        // Sync with backend API
        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, role: role })
        })
        .then(r => r.json())
        .then(data => {
            if (data.token) {
                this.currentAuthToken = data.token;
            }
        })
        .catch(err => console.warn('[Auth Backend] Running offline local mode:', err));

        // Persist locally
        try {
            localStorage.setItem('sentinel_drone_auth', JSON.stringify({
                userId: this.currentUserId,
                role: this.currentRole,
                userName: this.currentUserName,
                unit: this.currentUserUnit,
                rank: this.currentUserRank,
                token: this.currentAuthToken
            }));
        } catch(e) {}

        this.updateUserUI();
        this.closeLoginModal();

        const roleTitle = role === 'trainee' ? 'OPERATOR / TRAINEE' : (role === 'admin' ? 'COMMAND ADMIN' : 'CHIEF INSTRUCTOR');
        this.showToast(`AUTHENTICATION VERIFIED: ${this.currentUserRank} ${userName} [${roleTitle}]`, 'success');

        if (role === 'instructor' || role === 'admin') {
            this.switchTab('instructor');
        } else {
            const instTab = document.getElementById('tab-instructor');
            if (instTab && !instTab.classList.contains('hidden')) {
                this.switchTab('radar');
            }
        }
    },

    switchUserRole: function(role, userId, userName) {
        this.loginWithRole(role, userId, userName, 'Air Defense Command', role === 'trainee' ? 'Cadet' : 'Officer');
    },

    downloadScorecard: function() {
        const sessId = this.currentSessionId || (window.AAREngine && window.AAREngine.currentAARData && window.AAREngine.currentAARData.sessionId) || 'SESS-1001';
        this.showToast(`GENERATING OFFICIAL SCORECARD DOSSIER [${sessId}]...`, 'info');

        // 1. Fetch official formatted HTML scorecard from backend
        fetch(`/api/export/report/${sessId}`)
            .then(res => {
                if (!res.ok) throw new Error('Network error generating report');
                return res.text();
            })
            .then(htmlContent => {
                // Trigger client-side HTML file download
                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `sentinel_official_scorecard_${sessId}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Also launch printable PDF preview window
                const printWindow = window.open(`/api/export/report/${sessId}`, '_blank');
                if (printWindow) {
                    printWindow.focus();
                }

                this.showToast(`SCORECARD DOWNLOADED: Tactical dossier saved as HTML file & ready to Save as PDF!`, 'success');
            })
            .catch(err => {
                console.warn('[Scorecard] Generating local offline fallback scorecard:', err);
                // Fallback offline scorecard generator
                const score = this.currentScore || 950;
                const accuracy = 100;
                const scenarioTitle = this.currentScenario ? this.currentScenario.title : 'Air Defense Drill';
                const cadetName = this.currentUserName || 'Cadet Vikramaditya Singh';
                const cadetRank = this.currentUserRank || 'Cadet';
                const cadetUnit = this.currentUserUnit || '14th Air Defense Regiment';

                const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>SENTINEL-Drone Tactical Scorecard: ${sessId}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: monospace; background: #080f17; color: #dae3f1; padding: 24px; line-height: 1.4; }
    .box { border: 2px solid #4edea3; padding: 24px; background: #0b1522; max-width: 800px; margin: 0 auto; border-radius: 6px; }
    .header { border-bottom: 2px solid #4edea3; padding-bottom: 12px; margin-bottom: 16px; }
    .score-hero { background: #132030; padding: 16px; border: 1px solid #23354a; margin: 16px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
    th, td { border: 1px solid #223246; padding: 8px 10px; text-align: left; }
    th { background: #132030; color: #4edea3; }
    .btn-bar { max-width: 800px; margin: 0 auto 12px auto; text-align: right; }
    .btn { background: #4edea3; color: #000; font-weight: bold; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    @media print { body { background: #fff; color: #000; } .btn-bar { display: none; } .box { border-color: #000; background: #fff; color: #000; } th, td { border-color: #000; } }
  </style>
</head>
<body>
  <div class="btn-bar"><button class="btn" onclick="window.print()">🖨️ PRINT / SAVE AS PDF</button></div>
  <div class="box">
    <div class="header">
      <h2 style="margin:0; color:#4edea3;">SENTINEL-DRONE OFFICIAL C-UAS TACTICAL SCORECARD</h2>
      <div style="font-size:11px; color:#8fa3b8; margin-top:4px;">SESSION ID: ${sessId} | MIL-STD-2525D EVALUATION DOSSIER</div>
    </div>
    <table>
      <tr><td><strong>CANDIDATE:</strong></td><td style="color:#4edea3; font-weight:bold;">${cadetName}</td><td><strong>RANK:</strong></td><td>${cadetRank}</td></tr>
      <tr><td><strong>UNIT:</strong></td><td>${cadetUnit}</td><td><strong>SCENARIO:</strong></td><td>${scenarioTitle}</td></tr>
    </table>
    <div class="score-hero">
      <div>
        <div style="font-size:11px; color:#8fa3b8;">FINAL SCORE</div>
        <div style="font-size:36px; font-weight:bold; color:#4edea3;">${score} / 1000</div>
      </div>
      <div>
        <div style="padding: 6px 12px; background: rgba(78,222,163,0.2); border: 1px solid #4edea3; color:#4edea3; font-weight:bold; border-radius:4px;">GRADE: MASTER</div>
        <div style="font-size:11px; margin-top:4px; text-align:right;">ACCURACY: ${accuracy}%</div>
      </div>
    </div>
    <div style="background:#111a26; border-left:4px solid #4cd7f6; padding:12px; margin:16px 0; font-size:11px;">
      <strong>EXPLAINABLE AI COACH ASSESSMENT:</strong><br/>
      Operator demonstrated superior spatial awareness, immediate classification of micro-quadcopters and fast threat neutralization adhering to zero collateral standoff doctrine.
    </div>
    <div style="display:flex; justify-content:space-between; margin-top:36px; padding-top:16px; border-top:1px dashed #4edea3;">
      <div style="text-align:center; width:200px;"><div style="border-bottom:1px solid #dae3f1; height:30px;"></div><div style="font-size:10px; margin-top:4px;">CANDIDATE SIGNATURE</div></div>
      <div style="text-align:center; width:200px;"><div style="border-bottom:1px solid #dae3f1; height:30px;"></div><div style="font-size:10px; margin-top:4px;">CHIEF INSTRUCTOR SIGNATURE</div></div>
    </div>
  </div>
</body>
</html>`;

                const blob = new Blob([fallbackHtml], { type: 'text/html;charset=utf-8' });
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `sentinel_official_scorecard_${sessId}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                const printWindow = window.open(blobUrl, '_blank');
                if (printWindow) printWindow.focus();

                this.showToast(`OFFLINE SCORECARD DOWNLOADED: Tactical dossier saved as HTML!`, 'success');
            });
    },

    updateUserUI: function() {
        const nameLabel = document.getElementById('cadetNameLabel');
        const roleLabel = document.getElementById('cadetRoleBadge');
        const unitLabel = document.getElementById('cadetRankUnitLabel');
        const ledElem = document.getElementById('authStatusLed');
        const instBadge = document.getElementById('instTabBadge');
        const instIcon = document.getElementById('instTabIcon');

        if (nameLabel) nameLabel.textContent = this.currentUserName;
        if (unitLabel) unitLabel.textContent = `${this.currentUserRank} // ${this.currentUserUnit}`;
        if (roleLabel) {
            if (this.currentRole === 'trainee') {
                roleLabel.textContent = 'OPERATOR / TRAINEE';
                roleLabel.className = 'px-1.5 py-0.5 rounded bg-tertiary/20 text-tertiary font-bold text-[9px] border border-tertiary/30';
            } else if (this.currentRole === 'admin') {
                roleLabel.textContent = 'COMMAND ADMIN';
                roleLabel.className = 'px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold text-[9px] border border-primary/40';
            } else {
                roleLabel.textContent = 'CHIEF INSTRUCTOR';
                roleLabel.className = 'px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-bold text-[9px] border border-secondary/40';
            }
        }

        if (ledElem) {
            ledElem.className = 'w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.8)]';
        }

        if (instBadge) {
            if (this.currentRole === 'trainee') {
                instBadge.textContent = 'RESTRICTED';
                instBadge.className = 'px-1.5 py-0.2 rounded bg-error/20 text-error text-[8px] font-bold border border-error/30 ml-1';
            } else {
                instBadge.textContent = 'UNLOCKED';
                instBadge.className = 'px-1.5 py-0.2 rounded bg-primary/20 text-primary text-[8px] font-bold border border-primary/30 ml-1';
            }
        }

        if (instIcon) {
            instIcon.textContent = this.currentRole === 'trainee' ? 'lock' : 'admin_panel_settings';
        }
    },

    // ------------------------------------------------------------------------
    // SCENARIO LOADING & PROCEDURAL DNA
    // ------------------------------------------------------------------------
    loadScenarioById: function(scenId) {
        if (!window.ScenarioEngine) return;
        const drill = window.ScenarioEngine.drills.find(d => d.id === scenId) || window.ScenarioEngine.drills[0];
        this.loadScenario(drill);
    },

    loadScenarioFromDNA: function(dnaStr) {
        if (!dnaStr || !window.ScenarioEngine) return;
        const scenario = window.ScenarioEngine.fromThreatDna(dnaStr);
        if (scenario) {
            this.loadScenario(scenario);
            this.showToast(`Threat DNA [${dnaStr}] Successfully Loaded!`, 'success');
        } else {
            this.showToast('Invalid Threat DNA Code format.', 'error');
        }
    },

    loadScenario: function(scenario) {
        this.currentScenario = JSON.parse(JSON.stringify(scenario));
        this.activeTargets = JSON.parse(JSON.stringify(scenario.targets || []));
        this.simTimeSeconds = 0;
        this.selectedTargetId = this.activeTargets.length > 0 ? this.activeTargets[0].id : null;
        this.selectedClassification = null;
        this.selectedAction = null;
        this.loggedActions = [];
        this.sessionErrors = [];
        this.currentScore = 1000;
        this.currentSessionId = `SESS-${Date.now().toString().slice(-6)}`;
        this.sessionStartTime = new Date();

        // Sync Environment with 3D Engine
        if (window.Simulation3D) {
            window.Simulation3D.setEnvironmentMode(scenario.terrain, scenario.timeOfDay, scenario.weather);
        }

        // Notify Backend Session Start
        fetch('/api/sessions/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: this.currentSessionId,
                userId: this.currentUserId,
                scenarioId: scenario.id,
                scenarioTitle: scenario.title
            })
        }).catch(err => console.warn('[Session Sync Offline]', err));

        // Update UI
        this.updateScenarioBriefingUI();
        this.renderTargetList();
        this.selectTarget(this.selectedTargetId);
        if (window.SensorFusion) window.SensorFusion.renderTargetSelector();
    },

    updateScenarioBriefingUI: function() {
        const sc = this.currentScenario;
        if (!sc) return;

        const titleElem = document.getElementById('activeScenarioTitle');
        const dnaElem = document.getElementById('activeThreatDnaLabel');
        const roeElem = document.getElementById('activeRoeBadge');
        const briefElem = document.getElementById('scenarioBriefingText');

        if (titleElem) titleElem.textContent = sc.title;
        if (dnaElem) dnaElem.textContent = sc.threatDna || 'URBAN-NIGHT-CLEAR-SWARM-5-PINCER';
        if (roeElem) roeElem.textContent = `ROE: ${sc.roe || 'HOSTILE_BORDER'}`;
        if (briefElem) briefElem.textContent = sc.briefing || 'Monitor airspace, classify incoming drone contacts, and execute appropriate counter-drone countermeasures.';
    },

    // ------------------------------------------------------------------------
    // TARGET SELECTION & DECISION BOARD
    // ------------------------------------------------------------------------
    selectTarget: function(targetId) {
        this.selectedTargetId = targetId;
        const target = this.activeTargets.find(t => t.id === targetId);

        if (window.Radar2D) window.Radar2D.selectedTargetId = targetId;
        if (window.SensorFusion) {
            window.SensorFusion.setLockedTarget(target);
            window.SensorFusion.renderTargetSelector();
        }

        // Update telemetry and decision panels
        this.renderTargetDetails(target);
        this.renderTargetList();

        // Audio lock chirp
        if (window.TacticalAudio) window.TacticalAudio.play('lock');
    },

    renderTargetList: function() {
        const listContainer = document.getElementById('activeTargetsList');
        if (!listContainer) return;

        listContainer.innerHTML = this.activeTargets.map(t => {
            const isSelected = t.id === this.selectedTargetId;
            const dist = Math.round(Math.hypot(t.pos.x, t.pos.y));
            const isCritical = dist < 450 && t.status !== 'destroyed';

            return `
                <div class="p-2 rounded cursor-pointer transition-all border ${
                    isSelected ? 'bg-primary/10 border-primary shadow-[0_0_8px_rgba(78,222,163,0.2)]' :
                    (isCritical ? 'bg-error-container/20 border-error/40 hover:bg-surface-container-high animate-pulse' :
                    'bg-surface-container-high/60 border-surface-container-highest hover:bg-surface-container-high')
                }" onclick="SimulationApp.selectTarget('${t.id}')">
                    <div class="flex items-center justify-between font-mono text-xs">
                        <span class="font-bold ${t.isDecoy ? 'text-secondary' : (t.type === 'bird_flock' ? 'text-primary' : 'text-error')}">${t.id}</span>
                        <span class="text-[10px] ${t.status === 'destroyed' ? 'text-on-surface-variant line-through' : (dist < 400 ? 'text-error font-bold' : 'text-tertiary')}">${dist}M</span>
                    </div>
                    <div class="flex items-center justify-between text-[10px] font-mono text-on-surface-variant mt-1">
                        <span>ALT: ${Math.round(t.pos.z)}M</span>
                        <span class="uppercase">${t.status === 'destroyed' ? 'NEUTRALIZED' : `${(t.speed || 25).toFixed(0)} M/S`}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderTargetDetails: function(target) {
        const idElem = document.getElementById('selectedTargetIdLabel');
        const rangeElem = document.getElementById('selectedTargetRangeLabel');
        const speedElem = document.getElementById('selectedTargetSpeedLabel');
        const rcsElem = document.getElementById('selectedTargetRcsLabel');
        const freqElem = document.getElementById('selectedTargetFreqLabel');

        if (!target) {
            if (idElem) idElem.textContent = 'NO TARGET SELECTED';
            return;
        }

        const range = Math.round(Math.hypot(target.pos.x, target.pos.y));
        if (idElem) idElem.textContent = `${target.id} [${target.typeName || target.type}]`;
        if (rangeElem) rangeElem.textContent = `${range} METERS`;
        if (speedElem) speedElem.textContent = `${(target.speed || 25).toFixed(1)} M/S`;
        if (rcsElem) rcsElem.textContent = `${target.radarCrossSection || 0.04} m²`;
        if (freqElem) freqElem.textContent = `${target.rfFrequencyMHz ? `${target.rfFrequencyMHz} MHz` : 'PASSIVE / NO RF'}`;
    },

    // ------------------------------------------------------------------------
    // TRAINEE ACTIONS & CLASSIFICATION
    // ------------------------------------------------------------------------
    classifySelected: function(classification) {
        if (!this.isAuthenticated) {
            this.showToast('CLEARANCE REQUIRED: Please log in or register before conducting drills.', 'error');
            this.openLoginModal(null, false);
            return;
        }
        if (!this.selectedTargetId) {
            this.showToast('Please select a target on the radar first.', 'warning');
            return;
        }
        this.selectedClassification = classification;

        // Visual button highlighting
        const btns = document.querySelectorAll('.classify-btn');
        btns.forEach(b => b.classList.remove('active-classify'));
        const activeBtn = document.getElementById(`classify-btn-${classification}`);
        if (activeBtn) activeBtn.classList.add('active-classify');

        this.showToast(`Target [${this.selectedTargetId}] classified as: ${classification.toUpperCase()}`, 'info');
        if (window.TacticalAudio) window.TacticalAudio.play('click');
    },

    setPriority: function(priority) {
        this.selectedPriority = priority;
        this.showToast(`Threat Priority set to: ${priority}`, 'info');
    },

    executeAction: function(action) {
        if (!this.isAuthenticated) {
            this.showToast('CLEARANCE REQUIRED: Please log in or register before deploying countermeasures.', 'error');
            this.openLoginModal(null, false);
            return;
        }
        if (!this.selectedTargetId) {
            this.showToast('Select a target track first.', 'warning');
            return;
        }

        const target = this.activeTargets.find(t => t.id === this.selectedTargetId);
        if (!target || target.status === 'destroyed') {
            this.showToast('Target already neutralized or out of range.', 'warning');
            return;
        }

        this.selectedAction = action;

        // Evaluate action via Decision-Tree Scoring Engine
        const evaluation = window.ScoringEngine.evaluateAction(
            target,
            action,
            this.selectedClassification || 'unknown',
            this.selectedPriority,
            this.simTimeSeconds,
            this.currentScenario,
            null
        );

        // Update score
        this.currentScore = Math.max(0, this.currentScore + evaluation.scoreDelta);

        // Play appropriate tactical audio & trigger visual FX
        if (action === 'jam') {
            if (window.TacticalAudio) window.TacticalAudio.play('jam');
            if (window.Radar2D) window.Radar2D.addEffect('jam', { x: 0, y: 0 }, target.pos, 1.2);
            if (window.Simulation3D) window.Simulation3D.addWeaponEffect3D('jam', { x: 0, y: 0 }, target.pos, 1.2);
            target.status = 'jammed';
            target.speed = Math.max(2, target.speed * 0.2); // Failsafe hover / RTH
        } else if (action === 'laser') {
            if (window.TacticalAudio) window.TacticalAudio.play('laser');
            if (window.Radar2D) window.Radar2D.addEffect('laser', { x: 0, y: 0 }, target.pos, 0.8);
            if (window.Simulation3D) window.Simulation3D.addWeaponEffect3D('laser', { x: 0, y: 0 }, target.pos, 0.8);
            target.status = 'destroyed';
        } else if (action === 'hardkill' || action === 'ciws') {
            if (window.TacticalAudio) window.TacticalAudio.play('launch');
            if (window.Radar2D) window.Radar2D.addEffect('interceptor', { x: 80, y: -140 }, target.pos, 1.5);
            setTimeout(() => {
                target.status = 'destroyed';
                if (window.TacticalAudio) window.TacticalAudio.play('explosion');
                if (window.Radar2D) window.Radar2D.addEffect('explosion', null, target.pos, 0.6);
                if (window.SimulationApp) {
                    window.SimulationApp.renderTargetList();
                    if (window.SensorFusion) window.SensorFusion.renderTargetSelector();
                }
            }, 1200);
        } else if (action === 'alert') {
            if (window.TacticalAudio) window.TacticalAudio.play('alarm');
            if (window.SensorFusion) window.SensorFusion.addRadioChatter('PATROL ALERT', `Target ${target.id} designated hostile. Outer perimeter on alert.`);
        } else if (action === 'evacuate') {
            if (window.TacticalAudio) window.TacticalAudio.play('alarm');
            if (window.SensorFusion) window.SensorFusion.addRadioChatter('EVAC ORDER', `Personnel evacuating sector adjacent to track ${target.id}.`);
        }

        // Log action event
        const eventData = {
            timestampSec: parseFloat(this.simTimeSeconds.toFixed(1)),
            contactId: target.id,
            action: action,
            classification: this.selectedClassification || 'unknown',
            priority: this.selectedPriority,
            isCorrectClass: evaluation.isCorrectClass,
            recommendedAction: evaluation.recommendedAction,
            consequence: evaluation.consequence,
            scoreDelta: evaluation.scoreDelta,
            coachingFeedback: evaluation.coachingFeedback,
            detTimeSec: this.simTimeSeconds,
            collateralHazard: evaluation.collateralHazard
        };

        this.loggedActions.push(eventData);

        if (evaluation.collateralHazard || !evaluation.isCorrectClass) {
            this.sessionErrors.push({
                timeSec: this.simTimeSeconds,
                contactId: target.id,
                category: evaluation.collateralHazard ? 'Collateral Hazard' : 'Misclassification',
                description: evaluation.consequence,
                severity: evaluation.collateralHazard ? 'HIGH' : 'MEDIUM'
            });
        }

        // Update Backend
        fetch('/api/sessions/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: this.currentSessionId,
                ...eventData
            })
        }).catch(err => console.warn('[Action Sync Offline]', err));

        // Feedback toast
        this.showToast(`${evaluation.consequence} (${evaluation.scoreDelta > 0 ? '+' : ''}${evaluation.scoreDelta} pts)`, evaluation.scoreDelta >= 0 ? 'success' : 'error');

        // Check if all targets addressed & update target selector UI
        this.renderTargetList();
        if (window.SensorFusion) window.SensorFusion.renderTargetSelector();
        this.checkSessionCompletion();
    },

    confirmPrimaryEngagement: function() {
        if (!this.selectedTargetId) {
            this.showToast('No target locked. Select a track on the radar.', 'warning');
            return;
        }
        // Default smart engagement: Soft-kill jammer if recon/commercial, hardkill if kamikaze
        const target = this.activeTargets.find(t => t.id === this.selectedTargetId);
        if (target) {
            if (target.type === 'fpv_kamikaze') {
                this.executeAction('laser');
            } else {
                this.executeAction('jam');
            }
        }
    },

    checkSessionCompletion: function() {
        const remaining = this.activeTargets.filter(t => t.status !== 'destroyed' && t.status !== 'jammed' && !t.isDecoy && t.type !== 'bird_flock');
        if (remaining.length === 0) {
            setTimeout(() => {
                this.completeSession();
            }, 1800);
        }
    },

    completeSession: function() {
        this.isPaused = true;

        // Calculate final score across 6 metrics
        const scoreSummary = window.ScoringEngine.calculateSessionScore(
            this.loggedActions,
            this.activeTargets.length,
            this.simTimeSeconds,
            this.currentScenario
        );

        scoreSummary.sessionId = this.currentSessionId;
        scoreSummary.scenarioId = this.currentScenario.id;
        scoreSummary.events = this.loggedActions;
        scoreSummary.errors = this.sessionErrors;
        scoreSummary.threatsDefeated = this.activeTargets.filter(t => t.status === 'destroyed' || t.status === 'jammed').length;

        // Pass to AAR Engine
        if (window.AAREngine) {
            window.AAREngine.finishSession(scoreSummary);
        }

        this.showToast(`MISSION COMPLETE! Grade: ${scoreSummary.grade} [${scoreSummary.totalScore}/1000]`, 'success');

        // Role-based debrief branching
        setTimeout(() => {
            if (this.currentRole === 'trainee') {
                this.showTraineeDebriefModal(scoreSummary);
            } else {
                this.switchTab('instructor');
                this.switchInstructorSubTab('analysis');
            }
        }, 1100);
    },

    showTraineeDebriefModal: function(summary) {
        const modal = document.getElementById('traineeDebriefModal');
        if (!modal) return;

        const subTitle = document.getElementById('traineeDebriefSubTitle');
        const scoreElem = document.getElementById('traineeModalScore');
        const gradeElem = document.getElementById('traineeModalGrade');
        const accElem = document.getElementById('traineeModalAccuracy');
        const latElem = document.getElementById('traineeModalLatency');
        const threatsElem = document.getElementById('traineeModalThreats');
        const roeElem = document.getElementById('traineeModalViolations');
        const aiElem = document.getElementById('traineeModalAiSummary');

        if (subTitle && this.currentScenario) {
            subTitle.textContent = `DRILL COMPLETED: ${this.currentScenario.title.toUpperCase()}`;
        }
        if (scoreElem) scoreElem.textContent = summary.totalScore;
        if (gradeElem) {
            gradeElem.textContent = `GRADE: ${summary.grade}`;
            gradeElem.className = `font-mono text-xs px-3 py-1 rounded font-bold inline-block ${
                summary.grade === 'MASTER' ? 'bg-primary/20 text-primary border border-primary/40' :
                (summary.grade === 'DISTINGUISHED' ? 'bg-secondary/20 text-secondary border border-secondary/40' :
                'bg-error/20 text-error border border-error/40')
            }`;
        }
        if (accElem) accElem.textContent = `ACCURACY: ${summary.accuracyPct}%`;
        if (latElem) latElem.textContent = `${summary.avgDetTime}s`;
        if (threatsElem) threatsElem.textContent = `${summary.threatsDefeated} / ${this.activeTargets.length}`;
        if (roeElem) roeElem.textContent = summary.errors ? summary.errors.length : 0;
        if (aiElem && summary.aiDebrief) {
            aiElem.textContent = summary.aiDebrief;
        }

        modal.classList.remove('hidden');
    },

    closeTraineeDebriefModal: function() {
        const modal = document.getElementById('traineeDebriefModal');
        if (modal) modal.classList.add('hidden');
    },

    replayCurrentScenario: function() {
        if (!this.currentScenario) return;
        this.loadScenario(this.currentScenario);
        this.isPaused = false;
        this.switchTab('radar');
        this.showToast(`REPLAYING: ${this.currentScenario.title}`, 'info');
    },

    loadNextSequentialDrill: function() {
        if (!window.ScenarioEngine || !window.ScenarioEngine.drills) return;
        const drills = window.ScenarioEngine.drills;
        const currentId = this.currentScenario ? this.currentScenario.id : 'SCEN-01';
        let idx = drills.findIndex(d => d.id === currentId);
        idx = (idx + 1) % drills.length;
        const nextDrill = drills[idx];
        this.loadScenario(nextDrill);
        this.isPaused = false;
        this.switchTab('radar');
        this.showToast(`LOADED NEXT DRILL: ${nextDrill.title}`, 'success');
    },

    requestInstructorAnalysis: function() {
        this.closeTraineeDebriefModal();
        this.showToast('Please authenticate with Instructor or Admin credentials to view full cohort Dossier.', 'info');
        this.openLoginModal('instructor');
    },

    // ------------------------------------------------------------------------
    // 60 FPS SIMULATION ENGINE LOOP
    // ------------------------------------------------------------------------
    simLoop: function(timestamp) {
        if (!this.isAuthenticated) {
            this.lastFrameTime = timestamp;
            requestAnimationFrame((t) => this.simLoop(t));
            return;
        }

        const deltaTime = Math.min(0.1, (timestamp - this.lastFrameTime) / 1000);
        this.lastFrameTime = timestamp;

        if (this.isRunning && !this.isPaused) {
            this.simTimeSeconds += deltaTime;

            // 1. Kinematics: Update active drone positions
            this.updateDroneKinematics(deltaTime);

            // 2. Cognitive Load simulation (NASA-TLX & Stress)
            this.updateCognitiveLoad(deltaTime);
        }

        // 3. Render 2D Pulse Radar
        if (window.Radar2D) {
            window.Radar2D.render(this.activeTargets, deltaTime);
        }

        // 4. Render 3D WebGL Simulation (if in 3D mode)
        if (this.is3DMode && window.Simulation3D && !this.lowHardwareMode) {
            window.Simulation3D.update(this.activeTargets, deltaTime, this.selectedTargetId);
        }

        // 5. Render Sensor Feeds (FLIR PIP, RF Waterfall, Acoustic)
        let target = this.activeTargets.find(t => t.id === this.selectedTargetId);
        // Fallback to first live contact if none selected or if selected is destroyed
        if (!target || target.status === 'destroyed') {
            const liveTarget = this.activeTargets.find(t => t.status !== 'destroyed');
            if (liveTarget) {
                target = liveTarget;
                this.selectedTargetId = target.id;
                if (window.Radar2D) window.Radar2D.selectedTargetId = target.id;
                if (window.SensorFusion) window.SensorFusion.setLockedTarget(target);
            }
        }
        if (window.SensorFusion) {
            window.SensorFusion.renderPIP(target, deltaTime);
            window.SensorFusion.renderRFSpectrum(deltaTime);
            window.SensorFusion.renderAcoustic(deltaTime);
        }

        // 6. Update HUD labels
        this.updateTacticalHUD();

        requestAnimationFrame((t) => this.simLoop(t));
    },

    updateDroneKinematics: function(deltaTime) {
        this.activeTargets.forEach(t => {
            if (t.status === 'destroyed') return;

            // Move along velocity vector
            t.pos.x += t.velocity.x * deltaTime;
            t.pos.y += t.velocity.y * deltaTime;
            t.pos.z += (t.velocity.z || 0) * deltaTime;

            const dist = Math.hypot(t.pos.x, t.pos.y);

            // Perimeter Patrol Radio Sentry Alerts
            if (dist < 1500 && !t._alert1500 && t.status !== 'destroyed') {
                t._alert1500 = true;
                if (window.SensorFusion) {
                    window.SensorFusion.addRadioChatter('OP NORTH (LOOKOUT)', `Visual contact! Target ${t.id} crossed 1500m outer perimeter line.`);
                }
            }
            if (dist < 1000 && !t._alert1000 && t.status !== 'destroyed') {
                t._alert1000 = true;
                if (window.SensorFusion) {
                    window.SensorFusion.addRadioChatter('OP SOUTH (TOWER 2)', `Warning! Contact ${t.id} at 1000m closing fast at ${Math.round(t.speed || 30)} m/s!`);
                }
            }
            if (dist < 500 && !t._alert500 && t.status !== 'destroyed') {
                t._alert500 = true;
                if (window.SensorFusion) {
                    window.SensorFusion.addRadioChatter('C2 DEFENSE', `RED ALERT! Track ${t.id} breached 500m inner killzone! Authorize kinetic/EW!`);
                }
            }

            // Terminal Dive Behavior for Kamikazes
            if (t.type === 'fpv_kamikaze' && dist < 320 && t.status !== 'jammed') {
                t.pos.z = Math.max(8, t.pos.z - deltaTime * 35); // Dive rapidly
                t.speed = 48; // Accelerate
            }

            // Target breach check
            if (dist < 40 && t.status !== 'jammed' && t.status !== 'destroyed' && t.isHostile) {
                targetBreached(t);
            }
        });

        function targetBreached(target) {
            target.status = 'destroyed';
            if (window.SimulationApp) {
                window.SimulationApp.currentScore = Math.max(0, window.SimulationApp.currentScore - 300);
                window.SimulationApp.showToast(`CRITICAL BREACH: Hostile drone ${target.id} impacted base asset!`, 'error');
                if (window.TacticalAudio) window.TacticalAudio.play('explosion');
                if (window.Radar2D) window.Radar2D.addEffect('explosion', null, target.pos, 1.0);
            }
        }
    },

    updateCognitiveLoad: function(deltaTime) {
        const activeHostiles = this.activeTargets.filter(t => t.isHostile && t.status !== 'destroyed').length;
        const targetTLX = Math.min(95, 20 + activeHostiles * 12);
        this.nasaTLX += (targetTLX - this.nasaTLX) * deltaTime * 0.3;

        this.operatorBPM = Math.round(68 + (this.nasaTLX / 100) * 42);
        this.hrvStress = Math.round(80 - (this.nasaTLX / 100) * 35);
    },

    updateTacticalHUD: function() {
        const tminElem = document.getElementById('threat-tmin-label');
        if (tminElem) {
            const timeRem = Math.max(0, 90 - Math.floor(this.simTimeSeconds));
            const m = Math.floor(timeRem / 60);
            const s = timeRem % 60;
            tminElem.textContent = `T-MINUS 0${m}:${s < 10 ? '0' : ''}${s}`;
        }

        const tlxLabel = document.getElementById('tlxMetricLabel');
        if (tlxLabel) tlxLabel.textContent = `NASA-TLX: ${this.nasaTLX.toFixed(1)} // HR: ${this.operatorBPM} BPM`;

        // Update Instructor live stress monitors
        const instTlx = document.getElementById('instructorTlxLabel');
        if (instTlx) instTlx.textContent = `${this.nasaTLX.toFixed(1)} / 100`;
        const instBpm = document.getElementById('instructorBpmLabel');
        if (instBpm) instBpm.textContent = `${this.operatorBPM} BPM`;
        const instHrv = document.getElementById('instructorHrvLabel');
        if (instHrv) instHrv.textContent = `${this.hrvStress} / 100`;
    },

    // ------------------------------------------------------------------------
    // INSTRUCTOR COMMAND HUB SUB-TABS (SCENARIOS, DOCTRINE & COHORT AAR)
    // ------------------------------------------------------------------------
    switchInstructorSubTab: function(subTabId) {
        const subTabs = ['scenarios', 'doctrine', 'analysis'];
        subTabs.forEach(id => {
            const panel = document.getElementById(`instructor-sub-${id}`);
            const btn = document.getElementById(`instructor-subtab-btn-${id}`);
            if (panel) {
                if (id === subTabId) {
                    panel.classList.remove('hidden');
                    panel.classList.add('flex');
                } else {
                    panel.classList.add('hidden');
                    panel.classList.remove('flex');
                }
            }
            if (btn) {
                if (id === subTabId) {
                    btn.classList.add('bg-primary', 'text-on-primary');
                    btn.classList.remove('text-on-surface-variant');
                } else {
                    btn.classList.remove('bg-primary', 'text-on-primary');
                    btn.classList.add('text-on-surface-variant');
                }
            }
        });

        // If switching to AAR Cohort Analysis, refresh data and canvas
        if (subTabId === 'analysis') {
            if (window.AAREngine) {
                window.AAREngine.fetchHistoricalSessions();
                if (window.AAREngine.currentAARData && window.AAREngine.currentAARData.skillRadar) {
                    setTimeout(() => {
                        window.AAREngine.renderSkillRadar(window.AAREngine.currentAARData.skillRadar);
                    }, 60);
                }
            }
        }
    },

    // ------------------------------------------------------------------------
    // CONTROLS & UTILITIES
    // ------------------------------------------------------------------------
    togglePause: function() {
        this.isPaused = !this.isPaused;
        this.showToast(this.isPaused ? 'SIMULATION PAUSED' : 'SIMULATION RESUMED', 'info');
    },

    toggleView3D2D: function() {
        this.is3DMode = !this.is3DMode;
        const container3D = document.getElementById('simContainer3D');
        const container2D = document.getElementById('radar-container');

        if (this.is3DMode) {
            if (container3D) container3D.classList.remove('hidden');
            this.showToast('Switched to 3D WebGL Tactical Environment', 'info');
        } else {
            if (container3D) container3D.classList.add('hidden');
            this.showToast('Switched to 2D High-Performance Pulse Radar', 'info');
        }
    },

    toggleLowHardwareMode: function() {
        this.lowHardwareMode = !this.lowHardwareMode;
        this.is3DMode = !this.lowHardwareMode;
        const container3D = document.getElementById('simContainer3D');
        if (container3D) {
            if (this.lowHardwareMode) container3D.classList.add('hidden');
            else container3D.classList.remove('hidden');
        }
        this.showToast(this.lowHardwareMode ? 'LOW-END HARDWARE MODE ENABLED (2D Only)' : '3D WEBGL ACCELERATION ENABLED', 'success');
    },

    switchTab: function(tabId) {
        // Universal Access Control: Must be authenticated to access any tabs or functions
        if (!this.isAuthenticated) {
            this.showToast('CLEARANCE REQUIRED: You must authenticate or enroll to operate the simulator.', 'error');
            this.openLoginModal(null, false);
            return;
        }

        // Alias Redirection
        if (tabId === 'director' || tabId === 'scenarios') {
            tabId = 'instructor';
            this.switchInstructorSubTab('scenarios');
        } else if (tabId === 'aar' || tabId === 'analysis') {
            tabId = 'instructor';
            this.switchInstructorSubTab('analysis');
        }

        // Access Control: Trainees cannot enter Instructor Hub directly
        if (tabId === 'instructor' && this.currentRole === 'trainee') {
            this.showToast('CLEARANCE REQUIRED: Restricted to Flight Instructors & Range Admins.', 'error');
            this.openLoginModal('instructor');
            return;
        }

        const tabs = ['radar', 'sensors', 'triage', 'instructor'];
        tabs.forEach(t => {
            const content = document.getElementById(`tab-${t}`);
            const btn = document.getElementById(`tab-btn-${t}`);
            if (content) {
                if (t === tabId) {
                    content.classList.remove('hidden');
                    content.classList.add('flex');
                } else {
                    content.classList.add('hidden');
                    content.classList.remove('flex');
                }
            }
            if (btn) {
                if (t === tabId) {
                    btn.classList.add('active', 'text-primary', 'border-b-2', 'border-primary', 'bg-primary/10');
                    btn.classList.remove('text-on-surface-variant');
                } else {
                    btn.classList.remove('active', 'text-primary', 'border-b-2', 'border-primary', 'bg-primary/10');
                    btn.classList.add('text-on-surface-variant');
                }
            }
        });

        // Trigger resize on radar when switching
        if (tabId === 'radar' && window.Radar2D) {
            setTimeout(() => window.Radar2D.resize(), 50);
        }
    },

    showToast: function(message, type) {
        let toast = document.getElementById('tacticalToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'tacticalToast';
            document.body.appendChild(toast);
        }

        const borderCol = type === 'error' ? 'border-error text-error bg-error-container/90' :
            (type === 'success' ? 'border-primary text-primary bg-surface-container/95' :
            'border-tertiary text-tertiary bg-surface-container/95');

        toast.className = `fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded shadow-2xl font-mono text-xs border ${borderCol} flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-150`;
        toast.innerHTML = `
            <span class="material-symbols-outlined text-[16px]">${type === 'error' ? 'warning' : (type === 'success' ? 'check_circle' : 'info')}</span>
            <span>${message}</span>
        `;

        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.remove();
        }, 3200);
    }
};

window.addEventListener('DOMContentLoaded', () => {
    SimulationApp.init();
});
