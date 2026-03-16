# Performance Mode

> Stage UI and setlist system — current implementation status.

## Status

| Component | Status |
|-----------|--------|
| `performance-store` | ✅ Fully implemented |
| Performance mode UI | ❌ Not yet wired into App |
| Setlist management UI | ❌ Not yet wired into App |

The data model and store actions for performance mode and setlists are complete. The UI surfaces for entering performance mode, navigating setlists, and managing setlist entries have not yet been built (Phase 3 work).

---

## Store Implementation (`src/stores/performance-store.ts`)

### Setlist Data Model

```ts
type Setlist = {
  id: string;
  name: string;
  entries: SetlistEntry[];
  createdAt: string;
  modifiedAt: string;
};

type SetlistEntry = {
  presetId: string;
  songName?: string;  // optional grouping label
};
```

### Available Store Actions

| Action | Description |
|--------|-------------|
| `enterPerformanceMode()` | Sets `isPerformanceMode: true` |
| `exitPerformanceMode()` | Returns to editor mode |
| `setActiveSetlist(setlist)` | Loads a setlist, resets `currentIndex` to 0 |
| `nextPreset()` | Increments `currentIndex` (clamps at end) |
| `previousPreset()` | Decrements `currentIndex` (clamps at 0) |
| `goToIndex(n)` | Jumps directly to a setlist position |

---

## Planned Performance Mode UI (Phase 3)

When implemented, the performance mode UI will provide:

- Full-screen, high-contrast layout with large touch targets
- Active preset name displayed prominently
- Next / Previous navigation buttons (keyboard and MIDI foot controller)
- Bank + preset slot buttons (PC messages to both pedals simultaneously)
- Minimal chrome — no edit controls visible
- Tap a designated area to exit back to editor mode

## Planned Setlist UI (Phase 3)

- Create, rename, delete setlists
- Add/remove preset entries (from both R1 and ACS1)
- Optional per-entry song name grouping
- Reorder entries via drag-and-drop
- Import/export setlists as JSON

## MIDI Input Mapping (Phase 3)

Configurable foot controller bindings:
- Next preset, previous preset, bypass toggles
- Mapping stored in `settings` IndexedDB table
- See `docs/features/MIDI-INPUT-MAPPING.md` for the planned spec
