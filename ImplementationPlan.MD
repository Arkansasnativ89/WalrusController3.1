# Walrus MIDI Controller — Implementation Plan

> **Project:** Browser-based MIDI controller for Walrus Audio pedals  
> **Target Devices:** Walrus Audio R1, Walrus Audio ACS1 MKII  
> **Stack:** React 19 + Vite + TypeScript, Zustand v5, Dexie.js v4, Web MIDI API, Tailwind CSS v4  
> **Author:** Hunter Carle  
> **Created:** 2026-03-15

---

## Project Vision

A production-ready PWA that provides real-time MIDI control, preset management, and a visual interface for the Walrus Audio R1 and ACS1 MKII pedals. Both pedals are controlled side-by-side via USB through an HX Effects multi-FX unit.

---

## Phase 0 — Foundation (Week 1–2) ✅ COMPLETE

**Goal:** Scaffold the project, establish MIDI connectivity, prove we can talk to a pedal.

### Deliverables

- [x] Vite + React 19 + TypeScript (strict) project initialized
- [x] Tailwind CSS v4 configured via `@tailwindcss/vite`
- [x] PWA manifest and service worker scaffolded (vite-plugin-pwa, Workbox auto-update)
- [x] `MidiService` singleton wrapping Web MIDI API, RX + TX support
- [x] `midi-store` with port enumeration, auto-select "HX Effects" output
- [x] `MidiMonitor` drawer component (color-coded RX/TX log, 200-message cap)
- [x] Five-store Zustand architecture established
- [x] Incoming and outgoing MIDI display verified
- [x] TypeScript strict, zero compile errors

---

## Phase 1 — Device Profiles & Parameter Control (Week 3–4) ✅ COMPLETE

**Goal:** Build the device profile system and real-time parameter control UI for both pedals.

### Deliverables

- [x] **Device Profile JSON Schema** — 6 parameter types (`continuous`, `bipolar`, `toggle`, `select`, `three_way`, `linked_pair`), `dynamicLabel`, `stereoLinked`, `midiOutputName`
- [x] **R1 Device Profile** — 15 parameters with verified CC assignments, 16 preset slots, dynamic X-knob label
- [x] **ACS1 MKII Device Profile** — 28+ parameters, stereo L/R linked pairs, 16 preset slots
- [x] **Control Components** — `Knob`, `BipolarKnob`, `BipolarSlider`, `Toggle`, `Selector` (segmented/grid/dropdown), `ThreeWaySwitch`, `LinkedPairControl`
- [x] **`R1Layout`** — grouped control surface with BipolarSlider for Swell/Duck
- [x] **`ACS1Layout`** — stereo channel-strip layout, Mono/Stereo toggle, global sections
- [x] Real-time CC transmission (no debounce) via `device-store.setParameterValue()`
- [x] Stereo link/unlink with automatic CC mirroring
- [x] Per-device MIDI channel override
- [x] `ResizablePanels` split layout (default 40/60 split)
- [x] `SettingsPanel` with MIDI port selector, channel overrides, keyboard shortcut viewer
- [x] `useKeyboardShortcuts` hook with configurable bindings

### Exit Criteria ✅

- [x] Both device profiles load from JSON config files
- [x] Every documented CC parameter for R1 is controllable from the UI
- [x] Every documented CC parameter for ACS1 MKII is controllable from the UI
- [x] Parameter changes send correct CC messages on the correct channel
- [x] Adding a new device requires only a new JSON file + one import in App.tsx

---

## Phase 2 — Preset Management (Week 5–6) ✅ Core Complete

**Goal:** Save, load, organize, import, and export presets for both pedals.

### Deliverables

- [x] **Preset Data Model v1** — UUID, name, tags, deviceId, full CC snapshot, timestamps, optional chainPosition
- [x] **IndexedDB via Dexie.js** — `presets` table (indexed: deviceId, name, *tags, createdAt, modifiedAt), `settings` table
- [x] **Save preset** — name input, captures current parameterValues, stores to IndexedDB
- [x] **Load preset** — click-to-load, sends all CCs to physical pedal
- [x] **Delete preset** — per-preset delete button
- [x] **A/B Comparison** — in-memory snapshot slots, instant flip
- [x] **Export** — all device presets as JSON bundle (`PresetExport` format v1)
- [x] **Import** — file picker, `isValidPresetExport()` validation, `bulkPut()` to IndexedDB
- [x] **`PresetDrawer`** — right-side sliding drawer, scoped to focused device
- [x] App works fully offline after initial load (PWA service worker)

### Outstanding (Phase 2 backlog)
- [ ] Preset search / filter by name or tags
- [ ] Duplicate preset (clone with new UUID)
- [ ] Edit preset metadata (name, tags, description)
- [ ] Drag-and-drop JSON import

### Exit Criteria
- [x] Full save/load/delete lifecycle works for both devices
- [x] Presets persist across browser sessions (IndexedDB)
- [x] Exported JSON can be re-imported on a different machine
- [x] Preset load sends correct CC values and pedal responds accurately
- [x] App works offline after initial load

---

## Phase 3 — Performance Mode & Setlists (Week 7–8) ⏳ IN PROGRESS

**Goal:** Build a streamlined, stage-ready UI for live use.

### Deliverables

- [x] **`performance-store`** — `Setlist` + `SetlistEntry` types, `enterPerformanceMode`, `exitPerformanceMode`, `nextPreset`, `previousPreset`, `goToIndex`, `setActiveSetlist`
- [ ] **Performance Mode UI** — full-screen, high-contrast, large touch targets, current preset name, next/prev navigation, tap-to-exit
- [ ] **Setlist Management UI** — create/edit/delete setlists, per-entry song name, drag-and-drop reorder
- [ ] **MIDI Input Mapping** — foot controller CC → app action routing, configurable mapping table stored in `settings`
- [ ] **Setlist Import/Export**

---

## Phase 4 — Polish, Testing & Deployment (Week 9–10) ⏳ IN PROGRESS

**Goal:** Reliable, well-tested, deployable application.

### Deliverables

- [x] **Unit test suite** — Vitest + jsdom: device-profile validation, midi-utils, preset-validation
- [x] **Mock MIDI devices** — `MockMIDIInput.simulateMessage()`, `MockMIDIOutput.sentMessages[]`
- [x] **TypeScript strict** — `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, zero errors
- [x] **ESLint** configured
- [ ] Integration tests (component + store interaction)
- [ ] PWA icons finalized (192, 512, 512 maskable)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Lighthouse PWA audit ≥ 90
- [ ] Production deployment

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