"""
Generate Defense Personnel Clearance Roster Database
Creates:
1. defense_clearance_roster.csv (Excel-compatible standard CSV)
2. defense_clearance_roster.xlsx (OpenXML spreadsheet)
3. defense_clearance_roster table in sentinel_drone.db
"""

import csv
import json
import os
import sqlite3
import zipfile

ROSTER_DATA = [
    # INSTRUCTORS (CLEARANCE LEVEL 4-5)
    {
        "service_no": "IC-54921A",
        "name": "Col. Rajeshwar Singh",
        "rank": "Colonel",
        "branch": "Army Air Defense (AAD)",
        "unit": "14th Air Defense Brigade HQ",
        "role": "instructor",
        "code": "ARM-INST-7801",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "IC-61028K",
        "name": "Lt. Col. Abhinav Shukla",
        "rank": "Lt. Colonel",
        "branch": "Army Air Defense (AAD)",
        "unit": "Army AD Missile Training Wing",
        "role": "instructor",
        "code": "ARM-INST-8822",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "AF-29310P",
        "name": "Wing Cdr. Ananya Sen",
        "rank": "Wing Commander",
        "branch": "Indian Air Force (IAF)",
        "unit": "Western Air Command C-UAS Cell",
        "role": "instructor",
        "code": "IAF-INST-4403",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "AF-31940M",
        "name": "Sqn. Ldr. Farooq Baig",
        "rank": "Squadron Leader",
        "branch": "Indian Air Force (IAF)",
        "unit": "Air Force Academy Electronic Warfare",
        "role": "instructor",
        "code": "IAF-INST-5590",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "IN-04812N",
        "name": "Cdr. Vikram Rathore",
        "rank": "Commander",
        "branch": "Indian Navy (IN)",
        "unit": "Naval Coastal Defense Battery",
        "role": "instructor",
        "code": "NAV-INST-3312",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "IC-44109X",
        "name": "Maj. Gen. R. K. Rawat",
        "rank": "Major General",
        "branch": "Joint Defense Staff (HQ IDS)",
        "unit": "Tri-Services Air Defense Command HQ",
        "role": "instructor",
        "code": "MOD-INST-9900",
        "status": "ACTIVE_ELIGIBLE"
    },

    # TRAINEES / OPERATORS (CLEARANCE LEVEL 1-2)
    {
        "service_no": "SS-78901L",
        "name": "Cadet Aarav Sharma",
        "rank": "Cadet",
        "branch": "Army Air Defense (AAD)",
        "unit": "14th Air Defense Regiment",
        "role": "trainee",
        "code": "ARM-TRN-1011",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "SS-79104H",
        "name": "Cadet Vikramaditya Singh",
        "rank": "Cadet",
        "branch": "Army Air Defense (AAD)",
        "unit": "14th Air Defense Regiment",
        "role": "trainee",
        "code": "ARM-TRN-1022",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "SS-80122W",
        "name": "Lt. Meera Nair",
        "rank": "Lieutenant",
        "branch": "Army Air Defense (AAD)",
        "unit": "Northern Border Surveillance Unit",
        "role": "trainee",
        "code": "ARM-TRN-1033",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "IC-72314F",
        "name": "Capt. Devendra Joshi",
        "rank": "Captain",
        "branch": "Army Air Defense (AAD)",
        "unit": "Forward Tactical Radar Section",
        "role": "trainee",
        "code": "ARM-TRN-1044",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "AF-44190B",
        "name": "Flight Cadet Rohan Roy",
        "rank": "Flight Cadet",
        "branch": "Indian Air Force (IAF)",
        "unit": "IAF Drone Interception Group",
        "role": "trainee",
        "code": "IAF-TRN-2011",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "AF-45129T",
        "name": "Flying Officer Priya Verma",
        "rank": "Flying Officer",
        "branch": "Indian Air Force (IAF)",
        "unit": "Base Defense Flight - Leh",
        "role": "trainee",
        "code": "IAF-TRN-2022",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "AF-43891S",
        "name": "Flight Lt. Siddharth Nair",
        "rank": "Flight Lieutenant",
        "branch": "Indian Air Force (IAF)",
        "unit": "48 Squadron C-UAS Flight",
        "role": "trainee",
        "code": "IAF-TRN-2033",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "IN-09144C",
        "name": "Sub-Lt. Aditya Kulkarni",
        "rank": "Sub-Lieutenant",
        "branch": "Indian Navy (IN)",
        "unit": "INS Vikrant Drone Intercept Battery",
        "role": "trainee",
        "code": "NAV-TRN-3011",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "IN-08231G",
        "name": "Lt. Cdr. Pooja Menon",
        "rank": "Lt. Commander",
        "branch": "Indian Navy (IN)",
        "unit": "Eastern Naval Command C2 Cell",
        "role": "trainee",
        "code": "NAV-TRN-3022",
        "status": "ACTIVE_ELIGIBLE"
    },
    {
        "service_no": "SS-91024D",
        "name": "Junior Cadet Tanmay Sen",
        "rank": "Junior Cadet",
        "branch": "Joint Training Command",
        "unit": "National Defense Academy Air Defense Wing",
        "role": "trainee",
        "code": "DEF-TRN-5011",
        "status": "ACTIVE_ELIGIBLE"
    }
]

def generate_csv(filepath):
    fieldnames = ["service_no", "name", "rank", "branch", "unit", "role", "code", "status"]
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for item in ROSTER_DATA:
            writer.writerow(item)
    print(f"Generated CSV: {filepath} ({len(ROSTER_DATA)} records)")

def generate_xlsx(filepath):
    headers = [
        "SERVICE_NO",
        "OFFICER_NAME",
        "RANK",
        "DEFENSE_BRANCH",
        "UNIT_STATION",
        "DESIGNATED_ROLE",
        "DEFENSE_VERIFICATION_CODE",
        "CLEARANCE_STATUS"
    ]

    sheet_rows = []
    # Row 1: Header
    h_cells = []
    for c_idx, h in enumerate(headers):
        col_letter = chr(65 + c_idx)
        h_cells.append(f'<c r="{col_letter}1" t="inlineStr"><is><t>{h}</t></is></c>')
    sheet_rows.append(f'<row r="1" spans="1:8">{"".join(h_cells)}</row>')

    # Rows 2..N
    for r_idx, r in enumerate(ROSTER_DATA, start=2):
        vals = [
            r["service_no"],
            r["name"],
            r["rank"],
            r["branch"],
            r["unit"],
            r["role"].upper(),
            r["code"],
            r["status"]
        ]
        row_cells = []
        for c_idx, val in enumerate(vals):
            col_letter = chr(65 + c_idx)
            escaped_val = str(val).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            row_cells.append(f'<c r="{col_letter}{r_idx}" t="inlineStr"><is><t>{escaped_val}</t></is></c>')
        sheet_rows.append(f'<row r="{r_idx}" spans="1:8">{"".join(row_cells)}</row>')

    sheet_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>
{"".join(sheet_rows)}
</sheetData>
</worksheet>'''

    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>'''

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

    wb_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>'''

    wb = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
<sheet name="Defense_Clearance_Roster" sheetId="1" r:id="rId1"/>
</sheets>
</workbook>'''

    with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('xl/_rels/workbook.xml.rels', wb_rels)
        z.writestr('xl/workbook.xml', wb)
        z.writestr('xl/worksheets/sheet1.xml', sheet_xml)

    print(f"Generated XLSX: {filepath} ({os.path.getsize(filepath)} bytes)")

def seed_database(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

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

    for r in ROSTER_DATA:
        cursor.execute('''
            INSERT OR REPLACE INTO defense_clearance_roster (code, service_no, name, rank, branch, unit, role, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (r["code"], r["service_no"], r["name"], r["rank"], r["branch"], r["unit"], r["role"], r["status"]))

    conn.commit()
    count = cursor.execute('SELECT COUNT(*) FROM defense_clearance_roster').fetchone()[0]
    conn.close()
    print(f"Seeded SQLite table defense_clearance_roster in {db_path} with {count} records")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, 'defense_clearance_roster.csv')
    xlsx_path = os.path.join(base_dir, 'defense_clearance_roster.xlsx')
    db_path = os.path.join(base_dir, 'sentinel_drone.db')

    generate_csv(csv_path)
    generate_xlsx(xlsx_path)
    seed_database(db_path)
