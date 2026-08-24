# Design — Filtres en cascade pour DroneMove

## Objectif

Améliorer l'expérience de recherche dans la bibliothèque de mouvements avec un système de filtres combinables en cascade, adapté à une grande quantité de mouvements.

## État actuel

- Barre de recherche (nom + tags)
- Chips : Tous / Ciné / Normal / Sport (mode télécommande uniquement)
- Tri : date / nom / mode
- Filtres non combinables (un seul actif)

## Design proposé

### Layout

```
[🔍 Rechercher un mouvement ou un tag        ]

[Tous] [Ciné] [Normal] [Sport]          [▼ tri]
─────────────────────────────────────────────────
[Tous] [Manuel] [QuickShots]              ← ligne 2
─────────────────────────────────────────────────
[Tous] [Dronie] [Rocket] [Circle]        ← ligne 3 (si QuickShots)
[Boomerang] [Helix] [Asteroid]
─────────────────────────────────────────────────
                               12 mouvements
```

### Hiérarchie des filtres

| Ligne | Catégorie | Chips | Visible |
|-------|-----------|-------|---------|
| 1 | Mode télécommande | Tous, Ciné, Normal, Sport | Toujours |
| 2 | Type de plan | Tous, Manuel, QuickShots | Toujours |
| 3 | Sous-mode QuickShots | Tous, Dronie, Rocket, Circle, Boomerang, Helix, Asteroid | Si QuickShots sélectionné |

### État JS

```js
let currentFilter = "all";       // mode: "all" | "cine" | "normal" | "sport"
let currentPlanType = "all";     // plan: "all" | "manual" | "quickshot"
let currentQuickshot = "all";    // sous-mode: "all" | "dronie" | "rocket" | ...
```

### Logique de filtrage

Les filtres se combinent avec AND :
- Ciné + QuickShots + Dronie → mouvements Ciné qui sont des QuickShots Dronie
- Changement de mode → réinitialise planType et quickshot à "all" si incompatible

### Compteur de résultats

Texte sous les chips : `"12 mouvements"` ou `"3 résultat(s)"`

### CSS

- Même style de chips existantes
- Lignes 2 et 3 avec animation slide-down
- Compteur en `var(--text-dim)`, petit texte

### Fichiers à modifier

- `index.html` — ajouter lignes de chips + compteur
- `app.js` — ajouter state, logique de filtrage, rendu dynamique des lignes
- `style.css` — styles pour nouvelles lignes + animation

### Non inclus

- Recherche avancée (filtres par altitude, vitesse, etc.)
- Sauvegarde des filtres en URL
- Filtres par tags (reste dans la barre de recherche)
