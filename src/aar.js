/**
 * AEGIS-CUAS AFTER-ACTION REVIEW (AAR) & ANALYTICS ENGINE (API & DATABASE SYNCED)
 */
window.AAREngine = {
    sessionHistory: [],
    currentSessionLog: [],
    chartProgression: null,
    replayCanvas: null,
    replayCtx: null,

    init: function() {
        this.replayCanvas = document.getElementById('aarCanvas');
        if (this.replayCanvas) {
            this.replayCtx = this.replayCanvas.getContext('2d');
        }
        this.initProgressionChart();
        this.fetchHistoryFromBackend();
    },

    logEvent: function(eventData) {
        this.currentSessionLog.push(eventData);
    },

    finishSession: function(scenarioTitle, totalScore, totalThreats) {
        const detTimes = this.currentSessionLog.map(e => e.detTimeSec);
        const avgDetTime = detTimes.length > 0 ? (detTimes.reduce((a, b) => a + b, 0) / detTimes.length).toFixed(1) : '0.0';
        
        const correctClasses = this.currentSessionLog.filter(e => e.eval.classScore > 0).length;
        const accuracyPct = this.currentSessionLog.length > 0 ? Math.round((correctClasses / this.currentSessionLog.length) * 100) : 100;
        
        const gradeInfo = window.ScoringEngine.calculateOverallGrade(totalScore, totalThreats);

        const summary = {
            id: `session_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            scenarioTitle: scenarioTitle,
            totalScore: totalScore,
            maxScore: totalThreats * 1000,
            avgDetTime: avgDetTime,
            accuracyPct: accuracyPct,
            grade: gradeInfo.grade,
            events: [...this.currentSessionLog]
        };

        this.sessionHistory.push(summary);
        this.updateAARUI(summary);
        this.updateProgressionChart();

        // Save to SQLite Database Backend
        this.saveSessionToBackend(summary);
        
        // Reset current log for next run
        this.currentSessionLog = [];
    },

    saveSessionToBackend: function(summary) {
        fetch('/api/aar/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(summary)
        })
        .then(res => res.json())
        .then(data => {
            console.log('[AAR Backend] Saved session to SQLite database:', data.session_code);
        })
        .catch(err => console.warn('[AAR Backend Sync] Local mode operating offline:', err));
    },

    fetchHistoryFromBackend: function() {
        fetch('/api/aar/history')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                console.log(`[AAR Backend] Loaded ${data.length} historical sessions from database.`);
                // Update progression chart with database rows
                this.updateProgressionChartFromDB(data);
            }
        })
        .catch(err => console.warn('[AAR Backend Sync] Database fetch offline:', err));
    },

    updateAARUI: function(summary) {
        document.getElementById('aarScore').textContent = `${summary.totalScore} / ${summary.maxScore}`;
        document.getElementById('aarGrade').textContent = `GRADE: ${summary.grade}`;
        document.getElementById('aarDetTime').textContent = `${summary.avgDetTime} sec`;
        document.getElementById('aarClassAccuracy').textContent = `${summary.accuracyPct}%`;

        // Render Table Rows
        const tbody = document.getElementById('aarTableBody');
        tbody.innerHTML = '';

        if (summary.events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No engagements logged in this scenario.</td></tr>';
            return;
        }

        summary.events.forEach(ev => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="mono">[${ev.timestamp}]</td>
                <td class="mono font-bold text-cyan">${ev.targetId}</td>
                <td class="mono">${ev.detTimeSec.toFixed(1)}s</td>
                <td><span class="badge">${ev.operatorClass.toUpperCase()}</span></td>
                <td><span class="badge badge-amber">${ev.actualClass.toUpperCase()}</span></td>
                <td>${ev.countermeasure ? ev.countermeasure.toUpperCase() : 'NONE'}</td>
                <td><span class="${ev.roePassed ? 'text-green' : 'text-red'}">${ev.roePassed ? 'YES (PASSED)' : 'NO (VIOLATION)'}</span></td>
                <td class="mono font-bold ${ev.eval.totalResultScore >= 0 ? 'text-green' : 'text-red'}">${ev.eval.totalResultScore} pts</td>
            `;
            tbody.appendChild(tr);
        });

        this.renderReplayCanvas(summary);
    },

    renderReplayCanvas: function(summary) {
        if (!this.replayCtx) return;
        const ctx = this.replayCtx;
        const w = this.replayCanvas.width;
        const h = this.replayCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#05080e';
        ctx.fillRect(0, 0, w, h);

        // Draw Radar Grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 80, 0, Math.PI * 2);
        ctx.arc(w / 2, h / 2, 140, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Base
        ctx.fillStyle = '#00ffa3';
        ctx.beginPath(); ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2); ctx.fill();

        // Plot Threat Vectors & Intercept Markers
        summary.events.forEach(ev => {
            if (ev.pos) {
                const tx = (w / 2) + (ev.pos.x / 350) * 140;
                const ty = (h / 2) + (ev.pos.y / 350) * 140;

                ctx.strokeStyle = 'rgba(255, 51, 102, 0.4)';
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(tx - (ev.pos.x * 0.4), ty - (ev.pos.y * 0.4));
                ctx.lineTo(tx, ty);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = ev.eval.totalResultScore > 0 ? '#00ffa3' : '#ff3366';
                ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill();
                ctx.font = '9px "Share Tech Mono"';
                ctx.fillText(`${ev.targetId} (${ev.countermeasure})`, tx + 8, ty);
            }
        });
    },

    initProgressionChart: function() {
        const canvas = document.getElementById('aarChartProgression');
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');
        this.chartProgression = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5'],
                datasets: [
                    {
                        label: 'Overall Score (pts)',
                        data: [650, 720, 810, 890, 940],
                        borderColor: '#00f0ff',
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Classification Accuracy (%)',
                        data: [60, 75, 80, 90, 92],
                        borderColor: '#ffb700',
                        borderDash: [5, 5],
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#8a99ad' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#8a99ad' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: {
                    legend: { labels: { color: '#ffffff', font: { family: 'Share Tech Mono' } } }
                }
            }
        });
    },

    updateProgressionChart: function() {
        if (!this.chartProgression || this.sessionHistory.length === 0) return;
        const labels = this.sessionHistory.map((s, i) => `S${i + 1}`);
        const scores = this.sessionHistory.map(s => s.totalScore);
        const accuracy = this.sessionHistory.map(s => s.accuracyPct);

        this.chartProgression.data.labels = labels;
        this.chartProgression.data.datasets[0].data = scores;
        this.chartProgression.data.datasets[1].data = accuracy;
        this.chartProgression.update();
    },

    updateProgressionChartFromDB: function(dbRows) {
        if (!this.chartProgression) return;
        const labels = dbRows.reverse().map(r => r.sessionCode.replace('SESS-', 'S-'));
        const scores = dbRows.map(r => r.totalScore);
        const accuracy = dbRows.map(r => r.accuracyPct);

        this.chartProgression.data.labels = labels;
        this.chartProgression.data.datasets[0].data = scores;
        this.chartProgression.data.datasets[1].data = accuracy;
        this.chartProgression.update();
    },

    exportReportJSON: function() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.sessionHistory, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `AEGIS_CUAS_SIH_AAR_Report_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }
};
