# Mouvement favoris — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un toggle favori (☆/★) sur chaque ligne avec affichage en haut de liste.

**Architecture:** Ajout du champ `isFavorite` au data model, étoile cliquable dans le template de ligne, tri modifié pour séparer favoris/non-favoris.

**Tech Stack:** Vanilla JS (IIFE), HTML5, CSS3

---

### Task 1 : JS — Data model, toggle et tri favoris

**Files:**
- Modify: `app.js` — data model, renderRow template, getFilteredSorted

**Interfaces:**
- Consumes: `allMovements` (array), `$()` helpers
- Produit: `toggleFavorite(id)`, tri modifié

- [ ] **Step 1 : Ajouter isFavorite au data model**

Dans la fonction de sauvegarde (saveMovement ou similaire), ajouter `isFavorite: false` par défaut lors de la création d'un nouveau mouvement.

- [ ] **Step 2 : Ajouter la fonction toggleFavorite**

Dans app.js, ajouter :

```js
function toggleFavorite(id) {
  const m = allMovements.find(m => m.id === id);
  if (!m) return;
  m.isFavorite = !m.isFavorite;
  db.put(m).then(() => renderList());
}
```

- [ ] **Step 3 : Modifier le template de ligne pour ajouter l'étoile**

Dans le template de la ligne (renderRow), après le nom du mouvement, ajouter :

```html
<button class="btn-favorite ${m.isFavorite ? 'is-favorite' : ''}" data-id="${m.id}" aria-label="Favori">
  ${m.isFavorite ? '★' : '☆'}
</button>
```

- [ ] **Step 4 : Modifier getFilteredSorted pour trier les favoris en haut**

Dans `getFilteredSorted()`, après le tri existant, ajouter :

```js
// Séparer favoris / non-favoris, favoris en haut
const favorites = list.filter(m => m.isFavorite);
const others = list.filter(m => !m.isFavorite);
list = [...favorites, ...others];
```

- [ ] **Step 5 : Ajouter l'event listener pour le toggle**

Dans la section event listeners, ajouter :

```js
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-favorite");
  if (btn) {
    toggleFavorite(btn.dataset.id);
  }
});
```

- [ ] **Step 6 : Vérification manuelle**

1. Ouvrir `http://localhost:8080`
2. Ajouter 3 mouvements
3. Cliquer l'étoile sur le 2ème → il passe en haut de liste
4. Recharger la page → le favori est persisté
5. Désactiver le favori → il redescend

- [ ] **Step 7 : Commit**

```bash
git add app.js
git commit -m "feat: add favorites toggle and top-of-list sorting"
```

---

### Task 2 : CSS — Styles étoile et séparation

**Files:**
- Modify: `style.css`

**Interfaces:**
- Consumes: classes `.btn-favorite`, `.is-favorite`, `.favorites-separator`
- Produit: styles visuels

- [ ] **Step 1 : Ajouter les styles CSS**

À la fin de `style.css`, ajouter :

```css
/* ========== FAVORIS ========== */
.btn-favorite {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-faint);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.15s, transform 0.15s;
  flex-shrink: 0;
}

.btn-favorite:active {
  transform: scale(1.2);
}

.btn-favorite.is-favorite {
  color: #f59e0b;
}

.favorites-separator {
  height: 1px;
  background: var(--border);
  margin: var(--space-2) 0;
  opacity: 0.5;
}
```

- [ ] **Step 2 : Vérifier le rendu**

Vérifier que l'étoile est bien colorée en jaune quand activée.

- [ ] **Step 3 : Commit**

```bash
git add style.css
git commit -m "feat: add favorites star styles"
```

---

### Task 3 : Nettoyage et déploiement

**Files:**
- Modify: `sw.js`

- [ ] **Step 1 : Incrémenter la version du cache SW**

Dans `sw.js`, changer `dronemove-shell-v8` en `dronemove-shell-v9`.

- [ ] **Step 2 : Commit, push, deploy**

```bash
git add sw.js
git commit -m "chore: bump SW cache to v9"
git push
npx netlify-cli deploy --prod --dir=.
```

- [ ] **Step 3 : Vérifier sur le téléphone**

Ouvrir `https://drone-move-aup.netlify.app`, tester les favoris.
