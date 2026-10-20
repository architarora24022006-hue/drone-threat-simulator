/**
 * SENTINEL-Drone Decision-Tree Scoring Engine
 * Weighted Evaluation Matrix (6 Core Metrics):
 * 1. Detection Time: 20% (200 pts)
 * 2. Classification Accuracy: 25% (250 pts)
 * 3. Situational Awareness & Swarm Recognition: 15% (150 pts)
 * 4. Engagement / Counter-Drone Decision Quality: 25% (250 pts)
 * 5. Communication & Reporting: 10% (100 pts)
 * 6. Degraded Condition Performance: 5% (50 pts)
 * Total Score: 1000 Points
 */
window.ScoringEngine = {
    WEIGHTS: {
        detectionTime: 0.20,
        classification: 0.25,
        situationalAwareness: 0.15,
        engagementDecision: 0.25,
        communication: 0.10,
        degradedPerformance: 0.05
    },

    // Evaluates a single trainee engagement action
    evaluateAction: function(target, action, assignedClass, priority, detTimeSec, scenario, roeRules) {
        let isCorrectClass = false;
        let scoreDelta = 0;
        let recommendedAction = 'jam';
        let consequence = '';
        let coachingFeedback = '';
        let roePassed = true;
        let collateralHazard = false;

        const distToFob = target.pos ? Math.hypot(target.pos.x, target.pos.y) : 500;
        const isDegraded = scenario && (scenario.weather === 'fog' || scenario.weather === 'rain' || scenario.weather === 'sandstorm' || scenario.timeOfDay === 'night');

        // 1. CLASSIFICATION EVALUATION (Ground Truth vs Trainee Selection)
        if (target.isDecoy) {
            if (assignedClass === 'decoy') {
                isCorrectClass = true;
                scoreDelta += 250;
                coachingFeedback = 'Correctly discriminated non-lethal radar chaff decoy.';
            } else {
                scoreDelta -= 150;
                coachingFeedback = `False alarm: Marked non-lethal decoy chaff as ${assignedClass}. Munitions preserved if not fired upon.`;
            }
        } else if (target.type === 'bird_flock') {
            if (assignedClass === 'bird') {
                isCorrectClass = true;
                scoreDelta += 250;
                coachingFeedback = 'Accurately recognized biological bird flock clutter.';
            } else {
                scoreDelta -= 200;
                coachingFeedback = 'CRITICAL ERROR: Biological fauna misidentified as hostile drone!';
            }
        } else {
            // Target is an actual hostile drone
            if (assignedClass === target.type || (assignedClass === 'swarm_node' && target.type === 'swarm_node') || (assignedClass === 'kamikaze' && target.type === 'fpv_kamikaze') || (assignedClass === 'recon' && target.type === 'commercial_quad') || (assignedClass === 'payload' && target.type === 'payload_dropper')) {
                isCorrectClass = true;
                scoreDelta += 250;
                coachingFeedback = `Target positive ID verified: ${target.typeName}.`;
            } else if (assignedClass === 'bird' || assignedClass === 'decoy') {
                scoreDelta -= 250;
                coachingFeedback = 'CRITICAL FAILURE: Hostile drone misclassified as harmless bird/decoy!';
            } else {
                // Partial match: identified as drone, but wrong sub-variant
                isCorrectClass = false;
                scoreDelta += 120;
                coachingFeedback = `Identified as airborne threat, but subtype mismatch (actual: ${target.typeName}).`;
            }
        }

        // 2. COUNTERMEASURE APPROPRIATENESS & ROE CHECK
        if (target.isDecoy || target.type === 'bird_flock') {
            recommendedAction = 'ignore';
            if (action === 'hardkill' || action === 'laser' || action === 'ciws') {
                scoreDelta -= 300;
                consequence = 'MUNITION WASTE: Fired lethal kinetic weapon on non-threat decoy/bird.';
                coachingFeedback += ' Ammo wasted on non-lethal target. Penalizes unit readiness.';
            } else if (action === 'ignore' || action === 'track') {
                scoreDelta += 150;
                consequence = 'Decoy bypassed. Air defense resources conserved.';
            }
        } else {
            // Hostile Target
            if (target.type === 'fpv_kamikaze') {
                recommendedAction = distToFob < 300 ? 'laser' : 'interceptor';
                if (action === 'laser' || action === 'hardkill') {
                    scoreDelta += 250;
                    consequence = 'High-speed FPV neutralized instantly in mid-air.';
                } else if (action === 'jam') {
                    if (target.rfFrequencyMHz === 0) {
                        scoreDelta -= 50;
                        consequence = 'RF Jammer partially ineffective against autonomous optical terminal dive!';
                        coachingFeedback += ' FPV was running terminal autonomous lock; required hard-kill.';
                    } else {
                        scoreDelta += 180;
                        consequence = 'RF Jammer severed analog video link; FPV veered off target.';
                    }
                } else if (action === 'ignore') {
                    scoreDelta -= 400;
                    consequence = 'CATASTROPHIC BASE HIT: Ignored kamikaze reached ammunition depot!';
                    coachingFeedback += ' Terminal kamikaze must never be ignored.';
                }
            } else if (target.type === 'commercial_quad') {
                recommendedAction = 'jam';
                if (action === 'jam' || action === 'spoof') {
                    scoreDelta += 250;
                    consequence = 'Soft-Kill Success: RF jammer severed C2 telemetry; drone entered failsafe RTH.';
                } else if (action === 'hardkill') {
                    scoreDelta += 140;
                    consequence = 'Kinetic strike successful, but disproportionate cost for commercial micro-quad.';
                }
            } else if (target.type === 'payload_dropper') {
                recommendedAction = 'hardkill';
                if (action === 'hardkill' || action === 'laser') {
                    scoreDelta += 250;
                    consequence = 'Payload drone destroyed before release envelope.';
                } else if (action === 'evacuate') {
                    scoreDelta += 120;
                    consequence = 'Personnel evacuated from drop zone, minimizing casualty risk.';
                } else if (action === 'jam') {
                    scoreDelta += 180;
                    consequence = 'Jammer disrupted drop trigger; drone drifted off perimeter.';
                }
            } else if (target.type === 'fixed_wing') {
                recommendedAction = 'spoof';
                if (action === 'spoof' || action === 'hardkill') {
                    scoreDelta += 250;
                    consequence = 'Autonomous fixed-wing navigation disrupted via GNSS spoofing.';
                } else if (action === 'jam') {
                    scoreDelta += 100;
                    consequence = 'Partial effect: RF Jammer severed secondary telemetry, but autonomous nav continued.';
                }
            } else if (target.type === 'swarm_node') {
                recommendedAction = target.isLeader ? 'hardkill' : 'jam';
                if (target.isLeader && (action === 'hardkill' || action === 'laser')) {
                    scoreDelta += 300;
                    consequence = 'SWARM C2 DISRUPTED: Master node eliminated; followers entered hover/retreat.';
                    coachingFeedback += ' Excellent swarm situational awareness. Neutralizing master node collapses swarm.';
                } else {
                    scoreDelta += 200;
                    consequence = 'Swarm node engaged successfully.';
                }
            }
        }

        // 3. COLLATERAL DAMAGE RISK CHECK
        if (scenario && scenario.terrain === 'urban' && action === 'ciws') {
            collateralHazard = true;
            scoreDelta -= 200;
            consequence += ' COLLATERAL WARNING: 30mm CIWS rounds discharged adjacent to civilian/fuel infrastructure!';
            coachingFeedback += ' ROE prohibits CIWS in urban perimeter due to falling shrapnel.';
        }

        // 4. DETECTION LATENCY SCORE
        let detScore = Math.max(0, 200 - Math.floor(detTimeSec * 18));
        scoreDelta += detScore;

        if (detTimeSec > 8.0) {
            coachingFeedback += ` You waited ${detTimeSec.toFixed(1)}s before taking action, narrowing the interception window.`;
        }

        return {
            isCorrectClass: isCorrectClass,
            scoreDelta: scoreDelta,
            recommendedAction: recommendedAction,
            actualAction: action,
            consequence: consequence || 'Action recorded.',
            coachingFeedback: coachingFeedback,
            detScore: detScore,
            collateralHazard: collateralHazard
        };
    },

    // Aggregates full session performance into the 6 weighted metrics
    calculateSessionScore: function(actions, totalTargets, sessionDurationSec, scenario) {
        if (!actions || actions.length === 0) {
            return {
                totalScore: 0,
                maxScore: 1000,
                grade: 'REMEDIATION',
                metrics: { detectionTimeScore: 0, classificationScore: 0, situationalScore: 0, engagementScore: 0, communicationScore: 0, degradedScore: 0 },
                skillRadar: { detection: 20, classification: 20, decisionMaking: 20, communication: 20, situationalAwareness: 20, resilience: 20 }
            };
        }

        // 1. Detection Time Metric (20% -> 200 pts)
        const detTimes = actions.map(a => a.detTimeSec || 3.0);
        const avgDetTime = detTimes.reduce((a, b) => a + b, 0) / Math.max(1, detTimes.length);
        const detectionScore = Math.round(Math.max(40, 200 - (avgDetTime * 15)));

        // 2. Classification Accuracy (25% -> 250 pts)
        const correctCount = actions.filter(a => a.isCorrectClass).length;
        const accuracyPct = Math.round((correctCount / Math.max(1, actions.length)) * 100);
        const classificationScore = Math.round((accuracyPct / 100) * 250);

        // 3. Situational Awareness & Swarm Pattern Recognition (15% -> 150 pts)
        const identifiedSwarm = actions.some(a => a.contactId && a.contactId.includes('SWARM') || a.classification === 'swarm_node' || a.action === 'track');
        const decoyAvoided = actions.some(a => a.classification === 'decoy' && a.action !== 'hardkill');
        let situationalScore = 100;
        if (identifiedSwarm) situationalScore += 25;
        if (decoyAvoided) situationalScore += 25;
        situationalScore = Math.min(150, situationalScore);

        // 4. Counter-Drone Engagement Decision Quality (25% -> 250 pts)
        const noCollateral = actions.every(a => !a.collateralHazard);
        const lethalAddressed = actions.filter(a => a.action === 'jam' || a.action === 'hardkill' || a.action === 'laser' || a.action === 'spoof').length;
        let engagementScore = Math.min(250, Math.round((lethalAddressed / Math.max(1, totalTargets)) * 200) + (noCollateral ? 50 : 0));

        // 5. Communication & Reporting (10% -> 100 pts)
        const alertedCount = actions.filter(a => a.action === 'alert' || a.action === 'identify' || a.action === 'evacuate').length;
        const communicationScore = Math.min(100, Math.max(50, alertedCount * 35));

        // 6. Performance Under Degraded Conditions (5% -> 50 pts)
        const isDegraded = scenario && (scenario.weather !== 'clear' || scenario.timeOfDay === 'night');
        const degradedScore = isDegraded ? Math.min(50, Math.round((accuracyPct / 100) * 50)) : 45;

        // Sum Total
        const totalScore = Math.min(1000, Math.max(120, detectionScore + classificationScore + situationalScore + engagementScore + communicationScore + degradedScore));

        // Grade Assignment
        let grade = 'REMEDIATION';
        if (totalScore >= 900) grade = 'MASTER';
        else if (totalScore >= 800) grade = 'DISTINGUISHED';
        else if (totalScore >= 700) grade = 'QUALIFIED';
        else if (totalScore >= 600) grade = 'BASIC';

        // Skill Radar (0-100 normalized)
        const skillRadar = {
            detection: Math.min(100, Math.round((detectionScore / 200) * 100)),
            classification: accuracyPct,
            decisionMaking: Math.min(100, Math.round((engagementScore / 250) * 100)),
            communication: Math.min(100, Math.round((communicationScore / 100) * 100)),
            situationalAwareness: Math.min(100, Math.round((situationalScore / 150) * 100)),
            resilience: isDegraded ? Math.min(100, Math.round((degradedScore / 50) * 100)) : 90
        };

        return {
            totalScore: totalScore,
            maxScore: 1000,
            grade: grade,
            avgDetTime: avgDetTime.toFixed(1),
            accuracyPct: accuracyPct,
            metrics: {
                detectionTimeScore: detectionScore,
                classificationScore: classificationScore,
                situationalScore: situationalScore,
                engagementScore: engagementScore,
                communicationScore: communicationScore,
                degradedScore: degradedScore
            },
            skillRadar: skillRadar
        };
    }
};
