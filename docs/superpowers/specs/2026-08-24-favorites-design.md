# Design — Mouvement favoris

## Objectif

Permettre d'épingler les mouvements que l'on utilise souvent en haut de la liste pour y accéder rapidement.

## Data model

Ajouter un champ `isFavorite` (boolean, défaut `false`) à l'objet movement dans IndexedDB.

## Interaction

- **Étoile ☆/★** sur chaque ligne de la liste, entre le nom et les boutons d'action
- Clic sur l'étoile → toggle `isFavorite` → sauvegarde immédiate dans IndexedDB
- L'étoile est pleine (★) quand favori, vide (☆) quand non-favori

## Affichage

- Les favoris apparaissent **toujours en haut** de la liste, peu importe le tri sélectionné
- Parmi les favoris, le tri s'applique normalement (date/nom/mode)
- Les non-favoris restent en dessous, avec le tri sélectionné
- Séparation visuelle subtile entre favoris et non-favoris (ligne ou espace)

## Fichiers à modifier

- `app.js` — ajout `isFavorite` au data model, toggle, tri modifié
- `style.css` — styles pour l'étoile et la séparation
- `index.html` — pas de changement (l'étoile est dans le template JS)

## Non inclus

- Compteur de favoris
- Filtre "Favoris" dédié
- Drag and drop pour réordonner
