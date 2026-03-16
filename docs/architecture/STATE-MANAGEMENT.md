# State Management

> Zustand v5 store shape and actions for the Walrus MIDI Controller.

## Store Architecture

Five independent Zustand stores, each managing a specific domain. Stores call services directly — no middleware, no thunks.

---

### `device-store` (`src/stores/device-store.ts`)

The central store for device state.

**State shape:**
```ts
{
  profiles: DeviceProfile[];
  devices: Record<string, PerDeviceState>; // keyed by deviceId
  focusedDeviceId: string | null;
}

type PerDeviceState = {
  parameterValues: Record<string, number>; // paramId → 0–127
  linkedGroups: Record<string, boolean>;   // groupName → isLinked
  channelOverride: number | null;           // null = use profile default
};
```

**Key actions:**
- `loadProfiles(profiles)` — initialises per-device state from profile defaults
- `setParameterValue(deviceId, paramId, value)` — clamps value, sends CC via `midiService`, mirrors to stereo-linked pair if active
- `setAllParameters(deviceId, values)` — bulk load a parameter snapshot (preset recall)
- `sendAllParameters(deviceId)` — re-transmit all current CC values to the physical pedal
- `sendProgramChange(deviceId, program)` — sends a PC message
- `toggleBypass(deviceId)` — finds the bypass parameter and toggles it 0 ↔ 127
- `setChannelOverride(deviceId, channel)` / `getEffectiveChannel(deviceId)` — per-device channel logic
- `setGroupLinked(deviceId, group, linked)` / `isGroupLinked(deviceId, group)` — stereo link toggle
- `setFocusedDevice(deviceId)` — sets which device the Preset Drawer acts on

---

### `midi-store` (`src/stores/midi-store.ts`)

**State shape:**
```ts
{
  isSupported: boolean;
  isConnected: boolean;
  inputs: MidiPortInfo[];
  outputs: MidiPortInfo[];
  selectedInputId: string | null;
  selectedOutputId: string | null;
  error: string | null;
  messageLog: MidiMessage[];  // capped at 200 entries
}
```

**Key actions:**
- `initialize()` — calls `midiService.connect()`, subscribes to connection and message events, auto-selects output matching `"HX Effects"`
- `selectInput(id)` / `selectOutput(id)` — updates selected port, delegates to `midiService`
- `disconnect()` — clears all connection state
- `clearLog()` — empties the message log

---

### `preset-store` (`src/stores/preset-store.ts`)

**State shape:**
```ts
{ presets: Preset[];  loading: boolean;  error: string | null; }
```

**Key actions (all delegate to `preset-service`):**
- `loadPresets()` / `loadPresetsByDevice(deviceId)` — fetch from IndexedDB
- `savePreset(preset)` — validates + writes to IndexedDB, refreshes state
- `deletePreset(id)` — removes from IndexedDB, refreshes state
- `importPresets(data)` — bulk-validates and imports a `PresetExport` bundle

---

### `performance-store` (`src/stores/performance-store.ts`)

> **Status:** Store is fully implemented. Performance mode UI is not yet wired into the main App.

**State shape:**
```ts
{
  isPerformanceMode: boolean;
  activeSetlist: Setlist | null;
  currentIndex: number;
  setlists: Setlist[];
}

type Setlist = { id, name, entries: SetlistEntry[], createdAt, modifiedAt };
type SetlistEntry = { presetId: string, songName?: string };
```

**Key actions:** `enterPerformanceMode`, `exitPerformanceMode`, `setActiveSetlist`, `nextPreset`, `previousPreset`, `goToIndex`

---

### `ui-store` (`src/stores/ui-store.ts`)

**State shape:**
```ts
{
  midiMonitorOpen: boolean;
  presetDrawerOpen: boolean;
  settingsOpen: boolean;
  keyBindings: KeyBinding[];
}
```

Default key bindings: `1` = R1 bypass, `2` = ACS1 bypass, `s` = R1 sustain, `b` = ACS1 boost, `p` = preset drawer, `m` = MIDI monitor, `Ctrl+S` = save preset, `a` = A/B compare toggle.

**Key actions:** `toggleMidiMonitor`, `togglePresetDrawer`, `toggleSettings`, `updateKeyBinding`, `resetKeyBindings`

---

## Design Decisions

- No global store — each domain is fully independent, no cross-store subscriptions at store level
- Stores call services directly (no middleware layers)
- `midiService` is a singleton module, never stored in React state
- Message log uses an immutable `slice(-200)` cap — oldest entries drop off automatically
- Per-device state in `device-store` is keyed by `deviceId` string, supporting arbitrary device counts
