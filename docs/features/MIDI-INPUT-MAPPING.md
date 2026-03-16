# MIDI Input Mapping

> Incoming MIDI message → app action mapping.

## Status: ❌ Not yet implemented (Phase 3)

MIDI input mapping is planned for Phase 3. The architecture supports it
(`midi-store` already logs all incoming messages and the `settings` IndexedDB table
is reserved for storing mapping configs), but no mapping evaluation logic or
configuration UI has been built yet.

---

## Planned Design

### Purpose

Allow a MIDI foot controller (or the pedals themselves sending PC/CC) to trigger
app actions such as navigating presets and setlists, toggling bypass, or entering
performance mode.

### Planned Action Mappings

| Action | Trigger Type | Notes |
|--------|-------------|-------|
| Next Preset | CC value ≥ 64 | Configurable CC + channel |
| Previous Preset | CC value ≥ 64 | Configurable CC + channel |
| Toggle R1 Bypass | CC value ≥ 64 | |
| Toggle ACS1 Bypass | CC value ≥ 64 | |
| Enter Performance Mode | CC or PC | |
| Exit Performance Mode | CC or PC | |

### Planned Storage Format (`settings` table key: `midiInputMappings`)

```json
[
  {
    "action": "nextPreset",
    "messageType": "cc",
    "channel": 15,
    "data1": 64,
    "threshold": 64
  }
]
```

### Evaluation Logic (planned)

1. Incoming message parsed by `midiService`
2. Checked against mapping table in order
3. First match triggers the corresponding store action
4. Keyboard shortcuts (`useKeyboardShortcuts.ts`) already implement the same
   action names — MIDI mappings will reuse those action strings

---

## Current Workaround

Keyboard shortcuts (`useKeyboardShortcuts.ts`) provide equivalent functionality
for desktop use:

| Action | Default Key |
|--------|-------------|
| Toggle R1 Bypass | `1` |
| Toggle ACS1 Bypass | `2` |
| Toggle R1 Sustain | `S` |
| Toggle ACS1 Boost | `B` |
| Open Preset Drawer | `P` |
| Open MIDI Monitor | `M` |
| Save Preset | `Ctrl+S` |
| A/B Compare Toggle | `A` |

---

## Phase 3 Execution Plan

### Files to Create
| File | What it does |
|------|-------------|
| `src/services/midi-mapping-service.ts` | Loads/saves mapping configs from IndexedDB `settings` table; exports `evaluateMapping(msg)` |

### Files to Edit
| File | Change |
|------|--------|
| `src/services/midi-service.ts` | On `onmidimessage`: after logging to `midi-store`, call `midiMappingService.evaluate(parsedMsg)` |
| `src/components/panels/SettingsPanel.tsx` | Add a "MIDI Input Mappings" section — table of action → CC/channel, with a "Learn" button |
| `src/stores/ui-store.ts` | Reuse existing action name strings (same ones used by `useKeyboardShortcuts`) as the `action` field in mapping configs |

### Build Order
1. `midi-mapping-service.ts` — implement `loadMappings()` (reads `settings` table key `midiInputMappings`), `saveMappings()`, and `evaluate(msg: MidiMessage): void` which fires the matching store action
2. Wire `midi-service.ts` — call `midiMappingService.evaluate()` in the message handler
3. Add mapping config UI to `SettingsPanel.tsx` — editable table with columns: Action | Type | Channel | CC# | Threshold. Add a "Learn" button that listens for the next incoming CC and auto-fills the row
4. Wire Save — on row change, call `midiMappingService.saveMappings()`

### Action Names (reuse from `useKeyboardShortcuts.ts`)
- `toggleR1Bypass`
- `toggleACS1Bypass`
- `toggleR1Sustain`
- `toggleACS1Boost`
- `nextPreset`
- `previousPreset`
- `enterPerformanceMode`
- `exitPerformanceMode`
