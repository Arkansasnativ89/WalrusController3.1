# Walrus Audio R1 — MIDI Implementation

> R1 reverb pedal MIDI CC map and device profile reference.

## Status: ✅ Implemented

Profile file: `src/data/device-profiles/walrus-r1.json`

## Device Info

| Field | Value |
|-------|-------|
| Profile ID | `walrus-r1` |
| Manufacturer | Walrus Audio |
| Category | Reverb |
| Default MIDI Channel | 5 (0-indexed: 4) |
| Bypass CC | 30 |
| MIDI Output Auto-Match | `"HX Effects"` |
| Stereo Linked | No |

## Parameter CC Map

| Parameter | ID | CC | Type | Range | Notes |
|-----------|----|----|------|-------|-------|
| Program | `r1-prog` | 23 | `select` | 0–127 | Spring, Hall, Plate, BFR, RFRCT, Air |
| Decay | `r1-decay` | 3 | `continuous` | 0–127 | |
| Swell / Duck | `r1-swell` | 14 | `bipolar` | 0–127 | Center=64; left=Swell, right=Duck; rendered as horizontal `BipolarSlider` |
| Mix | `r1-mix` | 15 | `continuous` | 0–127 | |
| Rate | `r1-rate` | 20 | `continuous` | 0–127 | |
| Depth | `r1-depth` | 21 | `continuous` | 0–127 | |
| Pre-Delay | `r1-pre-delay` | 22 | `continuous` | 0–127 | |
| Lo | `r1-lo` | 24 | `continuous` | 0–127 | |
| High | `r1-high` | 25 | `continuous` | 0–127 | |
| X (dynamic) | `r1-x` | 26 | `continuous` | 0–127 | Label changes based on selected program (see below) |
| Tweak Switch | `r1-tweak-switch` | 27 | `three_way` | — | Rate / Depth / Pre-Delay; canonical values 21 / 64 / 106 |
| Bank Switch | `r1-bank-switch` | 28 | `three_way` | — | Bank A / B / C; canonical values 21 / 64 / 106 |
| Tune Switch | `r1-tune-switch` | 29 | `three_way` | — | Lo / High / X; canonical values 21 / 64 / 106 |
| Bypass | `r1-bypass` | 30 | `toggle` | 0 / 127 | 0 = bypassed, 127 = active |
| Sustain | `r1-sustain` | 31 | `toggle` | 0 / 127 | Footswitch hold emulation |

### Dynamic Label — X Knob (CC 26)

The X knob is relabeled based on the currently selected reverb program:

| Program | X Knob Label |
|---------|--------------|
| Spring | Spring Size |
| Hall | Room Size |
| Plate | Grit / Drive |
| BFR | Diffusion |
| RFRCT | Diffusion |
| Air | Shimmer |

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

The R1 uses `R1Layout` in `DeviceControlSurface.tsx`. Parameters are grouped and rendered in this order:

1. **Program** — 6-option segmented selector
2. **Time** — Decay + Mix knobs
3. **Dynamics** — Swell/Duck as a `BipolarSlider` (horizontal)
4. **Modulation** — Rate + Depth knobs (rendered side-by-side with Dynamics)
5. **Pre-Delay** — single knob
6. **Tone** — Lo + High + X knobs (3-column grid; X label is dynamic)
7. **Three-Way Switches** — Tweak, Bank, Tune (rendered as `ThreeWaySwitch`)
8. **Bypass / Sustain** — two `Toggle` controls
