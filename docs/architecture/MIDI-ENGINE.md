# MIDI Engine

> MIDI subsystem design and message flow.

## Web MIDI API Integration

The app uses the raw Web MIDI API (no wrapper library) via a singleton `MidiService` class (`src/services/midi-service.ts`). SysEx is not requested (`sysex: false`).

### Connection Flow

1. `midi-store.initialize()` calls `midiService.connect()`
2. `midiService` calls `navigator.requestMIDIAccess({ sysex: false })`
3. On success: enumerates ports, registers an `onstatechange` listener for hot-plug events
4. Reports `MidiPortInfo[]` back to the store for display in the Settings panel
5. If a port whose name contains the string `"HX Effects"` is found among outputs, it is auto-selected
6. User can override input/output from the Settings panel; the store calls `midiService.selectInput(id)` / `midiService.selectOutput(id)`
7. Selected input: `onmidimessage` handler is attached
8. Selected output: reference stored on the service; all `send()` calls use it

### Message Types Used

| Type | Status Byte | Usage |
|------|-------------|-------|
| Control Change (CC) | `0xB0–0xBF` | Real-time parameter changes |
| Program Change (PC) | `0xC0–0xCF` | Preset/bank recall |

### Outgoing Message Construction (`src/utils/midi-utils.ts`)

```ts
buildCC(channel, cc, value): Uint8Array   // 3 bytes: [0xB0|ch, cc & 0x7F, val & 0x7F]
buildPC(channel, program): Uint8Array     // 2 bytes: [0xC0|ch, program & 0x7F]
```

All values are masked to their valid bit widths before transmission.

### Incoming Message Parsing

```ts
parseMidiMessage(data: Uint8Array, direction: 'in' | 'out'): MidiMessage
```

Splits the status byte into `status` (upper nibble) and `channel` (lower nibble). Returns a structured `MidiMessage` object.

### TX Monitoring

Outgoing messages are also surfaced to the MIDI monitor. Before calling `output.send()`, `midiService.notifyOutgoing(data)` parses the bytes and dispatches them to all registered message listeners with `direction: 'out'`. This means the `MidiMonitor` component shows both RX and TX traffic.

## Event Subscription

`midiService` exposes a simple pub/sub API:
- `onMessage(callback)` — subscribe to incoming and outgoing parsed messages; returns an unsubscribe function
- `onConnectionChange(callback)` — subscribe to port state changes; returns an unsubscribe function

Subscribers are stored in `Set<callback>` — no duplicates and O(1) removal.

## MIDI Channel Resolution

Each device has a `defaultChannel` (0-indexed, from its profile JSON). Users can override this per-device from the Settings panel. `device-store.getEffectiveChannel(deviceId)` returns the override if set, otherwise returns the profile default.

## Latency Considerations

- Web MIDI API adds minimal overhead (~1ms round-trip)
- CC messages are sent immediately on every parameter value change — no debounce, no batching
- This ensures the physical pedal tracks the UI in real time
