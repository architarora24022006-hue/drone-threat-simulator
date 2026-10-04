// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Program.cs
// ENTRY POINT: Standalone Simulation Harness & Hardware Benchmark
// ============================================================================

using System;
using System.Diagnostics;
using Aegis.CUAS.Simulation.Core;

namespace Aegis.CUAS.Simulation
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("=======================================================================");
            Console.WriteLine("  AEGIS C-UAS: AI-ENABLED DRONE & COUNTER-DRONE SIMULATION TRAINER     ");
            Console.WriteLine("=======================================================================");

            using (var simMaster = new SimulationCoreMaster("TRAIN-SESS-9941", "TRAINER-NODE-01"))
            {
                // Initialize Scenario: 8 Kinetic FPVs, 12 Decoys, 2 ISR Recon units
                simMaster.InitializeScenario(kineticFPVCount: 10, decoyCount: 15, isrCount: 3);

                float fixedDeltaTime = 1.0f / 60.0f; // 60 Hz simulation tick interval
                Stopwatch stopwatch = Stopwatch.StartNew();

                Console.WriteLine("\n[Sim Engine] Running 60Hz Hardware-Agnostic Swarm Tick Loop (10 seconds simulation)...");

                // Run 600 ticks (10 seconds of simulation time)
                for (int frame = 0; frame < 600; frame++)
                {
                    simMaster.StepSimulationTick(fixedDeltaTime);

                    // Simulate operator actions during swarm ingress
                    if (frame == 120) // Frame 120: Operator erroneously fires at a non-lethal decoy chaff drone
                    {
                        Console.WriteLine($"\n[Sim Event @ {simMaster.CurrentTimeSec:F2}s] Operator engaging target: DECOY-CHAFF-02");
                        simMaster.ExecuteOperatorFire("OPERATOR-01", "DECOY-CHAFF-02");
                    }
                    else if (frame == 240) // Frame 240: Operator correctly intercepts high-threat kinetic striker FPV
                    {
                        Console.WriteLine($"\n[Sim Event @ {simMaster.CurrentTimeSec:F2}s] Operator engaging target: FPV-STRIKE-01");
                        simMaster.ExecuteOperatorFire("OPERATOR-01", "FPV-STRIKE-01");
                    }
                    else if (frame == 360) // Frame 360: Operator intercepts second kinetic striker FPV
                    {
                        Console.WriteLine($"\n[Sim Event @ {simMaster.CurrentTimeSec:F2}s] Operator engaging target: FPV-STRIKE-02");
                        simMaster.ExecuteOperatorFire("OPERATOR-01", "FPV-STRIKE-02");
                    }
                }

                stopwatch.Stop();
                Console.WriteLine($"\n[Sim Engine] Execution Complete. Real Time Elapsed: {stopwatch.ElapsedMilliseconds} ms for 600 frames.");

                // Conclude session and generate After-Action Review (AAR) report
                simMaster.ConcludeSession("OPERATOR-01");
            }
        }
    }
}
