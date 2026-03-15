# Walrus Controller

> Browser-based MIDI controller for Walrus Audio pedals.

## Overview

A production-ready PWA providing real-time MIDI control, preset management, and a visual interface for the Walrus Audio R1 (MKI) and ACS1 (MKII) pedals. Designed for both studio editing and live performance.

## Tech Stack

- **React 18+** with TypeScript (strict)
- **Vite** build tool
- **Zustand** state management
- **Tailwind CSS** + shadcn/ui
- **Dexie.js** (IndexedDB) for offline storage
- **Web MIDI API** for direct device communication
- **vite-plugin-pwa** for offline support

## Getting Started

### Prerequisites

- Node.js 18+
- Chrome browser (Web MIDI API support)
- Walrus Audio R1 or ACS1 MKII connected via USB

### Installation

```bash
npm install
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/          # App shell and routing
├── components/   # UI components
├── hooks/        # Custom React hooks
├── services/     # MIDI, preset, storage services
├── stores/       # Zustand state stores
├── types/        # TypeScript type definitions
├── data/         # Device profile JSON configs
└── utils/        # Utility functions
```

## Documentation

See the `docs/` directory for architecture details, device specs, and feature specifications.

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome (desktop) | ✅ Full support |
| Chrome (Android) | ✅ Full support |
| Edge | ✅ Full support |
| Firefox | ❌ No Web MIDI API |
| Safari | ⚠️ Experimental |

## License

Private project — not for distribution.
