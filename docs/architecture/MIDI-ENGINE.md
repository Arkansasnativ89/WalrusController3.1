# MIDI Engine

> MIDI subsystem design and message flow.

## Web MIDI API Integration

The app uses the raw Web MIDI API (no wrapper library) via a singleton `MidiService` class.

### Connection Flow

1. Call `navigator.requestMIDIAccess({ sysex: false })`
2. Enumerate inputs and outputs
3. User selects input/output from dropdown
4. Input: attach `onmidimessage` handler
5. Output: call `send()` with byte arrays

### Message Types Used

| Type | Status Byte | Usage |
|------|------------|-------|
| Control Change (CC) | 0xB0-0xBF | Parameter changes |
| Program Change (PC) | 0xC0-0xCF | Preset recall |

### Outgoing Messages

Built via utility functions:
- `buildCC(channel, cc, value)` → `Uint8Array[3]`
- `buildPC(channel, program)` → `Uint8Array[2]`

### Incoming Messages

Parsed via `parseMidiMessage(data, direction)` into structured `MidiMessage` objects.

## Device Detection

Walrus pedals are identified by matching port names against known strings (e.g., "Walrus" in the device name).

## Latency Considerations

- Web MIDI API adds minimal overhead (~1ms)
- CC messages are sent immediately on parameter change (no debounce)
- Benchmark in Phase 0 to confirm live performance viability
