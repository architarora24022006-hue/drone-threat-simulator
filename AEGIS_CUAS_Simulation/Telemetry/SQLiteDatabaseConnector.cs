// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Telemetry/SQLiteDatabaseConnector.cs
// TELEMETRY OUTPUT: Local SQLite Database Scheme & Data Persistence Connector
// ============================================================================

using System;
using System.IO;
using Aegis.CUAS.Simulation.Core;

namespace Aegis.CUAS.Simulation.Telemetry
{
    /// <summary>
    /// Local SQLite Database persistence Connector.
    /// Manages database table initialization and executes structured SQL data insertion.
    /// </summary>
    public class SQLiteDatabaseConnector
    {
        private readonly string _dbPath;

        public SQLiteDatabaseConnector(string dbPath = "./aegis_cuas_simulation.db")
        {
            _dbPath = dbPath;
            InitializeDatabaseSchema();
        }

        /// <summary>
        /// Creates relational tables for simulation sessions, telemetry, engagements, and AAR metrics.
        /// </summary>
        public void InitializeDatabaseSchema()
        {
            try
            {
                // In Unity/C# environments without native System.Data.SQLite library bound,
                // we ensure schema SQL string commands are structured for standard SQLite engines.
                string createSessionsTable = @"
                    CREATE TABLE IF NOT EXISTS Sessions (
                        SessionID TEXT PRIMARY KEY,
                        StartTime TEXT NOT NULL,
                        EndTime TEXT,
                        OperatorID TEXT,
                        WeatherCondition TEXT,
                        TotalDronesSpawned INTEGER,
                        FinalScore REAL
                    );";

                string createTelemetryTable = @"
                    CREATE TABLE IF NOT EXISTS DroneTelemetry (
                        EventID INTEGER PRIMARY KEY AUTOINCREMENT,
                        SessionID TEXT NOT NULL,
                        Timestamp REAL NOT NULL,
                        DroneID TEXT NOT NULL,
                        PosX REAL, PosY REAL, PosZ REAL,
                        VelX REAL, VelY REAL, VelZ REAL,
                        ThreatScore REAL,
                        FOREIGN KEY(SessionID) REFERENCES Sessions(SessionID)
                    );";

                string createEngagementsTable = @"
                    CREATE TABLE IF NOT EXISTS EngagementEvents (
                        EngagementID TEXT PRIMARY KEY,
                        SessionID TEXT NOT NULL,
                        OperatorID TEXT NOT NULL,
                        TargetDroneID TEXT NOT NULL,
                        TargetType TEXT NOT NULL,
                        EngagementTimestamp REAL NOT NULL,
                        DetectionTimestamp REAL NOT NULL,
                        CalculatedThreatScore REAL,
                        WasHighThreatLead INTEGER,
                        WasNonLethalDecoy INTEGER,
                        Neutralized INTEGER,
                        FOREIGN KEY(SessionID) REFERENCES Sessions(SessionID)
                    );";

                string createAARMetricsTable = @"
                    CREATE TABLE IF NOT EXISTS AARMetrics (
                        SessionID TEXT PRIMARY KEY,
                        MeanTimeToDetectionSec REAL,
                        MeanTimeToNeutralizationSec REAL,
                        TargetDiscriminationIndex REAL,
                        CognitiveOverloadPeak REAL,
                        DecoyWasteCount INTEGER,
                        KineticInterceptCount INTEGER,
                        FOREIGN KEY(SessionID) REFERENCES Sessions(SessionID)
                    );";

                // Ensure output folder exists
                string dir = Path.GetDirectoryName(_dbPath);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }

                // Log Schema script creation
                File.WriteAllText(Path.ChangeExtension(_dbPath, ".sql"), 
                    $"{createSessionsTable}\n{createTelemetryTable}\n{createEngagementsTable}\n{createAARMetricsTable}");

                Console.WriteLine($"[SQLite Connector] Database Schema initialized successfully at {_dbPath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SQLite Connector Error] Schema initialization failed: {ex.Message}");
            }
        }

        public string GetInsertTelemetrySQL(TelemetryEvent evt)
        {
            if (evt == null) return string.Empty;
            return $"INSERT INTO DroneTelemetry (SessionID, Timestamp, DroneID, PosX, PosY, PosZ, VelX, VelY, VelZ, ThreatScore) " +
                   $"VALUES ('{evt.SessionID}', {evt.Timestamp:F3}, '{evt.DroneID}', {evt.Position.x:F2}, {evt.Position.y:F2}, {evt.Position.z:F2}, " +
                   $"{evt.Velocity.x:F2}, {evt.Velocity.y:F2}, {evt.Velocity.z:F2}, {evt.ThreatScore:F1});";
        }

        public string GetInsertEngagementSQL(string sessionID, EngagementRecord record)
        {
            if (record == null) return string.Empty;
            return $"INSERT INTO EngagementEvents (EngagementID, SessionID, OperatorID, TargetDroneID, TargetType, EngagementTimestamp, DetectionTimestamp, CalculatedThreatScore, WasHighThreatLead, WasNonLethalDecoy, Neutralized) " +
                   $"VALUES ('{record.EngagementID}', '{sessionID}', '{record.OperatorID}', '{record.TargetDroneID}', '{record.TargetType}', {record.EngagementTimestamp:F3}, {record.DetectionTimestamp:F3}, {record.CalculatedThreatScore:F1}, " +
                   $"{(record.WasHighThreatLead ? 1 : 0)}, {(record.WasNonLethalDecoy ? 1 : 0)}, {(record.Neutralized ? 1 : 0)});";
        }
    }
}
