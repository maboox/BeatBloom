# Architecture

BeatBloom 4 is a statically hosted ES-module app. Vite bundles the application and two runtime libraries; no server, account system or runtime package/CDN request is required.

## State and validation

`createProject()` defines a versioned arrangement: 17 known lanes, 32 backing steps per lane, the visible loop length, mute/volume, effects, independent Lead/Pluck/Guitar note arrays and sample playback settings. Smaller loops retain their hidden steps. Bass and Chord share the root-note lane; Lead and Pluck use derived defaults until overridden.

`parseProject()` migrates v1–3.1 arrangements into a new v4 object. It accepts only known lane IDs, bounded finite numbers, supported loop lengths, boolean steps and syntactically valid notes. Unknown keys are dropped. Imported state never becomes an object prototype or executable markup.

Undo snapshots only arrangements, with a 50-entry limit. Audio replacement/deletion is explicit and is not undoable; opening a portable project resets arrangement history because the audio set also changes.

## Scheduling and sound

The transport looks ahead 100 ms on the Web Audio clock and wakes every 25 ms. Swing delays odd sixteenth notes without extending the loop. A render queue advances the visual playhead only when scheduled audio reaches the listener's current context time. Live recording targets that audible step instead of the scheduler's future step.

Audio sources flow through a shared low-pass filter, dry path, delay/feedback and convolver sends, master, a dynamics compressor, analyser and destination. Noise and impulse generation use deterministic seeds. Finished sources disconnect their nodes; live voices and sample stacking are bounded. Offline rendering does not apply the live voice cap to future notes.

`renderWav()` uses the same engine, instruments, sample buffers, swing timing, lane gain and effects as live playback. It renders one selected loop in stereo at 44.1 kHz and encodes signed 16-bit PCM. Sound tails are optional; disabling tails produces exactly the selected bar duration. Manual sample looping is a performance feature: each sequencer sample event is a one-shot during live sequencing and export.

Pausing/stopping clears queued UI work, stops scheduled sources and disconnects the old effect graph so a delayed note cannot restart playback. Hidden tabs stop transport/sample loops and stop an active microphone recording. Sample events are scheduled at their actual audio time rather than triggered immediately by the lookahead callback.

## Persistence and portable files

The arrangement uses localStorage under `beatbloom-project`. Four sample blobs and display names use IndexedDB `beatbloom-samples`, preserving the earlier storage format. Restoring saved audio decodes without unlocking live playback, requesting a microphone or writing the data back.

Portable `.beatbloom` files are JSON with the validated arrangement and four nullable base64 audio records. Import validates and decodes all samples before replacing the live project; IndexedDB replacement is a single transaction. Original file bytes are retained for portable backups. Local arrangements share the browser's four sample slots; use portable files for independent, complete projects.

Audio files are bounded before decode and checked for duration/channels afterward. Compressed data can temporarily expand in memory before the browser exposes duration, so this is a browser sketchpad rather than an untrusted bulk-audio processing service.

## Interface and delivery

The interface uses real controls, local Lucide icons, visible focus, keyboard mode routing, English/Persian text, RTL page chrome with an LTR musical timeline, responsive layouts and reduced-motion support. Filenames and user project names use text or input values, never interpolated markup.

CI checks source and behavior before Pages publishes the same revision. The repository keeps source and screenshots; `dist/`, browser traces, audio and user projects are ignored. Production bundles include MIT and runtime-library license notices. Extra response headers are supplied for compatible static hosts; the document-level CSP also applies on GitHub Pages.
