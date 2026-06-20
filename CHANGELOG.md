# Changelog

## 0.7.0

- Added an in-app safety diagnostics panel for setup, public data, live GSI, and recommendation health.
- Added `/api/diagnostics` for transparent launch-test and safety-boundary reporting.
- Allowed localhost development origins on alternate Vite ports so first-run testing still works when `5173` is occupied.
- Extended self-test coverage for diagnostics and safety capability boundaries.

## 0.6.0

- Added a launch-test checklist for local service, GSI config, public data cache, and live GSI data.
- Added quick actions for GSI install, public data sync, demo state, and compact window.
- Improved first-run testing flow for real Dota 2 sessions.

## 0.5.0

- Refined compact mode to focus on the next item and small alternatives.
- Added local post-match coach diagnostics from OpenDota stats.
- Replay summaries now flag deaths, economy, XP, farm, item timing, damage, and objective conversion issues.
- Clarified that post-match diagnostics infer only from public stats, not actual input/micro decisions.

## 0.4.0

- Expanded dedicated hero build rules for common beginner heroes.
- Added manual enemy lineup selection.
- Added automatic threat-tag inference from manually selected enemy heroes.
- Added basic post-match review using the public OpenDota match API.
- Rewrote item and hero build data with clean UTF-8 Chinese names.

## 0.3.0

- Added generic recommendation rules for all heroes.
- Uses synced OpenDota public hero role metadata to choose a generic route when a hero has no dedicated build.
- Added optional safe edge mini-window as a normal always-on-top desktop window.
- Clarified that the app does not scan Dota 2 processes and does not draw inside the game render surface.

## 0.2.0

- Added bilingual English/Chinese README.
- Added OpenDota public constants sync.
- Added optional AI coach with local rule fallback, Ollama local mode, and OpenAI-compatible mode.
- Added stricter AI safety prompt that forbids cheat-like guidance.
- Added automated self-test script.

## 0.1.0

- Added Electron desktop app.
- Added local Dota 2 Game State Integration receiver.
- Added real-time item recommendation panel.
- Added example hero builds for Juggernaut, Phantom Assassin, Crystal Maiden, and Sniper.
- Added manual match-context tags.
- Added local GSI configuration status and install action.
- Added Windows installer and zip packaging.
