# Design — Catégories / dossiers de projets

## Objectif

Grouper les mouvements par projet ou lieu de tournage pour naviguer plus rapidement dans une grande bibliothèque.

## Data model

Ajouter un champ `project` (string, défaut `""`) à l'objet movement. Une catégorie = un projet (ex: "Villa Sophia", "Forest Chase").

## Création

- Champ "Projet" dans le formulaire d'ajout/modification (après les tags)
- Autocomplete : propose les projets existants quand on tape
- Champ optionnel — un mouvement peut n'avoir aucun projet

## Affichage dans la liste

- Les mouvements sont **groupés par projet**
- Les mouvements sans projet apparaissent dans un groupe "Sans projet" en bas
- Chaque groupe a un titre séparateur avec le nom du projet
- Favoris restent en haut de chaque groupe
- L'ordre des groupes : par ordre alphabétique des noms de projets

```
⭐ Villa Sophia
  ┌─────────────────────────────┐
  │ ★ Dronie Immeuble    🎬 ⚙ │
  │   Rocket Coucher     🎬 ⚙ │
  └─────────────────────────────┘

⭐ Forest Chase
  ┌─────────────────────────────┐
  │ ★ Helix Route        🎬 ⚙ │
  └─────────────────────────────┘

  Sans projet
  ┌─────────────────────────────┐
  │   Test mouvement     🎬 ⚙ │
  └─────────────────────────────┘
```

## Fichiers à modifier

- `app.js` — champ `project` au data model, groupe dans getFilteredSorted, autocomplete
- `index.html` — champ projet dans le formulaire
- `style.css` — styles pour les séparateurs de groupe

## Non inclus

- Renommer / supprimer un projet (se fait en modifiant les mouvements)
- Couleur par projet
- Tri des groupes
