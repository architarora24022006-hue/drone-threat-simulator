/**
 * SENTINEL-Drone Tactical Scenarios & Procedural Threat DNA Engine
 * 12 Scripted Military Training Drills + Seeded Procedural Swarm Generator
 */
window.ScenarioEngine = {
    // 12 Scripted Scenarios catalog
    drills: [
        {
            id: 'SCEN-01',
            title: 'Drill 01: Lone Commercial Quadcopter Reconnaissance',
            terrain: 'urban',
            timeOfDay: 'day',
            weather: 'clear',
            difficulty: 'EASY',
            threatDna: 'URBAN-DAY-CLEAR-SINGLE-1-RECON-HOVER',
            seed: 1001,
            roe: 'TIGHT',
            tactics: 'recon_hover',
            assetsToProtect: ['Base Command Post', 'Perimeter Surveillance Tower'],
            availableAssets: ['Directional RF Jammer', 'Kinetic Interceptor Net', 'Laser DEW'],
            briefing: 'Unscheduled micro-multirotor detected hovering near the North-West perimeter at 120m altitude. Establish track, classify drone model, and deploy non-kinetic RF jammer.',
            targets: [
                {
                    id: 'TRK-101',
                    type: 'commercial_quad',
                    typeName: 'Commercial Quadcopter (DJI Phantom Recon)',
                    isHostile: true,
                    isDecoy: false,
                    pos: { x: -380, y: -420, z: 120 },
                    velocity: { x: 8, y: 10, z: 0 },
                    speed: 12.8,
                    radarCrossSection: 0.045,
                    rfFrequencyMHz: 2400,
                    rfProtocol: 'DJI OcuSync 3.0',
                    acousticDb: 72,
                    behavior: 'recon_hover'
                }
            ]
        },
        {
            id: 'SCEN-02',
            title: 'Drill 02: High-Speed FPV Kamikaze Low-Altitude Infiltration',
            terrain: 'urban',
            timeOfDay: 'dusk',
            weather: 'clear',
            difficulty: 'MEDIUM',
            threatDna: 'URBAN-DUSK-CLEAR-FPV-2-KAMIKAZE-DIVE',
            seed: 1002,
            roe: 'HOSTILE_BORDER',
            tactics: 'kamikaze_dive',
            assetsToProtect: ['Ammunition Depot S7', 'Forward Fuel Bladder'],
            availableAssets: ['Directional RF Jammer', 'Kinetic Interceptor Drone', 'Laser DEW', '30mm CIWS'],
            briefing: 'Two custom carbon-fiber racing FPV drones flying nap-of-the-earth at 38 m/s towards the ammunition depot. Immediate engagement authorized.',
            targets: [
                {
                    id: 'TRK-201',
                    type: 'fpv_kamikaze',
                    typeName: 'FPV High-Speed Kamikaze (RPG Warhead)',
                    isHostile: true,
                    isDecoy: false,
                    pos: { x: -650, y: 320, z: 35 },
                    velocity: { x: 36, y: -16, z: 0 },
                    speed: 39.4,
                    radarCrossSection: 0.018,
                    rfFrequencyMHz: 5800,
                    rfProtocol: 'ExpressLRS 900MHz + 5.8G Analog VTX',
                    acousticDb: 84,
                    behavior: 'kamikaze_dive'
                },
                {
                    id: 'TRK-202',
                    type: 'fpv_kamikaze',
                    typeName: 'FPV High-Speed Kamikaze (RPG Warhead)',
                    isHostile: true,
                    isDecoy: false,
                    pos: { x: -620, y: 380, z: 42 },
                    velocity: { x: 34, y: -18, z: 0 },
                    speed: 38.5,
                    radarCrossSection: 0.018,
                    rfFrequencyMHz: 5800,
                    rfProtocol: 'ExpressLRS 900MHz + 5.8G Analog VTX',
                    acousticDb: 82,
                    behavior: 'kamikaze_dive'
                }
            ]
        },
        {
            id: 'SCEN-03',
            title: 'Drill 03: Multi-Vector Pincer Swarm Attack (5 Drones)',
            terrain: 'rural',
            timeOfDay: 'night',
            weather: 'clear',
            difficulty: 'HARD',
            threatDna: 'RURAL-NIGHT-CLEAR-SWARM-5-PINCER-FLOCK',
            seed: 1003,
            roe: 'HOSTILE_BORDER',
            tactics: 'pincer',
            assetsToProtect: ['Tactical Radome Array', 'Personnel Quarters'],
            availableAssets: ['Directional RF Jammer', 'GPS Spoofing Array', 'Kinetic Interceptor', 'Laser DEW'],
            briefing: 'Coordinated night assault from opposing vectors (NE and SW). Swarm nodes communicating via local mesh. Split focus and neutralize both arms before perimeter breach.',
            targets: [
                { id: 'TRK-301', type: 'fpv_kamikaze', typeName: 'FPV Strike Node (Pincer Alpha 1)', isHostile: true, isDecoy: false, pos: { x: 550, y: 550, z: 80 }, velocity: { x: -28, y: -28, z: 0 }, speed: 39.5, radarCrossSection: 0.02, rfFrequencyMHz: 915, rfProtocol: 'TBS Crossfire', acousticDb: 79, behavior: 'pincer_converge' },
                { id: 'TRK-302', type: 'fpv_kamikaze', typeName: 'FPV Strike Node (Pincer Alpha 2)', isHostile: true, isDecoy: false, pos: { x: 590, y: 510, z: 95 }, velocity: { x: -30, y: -26, z: 0 }, speed: 39.7, radarCrossSection: 0.02, rfFrequencyMHz: 915, rfProtocol: 'TBS Crossfire', acousticDb: 78, behavior: 'pincer_converge' },
                { id: 'TRK-303', type: 'commercial_quad', typeName: 'Recon Node (Spotter)', isHostile: true, isDecoy: false, pos: { x: 620, y: 460, z: 140 }, velocity: { x: -18, y: -16, z: 0 }, speed: 24.1, radarCrossSection: 0.04, rfFrequencyMHz: 2400, rfProtocol: 'DJI OcuSync', acousticDb: 71, behavior: 'recon_hover' },
                { id: 'TRK-304', type: 'fpv_kamikaze', typeName: 'FPV Strike Node (Pincer Bravo 1)', isHostile: true, isDecoy: false, pos: { x: -520, y: -580, z: 75 }, velocity: { x: 26, y: 29, z: 0 }, speed: 38.9, radarCrossSection: 0.02, rfFrequencyMHz: 915, rfProtocol: 'TBS Crossfire', acousticDb: 80, behavior: 'pincer_converge' },
                { id: 'TRK-305', type: 'fpv_kamikaze', typeName: 'FPV Strike Node (Pincer Bravo 2)', isHostile: true, isDecoy: false, pos: { x: -560, y: -540, z: 85 }, velocity: { x: 28, y: 27, z: 0 }, speed: 38.9, radarCrossSection: 0.02, rfFrequencyMHz: 915, rfProtocol: 'TBS Crossfire', acousticDb: 81, behavior: 'pincer_converge' }
            ]
        },
        {
            id: 'SCEN-04',
            title: 'Drill 04: Decoy Chaff Distraction with Concealed Kamikaze',
            terrain: 'urban',
            timeOfDay: 'day',
            weather: 'rain',
            difficulty: 'HARD',
            threatDna: 'URBAN-DAY-RAIN-DECOY-3-AMBUSH-STRIKE',
            seed: 1004,
            roe: 'URBAN_MIN_COLLATERAL',
            tactics: 'decoy_led',
            assetsToProtect: ['Helipad Alpha', 'Air Defense Battery'],
            availableAssets: ['Directional RF Jammer', 'Kinetic Interceptor', 'Laser DEW'],
            briefing: 'Warning: Hostile force deploying radar corner reflectors (chaff) to draw fire away from an incoming payload-carrying drone. Discriminate by checking RF telemetry and acoustic signatures before firing.',
            targets: [
                { id: 'TRK-401', type: 'decoy_chaff', typeName: 'Corner Reflector Decoy Drone', isHostile: false, isDecoy: true, pos: { x: -480, y: 250, z: 110 }, velocity: { x: 18, y: -9, z: 0 }, speed: 20.1, radarCrossSection: 0.25, rfFrequencyMHz: 0, rfProtocol: 'NO EMISSIONS (PASSIVE)', acousticDb: 42, behavior: 'decoy_drift' },
                { id: 'TRK-402', type: 'decoy_chaff', typeName: 'Corner Reflector Decoy Drone', isHostile: false, isDecoy: true, pos: { x: -510, y: 290, z: 120 }, velocity: { x: 17, y: -10, z: 0 }, speed: 19.7, radarCrossSection: 0.22, rfFrequencyMHz: 0, rfProtocol: 'NO EMISSIONS (PASSIVE)', acousticDb: 40, behavior: 'decoy_drift' },
                { id: 'TRK-403', type: 'payload_dropper', typeName: 'Heavy Hexacopter (Mortar Dropper)', isHostile: true, isDecoy: false, pos: { x: -550, y: 200, z: 65 }, velocity: { x: 25, y: -8, z: 0 }, speed: 26.2, radarCrossSection: 0.06, rfFrequencyMHz: 2400, rfProtocol: 'Encrypted Telemetry', acousticDb: 86, behavior: 'approach_payload' }
            ]
        },
        {
            id: 'SCEN-05',
            title: 'Drill 05: Heavy Fog Sensor Degradation with Payload Dropper',
            terrain: 'rural',
            timeOfDay: 'dusk',
            weather: 'fog',
            difficulty: 'MEDIUM',
            threatDna: 'RURAL-DUSK-FOG-PAYLOAD-2-MORTAR-DROP',
            seed: 1005,
            roe: 'HOSTILE_BORDER',
            tactics: 'degraded_approach',
            assetsToProtect: ['Transformer Substation', 'Motor Pool'],
            availableAssets: ['Directional RF Jammer', 'Kinetic Interceptor', 'Laser DEW'],
            briefing: 'Dense fog reduces optical sensor visibility to under 150m. Rely on pulse radar doppler velocity and RF spectrum peaks to track and jam two heavy hexacopters carrying shaped munitions.',
            targets: [
                { id: 'TRK-501', type: 'payload_dropper', typeName: 'Hexacopter Payload Carrier', isHostile: true, isDecoy: false, pos: { x: 200, y: -580, z: 90 }, velocity: { x: -8, y: 22, z: 0 }, speed: 23.4, radarCrossSection: 0.055, rfFrequencyMHz: 433, rfProtocol: 'Long-Range UHF Telemetry', acousticDb: 83, behavior: 'approach_payload' },
                { id: 'TRK-502', type: 'payload_dropper', typeName: 'Hexacopter Payload Carrier', isHostile: true, isDecoy: false, pos: { x: 260, y: -540, z: 100 }, velocity: { x: -10, y: 20, z: 0 }, speed: 22.3, radarCrossSection: 0.052, rfFrequencyMHz: 433, rfProtocol: 'Long-Range UHF Telemetry', acousticDb: 82, behavior: 'approach_payload' }
            ]
        },
        {
            id: 'SCEN-06',
            title: 'Drill 06: Night Infiltration over Coastal Radar Array',
            terrain: 'coastal',
            timeOfDay: 'night',
            weather: 'clear',
            difficulty: 'MEDIUM',
            threatDna: 'COASTAL-NIGHT-CLEAR-RECON-3-SEA-SKIM',
            seed: 1006,
            roe: 'HOSTILE_BORDER',
            tactics: 'sea_skim',
            assetsToProtect: ['Coastal Surveillance Radome', 'Naval Jetty'],
            availableAssets: ['Directional RF Jammer', 'GPS Spoofer', 'Laser DEW', 'CIWS'],
            briefing: 'Three sea-skimming drones flying 15m above sea level approaching naval perimeter in pitch darkness. Use FLIR White-Hot thermal view to detect hot electric motors against cold water.',
            targets: [
                { id: 'TRK-601', type: 'commercial_quad', typeName: 'Waterproof Recon Quad', isHostile: true, isDecoy: false, pos: { x: 450, y: -500, z: 25 }, velocity: { x: -18, y: 20, z: 0 }, speed: 26.9, radarCrossSection: 0.035, rfFrequencyMHz: 5800, rfProtocol: 'Analog VTX', acousticDb: 76, behavior: 'sea_skim' },
                { id: 'TRK-602', type: 'commercial_quad', typeName: 'Waterproof Recon Quad', isHostile: true, isDecoy: false, pos: { x: 490, y: -460, z: 28 }, velocity: { x: -19, y: 18, z: 0 }, speed: 26.1, radarCrossSection: 0.035, rfFrequencyMHz: 5800, rfProtocol: 'Analog VTX', acousticDb: 75, behavior: 'sea_skim' },
                { id: 'TRK-603', type: 'fixed_wing', typeName: 'Mini Fixed-Wing Sea Skimmer', isHostile: true, isDecoy: false, pos: { x: 530, y: -420, z: 35 }, velocity: { x: -25, y: 19, z: 0 }, speed: 31.4, radarCrossSection: 0.08, rfFrequencyMHz: 2400, rfProtocol: 'Encrypted 2.4G', acousticDb: 79, behavior: 'sea_skim' }
            ]
        },
        {
            id: 'SCEN-07',
            title: 'Drill 07: Autonomous Fixed-Wing UAV with GNSS Loss Rerouting',
            terrain: 'rural',
            timeOfDay: 'day',
            weather: 'clear',
            difficulty: 'HARD',
            threatDna: 'RURAL-DAY-CLEAR-FIXEDWING-1-OPTICAL-NAV',
            seed: 1007,
            roe: 'HOSTILE_BORDER',
            tactics: 'autonomous_nav',
            assetsToProtect: ['High-Power Comm Tower', 'Radome Array'],
            availableAssets: ['Directional RF Jammer', 'GPS Spoofing Array', 'Kinetic Interceptor', 'Laser DEW'],
            briefing: 'High-end composite fixed-wing UAV running autonomous visual-inertial navigation. Target does not emit remote pilot RF commands. RF Jamming ineffective; employ GPS spoofing or hard-kill kinetic/laser.',
            targets: [
                {
                    id: 'TRK-701',
                    type: 'fixed_wing',
                    typeName: 'Autonomous Stealth Fixed-Wing UAV',
                    isHostile: true,
                    isDecoy: false,
                    pos: { x: 700, y: -250, z: 220 },
                    velocity: { x: -32, y: 12, z: -2 },
                    speed: 34.2,
                    radarCrossSection: 0.11,
                    rfFrequencyMHz: 0,
                    rfProtocol: 'AUTONOMOUS / RADIO SILENT',
                    acousticDb: 74,
                    behavior: 'autonomous_nav'
                }
            ]
        },
        {
            id: 'SCEN-08',
            title: 'Drill 08: Swarm Leader-Follower Mesh Disruption Drill',
            terrain: 'urban',
            timeOfDay: 'day',
            weather: 'clear',
            difficulty: 'EXPERT',
            threatDna: 'URBAN-DAY-CLEAR-SWARM-6-LEADER-MESH',
            seed: 1008,
            roe: 'HOSTILE_BORDER',
            tactics: 'leader_mesh',
            assetsToProtect: ['Base Command HQ', 'Perimeter Gate'],
            availableAssets: ['Directional RF Jammer', 'GPS Spoofing Array', 'Laser DEW', 'Kinetic Interceptor'],
            briefing: '6-drone coordinated mesh. TRK-801 acts as the swarm master node relaying flight commands to followers. Neutralizing the leader breaks swarm cohesion and sends follower nodes into hover/RTH failsafe.',
            targets: [
                { id: 'TRK-801', type: 'swarm_node', typeName: 'Swarm Commander Node (Master C2)', isHostile: true, isDecoy: false, isLeader: true, pos: { x: -500, y: -500, z: 160 }, velocity: { x: 22, y: 22, z: 0 }, speed: 31.1, radarCrossSection: 0.07, rfFrequencyMHz: 2400, rfProtocol: 'Mesh Broadcast Beacon', acousticDb: 85, behavior: 'mesh_lead' },
                { id: 'TRK-802', type: 'swarm_node', typeName: 'Swarm Follower Node A', isHostile: true, isDecoy: false, pos: { x: -540, y: -480, z: 150 }, velocity: { x: 22, y: 22, z: 0 }, speed: 31.1, radarCrossSection: 0.03, rfFrequencyMHz: 2400, rfProtocol: 'Mesh Sub-Node', acousticDb: 78, behavior: 'mesh_follow', leaderId: 'TRK-801' },
                { id: 'TRK-803', type: 'swarm_node', typeName: 'Swarm Follower Node B', isHostile: true, isDecoy: false, pos: { x: -480, y: -540, z: 155 }, velocity: { x: 22, y: 22, z: 0 }, speed: 31.1, radarCrossSection: 0.03, rfFrequencyMHz: 2400, rfProtocol: 'Mesh Sub-Node', acousticDb: 79, behavior: 'mesh_follow', leaderId: 'TRK-801' },
                { id: 'TRK-804', type: 'swarm_node', typeName: 'Swarm Follower Node C', isHostile: true, isDecoy: false, pos: { x: -560, y: -520, z: 165 }, velocity: { x: 22, y: 22, z: 0 }, speed: 31.1, radarCrossSection: 0.03, rfFrequencyMHz: 2400, rfProtocol: 'Mesh Sub-Node', acousticDb: 77, behavior: 'mesh_follow', leaderId: 'TRK-801' },
                { id: 'TRK-805', type: 'swarm_node', typeName: 'Swarm Follower Node D', isHostile: true, isDecoy: false, pos: { x: -520, y: -560, z: 170 }, velocity: { x: 22, y: 22, z: 0 }, speed: 31.1, radarCrossSection: 0.03, rfFrequencyMHz: 2400, rfProtocol: 'Mesh Sub-Node', acousticDb: 78, behavior: 'mesh_follow', leaderId: 'TRK-801' },
                { id: 'TRK-806', type: 'swarm_node', typeName: 'Swarm Follower Node E', isHostile: true, isDecoy: false, pos: { x: -580, y: -490, z: 145 }, velocity: { x: 22, y: 22, z: 0 }, speed: 31.1, radarCrossSection: 0.03, rfFrequencyMHz: 2400, rfProtocol: 'Mesh Sub-Node', acousticDb: 79, behavior: 'mesh_follow', leaderId: 'TRK-801' }
            ]
        },
        {
            id: 'SCEN-09',
            title: 'Drill 09: Migratory Bird Clutter vs Low-RCS Micro-UAV Discrimination',
            terrain: 'coastal',
            timeOfDay: 'day',
            weather: 'clear',
            difficulty: 'MEDIUM',
            threatDna: 'COASTAL-DAY-CLEAR-BIRD-CLUTTER-4-DISCRIM',
            seed: 1009,
            roe: 'TIGHT',
            tactics: 'clutter_hide',
            assetsToProtect: ['Coastal Helipad', 'Fuel Depot'],
            availableAssets: ['Directional RF Jammer', 'Kinetic Interceptor', 'Laser DEW'],
            briefing: 'Flock of migratory eagles in transit near air base. A micro-recon quadcopter is hiding within the clutter formation. Verify propeller acoustic harmonics before engaging.',
            targets: [
                { id: 'TRK-901', type: 'bird_flock', typeName: 'Migratory Eagle (Steppe Eagle)', isHostile: false, isDecoy: false, pos: { x: -350, y: 380, z: 140 }, velocity: { x: 14, y: -16, z: 2 }, speed: 21.2, radarCrossSection: 0.025, rfFrequencyMHz: 0, rfProtocol: 'BIOLOGICAL (NO RF)', acousticDb: 35, behavior: 'biological_flight' },
                { id: 'TRK-902', type: 'bird_flock', typeName: 'Migratory Eagle (Steppe Eagle)', isHostile: false, isDecoy: false, pos: { x: -380, y: 350, z: 135 }, velocity: { x: 13, y: -15, z: -1 }, speed: 19.8, radarCrossSection: 0.022, rfFrequencyMHz: 0, rfProtocol: 'BIOLOGICAL (NO RF)', acousticDb: 34, behavior: 'biological_flight' },
                { id: 'TRK-903', type: 'commercial_quad', typeName: 'Micro-Recon Drone (Concealed in Clutter)', isHostile: true, isDecoy: false, pos: { x: -365, y: 360, z: 138 }, velocity: { x: 15, y: -15, z: 0 }, speed: 21.2, radarCrossSection: 0.03, rfFrequencyMHz: 2400, rfProtocol: 'DJI OcuSync (Stealth Mode)', acousticDb: 74, behavior: 'recon_hover' },
                { id: 'TRK-904', type: 'bird_flock', typeName: 'Migratory Eagle (Steppe Eagle)', isHostile: false, isDecoy: false, pos: { x: -400, y: 390, z: 150 }, velocity: { x: 14, y: -14, z: 1 }, speed: 19.8, radarCrossSection: 0.028, rfFrequencyMHz: 0, rfProtocol: 'BIOLOGICAL (NO RF)', acousticDb: 36, behavior: 'biological_flight' }
            ]
        },
        {
            id: 'SCEN-10',
            title: 'Drill 10: Saturation Swarm (12 Nodes) - Rapid Prioritization Under Stress',
            terrain: 'urban',
            timeOfDay: 'night',
            weather: 'sandstorm',
            difficulty: 'EXPERT',
            threatDna: 'URBAN-NIGHT-SAND-SWARM-12-SATURATION',
            seed: 1010,
            roe: 'HOSTILE_BORDER',
            tactics: 'saturation',
            assetsToProtect: ['All Base Assets', 'Ammunition Depot S7', 'Radome Array'],
            availableAssets: ['Directional RF Jammer', 'GPS Spoofing Array', 'Laser DEW', 'Kinetic Interceptor', '30mm CIWS'],
            briefing: 'MASS SATURATION ATTACK: 12 hostile nodes converging simultaneously from all quadrants during a desert sandstorm. Triage targets by time-to-impact and allocate countermeasures rapidly.',
            targets: [
                { id: 'TRK-01', type: 'fpv_kamikaze', typeName: 'Fast Kamikaze Node', isHostile: true, isDecoy: false, pos: { x: 450, y: 150, z: 45 }, velocity: { x: -38, y: -12, z: 0 }, speed: 39.8, radarCrossSection: 0.018, rfFrequencyMHz: 5800, acousticDb: 85, behavior: 'kamikaze_dive' },
                { id: 'TRK-02', type: 'fpv_kamikaze', typeName: 'Fast Kamikaze Node', isHostile: true, isDecoy: false, pos: { x: 480, y: 180, z: 50 }, velocity: { x: -37, y: -14, z: 0 }, speed: 39.5, radarCrossSection: 0.018, rfFrequencyMHz: 5800, acousticDb: 84, behavior: 'kamikaze_dive' },
                { id: 'TRK-03', type: 'decoy_chaff', typeName: 'Chaff Distractor Node', isHostile: false, isDecoy: true, pos: { x: 500, y: 120, z: 90 }, velocity: { x: -20, y: -5, z: 0 }, speed: 20.6, radarCrossSection: 0.20, rfFrequencyMHz: 0, acousticDb: 40, behavior: 'decoy_drift' },
                { id: 'TRK-04', type: 'fpv_kamikaze', typeName: 'Fast Kamikaze Node', isHostile: true, isDecoy: false, pos: { x: -450, y: 220, z: 40 }, velocity: { x: 38, y: -18, z: 0 }, speed: 42.0, radarCrossSection: 0.018, rfFrequencyMHz: 5800, acousticDb: 86, behavior: 'kamikaze_dive' },
                { id: 'TRK-05', type: 'payload_dropper', typeName: 'Heavy Mortar Drone', isHostile: true, isDecoy: false, pos: { x: -480, y: 260, z: 90 }, velocity: { x: 22, y: -12, z: 0 }, speed: 25.0, radarCrossSection: 0.06, rfFrequencyMHz: 2400, acousticDb: 88, behavior: 'approach_payload' },
                { id: 'TRK-06', type: 'fpv_kamikaze', typeName: 'Fast Kamikaze Node', isHostile: true, isDecoy: false, pos: { x: -500, y: 200, z: 48 }, velocity: { x: 36, y: -15, z: 0 }, speed: 39.0, radarCrossSection: 0.018, rfFrequencyMHz: 5800, acousticDb: 84, behavior: 'kamikaze_dive' },
                { id: 'TRK-07', type: 'fixed_wing', typeName: 'Recon Fixed-Wing Node', isHostile: true, isDecoy: false, pos: { x: 120, y: -520, z: 180 }, velocity: { x: -6, y: 32, z: 0 }, speed: 32.5, radarCrossSection: 0.09, rfFrequencyMHz: 915, acousticDb: 76, behavior: 'recon_hover' },
                { id: 'TRK-08', type: 'fpv_kamikaze', typeName: 'Fast Kamikaze Node', isHostile: true, isDecoy: false, pos: { x: 160, y: -480, z: 55 }, velocity: { x: -10, y: 36, z: 0 }, speed: 37.3, radarCrossSection: 0.018, rfFrequencyMHz: 5800, acousticDb: 85, behavior: 'kamikaze_dive' },
                { id: 'TRK-09', type: 'decoy_chaff', typeName: 'Chaff Distractor Node', isHostile: false, isDecoy: true, pos: { x: 80, y: -500, z: 110 }, velocity: { x: -4, y: 18, z: 0 }, speed: 18.4, radarCrossSection: 0.18, rfFrequencyMHz: 0, acousticDb: 38, behavior: 'decoy_drift' },
                { id: 'TRK-10', type: 'fpv_kamikaze', typeName: 'Fast Kamikaze Node', isHostile: true, isDecoy: false, pos: { x: -280, y: -480, z: 60 }, velocity: { x: 22, y: 35, z: 0 }, speed: 41.3, radarCrossSection: 0.018, rfFrequencyMHz: 5800, acousticDb: 87, behavior: 'kamikaze_dive' },
                { id: 'TRK-11', type: 'payload_dropper', typeName: 'Heavy Mortar Drone', isHostile: true, isDecoy: false, pos: { x: -320, y: -450, z: 95 }, velocity: { x: 18, y: 24, z: 0 }, speed: 30.0, radarCrossSection: 0.06, rfFrequencyMHz: 2400, acousticDb: 87, behavior: 'approach_payload' },
                { id: 'TRK-12', type: 'fpv_kamikaze', typeName: 'Fast Kamikaze Node', isHostile: true, isDecoy: false, pos: { x: -250, y: -510, z: 52 }, velocity: { x: 20, y: 38, z: 0 }, speed: 42.9, radarCrossSection: 0.018, rfFrequencyMHz: 5800, acousticDb: 88, behavior: 'kamikaze_dive' }
            ]
        },
        {
            id: 'SCEN-11',
            title: 'Drill 11: Electronic Warfare Environment (GPS Denied + Jammer Interference)',
            terrain: 'rural',
            timeOfDay: 'dusk',
            weather: 'rain',
            difficulty: 'HARD',
            threatDna: 'RURAL-DUSK-RAIN-EW-4-JAMMED-RADAR',
            seed: 1011,
            roe: 'HOSTILE_BORDER',
            tactics: 'ew_degraded',
            assetsToProtect: ['Tactical Operations Center'],
            availableAssets: ['Directional RF Jammer', 'Laser DEW', 'Kinetic Interceptor'],
            briefing: 'Enemy electronic warfare standoff emitter blinding western radar azimuth (250°-290°). Fuse acoustic bearings and thermal FLIR imagery to intercept incoming drones.',
            targets: [
                { id: 'TRK-1101', type: 'payload_dropper', typeName: 'Shaped Charge Hexacopter', isHostile: true, isDecoy: false, pos: { x: -550, y: -120, z: 70 }, velocity: { x: 25, y: 6, z: 0 }, speed: 25.7, radarCrossSection: 0.05, rfFrequencyMHz: 433, acousticDb: 84, behavior: 'approach_payload' },
                { id: 'TRK-1102', type: 'fpv_kamikaze', typeName: 'FPV Escort Drone', isHostile: true, isDecoy: false, pos: { x: -520, y: -80, z: 45 }, velocity: { x: 36, y: 6, z: 0 }, speed: 36.5, radarCrossSection: 0.02, rfFrequencyMHz: 5800, acousticDb: 83, behavior: 'kamikaze_dive' },
                { id: 'TRK-1103', type: 'fpv_kamikaze', typeName: 'FPV Escort Drone', isHostile: true, isDecoy: false, pos: { x: -540, y: -160, z: 50 }, velocity: { x: 35, y: 8, z: 0 }, speed: 35.9, radarCrossSection: 0.02, rfFrequencyMHz: 5800, acousticDb: 82, behavior: 'kamikaze_dive' },
                { id: 'TRK-1104', type: 'commercial_quad', typeName: 'Forward Spotter Quad', isHostile: true, isDecoy: false, pos: { x: -580, y: -100, z: 130 }, velocity: { x: 18, y: 4, z: 0 }, speed: 18.4, radarCrossSection: 0.04, rfFrequencyMHz: 2400, acousticDb: 73, behavior: 'recon_hover' }
            ]
        },
        {
            id: 'SCEN-12',
            title: 'Drill 12: Complex Mixed Threat Attack on Ammo Depot (Urban Night Defense)',
            terrain: 'urban',
            timeOfDay: 'night',
            weather: 'rain',
            difficulty: 'EXPERT',
            threatDna: 'URBAN-NIGHT-RAIN-COMPLEX-8-MIXED-ATTACK',
            seed: 1012,
            roe: 'URBAN_MIN_COLLATERAL',
            tactics: 'complex_mixed',
            assetsToProtect: ['Ammunition Depot S7', 'Command HQ', 'Civilian Border Colony'],
            availableAssets: ['Directional RF Jammer', 'GPS Spoofing Array', 'Kinetic Interceptor', 'Laser DEW'],
            briefing: 'HIGH-COLLATERAL SENSITIVITY: Mixed threat of decoys, recon spotters, and fast FPV strikers adjacent to civilian structures. 30mm CIWS prohibited due to fragmentation hazard. Utilize RF jammers and net interceptors.',
            targets: [
                { id: 'TRK-1201', type: 'commercial_quad', typeName: 'Recon Spotter (Spotting Ammo S7)', isHostile: true, isDecoy: false, pos: { x: -420, y: -380, z: 110 }, velocity: { x: 12, y: 11, z: 0 }, speed: 16.3, radarCrossSection: 0.04, rfFrequencyMHz: 2400, acousticDb: 74, behavior: 'recon_hover' },
                { id: 'TRK-1202', type: 'decoy_chaff', typeName: 'Corner Reflector Decoy Chaff', isHostile: false, isDecoy: true, pos: { x: -480, y: -350, z: 125 }, velocity: { x: 14, y: 10, z: 0 }, speed: 17.2, radarCrossSection: 0.22, rfFrequencyMHz: 0, acousticDb: 39, behavior: 'decoy_drift' },
                { id: 'TRK-1203', type: 'fpv_kamikaze', typeName: 'FPV Striker Alpha (Terminal Target S7)', isHostile: true, isDecoy: false, pos: { x: -550, y: -420, z: 40 }, velocity: { x: 38, y: 28, z: 0 }, speed: 47.2, radarCrossSection: 0.018, rfFrequencyMHz: 5800, acousticDb: 86, behavior: 'kamikaze_dive' },
                { id: 'TRK-1204', type: 'fpv_kamikaze', typeName: 'FPV Striker Bravo (Terminal Target S7)', isHostile: true, isDecoy: false, pos: { x: -580, y: -390, z: 42 }, velocity: { x: 37, y: 27, z: 0 }, speed: 45.8, radarCrossSection: 0.018, rfFrequencyMHz: 5800, acousticDb: 85, behavior: 'kamikaze_dive' },
                { id: 'TRK-1205', type: 'payload_dropper', typeName: 'Hexacopter Shaped Munition Dropper', isHostile: true, isDecoy: false, pos: { x: 420, y: 460, z: 90 }, velocity: { x: -22, y: -24, z: 0 }, speed: 32.5, radarCrossSection: 0.06, rfFrequencyMHz: 2400, acousticDb: 86, behavior: 'approach_payload' },
                { id: 'TRK-1206', type: 'decoy_chaff', typeName: 'Corner Reflector Decoy Chaff', isHostile: false, isDecoy: true, pos: { x: 460, y: 420, z: 120 }, velocity: { x: -16, y: -15, z: 0 }, speed: 21.9, radarCrossSection: 0.19, rfFrequencyMHz: 0, acousticDb: 40, behavior: 'decoy_drift' },
                { id: 'TRK-1207', type: 'fpv_kamikaze', typeName: 'FPV Striker Charlie (Civilian Proximity)', isHostile: true, isDecoy: false, pos: { x: 490, y: 400, z: 45 }, velocity: { x: -35, y: -28, z: 0 }, speed: 44.8, radarCrossSection: 0.018, rfFrequencyMHz: 5800, acousticDb: 85, behavior: 'kamikaze_dive' },
                { id: 'TRK-1208', type: 'fixed_wing', typeName: 'Autonomous Stand-off Comm Relay', isHostile: true, isDecoy: false, pos: { x: 620, y: -450, z: 240 }, velocity: { x: -24, y: 18, z: 0 }, speed: 30.0, radarCrossSection: 0.10, rfFrequencyMHz: 915, acousticDb: 77, behavior: 'recon_hover' }
            ]
        }
    ],

    // Mulberry32 Seeded PRNG for Deterministic Procedural Threat DNA Generation
    mulberry32: function(seed) {
        return function() {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    },

    // Procedural Scenario Generator with Threat DNA
    generateProcedural: function(options) {
        const swarmSize = parseInt(options.swarmSize) || 5;
        const terrain = options.terrain || 'urban';
        const timeOfDay = options.timeOfDay || 'night';
        const weather = options.weather || 'clear';
        const tactics = options.tactics || 'pincer'; // pincer, saturation, decoy_led, staggered
        const difficulty = options.difficulty || 'MEDIUM';
        const seed = options.seed ? parseInt(options.seed) : Math.floor(Math.random() * 89999 + 10000);

        const rng = this.mulberry32(seed);

        const threatDna = `${terrain.toUpperCase()}-${timeOfDay.toUpperCase()}-${weather.toUpperCase()}-${tactics.toUpperCase()}-${swarmSize}-NODE-${seed}`;

        const targets = [];
        for (let i = 0; i < swarmSize; i++) {
            const tid = `TRK-P${101 + i}`;
            const angle = (2 * Math.PI / swarmSize) * i + (rng() - 0.5) * 0.4;
            const dist = 550 + rng() * 200;
            const alt = Math.floor(35 + rng() * 120);

            let type = 'fpv_kamikaze';
            let isHostile = true;
            let isDecoy = false;
            let typeName = 'FPV Kamikaze Drone';

            if (tactics === 'decoy_led' && i === 0) {
                type = 'decoy_chaff';
                isHostile = false;
                isDecoy = true;
                typeName = 'Radar Chaff Decoy';
            } else if (i % 3 === 1) {
                type = 'commercial_quad';
                typeName = 'Recon Quadcopter';
            } else if (i % 3 === 2) {
                type = 'payload_dropper';
                typeName = 'Heavy Payload Carrier';
            }

            const speed = type === 'fpv_kamikaze' ? 38 + rng() * 6 : (type === 'payload_dropper' ? 24 : 16);
            const rcs = type === 'decoy_chaff' ? 0.22 : (type === 'fpv_kamikaze' ? 0.018 : 0.045);
            const freq = type === 'decoy_chaff' ? 0 : (rng() > 0.5 ? 2400 : (rng() > 0.5 ? 5800 : 915));

            targets.push({
                id: tid,
                type: type,
                typeName: typeName,
                isHostile: isHostile,
                isDecoy: isDecoy,
                pos: {
                    x: Math.round(Math.cos(angle) * dist),
                    y: Math.round(Math.sin(angle) * dist),
                    z: alt
                },
                velocity: {
                    x: Math.round(-Math.cos(angle) * speed),
                    y: Math.round(-Math.sin(angle) * speed),
                    z: 0
                },
                speed: Math.round(speed * 10) / 10,
                radarCrossSection: rcs,
                rfFrequencyMHz: freq,
                rfProtocol: freq === 0 ? 'NO RF' : (freq === 5800 ? 'Analog 5.8G VTX' : 'Digital FHSS'),
                acousticDb: Math.floor(70 + rng() * 18),
                behavior: tactics
            });
        }

        return {
            id: `SCEN-P-${seed}`,
            title: `Procedural Swarm: ${tactics.replace('_', ' ').toUpperCase()} (${swarmSize} Drones)`,
            terrain: terrain,
            timeOfDay: timeOfDay,
            weather: weather,
            difficulty: difficulty,
            threatDna: threatDna,
            seed: seed,
            roe: difficulty === 'EASY' ? 'TIGHT' : 'HOSTILE_BORDER',
            tactics: tactics,
            assetsToProtect: ['Base Command Post', 'Perimeter Radome Array', 'Ammunition Depot S7'],
            availableAssets: ['Directional RF Jammer', 'GPS Spoofing Array', 'Kinetic Interceptor Net', 'Laser DEW', '30mm CIWS'],
            briefing: `Procedurally generated swarm operation under seed #${seed}. Threat DNA: ${threatDna}. Prepare countermeasure allocation.`,
            targets: targets
        };
    },

    // Decode Threat DNA string back into scenario
    fromThreatDna: function(dnaStr) {
        if (!dnaStr) return null;
        const parts = dnaStr.trim().split('-');
        if (parts.length < 7) return null;

        const terrain = parts[0].toLowerCase();
        const timeOfDay = parts[1].toLowerCase();
        const weather = parts[2].toLowerCase();
        const tactics = parts[3].toLowerCase();
        const swarmSize = parseInt(parts[4]) || 4;
        const seed = parseInt(parts[6]) || 1001;

        return this.generateProcedural({
            terrain: terrain,
            timeOfDay: timeOfDay,
            weather: weather,
            tactics: tactics,
            swarmSize: swarmSize,
            seed: seed
        });
    }
};
