# Design — Mode hors ligne amélioré

## Objectif

Afficher un indicateur visuel de l'état de connexion pour rassurer l'utilisateur sur la disponibilité des données.

## Indicateur

- Petit cercle dans le header, à côté du titre "DRONEMOVE"
- Vert quand en ligne, rouge quand hors ligne
- Mis à jour en temps réel via l'événement `online`/`offline` du navigateur

## Emplacement

```
DRONEMOVE ●
Bibliothèque de mouvements
```

Le point est à droite du titre, aligné verticalement.

## Comportement

- Au chargement : vérifie `navigator.onLine`
- Écoute `window.addEventListener("online", ...)` et `window.addEventListener("offline", ...)`
- Pas de bannière temporaire — juste l'indicateur permanent

## Fichiers à modifier

- `index.html` — ajouter le point dans le header
- `app.js` — listener online/offline
- `style.css` — styles du point

## Non inclus

- Notification toast au changement d'état
- Sync automatique quand on revient en ligne
