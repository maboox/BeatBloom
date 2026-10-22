# BeatBloom 4 audit and release review

Review date: 2026-10-22. Scope: repository source and reachable Git history, project imports, local persistence, transport/synthesis/export, microphone lifecycle, interface, accessibility and delivery configuration.

## Findings addressed

| Finding                                                                        | Resolution                                                                                      |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Repeated function replacements across v1/v2/v3 scripts and duplicate listeners | Explicit state model, independent audio/storage modules and one interaction routing layer       |
| Untrusted sample names interpolated into HTML                                  | DOM text insertion, with a hostile-filename regression                                          |
| Unbounded project values, arrays and imported keys                             | Known-key reconstruction, supported schema migrations and size/note/numeric validation          |
| Sample events fired early during lookahead                                     | Schedule source start using the transport's audio-clock timestamp                               |
| WAV used a separate renderer and omitted sample/instrument/effect behavior     | Shared engine for live and offline, including sample lanes, gain, swing and effects             |
| Future offline notes could be affected by a live voice limit                   | Offline scheduling bypasses the live polyphony cap                                              |
| Pending highlights could reappear after Stop                                   | Clock-driven render queue cleared by transport stop                                             |
| Piano and pad shortcuts collided                                               | Explicit piano keyboard mode and one key-routing handler                                        |
| Live piano pitches changed on replay                                           | Independent recorded Lead/Pluck/Guitar note arrays retain exact pitches                         |
| Incomplete microphone/error/timeout cleanup and changing selected slot         | Capture the target slot at start; release tracks on every exit; duration and size limits        |
| Failed storage or JSON could silently lose work                                | Visible error messages, unsaved warning, transactional sample replacement and portable backups  |
| No sample deletion/local-data control                                          | Explicit delete-slot and erase-local-data controls with confirmation                            |
| Author/committer metadata contained a personal email                           | Replace it with the account's GitHub noreply identity while preserving the original source tree |
| Missing automated quality/security/delivery checks                             | CI, npm audit, Gitleaks, CodeQL, pinned actions, Dependabot and validated Pages publishing      |

## Validation

Local validation includes model/WAV unit tests and actual Chromium-family browser tests for transport, mute, undo/redo, presets, storage, malformed project rejection, hostile filenames, embedded sample roundtrip, sample audibility, WAV header/length, keyboard routing, 390px layout, Persian direction and axe WCAG A/AA checks. New tests cover zero master volume, future sample scheduling, dense offline synthesis and exact recorded note preservation. Real screenshots are stored in `docs/`.

The initial full-history Gitleaks scan found no credential matches. The review found one branch (`main`), one initial commit and no tags/releases to remove. Publication metadata cleanup is verified against remote refs as part of release preparation. The original history backup is kept locally outside the public repository.

## Limits

This is a targeted code review and automated regression audit, not a third-party penetration-test certification. Scans may miss secrets or vulnerabilities. Compression can expand during browser decoding before duration is known. Browser extensions, device compromise, host logs and already downloaded project files are outside the app's deletion boundary. Force-pushing cleaned Git metadata does not erase existing clones or GitHub caches; repository owners can contact GitHub Support for cached-history removal if needed.

Firefox/Safari and physical microphone/audio-device combinations need additional hardware/browser testing. A private portable project intentionally contains its audio; do not publish user-created projects or recordings in the repository.
