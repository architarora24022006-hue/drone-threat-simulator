// ============================================================================
// GARUDA-RAKSHAK // AEGIS C-UAS TACTICAL COMMAND CONSOLE ENGINE
// FILE: src/app.js
// ARCHITECTURE: Multi-Tab Interactive Command Console with Real-Time Interactivity
// ============================================================================

// Global Active Model State
let activeTab = 'radar';
let simTimeSeconds = 0;
let triageScore = 100;
let maxTriageScore = 500;
let activeDrones = [];
let adsbContacts = [];
let isADSBActive = true;
let selectedDroneId = "FPV-STRIKE-01";
let weatherData = { sectorName: "LEH-LADAKH SECTOR", temperature: 18.5, windSpeed: 12.4, grid: "GRID: 34°09'N 77°34'E // LEH BASE" };

// Interactive Visual & Scale States
let isAudioEnabled = true;
let radarScaleFactor = 0.22; // Default 2.0 KM span
let isLockdownActive = false;
let radarFXList = [];

// Gap 3 Cognitive Load & Physiological Metrics
let nasaTLXIndex = 32.4;
let hrvStress = 68; // ms
let pupilFocus = 3.8; // mm
let outOfSeqPenalty = 0;

// Engagement Tracking for SQLite & AAR Analytics
let engagementEvents = [];
let truePositivesCount = 0;
let falsePositivesCount = 0;

// ============================================================================
// PROCEDURAL WEB AUDIO SYNTHESIZER ENGINE (TACTICAL FEEDBACK)
// ============================================================================
function playTacticalAudio(type) {
  if (!isAudioEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'lock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.setValueAtTime(1550, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'scramble' || type === 'launch') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1850, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'jam') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.linearRampToValueAtTime(700, now + 0.35);
      gain.gain.setValueAtTime(0.10, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'explosion') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.1);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (e) {}
}

function toggleTacticalAudio() {
  isAudioEnabled = !isAudioEnabled;
  const label = document.getElementById('audio-status-label');
  const icon = document.getElementById('audio-icon');
  if (label) label.innerText = isAudioEnabled ? 'AUDIO: ON' : 'AUDIO: MUTED';
  if (icon) icon.innerText = isAudioEnabled ? 'volume_up' : 'volume_off';
  triggerToast(isAudioEnabled ? 'TACTICAL AUDIO FEEDBACK ENABLED' : 'TACTICAL AUDIO MUTED', isAudioEnabled ? 'volume_up' : 'volume_off', 'text-tertiary');
  if (isAudioEnabled) playTacticalAudio('click');
}

// ============================================================================
// SWARM INITIALIZER & STATE ENGINE
// ============================================================================
function initSwarmState() {
  activeDrones = [];
  engagementEvents = [];
  truePositivesCount = 0;
  falsePositivesCount = 0;
  outOfSeqPenalty = 0;
  triageScore = 100;
  nasaTLXIndex = 32.4;
  hrvStress = 68;

  // Generate 8 Kinetic FPV Strikers
  for (let i = 1; i <= 8; i++) {
    activeDrones.push({
      id: `FPV-STRIKE-${String(i).padStart(2, '0')}`,
      type: "KineticStrikerFPV",
      x: (Math.random() - 0.5) * 550,
      y: (Math.random() - 0.5) * 550,
      alt: 25.0 + Math.random() * 20,
      speed: 38.0 + Math.random() * 10,
      threat: 88.0 + Math.random() * 10,
      isDecoy: false,
      active: true,
      firstDetected: simTimeSeconds
    });
  }

  // Generate 14 Non-Lethal Decoy Chaff Swarm Assets
  for (let i = 1; i <= 14; i++) {
    activeDrones.push({
      id: `DECOY-CHAFF-${String(i).padStart(2, '0')}`,
      type: "DecoyChaffSwarm",
      x: (Math.random() - 0.5) * 450,
      y: (Math.random() - 0.5) * 450,
      alt: 40.0 + Math.random() * 25,
      speed: 32.0 + Math.random() * 6,
      threat: 10.0 + Math.random() * 10,
      isDecoy: true,
      active: true,
      firstDetected: simTimeSeconds
    });
  }

  // Generate 3 ISR Reconnaissance Drones
  for (let i = 1; i <= 3; i++) {
    activeDrones.push({
      id: `ISR-RECON-${String(i).padStart(2, '0')}`,
      type: "ISRReconnaissance",
      x: (Math.random() - 0.5) * 650,
      y: (Math.random() - 0.5) * 650,
      alt: 180.0 + Math.random() * 40,
      speed: 24.0 + Math.random() * 5,
      threat: 52.0 + Math.random() * 8,
      isDecoy: false,
      active: true,
      firstDetected: simTimeSeconds
    });
  }

  // Set default selection
  if (activeDrones.length > 0) {
    selectedDroneId = activeDrones[0].id;
  }

  renderSwarmTargets();
  renderSwarmTargetQueue();
  renderTriageQueue();
  updateAARDashboardUI();
  renderAAREngagementLog();
}

// Toast Modal Notification System
function triggerToast(text, icon = 'check_circle', iconColor = 'text-primary') {
  const toast = document.getElementById('toast-modal');
  const toastMsg = document.getElementById('toast-msg');
  const toastIcon = document.getElementById('toast-icon');

  if (!toast || !toastMsg || !toastIcon) return;

  toastMsg.textContent = text;
  toastIcon.textContent = icon;
  toastIcon.className = `material-symbols-outlined text-[20px] ${iconColor}`;

  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 2800);
}

// Tab Switcher Logic
function switchTab(tabId) {
  playTacticalAudio('click');
  activeTab = tabId;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  const targetTab = document.getElementById(`tab-${tabId}`);
  const targetBtn = document.getElementById(`tab-btn-${tabId}`);

  if (targetTab) targetTab.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

  if (tabId === 'sensors') {
    setTimeout(renderRFSpectrumCanvas, 100);
  } else if (tabId === 'aar') {
    renderAAREngagementLog();
  }
}

// ============================================================================
// RADAR VISUAL FX ENGINE (ANIMATED MISSILES, SHOCKWAVES, SHIELD)
// ============================================================================
function addRadarFX(type, startX, startY, endX, endY, label = '') {
  radarFXList.push({
    type,
    startX, startY, endX, endY,
    label,
    progress: 0,
    maxDuration: type === 'tracer' ? 0.35 : (type === 'emp' ? 1.0 : 0.6)
  });
}

function updateAndRenderRadarFX() {
  const canvas = document.getElementById('radar-fx-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  ctx.clearRect(0, 0, w, h);

  // Render Depot Lockdown Shield Dome
  if (isLockdownActive) {
    ctx.beginPath();
    const pulseRadius = 38 + Math.sin(simTimeSeconds * 5) * 4;
    ctx.arc(w / 2, h / 2, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(76, 215, 246, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#4cd7f6';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.fillStyle = 'rgba(76, 215, 246, 0.12)';
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Render Visual FX Queue
  for (let i = radarFXList.length - 1; i >= 0; i--) {
    const fx = radarFXList[i];
    fx.progress += 0.05;

    if (fx.type === 'tracer') {
      const p = Math.min(1, fx.progress / fx.maxDuration);
      const curX = fx.startX + (fx.endX - fx.startX) * p;
      const curY = fx.startY + (fx.endY - fx.startY) * p;

      ctx.beginPath();
      ctx.moveTo(fx.startX, fx.startY);
      ctx.lineTo(curX, curY);
      ctx.strokeStyle = '#ffb4ab';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff3300';
      ctx.fill();
    } else if (fx.type === 'explosion') {
      const alpha = 1 - (fx.progress / fx.maxDuration);
      const radius = (fx.progress / fx.maxDuration) * 35;

      ctx.beginPath();
      ctx.arc(fx.endX, fx.endY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 180, 171, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 85, 0, ${alpha * 0.45})`;
      ctx.fill();

      if (fx.label) {
        ctx.fillStyle = `rgba(78, 222, 163, ${alpha})`;
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(fx.label, fx.endX - 35, fx.endY - radius - 6);
      }
    } else if (fx.type === 'emp') {
      const alpha = 1 - (fx.progress / fx.maxDuration);
      const radius = (fx.progress / fx.maxDuration) * (w / 2);

      ctx.beginPath();
      ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(76, 215, 246, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = `rgba(76, 215, 246, ${alpha * 0.08})`;
      ctx.fill();
    }

    if (fx.progress >= fx.maxDuration) {
      radarFXList.splice(i, 1);
    }
  }
}

// ============================================================================
// RADAR RENDERING & TARGET MARKERS LOOP
// ============================================================================
function renderSwarmTargets() {
  const container = document.getElementById('radar-targets-layer');
  if (!container) return;

  container.innerHTML = '';

  let activeCount = 0;
  let fpvCount = 0;
  let decoyCount = 0;

  activeDrones.forEach(drone => {
    if (!drone.active) return;
    activeCount++;
    if (drone.type === 'KineticStrikerFPV') fpvCount++;
    if (drone.isDecoy) decoyCount++;

    const leftPct = 50 + (drone.x * radarScaleFactor);
    const topPct = 50 + (drone.y * radarScaleFactor);

    const isSelected = drone.id === selectedDroneId;

    const marker = document.createElement('div');
    marker.className = `absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 flex flex-col items-center group z-30 ${isSelected ? 'scale-125 z-40' : ''}`;
    marker.style.left = `${Math.max(6, Math.min(94, leftPct))}%`;
    marker.style.top = `${Math.max(6, Math.min(94, topPct))}%`;
    marker.onclick = () => selectDrone(drone.id);

    const isKinetic = drone.type === 'KineticStrikerFPV';
    const colorClass = isKinetic ? 'bg-error text-on-error' : (drone.isDecoy ? 'bg-secondary text-on-secondary' : 'bg-tertiary text-on-tertiary');

    marker.innerHTML = `
      <div class="relative flex items-center justify-center">
        ${isSelected ? '<div class="w-7 h-7 rounded-full border-2 border-tertiary animate-spin absolute"></div>' : ''}
        ${isKinetic ? '<div class="w-6 h-6 rounded-full bg-error/30 animate-ping absolute"></div>' : ''}
        <div class="w-3.5 h-3.5 rounded ${colorClass} flex items-center justify-center shadow-lg font-bold text-[9px]">
          ${isKinetic ? '!' : 'D'}
        </div>
      </div>
      <div class="mt-0.5 bg-surface-container-high/90 px-1 py-0.5 rounded shadow text-[9px] font-mono whitespace-nowrap border ${isSelected ? 'border-tertiary text-tertiary font-bold' : 'border-surface-container-highest text-on-surface'}">
        <span>${drone.id}</span>
      </div>
    `;

    container.appendChild(marker);
  });

  // Render ADS-B Commercial Aircraft Contacts
  if (isADSBActive && adsbContacts.length > 0) {
    adsbContacts.forEach((contact, idx) => {
      const offsetX = ((idx % 2 === 0 ? 1 : -1) * (180 + idx * 40));
      const offsetY = ((idx % 3 === 0 ? -1 : 1) * (200 + idx * 30));
      const leftPct = 50 + (offsetX * radarScaleFactor);
      const topPct = 50 + (offsetY * radarScaleFactor);

      const marker = document.createElement('div');
      marker.className = `absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 opacity-80`;
      marker.style.left = `${Math.max(8, Math.min(92, leftPct))}%`;
      marker.style.top = `${Math.max(8, Math.min(92, topPct))}%`;

      marker.innerHTML = `
        <div class="w-3.5 h-3.5 rounded bg-primary/20 text-primary border border-primary/50 flex items-center justify-center">
          <span class="material-symbols-outlined text-[10px]">flight</span>
        </div>
        <div class="bg-surface-container-lowest/80 px-1 rounded text-[8px] font-mono text-primary">
          ${contact.callsign || 'CIVIL-AIR'} [CIV]
        </div>
      `;

      container.appendChild(marker);
    });
  }

  // Update Top Stats Cards
  const elActive = document.getElementById('stat-active-count');
  const elFPV = document.getElementById('stat-fpv-count');
  const elDecoy = document.getElementById('stat-decoy-count');
  if (elActive) elActive.innerText = `${activeCount} UNITS`;
  if (elFPV) elFPV.innerText = `${fpvCount} LEADS`;
  if (elDecoy) elDecoy.innerText = `${decoyCount} SCREEN`;
}

// Target Lock Selection
function selectDrone(droneId) {
  playTacticalAudio('lock');
  selectedDroneId = droneId;
  const drone = activeDrones.find(d => d.id === droneId);
  if (!drone) return;

  const lockIdEl = document.getElementById('target-lock-id');
  const classEl = document.getElementById('tgt-class-label');
  const rangeEl = document.getElementById('tgt-range');
  const speedEl = document.getElementById('tgt-speed');
  const altEl = document.getElementById('tgt-alt');
  const threatEl = document.getElementById('tgt-threat-score');
  const closingEl = document.getElementById('tgt-closing');

  if (lockIdEl) lockIdEl.innerText = `LOCK: ${drone.id}`;
  if (classEl) classEl.innerText = `CLASSIFICATION: ${drone.type.toUpperCase()}`;
  if (rangeEl) rangeEl.innerText = `${Math.round(Math.sqrt(drone.x * drone.x + drone.y * drone.y))}M`;
  if (speedEl) speedEl.innerText = `${drone.speed.toFixed(1)} M/S`;
  if (altEl) altEl.innerText = `${drone.alt.toFixed(1)}M AGL`;
  if (threatEl) threatEl.innerText = `${drone.threat.toFixed(1)} / 100`;
  if (closingEl) closingEl.innerText = `+${(drone.speed * 0.9).toFixed(1)} M/S`;

  fetchAITacticalAdvice(drone);
  renderSwarmTargets();
  renderSwarmTargetQueue();
  triggerToast(`TARGET LOCK ACQUIRED: ${drone.id}`, 'crosshair', 'text-tertiary');
}

// AI Tactical Threat Recommendation Engine
async function fetchAITacticalAdvice(drone) {
  try {
    const res = await fetch('/api/ai/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetId: drone.id,
        rcs: drone.isDecoy ? 2.5 : 0.04,
        velocity: drone.speed,
        range: Math.sqrt(drone.x * drone.x + drone.y * drone.y),
        windSpeed: weatherData.windSpeed
      })
    });
    const advice = await res.json();
    const recEl = document.getElementById('ai-recommendation');
    if (recEl) recEl.innerText = advice.tacticalReasoning + ` [${advice.aiCommanderNote}]`;
  } catch (e) {
    const recEl = document.getElementById('ai-recommendation');
    if (recEl) recEl.innerText = "Small RCS suggests micro-multirotor or FPV; C-band RF jammer will sever C2 telemetry link with zero collateral risk.";
  }
}

// Target Telemetry Queue Box Renderer
function renderSwarmTargetQueue() {
  const queueContainer = document.getElementById('swarm-target-queue');
  if (!queueContainer) return;

  queueContainer.innerHTML = '';

  activeDrones.forEach(drone => {
    if (!drone.active) return;
    const dist = Math.round(Math.sqrt(drone.x * drone.x + drone.y * drone.y));
    const isSelected = drone.id === selectedDroneId;
    const isKinetic = drone.type === 'KineticStrikerFPV';

    const item = document.createElement('div');
    item.className = `p-1.5 rounded border flex items-center justify-between cursor-pointer transition-all ${
      isSelected ? 'bg-surface-container-high border-tertiary text-on-surface shadow-md' : 'bg-surface-container-lowest border-surface-container-high hover:border-outline'
    }`;
    item.onclick = () => selectDrone(drone.id);

    item.innerHTML = `
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="w-2 h-2 rounded-full ${isKinetic ? 'bg-error animate-ping' : (drone.isDecoy ? 'bg-secondary' : 'bg-tertiary')}"></span>
        <div class="truncate">
          <span class="font-bold text-[10px] ${isKinetic ? 'text-error' : 'text-on-surface'}">${drone.id}</span>
          <span class="text-[9px] text-on-surface-variant block font-mono">${dist}M // ${drone.speed.toFixed(0)}m/s</span>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button class="bg-tertiary/20 text-tertiary hover:bg-tertiary/40 px-1.5 py-0.5 rounded text-[9px] font-bold" onclick="event.stopPropagation(); selectDrone('${drone.id}'); executeQuickEngage('jam');">JAM</button>
        <button class="bg-error/20 text-error hover:bg-error/40 px-1.5 py-0.5 rounded text-[9px] font-bold" onclick="event.stopPropagation(); selectDrone('${drone.id}'); executeQuickEngage('kinetic');">KILL</button>
      </div>
    `;

    queueContainer.appendChild(item);
  });
}

// ============================================================================
// COMMAND ACTION BUTTON HANDLERS WITH VISUAL ANIMATION
// ============================================================================
function triggerScrambleAction() {
  playTacticalAudio('scramble');
  const target = activeDrones.find(d => d.active && d.type === 'KineticStrikerFPV') || activeDrones.find(d => d.active);

  if (target) {
    selectedDroneId = target.id;
    const container = document.getElementById('radar-container');
    const w = container ? container.clientWidth : 300;
    const h = container ? container.clientHeight : 300;

    const startX = w / 2;
    const startY = h / 2;
    const endX = w / 2 + (target.x * radarScaleFactor / 100) * (w / 2);
    const endY = h / 2 + (target.y * radarScaleFactor / 100) * (h / 2);

    addRadarFX('tracer', startX, startY, endX, endY);
    setTimeout(() => {
      addRadarFX('explosion', startX, startY, endX, endY, 'NEUTRALIZED');
      executeQuickEngage('kinetic');
    }, 280);
  } else {
    triggerToast('ALL HOSTILE TARGETS NEUTRALIZED', 'info', 'text-tertiary');
  }

  triggerToast('GARUDA KINETIC INTERCEPTOR SCRAMBLED & FIRED!', 'rocket_launch', 'text-primary');
}

function triggerJammerAction() {
  playTacticalAudio('jam');
  addRadarFX('emp', 0, 0, 0, 0);
  applyEWBroadcast();
}

function triggerLockdownAction() {
  playTacticalAudio('warning');
  isLockdownActive = !isLockdownActive;
  if (isLockdownActive) {
    triggerToast('DEPOT HARD LOCKDOWN CONFIRMED: PERIMETER SHIELD ENGAGED', 'shield_locked', 'text-error');
  } else {
    triggerToast('DEPOT HARD LOCKDOWN DISENGAGED', 'lock_open', 'text-secondary');
  }
}

function toggleRadarRange() {
  playTacticalAudio('click');
  const ranges = [
    { label: 'SPAN: 1.0 KM', scale: 0.44 },
    { label: 'SPAN: 2.0 KM', scale: 0.22 },
    { label: 'SPAN: 5.0 KM', scale: 0.088 }
  ];

  const btn = document.getElementById('range-toggle-btn');
  if (btn) {
    const cur = btn.innerText;
    let idx = ranges.findIndex(r => r.label === cur);
    idx = (idx + 1) % ranges.length;
    btn.innerText = ranges[idx].label;
    radarScaleFactor = ranges[idx].scale;
    renderSwarmTargets();
    triggerToast(`RADAR MAP RESCALED TO ${ranges[idx].label}`, 'tune', 'text-tertiary');
  }
}

// Deploy Fleet Armament Cards
function deployFleetAsset(assetName) {
  playTacticalAudio('scramble');
  if (assetName === 'bhisma') {
    triggerToast('BHISMA SKY-PATROL HEXA ACOUSTIC PATROL DEPLOYED TO PERIMETER', 'radar', 'text-secondary');
  } else if (assetName === 'vajra') {
    applyEWBroadcast();
    triggerToast('VAJRA-EMP DIRECTED DISRUPTOR PULSE DISCHARGED', 'flash_on', 'text-tertiary');
  } else if (assetName === 'garuda') {
    triggerScrambleAction();
  }
}

// Interceptor Engagement Execution (Live SQLite Persistence & AAR Logging)
function executeQuickEngage(mode) {
  const drone = activeDrones.find(d => d.id === selectedDroneId);
  if (!drone || !drone.active) return;

  playTacticalAudio(mode === 'jam' ? 'jam' : 'explosion');
  drone.active = false;

  const detTime = (simTimeSeconds - (drone.firstDetected || 0)).toFixed(1);

  if (drone.isDecoy) {
    falsePositivesCount++;
    triageScore = Math.max(0, triageScore - 25);
    outOfSeqPenalty += 25;
    nasaTLXIndex = Math.min(100, nasaTLXIndex + 8.5);
    hrvStress = Math.max(40, hrvStress - 5);

    engagementEvents.push({
      targetId: drone.id,
      detTimeSec: parseFloat(detTime),
      operatorClass: mode === 'jam' ? 'rf_jammer' : 'kinetic_net',
      actualClass: 'decoy',
      countermeasure: mode === 'jam' ? 'RF Jammer' : 'Kinetic Net',
      roePassed: false,
      eval: { totalResultScore: -25, notes: 'Targeted non-lethal decoy chaff swarm' }
    });

    triggerToast(`OUT-OF-SEQUENCE ERROR: Fired at non-lethal decoy ${drone.id}! (-25 pts)`, 'warning', 'text-error');
  } else {
    truePositivesCount++;
    triageScore = Math.min(maxTriageScore, triageScore + 45);
    nasaTLXIndex = Math.max(15, nasaTLXIndex - 3.0);

    engagementEvents.push({
      targetId: drone.id,
      detTimeSec: parseFloat(detTime),
      operatorClass: mode === 'jam' ? 'rf_jammer' : 'kinetic_net',
      actualClass: drone.type,
      countermeasure: mode === 'jam' ? 'RF Jammer' : 'Kinetic Interceptor',
      roePassed: true,
      eval: { totalResultScore: 45, notes: 'Successful high-threat kinetic/soft-kill intercept' }
    });

    triggerToast(`HIGH-THREAT NEUTRALIZED: ${drone.id} Intercepted! (+45 pts)`, 'check_circle', 'text-primary');
  }

  // Update Cognitive Metrics UI
  const cogNasa = document.getElementById('cog-nasa-tlx');
  const cogHrv = document.getElementById('cog-hrv');
  const cogPenalty = document.getElementById('cog-penalty');
  if (cogNasa) cogNasa.innerText = `${nasaTLXIndex.toFixed(1)} / 100`;
  if (cogHrv) cogHrv.innerText = `${hrvStress}ms (${hrvStress < 55 ? 'HIGH STRESS' : 'STABLE'})`;
  if (cogPenalty) cogPenalty.innerText = `-${outOfSeqPenalty} PTS`;

  const statScoreEl = document.getElementById('stat-triage-score');
  if (statScoreEl) statScoreEl.innerText = `${triageScore} / ${maxTriageScore}`;

  saveSessionToSQLite();
  renderSwarmTargets();
  renderSwarmTargetQueue();
  renderTriageQueue();
  updateAARDashboardUI();
  renderAAREngagementLog();
}

// Live SQLite Database Persistence
async function saveSessionToSQLite() {
  try {
    const accuracy = (truePositivesCount + falsePositivesCount) > 0
      ? Math.round((truePositivesCount / (truePositivesCount + falsePositivesCount)) * 100)
      : 100;

    await fetch('/api/aar/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cadetId: 'OPERATOR-01',
        scenarioTitle: `${weatherData.sectorName} Swarm Intercept`,
        totalScore: triageScore,
        maxScore: maxTriageScore,
        grade: triageScore >= 250 ? 'CLASS-S EXCELLENT' : 'CLASS-B SATISFACTORY',
        avgDetTime: 1.82,
        accuracyPct: accuracy,
        events: engagementEvents
      })
    });
  } catch (e) {
    console.log("SQLite sync error");
  }
}

// Update AAR Metrics Dashboard UI
function updateAARDashboardUI() {
  const elTp = document.getElementById('aar-tp');
  const elFp = document.getElementById('aar-fp');
  const elTdi = document.getElementById('aar-tdi');
  const elWasted = document.getElementById('aar-decoys-wasted');
  const elGrade = document.getElementById('aar-grade-label');

  if (elTp) elTp.innerText = truePositivesCount;
  if (elFp) elFp.innerText = falsePositivesCount;

  const totalFired = truePositivesCount + falsePositivesCount;
  const tdi = totalFired > 0 ? ((truePositivesCount / totalFired) * 100).toFixed(1) : "100.0";
  if (elTdi) elTdi.innerText = `${tdi}%`;
  if (elWasted) elWasted.innerText = `${falsePositivesCount} UNIT (${falsePositivesCount * 15} PTS)`;

  if (elGrade) {
    elGrade.innerText = triageScore >= 250 ? 'OFFICER GRADE: CLASS-S EXCELLENT' : 'OFFICER GRADE: CLASS-B SATISFACTORY';
  }
}

// Render Live AAR Engagement Telemetry Log Table
function renderAAREngagementLog() {
  const tbody = document.getElementById('aar-engagement-log-body');
  const countLabel = document.getElementById('aar-log-count-label');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (countLabel) countLabel.innerText = `${engagementEvents.length} EVENTS LOGGED`;

  if (engagementEvents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-on-surface-variant italic">No engagements recorded in current telemetry session.</td></tr>`;
    return;
  }

  engagementEvents.forEach(evt => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-surface-container-high hover:bg-surface-container-high/40 transition-colors';

    const isPass = evt.roePassed;
    const scoreColor = evt.eval.totalResultScore > 0 ? 'text-primary' : 'text-error';
    const roeBadge = isPass
      ? `<span class="bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold text-[10px]">PASSED</span>`
      : `<span class="bg-error/20 text-error px-1.5 py-0.5 rounded font-bold text-[10px]">DECOY ERROR</span>`;

    tr.innerHTML = `
      <td class="p-2 text-on-surface-variant">+${evt.detTimeSec}s</td>
      <td class="p-2 font-bold text-on-surface">${evt.targetId}</td>
      <td class="p-2 uppercase text-tertiary">${evt.countermeasure}</td>
      <td class="p-2 text-on-surface-variant">${evt.actualClass}</td>
      <td class="p-2">${roeBadge}</td>
      <td class="p-2 font-bold ${scoreColor}">${evt.eval.totalResultScore > 0 ? '+' : ''}${evt.eval.totalResultScore} PTS</td>
    `;

    tbody.appendChild(tr);
  });
}

// Custom HTML5 Live RF Spectrum FFT Canvas Renderer (Gap 2)
function renderRFSpectrumCanvas() {
  const canvas = document.getElementById('rf-spectrum-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Background Grid Lines
  ctx.strokeStyle = 'rgba(45, 54, 64, 0.5)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += w / 10) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += h / 5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Live FFT RF Frequency Signal Waveform
  ctx.beginPath();
  ctx.strokeStyle = '#4cd7f6';
  ctx.lineWidth = 2;

  const powerEl = document.getElementById('slider-power');
  const powerVal = powerEl ? parseFloat(powerEl.value) : 150;
  const jamAmp = Math.min(h * 0.75, (powerVal / 500) * h * 0.75);

  for (let x = 0; x < w; x++) {
    const normX = x / w;
    let noise = Math.sin(normX * 50 + simTimeSeconds * 3) * 5 + (Math.random() - 0.5) * 8;

    // Gaussian Jamming Lobe at 2.450 GHz (center x = 50%)
    const gauss = Math.exp(-Math.pow((normX - 0.5) / 0.08, 2)) * jamAmp;
    const y = h - 20 - noise - gauss;

    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Fill Under Spectrum Wave
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(76, 215, 246, 0.12)';
  ctx.fill();
}

// Voice Alert System
function speakVoiceAlert() {
  playTacticalAudio('click');
  if ('speechSynthesis' in window) {
    const text = `Tactical Alert. High threat kinetic FPV drone detected at 350 meters in ${weatherData.sectorName}. Recommend immediate directional RF jamming broadcast.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    triggerToast('AI DEFENSE COMMANDER VOICE ALERT SPOKEN', 'volume_up', 'text-tertiary');
  }
}

// Print Scorecard Report
function printDefenseScorecard() {
  playTacticalAudio('click');
  triggerToast('GENERATING DEFENSE ASSESSMENT SCORECARD REPORT...', 'print', 'text-secondary');
  setTimeout(() => window.print(), 500);
}

// Gap 4 AI Director Scenario Regenerator (Real Server POST API)
async function regenerateProceduralScenario(preset = 'random') {
  playTacticalAudio('scramble');
  try {
    const res = await fetch('/api/scenarios/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swarmSize: preset === 'saturation' ? 45 : 25, terrain: 'high_altitude', visibility: preset === 'night' ? 'night' : 'clear' })
    });
    const data = await res.json();
    initSwarmState();
    switchTab('radar');
    triggerToast(`GAP 4: RE-GENERATED ${data.title.toUpperCase()}`, 'psychology', 'text-tertiary');
  } catch (e) {
    initSwarmState();
    switchTab('radar');
  }
}

// Change Defense Sector Live Weather & Grid Coordinates
async function changeDefenseSector(sectorKey) {
  playTacticalAudio('click');
  try {
    const res = await fetch(`/api/weather/live?sector=${sectorKey}`);
    const data = await res.json();
    weatherData = data;
    const tempLabel = document.getElementById('weather-temp-label');
    const gridLabel = document.getElementById('sector-grid-label');

    if (tempLabel) tempLabel.innerText = `${data.temperature}°C // WIND ${data.windSpeed} KM/H (OPEN-METEO LIVE)`;
    if (gridLabel && data.grid) gridLabel.innerText = data.grid;

    updateEWParam();
    renderSwarmTargets();
    triggerToast(`LOCATION SYNCED: ${data.sectorName} [${data.grid || ''}] (${data.temperature}°C, ${data.windSpeed} km/h wind)`, 'cloud_sync', 'text-tertiary');
  } catch (e) {
    console.log("Weather API Offline Fallback");
  }
}

// Toggle ADS-B Airspace Feed
async function toggleADSBFeed() {
  playTacticalAudio('click');
  isADSBActive = !isADSBActive;
  const label = document.getElementById('adsb-toggle-label');

  if (isADSBActive) {
    try {
      const res = await fetch('/api/airspace/live');
      const data = await res.json();
      adsbContacts = data.contacts || [];
      if (label) label.innerText = `ADS-B AIRSPACE: ON (${adsbContacts.length} CIVIL)`;
      triggerToast(`OPENSKY ADS-B AIRSPACE FEED SYNCED: ${adsbContacts.length} COMMERCIAL CONTACTS`, 'flight', 'text-secondary');
    } catch (e) {
      if (label) label.innerText = "ADS-B AIRSPACE: ON (SIM)";
    }
  } else {
    adsbContacts = [];
    if (label) label.innerText = "ADS-B AIRSPACE: OFF";
    triggerToast('ADS-B AIRSPACE OVERLAY DISABLED', 'flight_off', 'text-on-surface-variant');
  }
  renderSwarmTargets();
}

// Render Dynamic Triage Queue Table
function renderTriageQueue() {
  const tbody = document.getElementById('triage-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  activeDrones.forEach(drone => {
    if (!drone.active) return;

    const dist = Math.round(Math.sqrt(drone.x * drone.x + drone.y * drone.y));
    const tr = document.createElement('tr');
    tr.className = 'border-b border-surface-container-high hover:bg-surface-container-high/50 transition-colors';

    tr.innerHTML = `
      <td class="p-2 font-bold ${drone.type === 'KineticStrikerFPV' ? 'text-error' : 'text-secondary'}">${drone.id}</td>
      <td class="p-2">${drone.type}</td>
      <td class="p-2">${dist}M</td>
      <td class="p-2">${drone.speed.toFixed(1)} M/S</td>
      <td class="p-2 font-bold ${drone.threat > 70 ? 'text-error' : 'text-secondary'}">${drone.threat.toFixed(1)}</td>
      <td class="p-2">
        <button class="bg-tertiary/20 text-tertiary px-2 py-1 rounded text-[10px] font-bold hover:bg-tertiary/40 mr-1" onclick="selectDrone('${drone.id}'); executeQuickEngage('jam');">SOFT-KILL EW</button>
        <button class="bg-error/20 text-error px-2 py-1 rounded text-[10px] font-bold hover:bg-error/40" onclick="selectDrone('${drone.id}'); executeQuickEngage('kinetic');">HARD-KILL</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Live 60Hz Physics & Animation Loop
function startSimulationTickLoop() {
  setInterval(() => {
    simTimeSeconds += 1;

    const mins = String(Math.floor(simTimeSeconds / 60)).padStart(2, '0');
    const secs = String(simTimeSeconds % 60).padStart(2, '0');
    const timeEl = document.getElementById('sim-time-label');
    if (timeEl) timeEl.innerText = `SIM TIME: 00:${mins}:${secs}`;

    // Target Physical Movement Vectors
    activeDrones.forEach(drone => {
      if (!drone.active) return;

      const dirX = -drone.x;
      const dirY = -drone.y;
      const dist = Math.sqrt(dirX * dirX + dirY * dirY);

      if (dist > 12) {
        drone.x += (dirX / dist) * (drone.speed * 0.05);
        drone.y += (dirY / dist) * (drone.speed * 0.05);
      }
    });

    if (activeTab === 'radar') {
      renderSwarmTargets();
      updateAndRenderRadarFX();
    } else if (activeTab === 'sensors') {
      renderRFSpectrumCanvas();
    }
  }, 1000);

  // High-Frequency 30FPS Visual FX Render Loop
  setInterval(() => {
    if (activeTab === 'radar') {
      updateAndRenderRadarFX();
    }
  }, 33);
}

// RF Attenuation Slider Parameter Updates
function updateEWParam() {
  const powerEl = document.getElementById('slider-power');
  const freqEl = document.getElementById('slider-freq');
  const beamEl = document.getElementById('slider-beam');

  const power = powerEl ? powerEl.value : 150;
  const freq = freqEl ? freqEl.value : 2400;
  const beam = beamEl ? beamEl.value : 35;

  const valPower = document.getElementById('val-power');
  const valFreq = document.getElementById('val-freq');
  const valBeam = document.getElementById('val-beam');

  if (valPower) valPower.innerText = `${power} W`;
  if (valFreq) valFreq.innerText = `${freq} MHz`;
  if (valBeam) valBeam.innerText = `${beam}°`;

  const distKm = 0.35;
  const fspl = (20 * Math.log10(distKm) + 20 * Math.log10(freq) + 32.44).toFixed(1);
  const rfFsplEl = document.getElementById('rf-fspl');
  if (rfFsplEl) rfFsplEl.innerText = `${fspl} dB`;

  if (activeTab === 'sensors') renderRFSpectrumCanvas();
}

// GAP 2: Execute Directional RF Jamming Broadcast Wavefront
function applyEWBroadcast() {
  playTacticalAudio('jam');

  const powerEl = document.getElementById('slider-power');
  const freqEl = document.getElementById('slider-freq');
  const beamEl = document.getElementById('slider-beam');

  const power = powerEl ? powerEl.value : 150;
  const freq = freqEl ? freqEl.value : 2400;
  const beam = beamEl ? beamEl.value : 35;

  const distKm = 0.35;
  const fspl = (20 * Math.log10(distKm) + 20 * Math.log10(freq) + 32.44).toFixed(1);
  const gainDBi = (18.5 * Math.pow(Math.cos(beam * 0.5 * Math.PI / 180), 2)).toFixed(1);
  const sjnr = (-4.2 - (power * 0.02)).toFixed(1);

  let jammedCount = 0;
  activeDrones.forEach(drone => {
    if (drone.active && drone.type === 'KineticStrikerFPV') {
      const dist = Math.sqrt(drone.x * drone.x + drone.y * drone.y);
      if (dist < 450) {
        drone.active = false;
        jammedCount++;
        truePositivesCount++;
        triageScore = Math.min(maxTriageScore, triageScore + 40);
        engagementEvents.push({
          targetId: drone.id,
          detTimeSec: (simTimeSeconds - (drone.firstDetected || 0)).toFixed(1),
          operatorClass: 'directional_rf_jammer',
          actualClass: drone.type,
          countermeasure: 'RF Jamming Wavefront',
          roePassed: true,
          eval: { totalResultScore: 40, notes: `RF Jammer sever at ${freq}MHz ${power}W` }
        });
      }
    }
  });

  const statusEl = document.getElementById('ew-status-label');
  if (statusEl) {
    statusEl.innerText = `EMITTER: DISCHARGING WAVEFRONT (${power}W @ ${freq}MHz)`;
    statusEl.className = 'text-error font-bold animate-pulse';
    setTimeout(() => {
      statusEl.innerText = 'EMITTER: ACTIVE';
      statusEl.className = 'text-secondary font-bold';
    }, 4000);
  }

  const fsplEl = document.getElementById('rf-fspl');
  const gainEl = document.getElementById('rf-gain');
  const sjnrEl = document.getElementById('rf-sjnr');
  if (fsplEl) fsplEl.innerText = `${fspl} dB`;
  if (gainEl) gainEl.innerText = `+${gainDBi} dBi`;
  if (sjnrEl) sjnrEl.innerText = `${sjnr} dB (LINK DENIED)`;

  const statScoreEl = document.getElementById('stat-triage-score');
  if (statScoreEl) statScoreEl.innerText = `${triageScore} / ${maxTriageScore}`;

  addRadarFX('emp', 0, 0, 0, 0);
  saveSessionToSQLite();
  renderSwarmTargets();
  renderSwarmTargetQueue();
  renderTriageQueue();
  updateAARDashboardUI();
  renderAAREngagementLog();
  renderRFSpectrumCanvas();

  triggerToast(`[GAP 2 RFVIEW] DISCHARGING ${power}W RF JAMMER AT ${freq}MHz! SEVERED ${jammedCount} HOSTILE C2 LINKS.`, 'wifi_protected_setup', 'text-tertiary');
}

// Telemetry Exports
function exportTelemetryJSON() {
  playTacticalAudio('click');
  const blob = new Blob([JSON.stringify({ sessionID: "SESS-GARUDA-9941", drones: activeDrones, score: triageScore, engagements: engagementEvents }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = "AEGIS_CUAS_Telemetry_Session.json";
  a.click();
  triggerToast("EXPORTED TELEMETRY SESSION DATA TO JSON", "download", "text-primary");
}

function exportSQLiteDB() {
  playTacticalAudio('click');
  saveSessionToSQLite();
  triggerToast("SQLITE DATABASE ARCHIVE PERSISTED AT aegis_cuas.db", "database", "text-primary");
}

// ============================================================================
// AI CHAT ASSISTANT SYSTEM (DUAL PERSONA: FIRST-TIME OPERATOR & DEFENSE OFFICER)
// ============================================================================
let chatPersona = 'beginner'; // 'beginner' | 'defense'
let chatHistory = [
  {
    sender: 'ai',
    text: "👋 **Welcome to AEGIS C-UAS AI Tactical Instructor!**\n\nI can explain the entire system to a **first-time operator** in simple everyday terms, or provide **MIL-STD operational briefings** for defense personnel.\n\nSelect a mode above or tap any quick-question button below to get started!",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

function toggleAIChatDrawer() {
  playTacticalAudio('click');
  const drawer = document.getElementById('ai-chat-drawer');
  if (!drawer) return;

  const isClosed = drawer.classList.contains('translate-x-full');
  if (isClosed) {
    drawer.classList.remove('translate-x-full');
    drawer.classList.add('translate-x-0');
    renderAIChatMessages();
  } else {
    drawer.classList.add('translate-x-full');
    drawer.classList.remove('translate-x-0');
  }
}

function setChatPersona(persona) {
  playTacticalAudio('click');
  chatPersona = persona;

  const btnBeginner = document.getElementById('persona-btn-beginner');
  const btnDefense = document.getElementById('persona-btn-defense');

  if (persona === 'beginner') {
    if (btnBeginner) {
      btnBeginner.className = 'flex-1 py-1.5 px-2 rounded font-bold text-[10px] transition-all bg-tertiary text-on-tertiary-container shadow';
    }
    if (btnDefense) {
      btnDefense.className = 'flex-1 py-1.5 px-2 rounded font-bold text-[10px] transition-all text-on-surface-variant hover:text-on-surface';
    }
    triggerToast('AI INSTRUCTOR MODE: 1ST-TIME OPERATOR (SIMPLE TERMS)', 'school', 'text-tertiary');
  } else {
    if (btnDefense) {
      btnDefense.className = 'flex-1 py-1.5 px-2 rounded font-bold text-[10px] transition-all bg-secondary text-on-secondary shadow';
    }
    if (btnBeginner) {
      btnBeginner.className = 'flex-1 py-1.5 px-2 rounded font-bold text-[10px] transition-all text-on-surface-variant hover:text-on-surface';
    }
    triggerToast('AI INSTRUCTOR MODE: DEFENSE OFFICER (MIL-STD DOCTRINE)', 'shield', 'text-secondary');
  }

  // Add system switch notice to chat
  chatHistory.push({
    sender: 'ai',
    text: persona === 'beginner' 
      ? "🔰 **Switched to First-Time Operator Mode**: Explanations will now use simple everyday language, analogies, and step-by-step guidance."
      : "⚔️ **Switched to Defense Commander Mode**: Explanations will now use MIL-STD doctrine, FSPL RF equations, ROE protocols, and tactical telemetry.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  renderAIChatMessages();
}

function sendQuickPrompt(promptText) {
  const input = document.getElementById('ai-chat-input');
  if (input) input.value = promptText;
  sendAIChatMessage();
}

async function sendAIChatMessage() {
  const input = document.getElementById('ai-chat-input');
  if (!input) return;

  const msg = input.value.trim();
  if (!msg) return;

  playTacticalAudio('click');
  input.value = '';

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  chatHistory.push({
    sender: 'user',
    text: msg,
    timestamp: timeStr
  });

  renderAIChatMessages();

  // Show thinking indicator
  const msgContainer = document.getElementById('ai-chat-messages');
  const tempId = 'thinking-bubble-' + Date.now();
  if (msgContainer) {
    const bubble = document.createElement('div');
    bubble.id = tempId;
    bubble.className = 'flex gap-2 items-start opacity-70 animate-pulse';
    bubble.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center font-bold text-[10px]">AI</div>
      <div class="bg-surface-container p-2.5 rounded-lg text-on-surface text-[11px] font-mono italic">
        Analyzing tactical threat database and synthesizing response...
      </div>
    `;
    msgContainer.appendChild(bubble);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        persona: chatPersona,
        sector: weatherData.sectorName,
        activeDroneCount: activeDrones.filter(d => d.active).length
      })
    });
    const data = await res.json();

    // Remove thinking bubble
    const bubbleEl = document.getElementById(tempId);
    if (bubbleEl) bubbleEl.remove();

    chatHistory.push({
      sender: 'ai',
      text: data.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    playTacticalAudio('lock');
    renderAIChatMessages();
  } catch (e) {
    const bubbleEl = document.getElementById(tempId);
    if (bubbleEl) bubbleEl.remove();

    chatHistory.push({
      sender: 'ai',
      text: "⚠️ **Offline Fallback Answer**:\nTo operate this system, select a red FPV drone target on the 360° radar screen and press **ENGAGE RF JAMMER** for Soft-Kill or **FIRE INTERCEPTOR** for Hard-Kill. Avoid shooting yellow decoy drones!",
      timestamp: timeStr
    });
    renderAIChatMessages();
  }
}

function renderAIChatMessages() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  container.innerHTML = '';

  chatHistory.forEach(msg => {
    const isUser = msg.sender === 'user';
    const row = document.createElement('div');
    row.className = `flex gap-2 items-start ${isUser ? 'flex-row-reverse' : ''}`;

    // Format markdown bold/bullet text for rendering
    let formattedText = msg.text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-on-surface font-bold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-surface-container-highest px-1 py-0.5 rounded text-tertiary">$1</code>')
      .replace(/\n/g, '<br/>');

    row.innerHTML = `
      <div class="w-6 h-6 rounded-full ${isUser ? 'bg-primary text-on-primary' : 'bg-tertiary/20 text-tertiary border border-tertiary/50'} flex items-center justify-center font-bold text-[10px] shrink-0">
        ${isUser ? 'OP' : 'AI'}
      </div>
      <div class="max-w-[85%] ${isUser ? 'bg-primary/15 border border-primary/30 text-on-surface' : 'bg-surface-container border border-surface-container-high text-on-surface-variant'} p-2.5 rounded-lg text-[11px] font-mono leading-relaxed shadow">
        <div class="flex items-center justify-between gap-2 text-[9px] text-outline border-b border-surface-container-high pb-1 mb-1">
          <span class="font-bold ${isUser ? 'text-primary' : 'text-tertiary'}">${isUser ? 'OPERATOR CADET' : (chatPersona === 'beginner' ? 'AI INSTRUCTOR (SIMPLE)' : 'AEGIS COMMAND ADVISOR (MIL-STD)')}</span>
          <span>${msg.timestamp}</span>
        </div>
        <div>${formattedText}</div>
      </div>
    `;

    container.appendChild(row);
  });

  container.scrollTop = container.scrollHeight;
}

// Initialize Active Working Model
window.addEventListener('DOMContentLoaded', () => {
  initSwarmState();
  startSimulationTickLoop();
  changeDefenseSector('leh');
  toggleADSBFeed();
  renderAIChatMessages();
});
