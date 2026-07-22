# Security Policy

## Reporting a vulnerability

Please avoid publishing an exploitable security issue before it is fixed. Open a private GitHub security advisory for the repository and include reproduction steps, affected browsers, and expected impact.

## Security and privacy model

BeatBloom is a static, local-first application. It has no backend and sends no project or audio data to a server. Microphone access is requested only after the user presses the recording control. Projects are stored in localStorage and samples in IndexedDB.

When self-hosting, use HTTPS. GitHub Pages provides HTTPS automatically.
