# 🧙 Code Wizard

A full-screen web app that teaches 7–10 year-olds real Python through 10 magical levels and a virtual pet final boss. Runs entirely in the browser — no installs, no accounts, no backend.


**Your kid-facing URL:**
```
(https://github.com/myasharona/Code-Wizard)
```

Bookmark it on Chromebooks, share in Google Classroom, done.

## 📱 Install on a Chromebook (optional, works offline after)

1. Open the URL in Chrome on the Chromebook
2. Wait for it to fully load once (caches everything)
3. Click the **install icon** in the address bar (⊕ / ⬇) or Chrome menu → "Install Code Wizard"
4. Now it appears as an app in the launcher and works offline


## 📁 Files

```
index.html          ← the app (full-screen arcade cabinet)
manifest.json       ← PWA manifest for "Install App"
sw.js               ← service worker (offline caching)
lessons.js          ← all 10 lesson definitions
shared.jsx          ← Pyodide runner, editor, pet window, errors, sprites
arcade-cabinet.jsx  ← the main UI
sprites/            ← pixel art for owl, dragon, cat
icon-*.png          ← PWA icons


> **License:** All rights reserved. This is free to use in classrooms
> at the URL above, but please contact me before copying, modifying,
> or redistributing. See LICENSE for details.
