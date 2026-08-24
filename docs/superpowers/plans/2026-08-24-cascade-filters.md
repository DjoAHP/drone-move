# Filtres en cascade — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le système de filtres simple par un système en cascade avec 3 niveaux de chips combinables + compteur de résultats.

**Architecture:** Ajout de 2 nouvelles variables d'état (`currentPlanType`, `currentQuickshot`), modification de `getFilteredSorted()` pour combiner les filtres, ajout HTML pour les lignes de chips, et animation CSS pour l'apparition progressive.

**Tech Stack:** Vanilla JS (IIFE), HTML5, CSS3 (custom properties)

---

### Task 1 : State et logique de filtrage dans app.js

**Files:**
- Modify: `app.js:6-10` (state)
- Modify: `app.js:376-401` (getFilteredSorted)

**Interfaces:**
- Consumes: `allMovements` (array), `currentFilter`, `currentSearch`, `sortMode`
- Produces: `currentPlanType`, `currentQuickshot`, filtre combiné dans `getFilteredSorted()`

- [ ] **Step 1 : Ajouter les nouvelles variables d'état**

Dans `app.js`, après la ligne `let sortMode = "date";` (ligne 10), ajouter :

```js
let currentPlanType = "all";     // "all" | "manual" | "quickshot"
let currentQuickshot = "all";    // "all" | "dronie" | "rocket" | "circle" | "boomerang" | "helix" | "asteroid"
```

- [ ] **Step 2 : Modifier getFilteredSorted() pour les filtres combinés**

Remplacer la fonction `getFilteredSorted()` (lignes 376-401) par :

```js
function getFilteredSorted() {
  let list = allMovements.slice();

  // Filtre par mode télécommande
  if (currentFilter !== "all") {
    list = list.filter(m => m.remoteMode === currentFilter);
  }

  // Filtre par type de plan
  if (currentPlanType !== "all") {
    list = list.filter(m => m.planType === currentPlanType);
  }

  // Filtre par sous-mode QuickShots
  if (currentQuickshot !== "all") {
    list = list.filter(m => m.quickshotSubmode === currentQuickshot);
  }

  // Recherche texte (nom + tags)
  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    list = list.filter(m => {
      const inName = m.name.toLowerCase().includes(q);
      const inTags = (m.tags || []).some(t => t.toLowerCase().includes(q));
      return inName || inTags;
    });
  }

  // Tri
  if (sortMode === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  } else if (sortMode === "mode") {
    list.sort((a, b) => (a.remoteMode || "").localeCompare(b.remoteMode || ""));
  } else {
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  return list;
}
```

- [ ] **Step 3 : Vérifier manuellement**

Ouvrir `http://localhost:8080`, ajouter 2-3 mouvements de test (1 Manuel, 1 QuickShot), vérifier que la recherche et le filtre mode fonctionnent toujours.

---

### Task 2 : HTML — Ajouter les lignes de chips et compteur

**Files:**
- Modify: `index.html:51-68` (filters-row)

**Interfaces:**
- Consumes: nada (première tâche HTML)
- Produce: structure DOM pour `#filter-plan-chips`, `#filter-qs-chips`, `#results-count`

- [ ] **Step 1 : Remplacer le bloc filters-row dans index.html**

Remplacer les lignes 51-68 (du `<div class="filters-row">` au `</div>` fermant) par :

```html
    <!-- FILTERS + SORT -->
    <div class="filters-row">
      <div class="chips" id="filter-chips">
        <button class="chip chip-active" data-filter="all">Tous</button>
        <button class="chip" data-filter="cine">Ciné</button>
        <button class="chip" data-filter="normal">Normal</button>
        <button class="chip" data-filter="sport">Sport</button>
      </div>
      <button class="sort-btn" id="btn-sort" title="Trier">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <line x1="4" y1="6" x2="14" y2="6" />
          <line x1="4" y1="12" x2="11" y2="12" />
          <line x1="4" y1="18" x2="8" y2="18" />
          <path d="M17 4v16M17 4l4 4M17 4l-4 4" />
        </svg>
      </button>
    </div>

    <!-- Plan type filter -->
    <div class="filters-row filter-row-cascade" id="filter-plan-row">
      <div class="chips" id="filter-plan-chips">
        <button class="chip chip-active" data-plan="all">Tous</button>
        <button class="chip" data-plan="manual">Manuel</button>
        <button class="chip" data-plan="quickshot">QuickShots</button>
      </div>
    </div>

    <!-- QuickShots submode filter -->
    <div class="filters-row filter-row-cascade" id="filter-qs-row" hidden>
      <div class="chips chips-wrap" id="filter-qs-chips">
        <button class="chip chip-active" data-qs="all">Tous</button>
        <button class="chip" data-qs="dronie">Dronie</button>
        <button class="chip" data-qs="rocket">Rocket</button>
        <button class="chip" data-qs="circle">Circle</button>
        <button class="chip" data-qs="boomerang">Boomerang</button>
        <button class="chip" data-qs="helix">Helix</button>
        <button class="chip" data-qs="asteroid">Asteroid</button>
      </div>
    </div>

    <!-- Results counter -->
    <div class="results-count" id="results-count"></div>
```

- [ ] **Step 2 : Vérifier le rendu**

Ouvrir `http://localhost:8080`, vérifier que les 3 lignes de chips s'affichent correctement. La ligne QuickShots doit être cachée par défaut (`hidden`).

---

### Task 3 : CSS — Styles des filtres cascade

**Files:**
- Modify: `style.css` (après les styles `.chip` existants, ~ligne 170)

**Interfaces:**
- Consumes: classes HTML `.filter-row-cascade`, `.chips-wrap`, `.results-count`
- Produit: styles visuels

- [ ] **Step 1 : Ajouter les styles CSS**

Après le bloc `.sort-btn.sort-active` (vers ligne 187), ajouter :

```css
/* Cascade filter rows */
.filter-row-cascade {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.25s ease, opacity 0.2s ease, margin 0.2s ease;
  margin-bottom: 0;
}

.filter-row-cascade:not([hidden]) {
  max-height: 80px;
  opacity: 1;
  margin-bottom: var(--space-2);
}

.chips-wrap {
  flex-wrap: wrap;
  gap: var(--space-1);
}

/* Results counter */
.results-count {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--text-dim);
  padding: var(--space-1) 0 var(--space-2);
}
```

- [ ] **Step 2 : Vérifier le rendu**

Ouvrir `http://localhost:8080`, vérifier que la ligne Manuel/QuickShots est visible, et que la ligne QuickShots sous-modes est cachée. Vérifier que le compteur est visible (même vide pour l'instant).

---

### Task 4 : JS — Event listeners et logique de cascade

**Files:**
- Modify: `app.js:893-917` (section Filters / search / sort)

**Interfaces:**
- Consumes: `currentPlanType`, `currentQuickshot`, `currentFilter`, `currentSearch`, `sortMode`
- Produit: `renderList()`, `renderPlanChips()`, `renderQSChips()`, `updateResultsCount()`

- [ ] **Step 1 : Ajouter les fonctions de rendu des chips**

Avant la section `// ---------- Filters / search / sort ----------` (ligne 893), ajouter :

```js
// ---------- Cascade filter rendering ----------
function renderPlanChips() {
  const row = $("#filter-plan-row");
  const hasQuickshots = allMovements.some(m => m.planType === "quickshot");
  const hasManual = allMovements.some(m => m.planType === "manual");

  // Masquer la ligne si aucun mouvement n'a de planType défini
  if (!hasQuickshots && !hasManual) {
    row.hidden = true;
    return;
  }
  row.hidden = false;

  // Mettre à jour l'état actif
  $$("#filter-plan-chips .chip").forEach(c => {
    c.classList.toggle("chip-active", c.dataset.plan === currentPlanType);
  });
}

function renderQSChips() {
  const row = $("#filter-qs-row");
  row.hidden = currentPlanType !== "quickshot";

  if (currentPlanType === "quickshot") {
    $$("#filter-qs-chips .chip").forEach(c => {
      c.classList.toggle("chip-active", c.dataset.qs === currentQuickshot);
    });
  } else {
    currentQuickshot = "all";
  }
}

function updateResultsCount() {
  const count = getFilteredSorted().length;
  const total = allMovements.length;
  const el = $("#results-count");
  if (total === 0) {
    el.textContent = "";
  } else if (count === total) {
    el.textContent = `${total} mouvement${total > 1 ? "s" : ""}`;
  } else {
    el.textContent = `${count} résultat${count > 1 ? "s" : ""}`;
  }
}
```

- [ ] **Step 2 : Modifier le listener des chips mode (filter-chips)**

Remplacer le bloc `$("#filter-chips").addEventListener` (lignes 900-907) par :

```js
  $("#filter-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $$("#filter-chips .chip").forEach(c => c.classList.remove("chip-active"));
    chip.classList.add("chip-active");
    currentFilter = chip.dataset.filter;
    renderPlanChips();
    renderQSChips();
    renderList();
    updateResultsCount();
  });
```

- [ ] **Step 3 : Ajouter les listeners pour les chips plan type et quickshot**

Juste après le listener `filter-chips`, ajouter :

```js
  $("#filter-plan-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $$("#filter-plan-chips .chip").forEach(c => c.classList.remove("chip-active"));
    chip.classList.add("chip-active");
    currentPlanType = chip.dataset.plan;
    // Réinitialiser le sous-mode si on change de type
    if (currentPlanType !== "quickshot") {
      currentQuickshot = "all";
    }
    renderQSChips();
    renderList();
    updateResultsCount();
  });

  $("#filter-qs-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $$("#filter-qs-chips .chip").forEach(c => c.classList.remove("chip-active"));
    chip.classList.add("chip-active");
    currentQuickshot = chip.dataset.qs;
    renderList();
    updateResultsCount();
  });
```

- [ ] **Step 4 : Modifier le listener de recherche pour inclure le compteur**

Remplacer le bloc `$("#search-input").addEventListener` (lignes 895-898) par :

```js
  $("#search-input").addEventListener("input", (e) => {
    currentSearch = e.target.value;
    debouncedRender();
    updateResultsCount();
  });
```

- [ ] **Step 5 : Modifier debouncedRender pour inclure updateResultsCount**

Remplacer la ligne 894 :

```js
  const debouncedRender = debounce(() => { renderList(); updateResultsCount(); }, 200);
```

- [ ] **Step 6 : Ajouter updateResultsCount() dans le listener tri**

Dans le bloc `$("#btn-sort").addEventListener` (lignes 911-917), ajouter `updateResultsCount()` après `renderList()` :

```js
  $("#btn-sort").addEventListener("click", () => {
    const idx = SORT_CYCLE.indexOf(sortMode);
    sortMode = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
    $("#btn-sort").classList.toggle("sort-active", sortMode !== "date");
    showToast("Trié par : " + SORT_LABELS[sortMode]);
    renderList();
    updateResultsCount();
  });
```

- [ ] **Step 7 : Appeler renderPlanChips() et updateResultsCount() au initial render**

Dans la fonction `renderList()`, après le `container.innerHTML = list.map(...)`, ajouter les appels. Trouver la fin de `renderList()` et ajouter :

```js
  renderPlanChips();
  renderQSChips();
  updateResultsCount();
```

- [ ] **Step 8 : Vérification manuelle complète**

1. Ouvrir `http://localhost:8080`
2. Ajouter un mouvement "Test Ciné Manuel" (mode Ciné, type Manuel)
3. Ajouter un mouvement "Dronie Test" (mode Normal, type QuickShots > Dronie)
4. Ajouter un mouvement "Rocket Test" (mode Sport, type QuickShots > Rocket)
5. Vérifier : le compteur affiche "3 mouvements"
6. Cliquer "Ciné" → affiche 1 résultat, compteur "1 résultat"
7. Cliquer "Tous" → revient à 3
8. Cliquer "QuickShots" → la ligne sous-modes apparaît, affiche 2 résultats
9. Cliquer "Dronie" → affiche 1 résultat
10. Taper "rocket" dans la recherche → affiche 1 résultat (le Rocket)
11. Vider la recherche, cliquer "Manuel" → affiche 1 résultat

- [ ] **Step 9 : Commit**

```bash
git add app.js index.html style.css
git commit -m "feat: filtres en cascade (mode/plan/quickshot) + compteur résultats"
```

---

### Task 5 : Nettoyage et déploiement

**Files:**
- Modify: `sw.js` (version cache)

- [ ] **Step 1 : Incrémenter la version du cache SW**

Dans `sw.js`, changer `dronemove-shell-v6` en `dronemove-shell-v7`.

- [ ] **Step 2 : Commit et push**

```bash
git add sw.js
git commit -m "chore: bump SW cache to v7"
git push
```

- [ ] **Step 3 : Deploy sur Netlify**

```bash
npx netlify-cli deploy --prod --dir=.
```

- [ ] **Step 4 : Vérifier sur le téléphone**

Ouvrir `https://drone-move-aup.netlify.app`, vérifier que les filtres fonctionnent.
