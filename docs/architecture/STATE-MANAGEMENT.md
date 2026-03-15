# State Management

> Zustand store shape and actions.

## Store Architecture

Four independent Zustand stores, each managing a specific domain:

### midi-store
- Connection state (isSupported, isConnected, error)
- Available ports (inputs, outputs)
- Selected port IDs
- Message log (capped at 200 messages)

### device-store
- Loaded device profiles
- Active profile
- Current parameter values (keyed by parameter ID)
- Channel override
- Actions: setParameterValue, sendProgramChange, toggleBypass

### preset-store
- Preset library (array)
- Loading/error state
- Actions: CRUD, import/export

### performance-store
- Performance mode toggle
- Active setlist
- Current index in setlist
- Actions: next/prev/goTo

## Design Decisions

- No global store — each domain is independent
- Stores call services directly (no middleware)
- MIDI service is a singleton, not stored in React state
- Message log uses immutable array updates with cap
