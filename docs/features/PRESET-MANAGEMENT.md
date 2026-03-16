# Preset Management

> Preset CRUD, A/B comparison, import/export — current implementation.

## Data Model

See `docs/architecture/DATA-MODEL.md` for full schema. Key fields: `id` (UUID), `name`, `deviceId`, `tags[]`, `parameters[]` (full CC snapshot), `createdAt`, `modifiedAt`.

## Operations

### Save
- User opens the Preset Drawer, types a name, clicks Save
- Captures all current `parameterValues` from `device-store` for the focused device
- Generates a UUID and ISO timestamps
- Stores in IndexedDB via `preset-service.savePreset()`

### Load
- User clicks a preset in the Preset Drawer list
- `device-store.setAllParameters(deviceId, values)` loads the snapshot into state
- `device-store.sendAllParameters(deviceId)` re-transmits all CC values to the pedal

### Delete
- Trash button on each preset row in the Preset Drawer
- Calls `preset-service.deletePreset(id)`, refreshes the list

### A/B Comparison
- The Preset Drawer has two A and B snapshot slots per device session
- Click "Capture A" or "Capture B" to snapshot the current parameter state into that slot
- Clicking the A or B button then instantly sends all CCs for that snapshot
- Lets you flip between two tones without saving a permanent preset
- State is in-memory only (not persisted to IndexedDB)

> **Note:** Edit, duplicate, and per-preset tag management are defined in the data model but not yet exposed in the current UI.

## Import / Export

### Export
- The Preset Drawer has an Export button
- Downloads all presets for the focused device as a `PresetExport` JSON bundle
- Bundle includes `version: 1`, `exportedAt`, `deviceId`, and the `presets[]` array

### Import
- File picker (no drag-and-drop yet) accepts a JSON file
- Validates against `isValidPresetExport()` before writing
- Calls `preset-service.importPresets()` which does a `db.presets.bulkPut()`
- Duplicate IDs are overwritten (last-write-wins, no conflict resolution UI)

## Storage

- IndexedDB via Dexie.js (`WalrusControllerDB`, `presets` table)
- Indexed on: `deviceId`, `name`, `*tags`, `createdAt`, `modifiedAt`
- Persists across browser sessions and app restarts
- No cloud sync — export/import JSON for cross-device transfer

## Preset Drawer UI

- Right-side slide-in drawer with a semi-transparent backdrop
- Scoped to `device-store.focusedDeviceId`
- Sections: A/B Compare | Save Form | Preset List | Export/Import
- Preset list sorted by `createdAt` (newest at top)
