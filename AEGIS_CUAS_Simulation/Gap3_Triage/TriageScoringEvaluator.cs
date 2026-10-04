// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Gap3_Triage/TriageScoringEvaluator.cs
// CAPABILITY GAP 3: Cognitive Overload & Decision-Tree Engagement Scoring
// ============================================================================

using System;
using System.Collections.Generic;
using Aegis.CUAS.Simulation.Core;
using Aegis.CUAS.Simulation.Swarm;

namespace Aegis.CUAS.Simulation.Triage
{
    /// <summary>
    /// Evaluates user/operator engagement decisions during saturation attacks.
    /// Mathematically penalizes targeting non-lethal decoy swarms while leaving
    /// high-threat, imminent armed FPV drones unengaged. Calculates cognitive overload index.
    /// </summary>
    public class TriageScoringEvaluator
    {
        private readonly ThreatTriageMatrix _triageMatrix;
        private readonly List<EngagementRecord> _engagementHistory = new List<EngagementRecord>();

        // Penalties & Rewards
        public float PenaltyDecoyEngaged { get; set; } = 25.0f;           // Penalty for wasting fire on decoy
        public float PenaltyUnengagedKineticLead { get; set; } = 35.0f;   // Penalty for ignoring imminent strike drone
        public float RewardHighThreatNeutralized { get; set; } = 50.0f;  // Reward for timely high-threat intercept
        public float MaxAllowedReactionTimeSec { get; set; } = 4.0f;      // Ideal reaction window

        // Dynamic State Metrics
        public float CumulativeScore { get; private set; } = 100.0f;
        public int TotalDecoysEngaged { get; private set; } = 0;
        public int TotalKineticStrikingNeutralized { get; private set; } = 0;
        public float CognitiveOverloadIndex { get; private set; } = 0.0f; // 0.0 (calm) to 1.0 (overwhelmed)

        public TriageScoringEvaluator(ThreatTriageMatrix triageMatrix)
        {
            _triageMatrix = triageMatrix;
        }

        /// <summary>
        /// Evaluates a single defender engagement fire action against the current active swarm state.
        /// </summary>
        public EngagementRecord EvaluateOperatorEngagement(
            string operatorID,
            string targetDroneID,
            List<SwarmDroneAgent> activeSwarm,
            double currentTimeSec,
            double targetFirstDetectedTimeSec)
        {
            SwarmDroneAgent targetDrone = activeSwarm.Find(d => d.AgentID == targetDroneID);
            if (targetDrone == null) return null;

            float calculatedThreatScore = _triageMatrix.CalculateThreatScore(targetDrone);
            bool isHighThreat = targetDrone.Type == DroneType.KineticStrikerFPV || calculatedThreatScore >= 70.0f;
            bool isDecoy = targetDrone.Type == DroneType.DecoyChaffSwarm;

            // Check if there were higher threat drones unengaged at the moment of firing
            bool ignoredHigherThreatLead = FalsePositiveTriageCheck(targetDrone, activeSwarm);

            float deltaScore = 0f;

            if (isDecoy)
            {
                TotalDecoysEngaged++;
                deltaScore -= PenaltyDecoyEngaged;
            }
            else if (isHighThreat)
            {
                TotalKineticStrikingNeutralized++;
                float reactionDelay = (float)(currentTimeSec - targetFirstDetectedTimeSec);
                float reactionMultiplier = Math.Clamp(1.5f - (reactionDelay / MaxAllowedReactionTimeSec), 0.5f, 1.5f);
                deltaScore += RewardHighThreatNeutralized * reactionMultiplier;
            }

            if (ignoredHigherThreatLead)
            {
                deltaScore -= PenaltyUnengagedKineticLead;
            }

            // Update cumulative triage score clamped between 0 and 500
            CumulativeScore = Math.Clamp(CumulativeScore + deltaScore, 0f, 500f);

            // Compute dynamic Cognitive Overload Index based on unengaged threats vs active targets
            UpdateCognitiveOverloadIndex(activeSwarm);

            var record = new EngagementRecord
            {
                EngagementID = $"ENG-{Guid.NewGuid().ToString().Substring(0, 8)}",
                OperatorID = operatorID,
                TargetDroneID = targetDroneID,
                TargetType = targetDrone.Type,
                EngagementTimestamp = currentTimeSec,
                DetectionTimestamp = targetFirstDetectedTimeSec,
                CalculatedThreatScore = calculatedThreatScore,
                WasHighThreatLead = isHighThreat,
                WasNonLethalDecoy = isDecoy,
                Neutralized = true
            };

            _engagementHistory.Add(record);
            return record;
        }

        /// <summary>
        /// Decision-tree algorithm: Returns true if the user targeted a low-threat asset while an imminent high-threat FPV was within 300m of HVA.
        /// </summary>
        private bool FalsePositiveTriageCheck(SwarmDroneAgent chosenTarget, List<SwarmDroneAgent> activeSwarm)
        {
            float chosenThreat = _triageMatrix.CalculateThreatScore(chosenTarget);

            int count = activeSwarm.Count;
            for (int i = 0; i < count; i++)
            {
                SwarmDroneAgent other = activeSwarm[i];
                if (!other.IsActive || other.State == DroneState.Neutralized || other.AgentID == chosenTarget.AgentID) continue;

                float otherThreat = _triageMatrix.CalculateThreatScore(other);
                float distToHVA = Vector3D.Distance(other.Position, _triageMatrix.DefendedHVAPosition);

                // If another drone has significantly higher threat score and is inside critical zone
                if (otherThreat > chosenThreat + 30.0f && distToHVA < 400.0f)
                {
                    return true; // User committed a triage error!
                }
            }
            return false;
        }

        /// <summary>
        /// Updates the cognitive overload index based on swarm saturation density and active threat velocity.
        /// </summary>
        private void UpdateCognitiveOverloadIndex(List<SwarmDroneAgent> activeSwarm)
        {
            if (activeSwarm == null || activeSwarm.Count == 0)
            {
                CognitiveOverloadIndex = 0f;
                return;
            }

            int criticalThreats = 0;
            int totalActive = 0;

            int count = activeSwarm.Count;
            for (int i = 0; i < count; i++)
            {
                SwarmDroneAgent drone = activeSwarm[i];
                if (!drone.IsActive || drone.State == DroneState.Neutralized) continue;

                totalActive++;
                if (_triageMatrix.CalculateThreatScore(drone) >= 60.0f)
                {
                    criticalThreats++;
                }
            }

            // Cognitive overload spikes when critical unengaged threats exceed 4 simultaneous channels
            float densityRatio = Math.Min(1.0f, totalActive / 15.0f);
            float threatRatio = Math.Min(1.0f, criticalThreats / 5.0f);

            CognitiveOverloadIndex = (densityRatio * 0.4f) + (threatRatio * 0.6f);
        }

        public List<EngagementRecord> GetEngagementHistory() => new List<EngagementRecord>(_engagementHistory);
    }
}
