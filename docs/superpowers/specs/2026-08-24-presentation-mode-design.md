# Design — Mode présentation / répétiteur de vol

## Objectif

Permettre de voir les détails d'un mouvement en plein écran, lisible sur le terrain avec le drone, en un seul clic depuis la liste.

## Accès

Bouton 🎬 sur chaque ligne de la liste, à côté du bouton réglages existant. Ouvre directement le mode présentation (pas la modal détail).

## Écran de présentation

Overlay plein écran (pas une modal classique) avec :

### Layout

```
┌─────────────────────────────────┐
│  ✕                          ▶   │  ← fermer / play video
│                                 │
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │
│     ▓                       ▓   │
│     ▓     VIDÉO DU VOL      ▓   │  ← vidéo auto-play en loop
│     ▓                       ▓   │
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │
│                                 │
│   ─────────────────────────     │
│                                 │
│   NOM DU MOUVEMENT              │  ← grand, gras
│   Mode: Ciné · Type: QuickShots │
│                                 │
│   ┌─────────┐  ┌─────────┐     │
│   │ALTITUDE │  │ VITESSE │     │  ← gros chiffres
│   │  45m    │  │  36km/h │     │
│   └─────────┘  └─────────┘     │
│                                 │
│   ┌───────────────────────┐     │
│   │ STICKS                │     │
│   │ Gauche: ↑↓  Droite: ↕│     │  ← direction sticks
│   │ Nacelle: +15°         │     │
│   └───────────────────────┘     │
│                                 │
│   Tags: immeuble · crépuscule  │
│                                 │
└─────────────────────────────────┘
```

### Éléments

- **Bouton ✕** : ferme le mode présentation, revient à la liste
- **Vidéo** : auto-play en loop, bouton play/pause, plein écran si disponible
- **Nom** :grand, gras, blanc
- **Sous-titre** : mode télécommande + type de plan (ex: "Ciné · QuickShots")
- **Altitude / Vitesse** : gros chiffres dans des cartes
- **Sticks** : directions gauche/droite + nacelle (si mode Manuel)
- **Tags** : liste en bas, petit texte

### Design visuel

- Fond : `#0b0f14` (même que l'app)
- Texte : blanc `#f2f5f8`, accent `#3b82f6` pour les labels
- Gros caractères : `font-size: 24px+` pour les chiffres
- Bordures subtiles entre sections

## Comportement

- Vidéo auto-play en loop au moment de l'ouverture
- Bouton play/pause pour contrôler la lecture
- Si pas de vidéo : afficher un placeholder "Pas de vidéo"
- Si altitude ou vitesse est null : afficher "—" à la place
- Fermeture : bouton ✕ ou touche Escape

## Données affichées

| Donnée | Source | Affichage |
|--------|--------|-----------|
| Nom | `movement.name` | Titre grand |
| Mode | `movement.remoteMode` | "Ciné" / "Normal" / "Sport" |
| Type | `movement.planType` | "Manuel" / "QuickShots" |
| Sous-mode QS | `movement.quickshotSubmode` | "Dronie" / "Rocket" / etc. (si QuickShots) |
| Altitude | `movement.altitude` | "45m" ou "—" |
| Vitesse | `movement.speed` | "36 km/h" ou "—" |
| Stick gauche | `movement.manualLeftStick` | Direction (si Manuel) |
| Stick droit | `movement.manualRightStick` | Direction (si Manuel) |
| Nacelle | `movement.gimbalDegrees` | "+15°" ou "—" (si Manuel) |
| Vidéo | `movement.videoBlob` | Lecteur vidéo |
| Tags | `movement.tags` | Liste séparée par " · " |

## Fichiers à modifier

- `index.html` — ajouter le bouton 🎬 sur chaque ligne + le conteneur du mode présentation
- `app.js` — ajouter `openPresentationMode(movement)`, `closePresentationMode()`, event listeners
- `style.css` — styles du mode présentation (plein écran, gros caractères)

## Non inclus

- Navigation entre mouvements (next/previous)
- Mode paysage forcé
- Compteur de prises / takes
