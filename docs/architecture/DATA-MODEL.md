# Data Model

> Preset schema, device profile schema, and storage design.

## Device Profile Schema

See `src/types/device-profile.ts` for TypeScript definitions.

### `DeviceProfile`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (e.g., `"walrus-r1"`) |
| `name` | `string` | Display name |
| `manufacturer` | `string` | Manufacturer name |
| `defaultChannel` | `number` | Default MIDI channel (0–15) |
| `bypassCC` | `number?` | CC number for main bypass toggle |
| `parameters` | `DeviceParameter[]` | All controllable parameters |
| `presetSlots` | `DevicePresetSlot[]?` | Factory preset PC→name mappings |
| `category` | `string?` | Device type (e.g., `"reverb"`, `"amp-sim"`) |
| `midiOutputName` | `string?` | Substring to match when auto-selecting MIDI output |
| `stereoLinked` | `boolean?` | Whether device defaults to stereo-linked mode |
| `ccSendOrder` | `string[]?` | Explicit CC send ordering for preset recall |

### `DeviceParameter`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique within profile |
| `label` | `string` | Display label |
| `cc` | `number` | MIDI CC number (0–127) |
| `type` | `ParameterType` | See parameter types below |
| `min` | `number` | Minimum value (0–127) |
| `max` | `number` | Maximum value (0–127) |
| `default` | `number` | Default/reset value |
| `options` | `ParameterOption[]?` | `{ label, value }` — required for `select` |
| `zones` | `ThreeWayZone[]?` | `{ label, value, range }` — required for `three_way` |
| `linkedTo` | `string?` | Paired parameter ID — required for `linked_pair` |
| `centerValue` | `number?` | Center detent value — used for `bipolar` |
| `bipolarLabels` | `{ low, high }?` | Labels for each pole — used for `bipolar` |
| `dynamicLabel` | `DynamicLabelConfig?` | Relabels param based on another param's value |
| `group` | `string?` | Section heading for UI grouping |
| `order` | `number?` | Sort order within group |
| `description` | `string?` | Tooltip or documentation text |

### Parameter Types (`ParameterType`)

| Type | Widget | Description |
|------|--------|-------------|
| `continuous` | `Knob` | Full-range 0–127 rotary |
| `bipolar` | `BipolarKnob` or `BipolarSlider` | Fills from center outward; center = neutral |
| `toggle` | `Toggle` | Boolean — sends 0 or 127 |
| `select` | `Selector` | Named options mapped to specific CC values |
| `three_way` | `ThreeWaySwitch` | Three labeled zones; sends canonical per-zone CC value |
| `linked_pair` | `LinkedPairControl` | Two paired parameters (L/R stereo) that can be linked |

### `DynamicLabelConfig`

Allows a parameter's displayed label to change based on another parameter's value:

```ts
{
  controlledBy: string;           // ID of the controlling parameter
  entries: DynamicLabelEntry[];   // { whenValue, label, description? }
}
```

Example: the R1 X knob (`r1-x`, CC 26) is relabeled "Spring Size", "Room Size", "Grit / Drive", "Diffusion", or "Shimmer" based on the selected reverb program (`r1-prog`).

---

## Preset Schema

See `src/types/preset.ts` for TypeScript definitions.

### `Preset`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID v4 |
| `name` | `string` | User-given name |
| `description` | `string?` | Optional free-text description |
| `tags` | `string[]` | Organization tags |
| `deviceId` | `string` | Target device profile ID |
| `channelOverride` | `number?` | Per-preset channel override |
| `parameters` | `ParameterValue[]` | Snapshot of all CC values |
| `createdAt` | `string` | ISO 8601 timestamp |
| `modifiedAt` | `string` | ISO 8601 timestamp |
| `chainPosition` | `number?` | Reserved for future multi-pedal chain ordering |

### `ParameterValue`

```ts
{ parameterId: string;  cc: number;  value: number; }
```

The `cc` field is denormalized for fast lookup during preset recall without needing the device profile.

---

## IndexedDB Schema (Dexie — `WalrusControllerDB` v1)

### Table: `presets`
- Primary key: `id`
- Indexes: `deviceId`, `name`, `*tags` (multi-entry), `createdAt`, `modifiedAt`

### Table: `settings`
- Primary key: `key`
- Simple key/value store — defined but not yet used by the current UI

---

## Preset Export Format

```json
{
  "version": 1,
  "exportedAt": "2026-03-15T12:00:00.000Z",
  "deviceId": "walrus-r1",
  "presets": [
    {
      "id": "uuid",
      "name": "My Preset",
      "tags": [],
      "deviceId": "walrus-r1",
      "parameters": [
        { "parameterId": "r1-decay", "cc": 3, "value": 85 }
      ],
      "createdAt": "2026-03-15T12:00:00.000Z",
      "modifiedAt": "2026-03-15T12:00:00.000Z"
    }
  ]
}
```
