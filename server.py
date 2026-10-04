"""
AEGIS-CUAS PRODUCTION BACKEND SERVER WITH LIVE API INTEGRATION & AI TACTICAL ADVISOR
Includes Open-Meteo Live Weather API Proxy, OpenSky ADS-B Airspace Feed Proxy,
and AI Tactical Threat Recommendation Engine.
"""

import http.server
import socketserver
import json
import sqlite3
import os
import time
import math
import random
import urllib.request
from urllib.parse import parse_qs, urlparse

PORT = int(os.environ.get("PORT", 3000))
DB_FILE = 'aegis_cuas.db'

# Pre-set Defense Sector Coordinates for Live Weather Sync
DEFENSE_SECTORS = {
    "leh": {"name": "Leh-Ladakh Sector (High Altitude)", "lat": 34.1526, "lon": 77.5771, "grid": "GRID: 34°09'N 77°34'E // LEH BASE"},
    "jaisalmer": {"name": "Thar Desert / Jaisalmer Border", "lat": 26.9157, "lon": 70.9083, "grid": "GRID: 26°54'N 70°54'E // THAR-DESERT"},
    "siliguri": {"name": "Siliguri Corridor / North-East", "lat": 26.7271, "lon": 88.3953, "grid": "GRID: 26°43'N 88°23'E // CORRIDOR-NE"},
    "pathankot": {"name": "Pathankot Air Base Sector", "lat": 32.2333, "lon": 75.6333, "grid": "GRID: 32°13'N 75°37'E // AIR-BASE-NORTH"}
}

# Init SQLite Database
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cadets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cadet_id TEXT UNIQUE,
            name TEXT,
            rank TEXT,
            unit TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_code TEXT UNIQUE,
            cadet_id TEXT,
            scenario_name TEXT,
            total_score INTEGER,
            max_score INTEGER,
            grade TEXT,
            avg_det_time REAL,
            accuracy_pct INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS engagements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_code TEXT,
            target_id TEXT,
            det_time_sec REAL,
            assigned_class TEXT,
            actual_class TEXT,
            countermeasure TEXT,
            roe_passed INTEGER,
            result_score INTEGER,
            notes TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute("SELECT COUNT(*) FROM cadets")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO cadets (cadet_id, name, rank, unit) VALUES ('CADET-4092', 'Rajesh Kumar', 'Lieutenant', '14th Air Defense Regiment')")

    conn.commit()
    conn.close()

class AegisServerHandler(http.server.SimpleHTTPRequestHandler):

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

        if path == '/api/health':
            self.send_json({'status': 'ONLINE', 'system': 'AEGIS-CUAS Live Production Backend v2.5', 'timestamp': time.time()})
        elif path == '/api/weather/live':
            sector_key = query.get('sector', ['leh'])[0]
            sector_info = DEFENSE_SECTORS.get(sector_key, DEFENSE_SECTORS['leh'])
            sector_grid = sector_info.get('grid', "34°09'N 77°34'E // LEH BASE")
            weather_data = self.fetch_live_weather(sector_info['lat'], sector_info['lon'], sector_info['name'], sector_grid)
            self.send_json(weather_data)
        elif path == '/api/airspace/live':
            airspace_data = self.fetch_live_opensky_airspace()
            self.send_json(airspace_data)
        elif path == '/api/mavlink/telemetry':
            self.send_json(self.generate_mavlink_telemetry())
        elif path == '/api/aar/history':
            self.send_json(self.get_session_history())
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        data = json.loads(body) if body else {}

        if path == '/api/ai/advisor':
            advice = self.generate_ai_tactical_advice(data)
            self.send_json(advice)
        elif path == '/api/ai/chat':
            chat_reply = self.generate_ai_chat_response(data)
            self.send_json(chat_reply)
        elif path == '/api/aar/save':
            session_code = self.save_session(data)
            self.send_json({'status': 'SUCCESS', 'session_code': session_code})
        elif path == '/api/scenarios/generate':
            scenario = self.generate_procedural_scenario(data)
            self.send_json(scenario)
        else:
            self.send_error(404, "Endpoint not found")

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    # LIVE API INTEGRATION 1: Open-Meteo Real-Time Weather API
    def fetch_live_weather(self, lat, lon, sector_name, grid_str="34°09'N 77°34'E // LEH BASE"):
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'AEGIS-CUAS-Sim/2.5'})
            with urllib.request.urlopen(req, timeout=4) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                cw = res_data.get('current_weather', {})
                return {
                    "source": "Open-Meteo Real-Time Weather API",
                    "sectorName": sector_name,
                    "grid": grid_str,
                    "lat": lat,
                    "lon": lon,
                    "temperature": cw.get('temperature', 18.5),
                    "windSpeed": cw.get('windspeed', 12.4), # km/h
                    "windDirection": cw.get('winddirection', 240), # deg
                    "weatherCode": cw.get('weathercode', 0),
                    "isLive": True
                }
        except Exception as e:
            # Fallback realistic telemetry if network offline
            return {
                "source": "AEGIS Sensor Fallback (Simulated)",
                "sectorName": sector_name,
                "grid": grid_str,
                "lat": lat,
                "lon": lon,
                "temperature": 14.2,
                "windSpeed": 18.6,
                "windDirection": 210,
                "weatherCode": 1,
                "isLive": False
            }

    # LIVE API INTEGRATION 2: OpenSky Network ADS-B Airspace Feed API
    def fetch_live_opensky_airspace(self):
        # Northern India Airspace Bounding Box (lamin, lomin, lamax, lomax)
        url = "https://opensky-network.org/api/states/all?lamin=26.0&lomin=70.0&lamax=34.0&lomax=88.0"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'AEGIS-CUAS-Sim/2.5'})
            with urllib.request.urlopen(req, timeout=4) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                states = res_data.get('states', [])
                transponders = []
                for s in states[:8]: # Pick up to 8 live transponders
                    if s[1] and s[5] and s[6]: # callsign, lon, lat
                        transponders.append({
                            "icao24": s[0],
                            "callsign": s[1].strip(),
                            "originCountry": s[2],
                            "lat": round(s[6], 4),
                            "lon": round(s[5], 4),
                            "altitudeM": round(s[7] or 3000, 1),
                            "velocityMS": round(s[9] or 180, 1),
                            "squawk": s[14] or "1200",
                            "isCivilian": True
                        })
                return {
                    "source": "OpenSky Network ADS-B Transponder API",
                    "liveCount": len(transponders),
                    "contacts": transponders,
                    "isLive": True
                }
        except Exception as e:
            # Fallback realistic commercial transponders if offline
            return {
                "source": "ADSB Feed (Simulated Fallback)",
                "liveCount": 2,
                "contacts": [
                    {"icao24": "3801a2", "callsign": "AIC412", "originCountry": "India", "lat": 28.55, "lon": 77.10, "altitudeM": 4500, "velocityMS": 210, "squawk": "4210", "isCivilian": True},
                    {"icao24": "4841b9", "callsign": "IGO608", "originCountry": "India", "lat": 28.70, "lon": 77.30, "altitudeM": 3200, "velocityMS": 190, "squawk": "2104", "isCivilian": True}
                ],
                "isLive": False
            }

    # AI TACTICAL ADVISOR RECOMMENDATION ENGINE
    def generate_ai_tactical_advice(self, data):
        target_id = data.get('targetId', 'UNKNOWN')
        rcs = float(data.get('rcs', 0.05))
        velocity = float(data.get('velocity', 25))
        range_m = float(data.get('range', 1500))
        wind_speed = float(data.get('windSpeed', 15))

        threat_level = "CRITICAL" if velocity > 30 or rcs < 0.03 else "HIGH"
        
        rec_cm = "rf_jammer"
        rec_reason = "Small RCS suggests micro-multirotor or FPV; RF jammer will sever C2 telemetry link with zero collateral risk."
        
        if rcs > 0.1:
            rec_cm = "ciws"
            rec_reason = "Medium fixed-wing radar cross-section detected. Kinetic CIWS 30mm stream recommended for airframe destruction."
        elif velocity > 35:
            rec_cm = "laser"
            rec_reason = "High agility FPV dive detected. Directed Energy HEL Laser offers zero-lead-time thermal burn-through."

        return {
            "targetId": target_id,
            "threatLethalityPct": min(98, max(45, int(velocity * 1.8 + (1 / (rcs + 0.01)) * 2))),
            "threatLevel": threat_level,
            "recommendedCM": rec_cm,
            "tacticalReasoning": rec_reason,
            "collateralRiskIndex": "LOW (0%)" if rec_cm in ["rf_jammer", "laser"] else "HIGH (WARNING: Proximity to FOB)",
            "aiCommanderNote": f"Current wind velocity ({wind_speed} km/h) will induce trajectory drift. Execute countermeasure promptly."
        }

    # AI CHAT ASSISTANT ENGINE (DUAL PERSONA: BEGINNER / FIRST-TIME OPERATOR & DEFENSE OFFICER)
    def generate_ai_chat_response(self, data):
        user_msg = data.get('message', '').strip().lower()
        persona = data.get('persona', 'beginner')
        sector = data.get('sector', 'Leh-Ladakh Sector')

        if persona == 'beginner':
            if any(k in user_msg for k in ['operate', 'how', 'start', 'guide', 'first', 'use', 'help']):
                reply = (
                    "👋 **Welcome First-Time Operator!** Here is how to run this tactical console step-by-step:\n\n"
                    "1. **Look at the 360° Surveillance Radar**: Red dots marked with `!` are hostile kinetic FPV strike drones flying towards our base. Yellow dots marked with `D` are non-lethal decoy chaff swarms.\n"
                    "2. **Lock onto a Drone**: Click any dot on the radar map or tap an item in the Target Telemetry list.\n"
                    "3. **Choose Your Response**:\n"
                    "   - **Soft-Kill (RF Jammer)**: Disconnects the drone's remote control signal silently with zero explosion.\n"
                    "   - **Hard-Kill (Kinetic Interceptor)**: Scrambles a high-speed interceptor drone to physically destroy the hostile airframe.\n"
                    "4. **Watch Out for Decoys!**: Firing at non-lethal decoys wastes ammunition and increases your operator stress penalty (-25 pts).\n"
                    "5. **Use the 5 Tabs**: You can switch between Radar, RF Spectrum Analysis, Triage Workload, AI Scenario Director, and After-Action Review."
                )
            elif any(k in user_msg for k in ['soft', 'hard', 'difference', 'kill', 'type']):
                reply = (
                    "💡 **Soft-Kill vs. Hard-Kill Explained Simply**:\n\n"
                    "• **Soft-Kill (RF Jamming)**: Works like turning off the drone operator's remote control or jamming their Wi-Fi. The drone loses its signal and immediately drops or hovers helplessly without causing explosions.\n\n"
                    "• **Hard-Kill (Kinetic Interceptor)**: Works like firing a physical net or high-speed interceptor drone to physically crash into the enemy drone in mid-air."
                )
            elif any(k in user_msg for k in ['rf', 'jam', 'fspl', 'spectrum', 'signal', 'wave']):
                reply = (
                    "📡 **RF Jamming Explained Simply**:\n\n"
                    "Radio signals get weaker as they travel through the air. This is called Free-Space Path Loss (FSPL).\n"
                    "By adjusting the Jammer Power slider (in Watts) and Frequency (in MHz), our transmitter produces a strong electromagnetic wave that overpowers the enemy pilot's radio signal, severing their connection instantly!"
                )
            elif any(k in user_msg for k in ['roe', 'rule', 'decoy', 'penalty', 'score']):
                reply = (
                    "⚠️ **Rules of Engagement (ROE) & Decoy Protection**:\n\n"
                    "The enemy swarms deploy harmless chaff decoys alongside real explosive drones. As an operator, your goal is to discriminate high-threat FPV strikers from decoys. Firing at decoys penalty points reduce your cadet grade!"
                )
            else:
                reply = (
                    f"Hello! I am your AEGIS AI Tactical Instructor for {sector}.\n\n"
                    f"Ask me anything about operating the radar, locking targets, jamming signals, or understanding hard-kill vs soft-kill defense tactics!"
                )
        else: # persona == 'defense'
            if any(k in user_msg for k in ['operate', 'how', 'start', 'brief', 'first', 'doctrine', 'mil']):
                reply = (
                    f"🎯 **AEGIS C-UAS OPERATIONAL BRIEFING [MIL-STD-2525D]**:\n\n"
                    f"• **Sector**: {sector}\n"
                    f"• **Spatial Flocking Acceleration**: O(N) spatial partitioning grid running edge INT8 ONNX acceleration on GTX 1650 / Quest 3.\n"
                    f"• **Target Discrimination Index (TDI)**: Automated Bayesian multi-modal fusion classifying Micro-Multirotor FPV Strikers vs Non-Lethal Decoy Chaff.\n"
                    f"• **Tactical Protocol**:\n"
                    f"  1. Acquire lock on Priority-1 kinetic FPV lead via 360° pulse-doppler array.\n"
                    f"  2. Execute Soft-Kill via Directional C-Band RF Jammer (2.4/5.8 GHz ISM) to deny C2 telemetry.\n"
                    f"  3. Scramble pneumatic ballistic net kinetic interceptor for terminal hard-kill confirmation.\n"
                    f"  4. All engagement telemetry is audited live to `aegis_cuas.db` SQLite database."
                )
            elif any(k in user_msg for k in ['soft', 'hard', 'difference', 'kill', 'cm']):
                reply = (
                    "🛡️ **COUNTERMEASURE DOCTRINE: SOFT-KILL VS HARD-KILL**:\n\n"
                    "• **Soft-Kill Electronic Warfare**: Directional RF Jamming wavefront discharging up to 500W ERP across 2400-5800 MHz ISM bands, inducing negative Signal-to-Jamming Noise Ratio (SJNR < -4.2 dB) to sever C2 telemetry links with zero collateral kinetic impact.\n\n"
                    "• **Hard-Kill Kinetic Intercept**: Ballistic net launcher or high-speed interceptor missile engaging hostile airframe within 500m kill-zone radius with direct impact kinetic energy transfer."
                )
            elif any(k in user_msg for k in ['rf', 'jam', 'fspl', 'spectrum', 'signal', 'friis']):
                reply = (
                    "📐 **RFVIEW PROPAGATION & FSPL MODELING**:\n\n"
                    "Free-Space Path Loss is calculated via Friis propagation formula:\n"
                    "FSPL (dB) = 20 log10(d) + 20 log10(f) + 32.44\n"
                    "Where d is distance in km and f is center frequency in MHz. Directional antenna gain G(θ) = 18.5 cos²(θ/2) dBi compensates for propagation attenuation to deny hostile C2 telemetry."
                )
            elif any(k in user_msg for k in ['roe', 'rule', 'decoy', 'penalty', 'nasa']):
                reply = (
                    "📋 **RULES OF ENGAGEMENT (ROE) & COGNITIVE WORKLOAD**:\n\n"
                    "Pursuant to MIL-STD defense directives, firing upon non-lethal decoy chaff swarms constitutes an Out-of-Sequence Error, penalizing operator NASA-TLX cognitive index (+8.5 pts) and degrading HRV stress metrics. Always verify Bayesian Threat Score > 75.0 before weapon release."
                )
            else:
                reply = (
                    f"AEGIS AI TACTICAL ADVISOR [COMMAND MODE] ACTIVE for {sector}.\n\n"
                    f"Standing by for operational query regarding RF propagation, Bayesian fusion confidence, ROE evaluation, or scenario director tactics."
                )

        return {
            "status": "SUCCESS",
            "persona": persona,
            "reply": reply,
            "timestamp": time.time()
        }

    def generate_mavlink_telemetry(self):
        return {
            "mavlink_version": 2.0,
            "message_type": "GLOBAL_POSITION_INT",
            "system_id": 1,
            "component_id": 1,
            "time_boot_ms": int(time.time() * 1000) % 4294967295,
            "lat": 286139391,
            "lon": 772090212,
            "alt_mm": 120000,
            "vx_cm_s": random.randint(-1500, 1500),
            "vy_cm_s": random.randint(-1500, 1500),
            "vz_cm_s": random.randint(-200, 200),
            "hdg_cdeg": random.randint(0, 36000),
            "heartbeat": {"base_mode": 81, "custom_mode": 0, "system_status": 4}
        }

    def save_session(self, data):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        session_code = f"SESS-{int(time.time())}"
        cursor.execute('''
            INSERT INTO sessions (session_code, cadet_id, scenario_name, total_score, max_score, grade, avg_det_time, accuracy_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session_code,
            data.get('cadetId', 'CADET-4092'),
            data.get('scenarioTitle', 'Procedural Swarm'),
            data.get('totalScore', 0),
            data.get('maxScore', 1000),
            data.get('grade', 'CLASS A'),
            float(data.get('avgDetTime', 0.0)),
            int(data.get('accuracyPct', 100))
        ))
        for ev in data.get('events', []):
            cursor.execute('''
                INSERT INTO engagements (session_code, target_id, det_time_sec, assigned_class, actual_class, countermeasure, roe_passed, result_score, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                session_code,
                ev.get('targetId'),
                ev.get('detTimeSec', 0.0),
                ev.get('operatorClass', 'unknown'),
                ev.get('actualClass', 'unknown'),
                ev.get('countermeasure', 'none'),
                1 if ev.get('roePassed') else 0,
                ev.get('eval', {}).get('totalResultScore', 0),
                ev.get('eval', {}).get('notes', '')
            ))
        conn.commit()
        conn.close()
        return session_code

    def get_session_history(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT session_code, scenario_name, total_score, max_score, grade, avg_det_time, accuracy_pct, timestamp FROM sessions ORDER BY id DESC LIMIT 10")
        rows = cursor.fetchall()
        conn.close()
        return [{
            "sessionCode": r[0], "scenarioName": r[1], "totalScore": r[2],
            "maxScore": r[3], "grade": r[4], "avgDetTime": r[5],
            "accuracyPct": r[6], "timestamp": r[7]
        } for r in rows]

    def generate_procedural_scenario(self, data):
        swarm_size = int(data.get('swarmSize', 6))
        terrain = data.get('terrain', 'urban')
        visibility = data.get('visibility', 'day')
        noise = int(data.get('noise', 20))

        targets = []
        for i in range(swarm_size):
            angle = (2 * math.pi / swarm_size) * i + (random.random() - 0.5) * 0.3
            dist = 280 + random.random() * 80
            target_type = random.choice(['micro', 'fpv', 'tactical', 'swarm_leader'])
            targets.append({
                "id": f"TRK-SWARM{100+i}",
                "type": target_type,
                "typeName": target_type.upper(),
                "pos": {"x": math.cos(angle) * dist, "y": math.sin(angle) * dist, "z": 40 + random.random() * 100},
                "velocity": {"x": -math.cos(angle) * 20, "y": -math.sin(angle) * 20, "z": 0},
                "radarCrossSection": 0.05,
                "isHostile": True,
                "isFriendly": False,
                "isDecoy": False,
                "behavior": "flocking"
            })

        return {
            "title": f"Procedural Swarm Attack ({swarm_size} Drones)",
            "lighting": visibility,
            "terrain": terrain,
            "noise": noise,
            "targets": targets
        }

class ThreadedHTTPServer(http.server.HTTPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    init_db()
    server_address = ('0.0.0.0', PORT)
    httpd = ThreadedHTTPServer(server_address, AegisServerHandler)
    print(f"[SERVER] AEGIS-CUAS Live Backend v2.5 running on http://0.0.0.0:{PORT}")
    httpd.serve_forever()
