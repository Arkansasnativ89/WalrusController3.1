# Offline Strategy

> PWA caching and IndexedDB design.

## Service Worker (via vite-plugin-pwa)

- Auto-update registration
- Precache all static assets (JS, CSS, HTML, JSON, SVG, PNG)
- Runtime caching for device profile JSON files

## IndexedDB (via Dexie.js)

All user data is stored locally:
- **Presets** — full CRUD with indexed queries
- **Settings** — key-value pairs for app configuration

## Offline Capabilities

| Feature | Offline? | Notes |
|---------|----------|-------|
| Load app | ✅ | Service worker serves cached assets |
| Browse presets | ✅ | IndexedDB is local |
| Edit presets | ✅ | Local storage only |
| Send MIDI | ✅ | USB MIDI is local, no network needed |
| Import/Export | ✅ | File system access, no network |

## Data Persistence

- No cloud sync in MVP
- Export/import via JSON files for backup
- IndexedDB persists across browser sessions
