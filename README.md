# BeatBloom Studio

> A playful, local-first music studio that runs entirely in your browser.

![BeatBloom Studio interface](docs/beatbloom-preview.png)

BeatBloom is a compact browser DAW for sketching beats, playing instruments, recording voice or found sounds, and turning ideas into loops — without accounts, analytics, uploads, or a build step.

**English** · [راهنمای فارسی](README-fa.md)

## Why BeatBloom?

Full DAWs are powerful, but sometimes you only want to play. BeatBloom keeps the satisfying parts — sequencing, instruments, live recording, effects, sampling, presets, and WAV export — in a friendly interface that opens in seconds.

- **Local-first:** projects and recorded samples stay in your browser.
- **No installation:** one self-contained `index.html` file.
- **No backend:** works on localhost, GitHub Pages, or any static host.
- **Playable:** mouse, touch, and computer-keyboard controls.
- **Responsive:** designed for desktop, tablet, and mobile.

## Features

### Sequencer

- 8, 16, 24, or 32-step loops
- 17 independent lanes: Kick, Snare, Hi-hat, Clap, Bass, Chord, Tom, Shaker, Cowbell, Percussion, Lead, Pluck, Guitar, and four dedicated Sample lanes
- Per-lane enable/disable controls
- Live step recording from pads, piano, guitar, and the active sample slot
- Clear and generative “Surprise me” actions
- Zero-based transport timer and adjustable tempo/swing

### Instruments

- Two-octave piano with collision-free keys
- Hold **Shift** with the Z–M keyboard layout to play the higher octave
- Six-string interactive guitar fretboard
- 12 performance pads with dedicated keyboard shortcuts
- Synthesized drums, bass, chords, lead, pluck, and guitar tones using the Web Audio API

### Voice & Sample Deck

- Record from your microphone
- Import common browser-supported audio formats
- Four persistent sample slots with four independent sequencer lanes
- Each slot maps directly to Sample 1–4 in the sequencer
- Per-slot Stack/Mono control: allow overlapping hits or cut the previous voice
- One-shot or continuous loop playback
- Trigger slots with number keys **1–4**
- Samples are stored locally with IndexedDB

### Creative tools

- Filter, delay, reverb/space, swing, and master controls
- House, Lo-fi, Trap, Disco, Funk, Afro, Ambient, DnB, Arcade, and Latin templates
- Templates automatically repeat across the selected loop length
- Local project save/load plus JSON import/export
- Offline WAV rendering for the selected loop length

## Quick start

### Recommended: local server

Microphone access works most reliably on `localhost` or HTTPS.

**Windows**

```text
Double-click run-local.bat
```

**macOS / Linux**

```bash
chmod +x run-local.sh
./run-local.sh
```

Then open [http://localhost:8080](http://localhost:8080).

### Simple mode

You can also open `index.html` directly. Sequencing, instruments, importing audio, saving projects, and WAV export work without a server. Some browsers may block microphone access on `file://` pages.

## Controls

| Action | Shortcut |
|---|---|
| Play / pause | `Space` |
| Main drums | `Q W E R` |
| Tom / Shaker / Cowbell / Perc | `T Y U I` |
| Bass / Chord / Lead / Pluck pads | `A S D F` |
| Piano octave 1 | `Z S X D C V G B H N J M` |
| Piano octave 2 | Hold `Shift` + the same keys |
| Sample slots | `1 2 3 4` |

## Recording a live loop

1. Choose 8, 16, 24, or 32 steps.
2. Press the red **Record** button. Playback starts automatically.
3. Play performance pads, piano notes, guitar frets, or a sample slot.
4. Your performance is quantized into the matching sequencer lane.
5. Press **Record** again to finish.

## Recording voice or importing a sound

1. Select one of the four sample slots.
2. Choose **Record microphone** or **Import audio**.
3. Set the slot to **1-shot** or **Loop**.
4. Click **Play**, press its number key, or use the Sample lane in the sequencer.

> Audio never leaves the browser. Clearing site data removes locally stored samples.

## Deploy to GitHub Pages

1. Create a public repository.
2. Push the contents of this folder to the repository root.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**, then choose `main` and `/ (root)`.
5. Open the generated HTTPS URL. Microphone recording will work because GitHub Pages uses HTTPS.

No build command is required.

## Project structure

```text
beatbloom/
├── index.html                 # Entire application
├── README.md                  # English documentation
├── README-fa.md               # Persian documentation
├── LICENSE                    # MIT license
├── CONTRIBUTING.md            # Contribution guide
├── CODE_OF_CONDUCT.md         # Community standards
├── SECURITY.md                # Security policy
├── run-local.bat              # Windows launcher
├── run-local.sh               # macOS/Linux launcher
└── docs/
    └── beatbloom-preview.png  # Project screenshot
```

## Browser support

Recent versions of Chrome and Edge provide the best experience. Firefox and Safari support most features, but microphone codecs and Web Audio behavior can vary. BeatBloom requires the Web Audio API; microphone recording additionally requires `MediaRecorder` and `getUserMedia`.

## Privacy

BeatBloom contains no telemetry, advertising, user accounts, cloud sync, or third-party trackers. Projects use `localStorage`; recorded/imported samples use IndexedDB. Audio processing happens on-device.

## Contributing

Ideas, bug reports, accessibility improvements, presets, and new instruments are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Released under the [MIT License](LICENSE), copyright © 2026 Maboox. You may use, modify, distribute, and host BeatBloom freely.

---

Built for curiosity, quick ideas, and the joy of making noise.
