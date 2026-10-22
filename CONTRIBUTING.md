# Contributing / مشارکت

BeatBloom welcomes focused improvements to musical workflows, accessibility, sound quality and privacy.

## Develop

Use Node.js 24 LTS (minimum 22.13):

```sh
npm ci --ignore-scripts
npm run dev
npm run check
npx playwright install chromium
npm run test:e2e
npm run test:production
```

Use `npm run format` before committing. Public CI runs on Linux with Chromium; compatible installed Edge/Chrome can be selected locally using `PLAYWRIGHT_CHANNEL`.

## Design and architecture

- Keep audio processing on-device. Do not introduce analytics, remote project/audio uploads, external fonts or account requirements.
- Put data validation and migrations in `model.js`, shared synthesis in `audio.js`, storage in `storage.js`, and interaction in `main.js`. Do not patch functions by rebinding older implementations.
- Live and offline playback must use the same instrument/effect code. Verify sample scheduling against the audio clock and preserve exact recorded pitches.
- Add a dependency only for a concrete benefit. Pin direct versions, commit the lockfile, and retain runtime license notices.
- Treat filenames, project data and stored records as untrusted. Never insert user strings with `innerHTML` or spread imported objects into state.
- Use the warm orange design tokens, Lucide icons, accessible control names, visible focus, keyboard access and reduced-motion support. Review English and Persian, 390px and desktop widths.
- Include regression tests for behavior changes. Use short synthetic samples, not personal recordings or copyrighted audio.

## Pull requests

Describe the user-visible problem, resulting behavior, validation and remaining limitations. Include real screenshots for UI changes. Keep generated builds, private projects, recordings, secrets, local paths and personal contact details out of commits. Use a GitHub noreply address for commits if you do not want your email published.

Use [private security reporting](https://github.com/maboox/BeatBloom/security/advisories/new) for exploitable issues. Public feature/bug reports belong in [Issues](https://github.com/maboox/BeatBloom/issues/new/choose).

## فارسی

برای مشارکت، تغییرات را متمرکز نگه دار و آزمون‌های بالا را اجرا کن. حریم خصوصی، پردازش روی دستگاه، رابط فارسی و انگلیسی و دسترس‌پذیری باید حفظ شوند. از صداهای مصنوعی برای آزمون استفاده کن؛ ضبط شخصی، اطلاعات تماس، کلیدها و فایل پروژهٔ خصوصی را کامیت نکن. برای تغییر ظاهری عکس واقعی و برای تغییر عملکرد آزمون بازگشت خطا اضافه کن. مشکلات امنیتی قابل سوءاستفاده را خصوصی گزارش بده.
