// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Gap2_Sensors/SensorFusionMatrix.cs
// CAPABILITY GAP 2: Dynamic Multi-Spectral Sensor Friction & GNSS Spoofing
// ============================================================================

using System;
using System.Collections.Generic;
using Aegis.CUAS.Simulation.Core;
using Aegis.CUAS.Simulation.Swarm;

namespace Aegis.CUAS.Simulation.Sensors
{
    /// <summary>
    /// Multi-Spectral Sensor Fusion Matrix.
    /// Aggregates Optical, Thermal, Acoustic, and RF data streams, injects
    /// state-dependent physical noise, applies GNSS spoofing coordinate offsets,
    /// and generates stochastic false-positives based on environmental friction.
    /// </summary>
    public class SensorFusionMatrix
    {
        private readonly Random _random = new Random(42);
        private readonly RFAttenuationEngine _rfEngine;

        public WeatherCondition CurrentWeather { get; set; } = WeatherCondition.ClearDay;
        public float AmbientTemperatureCelsius { get; set; } = 22.0f;
        public float WindSpeedMPS { get; set; } = 6.5f;

        public SensorFusionMatrix(RFAttenuationEngine rfEngine)
        {
            _rfEngine = rfEngine ?? new RFAttenuationEngine();
        }

        /// <summary>
        /// Processes true drone agents into sensor observations with injected environmental friction.
        /// </summary>
        public List<SensorObservation> ProcessFusedObservations(
            List<SwarmDroneAgent> activeSwarm,
            EWEmitterJammer activeJammer,
            Vector3D sensorStationPos,
            double currentTimeSec,
            Func<Vector3D, float> terrainElevationFunc)
        {
            var observations = new List<SensorObservation>();
            if (activeSwarm == null) return observations;

            // 1. Process True Drones through multi-spectral pipeline
            int count = activeSwarm.Count;
            for (int i = 0; i < count; i++)
            {
                SwarmDroneAgent drone = activeSwarm[i];
                if (!drone.IsActive || drone.State == DroneState.Neutralized) continue;

                float dist = Vector3D.Distance(sensorStationPos, drone.Position);

                // Check Line of Sight
                var (isMasked, diffractionLoss) = _rfEngine.EvaluateTerrainLOS(sensorStationPos, drone.Position, terrainElevationFunc);
                if (isMasked && dist > 150.0f) continue; // Complete terrain masking cutout

                // Compute Spectrum-Specific Signatures
                float eoVisibility = ComputeEOVisibilityFactor(dist);
                float irThermalSig = ComputeThermalSignature(drone, dist);
                float acousticDB = ComputeAcousticSignature(drone, dist);

                // Determine if detected by at least one sensor modality
                bool detectedEO = eoVisibility > 0.25f && _random.NextDouble() < eoVisibility;
                bool detectedIR = irThermalSig > 12.0f && _random.NextDouble() < (irThermalSig / 100.0f);
                bool detectedAcoustic = acousticDB > 45.0f && _random.NextDouble() < (acousticDB / 90.0f);

                if (!detectedEO && !detectedIR && !detectedAcoustic) continue; // Sensor failure to detect

                // Compute GNSS Spoofing Coordinate Offsets
                Vector3D reportedPos = drone.Position;
                bool isSpoofed = false;
                if (activeJammer != null && activeJammer.IsActive)
                {
                    float sjnr = _rfEngine.CalculateSJNR(drone.TargetObjective, 10.0f, drone.Position, activeJammer, terrainElevationFunc);
                    if (sjnr < 3.0f) // GNSS lock degraded / spoofed
                    {
                        isSpoofed = true;
                        float spoofDist = Vector3D.Distance(activeJammer.Position, drone.Position);
                        float offsetMagnitude = Math.Min(120.0f, 15.0f + (1000.0f / Math.Max(10.0f, spoofDist)) * 25.0f);

                        // Stochastic coordinate drift vector
                        Vector3D drift = new Vector3D(
                            (float)(_random.NextDouble() * 2 - 1) * offsetMagnitude,
                            (float)(_random.NextDouble() * 2 - 1) * (offsetMagnitude * 0.2f),
                            (float)(_random.NextDouble() * 2 - 1) * offsetMagnitude
                        );
                        reportedPos += drift;
                    }
                }

                // Inject Gaussian noise into fused position measurement based on range
                float noiseStdDev = Math.Max(0.5f, dist * 0.008f);
                Vector3D noisyPos = reportedPos + new Vector3D(
                    SampleGaussian(0f, noiseStdDev),
                    SampleGaussian(0f, noiseStdDev * 0.5f),
                    SampleGaussian(0f, noiseStdDev)
                );

                // Compute Weighted Fused Confidence
                float fusedConfidence = Math.Min(0.99f, (eoVisibility * 0.4f) + (Math.Min(100f, irThermalSig) / 100f * 0.35f) + (Math.Min(90f, acousticDB) / 90f * 0.25f));

                observations.Add(new SensorObservation
                {
                    TrackID = drone.AgentID,
                    FusedPosition = noisyPos,
                    FusedVelocity = drone.Velocity + new Vector3D(SampleGaussian(0, 0.5f), 0, SampleGaussian(0, 0.5f)),
                    Confidence = fusedConfidence,
                    ThermalSignature = irThermalSig,
                    AcousticDecibels = acousticDB,
                    RadarRCS = drone.Type == DroneType.DecoyChaffSwarm ? 2.5f : 0.05f, // Chaff has huge RCS spike
                    IsFalsePositive = false,
                    IsSpoofedGNSS = isSpoofed,
                    Timestamp = currentTimeSec
                });
            }

            // 2. Generate Stochastic False Positives (Weather/Lighting Friction)
            GenerateStochasticFalsePositives(observations, sensorStationPos, currentTimeSec);

            return observations;
        }

        private float ComputeEOVisibilityFactor(float distance)
        {
            float weatherPenalty = CurrentWeather switch
            {
                WeatherCondition.ClearDay => 1.0f,
                WeatherCondition.NightMist => 0.3f,
                WeatherCondition.HeavyFog => 0.15f,
                WeatherCondition.TorrentialRain => 0.25f,
                WeatherCondition.DustStorm => 0.10f,
                _ => 1.0f
            };

            // Range decay curve: 1.0 at 0m, decaying to 0 at ~1500m
            float maxEORange = 1500.0f * weatherPenalty;
            if (distance >= maxEORange) return 0f;
            return 1.0f - (distance / maxEORange);
        }

        private float ComputeThermalSignature(SwarmDroneAgent drone, float distance)
        {
            // Base motor heat (Watts/sr) proportional to speed & payload mass
            float motorHeat = 30.0f + (drone.Velocity.Magnitude * 2.5f) + (drone.Mass * 5.0f);
            float tempDelta = Math.Max(1.0f, 45.0f - AmbientTemperatureCelsius);

            // Thermal attenuation over distance (Beer-Lambert atmospheric absorption)
            float attenuationCoeff = CurrentWeather == WeatherCondition.HeavyFog ? 0.0015f : 0.0004f;
            float receivedHeat = (motorHeat * tempDelta) * (float)Math.Exp(-attenuationCoeff * distance);

            return receivedHeat;
        }

        private float ComputeAcousticSignature(SwarmDroneAgent drone, float distance)
        {
            // Rotor noise SPL at 1m (~85 dB for FPV quad)
            float spl1m = 85.0f + (drone.Velocity.Magnitude * 0.4f);

            // Inverse square law decay + atmospheric absorption + wind noise mask
            if (distance <= 1.0f) distance = 1.0f;
            float distanceLoss = 20.0f * (float)Math.Log10(distance);
            float windMasking = WindSpeedMPS * 1.2f;

            float receivedDB = spl1m - distanceLoss - windMasking;
            return Math.Max(0f, receivedDB);
        }

        private void GenerateStochasticFalsePositives(List<SensorObservation> observations, Vector3D sensorPos, double timestamp)
        {
            // False positive probability scales with severe weather (Rain/Dust/Fog)
            float falsePositiveRate = CurrentWeather switch
            {
                WeatherCondition.TorrentialRain => 0.35f,
                WeatherCondition.DustStorm => 0.50f,
                WeatherCondition.HeavyFog => 0.20f,
                _ => 0.05f
            };

            if (_random.NextDouble() < falsePositiveRate)
            {
                int ghostCount = _random.Next(1, 4);
                for (int g = 0; g < ghostCount; g++)
                {
                    float angle = (float)(_random.NextDouble() * Math.PI * 2);
                    float range = (float)(100 + _random.NextDouble() * 600);

                    Vector3D ghostPos = sensorPos + new Vector3D(
                        (float)Math.Cos(angle) * range,
                        (float)(30 + _random.NextDouble() * 50),
                        (float)Math.Sin(angle) * range
                    );

                    observations.Add(new SensorObservation
                    {
                        TrackID = $"GHOST-FP-{_random.Next(1000, 9999)}",
                        FusedPosition = ghostPos,
                        FusedVelocity = new Vector3D((float)(_random.NextDouble() * 10 - 5), 0, (float)(_random.NextDouble() * 10 - 5)),
                        Confidence = (float)(0.30 + _random.NextDouble() * 0.35),
                        ThermalSignature = 15.0f,
                        AcousticDecibels = 35.0f,
                        RadarRCS = 0.8f, // Birds or rain clutter RCS
                        IsFalsePositive = true,
                        IsSpoofedGNSS = false,
                        Timestamp = timestamp
                    });
                }
            }
        }

        private float SampleGaussian(float mean, float stdDev)
        {
            double u1 = 1.0 - _random.NextDouble();
            double u2 = 1.0 - _random.NextDouble();
            double randStdNormal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);
            return mean + stdDev * (float)randStdNormal;
        }
    }
}
