/**
 * AEGIS-CUAS SCENARIO ENGINE & PROCEDURAL GENERATOR
 */
window.ScenarioEngine = {
    // Preset Tactical Drills
    presets: {
        drill_1: {
            id: 'drill_1',
            title: 'Single Recon Quadcopter Approach',
            difficulty: 'EASY',
            lighting: 'Daylight Clear',
            terrain: 'Forward Operating Base (Urban)',
            noise: 0,
            targets: [
                {
                    id: 'TRK-101',
                    type: 'micro',
                    typeName: 'Commercial Quadcopter (Recon)',
                    pos: { x: -220, y: -250, z: 120 }, // Relative to perimeter origin (0,0)
                    velocity: { x: 12, y: 14, z: -2 },
                    radarCrossSection: 0.05,
                    isHostile: true,
                    isFriendly: false,
                    isDecoy: false,
                    behavior: 'recon_approach'
                }
            ]
        },
        drill_2: {
            id: 'drill_2',
            title: 'High-Speed FPV Kamikaze Attack',
            difficulty: 'MEDIUM',
            lighting: 'Dusk Low Light',
            terrain: 'Forward Operating Base (Urban)',
            noise: 15,
            targets: [
                {
                    id: 'TRK-201',
                    type: 'fpv',
                    typeName: 'FPV Suicide Kamikaze Drone',
                    pos: { x: -280, y: 150, z: 45 },
                    velocity: { x: 38, y: -18, z: 0 },
                    radarCrossSection: 0.02,
                    isHostile: true,
                    isFriendly: false,
                    isDecoy: false,
                    behavior: 'kamikaze_low'
                },
                {
                    id: 'TRK-202',
                    type: 'fpv',
                    typeName: 'FPV Suicide Kamikaze Drone',
                    pos: { x: -260, y: 180, z: 50 },
                    velocity: { x: 35, y: -22, z: 0 },
                    radarCrossSection: 0.02,
                    isHostile: true,
                    isFriendly: false,
                    isDecoy: false,
                    behavior: 'kamikaze_low'
                }
            ]
        },
        drill_3: {
            id: 'drill_3',
            title: 'Multi-Vector Saturation Swarm',
            difficulty: 'HARD',
            lighting: 'Night (Thermal FLIR)',
            terrain: 'Mountainous Outpost',
            noise: 40,
            targets: generateSwarmTargets(10, 'saturation')
        },
        drill_4: {
            id: 'drill_4',
            title: 'Civilian Decoy & Autonomous Swarm',
            difficulty: 'EXPERT',
            lighting: 'Heavy Fog / Rain',
            terrain: 'Urban Civilian Sector',
            noise: 55,
            targets: generateDecoyAndSwarmTargets()
        }
    },

    // Procedural Scenario Generator
    generateProcedural: function(options) {
        const swarmSize = parseInt(options.swarmSize) || 6;
        const terrain = options.terrain || 'urban';
        const visibility = options.visibility || 'day';
        const noise = parseInt(options.noise) || 20;
        const tactics = options.tactics || 'direct';

        let lightingText = 'Daylight Clear';
        if (visibility === 'night') lightingText = 'Night FLIR Active';
        if (visibility === 'fog') lightingText = 'Heavy Fog / Rain';

        let terrainText = 'Forward Operating Base (Urban)';
        if (terrain === 'rural') terrainText = 'Open Rural Field';
        if (terrain === 'coastal') terrainText = 'Coastal Patrol Outpost';

        const targets = [];
        const baseAngles = {
            direct: [Math.PI * 0.8, Math.PI * 1.2],
            pincer: [Math.PI * 0.25, Math.PI * 1.75],
            staggered: [Math.PI * 0.9, Math.PI * 1.1],
            evasive: [Math.PI * 0.5, Math.PI * 1.5]
        }[tactics] || [0, Math.PI * 2];

        for (let i = 0; i < swarmSize; i++) {
            const angle = baseAngles[0] + Math.random() * (baseAngles[1] - baseAngles[0]);
            const dist = 300 + Math.random() * 80;
            const altitude = 30 + Math.random() * 120;

            const isDecoy = (i === 0 && swarmSize > 4); // 1 friendly/decoy in larger swarms
            const typeOptions = ['micro', 'fpv', 'tactical', 'swarm_leader'];
            const assignedType = isDecoy ? 'decoy' : typeOptions[Math.floor(Math.random() * typeOptions.length)];

            targets.push({
                id: `TRK-P${100 + i}`,
                type: assignedType,
                typeName: isDecoy ? 'Civilian Delivery UAV (Decoy)' : getTypeName(assignedType),
                pos: {
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    z: altitude
                },
                velocity: {
                    x: -Math.cos(angle) * (15 + Math.random() * 20),
                    y: -Math.sin(angle) * (15 + Math.random() * 20),
                    z: (Math.random() - 0.5) * 4
                },
                radarCrossSection: isDecoy ? 0.3 : (assignedType === 'fpv' ? 0.02 : 0.08),
                isHostile: !isDecoy,
                isFriendly: isDecoy,
                isDecoy: isDecoy,
                behavior: tactics
            });
        }

        return {
            id: `procedural_${Date.now()}`,
            title: `Procedural Swarm (${swarmSize} Drones - ${tactics.toUpperCase()})`,
            difficulty: swarmSize > 10 ? 'EXPERT' : (swarmSize > 5 ? 'HARD' : 'MEDIUM'),
            lighting: lightingText,
            terrain: terrainText,
            noise: noise,
            targets: targets
        };
    }
};

function getTypeName(type) {
    switch (type) {
        case 'micro': return 'Micro-Recon Multirotor';
        case 'fpv': return 'FPV Kamikaze Strike Drone';
        case 'tactical': return 'Medium Fixed-Wing Tactical UAV';
        case 'swarm_leader': return 'Autonomous Swarm Command Node';
        case 'decoy': return 'Civilian/Decoy UAV';
        default: return 'Unclassified Aerial System';
    }
}

function generateSwarmTargets(count, style) {
    const targets = [];
    for (let i = 0; i < count; i++) {
        const angle = Math.PI * 0.75 + (i * 0.12) + (Math.random() - 0.5) * 0.1;
        const dist = 320 + Math.random() * 40;
        targets.push({
            id: `TRK-30${i+1}`,
            type: i === 0 ? 'swarm_leader' : (i % 2 === 0 ? 'fpv' : 'micro'),
            typeName: i === 0 ? 'Autonomous Swarm Command Node' : 'Swarm Drone Asset',
            pos: { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, z: 60 + Math.random() * 90 },
            velocity: { x: -Math.cos(angle) * 22, y: -Math.sin(angle) * 22, z: 0 },
            radarCrossSection: 0.04,
            isHostile: true,
            isFriendly: false,
            isDecoy: false,
            behavior: 'flocking'
        });
    }
    return targets;
}

function generateDecoyAndSwarmTargets() {
    const targets = generateSwarmTargets(6, 'decoy');
    // Add 2 friendly decoys
    targets.push({
        id: `TRK-401`,
        type: 'friendly',
        typeName: 'Friendly Medical Resupply Hexacopter',
        pos: { x: -180, y: -180, z: 80 },
        velocity: { x: 10, y: 12, z: 0 },
        radarCrossSection: 0.25,
        isHostile: false,
        isFriendly: true,
        isDecoy: false,
        behavior: 'straight'
    });
    return targets;
}
