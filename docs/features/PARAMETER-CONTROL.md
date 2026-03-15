# Parameter Control

> Real-time CC control UI specification.

## Control Types

### Knob (Rotary)
- Drag up/down to change value
- Visual indicator rotates -135° to +135°
- Displays numeric value in center
- Sends CC on every value change (no debounce)

### Toggle
- Click/tap to flip between 0 and 127
- Visual on/off state
- Used for bypass, cabinet sim, etc.

### Selector (Dropdown)
- Named options mapped to MIDI values
- Used for reverb type, amp model, etc.
- Sends CC value of selected option

## MIDI Transmission

- CC sent immediately on value change
- Channel determined by device default or user override
- Outgoing messages logged in MIDI monitor

## Parameter Groups

Parameters are organized by `group` field in device profile:
- Displayed as visual sections on the control surface
- Ordered by `order` field within each group
