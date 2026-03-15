# MIDI Input Mapping

> Incoming MIDI message to app action mapping.

## Purpose

Allow external MIDI controllers (foot switches, control surfaces) to trigger app actions like navigating presets and setlists.

## Mapping Table

| Action | Default Mapping | Configurable |
|--------|----------------|-------------|
| Next Preset | CC 64, Ch 16, value ≥ 64 | ✅ |
| Previous Preset | CC 65, Ch 16, value ≥ 64 | ✅ |
| Toggle Bypass | CC 66, Ch 16, value ≥ 64 | ✅ |
| Enter Performance Mode | — | ✅ |
| Exit Performance Mode | — | ✅ |

## Configuration

Mappings stored in IndexedDB settings table:
```json
{
  "key": "midiInputMappings",
  "value": [
    {
      "action": "nextPreset",
      "messageType": "cc",
      "channel": 15,
      "data1": 64,
      "threshold": 64
    }
  ]
}
```

## Implementation

- MIDI input listener checks incoming messages against mapping table
- Matching messages trigger corresponding store actions
- Mappings are evaluated in order; first match wins
