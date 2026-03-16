# Technical Decisions

> Architecture Decision Records (ADRs).

## ADR-001: React 19 + Vite + TypeScript

**Status:** Accepted  
**Decision:** React 19 with Vite 7 build tool, TypeScript 5.9 in strict mode.  
**Rationale:** Vite provides fast HMR and a lean production build; React 19 is the current stable release; TypeScript strict mode catches MIDI byte-handling bugs at compile time. No framework router needed — the app is a single-page tool with no URL routing.

## ADR-002: Zustand v5 for State Management

**Status:** Accepted  
**Decision:** Five independent Zustand stores (`device`, `midi`, `preset`, `performance`, `ui`). No global store.  
**Rationale:** Minimal boilerplate, excellent performance for frequent high-frequency updates (real-time CC sends), zero context-provider nesting. Each domain is isolated so a MIDI connection event never triggers a full preset-list re-render.

## ADR-003: Raw Web MIDI API (No Wrapper Library)

**Status:** Accepted  
**Decision:** Custom `MidiService` singleton wrapping `navigator.requestMIDIAccess()` directly. SysEx disabled.  
**Rationale:** Only two known target devices, both accessed through the same HX Effects USB hub. Full control over message timing, no unnecessary abstraction. A library wrapper would add overhead without benefit for this narrow use case.

## ADR-004: Dexie.js for IndexedDB

**Status:** Accepted  
**Decision:** Dexie v4 as the IndexedDB wrapper for the `presets` and `settings` tables.  
**Rationale:** Clean Promise/async API, strong TypeScript generics, good multi-entry index support for tag-based queries, minimal bundle overhead.

## ADR-005: JSON Device Profiles

**Status:** Accepted  
**Decision:** Device capabilities defined in static JSON files (`src/data/device-profiles/`), imported at build time.  
**Rationale:** Adding a new device is a config-only change. The profile schema (`DeviceParameter` types, `dynamicLabel`, `linked_pair`, etc.) covers all observed Walrus MIDI behaviors without any device-specific code.

## ADR-006: vite-plugin-pwa for Service Worker

**Status:** Accepted  
**Decision:** `vite-plugin-pwa` v1 with Workbox, `autoUpdate` registration, precaching all static assets.  
**Rationale:** Zero-config PWA with Vite. Ensures the app loads offline for live performance reliability. Auto-update means deployments are transparent to the user.

## ADR-007: Tailwind CSS v4 (No Component Library)

**Status:** Accepted  
**Decision:** Tailwind CSS v4 (via `@tailwindcss/vite`) for all styling. No component library (no shadcn/ui, no Radix, no MUI).  
**Rationale:** All controls (Knob, BipolarKnob, ThreeWaySwitch, etc.) are custom SVG/CSS implementations tailored to the studio-console aesthetic. A third-party component library would fight the design intent and add bundle weight with zero benefit.
