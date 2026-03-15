# Technical Decisions

> Architecture Decision Records (ADRs).

## ADR-001: React + Vite + TypeScript

**Status:** Accepted
**Context:** Need a fast, modern frontend with type safety for MIDI message handling.
**Decision:** React 18+ with Vite build tool and strict TypeScript.
**Rationale:** Existing team experience (CarleFinance project), fast HMR, large ecosystem.

## ADR-002: Zustand for State Management

**Status:** Accepted
**Context:** Need lightweight state management for real-time MIDI parameter updates.
**Decision:** Zustand with four independent stores.
**Rationale:** Minimal boilerplate, great performance for frequent updates, no context provider nesting.

## ADR-003: Raw Web MIDI API (No Wrapper)

**Status:** Accepted
**Context:** Only two known target devices; full control needed over message timing.
**Decision:** Use the Web MIDI API directly via a custom service class.
**Rationale:** Avoids unnecessary abstraction for a small, well-defined device set.

## ADR-004: Dexie.js for IndexedDB

**Status:** Accepted
**Context:** Need offline-first preset storage with structured queries.
**Decision:** Dexie.js as the IndexedDB wrapper.
**Rationale:** Clean Promise-based API, good indexing support, minimal overhead.

## ADR-005: JSON Device Profiles

**Status:** Accepted
**Context:** Need to support multiple devices without code changes.
**Decision:** Device capabilities defined in JSON config files.
**Rationale:** Adding a new device is a config-only change. Profiles can be updated without rebuilding the app.

## ADR-006: vite-plugin-pwa for Service Worker

**Status:** Accepted
**Context:** App must work offline for live performance reliability.
**Decision:** Use vite-plugin-pwa for service worker generation.
**Rationale:** Zero-config PWA support with Vite, auto-update, workbox integration.
