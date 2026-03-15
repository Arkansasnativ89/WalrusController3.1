# Adding New Devices

> Guide to adding a new MIDI pedal to the Walrus Controller via configuration.

## Steps

1. **Create a device profile JSON file** in `src/data/device-profiles/`
2. **Name it** using the pattern: `{manufacturer}-{model}.json`
3. **Fill in the schema** following `docs/devices/DEVICE-PROFILE-SPEC.md`
4. **Import it** in the device store or use dynamic import
5. **Test** that all parameters send correct CC values

## Template

Copy `src/data/device-profiles/walrus-r1.json` and modify:

- `id` — unique identifier
- `name` — display name
- `manufacturer` — manufacturer name
- `defaultChannel` — default MIDI channel (0-15)
- `parameters` — list of all CC-controllable parameters
- `presetSlots` — list of PC-accessible presets

## Validation

Run the device profile test suite to verify:
```bash
npm test -- tests/unit/device-profile.test.ts
```

## No Code Changes Required

The app dynamically reads device profiles. Adding a new JSON file and importing it is all that's needed. No component or service changes required.
