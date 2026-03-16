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

---

## Phase 3 Execution Plan

### Files to Create
| File | What it does |
|------|-------------|
| `src/components/performance/PerformanceView.tsx` | Full-screen performance mode component |
| `src/components/performance/SetlistManager.tsx` | Setlist CRUD UI — create, rename, delete, add/remove entries |
| `src/components/performance/PresetSlotGrid.tsx` | 3×3 bank grid (A/B/C × Red/Green/Blue) that sends PC on click |

### Files to Edit
| File | Change |
|------|--------|
| `src/app/App.tsx` | Read `isPerformanceMode` from `performance-store`; conditionally render `<PerformanceView>` over the main layout |
| `src/components/panels/SettingsPanel.tsx` | Add setlist management section or link to `SetlistManager` |
| `src/stores/performance-store.ts` | Add `setlists[]` persistence via `preset-service` or a new `setlist-service.ts` if needed |

### Build Order
1. `PresetSlotGrid.tsx` — stateless, just renders the 3×3 grid and sends PC via `device-store.sendProgramChange()` for both devices simultaneously
2. `PerformanceView.tsx` — full-screen layout, uses `performance-store` state, renders `PresetSlotGrid`, Next/Previous nav, active preset name
3. Wire `App.tsx` — `isPerformanceMode` toggles render between `<ResizablePanels>` and `<PerformanceView>`
4. `SetlistManager.tsx` — CRUD UI for setlists; reads/writes `performance-store.setlists`
5. Setlist persistence — write setlists to `settings` IndexedDB table (key: `setlists`) via `storage-service.ts`
6. Setlist import/export — JSON file, similar pattern to preset export/import in `PresetDrawer.tsx`

### Key Store Actions Already Available
- `enterPerformanceMode()` / `exitPerformanceMode()` — toggle `isPerformanceMode`
- `setActiveSetlist(setlist)` — loads a setlist, resets `currentIndex` to 0
- `nextPreset()` / `previousPreset()` / `goToIndex(n)` — navigation
