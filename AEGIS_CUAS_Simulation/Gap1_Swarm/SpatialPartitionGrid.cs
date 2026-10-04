// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Gap1_Swarm/SpatialPartitionGrid.cs
// CAPABILITY GAP 1: Hardware-Agnostic Swarm Acceleration (Spatial Grid Hashing)
// ============================================================================

using System;
using System.Collections.Generic;
using Aegis.CUAS.Simulation.Core;

namespace Aegis.CUAS.Simulation.Swarm
{
    /// <summary>
    /// Swarm Agent interface required for insertion into the Spatial Partition Grid.
    /// </summary>
    public interface ISwarmAgent
    {
        string AgentID { get; }
        Vector3D Position { get; set; }
        Vector3D Velocity { get; set; }
        Vector3D Acceleration { get; set; }
        DroneType Type { get; }
        DroneState State { get; set; }
        bool IsActive { get; set; }
    }

    /// <summary>
    /// High-performance 3D Spatial Partitioning Grid utilizing bucket hashing.
    /// Reduces neighbor query complexity from O(N^2) to near O(N).
    /// </summary>
    public class SpatialPartitionGrid<T> where T : class, ISwarmAgent
    {
        private readonly float _cellSize;
        private readonly Dictionary<CellCoord, List<T>> _grid;
        private readonly List<T> _emptyList = new List<T>();

        public float CellSize => _cellSize;
        public int TotalActiveCells => _grid.Count;

        public SpatialPartitionGrid(float cellSize)
        {
            _cellSize = Math.Max(1.0f, cellSize);
            _grid = new Dictionary<CellCoord, List<T>>(1024);
        }

        /// <summary>
        /// Converts a continuous 3D world coordinate into a discrete cell coordinate.
        /// </summary>
        public CellCoord PositionToCell(Vector3D position)
        {
            int cx = (int)Math.Floor(position.x / _cellSize);
            int cy = (int)Math.Floor(position.y / _cellSize);
            int cz = (int)Math.Floor(position.z / _cellSize);
            return new CellCoord(cx, cy, cz);
        }

        /// <summary>
        /// Clears all spatial buckets. Called at the start of each simulation tick.
        /// </summary>
        public void Clear()
        {
            foreach (var cell in _grid.Values)
            {
                cell.Clear();
            }
        }

        /// <summary>
        /// Inserts an agent into the appropriate spatial bucket.
        /// </summary>
        public void Insert(T agent)
        {
            if (agent == null || !agent.IsActive) return;

            CellCoord cellKey = PositionToCell(agent.Position);
            if (!_grid.TryGetValue(cellKey, out var bucket))
            {
                bucket = new List<T>(16);
                _grid[cellKey] = bucket;
            }
            bucket.Add(agent);
        }

        /// <summary>
        /// Populates the provided result buffer with all neighboring agents within searchRadius.
        /// Avoids heap allocations by reusing the passed result list.
        /// </summary>
        public void QueryNeighbors(T targetAgent, float searchRadius, List<T> resultList)
        {
            resultList.Clear();
            if (targetAgent == null) return;

            Vector3D pos = targetAgent.Position;
            int radiusInCells = (int)Math.Ceiling(searchRadius / _cellSize);
            CellCoord centerCell = PositionToCell(pos);
            float sqrRadius = searchRadius * searchRadius;

            for (int dx = -radiusInCells; dx <= radiusInCells; dx++)
            {
                for (int dy = -radiusInCells; dy <= radiusInCells; dy++)
                {
                    for (int dz = -radiusInCells; dz <= radiusInCells; dz++)
                    {
                        CellCoord neighborCell = new CellCoord(centerCell.x + dx, centerCell.y + dy, centerCell.z + dz);
                        if (_grid.TryGetValue(neighborCell, out var bucket))
                        {
                            int count = bucket.Count;
                            for (int i = 0; i < count; i++)
                            {
                                T other = bucket[i];
                                if (ReferenceEquals(other, targetAgent) || !other.IsActive) continue;

                                float distSqr = Vector3D.SqrDistance(pos, other.Position);
                                if (distSqr <= sqrRadius)
                                {
                                    resultList.Add(other);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
