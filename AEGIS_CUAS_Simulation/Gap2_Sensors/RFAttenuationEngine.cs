// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Gap2_Sensors/RFAttenuationEngine.cs
// CAPABILITY GAP 2: Dynamic RF Propagation & Signal Attenuation Engine
// ============================================================================

using System;
using Aegis.CUAS.Simulation.Core;

namespace Aegis.CUAS.Simulation.Sensors
{
    /// <summary>
    /// Directional Jammer Emitter Configuration.
    /// </summary>
    public class EWEmitterJammer
    {
        public string EmitterID { get; set; }
        public Vector3D Position { get; set; }
        public Vector3D AimDirection { get; set; }  // Normalized pointing vector
        public float PowerOutputWatts { get; set; } = 100.0f; // 50W - 500W C-UAS directional jammer
        public float FrequencyMHz { get; set; } = 2400.0f;   // 2.4 GHz ISM / Control band
        public float AntennaGainMaxDBi { get; set; } = 18.0f; // High-gain directional horn antenna
        public float BeamWidthDegrees { get; set; } = 30.0f;  // Half-power beam width
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Mathematical Signal Attenuation & RF Propagation Engine.
    /// Computes Free Space Path Loss (FSPL), directional antenna gain patterns,
    /// Line-Of-Sight (LOS) terrain masking, and Signal-to-Jamming-plus-Noise Ratios (SJNR).
    /// </summary>
    public class RFAttenuationEngine
    {
        private const float SpeedOfLight = 3e8f; // m/s
        private const float ThermalNoiseFloorDBm = -110.0f; // dBm standard receiver floor

        /// <summary>
        /// Calculates Free Space Path Loss (FSPL) in decibels (dB).
        /// FSPL = 20*log10(d_km) + 20*log10(f_MHz) + 32.44
        /// </summary>
        public float CalculateFSPL(float distanceMeters, float frequencyMHz)
        {
            if (distanceMeters <= 1.0f) distanceMeters = 1.0f;
            float distanceKm = distanceMeters / 1000.0f;

            float fspl = 20.0f * (float)Math.Log10(distanceKm) +
                         20.0f * (float)Math.Log10(frequencyMHz) +
                         32.44f;
            return Math.Max(0f, fspl);
        }

        /// <summary>
        /// Calculates directional antenna gain (dBi) using the dot product between
        /// the jammer pointing vector and the direction to the target drone.
        /// Uses a cosine power radiation pattern model G(theta) = G_max * max(0, cos(theta))^p
        /// </summary>
        public float CalculateDirectionalGain(EWEmitterJammer jammer, Vector3D targetPos)
        {
            Vector3D dirToTarget = (targetPos - jammer.Position).Normalized;
            Vector3D jammerDir = jammer.AimDirection.Normalized;

            float dotProduct = Vector3D.Dot(jammerDir, dirToTarget);
            if (dotProduct <= 0f) return -30.0f; // Rear sidelobe attenuation floor

            // Calculate exponent p based on 3dB beamwidth
            float halfBeamRad = (jammer.BeamWidthDegrees * 0.5f) * (float)Math.PI / 180.0f;
            float p = (float)(-0.30103 / Math.Log10(Math.Cos(halfBeamRad)));

            float patternFactor = (float)Math.Pow(dotProduct, p);
            float gainLinear = (float)Math.Pow(10.0, jammer.AntennaGainMaxDBi / 10.0) * patternFactor;

            return (float)(10.0 * Math.Log10(Math.Max(0.00001, gainLinear)));
        }

        /// <summary>
        /// Performs raycast terrain elevation masking evaluation between emitter and drone target.
        /// Returns line-of-sight obstruction flag and extra diffraction loss in dB.
        /// </summary>
        public (bool isObstructed, float diffractionLossDB) EvaluateTerrainLOS(
            Vector3D sourcePos,
            Vector3D targetPos,
            Func<Vector3D, float> terrainElevationFunc,
            int sampleSteps = 20)
        {
            if (terrainElevationFunc == null) return (false, 0f);

            float totalDistance = Vector3D.Distance(sourcePos, targetPos);
            if (totalDistance < 5.0f) return (false, 0f);

            float maxHeightDeficit = 0f;
            bool isObstructed = false;

            for (int i = 1; i < sampleSteps; i++)
            {
                float t = (float)i / sampleSteps;
                Vector3D samplePoint = sourcePos + (targetPos - sourcePos) * t;
                float groundElevation = terrainElevationFunc(samplePoint);

                if (samplePoint.y < groundElevation)
                {
                    isObstructed = true;
                    float deficit = groundElevation - samplePoint.y;
                    if (deficit > maxHeightDeficit) maxHeightDeficit = deficit;
                }
            }

            // Knife-edge diffraction attenuation approximation if terrain obstructs ray path
            float diffractionLossDB = isObstructed ? Math.Min(40.0f, 15.0f + maxHeightDeficit * 0.8f) : 0f;
            return (isObstructed, diffractionLossDB);
        }

        /// <summary>
        /// Computes the net received Signal-to-Jamming-plus-Noise Ratio (SJNR) in dB at the target drone receiver.
        /// If SJNR drops below 0 dB, control link lock is severed (link denial).
        /// </summary>
        public float CalculateSJNR(
            Vector3D transmitterPos,
            float txPowerWatts,
            Vector3D targetDronePos,
            EWEmitterJammer activeJammer,
            Func<Vector3D, float> terrainElevationFunc)
        {
            // 1. Calculate desired control signal power at drone receiver
            float distSignal = Vector3D.Distance(transmitterPos, targetDronePos);
            float fsplSignal = CalculateFSPL(distSignal, activeJammer.FrequencyMHz);
            var (sigObstructed, sigDiffraction) = EvaluateTerrainLOS(transmitterPos, targetDronePos, terrainElevationFunc);

            float txPowerDBm = 10.0f * (float)Math.Log10(txPowerWatts * 1000.0f);
            float rxSignalDBm = txPowerDBm - fsplSignal - sigDiffraction;

            // 2. Calculate jamming signal power at drone receiver
            float distJammer = Vector3D.Distance(activeJammer.Position, targetDronePos);
            float fsplJammer = CalculateFSPL(distJammer, activeJammer.FrequencyMHz);
            float jammerGainDBi = CalculateDirectionalGain(activeJammer, targetDronePos);
            var (jamObstructed, jamDiffraction) = EvaluateTerrainLOS(activeJammer.Position, targetDronePos, terrainElevationFunc);

            float jammerTxDBm = 10.0f * (float)Math.Log10(activeJammer.PowerOutputWatts * 1000.0f);
            float rxJammerDBm = jammerTxDBm + jammerGainDBi - fsplJammer - jamDiffraction;

            // 3. Compute SJNR in dB
            // Signal (mW) / (Jammer (mW) + Noise (mW))
            double sigMW = Math.Pow(10.0, rxSignalDBm / 10.0);
            double jamMW = Math.Pow(10.0, rxJammerDBm / 10.0);
            double noiseMW = Math.Pow(10.0, ThermalNoiseFloorDBm / 10.0);

            double sjnrLinear = sigMW / (jamMW + noiseMW);
            return (float)(10.0 * Math.Log10(Math.Max(1e-12, sjnrLinear)));
        }
    }
}
