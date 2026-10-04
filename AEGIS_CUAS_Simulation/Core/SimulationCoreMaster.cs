// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Core/SimulationCoreMaster.cs
// ARCHITECTURE: Master Simulation Core Orchestrator (60Hz Tick Engine)
// ============================================================================

using System;
using System.Collections.Generic;
using Aegis.CUAS.Simulation.AIDirector;
using Aegis.CUAS.Simulation.Analytics;
using Aegis.CUAS.Simulation.Networking;
using Aegis.CUAS.Simulation.Sensors;
using Aegis.CUAS.Simulation.Swarm;
using Aegis.CUAS.Simulation.Telemetry;
using Aegis.CUAS.Simulation.Triage;

namespace Aegis.CUAS.Simulation.Core
{
    /// <summary>
    /// Master Orchestrator binding all 4 capability gaps into a single execution thread.
    /// Runs hardware-agnostic near-O(N) swarm updates, RF attenuation propagation,
    /// sensor fusion noise injection, threat triage scoring, LAN state sync, and telemetry logging.
    /// </summary>
    public class SimulationCoreMaster : IDisposable
    {
        // Core Systems
        private readonly SwarmFlockingSystem _flockingSystem;
        private readonly RFAttenuationEngine _rfEngine;
        private readonly SensorFusionMatrix _sensorMatrix;
        private readonly ThreatTriageMatrix _triageMatrix;
        private readonly TriageScoringEvaluator _scoringEvaluator;
        private readonly AIDirectorStateMachine _aiDirector;
        private readonly TacticalPathGenerator _pathGenerator;
        private readonly LANMultiplaySynchronizer _networkSync;
        private readonly TelemetryLogger _telemetryLogger;
        private readonly SQLiteDatabaseConnector _dbConnector;
        private readonly AARAnalyticsEngine _aarEngine;

        // Simulation State
        private readonly List<SwarmDroneAgent> _activeSwarm = new List<SwarmDroneAgent>();
        private readonly Dictionary<string, double> _firstDetectedTimestamps = new Dictionary<string, double>();
        private readonly EWEmitterJammer _activeJammer;

        public string SessionID { get; }
        public Vector3D DefendedHVAPosition { get; set; } = new Vector3D(0f, 10f, 0f);
        public Vector3D SensorStationPosition { get; set; } = new Vector3D(0f, 15f, 0f);
        public double CurrentTimeSec { get; private set; } = 0.0;
        public bool IsRunning { get; private set; } = false;

        public SimulationCoreMaster(string sessionID = null, string nodeID = "Unit-Alpha-01")
        {
            SessionID = sessionID ?? $"SESS-{Guid.NewGuid().ToString().Substring(0, 8)}";

            // Initialize All Subsystems
            _flockingSystem = new SwarmFlockingSystem(30.0f);
            _rfEngine = new RFAttenuationEngine();
            _sensorMatrix = new SensorFusionMatrix(_rfEngine);
            _triageMatrix = new ThreatTriageMatrix(DefendedHVAPosition);
            _scoringEvaluator = new TriageScoringEvaluator(_triageMatrix);
            _aiDirector = new AIDirectorStateMachine();
            _pathGenerator = new TacticalPathGenerator();
            _networkSync = new LANMultiplaySynchronizer(nodeID);
            _telemetryLogger = new TelemetryLogger(SessionID);
            _dbConnector = new SQLiteDatabaseConnector();
            _aarEngine = new AARAnalyticsEngine();

            // Set up C-UAS EW Directional Jammer
            _activeJammer = new EWEmitterJammer
            {
                EmitterID = "EW-JAMMER-01",
                Position = new Vector3D(-50f, 12f, 50f),
                AimDirection = new Vector3D(1f, 0f, -1f).Normalized,
                PowerOutputWatts = 150.0f,
                FrequencyMHz = 2400.0f,
                AntennaGainMaxDBi = 20.0f,
                BeamWidthDegrees = 35.0f,
                IsActive = true
            };
        }

        /// <summary>
        /// Pre-populates scenario with multi-agent drone swarm operating under adversarial doctrine.
        /// </summary>
        public void InitializeScenario(int kineticFPVCount = 8, int decoyCount = 12, int isrCount = 2)
        {
            _activeSwarm.Clear();
            _firstDetectedTimestamps.Clear();

            Random rand = new Random(101);

            // Spawn Kinetic FPV Strikers
            for (int i = 0; i < kineticFPVCount; i++)
            {
                Vector3D startPos = new Vector3D(-600f + rand.Next(-50, 50), 30f + rand.Next(-10, 10), -600f + rand.Next(-50, 50));
                var drone = new SwarmDroneAgent($"FPV-STRIKE-{i + 1:D2}", startPos, DroneType.KineticStrikerFPV);
                drone.TargetObjective = DefendedHVAPosition;
                _activeSwarm.Add(drone);
            }

            // Spawn Non-Lethal Decoy Swarm Screen
            for (int i = 0; i < decoyCount; i++)
            {
                Vector3D startPos = new Vector3D(-520f + rand.Next(-80, 80), 45f + rand.Next(-15, 15), -520f + rand.Next(-80, 80));
                var drone = new SwarmDroneAgent($"DECOY-CHAFF-{i + 1:D2}", startPos, DroneType.DecoyChaffSwarm);
                drone.TargetObjective = DefendedHVAPosition;
                _activeSwarm.Add(drone);
            }

            // Spawn ISR Recon Units
            for (int i = 0; i < isrCount; i++)
            {
                Vector3D startPos = new Vector3D(-750f + rand.Next(-40, 40), 180f + rand.Next(-20, 20), -400f + rand.Next(-40, 40));
                var drone = new SwarmDroneAgent($"ISR-RECON-{i + 1:D2}", startPos, DroneType.ISRReconnaissance);
                drone.TargetObjective = DefendedHVAPosition;
                _activeSwarm.Add(drone);
            }

            // Start UDP LAN Sync
            _networkSync.StartSynchronization();
            IsRunning = true;
            Console.WriteLine($"[Simulation Core] Scenario Initialized with {_activeSwarm.Count} multi-agent drones.");
        }

        /// <summary>
        /// Executes a single discrete simulation frame tick (60Hz / deltaTime).
        /// </summary>
        public void StepSimulationTick(float deltaTime)
        {
            if (!IsRunning) return;
            CurrentTimeSec += deltaTime;

            // Simple procedurally evaluated heightmap (Hills & Valleys)
            Func<Vector3D, float> heightmap = (pos) => (float)(Math.Sin(pos.x * 0.005) * Math.Cos(pos.z * 0.005) * 35.0);

            // 1. GAP 4: AI Director State Machine & Physical Constraints Enforcement
            _aiDirector.UpdateDirectorState(_activeSwarm, DefendedHVAPosition, deltaTime);

            // 2. GAP 1: Near O(N) Swarm Dynamics & Spatial Partitioning Update Loop
            _flockingSystem.UpdateSwarmDynamics(_activeSwarm, deltaTime, heightmap);

            // 3. GAP 2: Sensor Fusion Matrix & Dynamic RF Propagation
            List<SensorObservation> observations = _sensorMatrix.ProcessFusedObservations(
                _activeSwarm,
                _activeJammer,
                SensorStationPosition,
                CurrentTimeSec,
                heightmap
            );

            // Track detection timestamps for MTTD calculation
            for (int i = 0; i < observations.Count; i++)
            {
                SensorObservation obs = observations[i];
                if (!obs.IsFalsePositive && !_firstDetectedTimestamps.ContainsKey(obs.TrackID))
                {
                    _firstDetectedTimestamps[obs.TrackID] = CurrentTimeSec;
                }
            }

            // 4. GAP 3: Threat Triage Weight Matrix Calculation
            var stateSnapshots = new List<DroneStateSnapshot>();
            for (int i = 0; i < _activeSwarm.Count; i++)
            {
                SwarmDroneAgent drone = _activeSwarm[i];
                if (!drone.IsActive) continue;

                float threatScore = _triageMatrix.CalculateThreatScore(drone);

                // Log high-frequency telemetry
                _telemetryLogger.LogEvent(new TelemetryEvent
                {
                    SessionID = SessionID,
                    Timestamp = CurrentTimeSec,
                    EventType = "DRONE_TICK",
                    DroneID = drone.AgentID,
                    Position = drone.Position,
                    Velocity = drone.Velocity,
                    ThreatScore = threatScore
                });

                stateSnapshots.Add(new DroneStateSnapshot
                {
                    DroneID = drone.AgentID,
                    Position = drone.Position,
                    Velocity = drone.Velocity,
                    Type = drone.Type,
                    State = drone.State,
                    ThreatScore = threatScore
                });
            }

            // 5. ADDITIONAL CHANNEL: Broadcast LAN UDP State Packet
            _networkSync.BroadcastSwarmState(new SwarmStatePacket
            {
                SessionID = SessionID,
                SequenceTimestamp = CurrentTimeSec,
                Drones = stateSnapshots,
                OperatorScore = _scoringEvaluator.CumulativeScore,
                CognitiveOverloadIndex = _scoringEvaluator.CognitiveOverloadIndex
            });
        }

        /// <summary>
        /// Simulates operator intercept engagement fire against a target drone.
        /// </summary>
        public EngagementRecord ExecuteOperatorFire(string operatorID, string targetDroneID)
        {
            if (!IsRunning) return null;

            double firstDetected = _firstDetectedTimestamps.TryGetValue(targetDroneID, out double t) ? t : CurrentTimeSec;

            EngagementRecord record = _scoringEvaluator.EvaluateOperatorEngagement(
                operatorID,
                targetDroneID,
                _activeSwarm,
                CurrentTimeSec,
                firstDetected
            );

            if (record != null)
            {
                SwarmDroneAgent drone = _activeSwarm.Find(d => d.AgentID == targetDroneID);
                if (drone != null)
                {
                    drone.State = DroneState.Neutralized;
                    drone.IsActive = false;
                }

                _telemetryLogger.LogEvent(new TelemetryEvent
                {
                    SessionID = SessionID,
                    Timestamp = CurrentTimeSec,
                    EventType = "OPERATOR_ENGAGEMENT",
                    DroneID = targetDroneID,
                    UserTargetID = operatorID,
                    ThreatScore = record.CalculatedThreatScore,
                    HitSuccess = true
                });
            }

            return record;
        }

        /// <summary>
        /// Ends simulation session and outputs After-Action Review (AAR) report.
        /// </summary>
        public AARPerformanceReport ConcludeSession(string operatorID = "OPERATOR-01")
        {
            IsRunning = false;
            _networkSync.StopSynchronization();
            _telemetryLogger.FlushAndStop();

            AARPerformanceReport report = _aarEngine.GenerateAARReport(
                SessionID,
                operatorID,
                CurrentTimeSec,
                _scoringEvaluator.GetEngagementHistory(),
                _firstDetectedTimestamps,
                _scoringEvaluator.CumulativeScore,
                _scoringEvaluator.CognitiveOverloadIndex
            );

            Console.WriteLine(report.ToString());
            return report;
        }

        public void Dispose()
        {
            _networkSync?.Dispose();
            _telemetryLogger?.Dispose();
        }
    }
}
