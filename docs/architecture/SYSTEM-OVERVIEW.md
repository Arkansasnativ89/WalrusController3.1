# System Overview

> High-level architecture and data flow for the Walrus MIDI Controller.

## Architecture Diagram

_TODO: Add Mermaid or text-based diagram_

## Core Layers

### UI Layer (React Components)
- App shell, routing, and layout
- Control surfaces (knobs, toggles, selectors)
- MIDI monitor
- Preset browser and editor
- Performance mode

### State Layer (Zustand)
- `midi-store` — Connection state, port selection, message log
- `device-store` — Active device profile, parameter values
- `preset-store` — Preset library, CRUD state
- `performance-store` — Setlist, performance mode state

### Service Layer
- `midi-service` — Web MIDI API abstraction (singleton)
- `preset-service` — Preset CRUD via IndexedDB
- `storage-service` — Dexie.js database initialization

### Data Layer
- Device profile JSON configs
- IndexedDB (presets, settings)

## Data Flow

1. User interacts with a control component
2. Component calls a store action
3. Store action calls the MIDI service to send CC/PC
4. MIDI service sends bytes to the selected output
5. Incoming MIDI messages are parsed and pushed to the message log
6. React re-renders with updated state
