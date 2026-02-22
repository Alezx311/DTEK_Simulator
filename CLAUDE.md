# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `app/` directory:

```bash
cd app
npm install        # Install dependencies
npm run dev        # Start dev server (Vite, hot reload)
npm run build      # Production build to app/dist/
npm run preview    # Preview production build
npm run lint       # ESLint
```

There are no tests in this project.

## Architecture

**ДТЕК Simulator** is a React web game where the player manages Kyiv's electrical grid under wartime conditions. The app lives entirely in `app/`.

### State & Game Loop

State is managed with `useReducer` in `App.jsx`. The game loop runs as a `setInterval(1000ms)` that calls `gameTick(state)` (a pure function) and dispatches `TICK` with the new state. Speed modifiers (`settings.gameSpeed`, `settings.timeAccel`) scale the tick logic internally.

- **`app/src/game/state.js`** — `createInitialState()` and `gameReducer`. All actions are here. Key state shape:
  - `buildings[]` — 383 real buildings from GeoJSON, each with `{id, lat, lng, address, group, power, status}`
  - `wave` — `{num, phase: 'prep'|'attack', time, threats[]}`
  - `mood` — `{residents, business, critical}` — game-over triggers when `residents < 15`
  - `load` — `consumption/generation * 100` — game-over triggers at `>= 100`

- **`app/src/game/engine.js`** — `gameTick()`. Handles: building repair timers, wave phase transitions, threat spawning/movement, hit resolution, mood recalculation, auto-balance. The function mutates a shallow-copied state object internally (not Redux-pure), then returns it.

### Data Layer

- **`app/src/data/buildings.json`** — GeoJSON FeatureCollection of 383 real buildings in Akademmistechko (Kyiv). Properties: `id`, `title` (address), `group` (power grid group ID like `sg10`, `ID_13`).
- **`app/src/data/mapData.js`** — Imports GeoJSON and exports `createBuildings()` (processes GeoJSON → flat objects), `groupColors`, `polygons`.
- **`app/src/data/threats.js`** — 15 threat types with `{id, name, type, speed, dmg, wave, icon}`. `wave` field controls which wave number unlocks the threat.
- **`app/src/data/upgrades.js`** — Two branches (`infra`, `defense`). Each upgrade has an `effectKey` that maps to mutations in `applyUpgradeEffect()`.
- **`app/src/data/groupColors.json`** — Maps group IDs to hex colors.
- **`app/src/data/polygons.json`** — District polygon boundaries for Leaflet rendering.

### Components

- **`LeafletMap.jsx`** — Renders the real Leaflet/OpenStreetMap map. Uses three separate `useEffect` hooks for: (1) map initialization + polygon overlays, (2) building marker creation (only on `buildings.length` change to avoid full re-render), (3) marker style updates on status change, (4) threat animation. Markers are stored in `markersRef` to allow imperative updates without React re-renders.
- **`SubgroupsPanel.jsx`** — Bottom panel. Derives group aggregates from `state.buildings` via `useMemo`. Buttons dispatch `TOGGLE_GROUP`, `ENABLE_ALL`, `EMERGENCY_OFF`, `ROTATE_GROUPS`, `USE_RESERVE`.
- **`WavePanel.jsx`** — Right panel. Shows wave countdown, active threats, and upgrade purchase UI.
- **`MoodPanel.jsx`** — Left panel. Shows mood meters and event log.
- **`Header.jsx`** — Top bar with generation/consumption/load stats and pause/settings buttons.
- **`GameOverlay.jsx`** — Victory/defeat screen.
- **`modals/SettingsModal.jsx`** — Settings tabs: Гра (gameplay), Графіка (display), Дебаг (cheats + god mode).

### Key Patterns

**Adding a new reducer action:** Add a `case` to `gameReducer` in `state.js`. Use the `addEvent()` helper to push to `state.events`.

**Adding a new upgrade:** Add to `UPGRADES.infra` or `UPGRADES.defense` in `upgrades.js`, then add its `effectKey` handler in `applyUpgradeEffect()`.

**Adding a new threat type:** Add to the array in `threats.js`. The `wave` field controls unlock timing; `type` affects which defense stat intercepts it (`shahedDef`, `rocketDef`, `globalDef`).

**Leaflet performance:** Building markers are created once (on `buildings.length` change) and updated imperatively via `marker.setStyle()` rather than re-creating, to avoid map flicker on every game tick.

**Reserve power:** The `USE_RESERVE` action adds +300MW for 15 seconds. The timer is managed in `App.jsx` via `reserveTimerRef` (not in the reducer), so the `wrappedDispatch` wrapper is used instead of raw `dispatch` for this action.
