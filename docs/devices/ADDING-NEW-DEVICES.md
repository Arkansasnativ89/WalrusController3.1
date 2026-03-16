# Adding New Devices

> Guide to adding a new MIDI pedal to the Walrus Controller via configuration.

## Steps

1. **Create a device profile JSON file** in `src/data/device-profiles/`
2. **Name it** using the pattern: `{manufacturer}-{model}.json` (e.g., `walrus-slo.json`)
3. **Fill in the schema** following `docs/devices/DEVICE-PROFILE-SPEC.md`
4. **Import it in `src/app/App.tsx`** and pass it to `device-store.loadProfiles()` inside the startup `useEffect`
5. **Run the validation tests** to confirm the profile is well-formed
6. **Add a layout function** in `DeviceControlSurface.tsx` if the device needs a custom UI arrangement (optional — the default grouped grid works for most devices)

## Template

Copy `src/data/device-profiles/walrus-r1.json` or `walrus-acs1-mkii.json` as a starting point:

```json
{
  "id": "walrus-slo",
  "name": "Walrus SLO",
  "manufacturer": "Walrus Audio",
  "defaultChannel": 0,
  "bypassCC": 102,
  "category": "overdrive",
  "midiOutputName": "HX Effects",
  "stereoLinked": false,
  "parameters": [
    {
      "id": "slo-gain",
      "label": "Gain",
      "cc": 20,
      "type": "continuous",
      "min": 0,
      "max": 127,
      "default": 64,
      "group": "tone",
      "order": 1
    },
    {
      "id": "slo-bypass",
      "label": "Bypass",
      "cc": 102,
      "type": "toggle",
      "min": 0,
      "max": 127,
      "default": 127,
      "group": "switches",
      "order": 1
    }
  ],
  "presetSlots": [
    { "pc": 0, "name": "Preset 1" },
    { "pc": 1, "name": "Preset 2" }
  ]
}
```

## App.tsx Import

In `src/app/App.tsx`, import the new profile and add it to the `loadProfiles` call:

```ts
import newDeviceProfile from '../data/device-profiles/walrus-slo.json';

// inside the startup useEffect:
deviceStore.loadProfiles([r1Profile, acs1Profile, newDeviceProfile]);
```

## Validation

Run the device profile test suite to verify:
```bash
npm test -- tests/unit/device-profile.test.ts
```

The test suite checks: unique parameter IDs, CC values in 0–127 range, `isValidDeviceProfile()` passes.

## Custom Layouts

If the default grouped grid is insufficient (e.g. the device has stereo linked pairs or a complex channel-strip design), add a layout component in `DeviceControlSurface.tsx` following the `R1Layout` or `ACS1Layout` patterns, and route to it by `profile.id`.
