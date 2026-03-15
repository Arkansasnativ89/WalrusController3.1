# Walrus Audio R1 — MIDI Implementation

> R1 (MKI) reverb pedal MIDI CC map and implementation notes.

## Status: ⬜ Awaiting Official MIDI Chart

**The CC assignments below are PLACEHOLDERS. Must be updated with the official Walrus Audio R1 MIDI Implementation Chart before Phase 1 work begins.**

## Known Parameters

| Parameter | Placeholder CC | Type | Range | Notes |
|-----------|---------------|------|-------|-------|
| Reverb Type | CC 21 | Select | 0-127 | Multiple algorithms |
| Decay | CC 22 | Knob | 0-127 | |
| Tone | CC 23 | Knob | 0-127 | |
| Damping | CC 24 | Knob | 0-127 | |
| Modulation | CC 25 | Knob | 0-127 | |
| Mix | CC 26 | Knob | 0-127 | |
| Bypass | CC 102 | Toggle | 0/127 | |

## Preset Slots

| PC # | Factory Name |
|------|-------------|
| 0 | Preset 1 |
| 1 | Preset 2 |
| 2 | Preset 3 |

## Notes

- Default MIDI channel: TBD (assumed channel 1 / index 0)
- USB MIDI device name string: TBD
- Firmware version tested: TBD
