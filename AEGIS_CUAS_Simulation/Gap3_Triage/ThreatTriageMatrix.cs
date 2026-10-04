// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Gap3_Triage/ThreatTriageMatrix.cs
// CAPABILITY GAP 3: Dynamic Threat Triage Weight Matrix
// ============================================================================

using System;
using Aegis.CUAS.Simulation.Core;
using Aegis.CUAS.Simulation.Swarm;

namespace Aegis.CUAS.Simulation.Triage
{
    /// <summary>
    /// Evaluates threat priority for incoming airborne targets.
    /// Combines payload lethal weight, proximity to defended High-Value Asset (HVA),
    /// velocity vector convergence, and swarm role classification.
    /// </summary>
    public class ThreatTriageMatrix
    {
        // Multi-Factor Triage Weighting Matrix
        public float WeightPayloadType { get; set; } = 35.0f;     // Lethality weight
        public float WeightProximity { get; set; } = 30.0f;       // Inverse distance weight
        public float WeightVelocityConvergence { get; set; } = 25.0f; // Closing rate weight
        public float WeightAltitudeTactical { get; set; } = 10.0f;    // Low-altitude masking risk

        public Vector3D DefendedHVAPosition { get; set; } = Vector3D.Zero;

        public ThreatTriageMatrix(Vector3D hvaPos)
        {
            DefendedHVAPosition = hvaPos;
        }

        /// <summary>
        /// Calculates normalized Threat Score (0.0 to 100.0) for a target drone.
        /// </summary>
        public float CalculateThreatScore(SwarmDroneAgent drone)
        {
            if (drone == null || !drone.IsActive || drone.State == DroneState.Neutralized) return 0f;

            // 1. Payload & Lethality Weight
            float payloadScore = drone.Type switch
            {
                DroneType.KineticStrikerFPV => 1.0f, // Extreme threat (shaped charge / HE)
                DroneType.EWEmitterJammer => 0.75f,  // High threat (denies radar/control links)
                DroneType.ISRReconnaissance => 0.50f, // Medium threat (artillery spotter)
                DroneType.DecoyChaffSwarm => 0.05f,   // Non-lethal decoy / false target
                _ => 0.1f
            };

            // 2. Proximity Factor (Exponential ramp-up inside 500m engagement zone)
            float distToHVA = Vector3D.Distance(drone.Position, DefendedHVAPosition);
            float maxThreatRadius = 1000.0f; // 1 km radius
            float proximityScore = 1.0f - Math.Clamp(distToHVA / maxThreatRadius, 0f, 1f);
            proximityScore = (float)Math.Pow(proximityScore, 1.8); // Non-linear acceleration near target

            // 3. Velocity Vector Convergence (Closing Rate to HVA)
            Vector3D dirToHVA = (DefendedHVAPosition - drone.Position).Normalized;
            float closingVelocity = Vector3D.Dot(drone.Velocity, dirToHVA); // Positive if moving towards HVA
            float maxExpectedClosingSpeed = drone.MaxSpeed;
            float velocityScore = Math.Clamp(closingVelocity / maxExpectedClosingSpeed, 0f, 1f);

            // 4. Altitude Factor (Pop-up low-altitude attacks have lower reaction windows)
            float groundRelativeAltitude = drone.Position.y;
            float altitudeScore = 1.0f - Math.Clamp(groundRelativeAltitude / 150.0f, 0f, 1f);

            // Aggregate weighted total
            float totalScore = (payloadScore * WeightPayloadType) +
                               (proximityScore * WeightProximity) +
                               (velocityScore * WeightVelocityConvergence) +
                               (altitudeScore * WeightAltitudeTactical);

            return Math.Clamp(totalScore, 0.0f, 100.0f);
        }

        /// <summary>
        /// Classifies threat urgency level based on total calculated score.
        /// </summary>
        public string GetThreatUrgencyLabel(float score)
        {
            if (score >= 80.0f) return "CRITICAL_IMMINENT_STRIKE";
            if (score >= 55.0f) return "HIGH_TACTICAL_THREAT";
            if (score >= 30.0f) return "MODERATE_RECON_JAMMING";
            return "LOW_DECOY_CLUTTER";
        }
    }
}
