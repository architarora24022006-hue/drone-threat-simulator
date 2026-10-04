// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Gap4_AIDirector/TacticalPathGenerator.cs
// CAPABILITY GAP 4: Doctrinal Procedural Trajectory Generation Engine
// ============================================================================

using System;
using System.Collections.Generic;
using Aegis.CUAS.Simulation.Core;
using Aegis.CUAS.Simulation.Swarm;

namespace Aegis.CUAS.Simulation.AIDirector
{
    /// <summary>
    /// Military Adversarial Tactical Doctrine types.
    /// </summary>
    public enum AdversarialDoctrine
    {
        HighLowSplit,          // High ISR recon lures air defense while low FPV strikes in radar shadow
        DecoySaturationScreen, // Decoys lead in front screen; kinetic strikers follow in terrain masked dead zones
        PincherFlankingStrike  // Multi-axis convergent attack from 30 deg and 330 deg azimuths
    }

    /// <summary>
    /// Procedural Trajectory Generator enforcing military adversarial doctrines
    /// and terrain-masked contour waypoint paths.
    /// </summary>
    public class TacticalPathGenerator
    {
        private readonly Random _random = new Random(1337);

        /// <summary>
        /// Generates a set of procedural tactical waypoints for a drone based on military doctrine and terrain contours.
        /// </summary>
        public List<Vector3D> GenerateTacticalWaypoints(
            SwarmDroneAgent drone,
            Vector3D startPosition,
            Vector3D hvaTargetPos,
            AdversarialDoctrine doctrine,
            Func<Vector3D, float> terrainElevationFunc)
        {
            var waypoints = new List<Vector3D>();
            waypoints.Add(startPosition);

            Vector3D totalVector = hvaTargetPos - startPosition;
            float totalDistance = totalVector.Magnitude;
            Vector3D mainHeading = totalVector.Normalized;

            int segmentCount = 4;

            for (int i = 1; i <= segmentCount; i++)
            {
                float progress = (float)i / segmentCount;
                Vector3D linearPoint = startPosition + mainHeading * (totalDistance * progress);

                // Calculate doctrine lateral offset
                float lateralOffset = 0f;
                float verticalOffset = 25.0f; // Low altitude AGL target

                switch (doctrine)
                {
                    case AdversarialDoctrine.HighLowSplit:
                        if (drone.Type == DroneType.ISRReconnaissance)
                        {
                            verticalOffset = 200.0f; // High ISR altitude
                            lateralOffset = (float)(Math.Sin(progress * Math.PI) * 150.0f);
                        }
                        else
                        {
                            verticalOffset = 15.0f;  // Low kinetic strike altitude
                            lateralOffset = -(float)(Math.Sin(progress * Math.PI) * 100.0f);
                        }
                        break;

                    case AdversarialDoctrine.DecoySaturationScreen:
                        if (drone.Type == DroneType.DecoyChaffSwarm)
                        {
                            // Decoys fly 80m ahead and spread wide to draw fire
                            linearPoint += mainHeading * 80.0f;
                            lateralOffset = (float)(_random.NextDouble() * 300.0 - 150.0);
                            verticalOffset = 40.0f;
                        }
                        else
                        {
                            // Kinetic strikers stay low in terrain shadow behind decoy screen
                            verticalOffset = 12.0f;
                            lateralOffset = (float)(Math.Sin(progress * Math.PI * 2.0) * 40.0f);
                        }
                        break;

                    case AdversarialDoctrine.PincherFlankingStrike:
                        float flankSign = (drone.AgentID.GetHashCode() % 2 == 0) ? 1.0f : -1.0f;
                        lateralOffset = flankSign * (float)(Math.Sin(progress * Math.PI) * (totalDistance * 0.35f));
                        verticalOffset = 20.0f;
                        break;
                }

                // Perpendicular lateral vector
                Vector3D perpVector = new Vector3D(-mainHeading.z, 0f, mainHeading.x).Normalized;
                Vector3D targetPosCandidate = linearPoint + perpVector * lateralOffset;

                // Contour terrain altitude adaptation
                float groundHeight = terrainElevationFunc?.Invoke(targetPosCandidate) ?? 0f;
                targetPosCandidate.y = groundHeight + verticalOffset;

                waypoints.Add(targetPosCandidate);
            }

            waypoints.Add(hvaTargetPos); // Final terminal strike target
            return waypoints;
        }
    }
}
