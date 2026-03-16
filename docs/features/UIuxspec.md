# Walrus MIDI Controller — UI/UX Specification

> **Status:** Approved design decisions — treat as requirements for implementation
> **Last Updated:** 2026-03-15

---

## Platform & Input

| Decision | Value |
|----------|-------|
| Primary device | Desktop / Laptop |
| Primary input | Mouse (optimized for precise controls + hover states) |
| Touch support | Not a priority — no minimum touch target requirements |
| PWA | Yes — installable on desktop, HTTPS required for Web MIDI |
| Target browser | Chrome (best Web MIDI API support) |

---

## Use Context

| Decision | Value |
|----------|-------|
| Primary use case | Studio / home — dialing in tones, building presets |
| Performance mode | Store implemented; full-screen UI planned for Phase 3 |
| Setlist system | Store implemented; UI planned for Phase 3 |
| Target user | Single user, personal tool (no auth), design for future multi-user if needed |

---

## Visual Style

| Decision | Value |
|----------|-------|
| Aesthetic | Dark studio console — flat dark panels, clean controls, DAW-level density |
| Theme | Dark mode only — no light mode, no toggle |
| Textures | None — no skeuomorphic surfaces, no fake metal/wood |
| Knob style | Clean SVG/CSS rotary controls — not photorealistic, clearly rotary with value readouts |
| Feedback style | LED-style indicators — glowing dots, lit-up active states, studio hardware feel |

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#121212` | App background |
| `--surface` | `#1B1B1B` | Panels, cards, device sections |
| `--text-primary` | `#FFFFFF` | Primary text, parameter values |
| `--text-secondary` | `#B8B8B8` | Labels, descriptions, inactive text |
| `--accent-navy` | `#1F3A5A` | Borders, selected states, subtle highlights |
| `--accent-cyan` | `#1ED6D0` | Primary interactive accent — active knobs, focus rings, engaged LEDs |
| `--accent-yellow` | `#E8DC70` | Warnings, secondary highlights, modifier-active indicators |
| `--accent-peach` | `#E8A47D` | Warm accents — boost/gain indicators, swell visualization |
| `--accent-coral` | `#D85A63` | Destructive actions, alert states, bypass-off indicators |

### Bank LED Colors

Match the physical pedal LEDs for preset bank identity:

| Token | Color | Usage |
|-------|-------|-------|
| `--bank-a` | `#E53935` | Bank A presets (PC 0–2) |
| `--bank-b` | `#43A047` | Bank B presets (PC 3–5) |
| `--bank-c` | `#1E88E5` | Bank C presets (PC 6–8) |

These should be visible as LED-style dots or glowing indicators in the preset grid and bank selectors.

---

## Layout

### Overall Structure

```
┌─────────────────────────────────────────────────────────┐
│  Top Navbar                                             │
│  [Device Status] [Connection LED]    [Presets] [⚙ Settings] │
├────────────────────────┬────────────────────────────────┤
│                        │                                │
│     R1 Panel           │◄──►│    ACS1 Panel             │
│                        │drag│                           │
│  (all R1 params)       │div │  (channel strip layout)   │
│                        │    │                           │
│                        │    │                           │
├────────────────────────┴────────────────────────────────┤
│  [MIDI Monitor — hidden drawer, toggle from navbar/key] │
└─────────────────────────────────────────────────────────┘
```

### Panel Layout

| Decision | Value |
|----------|-------|
| Device arrangement | Side-by-side panels, both always visible |
| Panel sizing | User-resizable via draggable divider |
| Navigation chrome | Top navbar — device status, settings gear, preset drawer toggle |
| Preset browser | Slide-open drawer panel (not always visible) |
| MIDI monitor | Hidden drawer/tab — open only when debugging |

### ACS1 Parameter Organization

Channel strip layout — vertical columns following signal flow, left-to-right:

```
Amp → Cab → EQ → Gain → Vol → Boost → Gate → Room → Presence/Resonance → Output EQ → Bypass/Toggles
```

Each column contains the relevant knobs/selectors stacked vertically.

### R1 Parameter Organization

Logical grouping by function:

```
Program Select → Decay/Mix → Swell → Rate/Depth → Pre Delay → Lo/High/X → Bypass/Sustain
```

### Stereo Link Behavior (ACS1)

| State | Display |
|-------|---------|
| Linked (default) | Single knob per parameter — adjusting sends identical values to both L/R CCs |
| Unlinked | Knob splits into two side-by-side L/R knobs with independent control |
| Toggle | Per parameter group (EQ, Volume, Gain, Cab, Amp) — link/unlink icon between knobs |

---

## Controls

### Rotary Knobs

| Behavior | Implementation |
|----------|---------------|
| Primary interaction | Vertical drag — drag up to increase, drag down to decrease |
| Secondary interaction | Mousewheel — scroll to adjust value incrementally |
| Fine-tuning | Shift+drag (or Ctrl+drag) — reduced sensitivity for precise adjustment |
| Exact value entry | Double-click knob — opens inline text input, type exact MIDI value (0–127) |
| Value display | Always visible — numeric value shown below the knob at all times |
| Label | Parameter name shown as label above or below the knob |
| Visual style | Clean SVG/CSS arc indicator with position marker, LED-style glow on active/focused |

### Toggle Switches

| Behavior | Implementation |
|----------|---------------|
| Style | On/off switch with LED-style glow when engaged |
| Engaged state | Cyan glow (or device-specific accent) |
| Bypassed state | Dim/off — coral indicator or no glow |
| Click behavior | Single click to toggle |

### Select Controls (Dropdowns / Segmented)

Used for: Reverb program (R1), Amp model (ACS1), Cabinet (ACS1), Room type (ACS1)

| Behavior | Implementation |
|----------|---------------|
| Style | Segmented control, grid, or dropdown — depends on option count |
| ≤5 options | `SegmentedSelector` — horizontal button strip, all options visible |
| 6 options | `GridSelector` — 3×2 grid |
| 7+ options or `dropdown: true` | `DropdownSelector` — custom dropdown with search/filter input, click-outside close |
| Active state | LED-style highlight (navy bg, cyan border/glow) on selected option |

### Three-Way Switches (R1 Only)

Used for: Tweak Switch (CC 27), Bank Switch (CC 28), Tune Switch (CC 29)

| Behavior | Implementation |
|----------|---------------|
| Style | 3-position horizontal toggle |
| Canonical values sent | 21 (position 1), 64 (position 2), 106 (position 3) |
| Visual | Three labeled segments with LED indicator on active position |

### Bipolar Knob (R1 Swell, CC 14)

| Behavior | Implementation |
|----------|---------------|
| Style | Knob with center detent at 64 |
| Left half label | "Swell" |
| Right half label | "Duck" |
| Center | Neutral (no effect) |
| Visual | Arc indicator that grows from center in either direction |

---

## Feedback & Animation

| Element | Feedback Style |
|---------|---------------|
| Knob adjustment | Smooth knob tracking — position updates in real time as you drag |
| Toggle state change | LED glow on/off with subtle transition (~100ms) |
| Preset load | Brief LED pulse across the loaded device's panel |
| Connection status | LED dot in navbar — green = connected, red = disconnected, amber = no device selected |
| Active knob | Cyan glow ring while being adjusted |
| Floating tooltips | None — always-visible value below knob is sufficient |
| Animations | Restrained — smooth transitions on state changes, no bouncy/flashy effects |

---

## MIDI Behavior

| Decision | Value |
|----------|-------|
| Device discovery | Manual assignment — user picks MIDI output and assigns channel per device |
| CC send timing | Immediate on every value change (real-time as you drag) |
| Throttling | Light internal throttle (~10–15ms) to prevent MIDI buffer flooding — invisible to user |
| Channel isolation | Required — each device on its own channel, same MIDI output |
| Message types | CC (0xB0) and PC (0xC0) only — no SysEx, NRPN, or Note messages |

---

## MIDI Monitor

| Decision | Value |
|----------|-------|
| Location | Hidden drawer — accessible via navbar icon or keyboard shortcut |
| Detail level | Full scrolling log of every message sent/received in real time |
| Format | Timestamp, direction (TX/RX), channel, message type, CC#/PC#, value, parameter name |
| Filtering | Not required for MVP — raw log is sufficient |

---

## Preset System

| Decision | Value |
|----------|-------|
| Scope | Per-device — R1 presets and ACS1 presets are separate lists |
| Storage | Local (IndexedDB via Dexie.js) — app-side snapshots of CC values, not synced with pedal memory |
| Browser location | Slide-open drawer panel |
| Browse features | Quick-access grid of favorites (click to load) |
| A/B comparison | Yes — toggle between two stored CC snapshots to hear the difference |
| Import/export | JSON file — single preset or bulk |
| Combined multi-device presets | Out of scope for MVP |

**Important constraint:** The app cannot read current preset state from the pedals via MIDI. "Presets" in the app are local snapshots of CC values the app has sent. The app's state and the pedal's physical state can drift if the user adjusts knobs on the pedal itself.

---

## Navigation & App Chrome

### Top Navbar

```
[App Logo/Name]  [R1: Ch.2 ●]  [ACS1: Ch.3 ●]  |  [📋 Presets]  [⚙ Settings]
```

| Element | Behavior |
|---------|----------|
| Device status | Shows device name + assigned channel + connection LED |
| Connection LED | Green = MIDI output active, Red = disconnected, Amber = not configured |
| Presets button | Toggles the preset drawer open/closed |
| Settings gear | Opens settings panel (MIDI output selection, channel assignment, keyboard shortcuts) |

### Settings Page

| Setting | Description |
|---------|-------------|
| MIDI Output | Dropdown of available MIDI outputs from Web MIDI API |
| R1 Channel | Channel selector (1–16) |
| ACS1 Channel | Channel selector (1–16) |
| Keyboard Shortcuts | Configurable key bindings for common actions |

### Keyboard Shortcuts (User-Configurable)

Default bindings (can be remapped):

| Action | Default Key |
|--------|-------------|
| Toggle R1 Bypass | `1` |
| Toggle ACS1 Bypass | `2` |
| Toggle R1 Sustain/Latch | `S` |
| Toggle ACS1 Boost | `B` |
| Open/Close Preset Drawer | `P` |
| Open/Close MIDI Monitor | `M` |
| Save Current State as Preset | `Ctrl+S` |
| A/B Comparison Toggle | `A` |

---

## Session State

| Decision | Value |
|----------|-------|
| Remember state between sessions | Yes — persist last-sent CC state per device |
| Restore behavior | On app open: restore UI to last-sent parameter values (so the display matches what was last sent). Do NOT auto-transmit CCs on load — user must click "Push to Device" or manually adjust a control to send. This avoids unexpected sound changes at load time. |
| Storage key | `settings` table, key: `lastSentState_<deviceId>` |
| When to write | Debounced 500ms after any `setParameterValue()` call — not on every CC send |

---

## Scope Boundaries

### In Scope (MVP)

- Side-by-side R1 + ACS1 editor with all parameters
- Channel-isolated MIDI output
- Manual device/channel assignment
- Real-time CC control with immediate send
- Local preset snapshots (per-device) with A/B comparison
- Preset drawer with favorites grid
- MIDI monitor (hidden drawer, full scrolling log)
- LED-style visual feedback
- User-configurable keyboard shortcuts
- Dark mode only, flat console aesthetic

### Out of Scope (Future)

- Performance mode / setlist system
- Touch optimization / mobile layout
- Multi-device combined presets
- Preset sync with pedal memory (requires SysEx or firmware support)
- Auth / multi-user profiles
- Undo/redo stack
- Light mode
- HX Effects integration (future device profile)