# Parameter Control

> Real-time CC control UI — implemented control types and behavior.

## Control Types

### `Knob` — `continuous` parameters
- SVG rotary arc (225° start, 270° sweep)
- **Primary:** vertical drag (pointer capture); drag up = increase, drag down = decrease
- **Secondary:** mouse wheel scroll
- **Fine-tune:** hold Shift while dragging — sensitivity reduced 4× for precise adjustment
- **Exact entry:** double-click opens an inline numeric text input (0–127)
- Always-visible numeric value displayed below the arc
- Renders a grey track arc, a colored filled arc (cyan default), and a dot at the current angle

### `BipolarKnob` — `bipolar` parameters
- Same geometry as `Knob` but fill arc grows from the center value outward
- Below center → peach/orange color; above center → cyan
- Center detent marker at the neutral angle
- Shows `bipolarLabels.low` / `bipolarLabels.high` below the knob
- Double-click for numeric entry

### `BipolarSlider` — `bipolar` (horizontal variant)
- Horizontal track; fill extends from center to thumb
- Color-coded: peach = low side, cyan = high side
- Double-click resets to center value
- `bipolarLabels.low` on the left, `bipolarLabels.high` on the right
- Used for the R1 Swell/Duck parameter (CC 14)

### `Toggle` — `toggle` parameters
- Pill-shaped on/off switch
- Single click sends 0 (off) or 127 (on)
- Active state: cyan glow; `role="switch"`, `aria-checked` for accessibility

### `Selector` — `select` parameters
Three rendering modes based on option count:
- **≤5 options:** `SegmentedSelector` — horizontal button strip, all options visible
- **6 options:** `GridSelector` — 3×2 button grid
- **7+ options or `dropdown: true`:** `DropdownSelector` — custom dropdown with a search/filter input, click-outside close

Active option: navy background with cyan border and glow.

### `ThreeWaySwitch` — `three_way` parameters
- 3-segment horizontal button strip (always exactly 3 zones)
- Each zone has a glowing LED dot when active; determined by which zone's `range` contains the current value
- Sends the zone's canonical `value` CC when selected (not the raw index)
- Used for R1's Tweak Switch (CC 27), Bank Switch (CC 28), Tune Switch (CC 29)

### `LinkedPairControl` — `linked_pair` parameters
- Wraps two stereo-paired parameters (L/R channels)
- **Linked mode:** shows one control with a combined label (e.g., "Bass" instead of "Bass L"). Moving it mirrors the value to both CCs simultaneously
- **Unlinked mode:** shows two controls side by side, independently controllable
- A chain-link icon button between the controls toggles the link state
- Supports both Knob and Selector variants

## Dynamic Labels

Some `continuous` parameters change their displayed label based on the value of another parameter. This is configured with `dynamicLabel` in the device profile.

Example: the R1 X knob (CC 26) is labeled "Spring Size", "Room Size", "Grit / Drive", etc. depending on the selected reverb program (`r1-prog`).

## MIDI Transmission

- CC is sent **immediately** on every value change — no debounce, no batching
- Channel is determined by `device-store.getEffectiveChannel(deviceId)` (profile default or user override)
- All outgoing messages are also dispatched to the MIDI monitor log (`direction: 'out'`)
- For `linked_pair` parameters: if the group is linked, a second CC is sent automatically for the paired parameter

## Parameter Groups

Parameters are organized into named sections by their `group` field in the device profile. `DeviceControlSurface` renders each group with a section heading and a column grid layout. `order` within each group controls the rendering sequence.
