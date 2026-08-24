# DroneMove — Agent Instructions

## Quick Start

```bash
# Serve locally (required for PWA/SW — file:// won't work)
python3 -m http.server 8080
# or
npx serve .
```

Open `http://localhost:8080`

## Architecture

- **Vanilla JS PWA** — no build step, no bundler, no package.json
- **3 JS modules**: `db.js` (storage wrapper), `app.js` (UI + logic, IIFE), `sw.js` (Service Worker)
- **Storage**: IndexedDB primary, fallback to Cache API (videos) + localStorage (metadata)
- **Videos**: stored as Blobs in IndexedDB, or as base64 in Cache API if IndexedDB unavailable

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | All markup + modals + form |
| `app.js` | State, rendering, interactions (IIFE) |
| `db.js` | Storage wrapper (IndexedDB + Cache API/localStorage fallback) |
| `sw.js` | Shell cache + network-first for JSZip CDN |
| `style.css` | Design system (CSS vars, dark theme, responsive) |
| `manifest.json` | PWA manifest (SVG maskable icon) |

## Icons

| File | Usage |
|------|-------|
| `icons/icon-maskable.svg` | Favicon + PWA manifest (drone blanc) |
| `icons/icon-clap-rouage.svg` | Bouton mode présentation (clap + rouage) |
| `icons/manette-joystick-molette.svg` | Bouton réglages dans la ligne mouvement |
| `icons/manette-joystick-molette02.svg` | Manette interactive (formulaire + modal lecture) |

## Critical Gotchas

1. **No tests exist** — add Vitest/Playwright before refactoring
2. **Memory leak risk** — `videoBlob` kept in JS memory (`allMovements` array) AND IndexedDB/Cache. Large libraries crash mobile tabs.
3. **JSZip from CDN** — export/import fails offline first time. SW caches after first load.
4. **No focus trap** on modals — accessibility gap (Tab escapes, Escape key ignored)
5. **`uid()` collision possible** — uses `crypto.randomUUID()`, collision unlikely but not impossible
6. **iOS PWA icons** — only SVG provided; needs PNG 192/512 for "Add to Home Screen"
7. **CSS `display` overrides `hidden`** — `.field`, `.empty-state`, `.presentation-no-video` need `[hidden] { display: none !important }` rules
8. **IndexedDB corruption** — can happen with large blobs; `db.js` has automatic fallback to Cache API + localStorage

## Development Notes

- **No lint / typecheck / format tools configured** — pure vanilla JS
- **CSS uses custom properties** (`:root`) for theming; `prefers-reduced-motion` supported
- **XSS mitigated** — `escapeHtml()` used on all dynamic outputs
- **Export/Import** — creates ZIP with `data.json` + `videos/` folder; import generates new IDs (loses original `createdAt`)
- **Favorites** — persisted in `isFavorite` field, always sorted to top of list
- **Categories/Projects** — `project` field groups movements with separators
- **Presentation mode** — fullscreen overlay, video auto-plays in loop, no play/pause button
- **Online indicator** — green/red dot in header via `navigator.onLine` events

## Common Tasks

| Task | Command / Approach |
|------|-------------------|
| Verify changes | Open `http://localhost:8080`, test manually |
| Clear all data | DevTools → Application → IndexedDB → Delete `dronemove-db` |
| Test offline | DevTools → Application → Service Workers → "Offline" checkbox |
| Add icon sizes | Generate PNG 192/512 from SVG, update `manifest.json` |
| Bundle JSZip locally | `npm i jszip` + import in `app.js`, remove CDN `<script>` |

## Repo Conventions

- French comments/labels (user-facing)
- IIFE wrapper in `app.js` — no ES modules
- State at top of `app.js` (`allMovements`, `currentFilter`, `sortMode`…)
- CSS: BEM-ish naming, mobile-first, `env(safe-area-inset-bottom)` for FAB
