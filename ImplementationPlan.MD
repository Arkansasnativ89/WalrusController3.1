# Walrus MIDI Controller — Implementation Plan

> **Project:** Browser-based MIDI controller for Walrus Audio pedals
> **Target Devices:** Walrus Audio R1 (MKI), Walrus Audio ACS1 (MKII)
> **Stack:** React + Vite + TypeScript, Zustand, Dexie.js, Web MIDI API
> **Author:** Hunter Carle
> **Created:** 2026-03-15

---

## Project Vision

A production-ready PWA that provides real-time MIDI control, preset management, and a visual interface for the Walrus Audio R1 and ACS1 MKII pedals. Designed for both studio editing and live performance use.

---

## Phase 0 — Foundation (Week 1–2)

**Goal:** Scaffold the project, establish MIDI connectivity, prove we can talk to a pedal.

### Deliverables

- Vite + React + TypeScript project initialized
- Tailwind CSS + shadcn/ui configured
- PWA manifest and service worker scaffolded (Vite PWA plugin)
- Web MIDI API connection layer built and tested
- Device detection: enumerate connected USB MIDI devices
- Raw MIDI monitor: display incoming/outgoing MIDI messages in real time
- First successful CC message sent to a connected Walrus pedal

### Key Decisions to Lock

- State management pattern (Zustand store shape)
- Folder structure and module boundaries
- MIDI service abstraction interface
- Preset JSON schema v1

### Exit Criteria

- [ ] App runs locally, detects a connected Walrus pedal by name
- [ ] Sending a CC message from the UI changes a parameter on the physical pedal
- [ ] Incoming MIDI from the pedal is displayed in the monitor
- [ ] Project compiles with zero TypeScript errors

---

## Phase 1 — Device Profiles & Parameter Control (Week 3–4)

**Goal:** Build the device profile system and real-time parameter control UI for both pedals.

### Deliverables

- **Device Profile JSON Schema** — a generic, extensible format that describes:
  - Device name, manufacturer, MIDI channel defaults
  - Available parameters (CC number, label, min/max, default, type: knob | toggle | select)
  - Available programs/presets (PC numbers)
  - Bypass CC (if applicable)
- **R1 Device Profile** — complete CC map from Walrus MIDI implementation chart
  - Reverb type selection
  - Decay, tone, damping, modulation parameters
  - Bypass toggle
  - Preset recall via PC
- **ACS1 MKII Device Profile** — complete CC map from Walrus MIDI implementation chart
  - Amp model selection
  - Gain, EQ (bass/mid/treble), volume, reverb parameters
  - Cabinet sim toggle
  - Bypass toggle
  - Preset recall via PC
- **Parameter Control UI** — per-device control surface
  - Knob components (rotary encoder style, touch/mouse drag)
  - Toggle switches for on/off parameters
  - Dropdown selectors for multi-option parameters (reverb type, amp model)
  - Real-time CC transmission on value change
  - Visual feedback of current parameter state

### Exit Criteria

- [ ] Both device profiles load from JSON config files
- [ ] Every documented CC parameter for R1 is controllable from the UI
- [ ] Every documented CC parameter for ACS1 MKII is controllable from the UI
- [ ] Parameter changes send correct CC messages on the correct channel
- [ ] Adding a hypothetical third device requires only a new JSON file, no code changes

---

## Phase 2 — Preset Management (Week 5–6)

**Goal:** Save, load, organize, import, and export presets for both pedals.

### Deliverables

- **Preset Data Model (v1)**
  - Preset name, description, tags
  - Target device identifier
  - Parameter snapshot (all CC values at save time)
  - Timestamp metadata (created, modified)
  - Optional: signal chain position hint (for future multi-pedal chaining)
- **IndexedDB Storage** via Dexie.js
  - Presets table with indexed fields (device, name, tags)
  - Device profiles table (for custom/modified profiles)
  - App settings table
- **Preset CRUD UI**
  - Save current parameter state as a new preset
  - Load a preset → sends all CC values to the device
  - Edit preset metadata (name, tags, description)
  - Delete preset with confirmation
  - Duplicate preset
- **Import / Export**
  - Export single preset as JSON
  - Export all presets for a device as JSON bundle
  - Import preset JSON with validation and conflict resolution
  - Drag-and-drop import support
- **Preset Browser**
  - List view with search, filter by device, filter by tags
  - Sort by name, date created, date modified
  - Quick-load on click/tap

### Exit Criteria

- [ ] Full CRUD lifecycle works for presets on both devices
- [ ] Presets persist across browser sessions (IndexedDB)
- [ ] Exported JSON can be imported on a different machine/browser
- [ ] Preset load sends correct CC values and pedal responds accurately
- [ ] App works offline after initial load (PWA caching)

---

## Phase 3 — Performance Mode & Setlists (Week 7–8)

**Goal:** Build a streamlined, stage-ready UI for live use.

### Deliverables

- **Performance Mode UI**
  - Full-screen, high-contrast, large touch targets
  - Current preset name displayed prominently
  - Next/previous preset navigation (tap or MIDI foot controller input)
  - Minimal chrome — no menus, no edit controls visible
  - Tap-to-exit back to edit mode
- **Setlist System**
  - Create named setlists (ordered list of presets, potentially across both devices)
  - Reorder presets within a setlist via drag-and-drop
  - Step through setlist sequentially (next/prev)
  - Per-song grouping (optional: group multiple presets under a song name)
  - Setlist CRUD + import/export
- **MIDI Input Handling**
  - Map incoming MIDI messages (from a foot controller or the pedals themselves) to app actions
  - Configurable: "CC 64 on channel 16 = next preset"
  - Default mappings + user-customizable mapping table

### Exit Criteria

- [ ] Performance mode is usable on a tablet at arm's length in dim lighting
- [ ] Setlist steps through presets on both devices correctly
- [ ] External MIDI foot controller can trigger next/prev preset
- [ ] No accidental edits possible while in performance mode

---

## Phase 4 — Polish, Testing & Deployment (Week 9–10)

**Goal:** Production-grade quality, testing, and deployment.

### Deliverables

- **Testing**
  - Unit tests for MIDI service (message construction, parsing)
  - Unit tests for preset validation and schema migration
  - Integration tests for device profile loading
  - Mock MIDI device for CI (no hardware dependency)
  - Manual test checklist for both pedals
- **Error Handling & Edge Cases**
  - Device disconnection during use (graceful recovery, reconnect prompt)
  - Multiple devices on same MIDI channel (conflict warning)
  - Corrupt preset import (validation + user-friendly error)
  - Browser without Web MIDI support (clear messaging, no crash)
- **PWA Finalization**
  - App icon and splash screen
  - Offline caching verified
  - Install prompt on supported browsers
  - HTTPS deployment
- **Deployment**
  - CI/CD pipeline (GitHub Actions → Vercel or Cloudflare Pages)
  - Production build optimization
  - Lighthouse audit: Performance, PWA, Accessibility targets

### Exit Criteria

- [ ] All tests pass in CI
- [ ] Lighthouse PWA score ≥ 90
- [ ] App installs and runs offline on Chrome (desktop + Android)
- [ ] Zero console errors during normal operation
- [ ] README with setup instructions and architecture overview

---

## Document Tree

```
/project-root
│
├── CLAUDE.md                          # AI session context + rules
├── MEMORY.md                          # Running session state
├── MASTER-REF.md                      # Architecture overview + conventions
├── IMPLEMENTATION-PLAN.md             # This file
├── README.md                          # Public-facing project readme
│
├── /docs
│   ├── /architecture
│   │   ├── SYSTEM-OVERVIEW.md         # High-level architecture + data flow
│   │   ├── DATA-MODEL.md              # Preset schema, device profile schema
│   │   ├── MIDI-ENGINE.md             # MIDI subsystem design + message flow
│   │   ├── STATE-MANAGEMENT.md        # Zustand store shape + actions
│   │   └── OFFLINE-STRATEGY.md        # PWA caching + IndexedDB design
│   │
│   ├── /devices
│   │   ├── DEVICE-PROFILE-SPEC.md     # Generic device profile JSON format
│   │   ├── WALRUS-R1.md              # R1 MIDI implementation + CC map
│   │   ├── WALRUS-ACS1-MKII.md       # ACS1 MKII MIDI implementation + CC map
│   │   └── ADDING-NEW-DEVICES.md     # Guide: add a new pedal via config
│   │
│   ├── /features
│   │   ├── PRESET-MANAGEMENT.md       # Preset CRUD + import/export spec
│   │   ├── PARAMETER-CONTROL.md       # Real-time CC control UI spec
│   │   ├── PERFORMANCE-MODE.md        # Stage UI + setlist spec
│   │   └── MIDI-INPUT-MAPPING.md      # Incoming MIDI → app action mapping
│   │
│   └── /project
│       ├── ROADMAP.md                 # Phase timeline + milestones
│       └── TECH-DECISIONS.md          # Architecture Decision Records
│
├── /src
│   ├── /app                           # App shell, routing, providers
│   ├── /components
│   │   ├── /controls                  # Knob, Toggle, Selector components
│   │   ├── /device                    # Device view, parameter surface
│   │   ├── /preset                    # Preset browser, editor, cards
│   │   ├── /performance               # Performance mode, setlist view
│   │   ├── /midi-monitor              # Raw MIDI message display
│   │   └── /ui                        # shadcn/ui primitives
│   ├── /hooks                         # useMidi, useDevice, usePresets, etc.
│   ├── /services
│   │   ├── midi-service.ts            # Web MIDI API abstraction
│   │   ├── preset-service.ts          # Preset CRUD operations
│   │   └── storage-service.ts         # Dexie.js database layer
│   ├── /stores
│   │   ├── midi-store.ts              # MIDI connection state
│   │   ├── device-store.ts            # Active device + parameter state
│   │   ├── preset-store.ts            # Preset library state
│   │   └── performance-store.ts       # Setlist + performance mode state
│   ├── /types
│   │   ├── midi.ts                    # MIDI message types
│   │   ├── device-profile.ts          # Device profile schema types
│   │   └── preset.ts                  # Preset schema types
│   ├── /data
│   │   └── /device-profiles
│   │       ├── walrus-r1.json         # R1 device profile
│   │       └── walrus-acs1-mkii.json  # ACS1 MKII device profile
│   └── /utils
│       ├── midi-utils.ts              # CC construction, channel math
│       └── validation.ts              # Schema validation helpers
│
├── /public
│   ├── manifest.json                  # PWA manifest
│   ├── icons/                         # App icons (192, 512, maskable)
│   └── splash/                        # PWA splash screens
│
└── /tests
    ├── /unit
    │   ├── midi-service.test.ts
    │   ├── preset-validation.test.ts
    │   └── device-profile.test.ts
    ├── /integration
    │   └── preset-lifecycle.test.ts
    └── /mocks
        └── mock-midi-device.ts        # Simulated MIDI device for CI
```

---

## Required Assets

### MIDI Implementation Data (Must Gather Before Phase 1)

| Asset | Source | Status |
|-------|--------|--------|
| Walrus R1 MIDI Implementation Chart | Walrus Audio website / manual | ⬜ Not gathered |
| Walrus ACS1 MKII MIDI Implementation Chart | Walrus Audio website / manual | ⬜ Not gathered |
| R1 CC number assignments (all parameters) | Derived from above | ⬜ Not gathered |
| ACS1 MKII CC number assignments (all parameters) | Derived from above | ⬜ Not gathered |
| R1 PC → preset mapping | Derived from above | ⬜ Not gathered |
| ACS1 MKII PC → preset mapping | Derived from above | ⬜ Not gathered |
| Default MIDI channels for each device | Device settings / manual | ⬜ Not gathered |

### Design Assets (Can Be Created During Development)

| Asset | Format | Phase Needed |
|-------|--------|-------------|
| App icon (192px, 512px, maskable) | PNG / SVG | Phase 4 |
| PWA splash screens | PNG | Phase 4 |
| Knob/rotary control graphic | SVG (CSS-driven preferred) | Phase 1 |
| Toggle switch graphic | SVG / CSS | Phase 1 |
| Device silhouette or icon (R1) | SVG | Phase 1 |
| Device silhouette or icon (ACS1) | SVG | Phase 1 |
| Color palette definition | CSS variables / Tailwind config | Phase 0 |

---

## Tech Stack Summary

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React 18+ | Existing experience (CarleFinance), large ecosystem |
| Build Tool | Vite | Fast HMR, already in use on other projects |
| Language | TypeScript (strict) | Type safety on MIDI messages is non-negotiable |
| State | Zustand | Lightweight, great for real-time state, minimal boilerplate |
| Styling | Tailwind CSS + shadcn/ui | Consistent with existing projects, rapid UI dev |
| Local Storage | Dexie.js (IndexedDB) | Clean async API, offline-first, structured queries |
| MIDI | Web MIDI API (raw) | No wrapper needed for two known devices, full control |
| PWA | vite-plugin-pwa | Service worker generation, manifest, auto-update |
| Testing | Vitest + Testing Library | Native Vite integration, fast execution |
| Deployment | Vercel or Cloudflare Pages | HTTPS by default (required for Web MIDI), zero-config CD |
| CI | GitHub Actions | Free tier sufficient, triggers on PR + main push |

---

## Assumptions & Risks

### Assumptions

- Both pedals will be connected via USB-MIDI (not 5-pin DIN through an interface — though that should also work if the interface exposes MIDI ports to the browser)
- Chrome is the primary target browser (Web MIDI API support is best there)
- The Walrus MIDI implementation charts are accurate and complete
- User has a single instance of each pedal connected at a time

### Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Web MIDI API latency too high for live use | High | Benchmark early in Phase 0; Electron fallback path exists |
| Browser drops MIDI connection intermittently | Medium | Reconnect logic + device polling in MIDI service |
| Walrus firmware update changes CC assignments | Low | Device profiles are JSON config — update without code change |
| PWA install not supported on target device/OS | Low | App still works as a browser tab; PWA is nice-to-have |
| Safari lacks Web MIDI support | Medium | Document Chrome as primary; Safari support is experimental |

---

## Future Considerations (Post-MVP)

These are explicitly out of scope for the initial build but worth designing around:

- **HX Effects integration** — add as a third device profile (leveraging existing CC map work)
- **Signal chain builder** — visual drag-and-drop ordering of pedals in a chain
- **SysEx support** — for pedals that support bulk dump/restore
- **Cloud sync** — preset backup and cross-device sync
- **MIDI learn** — wiggle a knob on the pedal, app auto-maps the CC
- **Multi-device preset groups** — save/load states across R1 + ACS1 simultaneously
- **Community preset sharing** — export/import via URL or shared repository