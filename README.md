# DroneMove

Bibliothèque personnelle de mouvements de drone (DJI Lito X1) : vidéo de démonstration, mode télécommande, altitude, vitesse, type de plan (Manuel ou QuickShots), tags et notes. Application 100% locale, sans backend ni cloud — tout est stocké dans le navigateur (IndexedDB ou Cache API + localStorage).

## Lancer l'app en local

Le service worker (mode hors ligne) exige d'être servi en `http://` (ou `https://`) — l'ouverture directe du fichier `index.html` en double-clic (`file://`) ne fonctionnera pas correctement pour la PWA.

Depuis le dossier du projet, une des options suivantes :

```bash
# Avec Python (déjà présent sur la plupart des systèmes)
# A lancer dans powershell dans le dossier du projet
python3 -m http.server 8080

# Ou avec Node (si tu as npx)
npx serve .
```

Puis ouvre `http://localhost:8080` dans ton navigateur.

Sur ton téléphone : connecte-le au même réseau Wi-Fi que ton PC, puis remplace `localhost` par l'adresse IP locale de ton PC (ex: `http://192.168.1.161:8080`).

## Structure du projet

```
dronemove/
├── index.html          → structure de la page (liste, modals, formulaire)
├── style.css           → thème sombre, accent bleu, responsive
├── db.js               → wrapper stockage (IndexedDB, Cache API + localStorage fallback)
├── app.js              → toute la logique de l'app
├── manifest.json       → manifeste PWA (installable)
├── sw.js               → service worker (cache hors ligne)
├── icons/
│   ├── icon-maskable.svg              → favicon + icône PWA (drone blanc)
│   ├── icon-clap-rouage.svg           → icône bouton mode présentation
│   ├── manette-joystick-molette.svg   → icône bouton réglages (ligne mouvement)
│   └── manette-joystick-molette02.svg → manette interactive (formulaire + lecture)
├── vendor/
│   └── jszip.min.js                   → librairie JSZip (export/import ZIP)
└── README.md
```

## Fonctionnalités

- Liste des mouvements (miniature vidéo générée automatiquement + nom + icône)
- Recherche par nom ou tag
- Filtres par mode télécommande (Ciné / Normal / Sport) avec filtres en cascade (plan → sous-mode QuickShots)
- Tri (date d'ajout / nom / mode)
- Aperçu vidéo au survol (desktop) ou appui long (mobile)
- Lecture plein écran au clic sur la miniature
- Badge Manuel / QuickShots sur chaque ligne
- Modal réglages de vol en lecture seule (mode, altitude, vitesse, type de plan, joysticks, nacelle, tags, notes)
- QuickShots avec réglages spécifiques par sous-mode :
  - **Dronie** : distance (30-120m)
  - **Rocket** : altitude (30-80m)
  - **Circle / Boomerang** : direction (droite/gauche)
  - **Helix** : direction + rayon maximum (10-120m)
  - **Asteroid** : aucun réglage
- Formulaire d'ajout / modification complet avec champ **Projet** (catégorie)
- Groupements par projet avec séparateurs visuels
- **Favoris** : étoile ☆/★ sur chaque mouvement, favoris toujours en haut de liste
- **Mode présentation** : plein écran avec vidéo en boucle, infos en gros pour outdoor
- **Indicateur de connexion** : point vert/rouge dans le header
- Suppression avec confirmation
- Page Réglages : indicateur d'espace utilisé + export/import en `.zip` (JSZip)
- PWA installable + fonctionnement hors ligne
- **Fallback stockage** : Cache API + localStorage si IndexedDB est indisponible

## Limites connues

- Pas de synchronisation entre appareils — utilise Export/Import pour transférer manuellement.
- Icônes PWA en SVG (pas de PNG 192/512) — fonctionne bien sous Chrome/Edge/Android, plus limité sous iOS Safari.
- JSZip chargé depuis un CDN — connexion internet nécessaire la première fois pour Export/Importer.
- Pas de compression vidéo à l'import.
- Fallback localStorage limité à ~5MB (peut ne pas suffirer pour beaucoup de vidéos).

## Stack technique

- **Frontend** : Vanilla JS (IIFE), HTML5, CSS3 (custom properties)
- **Stockage** : IndexedDB (wrapper promesse dans `db.js`), fallback Cache API + localStorage
- **PWA** : Service Worker (cache shell + network-first pour CDN)
- **Pas de build step** — pas de bundler, pas de package.json
