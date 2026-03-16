# System Overview

> High-level architecture and data flow for the Walrus MIDI Controller.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React UI Layer                           │
│  App.tsx ──► ResizablePanels                                    │
│               ├── DevicePanel (R1)  ──► DeviceControlSurface    │
│               │     └── R1Layout (Knob, Toggle, Selector, …)    │
│               └── DevicePanel (ACS1) ──► DeviceControlSurface   │
│                     └── ACS1Layout (LinkedPairControl, …)       │
│  Overlays: MidiMonitor | PresetDrawer | SettingsPanel           │
└───────────────────────┬─────────────────────────────────────────┘
                        │ reads / dispatches actions
┌───────────────────────▼─────────────────────────────────────────┐
│                      Zustand Stores                             │
│  device-store   midi-store   preset-store   performance-store   │
│  ui-store                                                       │
└───────┬───────────────────────────┬─────────────────────────────┘
        │ calls                     │ calls
┌───────▼───────┐       ┌───────────▼──────────────┐
│  midi-service │       │  preset-service           │
│  (Web MIDI)   │       │  storage-service (Dexie)  │
└───────┬───────┘       └───────────┬──────────────┘
        │                           │
   USB MIDI out              IndexedDB
  (HX Effects)               (presets + settings)
```

## Core Layers

### UI Layer (React 19 + Tailwind CSS v4)
- `App.tsx` — app shell, navbar, MIDI-status LEDs, panel/overlay management
- `DeviceControlSurface` — routes to device-specific layouts (`R1Layout`, `ACS1Layout`)
- Control primitives — `Knob`, `BipolarKnob`, `BipolarSlider`, `Toggle`, `Selector`, `ThreeWaySwitch`, `LinkedPairControl`
- `MidiMonitor` — slide-up RX/TX message log drawer
- `PresetDrawer` — right-side preset browser with A/B comparison, save, load, delete, import/export
- `SettingsPanel` — MIDI port selection, per-device channel override, keyboard shortcut viewer
- `ResizablePanels` — draggable split-panel layout

### State Layer (Zustand v5)
- `device-store` — loaded profiles, per-device parameter values, stereo link groups, channel overrides
- `midi-store` — connection state, port enumeration, message log (capped at 200)
- `preset-store` — preset library, loading/error state, CRUD actions delegating to preset-service
- `performance-store` — setlist and performance mode (store implemented; UI not yet wired)
- `ui-store` — panel visibility flags, keyboard binding definitions

### Service Layer
- `midi-service` — singleton Web MIDI API wrapper; handles connect/disconnect, port selection, send, RX/TX listeners
- `preset-service` — thin CRUD layer over Dexie: getAllPresets, save, delete, exportPresets, importPresets
- `storage-service` — Dexie database definition (`WalrusControllerDB` v1: `presets` + `settings` tables)

### Data Layer
- `src/data/device-profiles/*.json` — static device capability definitions (R1, ACS1 MKII)
- IndexedDB (`presets` table, `settings` table)

## Data Flow

### Outgoing (user → pedal)
1. User drags a knob or clicks a control
2. Control component calls `device-store.setParameterValue(deviceId, paramId, value)`
3. Store clamps the value, mirrors to paired parameter if stereo-linked
4. Store calls `midiService.send(buildCC(channel, cc, value))`
5. `midiService.notifyOutgoing()` parses the outgoing bytes and dispatches to all message listeners
6. `midi-store` appends the outgoing message to the log
7. React re-renders the control with the new value

### Incoming (pedal/foot controller → app)
1. Physical device sends a MIDI message
2. `midiService` `onmidimessage` fires; parses raw bytes via `parseMidiMessage()`
3. Dispatches to all registered message listeners
4. `midi-store` appends the incoming message to the log
5. `MidiMonitor` component re-renders the new entry
