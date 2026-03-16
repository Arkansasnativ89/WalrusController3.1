# Roadmap

> Phase timeline and milestones. Last updated: 2026-03-15.

## Phase 0 — Foundation (Week 1–2) ✅ Complete
- [x] Project scaffolding (Vite + React 19 + TypeScript strict)
- [x] Tailwind CSS v4 configuration
- [x] PWA manifest and service worker (vite-plugin-pwa)
- [x] Web MIDI API service layer (singleton, RX + TX)
- [x] MIDI monitor component (slide-up drawer, color-coded RX/TX log)
- [x] MIDI port enumeration and selection
- [x] Auto-select "HX Effects" output on connect
- [x] Zustand store architecture (device, midi, preset, performance, ui)
- [x] Incoming and outgoing MIDI display verified

## Phase 1 — Device Profiles & Parameter Control (Week 3–4) ✅ Complete
- [x] Device profile JSON schema finalized (6 parameter types + dynamicLabel)
- [x] R1 profile with verified CC assignments (15 parameters, 16 preset slots)
- [x] ACS1 MKII profile with verified CC assignments (28+ parameters, stereo pairs, 16 preset slots)
- [x] `Knob`, `BipolarKnob`, `BipolarSlider`, `Toggle`, `Selector`, `ThreeWaySwitch`, `LinkedPairControl` components
- [x] `R1Layout` — grouped parameter control surface
- [x] `ACS1Layout` — stereo channel-strip layout with Mono/Stereo toggle
- [x] Real-time CC transmission on every value change (no debounce)
- [x] Dynamic labels (X knob relabeled by reverb program)
- [x] Stereo link / unlink with automatic CC mirroring
- [x] Keyboard shortcuts (`useKeyboardShortcuts`)
- [x] Per-device channel override (Settings panel)
- [x] Resizable split-panel layout (`ResizablePanels`)

## Phase 2 — Preset Management (Week 5–6) ✅ Complete (core)
- [x] Preset data model v1 (UUID, timestamps, full CC snapshot, tags)
- [x] IndexedDB storage via Dexie.js (`presets` + `settings` tables)
- [x] Save current parameter state as named preset
- [x] Load preset → sends all CCs to pedal
- [x] Delete preset
- [x] A/B comparison (in-memory snapshot flip)
- [x] Export all device presets as JSON bundle
- [x] Import presets from JSON file with validation
- [x] Preset browser (drawer, list by device)
- [ ] Preset search / filter by name or tags
- [ ] Preset duplicate / edit metadata
- [ ] Drag-and-drop import

## Phase 3 — Performance Mode & Setlists (Week 7–8) ⏳ In Progress
- [x] `performance-store` — setlist model, navigation actions, mode toggle
- [ ] Performance mode full-screen UI
- [ ] Setlist CRUD UI
- [ ] MIDI input mapping (foot controller → app actions)
- [ ] Setlist import/export

## Phase 4 — Polish, Testing & Deployment (Week 9–10) ⏳ In Progress
- [x] Unit test suite (Vitest + jsdom): device-profile, midi-utils, preset-validation
- [x] Mock MIDI device for CI testing
- [x] TypeScript strict mode, zero compile errors
- [x] ESLint configured
- [ ] Integration tests
- [ ] PWA icons finalized
- [ ] CI/CD pipeline
- [ ] Production deployment
