# SENTINEL-Drone: AI-Enabled Drone & Counter-Drone Threat Simulation Trainer
> **Smart India Hackathon (SIH) Prototype // Defense-Tech Track // MIL-STD-2525D Compliant**

---

## 1. PRODUCT VISION
**SENTINEL-Drone** is a unit-level training simulator engineered to train defense personnel, radar operators, and forward-base sentries in detecting, classifying, prioritizing, and executing proportional countermeasures against drone and drone-swarm threats.

Operating **100% offline-ready** with zero cloud or paid API reliance, the simulator runs smoothly on standard mid-range laptops. It integrates **edge-accelerated 3D WebGL tactical rendering with an ultra-lightweight 2D pulse radar fallback**, a **procedural AI Scenario Director with reproducible Threat DNA**, a **decision-tree scoring engine across 6 weighted metrics**, a **full After-Action Review (AAR) with interactive timeline scrubbers and skill radar charts**, an **Instructor Console with real-time stress interventions**, and an **Explainable AI Coach**.

---

## 2. SYSTEM ARCHITECTURE

```
                               +---------------------------------------------+
                               |         SENTINEL-Drone Unified C2           |
                               |          Tactical Command Console           |
                               +---------------------------------------------+
                                       |                             |
                       +---------------+---------------+             |
                       |                               |             |
        +-----------------------------+ +--------------------------+ |
        |   3D WebGL Tactical View    | |   2D Pulse Radar Canvas  | |
        | (Three.js Terrain & Drones) | | (60 FPS Fallback Engine) | |
        +-----------------------------+ +--------------------------+ |
                       |                               |             |
        +----------------------------------------------------------+ |
        |             Multi-Channel Sensor Fusion Engine           | |
        |  * Radar RCS & Doppler      * Optical / FLIR PIP Camera  | |
        |  * RF Spectrum Waterfall    * Acoustic BPF Harmonics     | |
        |  * Patrol Radio Feed        * Bayesian Fusion Confidence | |
        +----------------------------------------------------------+ |
                                       |                             |
        +----------------------------------------------------------+ |
        |               Counter-Drone Decision Engine              | |
        |  * Classification (1-8)     * Threat Priority (Low-Crit) | |
        |  * Soft-Kill (RF / GPS)     * Hard-Kill (Laser / Kinetic)| |
        |  * Rules of Engagement      * Collateral Damage Checks   | |
        +----------------------------------------------------------+ |
                                       |                             |
        +----------------------------------------------------------+ |
        |            Procedural AI Director & Threat DNA           | |
        |  * Seeded Mulberry32 PRNG   * 12 Military Drills Catalog | |
        |  * Dynamic Swarm Tactics    * Exact Replayable DNA Strings|
        +----------------------------------------------------------+ |
                                       |                             |
        +----------------------------------------------------------+ |
        |          Decision-Tree 6-Metric Scoring & AAR            | |
        |  * Detection Time (20%)     * Classification Acc (25%)   | |
        |  * Swarm Awareness (15%)    * Decision Quality (25%)     | |
        |  * Communication (10%)      * Degraded Cond (5%)         | |
        |  * Skill Radar (Chart.js)   * Timeline Replay Scrubber   | |
        |  * Error Heat Map           * Explainable AI Coach       | |
        +----------------------------------------------------------+ |
                                       |                             |
                                       v                             v
        +--------------------------------------------------------------------+
        |        Python REST Backend Service & SQLite Data Layer             |
        |              Database: sentinel_drone.db                           |
        |   Tables: users, scenarios, sessions, trainee_actions,             |
        |           aar_reports, doctrine_rules, unit_performance            |
        +--------------------------------------------------------------------+
```

---

## 3. SIH-WINNING DIFFERENTIATORS

1. **Threat DNA System (`URBAN-NIGHT-CLEAR-SWARM-5-PINCER-FLOCK-1003`)**:
   Every scenario is encoded as an alphanumeric DNA signature. Replaying the exact same DNA string regenerates identical flight vectors, radar cross-sections, and sensor degradation via seeded PRNG (`mulberry32`), enabling fair cadet competitions and standardized benchmarks.

2. **Cognitive Load & Stress Testing Mode**:
   Simulates operational friction: simultaneous incoming contacts, synthetic radio squelch and radio chatter, time pressure with terminal kamikaze dives, and real-time NASA-TLX workload estimation and heart rate telemetry.

3. **Multi-Channel Sensor Fusion with Realistic Uncertainty**:
   Drones are not simply red dots. Trainees must fuse **Radar doppler signatures**, **RF spectrum waterfall peaks** (433MHz, 915MHz, 2.4GHz, 5.8GHz), **Acoustic propeller harmonics (BPF)**, and **Thermal FLIR PIP cameras** (White-Hot, Black-Hot, NVG) to differentiate harmless decoys/birds from lethal kamikazes.

4. **Explainable AI Coach with Prescriptive Drills**:
   Instead of an arbitrary grade, the AI debrief dissects trainee performance with evidence:
   - *"You waited 14.2s after RF spectrum peak before slaving camera."*
   - *"Munitions wasted on non-lethal radar reflector decoy."*
   - Recommends 3 specific drills targeting identified weaknesses.

5. **Doctrine-Configurable ROE**:
   Commanders can modify Rules of Engagement (Peacetime Tight, Active Hostile Border, Urban Zero-Collateral), weapon authorizations, and collateral risk thresholds directly in the UI without restarting the application.

6. **Low-End Hardware Mode (Offline-First)**:
   Runs at 60 FPS on basic integrated-GPU laptops via high-performance 2D HTML5 canvas radar, while enabling rich 3D WebGL rendering when hardware acceleration is available.

---

## 4. 6-METRIC DECISION-TREE SCORING ENGINE

| Metric | Weight | Max Points | Evaluation Logic |
| :--- | :---: | :---: | :--- |
| **Detection Latency** | 20% | 200 pts | Evaluates reaction window from radar boundary entry to first track lock. |
| **Classification Accuracy** | 25% | 250 pts | Ground-truth verification across 8 threat classes. Penalizes bird/decoy misclassification. |
| **Swarm Situational Awareness** | 15% | 150 pts | Detects multi-vector pincer patterns, identifies swarm master nodes, and avoids chaff traps. |
| **Counter-Drone Decision Quality** | 25% | 250 pts | Proportional tool matching (Soft-Kill vs Hard-Kill) and collateral hazard avoidance. |
| **Communication & Reporting** | 10% | 100 pts | Guard force alert dispatch, IFF requests, and base siren evacuation triggers. |
| **Performance Under Degraded Vis** | 5% | 50 pts | Sustained threat discrimination under heavy fog, rain, sandstorm, or night conditions. |
| **TOTAL** | **100%** | **1000 pts** | **Grades: MASTER (≥900), DISTINGUISHED (800-899), QUALIFIED (700-799), REMEDIATION (<600)** |

---

## 5. 12 SCRIPTED MILITARY DRILLS CATALOG

1. **Drill 01: Lone Commercial Quadcopter Recon** *(Easy // Urban Day)* - Basic RF jammer soft-kill.
2. **Drill 02: High-Speed FPV Kamikaze Low-Altitude Infiltration** *(Medium // Urban Dusk)* - Sub-2.0s reaction window.
3. **Drill 03: Multi-Vector Pincer Swarm Attack** *(Hard // Rural Night)* - 5 drones converging from NE and SW.
4. **Drill 04: Decoy Chaff Distraction with Concealed Kamikaze** *(Hard // Urban Rain)* - Decoy discrimination.
5. **Drill 05: Heavy Fog Sensor Degradation with Payload Dropper** *(Medium // Rural Fog)* - Acoustic/RF fusion.
6. **Drill 06: Night Infiltration over Coastal Radar Array** *(Medium // Coastal Night)* - Sea-skimming FLIR detection.
7. **Drill 07: Autonomous Fixed-Wing UAV with GNSS Loss Rerouting** *(Hard // Rural Day)* - Radio-silent navigation.
8. **Drill 08: Swarm Leader-Follower Mesh Disruption Drill** *(Expert // Urban Day)* - Master node neutralization.
9. **Drill 09: Migratory Bird Clutter vs Low-RCS Micro-UAV** *(Medium // Coastal Day)* - Biological clutter discrimination.
10. **Drill 10: Saturation Swarm (12 Nodes)** *(Expert // Urban Sandstorm)* - Rapid triage under severe cognitive stress.
11. **Drill 11: Electronic Warfare Environment** *(Hard // Rural Rain)* - Blown radar azimuth compensation.
12. **Drill 12: Complex Mixed Threat Attack on Ammo Depot** *(Expert // Urban Night)* - Zero-collateral urban ROE.

---

## 6. KEYBOARD SHORTCUTS REFERENCE

| Key | Tactical Action | Description |
| :---: | :--- | :--- |
| `1` | **Classify Bird / Fauna** | Biological clutter marker |
| `2` | **Classify Civilian Drone** | Unauthorized commercial survey quad |
| `3` | **Classify Hostile Recon** | DJI/Commercial quadcopter on reconnaissance |
| `4` | **Classify Kamikaze FPV** | High-speed lethal kinetic strike drone |
| `5` | **Classify Payload Dropper** | Heavy hexacopter carrying mortar/grenade |
| `6` | **Classify Radar Decoy** | Non-lethal corner reflector chaff |
| `7` | **Classify Swarm Node** | Coordinated mesh network node |
| `8` | **Classify Unknown** | Ambiguous radar return |
| `Q` | **Track / Designate** | Designates contact as primary track |
| `W` | **Soft-Kill (RF Jammer)** | Deploys directional C-Band jammer to sever telemetry |
| `E` | **Hard-Kill (Laser / Kinetic)** | Direct Energy Laser thermal burn or net interceptor |
| `R` | **Report / Alert Team** | Sends immediate tactical alert to perimeter sentries |
| `Space` | **Pause / Resume** | Pauses or resumes simulation execution |
| `Tab` | **Toggle 3D / 2D View** | Switches between 3D WebGL view and 2D Pulse Radar |
| `Enter`| **Confirm Engagement** | Executes prioritized countermeasure |
| `?` | **Keyboard Help Overlay** | Toggles hotkey reference sheet |

---

## 7. JUDGES DEMO WALKTHROUGH SCRIPT (30s & 5m)

### 30-Second Elevator Pitch
> *"Judges, modern drone warfare has rendered traditional visual spotting obsolete. SENTINEL-Drone is a 100% offline-ready, unit-level training simulator that trains defense sentries to detect, classify, and neutralize drone swarms under realistic sensor uncertainty. With reproducible Threat DNA, multi-sensor fusion across radar, RF spectrum, acoustics, and FLIR, and an explainable decision-tree scoring engine across 6 weighted metrics, it transforms raw recruits into disciplined C-UAS operators on normal laptops."*

### 5-Minute Guided Inspection Flow
1. **Launch**: Click the **GUIDED TOUR** button in the header. Show the 6 interactive slides highlighting the MIL-STD-2525D dark interface, role switcher, and DEFCON ALPHA status.
2. **Surveillance Radar**: Demonstrate 360° pulse radar and 3D FOB base with radomes, ammo depot S7, and helipad. Tap `Tab` to showcase seamless 2D/3D dual-engine switching.
3. **Sensor Fusion**: Switch to **Tab 2 (Sensor Fusion & FLIR)**. Show the live FLIR PIP camera switching between White-Hot and NVG Green, the real-time RF spectrum waterfall (433MHz to 5.8GHz), and propeller acoustic harmonics.
4. **Threat Triage**: Switch to **Tab 3 (Threat Triage & Actions)**. Lock onto a contact. Press `4` to classify as Kamikaze, select `CRITICAL`, and press `W` for RF Soft-Kill. Point out the instant feedback toast and score delta.
5. **Scenario Director**: Switch to **Tab 4 (AI Scenario Director)**. Click **GENERATE RANDOM SCENARIO**. Note the compact generated Threat DNA code.
6. **Instructor Console**: Switch to **Tab 5 (Instructor & Doctrine)**. Click **SPAWN SUDDEN DECOYS** or **FAIL RF JAMMER** to show how instructors can inject real-time stress test interventions.
7. **After-Action Review**: Switch to **Tab 6 (After-Action Review)**. Review the 6-metric breakdown, drag the **Timeline Replay Scrubber**, observe the **Skill Radar Chart**, and read the **Explainable AI Coach Debrief**. Click **PRINT DOSSIER** to show the exportable military training report.

---

## 8. INSTALLATION & LOCAL DEPLOYMENT

### Prerequisites
- Python 3.10+ (Standard library only; zero pip dependencies required!)
- Node.js & npm (Optional, only needed if modifying vendor dependencies)
- Any modern web browser (Chrome, Edge, Firefox, Brave)

### One-Command Quick Start
```bash
# 1. Clone repository
git clone https://github.com/architarora24022006-hue/drone-threat-simulator.git
cd drone-threat-simulator

# 2. Launch Backend & Web Server
python server.py

# 3. Open in Browser
# Navigate to: http://localhost:3000
```

### Docker Deployment
```bash
docker compose up -d --build
# Access simulator at: http://localhost:3000
```

---

## 9. FUTURE ROADMAP

- **Phase 1 (Delivered)**: Complete working SIH prototype with 12 scenarios, Threat DNA, 6-metric scoring, AAR replay, and 3D/2D dual engines.
- **Phase 2 (Edge Hardware Integration)**: Native USB SDR (Software Defined Radio - RTL-SDR / HackRF) bridge for real RF spectrum ingestion.
- **Phase 3 (VR/XR Extension)**: WebXR head-mounted display support for immersive perimeter sentry binoculars and gunner sights.
- **Phase 4 (Distributed Multi-Cadet Mode)**: WebSocket multiplayer where one trainee operates the surveillance radar while another commands the kinetic interceptor battery.

---
*CLASSIFIED DEFENSE TRAINING AUDIT // SENTINEL-DRONE C-UAS SIMULATOR // MIL-STD-2525D COMPLIANT*
