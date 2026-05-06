# Windows 12 — Concept Desktop

This repository contains a polished, dependency-free static concept build for a fictional Windows 12 desktop. It focuses on a glassmorphism interface, centered taskbar, Start menu, active windows, live clock, focus mode, dark/light themes, workspace switching, a security center, and a large structured concept catalog with 800 app modules.

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static file server.

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Quality checks

```bash
npm run check
npm test
```

The JavaScript state helpers and catalog behavior are covered by Node's built-in test runner, so no package installation is required. The repository now contains more than ten thousand lines of concept UI, data, styles, and tests.
