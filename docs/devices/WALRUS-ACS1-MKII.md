# Walrus Audio ACS1 MKII — MIDI Implementation

> ACS1 MKII amp + cab sim MIDI CC map and implementation notes.

## Status: ⬜ Awaiting Official MIDI Chart

**The CC assignments below are PLACEHOLDERS. Must be updated with the official Walrus Audio ACS1 MKII MIDI Implementation Chart before Phase 1 work begins.**

## Known Parameters

| Parameter | Placeholder CC | Type | Range | Notes |
|-----------|---------------|------|-------|-------|
| Amp Model | CC 21 | Select | 0-127 | Multiple amp voicings |
| Gain | CC 22 | Knob | 0-127 | |
| Bass | CC 23 | Knob | 0-127 | |
| Mid | CC 24 | Knob | 0-127 | |
| Treble | CC 25 | Knob | 0-127 | |
| Volume | CC 26 | Knob | 0-127 | |
| Reverb | CC 27 | Knob | 0-127 | |
| Cabinet Sim | CC 28 | Toggle | 0/127 | On/Off |
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
