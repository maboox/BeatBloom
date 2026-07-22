# Contributing to BeatBloom

Thanks for helping make BeatBloom better.

## Before you start

- Search existing issues before creating a new one.
- Keep the app local-first and dependency-free unless a dependency has a clear benefit.
- Do not add tracking, analytics, remote audio uploads, or mandatory accounts.
- Preserve keyboard, touch, and mouse access.

## Development

BeatBloom is a self-contained static app. Start a local server:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`, then test at desktop and mobile widths.

## Pull requests

1. Explain the user-facing problem.
2. Keep changes focused.
3. Test transport, loop resizing, presets, lane toggles, piano, guitar, sampler, project save/load, and WAV export.
4. Check the browser console for errors.
5. Include screenshots for visual changes.
6. Verify that controls do not overlap at 390px and 1440px widths.

## Audio contributions

Prefer synthesized sounds or original/clearly licensed audio. Do not commit copyrighted samples without permission. Document the source and license of any included audio asset.

## Accessibility

New controls should have accessible names, visible keyboard focus, sufficient contrast, and a minimum practical touch target of 44×44px where space permits.
