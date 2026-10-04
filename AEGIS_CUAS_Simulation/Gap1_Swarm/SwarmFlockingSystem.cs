// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Gap1_Swarm/SwarmFlockingSystem.cs
// CAPABILITY GAP 1: Near O(N) Hardware-Agnostic Swarm Flocking Acceleration
// ============================================================================

using System;
using System.Collections.Generic;
using Aegis.CUAS.Simulation.Core;

namespace Aegis.CUAS.Simulation.Swarm
{
    /// <summary>
    /// Swarm Drone implementation satisfying ISwarmAgent interface.
    /// </summary>
    public class SwarmDroneAgent : ISwarmAgent
    {
        public string AgentID { get; set; }
        public Vector3D Position { get; set; }
        public Vector3D Velocity { get; set; }
        public Vector3D Acceleration { get; set; }
        public DroneType Type { get; set; }
        public DroneState State { get; set; }
        public bool IsActive { get; set; }

        public float MaxSpeed { get; set; } = 35.0f;        // m/s (~126 km/h FPV speed)
        public float MaxForce { get; set; } = 25.0f;        // Steering force limit m/s^2
        public float Mass { get; set; } = 1.5f;             // kg
        public Vector3D TargetObjective { get; set; }      // Current tactical waypoint

        public SwarmDroneAgent(string id, Vector3D startPos, DroneType type)
        {
            AgentID = id;
            Position = startPos;
            Velocity = Vector3D.Zero;
            Acceleration = Vector3D.Zero;
            Type = type;
            State = DroneState.IngressTerrainMasked;
            IsActive = true;

            // Adjust physical specs based on drone operational profile
            switch (type)
            {
                case DroneType.KineticStrikerFPV:
                    MaxSpeed = 45.0f;
                    MaxForce = 35.0f;
                    Mass = 1.8f;
                    break;
                case DroneType.ISRReconnaissance:
                    MaxSpeed = 25.0f;
                    MaxForce = 15.0f;
                    Mass = 4.5f;
                    break;
                case DroneType.DecoyChaffSwarm:
                    MaxSpeed = 38.0f;
                    MaxForce = 30.0f;
                    Mass = 0.9f;
                    break;
                case DroneType.EWEmitterJammer:
                    MaxSpeed = 20.0f;
                    MaxForce = 12.0f;
                    Mass = 6.0f;
                    break;
            }
        }
    }

    /// <summary>
    /// Near O(N) Swarm Flocking Engine using Spatial Partitioning.
    /// Computes Separation, Alignment, Cohesion, and Tactical Goal Attraction.
    /// </summary>
    public class SwarmFlockingSystem
    {
        private readonly SpatialPartitionGrid<SwarmDroneAgent> _spatialGrid;
        private readonly List<SwarmDroneAgent> _neighborBuffer;

        // Flocking Weights
        public float SeparationWeight { get; set; } = 2.8f;
        public float AlignmentWeight { get; set; } = 1.2f;
        public float CohesionWeight { get; set; } = 1.0f;
        public float ObjectiveWeight { get; set; } = 2.5f;
        public float TerrainAvoidanceWeight { get; set; } = 4.0f;

        // Perception Radii
        public float SeparationRadius { get; set; } = 8.0f;  // meters
        public float PerceptionRadius { get; set; } = 25.0f; // meters
        public float MinimumFlightAltitude { get; set; } = 10.0f; // meters AGL

        public SwarmFlockingSystem(float gridCellSize = 30.0f)
        {
            _spatialGrid = new SpatialPartitionGrid<SwarmDroneAgent>(gridCellSize);
            _neighborBuffer = new List<SwarmDroneAgent>(64);
        }

        /// <summary>
        /// Executes the master near-O(N) swarm update loop for all active agents.
        /// </summary>
        public void UpdateSwarmDynamics(List<SwarmDroneAgent> swarmAgents, float deltaTime, Func<Vector3D, float> terrainElevationFunc)
        {
            if (swarmAgents == null || swarmAgents.Count == 0 || deltaTime <= 0.0001f) return;

            // Step 1: Re-build Spatial Partition Grid - O(N)
            _spatialGrid.Clear();
            int agentCount = swarmAgents.Count;
            for (int i = 0; i < agentCount; i++)
            {
                if (swarmAgents[i].IsActive)
                {
                    _spatialGrid.Insert(swarmAgents[i]);
                }
            }

            // Step 2: Compute flocking forces using Spatial Grid local neighbor queries - Near O(N)
            for (int i = 0; i < agentCount; i++)
            {
                SwarmDroneAgent agent = swarmAgents[i];
                if (!agent.IsActive || agent.State == DroneState.Neutralized) continue;

                // Query neighbors strictly inside PerceptionRadius cell region
                _spatialGrid.QueryNeighbors(agent, PerceptionRadius, _neighborBuffer);

                Vector3D sepForce = ComputeSeparation(agent, _neighborBuffer);
                Vector3D alignForce = ComputeAlignment(agent, _neighborBuffer);
                Vector3D cohForce = ComputeCohesion(agent, _neighborBuffer);
                Vector3D objForce = ComputeObjectiveSteering(agent);
                Vector3D terrainForce = ComputeTerrainAvoidance(agent, terrainElevationFunc);

                // Aggregate weighted steering forces
                Vector3D netSteering = (sepForce * SeparationWeight) +
                                       (alignForce * AlignmentWeight) +
                                       (cohForce * CohesionWeight) +
                                       (objForce * ObjectiveWeight) +
                                       (terrainForce * TerrainAvoidanceWeight);

                netSteering = Vector3D.ClampMagnitude(netSteering, agent.MaxForce);

                // Physics integration (Euler / Verlet blend)
                agent.Acceleration = netSteering / agent.Mass;
                agent.Velocity += agent.Acceleration * deltaTime;
                agent.Velocity = Vector3D.ClampMagnitude(agent.Velocity, agent.MaxSpeed);
                agent.Position += agent.Velocity * deltaTime;

                // Terrain collision safety floor check
                float currentGround = terrainElevationFunc?.Invoke(agent.Position) ?? 0f;
                if (agent.Position.y < currentGround + MinimumFlightAltitude)
                {
                    agent.Position = new Vector3D(agent.Position.x, currentGround + MinimumFlightAltitude, agent.Position.z);
                    if (agent.Velocity.y < 0) agent.Velocity = new Vector3D(agent.Velocity.x, 0f, agent.Velocity.z);
                }
            }
        }

        private Vector3D ComputeSeparation(SwarmDroneAgent agent, List<SwarmDroneAgent> neighbors)
        {
            Vector3D steering = Vector3D.Zero;
            int count = 0;
            int n = neighbors.Count;

            for (int i = 0; i < n; i++)
            {
                SwarmDroneAgent other = neighbors[i];
                float distSqr = Vector3D.SqrDistance(agent.Position, other.Position);
                if (distSqr > 0.0001f && distSqr < SeparationRadius * SeparationRadius)
                {
                    float dist = (float)Math.Sqrt(distSqr);
                    Vector3D diff = (agent.Position - other.Position).Normalized;
                    steering += diff / dist; // Weight inversely proportional to distance
                    count++;
                }
            }

            if (count > 0)
            {
                steering /= count;
                if (steering.SqrMagnitude > 0.0001f)
                {
                    steering = steering.Normalized * agent.MaxSpeed - agent.Velocity;
                }
            }
            return steering;
        }

        private Vector3D ComputeAlignment(SwarmDroneAgent agent, List<SwarmDroneAgent> neighbors)
        {
            Vector3D avgVelocity = Vector3D.Zero;
            int count = 0;
            int n = neighbors.Count;

            for (int i = 0; i < n; i++)
            {
                avgVelocity += neighbors[i].Velocity;
                count++;
            }

            if (count > 0)
            {
                avgVelocity /= count;
                Vector3D desired = avgVelocity.Normalized * agent.MaxSpeed;
                return desired - agent.Velocity;
            }
            return Vector3D.Zero;
        }

        private Vector3D ComputeCohesion(SwarmDroneAgent agent, List<SwarmDroneAgent> neighbors)
        {
            Vector3D centerOfMass = Vector3D.Zero;
            int count = 0;
            int n = neighbors.Count;

            for (int i = 0; i < n; i++)
            {
                centerOfMass += neighbors[i].Position;
                count++;
            }

            if (count > 0)
            {
                centerOfMass /= count;
                Vector3D desired = (centerOfMass - agent.Position).Normalized * agent.MaxSpeed;
                return desired - agent.Velocity;
            }
            return Vector3D.Zero;
        }

        private Vector3D ComputeObjectiveSteering(SwarmDroneAgent agent)
        {
            if (agent.TargetObjective.Equals(Vector3D.Zero)) return Vector3D.Zero;

            Vector3D desired = (agent.TargetObjective - agent.Position).Normalized * agent.MaxSpeed;
            return desired - agent.Velocity;
        }

        private Vector3D ComputeTerrainAvoidance(SwarmDroneAgent agent, Func<Vector3D, float> terrainElevationFunc)
        {
            if (terrainElevationFunc == null) return Vector3D.Zero;

            float groundHeight = terrainElevationFunc(agent.Position);
            float currentAltitude = agent.Position.y - groundHeight;

            if (currentAltitude < MinimumFlightAltitude * 2.0f)
            {
                float urgency = (MinimumFlightAltitude * 2.0f - currentAltitude) / (MinimumFlightAltitude * 2.0f);
                return Vector3D.Up * (agent.MaxForce * urgency);
            }
            return Vector3D.Zero;
        }
    }
}
