# Mode présentation — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un mode présentation plein écran pour afficher les détails d'un mouvement de manière lisible sur le terrain.

**Architecture:** Ajout d'un bouton 🎬 sur chaque ligne de la liste, d'un conteneur plein écran (#presentation-mode) avec vidéo auto-play, infos du mouvement en gros caractères, et bouton de fermeture.

**Tech Stack:** Vanilla JS (IIFE), HTML5, CSS3 (custom properties)

---

### Task 1 : HTML — Bouton présentation + conteneur plein écran

**Files:**
- Modify: `index.html` — ligne de la liste (row template dans app.js) + nouveau conteneur

**Interfaces:**
- Consumes: nada (première tâche HTML)
- Produit: bouton `.btn-presentation` sur chaque ligne, `#presentation-mode` conteneur

- [ ] **Step 1 : Ajouter le conteneur de présentation dans index.html**

Avant la fermeture `</div class="app">` (fin du fichier), ajouter :

```html
<!-- MODE PRÉSENTATION -->
<div id="presentation-mode" class="presentation-overlay" hidden>
  <div class="presentation-header">
    <button class="presentation-close" id="btn-presentation-close" aria-label="Fermer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <button class="presentation-play" id="btn-presentation-play" aria-label="Play/Pause">
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path class="play-icon" d="M8 5v14l11-7z"/>
        <path class="pause-icon" d="M6 4h4v16H6zM14 4h4v16h-4z" hidden/>
      </svg>
    </button>
  </div>

  <div class="presentation-body">
    <div class="presentation-video-wrap">
      <video id="presentation-video" class="presentation-video" loop playsinline></video>
      <div class="presentation-no-video" id="presentation-no-video" hidden>Pas de vidéo</div>
    </div>

    <div class="presentation-info">
      <h2 class="presentation-name" id="presentation-name"></h2>
      <p class="presentation-subtitle" id="presentation-subtitle"></p>

      <div class="presentation-stats">
        <div class="presentation-stat">
          <span class="presentation-stat-label">ALTITUDE</span>
          <span class="presentation-stat-value" id="presentation-altitude">—</span>
        </div>
        <div class="presentation-stat">
          <span class="presentation-stat-label">VITESSE</span>
          <span class="presentation-stat-value" id="presentation-speed">—</span>
        </div>
      </div>

      <div class="presentation-sticks" id="presentation-sticks" hidden>
        <div class="presentation-sticks-header">STICKS</div>
        <div class="presentation-sticks-row">
          <span>Gauche: <strong id="presentation-stick-left">—</strong></span>
          <span>Droite: <strong id="presentation-stick-right">—</strong></span>
        </div>
        <div class="presentation-sticks-row">
          <span>Nacelle: <strong id="presentation-gimbal">—</strong></span>
        </div>
      </div>

      <div class="presentation-tags" id="presentation-tags"></div>
    </div>
  </div>
</div>
```

- [ ] **Step 2 : Ajouter le bouton 🎬 dans le template de ligne (app.js)**

Dans `app.js`, chercher le template de la ligne de liste (dans `renderList()`). Après le bouton réglages existant, ajouter le bouton présentation. Le bouton doit avoir `data-id="${m.id}"` et classe `btn-presentation`.

- [ ] **Step 3 : Vérifier le rendu**

Ouvrir `http://localhost:8080`, vérifier que le bouton 🎬 apparaît sur chaque ligne et que le conteneur de présentation est caché par défaut.

- [ ] **Step 4 : Commit**

```bash
git add index.html app.js
git commit -m "feat: add presentation mode HTML structure and button"
```

---

### Task 2 : CSS — Styles du mode présentation

**Files:**
- Modify: `style.css`

**Interfaces:**
- Consumes: classes HTML `.presentation-overlay`, `.presentation-header`, `.presentation-body`, etc.
- Produit: styles visuels

- [ ] **Step 1 : Ajouter les styles CSS du mode présentation**

À la fin de `style.css`, ajouter :

```css
/* ========== MODE PRÉSENTATION ========== */
.presentation-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: #0b0f14;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.presentation-overlay[hidden] {
  display: none;
}

.presentation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  position: sticky;
  top: 0;
  background: #0b0f14;
  z-index: 1;
}

.presentation-close,
.presentation-play {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.1);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.presentation-close:active,
.presentation-play:active {
  background: rgba(255,255,255,0.2);
}

.presentation-close svg,
.presentation-play svg {
  width: 22px;
  height: 22px;
}

.presentation-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 var(--space-4) var(--space-6);
  gap: var(--space-5);
}

/* Vidéo */
.presentation-video-wrap {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 16/9;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #000;
  position: relative;
}

.presentation-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.presentation-no-video {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  font-size: var(--text-base);
}

/* Infos */
.presentation-info {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.presentation-name {
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  line-height: 1.2;
}

.presentation-subtitle {
  font-size: var(--text-base);
  color: var(--text-dim);
  margin: 0;
}

/* Stats */
.presentation-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.presentation-stat {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.presentation-stat-label {
  font-size: var(--text-xs);
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.presentation-stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
}

/* Sticks */
.presentation-sticks {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.presentation-sticks-header {
  font-size: var(--text-xs);
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-2);
}

.presentation-sticks-row {
  display: flex;
  gap: var(--space-5);
  font-size: var(--text-base);
  color: var(--text-dim);
  margin-bottom: var(--space-1);
}

.presentation-sticks-row strong {
  color: var(--text);
}

/* Tags */
.presentation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-dim);
}

/* Bouton 🎬 dans la liste */
.btn-presentation {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  flex-shrink: 0;
}

.btn-presentation svg {
  width: 18px;
  height: 18px;
}

.btn-presentation:active {
  color: var(--accent);
  border-color: var(--accent);
}

/* Masquer play-icon / pause-icon selon état */
.presentation-play[data-playing="true"] .play-icon { display: none; }
.presentation-play[data-playing="true"] .pause-icon { display: block; }
.presentation-play[data-playing="false"] .play-icon { display: block; }
.presentation-play[data-playing="false"] .pause-icon { display: none; }
```

- [ ] **Step 2 : Vérifier le rendu**

Ouvrir `http://localhost:8080`, vérifier que le bouton 🎬 a le bon style et que le conteneur de présentation est correctement positionné (caché par défaut).

- [ ] **Step 3 : Commit**

```bash
git add style.css
git commit -m "feat: add presentation mode CSS styles"
```

---

### Task 3 : JS — Fonctions d'ouverture/fermeture et remplissage

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `allMovements` (array), `$()`, `$$()` helpers
- Produit: `openPresentationMode(movement)`, `closePresentationMode()`

- [ ] **Step 1 : Ajouter les fonctions de présentation**

Dans `app.js`, après la section des filtres cascade (ou après `updateResultsCount()`), ajouter :

```js
// ---------- MODE PRÉSENTATION ----------
function openPresentationMode(movement) {
  const overlay = $("#presentation-mode");
  const video = $("#presentation-video");
  const noVideo = $("#presentation-no-video");
  const playBtn = $("#btn-presentation-play");

  // Remplir les infos
  $("#presentation-name").textContent = movement.name || "Sans nom";

  // Sous-titre
  const modeLabel = { cine: "Ciné", normal: "Normal", sport: "Sport" };
  const planLabel = movement.planType === "quickshot" ? "QuickShots" : "Manuel";
  let subtitle = modeLabel[movement.remoteMode] || movement.remoteMode;
  subtitle += " · " + planLabel;
  if (movement.planType === "quickshot" && movement.quickshotSubmode) {
    subtitle += " — " + movement.quickshotSubmode.charAt(0).toUpperCase() + movement.quickshotSubmode.slice(1);
  }
  $("#presentation-subtitle").textContent = subtitle;

  // Altitude / Vitesse
  $("#presentation-altitude").textContent = movement.altitude != null ? movement.altitude + "m" : "—";
  $("#presentation-speed").textContent = movement.speed != null ? movement.speed + " km/h" : "—";

  // Sticks (uniquement mode Manuel)
  const sticksEl = $("#presentation-sticks");
  if (movement.planType === "manual") {
    sticksEl.hidden = false;
    $("#presentation-stick-left").textContent = movement.manualLeftStick || "—";
    $("#presentation-stick-right").textContent = movement.manualRightStick || "—";
    $("#presentation-gimbal").textContent = movement.gimbalDegrees != null ? movement.gimbalDegrees + "°" : "—";
  } else {
    sticksEl.hidden = true;
  }

  // Tags
  const tagsEl = $("#presentation-tags");
  if (movement.tags && movement.tags.length) {
    tagsEl.innerHTML = movement.tags.map(t =>
      `<span class="tag-chip">${escapeHtml(t)}</span>`
    ).join("");
    tagsEl.hidden = false;
  } else {
    tagsEl.hidden = true;
  }

  // Vidéo
  if (movement.videoBlob) {
    video.src = URL.createObjectURL(movement.videoBlob);
    video.hidden = false;
    noVideo.hidden = true;
    video.play().catch(() => {});
    playBtn.dataset.playing = "true";
  } else {
    video.hidden = true;
    noVideo.hidden = false;
    playBtn.dataset.playing = "false";
  }

  // Afficher
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePresentationMode() {
  const overlay = $("#presentation-mode");
  const video = $("#presentation-video");

  video.pause();
  if (video.src) {
    URL.revokeObjectURL(video.src);
    video.src = "";
  }
  overlay.hidden = true;
  document.body.style.overflow = "";
}
```

- [ ] **Step 2 : Ajouter les event listeners**

Dans la section event listeners, ajouter :

```js
  // Présentation
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-presentation");
    if (btn) {
      const m = allMovements.find(m => m.id === btn.dataset.id);
      if (m) openPresentationMode(m);
    }
  });

  $("#btn-presentation-close").addEventListener("click", closePresentationMode);

  $("#btn-presentation-play").addEventListener("click", () => {
    const video = $("#presentation-video");
    const playBtn = $("#btn-presentation-play");
    if (video.paused) {
      video.play();
      playBtn.dataset.playing = "true";
    } else {
      video.pause();
      playBtn.dataset.playing = "false";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#presentation-mode").hidden) {
      closePresentationMode();
    }
  });
```

- [ ] **Step 3 : Vérification manuelle**

1. Ouvrir `http://localhost:8080`
2. Ajouter un mouvement avec vidéo
3. Cliquer le bouton 🎬 → le mode présentation s'ouvre
4. Vérifier que la vidéo joue en loop
5. Cliquer ✕ ou Escape → fermeture
6. Tester avec un mouvement sans vidéo → "Pas de vidéo" affiché
7. Tester avec un mode Manuel → sticks affichés

- [ ] **Step 4 : Commit**

```bash
git add app.js
git commit -m "feat: add presentation mode JS logic and event listeners"
```

---

### Task 4 : Nettoyage et déploiement

**Files:**
- Modify: `sw.js` (version cache)

- [ ] **Step 1 : Incrémenter la version du cache SW**

Dans `sw.js`, changer `dronemove-shell-v7` en `dronemove-shell-v8`.

- [ ] **Step 2 : Commit et push**

```bash
git add sw.js
git commit -m "chore: bump SW cache to v8"
git push
```

- [ ] **Step 3 : Deploy sur Netlify**

```bash
npx netlify-cli deploy --prod --dir=.
```

- [ ] **Step 4 : Vérifier sur le téléphone**

Ouvrir `https://drone-move-aup.netlify.app`, tester le mode présentation sur mobile.
