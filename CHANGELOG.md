# Changelog

## 0.13.1

- Render post-match player items in the replay UI, including backpack and neutral item slot labels when available.
- Added dedicated recommendation unit tests for threat fallback coverage, phase boundaries, and inventory normalization.
- Fixed inventory normalization so item names without the `item_` prefix are treated consistently.

## 0.13.0

- Added global fallback item mappings for every inferred threat tag, including invisibility, high healing, mana burn, kiting, and dispel needs.
- Made recommendation notes honest when a threat has no mapped item instead of claiming it was handled.
- Memoized the OpenDota public data cache by file mtime to avoid repeated synchronous JSON parsing during live GSI updates.
- Unified app version reporting and OpenDota User-Agent values from `package.json`.
- Included backpack slots, item_6-8, and neutral items in replay summaries.
- Added optional local GSI auth-token generation and validation after one-click setup.

## 0.12.0

- Added a launch-option reminder dialog after one-click preparation.
- Added a copy button for the safe Dota 2 launch option `-gamestateintegration`.
- Added a "do not remind again" local preference and a manual way to show the reminder again.
- Kept Steam configuration changes manual and transparent instead of modifying Steam settings automatically.

## 0.11.0

- Added a one-click preparation action for GSI setup, public data sync, and status refresh.
- Simplified the first screen so core live recommendation, state, lineup, and threats are prominent.
- Moved diagnostics, GSI inspection, replay, and AI coach panels into collapsible utility sections.
- Kept all safety boundaries unchanged while improving first-run player usability.

## 0.10.0

- Redesigned the main UI into a dark esports command-center layout.
- Added item and hero images from the latest synced OpenDota constants and Steam CDN paths.
- Added graceful image fallbacks so missing CDN images do not break recommendations.
- Improved compact window item presentation.
- Added retry handling for transient OpenDota sync errors such as 521/522.

## 0.9.0

- Added `buildings` to the generated GSI config.
- Added a GSI data inspector panel showing which requested GSI blocks were actually received.
- Added building summary diagnostics for received GSI building data.
- Extended self-test coverage for abilities, buildings, allplayers, and GSI field visibility.

## 0.8.0

- Added safe automatic lineup detection from Dota 2 GSI `allplayers` data when the game provides it.
- Added GSI `allplayers` and `draft` requests to the generated config.
- Automatic enemy lineup detection now updates inferred match-context tags and item recommendations.
- Enemy lineup UI now shows whether the current lineup came from GSI, demo data, manual selection, or no available GSI lineup.
- Added self-test coverage for simulated GSI automatic lineup detection.

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
