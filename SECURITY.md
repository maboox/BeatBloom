# Security policy

## Report privately

Use [GitHub private vulnerability reporting](https://github.com/maboox/BeatBloom/security/advisories/new). Include affected versions, browser, reproduction steps using synthetic audio, and potential impact. Do not attach private recordings, credentials or a publicly exploitable proof of concept to an issue.

Version 4.x receives fixes. Older versions should be upgraded; v1–3.1 project arrangements can be imported into v4.

## Trust boundaries

- BeatBloom is a static application with no server-side project processing, authentication, telemetry or audio uploads. Hosting providers receive normal page and asset requests.
- Project JSON, embedded sample data, uploaded audio, IndexedDB records and filenames are untrusted. Projects are rebuilt from known keys with numeric, note, lane, version and length validation; untrusted objects are never merged into state. File names are inserted with `textContent`.
- Audio is decoded by the browser. Each source file is limited to 20 MB and 30 seconds, with at most two channels. Portable project input is limited to 114 MiB and four embedded samples. The browser may still use significant memory to decode a compressed file before its duration can be checked.
- Microphone permission is requested only after the recording control is pressed. Tracks are released on success, error, timeout and page hiding. A pending permission response is rejected if the page has become hidden.
- Local projects use localStorage; sample blobs use IndexedDB. These are not encrypted vaults. Scripts on the same origin, browser extensions with sufficient permissions, and people with access to the browser profile may access local data. Use an isolated origin for self-hosting.
- `.beatbloom` files contain original sample audio, including any microphone recordings. Treat them as private unless intentionally sharing. Erasing local data does not delete already downloaded files or operating-system backups.

## Browser and hosting protections

The production document has a self-only script policy, restricts media to local/blob sources, blocks plugins, base URL changes and form submissions, and does not load third-party runtime assets. Inline style attributes remain allowed for dynamic instrument colors and note positions; inline scripts and remote scripts are disallowed.

On static hosts that support `_headers`, the supplied file also adds anti-framing, no-referrer, MIME-sniffing and permission restrictions. **GitHub Pages ignores `_headers`**, and a CSP meta tag cannot enforce `frame-ancestors`; use a host or reverse proxy with configurable response headers if those protections are required. HTTPS or localhost is required for microphone recording.

## Supply chain and validation

Exact direct dependency versions and a committed npm lockfile make builds repeatable. CI runs lint, formatting, unit tests, browser regressions, axe accessibility checks, npm audit and a full-history Gitleaks scan. CodeQL scans JavaScript, and Dependabot proposes library/action updates. Workflow actions use full commit hashes. Fork pull requests receive read-only permissions; deployment checks the completed CI run's repository and branch before publishing its exact revision.

Automated scans reduce risk; they are not a guarantee that every vulnerability is absent. See [docs/AUDIT.md](docs/AUDIT.md) for findings and validation scope.

## فارسی

آسیب‌پذیری را از مسیر خصوصی GitHub گزارش کن و برای بازتولید از صدای مصنوعی استفاده کن. فایل پروژه حاوی صداهای اصلی، از جمله ضبط میکروفن است. ذخیرهٔ محلی رمزگذاری اختصاصی ندارد و افزونه‌های دارای دسترسی یا اشخاص دارای دسترسی به پروفایل مرورگر می‌توانند داده‌ها را بخوانند. پاک‌کردن داده‌های محلی، فایل‌های دانلودشده را حذف نمی‌کند. آزمون‌ها و اسکن‌ها انجام می‌شوند، ولی تضمین نبودن همهٔ آسیب‌پذیری‌ها نیستند.
