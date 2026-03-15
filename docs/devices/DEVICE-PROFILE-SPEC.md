# Device Profile Specification

> Generic device profile JSON format for describing MIDI-controllable devices.

## Purpose

Device profiles are JSON configuration files that describe everything the app needs to know about a MIDI device's control surface. Adding a new device requires only creating a new JSON file — no code changes.

## Schema

```json
{
  "id": "string — unique identifier",
  "name": "string — display name",
  "manufacturer": "string",
  "defaultChannel": "number (0-15)",
  "bypassCC": "number? — CC for bypass toggle",
  "category": "string? — device type grouping",
  "parameters": [
    {
      "id": "string — unique within profile",
      "label": "string — display label",
      "cc": "number (0-127) — MIDI CC number",
      "type": "knob | toggle | select",
      "min": "number (0-127)",
      "max": "number (0-127)",
      "default": "number",
      "options": "[{ label, value }]? — for select type",
      "group": "string? — section grouping",
      "order": "number? — display order"
    }
  ],
  "presetSlots": [
    {
      "pc": "number — Program Change number",
      "name": "string — factory preset name"
    }
  ]
}
```

## Validation Rules

1. `id` must be unique across all loaded profiles
2. `defaultChannel` must be 0-15
3. All `cc` values must be 0-127
4. Parameter `id` must be unique within the profile
5. `select` type parameters must have `options` array
6. `min` must be ≤ `max`
