/**
 * SENTINEL-Drone After-Action Review (AAR) & Analytics Engine
 * Features:
 * 1. Interactive Timeline Scrubber & Replay Canvas
 * 2. 6-Axis Skill Radar Chart (Detection, Classification, Decision, Comm, Awareness, Resilience)
 * 3. Error Heat Map & Categorization
 * 4. "What You Did" vs "What Doctrine Recommends" Side-by-Side Matrix
 * 5. Explainable AI Coach Plain-Language Debrief & Prescriptive Drills
 * 6. Historical Session Trends & Export to CSV / PDF Dossier
 */
window.AAREngine = {
    replayCanvas: null,
    replayCtx: null,
    radarChart: null,
    sessionHistory: [],
    currentSessionLog: [],
    replayTimeSec: 0,
    maxReplayTime: 60,
    currentAARData: null,

    init: function() {
        this.replayCanvas = document.getElementById('aarCanvas');
        if (this.replayCanvas) {
            this.replayCtx = this.replayCanvas.getContext('2d');
        }
        this.fetchHistoricalSessions();
    },

    logEvent: function(eventData) {
        this.currentSessionLog.push(eventData);
    },

    finishSession: function(summaryData) {
        this.currentAARData = summaryData;
        this.updateAARUI(summaryData);
        this.renderSkillRadar(summaryData.skillRadar);
        this.saveSessionToBackend(summaryData);
    },

    saveSessionToBackend: function(summary) {
        fetch('/api/sessions/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: summary.sessionId,
                userId: window.SimulationApp ? window.SimulationApp.currentUserId : 'USER-CADET-01',
                scenarioId: summary.scenarioId || 'SCEN-01',
                totalScore: summary.totalScore,
                maxScore: summary.maxScore,
                grade: summary.grade,
                avgDetTime: summary.avgDetTime,
                accuracyPct: summary.accuracyPct,
                metrics: summary.metrics,
                errors: summary.errors || [],
                skillRadar: summary.skillRadar,
                replayTelemetry: summary.replayTelemetry || []
            })
        })
        .then(r => r.json())
        .then(data => {
            console.log('[AAR Backend] Saved session successfully:', data.sessionId);
            this.fetchHistoricalSessions();
        })
        .catch(err => console.warn('[AAR Backend] Running in offline local mode:', err));
    },

    fetchHistoricalSessions: function() {
        fetch('/api/aar/history')
        .then(r => r.json())
        .then(data => {
            if (Array.isArray(data)) {
                this.sessionHistory = data;
                this.renderHistoryTable(data);
            }
        })
        .catch(err => console.warn('[AAR] History fetch operating offline:', err));
    },

    updateAARUI: function(summary) {
        // Overall Grade & Scores
        const scoreElem = document.getElementById('aarScore');
        if (scoreElem) scoreElem.textContent = `${summary.totalScore} / ${summary.maxScore}`;

        const gradeElem = document.getElementById('aarGrade');
        if (gradeElem) {
            gradeElem.textContent = `GRADE: ${summary.grade}`;
            gradeElem.className = `font-mono text-xs px-2 py-0.5 rounded font-bold ${
                summary.grade === 'MASTER' ? 'bg-primary/20 text-primary border border-primary/40' :
                (summary.grade === 'DISTINGUISHED' ? 'bg-secondary/20 text-secondary border border-secondary/40' :
                'bg-error/20 text-error border border-error/40')
            }`;
        }

        const detElem = document.getElementById('aarDetTime');
        if (detElem) detElem.textContent = `${summary.avgDetTime}s`;

        const accElem = document.getElementById('aarClassAccuracy');
        if (accElem) accElem.textContent = `${summary.accuracyPct}%`;

        // Render 6-Metric Breakdown
        const metricsContainer = document.getElementById('aarMetricBreakdown');
        if (metricsContainer && summary.metrics) {
            metricsContainer.innerHTML = `
                <div class="bg-surface-container-high/60 p-2 rounded flex flex-col gap-1 border border-surface-container-highest">
                    <span class="text-[9px] text-on-surface-variant font-mono">1. DETECTION SPEED (20%)</span>
                    <span class="text-sm font-bold text-primary font-mono">${summary.metrics.detectionTimeScore} / 200</span>
                </div>
                <div class="bg-surface-container-high/60 p-2 rounded flex flex-col gap-1 border border-surface-container-highest">
                    <span class="text-[9px] text-on-surface-variant font-mono">2. CLASSIFICATION (25%)</span>
                    <span class="text-sm font-bold text-primary font-mono">${summary.metrics.classificationScore} / 250</span>
                </div>
                <div class="bg-surface-container-high/60 p-2 rounded flex flex-col gap-1 border border-surface-container-highest">
                    <span class="text-[9px] text-on-surface-variant font-mono">3. SWARM AWARENESS (15%)</span>
                    <span class="text-sm font-bold text-primary font-mono">${summary.metrics.situationalScore} / 150</span>
                </div>
                <div class="bg-surface-container-high/60 p-2 rounded flex flex-col gap-1 border border-surface-container-highest">
                    <span class="text-[9px] text-on-surface-variant font-mono">4. ENGAGEMENT QUALITY (25%)</span>
                    <span class="text-sm font-bold text-primary font-mono">${summary.metrics.engagementScore} / 250</span>
                </div>
                <div class="bg-surface-container-high/60 p-2 rounded flex flex-col gap-1 border border-surface-container-highest">
                    <span class="text-[9px] text-on-surface-variant font-mono">5. COMMUNICATION (10%)</span>
                    <span class="text-sm font-bold text-primary font-mono">${summary.metrics.communicationScore} / 100</span>
                </div>
                <div class="bg-surface-container-high/60 p-2 rounded flex flex-col gap-1 border border-surface-container-highest">
                    <span class="text-[9px] text-on-surface-variant font-mono">6. DEGRADED PERFORMANCE (5%)</span>
                    <span class="text-sm font-bold text-primary font-mono">${summary.metrics.degradedScore} / 50</span>
                </div>
            `;
        }

        // Render AI Coach Plain-Language Debrief
        const debriefElem = document.getElementById('aarAIDebriefText');
        if (debriefElem && summary.aiDebrief) {
            debriefElem.textContent = summary.aiDebrief;
        }

        // Render Decision Table (What You Did vs Expert Doctrine)
        const tbody = document.getElementById('aarTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            if (!summary.events || summary.events.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-on-surface-variant py-4 font-mono text-xs">No engagements logged for this session.</td></tr>';
            } else {
                summary.events.forEach(ev => {
                    const tr = document.createElement('tr');
                    tr.className = "border-b border-surface-container-high font-mono text-[10px]";
                    tr.innerHTML = `
                        <td class="p-2 text-tertiary">[T+${ev.timestampSec || 0}s]</td>
                        <td class="p-2 font-bold text-on-surface">${ev.contactId}</td>
                        <td class="p-2"><span class="px-1.5 py-0.5 rounded ${ev.isCorrectClass ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'} font-bold">${(ev.classification || 'UNKNOWN').toUpperCase()}</span></td>
                        <td class="p-2 text-on-surface-variant font-bold">${(ev.action || 'NONE').toUpperCase()}</td>
                        <td class="p-2 text-secondary font-bold">${(ev.recommendedAction || 'NONE').toUpperCase()}</td>
                        <td class="p-2 text-on-surface-variant">${ev.consequence || 'Neutralized.'}</td>
                        <td class="p-2 font-bold ${ev.scoreDelta >= 0 ? 'text-primary' : 'text-error'}">${ev.scoreDelta > 0 ? '+' : ''}${ev.scoreDelta}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }

        // Render Error Heat Map
        this.renderErrorHeatMap(summary.errors || []);
    },

    renderErrorHeatMap: function(errors) {
        const container = document.getElementById('aarErrorHeatMap');
        if (!container) return;

        if (!errors || errors.length === 0) {
            container.innerHTML = `
                <div class="bg-primary/10 border border-primary/30 p-3 rounded text-primary text-xs font-mono flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">verified</span>
                    <span>Zero Procedural Faults Logged. Flawless ROE and Munition Conservation.</span>
                </div>
            `;
            return;
        }

        container.innerHTML = errors.map(err => `
            <div class="bg-error-container/30 border border-error/30 p-2 rounded flex items-center justify-between text-xs font-mono">
                <div class="flex items-center gap-2">
                    <span class="px-1.5 py-0.5 rounded bg-error/20 text-error font-bold text-[9px]">${err.category || 'FAULT'}</span>
                    <span class="text-on-surface-variant">${err.description}</span>
                </div>
                <span class="text-error font-bold">${err.severity || 'MEDIUM'}</span>
            </div>
        `).join('');
    },

    // Skill Radar Chart (Chart.js or Canvas Polyfill)
    renderSkillRadar: function(skills) {
        const canvas = document.getElementById('skillRadarCanvas');
        if (!canvas) return;

        const skillValues = skills || { detection: 85, classification: 90, decisionMaking: 80, communication: 75, situationalAwareness: 85, resilience: 88 };

        if (typeof Chart !== 'undefined') {
            if (this.radarChart) this.radarChart.destroy();
            this.radarChart = new Chart(canvas, {
                type: 'radar',
                data: {
                    labels: ['Detection Speed', 'Classification', 'Decision Quality', 'Communication', 'Swarm Awareness', 'Resilience'],
                    datasets: [{
                        label: 'Cadet Proficiency',
                        data: [skillValues.detection, skillValues.classification, skillValues.decisionMaking, skillValues.communication, skillValues.situationalAwareness, skillValues.resilience],
                        backgroundColor: 'rgba(78, 222, 163, 0.25)',
                        borderColor: '#4edea3',
                        pointBackgroundColor: '#4edea3',
                        borderWidth: 2
                    }, {
                        label: 'Doctrine Standard',
                        data: [80, 85, 80, 80, 80, 80],
                        borderColor: 'rgba(56, 189, 248, 0.5)',
                        borderDash: [4, 4],
                        borderWidth: 1.5,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                            grid: { color: 'rgba(255, 255, 255, 0.08)' },
                            pointLabels: { color: '#dae3f1', font: { size: 9, family: 'monospace' } },
                            ticks: { display: false, min: 0, max: 100 }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#dae3f1', font: { size: 9, family: 'monospace' } } }
                    }
                }
            });
        }
    },

    // Timeline Scrubber & Replay Rendering
    setScrubberTime: function(seconds) {
        this.replayTimeSec = seconds;
        this.renderReplayCanvas();
    },

    renderReplayCanvas: function() {
        if (!this.replayCanvas || !this.replayCtx) return;
        const ctx = this.replayCtx;
        const w = this.replayCanvas.width;
        const h = this.replayCanvas.height;
        const center = w / 2;

        ctx.fillStyle = '#060d17';
        ctx.fillRect(0, 0, w, h);

        // Radar circles on replay canvas
        ctx.strokeStyle = 'rgba(78, 222, 163, 0.2)';
        ctx.beginPath();
        ctx.arc(center, center, center * 0.4, 0, Math.PI * 2);
        ctx.arc(center, center, center * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#4edea3';
        ctx.fillRect(center - 4, center - 4, 8, 8);

        // Draw logged actions at current scrubber time
        if (this.currentAARData && this.currentAARData.events) {
            this.currentAARData.events.forEach(ev => {
                if (ev.timestampSec <= this.replayTimeSec) {
                    ctx.fillStyle = ev.isCorrectClass ? '#4edea3' : '#ef4444';
                    ctx.font = '8px monospace';
                    ctx.fillText(`[${ev.action.toUpperCase()}] ${ev.contactId}`, 15, 20 + ev.timestampSec * 3);
                }
            });
        }
    },

    renderHistoryTable: function(sessions) {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        sessions.slice(0, 8).forEach(s => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-surface-container-high font-mono text-[10px]";
            tr.innerHTML = `
                <td class="p-2 text-tertiary">${s.sessionId}</td>
                <td class="p-2 text-on-surface font-bold">${s.scenarioTitle}</td>
                <td class="p-2 font-bold text-primary">${s.totalScore} / ${s.maxScore}</td>
                <td class="p-2"><span class="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">${s.grade}</span></td>
                <td class="p-2 text-on-surface-variant">${s.avgDetTime}s</td>
                <td class="p-2 text-on-surface-variant">${s.accuracyPct}%</td>
                <td class="p-2 text-right">
                    <button class="bg-surface-container text-tertiary px-2 py-0.5 rounded border border-tertiary/30 hover:bg-tertiary/20" onclick="AAREngine.exportReport('${s.sessionId}')">DOSSIER</button>
                    <button class="bg-surface-container text-primary px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/20 ml-1" onclick="AAREngine.exportCSV('${s.sessionId}')">CSV</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    exportReport: function(sessionId) {
        if (window.SimulationApp) {
            window.SimulationApp.currentSessionId = sessionId;
            window.SimulationApp.downloadScorecard();
        } else {
            window.open(`/api/export/report/${sessionId}`, '_blank');
        }
    },

    exportCSV: function(sessionId) {
        window.location.href = `/api/export/csv/${sessionId}`;
    }
};
