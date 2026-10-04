// ============================================================================
// AI-ENABLED DRONE & COUNTER-DRONE THREAT SIMULATION TRAINER
// FILE: Analytics/AARAnalyticsEngine.cs
// COMPONENT 4: After-Action Review (AAR) Analytical Data Backend System
// ============================================================================

using System;
using System.Collections.Generic;
using Aegis.CUAS.Simulation.Core;
using Aegis.CUAS.Simulation.Triage;

namespace Aegis.CUAS.Simulation.Analytics
{
    /// <summary>
    /// Performance Analytics Summary generated for After-Action Review (AAR).
    /// </summary>
    public class AARPerformanceReport
    {
        public string SessionID { get; set; }
        public string OperatorID { get; set; }
        public double SessionDurationSeconds { get; set; }
        public float FinalTriageScore { get; set; }

        // Time Metrics
        public float MeanTimeToDetectionSec { get; set; }    // MTTD
        public float MeanTimeToNeutralizationSec { get; set; } // MTTN

        // Discrimination & Efficiency Metrics
        public float TargetDiscriminationIndex { get; set; } // TDI (High-Threat Intercepts / Total Fired)
        public int TotalHighThreatNeutralized { get; set; }
        public int TotalDecoysWasted { get; set; }
        public int TotalLeadsMissed { get; set; }
        public float DecoyWasteRatePercent { get; set; }

        // Cognitive & Friction Metrics
        public float PeakCognitiveOverloadIndex { get; set; }
        public int TotalFalsePositivesReported { get; set; }

        // Confusion Matrix
        public int TruePositives { get; set; }  // Correctly identified and hit kinetic threat
        public int FalsePositives { get; set; } // Engaged ghost / decoy as threat
        public int FalseNegatives { get; set; } // Allowed kinetic threat to leak through
        public int TrueNegatives { get; set; }  // Correctly ignored non-lethal decoy

        public override string ToString()
        {
            return $"====== AFTER-ACTION REVIEW (AAR) REPORT ======\n" +
                   $"Session ID: {SessionID}\n" +
                   $"Operator ID: {OperatorID}\n" +
                   $"Final Triage Score: {FinalTriageScore:F1} / 500.0\n" +
                   $"Mean Time To Detection (MTTD): {MeanTimeToDetectionSec:F2}s\n" +
                   $"Mean Time To Neutralization (MTTN): {MeanTimeToNeutralizationSec:F2}s\n" +
                   $"Target Discrimination Index (TDI): {TargetDiscriminationIndex * 100:F1}%\n" +
                   $"High Threat Intercepts: {TotalHighThreatNeutralized}\n" +
                   $"Decoy Ammunition Wasted: {TotalDecoysWasted}\n" +
                   $"Decoy Waste Rate: {DecoyWasteRatePercent:F1}%\n" +
                   $"Peak Cognitive Overload Index: {PeakCognitiveOverloadIndex * 100:F1}%\n" +
                   $"Confusion Matrix [TP: {TruePositives}, FP: {FalsePositives}, FN: {FalseNegatives}, TN: {TrueNegatives}]\n" +
                   $"===============================================";
        }
    }

    /// <summary>
    /// Analytical Data Aggregation System parsing session telemetry to compute
    /// defense metrics, MTTD, MTTN, TDI, and Threat Classification Matrices for AAR.
    /// </summary>
    public class AARAnalyticsEngine
    {
        /// <summary>
        /// Computes comprehensive After-Action Review (AAR) analytics report from session data.
        /// </summary>
        public AARPerformanceReport GenerateAARReport(
            string sessionID,
            string operatorID,
            double sessionDurationSec,
            List<EngagementRecord> engagementHistory,
            Dictionary<string, double> droneFirstDetectedTimestamps,
            float finalTriageScore,
            float peakCognitiveOverload)
        {
            var report = new AARPerformanceReport
            {
                SessionID = sessionID,
                OperatorID = operatorID,
                SessionDurationSeconds = sessionDurationSec,
                FinalTriageScore = finalTriageScore,
                PeakCognitiveOverloadIndex = peakCognitiveOverload
            };

            if (engagementHistory == null || engagementHistory.Count == 0)
            {
                return report;
            }

            float totalDetectionTime = 0f;
            int detectionCount = 0;

            float totalNeutralizationTime = 0f;
            int neutralizationCount = 0;

            int tp = 0, fp = 0, fn = 0, tn = 0;
            int decoysEngaged = 0;
            int highThreatHit = 0;

            int recordCount = engagementHistory.Count;
            for (int i = 0; i < recordCount; i++)
            {
                EngagementRecord eng = engagementHistory[i];

                // MTTD calculation
                if (droneFirstDetectedTimestamps.TryGetValue(eng.TargetDroneID, out double detectedTime))
                {
                    totalDetectionTime += (float)detectedTime;
                    detectionCount++;

                    // MTTN calculation
                    float netTimeToKill = (float)(eng.EngagementTimestamp - detectedTime);
                    if (netTimeToKill > 0)
                    {
                        totalNeutralizationTime += netTimeToKill;
                        neutralizationCount++;
                    }
                }

                // Discrimination metrics
                if (eng.WasHighThreatLead)
                {
                    tp++;
                    highThreatHit++;
                }
                else if (eng.WasNonLethalDecoy)
                {
                    fp++;
                    decoysEngaged++;
                }
            }

            report.TotalHighThreatNeutralized = highThreatHit;
            report.TotalDecoysWasted = decoysEngaged;
            report.TruePositives = tp;
            report.FalsePositives = fp;
            report.FalseNegatives = fn;
            report.TrueNegatives = tn;

            report.MeanTimeToDetectionSec = detectionCount > 0 ? totalDetectionTime / detectionCount : 0f;
            report.MeanTimeToNeutralizationSec = neutralizationCount > 0 ? totalNeutralizationTime / neutralizationCount : 0f;

            int totalFired = highThreatHit + decoysEngaged;
            report.TargetDiscriminationIndex = totalFired > 0 ? (float)highThreatHit / totalFired : 1.0f;
            report.DecoyWasteRatePercent = totalFired > 0 ? ((float)decoysEngaged / totalFired) * 100.0f : 0f;

            return report;
        }
    }
}
