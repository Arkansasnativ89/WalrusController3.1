# Preset Management

> Preset CRUD, import/export specification.

## Data Model

See `docs/architecture/DATA-MODEL.md` for full schema.

## Operations

### Save
- Capture all current parameter values from device store
- Generate UUID, set timestamps
- Store in IndexedDB via preset service

### Load
- Read preset from IndexedDB
- Send all parameter CC values to device via MIDI
- Update device store with loaded values

### Edit
- Update name, description, tags
- Update modifiedAt timestamp

### Delete
- Remove from IndexedDB with confirmation dialog

### Duplicate
- Clone preset with new UUID and "(Copy)" suffix

## Import / Export

### Export
- Single preset → JSON file download
- All presets for a device → JSON bundle

### Import
- Accept JSON file (drag-and-drop or file picker)
- Validate against PresetExport schema
- Handle conflicts (duplicate IDs: skip, overwrite, or rename)

## Storage

- IndexedDB via Dexie.js
- Indexed fields: deviceId, name, tags, createdAt, modifiedAt
