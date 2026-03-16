# Offline Strategy

> PWA caching and IndexedDB design.

## Service Worker (via vite-plugin-pwa)

Configured in `vite.config.ts` using `vite-plugin-pwa` with Workbox:
- **Registration:** `autoUpdate` — new service worker activates without user interaction
- **Precache manifest:** all `.js`, `.css`, `.html`, `.ico`, `.png`, `.svg`, `.json` files
- **PWA manifest fields:** name `"Walrus MIDI Controller"`, theme/background `#0f172a`, `display: standalone`, icon sizes 192×192, 512×512, 512×512 maskable

## IndexedDB (via Dexie.js — `WalrusControllerDB` v1)

All user data is stored locally:

- **`presets` table** — full CRUD with indexed queries (`deviceId`, `name`, `*tags`, `createdAt`, `modifiedAt`)
- **`settings` table** — key/value store, defined in schema but not yet used by the current UI

## Offline Capabilities

| Feature | Offline? | Notes |
|---------|----------|-------|
| Load app | ✅ | Service worker precaches all static assets |
| View control surface | ✅ | Device profiles bundled as static JSON |
| Browse presets | ✅ | IndexedDB is fully local |
| Save / load presets | ✅ | Writes to local IndexedDB |
| Send MIDI | ✅ | USB MIDI is local hardware, no network needed |
| Import / Export presets | ✅ | File system access only, no network |
| PWA installation | ✅ | Installable as standalone desktop app |

## Data Persistence

- No cloud sync — all data is local to the browser origin
- Presets persist across browser sessions and app restarts via IndexedDB
- Export/import via JSON files for backup and cross-machine transfer
- The `settings` table is reserved for future per-user config (MIDI input mappings, keyboard shortcut overrides, etc.)
