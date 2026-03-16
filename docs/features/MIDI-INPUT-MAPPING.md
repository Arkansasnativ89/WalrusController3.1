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
