# Performance Mode

> Stage UI and setlist specification.

## Performance Mode UI

- Full-screen, high-contrast layout
- Large touch targets for tablet use
- Current preset name displayed prominently
- Next/Previous navigation buttons
- Minimal chrome — no edit controls visible
- Tap designated area to exit

## Setlist System

### Setlist Structure
- Ordered list of preset references
- Optional per-entry song name grouping
- Supports presets from multiple devices

### Navigation
- Step through sequentially (next/prev)
- Jump to specific index
- Wrap-around optional (configurable)

### Management
- Create, edit, delete setlists
- Reorder entries via drag-and-drop
- Import/export setlists as JSON

## MIDI Input Mapping

- Map incoming MIDI messages to app actions
- Example: "CC 64 on channel 16 = next preset"
- Configurable mapping table
- Default mappings provided
