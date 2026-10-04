// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Telemetry/TelemetryLogger.cs
// TELEMETRY OUTPUT: Asynchronous JSON File-I/O Pipeline
// ============================================================================

using System;
using System.Collections.Concurrent;
using System.IO;
using System.Text.Json;
using System.Threading;
using Aegis.CUAS.Simulation.Core;

namespace Aegis.CUAS.Simulation.Telemetry
{
    /// <summary>
    /// Asynchronous non-blocking Telemetry Logger that writes metric streams to structured JSON.
    /// Uses a thread-safe ConcurrentQueue to prevent I/O disk spikes from choking simulation loops.
    /// </summary>
    public class TelemetryLogger : IDisposable
    {
        private readonly BlockingCollection<TelemetryEvent> _logQueue = new BlockingCollection<TelemetryEvent>(new ConcurrentQueue<TelemetryEvent>());
        private readonly Thread _loggingThread;
        private readonly string _outputFilePath;
        private bool _isWriting = true;

        public TelemetryLogger(string sessionID, string outputDirectory = "./TelemetryLogs")
        {
            if (!Directory.Exists(outputDirectory))
            {
                Directory.CreateDirectory(outputDirectory);
            }

            _outputFilePath = Path.Combine(outputDirectory, $"Telemetry_Session_{sessionID}_{DateTime.Now:yyyyMMdd_HHmmss}.json");

            _loggingThread = new Thread(ProcessWriteQueue)
            {
                IsBackground = true,
                Name = "Async_Telemetry_Writer"
            };
            _loggingThread.Start();
        }

        /// <summary>
        /// Non-blocking enqueuing of telemetry event package.
        /// </summary>
        public void LogEvent(TelemetryEvent evt)
        {
            if (evt == null || !_isWriting) return;
            _logQueue.TryAdd(evt);
        }

        private void ProcessWriteQueue()
        {
            using (var streamWriter = new StreamWriter(_outputFilePath, append: true))
            {
                streamWriter.WriteLine("["); // Array start
                bool isFirst = true;

                foreach (var evt in _logQueue.GetConsumingEnumerable())
                {
                    try
                    {
                        string json = JsonSerializer.Serialize(evt, new JsonSerializerOptions { WriteIndented = false });
                        if (!isFirst) streamWriter.WriteLine(",");
                        streamWriter.Write("  " + json);
                        isFirst = false;
                        streamWriter.Flush();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Telemetry Writer Error] {ex.Message}");
                    }
                }
                streamWriter.WriteLine("\n]"); // Array end
            }
        }

        public void FlushAndStop()
        {
            _isWriting = false;
            _logQueue.CompleteAdding();
            if (_loggingThread != null && _loggingThread.IsAlive)
            {
                _loggingThread.Join(2000);
            }
        }

        public void Dispose()
        {
            FlushAndStop();
            _logQueue.Dispose();
        }
    }
}
