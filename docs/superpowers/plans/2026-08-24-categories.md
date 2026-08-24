# Catégories / projets — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grouper les mouvements par projet avec séparateurs visuels et champ dans le formulaire.

**Architecture:** Ajout du champ `project` au data model, regroupement dans `getFilteredSorted()`, champ avec autocomplete dans le formulaire, styles pour les séparateurs de groupe.

**Tech Stack:** Vanilla JS (IIFE), HTML5, CSS3

---

### Task 1 : JS — Data model et regroupement par projet

**Files:**
- Modify: `app.js` — data model, getFilteredSorted, renderList, autocomplete

**Interfaces:**
- Consumes: `allMovements` (array), `$()` helpers
- Produit: regroupement par projet dans le rendu

- [ ] **Step 1 : Ajouter `project` au data model**

Dans la fonction de création/sauvegarde du mouvement, ajouter `project: $("#f-project").value.trim() || null` au mouvement.

- [ ] **Step 2 : Modifier getFilteredSorted pour retourner les mouvements groupés**

Remplacer le return simple par un retour groupé. La fonction doit retourner un tableau de groupes :

```js
function getFilteredSorted() {
  let list = allMovements.slice();

  // ... filtres existants (mode, planType, quickshot, recherche) ...

  // ... tri existant (name, mode, date) ...

  // Séparer favoris / non-favoris dans chaque groupe
  // Grouper par projet
  const groups = {};
  list.forEach(m => {
    const key = m.project || "";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  // Trier les groupes par nom ("" en dernier)
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b, "fr");
  });

  // Dans chaque groupe, favoris d'abord
  return sortedKeys.map(key => ({
    project: key || null,
    label: key || "Sans projet",
    movements: groups[key].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0; // garder le tri existant
    })
  }));
}
```

- [ ] **Step 3 : Modifier renderList pour afficher les groupes**

Remplacer le rendu simple par un rendu groupé :

```js
function renderList() {
  const groups = getFilteredSorted();
  const container = $("#list-container");
  const empty = $("#empty-state");

  // ... gestion état vide ...

  let html = "";
  groups.forEach(group => {
    // Séparateur de groupe
    html += `<div class="group-separator">${escapeHtml(group.label)}</div>`;
    // Lignes du groupe
    html += group.movements.map(m => renderRow(m)).join("");
  });

  container.innerHTML = html;
  // ... compteur, etc.
}
```

- [ ] **Step 4 : Extraire renderRow en fonction séparée**

Extraire le template de la ligne de la liste en une fonction `renderRow(m)` pour éviter la duplication.

- [ ] **Step 5 : Ajouter l'autocomplete pour le champ projet**

Ajouter un datalist avec les projets existants, mis à jour à chaque rendu.

- [ ] **Step 6 : Vérification manuelle**

1. Ajouter des mouvements avec différents projets
2. Vérifier le groupement
3. Vérifier que les favoris restent en haut de chaque groupe
4. Vérifier l'autocomplete

- [ ] **Step 7 : Commit**

```bash
git add app.js
git commit -m "feat: add project field and group movements by project"
```

---

### Task 2 : HTML — Champ projet dans le formulaire

**Files:**
- Modify: `index.html` — formulaire

**Interfaces:**
- Consumes: champ `#f-project` référencé par app.js
- Produit: champ visible dans le formulaire

- [ ] **Step 1 : Ajouter le champ projet dans le formulaire**

Dans le formulaire, après le champ tags, ajouter :

```html
<div class="field">
  <label for="f-project">Projet (optionnel)</label>
  <input type="text" id="f-project" placeholder="Ex : Villa Sophia, Forest Chase" autocomplete="off" list="project-list">
  <datalist id="project-list"></datalist>
</div>
```

- [ ] **Step 2 : Vérifier le rendu**

Vérifier que le champ apparaît dans le formulaire et que l'autocomplete fonctionne.

- [ ] **Step 3 : Commit**

```bash
git add index.html
git commit -m "feat: add project field to movement form"
```

---

### Task 3 : CSS — Styles séparateurs de groupe

**Files:**
- Modify: `style.css`

**Interfaces:**
- Consumes: classe `.group-separator`
- Produit: styles visuels

- [ ] **Step 1 : Ajouter les styles CSS**

À la fin de `style.css`, ajouter :

```css
/* ========== GROUPES / PROJETS ========== */
.group-separator {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent);
  padding: var(--space-3) 0 var(--space-1);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

- [ ] **Step 2 : Vérifier le rendu**

- [ ] **Step 3 : Commit**

```bash
git add style.css
git commit -m "feat: add project group separator styles"
```

---

### Task 4 : Nettoyage et déploiement

**Files:**
- Modify: `sw.js`

- [ ] **Step 1 : Incrémenter la version du cache SW**

Dans `sw.js`, changer `dronemove-shell-v9` en `dronemove-shell-v10`.

- [ ] **Step 2 : Commit, push, deploy**

```bash
git add sw.js
git commit -m "chore: bump SW cache to v10"
git push
npx netlify-cli deploy --prod --dir=.
```

- [ ] **Step 3 : Vérifier sur le téléphone**
