# Device Profile Specification

> Generic device profile JSON format for describing MIDI-controllable devices.

## Purpose

Device profiles are JSON configuration files in `src/data/device-profiles/` that describe everything the app needs to know about a MIDI device's control surface. Adding a new device requires creating a new JSON file and importing it in `App.tsx` — no service or store changes needed.

## Full Schema

```jsonc
{
  "id": "string — unique identifier, e.g. \"walrus-r1\"",
  "name": "string — display name",
  "manufacturer": "string",
  "defaultChannel": "number (0–15)",
  "bypassCC": "number? — CC used by toggleBypass() action",
  "category": "string? — e.g. \"reverb\", \"amp-sim\"",
  "midiOutputName": "string? — substring to match for auto-selecting MIDI output",
  "stereoLinked": "boolean? — initial linked state for all linked_pair groups",
  "ccSendOrder": "string[]? — explicit parameter ID order for sendAllParameters()",
  "parameters": [
    {
      "id": "string — unique within this profile",
      "label": "string — display label",
      "cc": "number (0–127)",
      "type": "continuous | bipolar | toggle | select | three_way | linked_pair",
      "min": "number (0–127)",
      "max": "number (0–127)",
      "default": "number",

      // --- type: select ---
      "options": "{ label: string, value: number }[]",

      // --- type: three_way ---
      "zones": "{ label: string, value: number, range: [min, max] }[]",
      //   value = canonical CC sent when zone is selected
      //   range = the CC value range that maps to this zone

      // --- type: linked_pair ---
      "linkedTo": "string — ID of the paired parameter (e.g. the R side)",

      // --- type: bipolar ---
      "centerValue": "number — the neutral/zero point (typically 64)",
      "bipolarLabels": "{ low: string, high: string }",

      // --- dynamic label (any continuous param) ---
      "dynamicLabel": {
        "controlledBy": "string — ID of the controlling parameter",
        "entries": "{ whenValue: number, label: string, description?: string }[]"
      },

      "group": "string? — section heading key for UI grouping",
      "order": "number? — sort order within group",
      "description": "string? — tooltip / documentation text"
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

## Parameter Types Reference

| Type | Rendered As | When to Use |
|------|-------------|-------------|
| `continuous` | `Knob` | Full-range 0–127 parameter |
| `bipolar` | `BipolarKnob` or `BipolarSlider` | Parameter with a meaningful center point (e.g. Swell/Duck) |
| `toggle` | `Toggle` | Binary on/off; sends 0 or 127 |
| `select` | `Selector` (segmented, grid, or dropdown based on option count) | Named discrete options |
| `three_way` | `ThreeWaySwitch` | Exactly 3 positions, each with a canonical CC value |
| `linked_pair` | `LinkedPairControl` | Two parameters (L/R) that can be linked or independently controlled |

**`Selector` rendering rules:**
- ≤5 options → horizontal segmented strip
- 6 options → 3×2 grid
- 7+ options or `dropdown: true` → custom dropdown with search input

## Validation Rules

1. `id` must be unique across all loaded profiles
2. `defaultChannel` must be 0–15
3. All `cc` values must be 0–127
4. Parameter `id` must be unique within the profile
5. `select` and `linked_pair` (select variant) parameters must include `options`
6. `three_way` parameters must include exactly 3 `zones`
7. `linked_pair` parameters must include `linkedTo` pointing to a valid sibling parameter ID
8. `min` must be ≤ `max`

Run `npm test -- tests/unit/device-profile.test.ts` to validate any profile.
