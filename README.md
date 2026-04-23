# 🧙 Code Wizard

A full-screen web app that teaches 7–10 year-olds real Python through 10 magical levels and a virtual pet final boss. Runs entirely in the browser — no installs, no accounts, no backend.

## 🚀 Deploy to GitHub Pages (easiest)

1. Create a new **public** repo on GitHub (e.g. `code-wizard`)
2. Upload ALL the files in this folder (drag-and-drop the contents into the GitHub web uploader)
3. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main / (root)** → Save
4. Wait ~1 minute. GitHub will show you your URL.

**Your kid-facing URL:**
```
https://YOUR-USERNAME.github.io/code-wizard/
```

That's it. Bookmark it on Chromebooks, share in Google Classroom, done.

## 📱 Install on a Chromebook (optional, works offline after)

1. Open the URL in Chrome on the Chromebook
2. Wait for it to fully load once (caches everything)
3. Click the **install icon** in the address bar (⊕ / ⬇) or Chrome menu → "Install Code Wizard"
4. Now it appears as an app in the launcher and works offline

## 🏠 Run locally

Pyodide needs a real server (not `file://`). From the project folder:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

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
```

## 🔧 Updating after a change

1. Edit the files (e.g. `lessons.js`, `shared.jsx`)
2. Bump the `?v=N` query-strings in `index.html` so browsers grab the new version
3. Bump the `CACHE` version string in `sw.js` (e.g. `'code-wizard-v2'` → `'code-wizard-v3'`) to force installed PWAs to refresh
4. `git add . && git commit -m "update" && git push`
5. GitHub Pages redeploys in ~1 minute
