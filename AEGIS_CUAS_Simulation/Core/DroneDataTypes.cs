// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Core/DroneDataTypes.cs
// ARCHITECTURE: Defense Simulation Engine Core Data Structures
// ============================================================================

using System;

namespace Aegis.CUAS.Simulation.Core
{
    /// <summary>
    /// Represents the tactical classification of a drone unit in the simulation.
    /// </summary>
    public enum DroneType
    {
        KineticStrikerFPV, // Armed high-speed explosive payload FPV drone
        ISRReconnaissance, // High-altitude optical/thermal recon unit
        DecoyChaffSwarm,   // Non-lethal electronic decoy / radar clutter drone
        EWEmitterJammer    // Active radio frequency jamming asset
    }

    /// <summary>
    /// Current lifecycle state of a drone within the AI Director state machine.
    /// </summary>
    public enum DroneState
    {
        Staging,
        IngressTerrainMasked,
        SaturationDivergence,
        TerminalStrike,
        Neutralized,
        Retreating
    }

    /// <summary>
    /// Environmental weather conditions affecting sensors and RF propagation.
    /// </summary>
    public enum WeatherCondition
    {
        ClearDay,
        HeavyFog,
        TorrentialRain,
        NightMist,
        DustStorm
    }

    /// <summary>
    /// Sensor spectrum classification.
    /// </summary>
    public enum SensorType
    {
        ElectroOptical, // EO Camera
        InfraredThermal, // IR Thermal Camera
        AcousticArray,   // Acoustic Microphone Array
        RadarRF          // Active/Passive RF Radar
    }

    /// <summary>
    /// Standard 3D Vector structure optimized for simulation math without UnityEngine dependency.
    /// </summary>
    [Serializable]
    public struct Vector3D
    {
        public float x;
        public float y;
        public float z;

        public Vector3D(float x, float y, float z)
        {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public static Vector3D Zero => new Vector3D(0f, 0f, 0f);
        public static Vector3D Up => new Vector3D(0f, 1f, 0f);

        public float Magnitude => (float)Math.Sqrt(x * x + y * y + z * z);
        public float SqrMagnitude => x * x + y * y + z * z;

        public Vector3D Normalized
        {
            get
            {
                float mag = Magnitude;
                return mag > 0.00001f ? new Vector3D(x / mag, y / mag, z / mag) : Zero;
            }
        }

        public static Vector3D operator +(Vector3D a, Vector3D b) => new Vector3D(a.x + b.x, a.y + b.y, a.z + b.z);
        public static Vector3D operator -(Vector3D a, Vector3D b) => new Vector3D(a.x - b.x, a.y - b.y, a.z - b.z);
        public static Vector3D operator *(Vector3D a, float scalar) => new Vector3D(a.x * scalar, a.y * scalar, a.z * scalar);
        public static Vector3D operator /(Vector3D a, float scalar) => new Vector3D(a.x / scalar, a.y / scalar, a.z / scalar);

        public static float Dot(Vector3D a, Vector3D b) => a.x * b.x + a.y * b.y + a.z * b.z;
        public static float Distance(Vector3D a, Vector3D b) => (a - b).Magnitude;
        public static float SqrDistance(Vector3D a, Vector3D b) => (a - b).SqrMagnitude;

        public static Vector3D ClampMagnitude(Vector3D vector, float maxLength)
        {
            float sqrMag = vector.SqrMagnitude;
            if (sqrMag > maxLength * maxLength)
            {
                float mag = (float)Math.Sqrt(sqrMag);
                return new Vector3D((vector.x / mag) * maxLength, (vector.y / mag) * maxLength, (vector.z / mag) * maxLength);
            }
            return vector;
        }

        public override string ToString() => $"({x:F2}, {y:F2}, {z:F2})";
    }

    /// <summary>
    /// Discrete integer 3D grid cell coordinate for spatial partitioning.
    /// </summary>
    public struct CellCoord : IEquatable<CellCoord>
    {
        public int x;
        public int y;
        public int z;

        public CellCoord(int x, int y, int z)
        {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public bool Equals(CellCoord other) => x == other.x && y == other.y && z == other.z;
        public override bool Equals(object obj) => obj is CellCoord other && Equals(other);
        public override int GetHashCode() => HashCode.Combine(x, y, z);
    }

    /// <summary>
    /// Multi-spectral observation package returned by the Sensor Fusion Matrix.
    /// </summary>
    public class SensorObservation
    {
        public string TrackID { get; set; }
        public Vector3D FusedPosition { get; set; }
        public Vector3D FusedVelocity { get; set; }
        public float Confidence { get; set; }
        public float ThermalSignature { get; set; } // Watts/sr
        public float AcousticDecibels { get; set; }  // dB
        public float RadarRCS { get; set; }          // m^2
        public bool IsFalsePositive { get; set; }
        public bool IsSpoofedGNSS { get; set; }
        public double Timestamp { get; set; }
    }

    /// <summary>
    /// Metric event package written to telemetry buffers and SQLite DB.
    /// </summary>
    public class TelemetryEvent
    {
        public string SessionID { get; set; }
        public double Timestamp { get; set; }
        public string EventType { get; set; }
        public string DroneID { get; set; }
        public Vector3D Position { get; set; }
        public Vector3D Velocity { get; set; }
        public float ThreatScore { get; set; }
        public string UserTargetID { get; set; }
        public bool HitSuccess { get; set; }
        public string PayloadJSON { get; set; }
    }

    /// <summary>
    /// User engagement log entry for triage evaluation.
    /// </summary>
    public class EngagementRecord
    {
        public string EngagementID { get; set; }
        public string OperatorID { get; set; }
        public string TargetDroneID { get; set; }
        public DroneType TargetType { get; set; }
        public double EngagementTimestamp { get; set; }
        public double DetectionTimestamp { get; set; }
        public float CalculatedThreatScore { get; set; }
        public bool WasHighThreatLead { get; set; }
        public bool WasNonLethalDecoy { get; set; }
        public bool Neutralized { get; set; }
    }
}
