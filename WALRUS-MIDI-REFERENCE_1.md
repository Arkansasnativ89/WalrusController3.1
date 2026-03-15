# Walrus Audio MIDI Implementation Reference

> **Status:** Authoritative — treat as law for all implementation decisions
> **Devices:** Walrus Audio R1 (MKI), Walrus Audio ACS1 (MKII)
> **Last Updated:** 2026-03-15
> **MIDI Topology:** Single MIDI output, channel-isolated (R1 on one channel, ACS1 on another)

---

## MIDI Architecture

### Channel Isolation Strategy

Both pedals connect to the same MIDI output. The app routes messages to each device by sending on separate MIDI channels. This is required because 15 CC numbers are shared between the two devices but control entirely different parameters.

| Config | Value |
|--------|-------|
| MIDI Output | Single shared output (USB-MIDI interface or direct USB) |
| R1 Default Channel | 1 (changeable via power-up procedure — see Hardware Notes) |
| ACS1 Default Channel | 1 (changeable via Global Preferences on-pedal) |
| **Requirement** | Devices **must** be set to different channels before use with this app |

The app must store each device's assigned channel and prepend the correct channel status byte to every outgoing message. Never broadcast CC messages on all channels.

### Message Types Used

| Message | Status Byte | Usage |
|---------|-------------|-------|
| Program Change | `0xC0 + channel` | Preset recall (0–127) |
| Control Change | `0xB0 + channel` | Real-time parameter control |

No SysEx, NRPN, or Note messages are used by either device.

---

## Walrus R1 (MKI) — High-Fidelity Stereo Reverb

Six studio-quality reverb programs (Spring, Hall, Plate, BFR, RFRCT, Air) with 128 preset slots, stereo I/O, sustain/latch, bi-polar swell, per-program X parameter, and modulation controls.

### Program Changes (Preset Recall)

| PC # | Preset |
|------|--------|
| 0 | Bank A — Red |
| 1 | Bank A — Green |
| 2 | Bank A — Blue |
| 3 | Bank B — Red |
| 4 | Bank B — Green |
| 5 | Bank B — Blue |
| 6 | Bank C — Red |
| 7 | Bank C — Green |
| 8 | Bank C — Blue |
| 9–127 | Extended (MIDI only) |

**Tail behavior:** Preset switching is seamless — the previous reverb tail decays naturally over the new preset's sound. Rapid consecutive PC messages may cut the previous tail. Allow a brief gap between PC messages if tail preservation matters.

### Continuous Parameters

| Parameter | CC # | Range | Description |
|-----------|------|-------|-------------|
| Decay | 3 | 0–127 | Reverb tail length |
| Swell | 14 | 0–127 | **Bi-polar.** See Swell Behavior section below |
| Mix | 15 | 0–127 | Dry/wet ratio. 0 = fully dry, 127 = fully wet |
| Rate | 20 | 0–127 | Modulation speed within the reverb |
| Depth | 21 | 0–127 | Modulation intensity within the reverb |
| Pre Delay | 22 | 0–127 | Time gap before reverb onset |
| Lo | 24 | 0–127 | Low-frequency content in the reverb tail |
| High | 25 | 0–127 | High-frequency content in the reverb tail |
| X | 26 | 0–127 | **Program-dependent.** See X Parameter table below |

#### Swell Behavior (CC 14) — Bi-Polar Control

This is not a standard 0–127 continuous knob. It has three behavioral zones centered at 64:

| MIDI Range | Mode | Behavior |
|------------|------|----------|
| 0–63 | Volume Swell | Applies a volume envelope to wet + dry signal. Lower values = longer fade-in. 0 = longest swell (ambient pads). 63 = minimal swell |
| 64 | Neutral | No swell or ducking — standard reverb behavior |
| 65–127 | Ducking | Reduces wet signal proportionally to dry signal presence. Reverb stays quiet while playing, blooms when you stop. 127 = maximum ducking |

**UI implication:** Render this as a bipolar knob or slider with a center detent at 64. Label the left half "Swell" and the right half "Duck."

#### X Parameter Per Program (CC 26)

The X parameter's function changes completely based on the active reverb program (CC 23):

| Program | X Controls | 0 | 127 |
|---------|-----------|---|-----|
| Spring (1) | Spring size | Short, small spring | Overt slap-back |
| Hall (2) | Room size | Small, intimate room | Massive arena hall |
| Plate (3) | Front-end grit/drive | Clean plate | Warm driven signal grit |
| BFR (4) | Diffusion amount | Delay taps exposed, textural | Smooth reverb wash |
| RFRCT (5) | Diffusion amount | Less diffused, more textural | Heavily diffused reverb |
| Air (6) | Octave shimmer volume | Shimmer off (clean reverb) | Full +12 semitone octave shimmer |

**UI implication:** When the user changes the reverb program, the X knob's label and description must update dynamically.

### Reverb Program Selection (CC 23)

| MIDI Value | Program | Character |
|------------|---------|-----------|
| 1 | Spring | Classic tube-amp spring reverb with bouncy drip |
| 2 | Hall | Concert hall to arena acoustics, intimate to massive |
| 3 | Plate | Smooth analog plate reverb (EMT 140 inspired), even diffusion |
| 4 | BFR | Enormous lush hall-esque reverb with rich decay |
| 5 | RFRCT | Glitch-like textures over diffused reverb, granular effects |
| 6 | Air | Large diffused reverb with octave shimmer (+12 semitone) |

**Note:** Values start at 1, not 0. Value 0 has undefined behavior — do not send it.

**Program change side effects:** Changing the program changes the algorithm. The X parameter behavior changes (see table above), and Rate/Depth have different musical effects per program. When switching programs via CC 23, send updated values for X, Rate, Depth, and other parameters to ensure the new program sounds as intended.

#### Per-Program Parameter Guidance

| Program | Decay Sweet Spot | X Sweet Spot | Rate/Depth Notes | Pre-Delay Notes |
|---------|-----------------|-------------|-----------------|----------------|
| Spring | Low–mid classic, high for surf wash | Mid for natural, high for slap | Subtle — classic spring wobble | Short for immediacy |
| Hall | Mid–high for concert, max for arena | Scale with decay — bigger room = longer tail | Gentle mod adds liveliness | Medium for natural hall |
| Plate | Mid for classic, high for long shimmer | Use sparingly — adds grit/warmth | Smooth mod complements plates | Short to none (plates are immediate) |
| BFR | High for signature massive sound | Low for textured taps, high for smooth wash | Heavy mod works well with this verb | Medium–long enhances epic feel |
| RFRCT | Mid for controlled glitch, high for chaos | Balance diffusion against glitch | Rate = glitch frequency, Depth = range | Controls grain delay size — key param |
| Air | Mid–high for building shimmer | 0 for clean, increase for shimmer | Gentle mod adds movement to shimmer | Medium for separation from playing |

### Discrete Selectors (Three-Way Switches)

These use three-zone CC ranges. Send the **midpoint** of each zone as the canonical value (21, 64, 106). Accept any value within the zone as equivalent when reading state.

| Parameter | CC # | 0–42 | 43–85 | 86–127 |
|-----------|------|------|-------|--------|
| Tweak Switch | 27 | Rate | Depth | Pre Delay |
| A\|B\|C Bank Switch | 28 | Bank A (Presets 0–2) | Bank B (Presets 3–5) | Bank C (Presets 6–8) |
| Tune Switch | 29 | Left (Lo) | Middle (High) | Right (X) |

**Programming note on Tweak/Tune switches:** Since Rate (CC 20), Depth (CC 21), Pre Delay (CC 22), Lo (CC 24), High (CC 25), and X (CC 26) each have dedicated CCs, you can control all these parameters directly without touching the switch CCs. The switch CCs (27, 29) are useful for mirroring the physical pedal's switch state in the UI, not for parameter control.

### Toggles

| Parameter | CC # | 0 | 127 | Description |
|-----------|------|---|-----|-------------|
| Bypass | 30 | Bypassed | Engaged | See Bypass Mode notes below |
| Sustain / Latch | 31 | Off | Sustained | Holds current reverb indefinitely. Guitar signal is re-routed through an identical reverb so playing over the sustained sound gets the same treatment. Use for ambient drones and texture beds |

#### Bypass Mode Behavior

The R1 has three bypass modes set **on the physical pedal** (not via MIDI). This affects what happens when the app sends CC 30 = 0:

| Mode | LED Color | Tail Behavior on Bypass | I/O Support |
|------|-----------|------------------------|-------------|
| True Bypass | Red (default) | Tail cut immediately | Mono↔Mono, Stereo↔Stereo only |
| DSP + True Bypass | Green | Tail decays naturally, then relay bypasses | Mono↔Mono, Stereo↔Stereo only |
| DSP Bypass | Blue | Tail decays naturally, relays stay locked on | All configs including Mono→Dual Mono, Stereo→Mono |

**App implication:** If users report that bypass cuts reverb tails, the pedal is likely in True Bypass mode. The app should note this in a settings/help section but cannot change it via MIDI.

#### Stereo Width

The R1 has a stereo width control (narrow mono → enhanced wide stereo) saved per preset. It is accessed on-pedal via a special knob procedure. **There is no dedicated CC for stereo width in the published MIDI spec.** This parameter cannot be controlled via MIDI without a firmware update from Walrus Audio.

### Recommended CC Send Order (Full Parameter Build)

When constructing a complete R1 state from scratch via CC (not using PC recall):

1. **Prog** (CC 23) — algorithm first, changes behavior of everything else
2. **Lo / High / X** (CC 24 / 25 / 26) — tonal character and program-specific param
3. **Decay** (CC 3) — tail length
4. **Rate / Depth** (CC 20 / 21) — modulation
5. **Pre Delay** (CC 22) — timing
6. **Swell** (CC 14) — swell/ducking behavior
7. **Mix** (CC 15) — wet/dry last (user hears the final blend)
8. **Bypass** (CC 30) — engage the pedal
9. **Sus/Latch** (CC 31) — sustain state

---

## Walrus ACS1 (MKII) — Amp + Cab Simulator

Six amp models, 12 cabinet IRs, stereo I/O, 128 preset slots, noise gate, output EQ, boost, room/reverb, and post-power-amp Presence/Resonance controls. Independent left/right channel control for stereo operation.

### Program Changes (Preset Recall)

| PC # | Preset |
|------|--------|
| 0 | Bank A — Red |
| 1 | Bank A — Green |
| 2 | Bank A — Blue |
| 3 | Bank B — Red |
| 4 | Bank B — Green |
| 5 | Bank B — Blue |
| 6 | Bank C — Red |
| 7 | Bank C — Green |
| 8 | Bank C — Blue |
| 9–127 | Extended (MIDI only) |

**Recall behavior:** Sending a PC instantly recalls the full preset state — amp model, cab, EQ, gain, volume, room, boost, gate, output EQ, presence, and resonance. This is the simplest and lowest-latency approach for live performance.

### Continuous Parameters

All continuous parameters map linearly: MIDI 0 = 0.0 (minimum), MIDI 64 ≈ 0.5 (noon), MIDI 127 = 1.0 (maximum).

#### EQ (Per-Channel)

| Parameter | CC # | Description |
|-----------|------|-------------|
| Bass Left | 3 | Left channel low-end EQ |
| Bass Right | 9 | Right channel low-end EQ |
| Mid Left | 14 | Left channel midrange EQ |
| Mid Right | 15 | Right channel midrange EQ |
| Treble Left | 20 | Left channel high-frequency EQ |
| Treble Right | 21 | Right channel high-frequency EQ |

Default "noon" starting point for EQ: MIDI value 64.

#### Volume & Gain (Per-Channel)

| Parameter | CC # | Description |
|-----------|------|-------------|
| Vol Left | 22 | Left channel output level |
| Vol Right | 23 | Right channel output level |
| Gain Left | 24 | Left channel amp gain/drive |
| Gain Right | 25 | Right channel amp gain/drive |

**Gain behavior varies by amp model.** Gain 64 on Fullerton = mild crunch. Gain 64 on Tread = heavy saturation. The app should not assume a universal gain curve.

#### Boost

| Parameter | CC # | Description |
|-----------|------|-------------|
| Boost Gain | 32 | Boost drive amount. Up to +4dB additional gain on top of current gain setting |
| Boost Volume | 33 | Boost output level. Use to compensate for volume change when boost is engaged |

#### Filters

| Parameter | CC # | Description |
|-----------|------|-------------|
| HPF | 36 | High-pass filter. Higher values = more low-end removed |
| LPF | 37 | Low-pass filter. Higher values = more high-end removed |

#### Noise Gate

| Parameter | CC # | Description |
|-----------|------|-------------|
| Gate Threshold | 89 | Signal level required to open gate. 0 = gate disabled. Start ~20–40 for subtle high-gain gating |
| Gate Release | 90 | Gate close speed. Low = fast/tight (palm mutes), High = slow/natural (sustained leads) |

#### Room / Reverb

| Parameter | CC # | Description |
|-----------|------|-------------|
| Room Level | 101 | Room reverb wet mix. 0 = room fully disengaged |
| Room Decay | 103 | Room reverb tail length |

#### Post-Power-Amp EQ

| Parameter | CC # | Description |
|-----------|------|-------------|
| Presence | 104 | High shelf at 5kHz, up to +10dB. Adds cut and articulation to dark amps |
| Resonance | 105 | Resonant peak at 90Hz, up to +12dB. Adds beef and low-end weight to high-gain tones |

#### Parameters with No Confirmed CC #

These appear in the Walrus spec with "N/A" for CC number. They may not be MIDI-addressable, or may require firmware confirmation:

| Parameter | Description | Workaround |
|-----------|-------------|------------|
| Room (standalone) | Room reverb wet level | May be CC 101 (listed above as Room Level) — confirm on hardware |
| Output EQ Low | Global HPF, 20Hz–200Hz sweep. Higher values = more bass removed | Post-amp/cab final filtering. Test on hardware for CC # |
| Output EQ High | Global LPF, 20kHz–1kHz sweep. Higher values = more treble removed | Post-amp/cab final filtering. Test on hardware for CC # |

### Discrete Selectors

#### Cabinet IR Models (CC 26 Left / CC 27 Right)

| MIDI Value | Cabinet | Mic(s) | Pairing Guidance |
|------------|---------|--------|-----------------|
| 0 | '66 Fender Deluxe | SM57 | Clean/low-gain (Fullerton, London, Dartford) |
| 1 | '66 Fender Deluxe | Royer 121 | Clean/low-gain |
| 2 | Marshall JTM50 Bluesbreaker | SM57 | Clean/low-gain |
| 3 | Marshall JTM50 Bluesbreaker | Royer 121 | Clean/low-gain |
| 4 | Vox AC30 6TB | SM57 | Clean/low-gain |
| 5 | Vox AC30 6TB | Royer 121 | Clean/low-gain |
| 6 | Mesa Oversized 4×12 | SM57 + Royer 121 | High-gain (Red, Citrus, Tread) |
| 7 | Mesa Oversized 4×12 | SM58 + Beyerdynamic M160 | High-gain |
| 8 | Kerry Wright 4×12 | SM57 + Royer 121 | High-gain |
| 9 | Kerry Wright 4×12 | Sennheiser MD421 + Telefunken U47 | High-gain |
| 10 | Marshall 1960bv 4×12 | SM58 + Beyerdynamic M160 | High-gain |
| 11 | Marshall 1960bv 4×12 | Sennheiser MD421 + Beyerdynamic M160 | High-gain |

Cabs 0–5 (Tone Factor) pair naturally with clean/low-gain amps. Cabs 6–11 (York Audio) pair naturally with high-gain amps. All combinations work — the pairing column is guidance, not restriction.

#### Amp Models (CC 28 Left / CC 29 Right)

| MIDI Value | Model Name | Inspired By | Character | Gain Class |
|------------|-----------|-------------|-----------|-----------|
| 0 | Fullerton | Fender Deluxe Reverb | Clean with warm breakup, classic American | Clean–Low |
| 1 | London | 1962 Marshall Bluesbreaker | Harmonically rich, punchy mids, great for leads | Low–Medium |
| 2 | Dartford | 1960s Vox AC30 | Jangly chime, British Invasion bite | Low–Medium |
| 3 | Red | Peavey 5150 | Aggressive modern metal, tight low end | High |
| 4 | Citrus | Orange Rockerverb | Creamy British gain, punchy lows, clear at high gain | High |
| 5 | Tread | Mesa Dual Rectifier | Massive saturated gain, cuts through mix | High |

#### Room Types (CC 102)

| MIDI Value | Type | Description |
|------------|------|-------------|
| 0 | Room | Tight room reverb simulating a mic'd amp in a room. Set Room Level (CC 101) to 0 to fully disengage |
| 1 | Hall | Hall reverb for large live performance spaces. Decay via CC 103 |
| 2 | Spring | Classic tube-amp spring reverb emulation. Decay via CC 103 |

### Toggles

| Parameter | CC # | 0 | 127 | Description |
|-----------|------|---|-----|-------------|
| Bypass | 30 | Bypass | Engaged | CC 30 accepts values 0–5 per spec (multiple bypass states). Use 0 for bypass, 127 for engaged. Test firmware for values 1–4 behavior |
| Boost Engage | 31 | Off | Engaged | Activates boost block. Boost gain/volume levels set via CC 32/33 |
| IR Bypass | 85 | IR active | IR bypassed | Disables cab IR block. Amp modeling remains active. Use when routing to external IR loader or real cabinet |
| Amp Bypass | 86 | Amp active | Amp bypassed | Disables amp modeling block. Cab IR remains active. Use when using ACS1 purely as cab sim with external preamp |

### Stereo Architecture

The ACS1 has independent left/right parameters for EQ, Volume, Gain, Cab, and Amp.

**App behavior:**

- Default to **linked mode** — adjusting a Left parameter mirrors the same value to the corresponding Right CC
- Provide a **split/unlink toggle** per parameter group (EQ, Volume, Gain, Cab, Amp) for stereo independence
- When unlinked, show separate Left/Right controls
- When running different amps in stereo, use Vol Left (CC 22) / Vol Right (CC 23) independently to balance levels — different amp models have different inherent loudness

**Mono operation:** Send identical values to both Left and Right CCs.

**Stereo split example:** Fullerton (0) on CC 28 (Left), Dartford (2) on CC 29 (Right), with different cabs on each side — creating a dual-amp stereo rig.

### Recommended CC Send Order (Full Parameter Build)

When constructing a complete ACS1 state from scratch via CC:

1. **Amp Left/Right** (CC 28/29) — amp model first, changes the character of all other parameters
2. **Cab Left/Right** (CC 26/27) — speaker selection
3. **Bass/Mid/Treble Left/Right** (CC 3/9/14/15/20/21) — tone stack
4. **Gain Left/Right** (CC 24/25) — drive level
5. **Volume Left/Right** (CC 22/23) — output level
6. **Room Select** (CC 102), **Room Decay** (CC 103), **Room Level** (CC 101) — reverb
7. **Gate Threshold/Release** (CC 89/90) — noise gate
8. **Presence/Resonance** (CC 104/105) — post-amp EQ
9. **HPF/LPF** (CC 36/37) — output filtering
10. **Output EQ Low/High** — final output filtering (if CC # confirmed)
11. **Bypass** (CC 30), **Boost** (CC 31), **IR Bypass** (CC 85), **Amp Bypass** (CC 86) — switching states

---

## Cross-Device Reference

### CC # Conflict Table

These CC numbers exist on **both** devices but control **different** parameters. The app must route by channel — never broadcast.

| CC # | R1 Parameter | ACS1 Parameter |
|------|-------------|----------------|
| 3 | Decay | Bass Left |
| 14 | Swell | Mid Left |
| 15 | Mix | Mid Right |
| 20 | Rate | Treble Left |
| 21 | Depth | Treble Right |
| 22 | Pre Delay | Vol Left |
| 23 | Prog (Reverb Type) | Vol Right |
| 24 | Lo | Gain Left |
| 25 | High | Gain Right |
| 26 | X | Cab Left |
| 27 | Tweak Switch | Cab Right |
| 28 | Bank Switch | Amp Left |
| 29 | Tune Switch | Amp Right |
| 30 | Bypass | Bypass |
| 31 | Sustain/Latch | Boost Engage |

### Shared Conventions

| Convention | Value |
|------------|-------|
| PC 0–8 mapping | Identical Bank/Color grid on both (A/B/C × Red/Green/Blue) |
| PC 9–127 | Extended presets, MIDI-only access on both |
| CC 30 | Bypass on both (0 = bypass, 127 = engaged) |
| Toggle values | Always send 0 or 127 (not 0/1) |
| Continuous range | 0–127 linear mapping on both |
| Default MIDI channel | Both ship on channel 1 — **must be changed before use** |

### Parameter Type Mapping for UI Components

| Type | UI Component | Used By |
|------|-------------|---------|
| `continuous` | Rotary knob or slider (0–127) | Both |
| `bipolar` | Center-detent knob/slider (center = 64) | R1 only (Swell, CC 14) |
| `toggle` | On/off switch (0 or 127) | Both |
| `select` | Dropdown or segmented control | Both (R1: reverb type; ACS1: cab, amp, room) |
| `three_way` | 3-position toggle (zones: 0–42 / 43–85 / 86–127) | R1 only (Tweak, Bank, Tune switches) |
| `linked_pair` | Linked L/R knobs with split toggle | ACS1 only (EQ, Vol, Gain, Cab, Amp) |

---

## Hardware Notes

### R1 MIDI Channel Assignment

Hold both stomp switches at power-up → LEDs flash white → send a PC message on the desired channel → LEDs flash green to confirm. Channel is locked until changed again.

### ACS1 MIDI Channel Assignment

Press Middle + Right encoders simultaneously → navigate to MIDI → Chnl → select channel.

### Physical Connections

| | R1 | ACS1 |
|---|---|---|
| MIDI IN | 5-pin DIN | 5-pin DIN |
| MIDI THRU | Yes (pass-through) | Yes (pass-through) |
| USB | None | USB-C (firmware/IR loading only, **not for MIDI**) |
| Power | 9VDC center-negative, 300mA min, isolated | 9VDC center-negative, 300mA min, isolated |
| Audio I/O | Stereo 1/4" TS in/out | Stereo 1/4" TS in/out + headphone jack |

### MIDI Chain Topology

For a single-output setup with both pedals:

```
MIDI Controller/Interface
        │
        ▼
   R1 MIDI IN (Channel X)
        │
   R1 MIDI THRU
        │
        ▼
  ACS1 MIDI IN (Channel Y)
        │
  ACS1 MIDI THRU
        │
        ▼
  (future devices)
```

The app sends all messages on the single output. R1 listens only on channel X and ignores channel Y messages. ACS1 listens only on channel Y and ignores channel X messages. MIDI THRU on the R1 passes all messages (including ACS1's channel Y messages) downstream untouched.
