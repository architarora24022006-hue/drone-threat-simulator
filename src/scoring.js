/**
 * AEGIS-CUAS DECISION-TREE SCORING LOGIC ENGINE
 */
window.ScoringEngine = {
    // Decision Tree Matrix Rule Evaluator
    evaluateEngagement: function(target, operatorClass, countermeasure, roePassed, detTimeSec) {
        let detScore = Math.max(0, 250 - Math.floor(detTimeSec * 25)); // Max 250 pts
        let classScore = 0;
        let cmScore = 0;
        let roeScore = roePassed ? 250 : 0;
        let collateralPenalty = 0;
        let notes = [];

        // 1. Classification Evaluation
        if (target.isFriendly || target.isDecoy) {
            if (operatorClass === 'friendly' || operatorClass === 'decoy') {
                classScore = 250;
                notes.push('Correctly identified non-hostile asset.');
            } else {
                classScore = -200; // Severe penalty for misidentifying friendly as hostile
                notes.push('CRITICAL FAIL: Friendly asset misidentified as threat!');
            }
        } else { // Target is Hostile
            if (operatorClass === target.type) {
                classScore = 250; // Exact match
                notes.push('Exact threat type match.');
            } else if (operatorClass !== 'friendly' && operatorClass !== 'decoy') {
                classScore = 150; // Partial match (classified as hostile drone type, but wrong sub-category)
                notes.push('Hostile status verified, but sub-type mismatch.');
            } else {
                classScore = -150; // Classified hostile as friendly
                notes.push('CRITICAL FAIL: Hostile drone misclassified as friendly!');
            }
        }

        // 2. Countermeasure Appropriateness Evaluation
        if (target.isFriendly) {
            if (countermeasure) {
                collateralPenalty = -500; // Fired on friendly!
                notes.push('FRIENDLY FIRE VIOLATION: Engagement on non-hostile track.');
            }
        } else {
            // Weapon suitability matrix
            switch (countermeasure) {
                case 'rf_jammer':
                    if (target.type === 'micro' || target.type === 'swarm_leader' || target.type === 'fpv') {
                        cmScore = 250;
                        notes.push('RF Jammer optimal for soft-kill C2 link severance.');
                    } else {
                        cmScore = 120; // Medium efficiency against autonomous fixed wing
                        notes.push('RF Jammer partial effect on autonomous navigation.');
                    }
                    break;
                case 'laser':
                    if (target.type === 'fpv' || target.type === 'micro' || target.type === 'tactical') {
                        cmScore = 250;
                        notes.push('Directed Energy HEL instant thermal burn-through.');
                    } else {
                        cmScore = 180;
                        notes.push('HEL Laser targeted swarm node.');
                    }
                    break;
                case 'interceptor':
                    if (target.type === 'fpv' || target.type === 'tactical') {
                        cmScore = 250;
                        notes.push('Kinetic interceptor drone net capture successful.');
                    } else {
                        cmScore = 160;
                        notes.push('Interceptor deployed.');
                    }
                    break;
                case 'ciws':
                    if (target.type === 'tactical' || target.type === 'fpv') {
                        cmScore = 200;
                        notes.push('CIWS 30mm stream shredded airframe.');
                    } else {
                        cmScore = 100;
                        notes.push('High ammunition cost for small micro-drone.');
                    }
                    // Collateral hazard check
                    if (target.pos && Math.hypot(target.pos.x, target.pos.y) < 100) {
                        collateralPenalty = -150;
                        notes.push('Collateral Warning: Kinetic rounds fired near FOB inner perimeter.');
                    }
                    break;
            }
        }

        const totalResultScore = detScore + classScore + cmScore + roeScore + collateralPenalty;

        return {
            detScore,
            classScore,
            cmScore,
            roeScore,
            collateralPenalty,
            totalResultScore,
            notes: notes.join(' ')
        };
    },

    calculateOverallGrade: function(totalScore, totalThreats) {
        const maxScore = totalThreats * 1000;
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 100;

        let grade = 'CLASS F (UNSATISFACTORY)';
        if (percentage >= 90) grade = 'CLASS A (EXCELLENT)';
        else if (percentage >= 80) grade = 'CLASS B (PROFICIENT)';
        else if (percentage >= 70) grade = 'CLASS C (QUALIFIED)';

        return {
            percentage: Math.round(percentage),
            grade: grade
        };
    }
};
