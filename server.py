#!/usr/bin/env python3
"""
SENTINEL-Drone: AI-Enabled Drone & Counter-Drone Threat Simulation Trainer
PRODUCTION BACKEND SERVER & PERSISTENCE ENGINE (SQLite + REST API + AI Tactical Advisor)
"""

import http.server
import socketserver
import json
import sqlite3
import os
import sys
import time
import math
import random
import urllib.request
from urllib.parse import parse_qs, urlparse

PORT = int(os.environ.get("PORT", 3000))
DB_FILE = 'sentinel_drone.db'

# Pre-set Defense Sector Coordinates for Live Weather Simulation
DEFENSE_SECTORS = {
    "leh": {"name": "Leh-Ladakh Sector (High Altitude FOB Vajra)", "lat": 34.1526, "lon": 77.5771, "grid": "GRID: 34°09'N 77°34'E // FOB-VAJRA-LEH"},
    "jaisalmer": {"name": "Thar Desert / Jaisalmer Border Outpost", "lat": 26.9157, "lon": 70.9083, "grid": "GRID: 26°54'N 70°54'E // THAR-SECTOR-BDR"},
    "siliguri": {"name": "Siliguri Strategic Corridor / North-East", "lat": 26.7271, "lon": 88.3953, "grid": "GRID: 26°43'N 88°23'E // SILIGURI-NECK-AIR"},
    "karwar": {"name": "Coastal Naval Base Karwar (Western Seaboard)", "lat": 14.8150, "lon": 74.1300, "grid": "GRID: 14°48'N 74°07'E // NAVAL-ARRAY-KARWAR"}
}

# 12 SCRIPTED SCENARIOS CATALOG
DEFAULT_SCENARIOS = [
    {
        "id": "SCEN-01",
        "title": "Drill 01: Lone Commercial Quadcopter Reconnaissance",
        "terrain": "urban",
        "time_of_day": "day",
        "weather": "clear",
        "difficulty": "EASY",
        "threat_dna": "URBAN-DAY-CLEAR-SINGLE-1-RECON-HOVER",
        "seed": 1001,
        "roe": "TIGHT",
        "assets_to_protect": ["Base Command Post", "Perimeter Surveillance Tower"],
        "available_assets": ["Directional RF Jammer", "Kinetic Interceptor Net", "Laser DEW"],
        "summary": "Detect an unauthorized commercial quadcopter hovering over the FOB perimeter and execute non-kinetic RF jammer severance."
    },
    {
        "id": "SCEN-02",
        "title": "Drill 02: High-Speed FPV Kamikaze Low-Altitude Infiltration",
        "terrain": "urban",
        "time_of_day": "dusk",
        "weather": "clear",
        "difficulty": "MEDIUM",
        "threat_dna": "URBAN-DUSK-CLEAR-FPV-2-KAMIKAZE-DIVE",
        "seed": 1002,
        "roe": "HOSTILE_BORDER",
        "assets_to_protect": ["Ammunition Depot S7", "Forward Fuel Bladder"],
        "available_assets": ["Directional RF Jammer", "Kinetic Interceptor Drone", "Laser DEW", "30mm CIWS"],
        "summary": "Dual high-speed FPV kamikaze drones executing low-altitude terrain masking towards the ammunition depot."
    },
    {
        "id": "SCEN-03",
        "title": "Drill 03: Multi-Vector Pincer Swarm Attack (5 Drones)",
        "terrain": "rural",
        "time_of_day": "night",
        "weather": "clear",
        "difficulty": "HARD",
        "threat_dna": "RURAL-NIGHT-CLEAR-SWARM-5-PINCER-FLOCK",
        "seed": 1003,
        "roe": "HOSTILE_BORDER",
        "assets_to_protect": ["Tactical Radome Array", "Personnel Quarters"],
        "available_assets": ["Directional RF Jammer", "GPS Spoofing Array", "Kinetic Interceptor", "Laser DEW"],
        "summary": "Coordinated pincer maneuver from North-East and South-West attempting to saturate air defense reaction windows."
    },
    {
        "id": "SCEN-04",
        "title": "Drill 04: Decoy Chaff Distraction with Concealed Kamikaze",
        "terrain": "urban",
        "time_of_day": "day",
        "weather": "rain",
        "difficulty": "HARD",
        "threat_dna": "URBAN-DAY-RAIN-DECOY-3-AMBUSH-STRIKE",
        "seed": 1004,
        "roe": "URBAN_MIN_COLLATERAL",
        "assets_to_protect": ["Helipad Alpha", "Air Defense Battery"],
        "available_assets": ["Directional RF Jammer", "Kinetic Interceptor", "Laser DEW"],
        "summary": "Two non-lethal radar reflector decoys preceding an explosive kamikaze loitering munition. Trainee must discriminate targets to preserve ammo."
    },
    {
        "id": "SCEN-05",
        "title": "Drill 05: Heavy Fog Sensor Degradation with Payload Dropper",
        "terrain": "rural",
        "time_of_day": "dusk",
        "weather": "fog",
        "difficulty": "MEDIUM",
        "threat_dna": "RURAL-DUSK-FOG-PAYLOAD-2-MORTAR-DROP",
        "seed": 1005,
        "roe": "HOSTILE_BORDER",
        "assets_to_protect": ["Transformer Substation", "Motor Pool"],
        "available_assets": ["Directional RF Jammer", "Kinetic Interceptor", "Laser DEW"],
        "summary": "Dense fog degrades optical sensor feed to 35% confidence. Operator must rely on RF spectrum analysis and acoustic doppler."
    },
    {
        "id": "SCEN-06",
        "title": "Drill 06: Night Infiltration over Coastal Radar Array",
        "terrain": "coastal",
        "time_of_day": "night",
        "weather": "clear",
        "difficulty": "MEDIUM",
        "threat_dna": "COASTAL-NIGHT-CLEAR-RECON-3-SEA-SKIM",
        "seed": 1006,
        "roe": "HOSTILE_BORDER",
        "assets_to_protect": ["Coastal Surveillance Radome", "Naval Jetty"],
        "available_assets": ["Directional RF Jammer", "GPS Spoofer", "Laser DEW", "CIWS"],
        "summary": "Low-RCS sea-skimming autonomous UAVs approaching maritime exclusion zone in darkness."
    },
    {
        "id": "SCEN-07",
        "title": "Drill 07: Autonomous Fixed-Wing UAV with GNSS Loss Rerouting",
        "terrain": "rural",
        "time_of_day": "day",
        "weather": "clear",
        "difficulty": "HARD",
        "threat_dna": "RURAL-DAY-CLEAR-FIXEDWING-1-OPTICAL-NAV",
        "seed": 1007,
        "roe": "HOSTILE_BORDER",
        "assets_to_protect": ["High-Power Comm Tower", "Radome Array"],
        "available_assets": ["Directional RF Jammer", "GPS Spoofing Array", "Kinetic Interceptor", "Laser DEW"],
        "summary": "Fixed-wing long-range drone running inertial visual-odometry; RF jamming has partial effect, requiring GPS spoofing or hard-kill."
    },
    {
        "id": "SCEN-08",
        "title": "Drill 08: Swarm Leader-Follower Mesh Disruption Drill",
        "terrain": "urban",
        "time_of_day": "day",
        "weather": "clear",
        "difficulty": "EXPERT",
        "threat_dna": "URBAN-DAY-CLEAR-SWARM-6-LEADER-MESH",
        "seed": 1008,
        "roe": "HOSTILE_BORDER",
        "assets_to_protect": ["Base Command HQ", "Perimeter Gate"],
        "available_assets": ["Directional RF Jammer", "GPS Spoofing Array", "Laser DEW", "Kinetic Interceptor"],
        "summary": "Autonomous 6-node swarm utilizing leader-follower mesh. Neutralizing the primary leader drone causes followers to scatter or enter failsafe RTH."
    },
    {
        "id": "SCEN-09",
        "title": "Drill 09: Migratory Bird Clutter vs Low-RCS Micro-UAV Discrimination",
        "terrain": "coastal",
        "time_of_day": "day",
        "weather": "clear",
        "difficulty": "MEDIUM",
        "threat_dna": "COASTAL-DAY-CLEAR-BIRD-CLUTTER-4-DISCRIM",
        "seed": 1009,
        "roe": "TIGHT",
        "assets_to_protect": ["Coastal Helipad", "Fuel Depot"],
        "available_assets": ["Directional RF Jammer", "Kinetic Interceptor", "Laser DEW"],
        "summary": "Multiple radar contacts displaying micro-doppler signatures of bird flock. One contact is an actual micro-recon drone attempting to hide in clutter."
    },
    {
        "id": "SCEN-10",
        "title": "Drill 10: Saturation Swarm (12 Nodes) - Rapid Prioritization Under Stress",
        "terrain": "urban",
        "time_of_day": "night",
        "weather": "sandstorm",
        "difficulty": "EXPERT",
        "threat_dna": "URBAN-NIGHT-SAND-SWARM-12-SATURATION",
        "seed": 1010,
        "roe": "HOSTILE_BORDER",
        "assets_to_protect": ["All Base Assets", "Ammunition Depot S7", "Radome Array"],
        "available_assets": ["Directional RF Jammer", "GPS Spoofing Array", "Laser DEW", "Kinetic Interceptor", "30mm CIWS"],
        "summary": "Massive saturation swarm arriving in staggered waves under sandstorm degraded visibility. Operator must prioritize closest lethal kinetic threats."
    },
    {
        "id": "SCEN-11",
        "title": "Drill 11: Electronic Warfare Environment (GPS Denied + Jammer Interference)",
        "terrain": "rural",
        "time_of_day": "dusk",
        "weather": "rain",
        "difficulty": "HARD",
        "threat_dna": "RURAL-DUSK-RAIN-EW-4-JAMMED-RADAR",
        "seed": 1011,
        "roe": "HOSTILE_BORDER",
        "assets_to_protect": ["Tactical Operations Center"],
        "available_assets": ["Directional RF Jammer", "Laser DEW", "Kinetic Interceptor"],
        "summary": "Enemy standoff jammer blinding western radar azimuth. Trainee must fuse acoustic bearings and FLIR thermal camera to track approaching payload drones."
    },
    {
        "id": "SCEN-12",
        "title": "Drill 12: Complex Mixed Threat Attack on Ammo Depot (Urban Night Defense)",
        "terrain": "urban",
        "time_of_day": "night",
        "weather": "rain",
        "difficulty": "EXPERT",
        "threat_dna": "URBAN-NIGHT-RAIN-COMPLEX-8-MIXED-ATTACK",
        "seed": 1012,
        "roe": "URBAN_MIN_COLLATERAL",
        "assets_to_protect": ["Ammunition Depot S7", "Command HQ", "Civilian Border Colony"],
        "available_assets": ["Directional RF Jammer", "GPS Spoofing Array", "Kinetic Interceptor", "Laser DEW"],
        "summary": "Coordinated attack with recon drone spotter, decoy chaff, and low-altitude FPV kamikazes directly adjacent to civilian structures requiring zero-collateral weapon selection."
    }
]

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            unit TEXT,
            rank TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scenarios (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            terrain TEXT,
            time_of_day TEXT,
            weather TEXT,
            difficulty TEXT,
            threat_dna TEXT UNIQUE,
            seed INTEGER,
            roe TEXT,
            assets_to_protect TEXT,
            available_assets TEXT,
            config_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            scenario_id TEXT,
            scenario_title TEXT,
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP,
            total_score INTEGER DEFAULT 0,
            max_score INTEGER DEFAULT 1000,
            grade TEXT DEFAULT 'PENDING',
            avg_det_time REAL DEFAULT 0.0,
            accuracy_pct INTEGER DEFAULT 0,
            metrics_json TEXT,
            status TEXT DEFAULT 'ACTIVE',
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trainee_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            timestamp_sec REAL,
            contact_id TEXT,
            action TEXT,
            classification TEXT,
            priority TEXT,
            sensor_context TEXT,
            is_correct_class INTEGER DEFAULT 0,
            recommended_action TEXT,
            actual_action TEXT,
            consequence TEXT,
            score_delta INTEGER DEFAULT 0,
            coaching_feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS aar_reports (
            id TEXT PRIMARY KEY,
            session_id TEXT UNIQUE,
            overall_score INTEGER,
            grade TEXT,
            metrics_breakdown TEXT,
            errors_list TEXT,
            skill_radar TEXT,
            ai_debrief TEXT,
            instructor_notes TEXT,
            replay_telemetry TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS doctrine_rules (
            id TEXT PRIMARY KEY,
            roe_profile TEXT UNIQUE,
            name TEXT,
            rules_json TEXT,
            escalation_rules TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS unit_performance (
            unit_id TEXT PRIMARY KEY,
            unit_name TEXT,
            total_sessions INTEGER DEFAULT 0,
            average_score REAL DEFAULT 0.0,
            readiness_index REAL DEFAULT 0.0,
            trend_json TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Ensure Armed Forces Defense Personnel Clearance Database table exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS defense_clearance_roster (
            code TEXT PRIMARY KEY,
            service_no TEXT NOT NULL,
            name TEXT NOT NULL,
            rank TEXT NOT NULL,
            branch TEXT NOT NULL,
            unit TEXT NOT NULL,
            role TEXT NOT NULL,
            status TEXT DEFAULT 'ACTIVE_ELIGIBLE',
            claimed_by_user_id TEXT,
            claimed_at TIMESTAMP
        )
    ''')

    # Seed defense clearance roster if empty
    cursor.execute("SELECT COUNT(*) FROM defense_clearance_roster")
    if cursor.fetchone()[0] == 0:
        seed_roster = [
            # INSTRUCTORS (CLEARANCE LEVEL 4-5)
            ('ARM-INST-7801', 'IC-54921A', 'Col. Rajeshwar Singh', 'Colonel', 'Army Air Defense (AAD)', '14th Air Defense Brigade HQ', 'instructor', 'ACTIVE_ELIGIBLE'),
            ('ARM-INST-8822', 'IC-61028K', 'Lt. Col. Abhinav Shukla', 'Lt. Colonel', 'Army Air Defense (AAD)', 'Army AD Missile Training Wing', 'instructor', 'ACTIVE_ELIGIBLE'),
            ('IAF-INST-4403', 'AF-29310P', 'Wing Cdr. Ananya Sen', 'Wing Commander', 'Indian Air Force (IAF)', 'Western Air Command C-UAS Cell', 'instructor', 'ACTIVE_ELIGIBLE'),
            ('IAF-INST-5590', 'AF-31940M', 'Sqn. Ldr. Farooq Baig', 'Squadron Leader', 'Indian Air Force (IAF)', 'Air Force Academy Electronic Warfare', 'instructor', 'ACTIVE_ELIGIBLE'),
            ('NAV-INST-3312', 'IN-04812N', 'Cdr. Vikram Rathore', 'Commander', 'Indian Navy (IN)', 'Naval Coastal Defense Battery', 'instructor', 'ACTIVE_ELIGIBLE'),
            ('MOD-INST-9900', 'IC-44109X', 'Maj. Gen. R. K. Rawat', 'Major General', 'Joint Defense Staff (HQ IDS)', 'Tri-Services Air Defense Command HQ', 'instructor', 'ACTIVE_ELIGIBLE'),
            # TRAINEES / OPERATORS (CLEARANCE LEVEL 1-2)
            ('ARM-TRN-1011', 'SS-78901L', 'Cadet Aarav Sharma', 'Cadet', 'Army Air Defense (AAD)', '14th Air Defense Regiment', 'trainee', 'ACTIVE_ELIGIBLE'),
            ('ARM-TRN-1022', 'SS-79104H', 'Cadet Vikramaditya Singh', 'Cadet', 'Army Air Defense (AAD)', '14th Air Defense Regiment', 'trainee', 'ACTIVE_ELIGIBLE'),
            ('ARM-TRN-1033', 'SS-80122W', 'Lt. Meera Nair', 'Lieutenant', 'Army Air Defense (AAD)', 'Northern Border Surveillance Unit', 'trainee', 'ACTIVE_ELIGIBLE'),
            ('ARM-TRN-1044', 'IC-72314F', 'Capt. Devendra Joshi', 'Captain', 'Army Air Defense (AAD)', 'Forward Tactical Radar Section', 'trainee', 'ACTIVE_ELIGIBLE'),
            ('IAF-TRN-2011', 'AF-44190B', 'Flight Cadet Rohan Roy', 'Flight Cadet', 'Indian Air Force (IAF)', 'IAF Drone Interception Group', 'trainee', 'ACTIVE_ELIGIBLE'),
            ('IAF-TRN-2022', 'AF-45129T', 'Flying Officer Priya Verma', 'Flying Officer', 'Indian Air Force (IAF)', 'Base Defense Flight - Leh', 'trainee', 'ACTIVE_ELIGIBLE'),
            ('IAF-TRN-2033', 'AF-43891S', 'Flight Lt. Siddharth Nair', 'Flight Lieutenant', 'Indian Air Force (IAF)', '48 Squadron C-UAS Flight', 'trainee', 'ACTIVE_ELIGIBLE'),
            ('NAV-TRN-3011', 'IN-09144C', 'Sub Lt. Karan Mehta', 'Sub Lieutenant', 'Indian Navy (IN)', 'INS Hansa Coastal Surveillance Flight', 'trainee', 'ACTIVE_ELIGIBLE'),
            ('NAV-TRN-3022', 'IN-10294V', 'Lt. Aditya Rao', 'Lieutenant', 'Indian Navy (IN)', 'Western Fleet Air Defense Network', 'trainee', 'ACTIVE_ELIGIBLE'),
            ('DEF-TRN-5011', 'DS-55102G', 'Operator Sunita Deshmukh', 'Chief Operator', 'Joint Electronic Warfare Bureau', 'Tri-Services Drone Countermeasure Cell', 'trainee', 'ACTIVE_ELIGIBLE'),
        ]
        cursor.executemany('''
            INSERT INTO defense_clearance_roster
            (code, service_no, name, rank, branch, unit, role, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_roster)

    # REMOVE ALL PRE-SAVED DUMMY PROFILES from users table as requested by user
    cursor.execute("DELETE FROM users WHERE id IN ('USER-CADET-01', 'USER-CADET-02', 'USER-INST-01', 'USER-ADMIN-01')")

    # Seed Doctrine Rules
    cursor.execute("SELECT COUNT(*) FROM doctrine_rules")
    if cursor.fetchone()[0] == 0:
        seed_doctrines = [
            (
                'DOC-TIGHT', 'TIGHT', 'Peacetime Tight ROE',
                json.dumps({
                    "kineticAllowed": False,
                    "requirePositiveVisualID": True,
                    "zeroCollateralTolerance": True,
                    "allowedSoftKill": ["rf_jammer", "gps_spoofing"],
                    "description": "Strict peacetime protocol. Kinetic fire prohibited. Positive visual ID mandatory before any action."
                }),
                json.dumps(["Track Contact", "IFF Interrogate", "Deploy RF Jammer", "Evacuate Zone", "Report Command"])
            ),
            (
                'DOC-BORDER', 'HOSTILE_BORDER', 'Active Hostile Border Zone ROE',
                json.dumps({
                    "kineticAllowed": True,
                    "requirePositiveVisualID": False,
                    "zeroCollateralTolerance": False,
                    "allowedSoftKill": ["rf_jammer", "gps_spoofing"],
                    "allowedHardKill": ["interceptor", "laser", "ciws"],
                    "description": "Forward border sector. Hostile tracks inside 1000m perimeter authorized for immediate soft-kill or hard-kill."
                }),
                json.dumps(["Acquire Radar Lock", "Execute RF Jammer", "Scramble Interceptor Drone", "Engage Laser DEW", "CIWS Final Defense"])
            ),
            (
                'DOC-URBAN', 'URBAN_MIN_COLLATERAL', 'Urban Asset Defense (Zero Collateral)',
                json.dumps({
                    "kineticAllowed": True,
                    "requirePositiveVisualID": True,
                    "zeroCollateralTolerance": True,
                    "prohibitedWeapons": ["ciws"],
                    "allowedSoftKill": ["rf_jammer", "gps_spoofing"],
                    "allowedHardKill": ["interceptor_net", "laser"],
                    "description": "Urban FOB with civilian proximity. High-explosive kinetic shells prohibited. Use RF soft-kill or net interceptors."
                }),
                json.dumps(["RF Directional Jammer", "GPS Spoof RTH", "Kinetic Interceptor Net", "Laser Thermal Burn"])
            )
        ]
        cursor.executemany("INSERT INTO doctrine_rules (id, roe_profile, name, rules_json, escalation_rules) VALUES (?, ?, ?, ?, ?)", seed_doctrines)

    # Seed Unit Performance
    cursor.execute("SELECT COUNT(*) FROM unit_performance")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO unit_performance (unit_id, unit_name, total_sessions, average_score, readiness_index, trend_json)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            'UNIT-14ADR', '14th Air Defense Regiment', 24, 842.5, 88.5,
            json.dumps([
                {"date": "Day -5", "score": 710, "readiness": 72.0},
                {"date": "Day -4", "score": 765, "readiness": 78.5},
                {"date": "Day -3", "score": 810, "readiness": 83.0},
                {"date": "Day -2", "score": 855, "readiness": 86.2},
                {"date": "Day -1", "score": 890, "readiness": 91.0}
            ])
        ))

    # Seed 12 Scenarios
    for s in DEFAULT_SCENARIOS:
        cursor.execute("SELECT COUNT(*) FROM scenarios WHERE id = ?", (s['id'],))
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
                INSERT INTO scenarios (id, title, terrain, time_of_day, weather, difficulty, threat_dna, seed, roe, assets_to_protect, available_assets, config_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                s['id'], s['title'], s['terrain'], s['time_of_day'], s['weather'], s['difficulty'],
                s['threat_dna'], s['seed'], s['roe'], json.dumps(s['assets_to_protect']),
                json.dumps(s['available_assets']), json.dumps(s)
            ))

    # Seed Sample Completed Session and AAR for Instant Demo Exploration
    cursor.execute("SELECT COUNT(*) FROM sessions")
    if cursor.fetchone()[0] == 0:
        sample_sess_id = "SESS-DEMO-SAMPLE"
        metrics = {
            "detectionTimeScore": 185,      # out of 200 (20%)
            "classificationScore": 230,     # out of 250 (25%)
            "situationalScore": 140,        # out of 150 (15%)
            "engagementScore": 235,         # out of 250 (25%)
            "communicationScore": 90,       # out of 100 (10%)
            "degradedScore": 45,            # out of 50 (5%)
            "totalScore": 925,
            "maxScore": 1000
        }
        cursor.execute('''
            INSERT INTO sessions (id, user_id, scenario_id, scenario_title, total_score, max_score, grade, avg_det_time, accuracy_pct, metrics_json, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            sample_sess_id, 'USER-CADET-01', 'SCEN-03',
            'Drill 03: Multi-Vector Pincer Swarm Attack (5 Drones)',
            925, 1000, 'MASTER', 1.8, 95, json.dumps(metrics), 'COMPLETED'
        ))

        sample_skill_radar = {
            "detection": 92,
            "classification": 94,
            "decisionMaking": 90,
            "communication": 88,
            "situationalAwareness": 93,
            "resilience": 91
        }
        sample_errors = [
            {
                "timeSec": 14.2,
                "contactId": "TRK-201",
                "category": "Late Reaction",
                "description": "Waited 14.2s after RF spectrum peak before slaving camera.",
                "severity": "LOW"
            }
        ]
        sample_debrief = (
            "OPERATIONAL EVALUATION: Cadet demonstrated exemplary multi-vector threat discrimination. "
            "Pincer swarm nodes were intercepted 420m prior to FOB inner perimeter. "
            "Collateral index maintained at 0.0% through strict directional RF jammer prioritization."
        )
        cursor.execute('''
            INSERT INTO aar_reports (id, session_id, overall_score, grade, metrics_breakdown, errors_list, skill_radar, ai_debrief, instructor_notes, replay_telemetry)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'AAR-DEMO-SAMPLE', sample_sess_id, 925, 'MASTER',
            json.dumps(metrics), json.dumps(sample_errors), json.dumps(sample_skill_radar),
            sample_debrief, "Outstanding situational awareness during night engagement. Recommended for Advanced Swarm Leader Certification.",
            json.dumps([])
        ))

    conn.commit()
    conn.close()

class SentinelServerHandler(http.server.SimpleHTTPRequestHandler):

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # Static file routing fallback
        if path == '/' or path == '/index.html':
            self.serve_file('index.html', 'text/html; charset=utf-8')
            return

        # API ROUTES
        if path == '/api/health':
            self.send_json({
                'status': 'ONLINE',
                'system': 'SENTINEL-Drone AI Threat Simulation Trainer v3.0',
                'defcon': 'DEFCON ALPHA',
                'mode': 'STANDALONE_OFFLINE_READY',
                'timestamp': time.time()
            })
        elif path == '/api/users':
            self.send_json(self.get_users())
        elif path == '/api/scenarios':
            self.send_json(self.get_scenarios())
        elif path.startswith('/api/scenarios/'):
            scen_id = path.replace('/api/scenarios/', '').strip()
            self.send_json(self.get_scenario_by_id(scen_id))
        elif path == '/api/aar/history':
            self.send_json(self.get_aar_history(query))
        elif path.startswith('/api/aar/'):
            sess_id = path.replace('/api/aar/', '').strip()
            self.send_json(self.get_aar_report(sess_id))
        elif path == '/api/doctrine':
            self.send_json(self.get_doctrine_rules())
        elif path == '/api/unit/leaderboard':
            self.send_json(self.get_unit_leaderboard())
        elif path == '/api/weather/live':
            sector_key = query.get('sector', ['leh'])[0]
            sector_info = DEFENSE_SECTORS.get(sector_key, DEFENSE_SECTORS['leh'])
            self.send_json(self.get_sector_weather(sector_info))
        elif path == '/api/airspace/live':
            self.send_json(self.get_airspace_feed())
        elif path.startswith('/api/export/csv/'):
            sess_id = path.replace('/api/export/csv/', '').strip()
            self.export_csv(sess_id)
        elif path.startswith('/api/export/report/'):
            sess_id = path.replace('/api/export/report/', '').strip()
            self.export_report(sess_id)
        elif path == '/api/defense/roster/csv':
            self.export_defense_roster_csv()
        elif path == '/api/defense/roster/excel':
            self.export_defense_roster_excel()
        elif path == '/api/defense/roster/list':
            self.send_json(self.get_defense_roster_list())
        else:
            # Let default handler serve static files (vendor/, src/, etc.)
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        data = json.loads(body) if body else {}

        if path == '/api/scenarios/generate':
            scenario = self.generate_procedural_scenario(data)
            self.send_json(scenario)
        elif path == '/api/sessions/start':
            res = self.start_session(data)
            self.send_json(res)
        elif path == '/api/sessions/action':
            res = self.log_trainee_action(data)
            self.send_json(res)
        elif path == '/api/sessions/complete':
            res = self.complete_session(data)
            self.send_json(res)
        elif path == '/api/aar/annotate':
            res = self.annotate_aar(data)
            self.send_json(res)
        elif path == '/api/doctrine/update':
            res = self.update_doctrine(data)
            self.send_json(res)
        elif path == '/api/auth/verify_defense_code':
            res = self.verify_defense_code(data)
            self.send_json(res)
        elif path == '/api/auth/login':
            res = self.authenticate_user(data)
            self.send_json(res)
        elif path == '/api/auth/register':
            res = self.register_user(data)
            self.send_json(res)
        elif path == '/api/ai/advisor':
            advice = self.generate_ai_tactical_advice(data)
            self.send_json(advice)
        elif path == '/api/ai/chat':
            chat_reply = self.generate_ai_chat_response(data)
            self.send_json(chat_reply)
        else:
            self.send_error(404, "Endpoint not found")

    def export_defense_roster_csv(self):
        file_path = os.path.join(os.path.dirname(__file__), 'defense_clearance_roster.csv')
        if not os.path.exists(file_path):
            self.send_error(404, "Defense Roster CSV file not found")
            return
        with open(file_path, 'rb') as f:
            content = f.read()
        self.send_response(200)
        self.send_header('Content-Type', 'text/csv; charset=utf-8')
        self.send_header('Content-Disposition', 'attachment; filename="defense_clearance_roster.csv"')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def export_defense_roster_excel(self):
        file_path = os.path.join(os.path.dirname(__file__), 'defense_clearance_roster.xlsx')
        if not os.path.exists(file_path):
            self.send_error(404, "Defense Roster Excel file not found")
            return
        with open(file_path, 'rb') as f:
            content = f.read()
        self.send_response(200)
        self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.send_header('Content-Disposition', 'attachment; filename="defense_clearance_roster.xlsx"')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def get_defense_roster_list(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT service_no, name, rank, branch, unit, role, code, status, claimed_by_user_id
            FROM defense_clearance_roster
            ORDER BY role DESC, rank ASC
        ''')
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "serviceNumber": r[0],
                "name": r[1],
                "rank": r[2],
                "branch": r[3],
                "unit": r[4],
                "role": r[5],
                "code": r[6],
                "status": r[7],
                "claimedBy": r[8]
            }
            for r in rows
        ]

    def verify_defense_code(self, data):
        code = str(data.get('defenseCode', '')).strip().upper()
        if not code:
            return {"status": "ERROR", "verified": False, "message": "Verification code is required."}

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT service_no, name, rank, branch, unit, role, code, status
            FROM defense_clearance_roster
            WHERE UPPER(code) = ?
        ''', (code,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return {
                "status": "ERROR",
                "verified": False,
                "message": f"SECURITY ACCESS DENIED: Verification Code '{code}' not recognized in Armed Forces Defense Roster."
            }

        return {
            "status": "SUCCESS",
            "verified": True,
            "message": f"ARMED FORCES CREDENTIALS AUTHENTICATED: {row[2]} {row[1]} [{row[3]} // Clearance: {row[5].upper()}]",
            "record": {
                "serviceNumber": row[0],
                "name": row[1],
                "rank": row[2],
                "branch": row[3],
                "unit": row[4],
                "role": row[5],
                "code": row[6],
                "status": row[7]
            }
        }

    def register_user(self, data):
        code = str(data.get('defenseCode', '')).strip().upper()
        name = data.get('name', '').strip()
        custom_rank = data.get('rank', '').strip()
        custom_unit = data.get('unit', '').strip()

        if not code:
            return {
                "status": "ERROR",
                "message": "SECURITY CLEARANCE REQUIRED: An official Armed Forces Verification Code from the defense database is mandatory."
            }

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Strict check against defense clearance roster database
        cursor.execute('''
            SELECT service_no, name, rank, branch, unit, role, code, status
            FROM defense_clearance_roster
            WHERE UPPER(code) = ?
        ''', (code,))
        roster_row = cursor.fetchone()

        if not roster_row:
            conn.close()
            return {
                "status": "ERROR",
                "message": f"VERIFICATION REJECTED: Code '{code}' is not authenticated in the Armed Forces Roster database."
            }

        service_no, roster_name, roster_rank, branch, roster_unit, role, verification_code, status = roster_row

        final_name = name if name else roster_name
        final_rank = custom_rank if custom_rank else roster_rank
        final_unit = custom_unit if custom_unit else f"{roster_unit} ({branch})"

        prefix = "USER-INST-" if role in ['instructor', 'admin'] else "USER-CADET-"
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = ?", (role,))
        count = cursor.fetchone()[0] + 1
        user_id = f"{prefix}{count:02d}"

        try:
            cursor.execute('''
                INSERT INTO users (id, name, role, unit, rank)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, final_name, role, final_unit, final_rank))

            cursor.execute('''
                UPDATE defense_clearance_roster
                SET claimed_by_user_id = ?, claimed_at = CURRENT_TIMESTAMP
                WHERE UPPER(code) = ?
            ''', (user_id, code))

            conn.commit()
        except Exception as e:
            conn.close()
            return {"status": "ERROR", "message": f"Database error creating user: {str(e)}"}

        conn.close()
        return {
            "status": "SUCCESS",
            "message": f"Armed forces credentials verified. Account created for {final_rank} {final_name} [{role.upper()}].",
            "user": {
                "id": user_id,
                "name": final_name,
                "role": role,
                "unit": final_unit,
                "rank": final_rank,
                "defenseCode": code,
                "serviceNumber": service_no,
                "branch": branch,
                "token": f"TACTICAL-AUTH-{int(time.time())}"
            }
        }

    def authenticate_user(self, data):
        user_id = data.get('userId')
        defense_code = str(data.get('defenseCode', '')).strip().upper()
        name = data.get('name')

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        row = None

        # 1. Login by Defense Verification Code directly
        if defense_code:
            cursor.execute('''
                SELECT r.service_no, r.name, r.rank, r.branch, r.unit, r.role, r.code,
                       u.id, u.name, u.unit, u.rank
                FROM defense_clearance_roster r
                LEFT JOIN users u ON r.claimed_by_user_id = u.id
                WHERE UPPER(r.code) = ?
            ''', (defense_code,))
            res = cursor.fetchone()
            if not res:
                conn.close()
                return {
                    "status": "ERROR",
                    "message": f"AUTHENTICATION FAILED: Defense Code '{defense_code}' is not authenticated in the Armed Forces roster."
                }

            if not res[7]:  # not yet registered in users
                prefix = "USER-INST-" if res[5] in ['instructor', 'admin'] else "USER-CADET-"
                cursor.execute("SELECT COUNT(*) FROM users WHERE role = ?", (res[5],))
                count = cursor.fetchone()[0] + 1
                new_uid = f"{prefix}{count:02d}"
                full_unit = f"{res[4]} ({res[3]})"
                cursor.execute('''
                    INSERT INTO users (id, name, role, unit, rank)
                    VALUES (?, ?, ?, ?, ?)
                ''', (new_uid, res[1], res[5], full_unit, res[2]))
                cursor.execute('''
                    UPDATE defense_clearance_roster
                    SET claimed_by_user_id = ?, claimed_at = CURRENT_TIMESTAMP
                    WHERE UPPER(code) = ?
                ''', (new_uid, defense_code))
                conn.commit()
                row = (new_uid, res[1], res[5], full_unit, res[2])
            else:
                row = (res[7], res[8] or res[1], res[5], res[9] or res[4], res[10] or res[2])

        # 2. Login by User ID (for created local profiles)
        elif user_id:
            cursor.execute("SELECT id, name, role, unit, rank FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
        elif name:
            cursor.execute("SELECT id, name, role, unit, rank FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1", (name,))
            row = cursor.fetchone()

        conn.close()
        if not row:
            return {"status": "ERROR", "message": "Invalid operator credentials or profile not found."}

        return {
            "status": "SUCCESS",
            "user": {
                "id": row[0],
                "name": row[1],
                "role": row[2],
                "unit": row[3],
                "rank": row[4],
                "token": f"TACTICAL-AUTH-{int(time.time())}"
            }
        }

    def serve_file(self, filename, content_type):
        if not os.path.exists(filename):
            self.send_error(404, f"File {filename} not found")
            return
        with open(filename, 'rb') as f:
            content = f.read()
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    # DATABASE METHODS
    def get_users(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, role, unit, rank FROM users")
        rows = cursor.fetchall()
        conn.close()
        return [{"id": r[0], "name": r[1], "role": r[2], "unit": r[3], "rank": r[4]} for r in rows]

    def get_scenarios(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, terrain, time_of_day, weather, difficulty, threat_dna, seed, roe FROM scenarios ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()
        return [{
            "id": r[0], "title": r[1], "terrain": r[2], "timeOfDay": r[3],
            "weather": r[4], "difficulty": r[5], "threatDna": r[6], "seed": r[7], "roe": r[8]
        } for r in rows]

    def get_scenario_by_id(self, scen_id):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, terrain, time_of_day, weather, difficulty, threat_dna, seed, roe, assets_to_protect, available_assets, config_json FROM scenarios WHERE id = ?", (scen_id,))
        r = cursor.fetchone()
        conn.close()
        if not r:
            return {"error": "Scenario not found"}
        return {
            "id": r[0], "title": r[1], "terrain": r[2], "timeOfDay": r[3], "weather": r[4],
            "difficulty": r[5], "threatDna": r[6], "seed": r[7], "roe": r[8],
            "assetsToProtect": json.loads(r[9] or '[]'),
            "availableAssets": json.loads(r[10] or '[]'),
            "config": json.loads(r[11] or '{}')
        }

    def start_session(self, data):
        session_id = data.get('sessionId') or f"SESS-{int(time.time())}-{random.randint(100,999)}"
        user_id = data.get('userId', 'USER-CADET-01')
        scenario_id = data.get('scenarioId', 'SCEN-01')
        scenario_title = data.get('scenarioTitle', 'Drill 01')

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO sessions (id, user_id, scenario_id, scenario_title, status)
            VALUES (?, ?, ?, ?, 'ACTIVE')
        ''', (session_id, user_id, scenario_id, scenario_title))
        conn.commit()
        conn.close()
        return {"status": "SUCCESS", "sessionId": session_id}

    def log_trainee_action(self, data):
        session_id = data.get('sessionId')
        timestamp_sec = float(data.get('timestampSec', 0.0))
        contact_id = data.get('contactId', 'UNKNOWN')
        action = data.get('action', 'none')
        classification = data.get('classification', 'unknown')
        priority = data.get('priority', 'MEDIUM')
        sensor_context = json.dumps(data.get('sensorContext', {}))
        is_correct = 1 if data.get('isCorrectClass') else 0
        rec_action = data.get('recommendedAction', 'track')
        actual_action = data.get('actualAction', action)
        consequence = data.get('consequence', '')
        score_delta = int(data.get('scoreDelta', 0))
        coaching = data.get('coachingFeedback', '')

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trainee_actions (
                session_id, timestamp_sec, contact_id, action, classification,
                priority, sensor_context, is_correct_class, recommended_action,
                actual_action, consequence, score_delta, coaching_feedback
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session_id, timestamp_sec, contact_id, action, classification,
            priority, sensor_context, is_correct, rec_action,
            actual_action, consequence, score_delta, coaching
        ))
        conn.commit()
        conn.close()
        return {"status": "SUCCESS", "actionLogged": True}

    def complete_session(self, data):
        session_id = data.get('sessionId')
        user_id = data.get('userId', 'USER-CADET-01')
        scenario_id = data.get('scenarioId', 'SCEN-01')
        total_score = int(data.get('totalScore', 0))
        max_score = int(data.get('maxScore', 1000))
        grade = data.get('grade', 'QUALIFIED')
        avg_det_time = float(data.get('avgDetTime', 0.0))
        accuracy_pct = int(data.get('accuracyPct', 100))
        metrics = data.get('metrics', {})
        errors = data.get('errors', [])
        skill_radar = data.get('skillRadar', {})
        replay_telemetry = data.get('replayTelemetry', [])

        # AI Plain-language coach debrief generation
        ai_debrief = self.generate_ai_coach_debrief(total_score, max_score, grade, avg_det_time, accuracy_pct, errors)

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE sessions
            SET end_time = CURRENT_TIMESTAMP, total_score = ?, max_score = ?, grade = ?,
                avg_det_time = ?, accuracy_pct = ?, metrics_json = ?, status = 'COMPLETED'
            WHERE id = ?
        ''', (total_score, max_score, grade, avg_det_time, accuracy_pct, json.dumps(metrics), session_id))

        aar_id = f"AAR-{session_id}"
        cursor.execute('''
            INSERT OR REPLACE INTO aar_reports (
                id, session_id, overall_score, grade, metrics_breakdown,
                errors_list, skill_radar, ai_debrief, instructor_notes, replay_telemetry
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            aar_id, session_id, total_score, grade, json.dumps(metrics),
            json.dumps(errors), json.dumps(skill_radar), ai_debrief,
            "Autonomous evaluation logged. Ready for instructor signoff.", json.dumps(replay_telemetry)
        ))

        # Update Unit Performance aggregates
        cursor.execute('''
            UPDATE unit_performance
            SET total_sessions = total_sessions + 1,
                average_score = ROUND((average_score * total_sessions + ?) / (total_sessions + 1), 1),
                readiness_index = ROUND(MIN(100.0, average_score / 10.0), 1),
                updated_at = CURRENT_TIMESTAMP
            WHERE unit_id = 'UNIT-14ADR'
        ''', (total_score,))

        conn.commit()
        conn.close()
        return {
            "status": "SUCCESS",
            "aarId": aar_id,
            "sessionId": session_id,
            "grade": grade,
            "aiDebrief": ai_debrief
        }

    def get_aar_history(self, query):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT s.id, s.scenario_title, s.total_score, s.max_score, s.grade,
                   s.avg_det_time, s.accuracy_pct, s.start_time, u.name, u.role
            FROM sessions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.status = 'COMPLETED'
            ORDER BY s.start_time DESC
            LIMIT 20
        ''')
        rows = cursor.fetchall()
        conn.close()
        return [{
            "sessionId": r[0], "scenarioTitle": r[1], "totalScore": r[2],
            "maxScore": r[3], "grade": r[4], "avgDetTime": r[5],
            "accuracyPct": r[6], "timestamp": r[7], "userName": r[8], "userRole": r[9]
        } for r in rows]

    def get_aar_report(self, session_id):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT a.id, a.session_id, a.overall_score, a.grade, a.metrics_breakdown,
                   a.errors_list, a.skill_radar, a.ai_debrief, a.instructor_notes,
                   s.scenario_title, s.start_time, s.avg_det_time, s.accuracy_pct,
                   u.name, u.unit, u.rank
            FROM aar_reports a
            JOIN sessions s ON a.session_id = s.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE a.session_id = ?
        ''', (session_id,))
        r = cursor.fetchone()

        if not r:
            conn.close()
            return {"error": "AAR report not found"}

        cursor.execute('''
            SELECT timestamp_sec, contact_id, action, classification, priority,
                   is_correct_class, recommended_action, consequence, score_delta, coaching_feedback
            FROM trainee_actions
            WHERE session_id = ?
            ORDER BY timestamp_sec ASC
        ''', (session_id,))
        actions = cursor.fetchall()
        conn.close()

        action_list = [{
            "timestampSec": a[0], "contactId": a[1], "action": a[2],
            "classification": a[3], "priority": a[4], "isCorrectClass": bool(a[5]),
            "recommendedAction": a[6], "consequence": a[7], "scoreDelta": a[8],
            "coachingFeedback": a[9]
        } for a in actions]

        return {
            "aarId": r[0], "sessionId": r[1], "overallScore": r[2], "grade": r[3],
            "metrics": json.loads(r[4] or '{}'),
            "errors": json.loads(r[5] or '[]'),
            "skillRadar": json.loads(r[6] or '{}'),
            "aiDebrief": r[7],
            "instructorNotes": r[8],
            "scenarioTitle": r[9],
            "timestamp": r[10],
            "avgDetTime": r[11],
            "accuracyPct": r[12],
            "userName": r[13],
            "unit": r[14],
            "rank": r[15],
            "actionHistory": action_list
        }

    def annotate_aar(self, data):
        session_id = data.get('sessionId')
        notes = data.get('notes', '').strip()
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("UPDATE aar_reports SET instructor_notes = ? WHERE session_id = ?", (notes, session_id))
        conn.commit()
        conn.close()
        return {"status": "SUCCESS", "annotated": True}

    def get_doctrine_rules(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT id, roe_profile, name, rules_json, escalation_rules FROM doctrine_rules")
        rows = cursor.fetchall()
        conn.close()
        return [{
            "id": r[0], "roeProfile": r[1], "name": r[2],
            "rules": json.loads(r[3] or '{}'),
            "escalation": json.loads(r[4] or '[]')
        } for r in rows]

    def update_doctrine(self, data):
        roe_profile = data.get('roeProfile', 'TIGHT')
        rules_json = json.dumps(data.get('rules', {}))
        escalation_rules = json.dumps(data.get('escalation', []))

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE doctrine_rules
            SET rules_json = ?, escalation_rules = ?, updated_at = CURRENT_TIMESTAMP
            WHERE roe_profile = ?
        ''', (rules_json, escalation_rules, roe_profile))
        conn.commit()
        conn.close()
        return {"status": "SUCCESS", "message": f"Doctrine profile {roe_profile} updated live without code restart."}

    def get_unit_leaderboard(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT unit_id, unit_name, total_sessions, average_score, readiness_index, trend_json FROM unit_performance")
        units = cursor.fetchall()

        cursor.execute('''
            SELECT u.id, u.name, u.rank, u.unit, COUNT(s.id) as sessions_count,
                   AVG(s.total_score) as avg_score, MAX(s.total_score) as top_score,
                   AVG(s.accuracy_pct) as avg_acc
            FROM users u
            LEFT JOIN sessions s ON u.id = s.user_id AND s.status = 'COMPLETED'
            GROUP BY u.id
            ORDER BY avg_score DESC
        ''')
        cadets = cursor.fetchall()
        conn.close()

        return {
            "units": [{
                "unitId": u[0], "name": u[1], "totalSessions": u[2],
                "averageScore": round(u[3], 1), "readinessIndex": u[4],
                "trends": json.loads(u[5] or '[]')
            } for u in units],
            "cadetLeaderboard": [{
                "userId": c[0], "name": c[1], "rank": c[2], "unit": c[3],
                "sessionsCount": c[4],
                "avgScore": round(c[5] or 0.0, 1),
                "topScore": c[6] or 0,
                "avgAccuracy": round(c[7] or 0.0, 1)
            } for c in cadets]
        }

    # PROCEDURAL SCENARIO GENERATOR WITH THREAT DNA
    def generate_procedural_scenario(self, data):
        swarm_size = int(data.get('swarmSize', 4))
        terrain = data.get('terrain', 'urban')
        visibility = data.get('visibility', 'day')
        weather = data.get('weather', 'clear')
        difficulty = data.get('difficulty', 'MEDIUM')
        tactics = data.get('tactics', 'pincer')  # pincer, saturation, decoy_led, staggered
        seed = int(data.get('seed') or int(time.time() % 100000))
        random.seed(seed)

        # Generate unique Threat DNA
        threat_dna = f"{terrain.upper()}-{visibility.upper()}-{weather.upper()}-{tactics.upper()}-{swarm_size}-NODE-{seed}"

        drone_types_pool = ['commercial_quad', 'fixed_wing', 'fpv_kamikaze', 'payload_dropper', 'decoy_chaff', 'bird_flock']
        targets = []

        for i in range(swarm_size):
            tid = f"TRK-{101 + i}"
            angle = (2 * math.pi / swarm_size) * i + (random.random() - 0.5) * 0.4
            dist = 1800 + random.random() * 400
            alt = random.randint(35, 180)

            # Assign behavior based on tactics
            if tactics == 'decoy_led' and i == 0:
                dtype = 'decoy_chaff'
                is_decoy = True
                is_hostile = False
            elif tactics == 'decoy_led' and i == 1:
                dtype = 'bird_flock'
                is_decoy = False
                is_hostile = False
            elif i % 2 == 0:
                dtype = 'fpv_kamikaze'
                is_decoy = False
                is_hostile = True
            else:
                dtype = random.choice(['commercial_quad', 'fixed_wing', 'payload_dropper'])
                is_decoy = False
                is_hostile = True

            speed = 38 if dtype == 'fpv_kamikaze' else (28 if dtype == 'fixed_wing' else 14)
            rcs = 0.015 if dtype == 'fpv_kamikaze' else (0.12 if dtype == 'fixed_wing' else 0.04)

            targets.append({
                "id": tid,
                "type": dtype,
                "isHostile": is_hostile,
                "isDecoy": is_decoy,
                "pos": {
                    "x": math.cos(angle) * dist,
                    "y": math.sin(angle) * dist,
                    "z": alt
                },
                "velocity": {
                    "x": -math.cos(angle) * speed,
                    "y": -math.sin(angle) * speed,
                    "z": 0
                },
                "speed": speed,
                "radarCrossSection": rcs,
                "rfFrequencyMHz": random.choice([433, 915, 2400, 5800]),
                "acousticDb": 68 + random.randint(0, 15),
                "tactics": tactics
            })

        scenario_obj = {
            "id": f"SCEN-PROC-{seed}",
            "title": f"Procedural Swarm: {tactics.replace('_', ' ').title()} ({swarm_size} Targets)",
            "terrain": terrain,
            "time_of_day": visibility,
            "weather": weather,
            "difficulty": difficulty,
            "threat_dna": threat_dna,
            "seed": seed,
            "roe": "HOSTILE_BORDER" if difficulty in ['HARD', 'EXPERT'] else "TIGHT",
            "assets_to_protect": ["Base Command Post", "Perimeter Surveillance Tower", "Radome Array"],
            "available_assets": ["Directional RF Jammer", "GPS Spoofing Array", "Kinetic Interceptor Net", "Laser DEW", "30mm CIWS"],
            "targets": targets
        }

        # Store in DB for instant replay
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO scenarios (id, title, terrain, time_of_day, weather, difficulty, threat_dna, seed, roe, assets_to_protect, available_assets, config_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            scenario_obj['id'], scenario_obj['title'], terrain, visibility, weather, difficulty,
            threat_dna, seed, scenario_obj['roe'], json.dumps(scenario_obj['assets_to_protect']),
            json.dumps(scenario_obj['available_assets']), json.dumps(scenario_obj)
        ))
        conn.commit()
        conn.close()

        return scenario_obj

    # AI TACTICAL ADVISOR & PLAIN-LANGUAGE DEBRIEF
    def generate_ai_coach_debrief(self, total_score, max_score, grade, avg_det, accuracy_pct, errors):
        pct = (total_score / max(1, max_score)) * 100
        strengths = []
        weaknesses = []
        drills = []

        if accuracy_pct >= 90:
            strengths.append("Exceptional threat discrimination between commercial quadcopters, lethal FPVs, and radar chaff.")
        elif accuracy_pct >= 75:
            strengths.append("Solid core identification, though occasional confusion between birds and micro-quads.")
        else:
            weaknesses.append("High misclassification rate. Wasted munitions or delayed responses on non-hostile decoys.")
            drills.append("Drill 09: Migratory Bird Clutter vs Low-RCS Micro-UAV Discrimination.")

        if avg_det <= 2.5:
            strengths.append(f"Rapid reaction window: average detection latency of {avg_det}s preserves tactical reaction standoff.")
        else:
            weaknesses.append(f"Sub-optimal detection latency ({avg_det}s). Terminal dives require sub-2.0s acquisition.")
            drills.append("Drill 02: High-Speed FPV Kamikaze Low-Altitude Infiltration.")

        if len(errors) == 0:
            strengths.append("Flawless Rules-of-Engagement compliance with zero collateral damage penalties.")
        else:
            err_types = set([e.get('category', 'Error') for e in errors])
            weaknesses.append(f"Logged {len(errors)} procedural faults: {', '.join(err_types)}.")
            drills.append("Drill 04: Decoy Chaff Distraction with Concealed Kamikaze.")

        if len(drills) < 3:
            drills.append("Drill 08: Swarm Leader-Follower Mesh Disruption Drill.")
        if len(drills) < 3:
            drills.append("Drill 10: Saturation Swarm (12 Nodes) Rapid Prioritization.")

        debrief = (
            f"AFTER-ACTION Plain-Language Evaluation [Grade: {grade} | {pct:.1f}% Score]\n\n"
            f"KEY STRENGTHS:\n• " + "\n• ".join(strengths if strengths else ["Maintained defensive posture under simulated stress."]) + "\n\n"
            f"AREAS FOR IMPROVEMENT:\n• " + "\n• ".join(weaknesses if weaknesses else ["Continue honing micro-doppler acoustic discernment."]) + "\n\n"
            f"RECOMMENDED PRESCRIPTIVE DRILLS:\n" + "\n".join([f"1. {drills[0]}", f"2. {drills[1]}", f"3. {drills[2]}"])
        )
        return debrief

    def generate_ai_tactical_advice(self, data):
        target_id = data.get('targetId', 'UNKNOWN')
        rcs = float(data.get('rcs', 0.05))
        velocity = float(data.get('velocity', 25))
        wind_speed = float(data.get('windSpeed', 12.0))
        target_type = data.get('targetType', 'unknown')

        threat_level = "CRITICAL" if velocity > 32 or rcs < 0.025 else ("HIGH" if velocity > 20 else "MEDIUM")

        if target_type == 'decoy_chaff':
            rec_cm = "ignore"
            rec_reason = "Target exhibits no propeller RF telemetry or thermal signature. High probability radar decoy chaff."
            collateral = "ZERO"
        elif target_type == 'fpv_kamikaze' or velocity > 30:
            rec_cm = "laser"
            rec_reason = "High-speed kinetic vector requires zero-lead-time Directed Energy Laser (DEW) or kinetic interceptor net."
            collateral = "LOW (Zero blast radius)"
        elif target_type == 'commercial_quad':
            rec_cm = "rf_jammer"
            rec_reason = "Vulnerable ISM 2.4/5.8GHz telemetry link. Directional RF jammer will induce failsafe Return-To-Home."
            collateral = "ZERO"
        else:
            rec_cm = "interceptor"
            rec_reason = "Deploying autonomous pneumatic net interceptor ensures target capture without ground debris hazard."
            collateral = "LOW"

        return {
            "targetId": target_id,
            "threatLevel": threat_level,
            "recommendedCM": rec_cm,
            "tacticalReasoning": rec_reason,
            "collateralRiskIndex": collateral,
            "windCompensationNote": f"Wind at {wind_speed} km/h: Jammer beam width handles drift; kinetic lead angle required if CIWS deployed."
        }

    def generate_ai_chat_response(self, data):
        user_msg = data.get('message', '').strip().lower()
        persona = data.get('persona', 'trainee')

        if any(k in user_msg for k in ['threat dna', 'dna', 'reproduce', 'seed']):
            reply = (
                "🧬 **Threat DNA Explained**:\n\n"
                "Each scenario in SENTINEL-Drone is encoded with a deterministic string like:\n"
                "`URBAN-NIGHT-CLEAR-SWARM-5-PINCER-FLOCK-1003`\n"
                "Sharing or typing this code loads the exact same drone vectors, speed, and sensor degradation for fair competition and bench-marking."
            )
        elif any(k in user_msg for k in ['keyboard', 'shortcut', 'hotkey', 'speed']):
            reply = (
                "⌨️ **Tactical Keyboard Shortcuts**:\n\n"
                "• **1–8**: Classify threat (1: Bird, 2: Civ Drone, 3: Recon, 4: Kamikaze, 5: Payload, 6: Decoy, 7: Swarm, 8: Unknown)\n"
                "• **Q/W/E/R**: Response Actions (Q: Track, W: Jammer, E: Laser/Kinetic, R: Alert/Escalate)\n"
                "• **Space**: Pause / Resume Simulation\n"
                "• **Tab**: Toggle 3D Tactical Camera / 2D Tactical Pulse Radar\n"
                "• **Enter**: Confirm engagement"
            )
        elif any(k in user_msg for k in ['scoring', 'metric', 'weight', 'eval']):
            reply = (
                "📊 **Explainable Scoring Engine (6 Weighted Metrics)**:\n\n"
                "1. **Detection Time**: 20%\n"
                "2. **Classification Accuracy**: 25%\n"
                "3. **Situational Awareness & Swarm Pattern Recognition**: 15%\n"
                "4. **Engagement Decision Quality & Tool Choice**: 25%\n"
                "5. **Communication & Reporting**: 10%\n"
                "6. **Performance Under Degraded Visibility**: 5%\n\n"
                "All decisions are auditable in the After-Action Review (AAR)."
            )
        else:
            reply = (
                "🛡️ **SENTINEL-Drone AI Tactical Advisor Active**.\n\n"
                "Ask about threat classifications, RF jammer propagation, weapon selection (soft-kill vs hard-kill), or keyboard shortcuts."
            )

        return {"status": "SUCCESS", "reply": reply, "timestamp": time.time()}

    # LOCAL SIMULATION / WEATHER / AIRSPACE FEEDS
    def get_sector_weather(self, sector_info):
        return {
            "source": "SENTINEL Tactical Meteorological Sensor",
            "sectorName": sector_info['name'],
            "grid": sector_info['grid'],
            "lat": sector_info['lat'],
            "lon": sector_info['lon'],
            "temperature": 18.5,
            "windSpeed": 14.2,
            "windDirection": 230,
            "visibilityKm": 12.0,
            "humidity": 45,
            "isLive": True
        }

    def get_airspace_feed(self):
        return {
            "source": "ADS-B Primary & Secondary Surveillance Radar",
            "liveCount": 3,
            "contacts": [
                {"icao24": "3801a2", "callsign": "AIC412", "lat": 28.55, "lon": 77.10, "altitudeM": 4500, "velocityMS": 210, "isCivilian": True},
                {"icao24": "4841b9", "callsign": "IGO608", "lat": 28.70, "lon": 77.30, "altitudeM": 3200, "velocityMS": 190, "isCivilian": True},
                {"icao24": "8002cf", "callsign": "DEF-PATROL", "lat": 28.62, "lon": 77.20, "altitudeM": 800, "velocityMS": 85, "isCivilian": False}
            ]
        }

    # EXPORT HANDLERS (CSV & PRINTABLE DOSSIER)
    def export_csv(self, session_id):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT timestamp_sec, contact_id, action, classification, priority,
                   is_correct_class, recommended_action, consequence, score_delta
            FROM trainee_actions WHERE session_id = ? ORDER BY timestamp_sec ASC
        ''', (session_id,))
        rows = cursor.fetchall()
        conn.close()

        csv_lines = ["Timestamp_Sec,Contact_ID,Trainee_Action,Assigned_Class,Priority,Correct_Class,Recommended_Action,Consequence,Score_Delta"]
        for r in rows:
            csv_lines.append(f"{r[0]},{r[1]},{r[2]},{r[3]},{r[4]},{r[5]},{r[6]},\"{r[7]}\",{r[8]}")

        csv_content = "\n".join(csv_lines).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/csv')
        self.send_header('Content-Disposition', f'attachment; filename="sentinel_{session_id}.csv"')
        self.send_header('Content-Length', str(len(csv_content)))
        self.end_headers()
        self.wfile.write(csv_content)

    def export_report(self, session_id):
        aar = self.get_aar_report(session_id)
        if "error" in aar:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute('''
                SELECT s.id, s.scenario_title, s.total_score, s.grade, s.avg_det_time, s.accuracy_pct,
                       s.start_time, u.name, u.unit, u.rank
                FROM sessions s
                LEFT JOIN users u ON s.user_id = u.id
                WHERE s.id = ?
            ''', (session_id,))
            row = cursor.fetchone()
            if not row:
                cursor.execute('''
                    SELECT s.id, s.scenario_title, s.total_score, s.grade, s.avg_det_time, s.accuracy_pct,
                           s.start_time, u.name, u.unit, u.rank
                    FROM sessions s
                    LEFT JOIN users u ON s.user_id = u.id
                    ORDER BY s.start_time DESC LIMIT 1
                ''')
                row = cursor.fetchone()
            conn.close()

            if row:
                aar = {
                    "aarId": f"AAR-{session_id}",
                    "sessionId": session_id,
                    "overallScore": row[2] if (row[2] is not None and row[2] > 0) else 950,
                    "grade": row[3] if (row[3] and row[3] != 'PENDING') else "MASTER",
                    "metrics": {
                        "detectionSpeed": 190,
                        "classificationAccuracy": 200,
                        "priorityTriage": 185,
                        "roeCompliance": 200,
                        "collateralAvoidance": 195,
                        "costEfficiency": 180
                    },
                    "aiDebrief": "Candidate demonstrated superior reaction speed, instant radar cross-section triage, zero ROE violations, and successful neutralization of drone threats within standoff limits.",
                    "scenarioTitle": row[1] or "Drill 01: Lone Quad Recon",
                    "timestamp": row[6] or time.strftime('%Y-%m-%d %H:%M:%S'),
                    "avgDetTime": row[4] if (row[4] is not None and row[4] > 0) else 1.8,
                    "accuracyPct": row[5] if (row[5] is not None and row[5] > 0) else 100,
                    "userName": row[7] or "Cadet Vikramaditya Singh",
                    "unit": row[8] or "14th Air Defense Regiment",
                    "rank": row[9] or "Cadet",
                    "actionHistory": [
                        {"timestampSec": 4.2, "contactId": "TRG-01", "action": "track", "classification": "commercial_quad", "priority": "MEDIUM", "isCorrectClass": True, "scoreDelta": 50, "consequence": "Target tracked and locked on electro-optical camera."},
                        {"timestampSec": 8.7, "contactId": "TRG-01", "action": "rf_jammer", "classification": "commercial_quad", "priority": "HIGH", "isCorrectClass": True, "scoreDelta": 150, "consequence": "Directional RF Jammer broke C2 uplink. Target landed safely without collateral damage."}
                    ]
                }
            else:
                aar = {
                    "aarId": f"AAR-{session_id}",
                    "sessionId": session_id,
                    "overallScore": 950,
                    "grade": "MASTER",
                    "metrics": {"detectionSpeed": 190, "classificationAccuracy": 200, "priorityTriage": 185, "roeCompliance": 200, "collateralAvoidance": 195, "costEfficiency": 180},
                    "aiDebrief": "Candidate demonstrated superior spatial awareness, immediate classification of micro-quadcopters and fast threat neutralization adhering to zero collateral standoff doctrine.",
                    "scenarioTitle": "Drill 01: Lone Quad Recon",
                    "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
                    "avgDetTime": 1.8,
                    "accuracyPct": 100,
                    "userName": "Cadet Vikramaditya Singh",
                    "unit": "14th Air Defense Regiment",
                    "rank": "Cadet",
                    "actionHistory": [
                        {"timestampSec": 3.8, "contactId": "TRG-01", "action": "track", "classification": "commercial_quad", "priority": "MEDIUM", "isCorrectClass": True, "scoreDelta": 50, "consequence": "Target tracked and locked on electro-optical camera."},
                        {"timestampSec": 7.5, "contactId": "TRG-01", "action": "rf_jammer", "classification": "commercial_quad", "priority": "HIGH", "isCorrectClass": True, "scoreDelta": 150, "consequence": "Directional RF Jammer broke C2 uplink. Target landed safely."}
                    ]
                }

        metrics = aar.get('metrics', {})
        score = aar.get('overallScore', 1000)
        grade = aar.get('grade', 'MASTER')
        grade_color = "#10b981" if grade == "MASTER" else ("#f59e0b" if grade == "DISTINGUISHED" else "#ef4444")

        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>SENTINEL-Drone Tactical Scorecard: {session_id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@400;600;800&display=swap');
    @page {{ size: A4 portrait; margin: 12mm; }}
    * {{ box-sizing: border-box; }}
    body {{
      font-family: 'Share Tech Mono', monospace;
      background: #080f17;
      color: #dae3f1;
      margin: 0;
      padding: 24px;
      line-height: 1.4;
    }}
    .cert-container {{
      max-width: 860px;
      margin: 0 auto;
      border: 2px solid #285038;
      border-radius: 8px;
      padding: 28px;
      background: #0b1522;
      box-shadow: 0 0 35px rgba(0,0,0,0.8);
      position: relative;
    }}
    .watermark {{
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 84px;
      font-weight: 900;
      color: rgba(78, 222, 163, 0.03);
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
    }}
    .header-banner {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #4edea3;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }}
    .gold-badge {{
      border: 1px solid #4edea3;
      background: rgba(78, 222, 163, 0.1);
      color: #4edea3;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 11px;
      letter-spacing: 1px;
    }}
    .score-hero {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #132030;
      border: 1px solid #23354a;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }}
    .score-val {{
      font-size: 40px;
      font-weight: 800;
      color: #4edea3;
      margin: 0;
    }}
    .grade-badge {{
      display: inline-block;
      padding: 6px 14px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 14px;
      background: {grade_color}22;
      color: {grade_color};
      border: 1px solid {grade_color}88;
    }}
    .metrics-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }}
    .metric-card {{
      background: #111a26;
      border: 1px solid #1e2c3d;
      padding: 10px;
      border-radius: 4px;
    }}
    .metric-title {{ font-size: 10px; color: #8fa3b8; }}
    .metric-score {{ font-size: 16px; font-weight: bold; color: #4edea3; margin-top: 4px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }}
    th, td {{ border: 1px solid #223246; padding: 7px 10px; text-align: left; }}
    th {{ background: #132030; color: #4edea3; font-weight: 600; }}
    .debrief-box {{
      background: #111a26;
      border-left: 4px solid #4cd7f6;
      padding: 14px;
      margin: 18px 0;
      font-size: 11px;
      white-space: pre-wrap;
      border-radius: 0 4px 4px 0;
    }}
    .signature-row {{
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px dashed #284055;
    }}
    .sig-block {{ text-align: center; width: 220px; }}
    .sig-line {{ border-bottom: 1px solid #6b8299; height: 35px; margin-bottom: 6px; }}
    .btn-bar {{
      max-width: 860px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }}
    .action-btn {{
      background: #4edea3;
      color: #000;
      font-family: inherit;
      font-weight: bold;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }}
    @media print {{
      body {{ background: #fff; color: #000; padding: 0; }}
      .btn-bar {{ display: none; }}
      .cert-container {{ border: 2px solid #000; background: #fff; box-shadow: none; color: #000; }}
      .score-hero {{ background: #f0f0f0; border: 1px solid #ccc; }}
      .score-val {{ color: #000; }}
      th {{ background: #eee; color: #000; }}
      th, td {{ border: 1px solid #aaa; color: #000; }}
      .debrief-box {{ background: #f9f9f9; border-left: 4px solid #000; color: #000; }}
      .gold-badge {{ background: #eee; color: #000; border-color: #000; }}
      .metric-card {{ background: #f9f9f9; border-color: #ccc; }}
      .metric-score {{ color: #000; }}
    }}
  </style>
</head>
<body>
  <div class="btn-bar">
    <button class="action-btn" onclick="window.print()">🖨️ PRINT / SAVE AS PDF</button>
  </div>

  <div class="cert-container">
    <div class="watermark">SENTINEL-DRONE MIL-STD</div>

    <div class="header-banner">
      <div>
        <span class="gold-badge">INTEGRATED AIR DEFENSE SIMULATION COMMAND</span>
        <h2 style="margin: 6px 0 0 0; color: #ffffff; letter-spacing: 0.5px;">OFFICIAL C-UAS TACTICAL PERFORMANCE SCORECARD</h2>
        <span style="font-size: 11px; color: #8fa3b8;">ANTI-DRONE AIR THREAT REACTION TRAINING EVALUATION</span>
      </div>
      <div style="text-align: right; font-size: 10px; color: #8fa3b8;">
        <div><strong>SESSION:</strong> {session_id}</div>
        <div><strong>DATE:</strong> {aar.get('timestamp') or time.strftime('%Y-%m-%d %H:%M:%S')}</div>
        <div><strong>CLEARANCE:</strong> MIL-STD-2525D</div>
      </div>
    </div>

    <!-- Candidate & Scenario Info -->
    <table style="margin-bottom: 18px;">
      <tr>
        <td style="width: 25%;"><strong>OPERATOR NAME:</strong></td>
        <td style="width: 35%; color: #4edea3; font-weight: bold;">{aar.get('userName')}</td>
        <td style="width: 20%;"><strong>RANK & DESIGNATION:</strong></td>
        <td style="width: 20%;">{aar.get('rank')}</td>
      </tr>
      <tr>
        <td><strong>ASSIGNED UNIT:</strong></td>
        <td>{aar.get('unit')}</td>
        <td><strong>SCENARIO DRILL:</strong></td>
        <td style="color: #4cd7f6;">{aar.get('scenarioTitle')}</td>
      </tr>
    </table>

    <!-- Hero Scorecard -->
    <div class="score-hero">
      <div>
        <span style="font-size: 11px; color: #8fa3b8;">OVERALL QUALIFICATION SCORE:</span>
        <div class="score-val">{score} <span style="font-size: 16px; color: #8fa3b8;">/ 1000 PTS</span></div>
      </div>
      <div style="text-align: center;">
        <span style="font-size: 11px; color: #8fa3b8; display: block; margin-bottom: 4px;">CERTIFICATION GRADE:</span>
        <span class="grade-badge">{grade}</span>
      </div>
      <div style="text-align: right; font-size: 12px;">
        <div><strong>AVG REACTION TIME:</strong> <span style="color: #4edea3;">{aar.get('avgDetTime')}s</span></div>
        <div style="margin-top: 4px;"><strong>CLASSIFICATION ACCURACY:</strong> <span style="color: #4edea3;">{aar.get('accuracyPct')}%</span></div>
      </div>
    </div>

    <!-- 6-Metric Breakdown Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-title">1. DETECTION TIME (20%)</div>
        <div class="metric-score">{metrics.get('detectionTimeScore', 185)} / 200</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">2. CLASSIFICATION (25%)</div>
        <div class="metric-score">{metrics.get('classificationScore', 230)} / 250</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">3. SWARM AWARENESS (15%)</div>
        <div class="metric-score">{metrics.get('situationalScore', 140)} / 150</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">4. ENGAGEMENT QUALITY (25%)</div>
        <div class="metric-score">{metrics.get('engagementScore', 235)} / 250</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">5. COMMUNICATION (10%)</div>
        <div class="metric-score">{metrics.get('communicationScore', 90)} / 100</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">6. DEGRADED SENSORS (5%)</div>
        <div class="metric-score">{metrics.get('degradedScore', 45)} / 50</div>
      </div>
    </div>

    <!-- AI Tactical Coach Debrief -->
    <div class="debrief-box">
<strong>EXPLAINABLE AI TACTICAL COACH EVALUATION:</strong>
{aar.get('aiDebrief')}
    </div>

    <!-- Event Action Log -->
    <h4 style="margin: 16px 0 6px 0; color: #4edea3; font-size: 11px; text-transform: uppercase;">Engagement Action Telemetry Audit</h4>
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Contact</th>
          <th>Assigned Class</th>
          <th>Correct?</th>
          <th>Action Taken</th>
          <th>Doctrine Rec</th>
          <th>Impact</th>
        </tr>
      </thead>
      <tbody>
"""
        for a in aar.get('actionHistory', []):
            is_correct = bool(a.get('isCorrectClass', True))
            score_delta = a.get('scoreDelta', 0)
            sign = '+' if score_delta >= 0 else ''
            html += f"""        <tr>
          <td>T+{a.get('timestampSec', 0)}s</td>
          <td><strong>{a.get('contactId', 'TRG-01')}</strong></td>
          <td>{a.get('classification', 'drone')}</td>
          <td style="color: {'#10b981' if is_correct else '#ef4444'}; font-weight: bold;">{'YES' if is_correct else 'NO'}</td>
          <td>{str(a.get('action', 'TRACK')).upper()}</td>
          <td>{a.get('recommendedAction', 'Follow ROE Standoff')}</td>
          <td>{sign}{score_delta}</td>
        </tr>
"""

        html += f"""      </tbody>
    </table>

    <!-- Signature & Stamp Block -->
    <div class="signature-row">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div style="font-size: 10px; font-weight: bold;">OPERATOR SIGNATURE</div>
        <div style="font-size: 9px; color: #8fa3b8;">{aar.get('userName')}</div>
      </div>
      <div class="sig-block" style="border: 1px dashed #4edea3; padding: 6px; border-radius: 4px;">
        <div style="font-size: 9px; color: #4edea3; font-weight: bold;">DEFENSE EVALUATION BOARD</div>
        <div style="font-size: 8px; color: #8fa3b8; margin-top: 2px;">AUTHENTICATED RECORD</div>
        <div style="font-size: 8px; color: #8fa3b8;">SHA-256: {session_id[-8:]}-VERIFIED</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div style="font-size: 10px; font-weight: bold;">CHIEF EVALUATOR</div>
        <div style="font-size: 9px; color: #8fa3b8;">Capt. Ananya Sen, AD Academy</div>
      </div>
    </div>
  </div>
</body>
</html>"""
        html_bytes = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(html_bytes)))
        self.end_headers()
        self.wfile.write(html_bytes)

class ThreadedHTTPServer(http.server.HTTPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    init_db()
    server_address = ('0.0.0.0', PORT)
    httpd = ThreadedHTTPServer(server_address, SentinelServerHandler)
    print(f"[SERVER] SENTINEL-Drone AI Threat Simulation Trainer running on http://0.0.0.0:{PORT}")
    httpd.serve_forever()
