---
name: Garuda-Rakshak Tactical Ops
colors:
  surface: '#0b141e'
  surface-dim: '#0b141e'
  surface-bright: '#313a45'
  surface-container-lowest: '#060f18'
  surface-container-low: '#131c26'
  surface-container: '#17202b'
  surface-container-high: '#222b35'
  surface-container-highest: '#2d3640'
  on-surface: '#dae3f1'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#dae3f1'
  inverse-on-surface: '#28313c'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#ffb77a'
  on-secondary: '#4c2700'
  secondary-container: '#d7790d'
  on-secondary-container: '#432100'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#00b2d0'
  on-tertiary-container: '#003f4b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffdcc2'
  secondary-fixed-dim: '#ffb77a'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#6d3a00'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0b141e'
  on-background: '#dae3f1'
  surface-variant: '#2d3640'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 30px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system establishes a high-reliability, zero-latency tactical command and control interface built for Indian defense drone simulation, telemetry tracking, and battlefield reconnaissance operations. The visual atmosphere evokes uncompromising situational awareness, rugged operational readiness, and surgical precision under adverse environmental and cognitive stress conditions.

The design movement combines **Tactical HUD / Military Functionalism** with razor-sharp **Technical Brutalism**:
- **Utilitarian Discipline:** Screen real estate favors rapid data digestion, clear target lock-on indicators, and mission-critical telemetry over decorative flourishes.
- **Instrument-Grade Contrast:** Deep ballistic obsidian backgrounds maximize battery conservation on ruggedized field devices, eliminate optical glare during night ops, and make phosphor greens, tactical cyans, and emergency saffrons pop instantaneously.
- **Symbology & Architecture:** Interfaces utilize reticle coordinate systems, angular edge cutouts, sensor wireframes, and standardized tactical brackets to anchor operators in rapid decision-making cycles.

## Colors

The palette is engineered around high optical differentiation, night-vision compliance, and unambiguous threat identification:

- **Surface & Shell (Deep Ballistic Slate):** Base canvas anchored at `#0B1015` with secondary tactical panels at `#111A24` and inset readout wells at `#070B0E`. Outlines use cold ballistic steel (`#1E2C3A`) to maintain geometric clarity.
- **Primary Operational State (HUD Phosphor Green):** `#10B981` denotes active, nominal, locked-on, and cleared-for-flight states. It provides instant visual confirmation without inducing ocular fatigue.
- **Secondary Alert & IFF Warning (Command Saffron / Amber):** `#FF9933` and `#F59E0B` represent priority alerts, manual payload overrides, geofence warnings, and mission trajectory modifications.
- **Tertiary Tactical Sensor (Vector Cyan):** `#06B6D4` delivers synthetic aperture radar (SAR), telemetry streams, altitude vectors, and secure network status readouts.
- **Hostile / Critical Intercept (Laser Infrared):** `#EF4444` is strictly reserved for enemy target acquisition, jamming detection, thermal hard-locks, and system faults.
- **Tactical Army Olive / Drab (Subdued Matrix):** `#2E3824` and `#4B5E38` anchor structural group dividers, secondary telemetry rails, and peripheral hardware status markers.

## Typography

The type scale combines the crisp density of **Inter** for commanding situational updates and operational descriptions with the tabular precision of **JetBrains Mono** for all sensor values, GPS coordinates, azimuth lines, and payload counters.

- **Tabular Figures & Monospace Alignment:** All numbers, telemetry feeds, and dynamic counters must render with fixed-width glyphs (`font-feature-settings: 'tnum' 1, 'zero' 1`) to eliminate jitter during real-time drone velocity changes.
- **Letter Spacing:** All monospaced labels and HUD tags use expanded tracking (`+0.05em` to `+0.12em`) to guarantee legibility across night-vision systems and low-light cockpit displays.
- **Capitalization:** Technical status codes, mission states, flight modes, and sector coordinates are rendered in strict uppercase (`text-transform: uppercase`).

## Layout & Spacing

The layout is built upon a dense, modular **Fluid Grid** engineered for high data-throughput across tactical displays (from field rugged tablets to multi-monitor military command centers):

- **Column Grid:** A baseline 12-column layout that shifts into a dense 4-panel split for multi-UAV swarm tracking on desktop screens, collapsing into a stacked primary-viewport layout on field tablets.
- **Compact Density:** Spatial tokens remain dense (`space-xs` through `space-md`) to ensure critical flight metrics, battery autonomy, wind shear, and waypoint lists fit above the operational fold.
- **Viewport Safe Zones:** A permanent peripheral edge margin of `1rem` reserves non-obstructive zones for hardware housing clamps, touch-bezel interactions, and hardware status indicators.
- **Target Reticle Overlays:** Video feeds host floating absolute coordinate grids with HUD telemetry anchors pinned to viewport corners (`[TOP-L] NAV`, `[TOP-R] COMM`, `[BOT-L] PAYLOAD`, `[BOT-R] SENSORS`).

## Elevation & Depth

Visual hierarchy does not rely on soft commercial drop shadows. In high-stakes tactical environments, physical shadows reduce display legibility under sunlight. Depth is instead achieved through **Tonal Surface Stacking and Precision Outlines**:

- **Layer 0 (Tactical Abyss / Video Feed):** `#070B0E` serves as the camera and radar map base canvas.
- **Layer 1 (Mission Modules):** `#0B1015` with a crisp `1px` border of `#1E2C3A`.
- **Layer 2 (Interactive Floating Telemetry HUD):** `#111A24` at `90%` opacity paired with `backdrop-filter: blur(8px)`. Surfaces feature a 1px internal inset highlight (`rgba(255, 255, 255, 0.05)`).
- **Target Lock & Critical Alerts:** Enhanced via direct 1px phosphor luminescence (`box-shadow: 0 0 12px rgba(16, 185, 129, 0.3)`) and warning saffron glows (`box-shadow: 0 0 12px rgba(255, 153, 51, 0.35)`).

## Shapes

The design system enforces a strict **Sharp (`0`)** corner geometry. Rounded corners soften military posture; sharp 90-degree intersections and chamfered 45-degree angle cuts reflect ballistic armor panels and ruggedized hardware consoles.

- **Chamfered Corners:** Selected key cards and HUD containers utilize angled cutoffs (`clip-path: polygon(...)`) on top-right and bottom-left edges to signify military sensor enclosures.
- **Corner Brackets:** Interactive map overlays and video target selectors use L-shaped corner tick marks (`border-top`, `border-left`) rather than continuous enclosing boxes.

## Components

### Action Buttons & Flight Mode Selectors
- **Primary Tactical Trigger:** Sharp rectangular frame with a background of `#10B981`, bold text in `#0B1015`, and monospaced uppercase typography. Hover introduces an outer hairline border; active presses invert colors.
- **Emergency / Weapon Bay Release:** `#EF4444` background with alternating safety diagonal hatch striping (`stripes: rgba(0, 0, 0, 0.25)`). Requires long-press confirmation with a linear sweep fill.
- **Secondary Mode Switchers:** Ghost style with `#1E2C3A` border and `#111A24` background. Active state triggers a top 2px line indicator in `#FF9933`.

### Telemetry Badges & Status Chips
- Enclosed in a 1px border colored according to state (Green = Nominal, Saffron = Warning, Red = Jamming/Engaged, Cyan = Sensor Stream Active).
- Background uses 10% opacity tint of the respective state color over `#0B1015`.
- Preceded by a 6px static or pulsing square signal indicator.

### Target HUD Brackets & Reticles
- Floating target bounding boxes use high-contrast `#10B981` or `#EF4444` 4-corner brackets (`width: 8px; height: 8px`).
- Integrated dynamic distance and velocity tags rendered in `label-sm` along the right and lower bracket margins.

### Radar Grid & Sensor Cards
- Cards feature a tactical top-rail header containing a monospace ID (e.g., `UAV-01 // SECTOR-4B`), current coordinates, and a signal strength graph.
- Body area is enclosed by a fine 1px `#1E2C3A` border with subtle coordinate crosshairs intersecting card corners.

### Mission Checkboxes & Toggle Switches
- Monospace binary readouts (`[0]` vs `[1]`, `ENGAGED` vs `DISARMED`) replacing consumer rounded toggles.
- Checkboxes are rigid squares with a centralized filled micro-square upon activation.

### Input Fields & Azimuth Dials
- Inset dark wells (`#070B0E`) with tabular text inputs and fixed metric suffixes (`M/S`, `ALT-MSL`, `DEG`).
- Focus states trigger a sharp 1px highlight of `#06B6D4` without outer soft halos.