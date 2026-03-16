# WalrusController3.1 — Planning

React 19 + Vite + TypeScript + Zustand MIDI controller app for Walrus Audio R1 and ACS1 MKII pedals.

Last updated: 2026-03-15

---

## Current Focus: Phase 3 — Performance Mode & Setlists

---

## Phase Status

| Phase | Description | Status |
|---|---|---|
| Phase 0 | Foundation (toolchain, project scaffold, core services) | ✅ Complete |
| Phase 1 | Device Profiles & Parameter Control | ✅ Complete |
| Phase 2 | Preset Management | ✅ Core complete — 3 items remaining |
| Phase 3 | Performance Mode & Setlists | ⏳ In Progress |
| Phase 4 | Polish, Testing, Deployment | ⏳ In Progress |

---

## Phase 3 Tasks — Active

### 1. Performance Mode UI

- [ ] Create `PerformanceModeView` full-screen component (`src/components/PerformanceModeView.tsx`)
  - Display active preset name, index, and total count
  - Previous / Next controls (wired to `performance-store` `previousPreset` / `nextPreset`)
  - Jump-to-index control for direct preset selection within the setlist
  - Exit button calling `exitPerformanceMode`
- [ ] Style `PerformanceModeView` for large-screen / stage readability (high contrast, large text)
- [ ] Display active device (R1 vs ACS1 MKII) and current parameter values in performance view

### 2. Setlist CRUD UI

- [ ] Create `SetlistManager` component (`src/components/SetlistManager.tsx`)
  - List all saved setlists with name and preset count
  - Create new setlist (name input + preset selector)
  - Edit setlist name and metadata
  - Delete setlist with confirmation
- [ ] Create `SetlistEditor` component (`src/components/SetlistEditor.tsx`)
  - Ordered list of presets in the setlist
  - Add preset from library (searchable dropdown)
  - Remove preset from setlist
  - Reorder presets (drag-and-drop or up/down buttons)
- [ ] Wire `SetlistManager` and `SetlistEditor` into a coherent setlist management flow

### 3. App.tsx Wiring

- [ ] Add `performanceModeActive` selector from `performance-store` in `App.tsx`
- [ ] Conditionally render `PerformanceModeView` when performance mode is active (full-screen takeover)
- [ ] Add entry point to `SetlistManager` in the main app nav or preset panel
- [ ] Verify `enterPerformanceMode` is callable from the setlist management flow with the correct setlist ID

### 4. MIDI Input Mapping — Service Layer

- [ ] Implement MIDI input mapping evaluation logic in `midi-service`
  - Read mapping configs from `settings` IndexedDB table
  - On incoming MIDI message, evaluate against all active mappings
  - Dispatch matched actions (next preset, previous preset, go to index, toggle performance mode, parameter CC override)
- [ ] Define `MidiInputMapping` type (`src/types/midi-input-mapping.ts`)
  - Fields: `id`, `label`, `channel`, `messageType` (note/cc/pc), `matchValue`, `action`, `actionPayload`
- [ ] Create `midi-mapping-service` (`src/services/midi-mapping-service.ts`) for CRUD on mappings in IndexedDB
- [ ] Write unit tests for mapping evaluation logic (Vitest)

### 5. MIDI Input Mapping — Config UI

- [ ] Create `MidiMappingConfig` component (`src/components/MidiMappingConfig.tsx`)
  - List all saved mappings
  - Add new mapping: select message type, channel, value, and target action
  - MIDI learn mode: listen for next incoming message and auto-fill channel/type/value
  - Edit and delete existing mappings
- [ ] Integrate `MidiMappingConfig` into app settings or performance mode setup flow

### 6. Setlist Import / Export

- [ ] Implement setlist export — serialize setlist + referenced preset snapshots to JSON file download
- [ ] Implement setlist import — parse JSON, validate schema, merge into IndexedDB (handle ID collisions)
- [ ] Add import / export buttons to `SetlistManager`

---

## Phase 2 Remaining

Lower priority — core preset management is complete. These are UI/UX improvements.

- [ ] Preset search / filter by name or tags in the preset browser
- [ ] Preset duplicate and edit metadata (data model already supports it — UI not yet exposed)
- [ ] Drag-and-drop import of preset JSON files into the preset browser

---

## Phase 4 Remaining

- [ ] Integration tests (device profile → preset save → performance mode round-trip)
- [ ] PWA icons finalized (all required sizes generated and registered in `manifest.json`)
- [ ] CI/CD pipeline (GitHub Actions: lint → type-check → unit tests → build)
- [ ] Production deployment target defined and configured

---

## Notes

**What already exists in Phase 3:**
- `src/stores/performance-store.ts` — fully implemented. Has `Setlist` model, `enterPerformanceMode`, `exitPerformanceMode`, `nextPreset`, `previousPreset`, `goToIndex`.
- `preset-store` and `preset-service` — fully wired and available for setlist use.
- `midi-service` — logs all incoming MIDI messages. The `settings` IndexedDB table is reserved for MIDI input mapping configs but no evaluation logic exists yet.

**Build order rationale:**
Performance Mode UI and Setlist CRUD UI can be built in parallel since they draw from already-implemented store logic. App.tsx wiring should happen after both are in a working state. MIDI input mapping is intentionally last — it is the most complex and least blocking feature; the app is fully usable in performance mode without it. Setlist import/export is deferred until the CRUD UI is stable.

**MIDI input mapping design intent:**
Mappings should be stored as plain config objects in IndexedDB (not hardcoded). The evaluation loop in `midi-service` should be a pure function: given a raw MIDI message and an array of mapping configs, return the matched action (or null). This makes it trivially testable and decoupled from the store.
