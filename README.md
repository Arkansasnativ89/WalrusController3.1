# Walrus Controller

> Browser-based MIDI controller for Walrus Audio pedals.

## Overview

A PWA providing real-time MIDI control, preset management, and a visual interface for the Walrus Audio R1 reverb and ACS1 MKII amp simulator pedals. Both pedals are controlled side-by-side via USB through an HX Effects multi-FX unit. Designed for studio tone-shaping and preset building.

## Tech Stack

- **React 19** with TypeScript (strict)
- **Vite 7** build tool
- **Zustand v5** state management
- **Tailwind CSS v4**
- **Dexie.js v4** (IndexedDB) for offline preset storage
- **Web MIDI API** for direct USB device communication
- **vite-plugin-pwa** for offline support and PWA installability

## Getting Started

### Prerequisites

- Node.js 18+
- Chrome or Edge browser (Web MIDI API support required)
- Walrus Audio R1 or ACS1 MKII connected via USB (typically through an HX Effects unit)

### Installation

```bash
npm install
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and bundle for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run unit tests (Vitest) |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/          # App shell (App.tsx)
├── components/   # UI components (controls, device layouts, panels)
├── hooks/        # Custom React hooks (useMidi, useDevice, usePresets, useKeyboardShortcuts)
├── services/     # midi-service, preset-service, storage-service
├── stores/       # Zustand stores (device, midi, preset, performance, ui)
├── types/        # TypeScript type definitions (device-profile, midi, preset)
├── data/         # Device profile JSON configs (walrus-r1, walrus-acs1-mkii)
└── utils/        # midi-utils, validation
tests/
├── unit/         # Vitest unit tests
└── mocks/        # MockMIDIInput / MockMIDIOutput for CI
docs/
├── architecture/ # System overview, data model, MIDI engine, state, offline strategy
├── devices/      # Device-specific CC maps and profile spec
├── features/     # Feature specs (parameter control, presets, performance mode, UI/UX)
└── project/      # Roadmap, technical decisions
```

## Documentation

See the `docs/` directory for architecture details, device CC maps, and feature specifications.

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome (desktop) | ✅ Full support |
| Edge (desktop) | ✅ Full support |
| Firefox | ❌ No Web MIDI API |
| Safari | ⚠️ Experimental Web MIDI support |

## License

Private project — not for distribution.
