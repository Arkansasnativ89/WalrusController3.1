# Data Model

> Preset schema, device profile schema, and storage design.

## Device Profile Schema

See `src/types/device-profile.ts` for TypeScript definitions.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (e.g., "walrus-r1") |
| name | string | Display name |
| manufacturer | string | Manufacturer name |
| defaultChannel | number | Default MIDI channel (0-15) |
| bypassCC | number? | CC number for bypass toggle |
| parameters | DeviceParameter[] | All controllable parameters |
| presetSlots | DevicePresetSlot[]? | Factory preset PC mappings |

## Preset Schema

See `src/types/preset.ts` for TypeScript definitions.

| Field | Type | Description |
|-------|------|-------------|
| id | string | UUID |
| name | string | User-given name |
| tags | string[] | Organization tags |
| deviceId | string | Target device profile ID |
| parameters | ParameterValue[] | Snapshot of all CC values |
| createdAt | string | ISO timestamp |
| modifiedAt | string | ISO timestamp |

## IndexedDB Schema (Dexie)

### Table: presets
- Primary key: `id`
- Indexes: `deviceId`, `name`, `*tags`, `createdAt`, `modifiedAt`

### Table: settings
- Primary key: `key`

## Preset Export Format

```json
{
  "version": 1,
  "exportedAt": "ISO timestamp",
  "deviceId": "walrus-r1",
  "presets": [...]
}
```
