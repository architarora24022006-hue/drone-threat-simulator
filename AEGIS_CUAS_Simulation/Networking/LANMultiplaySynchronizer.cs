// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Networking/LANMultiplaySynchronizer.cs
// ADDITIONAL ARCHITECTURAL CHANNEL: Lightweight LAN UDP Multiplay State Sync
// ============================================================================

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using Aegis.CUAS.Simulation.Core;

namespace Aegis.CUAS.Simulation.Networking
{
    /// <summary>
    /// LAN Synchronization Packet structure broadcasted over UDP.
    /// </summary>
    public class SwarmStatePacket
    {
        public string SessionID { get; set; }
        public double SequenceTimestamp { get; set; }
        public string SenderNodeID { get; set; }
        public List<DroneStateSnapshot> Drones { get; set; } = new List<DroneStateSnapshot>();
        public float OperatorScore { get; set; }
        public float CognitiveOverloadIndex { get; set; }
    }

    public class DroneStateSnapshot
    {
        public string DroneID { get; set; }
        public Vector3D Position { get; set; }
        public Vector3D Velocity { get; set; }
        public DroneType Type { get; set; }
        public DroneState State { get; set; }
        public float ThreatScore { get; set; }
    }

    /// <summary>
    /// Thread-safe UDP Socket State Synchronization layer for team-based unit training.
    /// Handles packet serialization, broadcast, and asynchronous network reception.
    /// </summary>
    public class LANMultiplaySynchronizer : IDisposable
    {
        private UdpClient _udpBroadcaster;
        private UdpClient _udpReceiver;
        private Thread _receiveThread;
        private bool _isRunning = false;

        public int ListenPort { get; set; } = 8888;
        public int BroadcastPort { get; set; } = 8888;
        public string BroadcastIP { get; set; } = "255.255.255.255";
        public string NodeID { get; private set; }

        public event Action<SwarmStatePacket> OnStatePacketReceived;

        public LANMultiplaySynchronizer(string nodeId, int port = 8888)
        {
            NodeID = nodeId;
            ListenPort = port;
            BroadcastPort = port;
        }

        /// <summary>
        /// Starts the UDP networking listeners and background reception thread.
        /// </summary>
        public void StartSynchronization()
        {
            if (_isRunning) return;
            _isRunning = true;

            try
            {
                _udpBroadcaster = new UdpClient();
                _udpBroadcaster.EnableBroadcast = true;

                _udpReceiver = new UdpClient();
                _udpReceiver.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReuseAddress, true);
                _udpReceiver.Client.Bind(new IPEndPoint(IPAddress.Any, ListenPort));

                _receiveThread = new Thread(ReceiveLoop)
                {
                    IsBackground = true,
                    Name = "LAN_Multiplay_Sync_Receiver"
                };
                _receiveThread.Start();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LAN Multiplay Sync] Warning: Socket initialization failed (Running Standalone Mode): {ex.Message}");
            }
        }

        /// <summary>
        /// Serializes and broadcasts the swarm state packet over LAN UDP.
        /// </summary>
        public void BroadcastSwarmState(SwarmStatePacket packet)
        {
            if (!_isRunning || _udpBroadcaster == null || packet == null) return;

            try
            {
                packet.SenderNodeID = NodeID;
                string jsonPayload = JsonSerializer.Serialize(packet);
                byte[] bytes = Encoding.UTF8.GetBytes(jsonPayload);

                IPEndPoint endPoint = new IPEndPoint(IPAddress.Parse(BroadcastIP), BroadcastPort);
                _udpBroadcaster.SendAsync(bytes, bytes.Length, endPoint);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LAN Multiplay Sync] Broadcast error: {ex.Message}");
            }
        }

        private void ReceiveLoop()
        {
            IPEndPoint remoteEndPoint = new IPEndPoint(IPAddress.Any, 0);

            while (_isRunning)
            {
                try
                {
                    if (_udpReceiver == null) break;
                    byte[] receivedBytes = _udpReceiver.Receive(ref remoteEndPoint);
                    string json = Encoding.UTF8.GetString(receivedBytes);

                    SwarmStatePacket packet = JsonSerializer.Deserialize<SwarmStatePacket>(json);
                    if (packet != null && packet.SenderNodeID != NodeID) // Filter self broadcasts
                    {
                        OnStatePacketReceived?.Invoke(packet);
                    }
                }
                catch (SocketException)
                {
                    // Socket closed on shutdown
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[LAN Multiplay Sync] Network receive error: {ex.Message}");
                }
            }
        }

        public void StopSynchronization()
        {
            _isRunning = false;
            try
            {
                _udpReceiver?.Close();
                _udpBroadcaster?.Close();
            }
            catch { }
        }

        public void Dispose()
        {
            StopSynchronization();
        }
    }
}
