// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Gap4_AIDirector/AIDirectorStateMachine.cs
// CAPABILITY GAP 4: Tactically Aware AI Scenario Director & Flight Physics Limits
// ============================================================================

using System;
using System.Collections.Generic;
using Aegis.CUAS.Simulation.Core;
using Aegis.CUAS.Simulation.Swarm;

namespace Aegis.CUAS.Simulation.AIDirector
{
    /// <summary>
    /// Governs scenario progression, physical flight envelope constraints,
    /// and tactical state transitions for multi-agent drone swarms.
    /// </summary>
    public class AIDirectorStateMachine
    {
        private readonly float _maxGForceAcceleration = 6.0f * 9.81f; // 6G structural physics ceiling
        private readonly float _maxAngularVelocityRadPerSec = (float)(Math.PI * 1.5); // ~270 deg/sec max yaw/pitch
        private double _stateTimer = 0.0;

        public DroneState CurrentScenarioState { get; private set; } = DroneState.Staging;
        public float TargetAltitudeCeiling { get; set; } = 250.0f; // meters
        public float SaturationDivergenceRadius { get; set; } = 400.0f; // meters from HVA

        /// <summary>
        /// Updates the AI Scenario Director state machine lifecycle.
        /// </summary>
        public void UpdateDirectorState(List<SwarmDroneAgent> swarm, Vector3D hvaPosition, float deltaTime)
        {
            _stateTimer += deltaTime;

            switch (CurrentScenarioState)
            {
                case DroneState.Staging:
                    if (_stateTimer > 3.0) // 3 seconds staging buffer
                    {
                        TransitionState(DroneState.IngressTerrainMasked, swarm);
                    }
                    break;

                case DroneState.IngressTerrainMasked:
                    // Check if closest strike drone has penetrated the saturation threshold
                    float minDistanceToHVA = float.MaxValue;
                    int count = swarm.Count;
                    for (int i = 0; i < count; i++)
                    {
                        if (swarm[i].IsActive)
                        {
                            float d = Vector3D.Distance(swarm[i].Position, hvaPosition);
                            if (d < minDistanceToHVA) minDistanceToHVA = d;
                        }
                    }

                    if (minDistanceToHVA <= SaturationDivergenceRadius)
                    {
                        TransitionState(DroneState.SaturationDivergence, swarm);
                    }
                    break;

                case DroneState.SaturationDivergence:
                    // Split decoys from kinetic strikers for terminal saturation attack
                    if (_stateTimer > 10.0)
                    {
                        TransitionState(DroneState.TerminalStrike, swarm);
                    }
                    break;

                case DroneState.TerminalStrike:
                    // High-speed terminal kinetic engagement phase
                    break;
            }

            // Enforce hard physical flight constraints on all active agents
            EnforcePhysicalConstraints(swarm, deltaTime);
        }

        private void TransitionState(DroneState newState, List<SwarmDroneAgent> swarm)
        {
            CurrentScenarioState = newState;
            _stateTimer = 0.0;

            int count = swarm.Count;
            for (int i = 0; i < count; i++)
            {
                if (swarm[i].IsActive && swarm[i].State != DroneState.Neutralized)
                {
                    swarm[i].State = newState;
                }
            }
        }

        /// <summary>
        /// Enforces G-force limits, velocity ceilings, and angular turn limits to prevent impossible flight profiles.
        /// </summary>
        private void EnforcePhysicalConstraints(List<SwarmDroneAgent> swarm, float deltaTime)
        {
            if (deltaTime <= 0.0001f) return;

            int count = swarm.Count;
            for (int i = 0; i < count; i++)
            {
                SwarmDroneAgent drone = swarm[i];
                if (!drone.IsActive || drone.State == DroneState.Neutralized) continue;

                // 1. Enforce Structural G-Force Acceleration Limit
                float currentAccMag = drone.Acceleration.Magnitude;
                if (currentAccMag > _maxGForceAcceleration)
                {
                    drone.Acceleration = drone.Acceleration.Normalized * _maxGForceAcceleration;
                }

                // 2. Enforce Max Angular Turn Rate Limit (Yaw/Pitch change per second)
                Vector3D currentHeading = drone.Velocity.Normalized;
                Vector3D desiredHeading = (drone.Velocity + drone.Acceleration * deltaTime).Normalized;

                if (currentHeading.SqrMagnitude > 0.001f && desiredHeading.SqrMagnitude > 0.001f)
                {
                    float angleRad = (float)Math.Acos(Math.Clamp(Vector3D.Dot(currentHeading, desiredHeading), -1.0f, 1.0f));
                    float maxAllowedAngle = _maxAngularVelocityRadPerSec * deltaTime;

                    if (angleRad > maxAllowedAngle)
                    {
                        // Interpolate heading vector to respect max turn rate
                        Vector3D clampedDir = (currentHeading + (desiredHeading - currentHeading) * (maxAllowedAngle / angleRad)).Normalized;
                        drone.Velocity = clampedDir * drone.Velocity.Magnitude;
                    }
                }

                // 3. Enforce Altitude Limits (Prevent orbital ceiling clipping)
                if (drone.Position.y > TargetAltitudeCeiling)
                {
                    drone.Position = new Vector3D(drone.Position.x, TargetAltitudeCeiling, drone.Position.z);
                    if (drone.Velocity.y > 0) drone.Velocity = new Vector3D(drone.Velocity.x, 0f, drone.Velocity.z);
                }
            }
        }
    }
}
