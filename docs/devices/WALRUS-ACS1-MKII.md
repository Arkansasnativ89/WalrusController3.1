# Walrus Audio ACS1 MKII — MIDI Implementation

> ACS1 MKII amp + cab simulator MIDI CC map and device profile reference.

## Status: ✅ Implemented

Profile file: `src/data/device-profiles/walrus-acs1-mkii.json`

## Device Info

| Field | Value |
|-------|-------|
| Profile ID | `walrus-acs1-mkii` |
| Manufacturer | Walrus Audio |
| Category | Amp Simulator |
| Default MIDI Channel | 7 (0-indexed: 6) |
| Bypass CC | 30 |
| MIDI Output Auto-Match | `"HX Effects"` |
| Stereo Linked | Yes (default) |

## Stereo Architecture

All core tone parameters exist as L/R pairs (type `linked_pair`). When linked (default), moving one control mirrors the value to both CCs. When unlinked, each side is independently controllable. The Mono/Stereo toggle is rendered at the top of the `ACS1Layout`.

## Parameter CC Map

### EQ (Linked Pairs)

| Parameter | ID | CC L | CC R | Type |
|-----------|----|------|------|------|
| Bass | `acs1-bass-l` / `acs1-bass-r` | 3 | 9 | `linked_pair` |
| Mid | `acs1-mid-l` / `acs1-mid-r` | 14 | 15 | `linked_pair` |
| Treble | `acs1-treble-l` / `acs1-treble-r` | 20 | 21 | `linked_pair` |

### Amp (Linked Pairs)

| Parameter | ID | CC L | CC R | Type |
|-----------|----|------|------|------|
| Volume | `acs1-volume-l` / `acs1-volume-r` | 22 | 23 | `linked_pair` |
| Gain | `acs1-gain-l` / `acs1-gain-r` | 24 | 25 | `linked_pair` |

### Cabinet IR (Linked Pairs)

| Parameter | ID | CC L | CC R | Type | Options |
|-----------|----|------|------|------|---------|
| Cabinet IR | `acs1-cab-l` / `acs1-cab-r` | 26 | 27 | `linked_pair` / `select` | 12 options (see below) |

Cabinet IR options (each with 2 mic choices):
- `'66 Fender` (SM57 / Ribbon)
- `Marshall JTM50` (SM57 / Ribbon)
- `Vox AC30` (SM57 / Ribbon)
- `Mesa 4×12` (SM57 / Ribbon)
- `Kerry Wright 4×12` (SM57 / Ribbon)
- `Marshall 1960bv` (SM57 / Ribbon)

### Amp Model (Linked Pairs)

| Parameter | ID | CC L | CC R | Type | Options |
|-----------|----|------|------|------|---------|
| Amp Model | `acs1-amp-l` / `acs1-amp-r` | 28 | 29 | `linked_pair` / `select` | 6 models (see below) |

Amp Model options: Fullerton (Fender), London (Marshall), Dartford (Vox), Red (Peavey), Citrus (Orange), Tread (Mesa)

### Boost

| Parameter | ID | CC | Type |
|-----------|----|----|------|
| Boost Engage | `acs1-boost-engage` | 31 | `toggle` |
| Boost Gain | `acs1-boost-gain` | 32 | `continuous` |
| Boost Volume | `acs1-boost-volume` | 33 | `continuous` |

### Filters

| Parameter | ID | CC | Type |
|-----------|----|----|------|
| HPF | `acs1-hpf` | 36 | `continuous` |
| LPF | `acs1-lpf` | 37 | `continuous` |

### Noise Gate

| Parameter | ID | CC | Type |
|-----------|----|----|------|
| Gate Threshold | `acs1-gate-threshold` | 89 | `continuous` |
| Gate Release | `acs1-gate-release` | 90 | `continuous` |

### Room / Reverb

| Parameter | ID | CC | Type | Options |
|-----------|----|----|------|---------|
| Room Level | `acs1-room-level` | 101 | `continuous` | |
| Room Type | `acs1-room-type` | 102 | `select` | Room / Hall / Spring |
| Room Decay | `acs1-room-decay` | 103 | `continuous` | |

### Post-Amp EQ

| Parameter | ID | CC | Type |
|-----------|----|----|------|
| Presence | `acs1-presence` | 104 | `continuous` |
| Resonance | `acs1-resonance` | 105 | `continuous` |

### System Toggles

| Parameter | ID | CC | Type |
|-----------|----|----|------|
| Bypass | `acs1-bypass` | 30 | `toggle` |
| IR Bypass | `acs1-ir-bypass` | 85 | `toggle` |
| Amp Bypass | `acs1-amp-bypass` | 86 | `toggle` |

## Preset Slots (PC)

| PC | Slot Name | Bank |
|----|-----------|------|
| 0 | Bank A — 1 | A (Red) |
| 1 | Bank A — 2 | A (Red) |
| 2 | Bank A — 3 | A (Red) |
| 3 | Bank B — 1 | B (Green) |
| 4 | Bank B — 2 | B (Green) |
| 5 | Bank B — 3 | B (Green) |
| 6 | Bank C — 1 | C (Blue) |
| 7 | Bank C — 2 | C (Blue) |
| 8 | Bank C — 3 | C (Blue) |
| 9–15 | Extended Slot 10–16 | — |

## Control Surface Layout

The ACS1 uses `ACS1Layout` in `DeviceControlSurface.tsx`:

1. **Mono/Stereo toggle** at the top — linked/unlinked state
2. **Channel Strip** — in Mono mode: one `ACS1ChannelColumn` (L side mirrors to R). In Stereo mode: two independent columns
   - Each column: Amp Model (dropdown), Cabinet IR (dropdown), Gain (knob), Volume (knob), Bass/Mid/Treble EQ (small knobs)
3. **Global Sections** below the channel strip:
   - Boost (Engage toggle, Gain knob, Volume knob)
   - Filters (HPF, LPF knobs)
   - Noise Gate (Threshold, Release knobs)
   - Room / Reverb (Level, Type selector, Decay knob)
   - Post-Amp EQ (Presence, Resonance knobs)
   - System Toggles (Bypass, IR Bypass, Amp Bypass)
