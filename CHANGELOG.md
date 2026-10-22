# Changelog

## 4.0.0 — 2026-10-22

- Rebuilt the application as modular, validated state, shared audio, storage and UI code.
- Introduced a warm orange studio design, local Lucide icons, English/Persian interface, mobile layouts and accessible controls.
- Fixed sample injection, unsafe project restoration, early sample scheduling, keyboard collisions, stale playheads, microphone lifecycle and incomplete WAV exports.
- Added independent recorded instrument notes, lane volume, undo/redo, explicit sample deletion and local-data erasure.
- Added portable `.beatbloom` files containing sample audio and WAV export with optional sound tails.
- Added reproducible Vite builds, pinned dependencies/actions, lint/format checks, regression/accessibility tests, Gitleaks, npm audit, CodeQL, Dependabot and CI-gated Pages publication.
- Replaced personal commit metadata with the account's GitHub noreply identity.
- Breaking development change: source now requires Node.js and a Vite build; direct `file://` execution is no longer supported. Legacy project JSON remains importable.

## 3.1.0 — 2026-07-22

- Changed MIT copyright holder to Maboox.
- Added four independent sample sequencer lanes.
- Added per-slot Stack/Mono overlap behavior.
- Made lane ON/OFF controls clearly visible.
- Persisted sampler playback settings in project JSON and local storage.

## 3.0.0 — 2026-07-22

- Added collision-free two-octave piano layout.
- Added Shift-modified higher-octave keyboard controls.
- Added an interactive six-string guitar fretboard and Guitar sequencer lane.
- Added microphone recording and audio import.
- Added four persistent one-shot/loop sample slots and a Sample sequencer lane.
- Fixed the transport timer to begin at `00:00:000`.
- Expanded templates across 8, 16, 24, and 32-step loops.
- Normalized track icons and improved responsive controls.
- Added public-repository documentation and community files.

## 2.0.0

- Added variable loop lengths, live step recording, additional instruments, lane toggles, and new templates.

## 1.0.0

- Initial local-first sequencer, performance pads, piano, effects, project storage, and WAV export.
