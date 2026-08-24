/* app.js — logique principale de DroneMove */

(() => {
  "use strict";

  // ---------- State ----------
  let allMovements = [];
  let currentFilter = "all";
  let currentSearch = "";
  let sortMode = "date"; // "date" | "name" | "mode"
  let currentPlanType = "all";     // "all" | "manual" | "quickshot"
  let currentQuickshot = "all";    // "all" | "dronie" | "rocket" | "circle" | "boomerang" | "helix" | "asteroid"
  let pendingDeleteId = null;
  let activeStickTarget = null; // for manual joystick picker state during form editing
  let manualDirections = { left: "", right: "", nacelle: 0 };
  let editingVideoBlob = null; // holds the currently selected/kept video blob for the form
  let editingThumb = null;
  let previewCleanupTimer = null;
  let formDirty = false;

  const MODE_LABELS = { cine: "Ciné", normal: "Normal", sport: "Sport" };
const SPEED_LABELS = { slow: "Lente", normal: "Normale", fast: "Rapide" };
  const QUICKSHOT_LABELS = {
    dronie: "Dronie", rocket: "Rocket", circle: "Circle",
    helix: "Helix", boomerang: "Boomerang", asteroid: "Asteroid"
  };
  const DIR_ARROWS = {
    "up": "↑", "down": "↓", "left": "←", "right": "→",
    "up-left": "↖", "up-right": "↗", "down-left": "↙", "down-right": "↘", "": "●"
  };

  // SVG Manette direction mapping
  const MANETTE_DIRS = {
    "haut-gauche": "up-left", "haut": "up", "haut-droite": "up-right",
    "gauche": "left", "droite": "right",
    "bas-gauche": "down-left", "bas": "down", "bas-droite": "down-right",
    "etat-neutre": ""
  };

  // Nacelle direction mapping
  const NACELLE_DIRS = {
    "fleche-nacelle-gauche": -1,
    "fleche-nacelle-droite": 1
  };

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }

  function showToast(msg, ms = 2600) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { el.hidden = true; }, ms);
  }

  function openModal(id) { $("#" + id).hidden = false; document.body.style.overflow = "hidden"; }
  function closeModal(id) {
    if (id === "modal-form" && formDirty) {
      if (!confirm("Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?")) return;
    }
    $("#" + id).hidden = true;
    if (!$$(".modal-overlay:not([hidden])").length) document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    const closeTarget = e.target.closest("[data-close]");
    if (closeTarget) closeModal(closeTarget.dataset.close);
    if (e.target.classList && e.target.classList.contains("modal-overlay")) {
      closeModal(e.target.id);
    }
  });

  // ---------- Focus trap + Escape key for modals ----------
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const topModal = document.querySelector(".modal-overlay:not([hidden]), .video-overlay:not([hidden])");
      if (topModal) {
        e.preventDefault();
        closeModal(topModal.id);
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const topModal = document.querySelector(".modal-overlay:not([hidden]), .video-overlay:not([hidden])");
    if (!topModal) return;
    const focusable = topModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  function fmtBytes(bytes) {
    if (!bytes) return "0 Mo";
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return mb.toFixed(mb < 10 ? 1 : 0) + " Mo";
    return (mb / 1024).toFixed(2) + " Go";
  }

  // ---------- SVG Manette handling ----------
  async function loadManetteSVG() {
    const container = $("#manette-svg-container");
    if (!container) return;
    // Prevent double-fetch
    if (container.dataset.svgLoaded === "true") return;
    container.dataset.svgLoaded = "true";
    try {
      const resp = await fetch("icons/manette-joystick-molette02.svg");
      const svgText = await resp.text();
      container.innerHTML = svgText;
      initManetteInteractions();
    } catch (err) {
      console.error("Failed to load manette SVG:", err);
      container.innerHTML = "<p style='color:var(--text-dim);text-align:center;'>Erreur chargement manette</p>";
    }
  }

  function initManetteInteractions() {
    const svg = $("#manette-svg-container svg");
    if (!svg) return;

    // Joystick directions (8 per joystick)
    const directionIds = [
      "haut-gauche", "haut", "haut-droite",
      "gauche", "droite",
      "bas-gauche", "bas", "bas-droite"
    ];

    // Left joystick arrows (use data-name for canonical names)
    directionIds.forEach(dir => {
      const el = svg.querySelector(`#fleche-joystick-gauche [data-name="${dir}"]`);
      if (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => selectManetteDirection("left", MANETTE_DIRS[dir]));
      }
    });

    // Right joystick arrows (use direct IDs)
    directionIds.forEach(dir => {
      const el = svg.querySelector(`#fleche-joystick-droite #${dir}`);
      if (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => selectManetteDirection("right", MANETTE_DIRS[dir]));
      }
    });

    // Neutral state (center) for each joystick
    const neutreG = svg.querySelector("#etat-neutreG");
    if (neutreG) {
      neutreG.style.cursor = "pointer";
      neutreG.addEventListener("click", () => selectManetteDirection("left", ""));
    }
    const neutreD = svg.querySelector("#etat-neutreD");
    if (neutreD) {
      neutreD.style.cursor = "pointer";
      neutreD.addEventListener("click", () => selectManetteDirection("right", ""));
    }

    // Nacelle arrows
    const nacelleGauche = svg.querySelector("#fleche-nacelle-gauche");
    const nacelleDroite = svg.querySelector("#fleche-nacelle-droite");
    if (nacelleGauche) {
      nacelleGauche.style.cursor = "pointer";
      nacelleGauche.addEventListener("click", () => selectNacelleDirection(-1));
    }
    if (nacelleDroite) {
      nacelleDroite.style.cursor = "pointer";
      nacelleDroite.addEventListener("click", () => selectNacelleDirection(1));
    }

    // Sync gimbal input with nacelle visual
    const gimbalInput = $("#f-gimbal");
    if (gimbalInput) {
      gimbalInput.addEventListener("input", () => {
        const val = gimbalInput.value;
        if (val === "") {
          manualDirections.nacelle = 0;
        } else {
          const num = Number(val);
          manualDirections.nacelle = num > 0 ? 1 : (num < 0 ? -1 : 0);
        }
        updateNacelleVisual();
      });
    }
  }

  function selectManetteDirection(stick, dir) {
    manualDirections[stick] = dir;
    updateManetteVisual(stick);
  }

  function selectNacelleDirection(dir) {
    // Toggle: if same direction clicked again, reset to 0
    const current = manualDirections.nacelle || 0;
    manualDirections.nacelle = (current === dir) ? 0 : dir;
    updateNacelleVisual();
    // Update gimbal input
    const gimbalInput = $("#f-gimbal");
    if (gimbalInput) {
      gimbalInput.value = manualDirections.nacelle !== 0 ? (manualDirections.nacelle > 0 ? "30" : "-30") : "";
    }
  }

  function updateManetteVisual(stick) {
    const svg = $("#manette-svg-container svg");
    if (!svg) return;

    const dir = manualDirections[stick] || "";
    const prefix = stick === "left" ? "fleche-joystick-gauche" : "fleche-joystick-droite";
    const neutreId = stick === "left" ? "etat-neutreG" : "etat-neutreD";

    // Reset all arrows and neutral
    const allArrows = svg.querySelectorAll(`#${prefix} polygon, #${neutreId} path`);
    allArrows.forEach(el => el.classList.remove("stick-active"));

    // Highlight selected
    if (dir === "") {
      const neutre = svg.querySelector(`#${neutreId}`);
      if (neutre) neutre.classList.add("stick-active");
    } else {
      const dirKey = Object.keys(MANETTE_DIRS).find(k => MANETTE_DIRS[k] === dir);
      if (dirKey) {
        let target;
        if (stick === "left") {
          target = svg.querySelector(`#${prefix} [data-name="${dirKey}"]`);
        } else {
          target = svg.querySelector(`#${prefix} #${dirKey}`);
        }
        if (target) target.classList.add("stick-active");
      }
    }
  }

  function updateNacelleVisual() {
    const svg = $("#manette-svg-container svg");
    if (!svg) return;

    const dir = manualDirections.nacelle || 0;
    const gauche = svg.querySelector("#fleche-nacelle-gauche");
    const droite = svg.querySelector("#fleche-nacelle-droite");
    gauche?.classList.toggle("stick-active", dir === -1);
    droite?.classList.toggle("stick-active", dir === 1);
  }

  function renderManetteReadonly(movement) {
    // Returns HTML string for read-only display in settings modal
    return `
      <div class="manette-readonly" id="manette-readonly-container"></div>
    `;
  }

  function initManetteReadonly(movement) {
    const container = $("#manette-readonly-container");
    if (!container) return;

    // Load SVG directly for readonly display (don't depend on form's container)
    fetch("icons/manette-joystick-molette02.svg")
      .then(resp => resp.text())
      .then(svgText => {
        container.innerHTML = svgText;
        const svg = container.querySelector("svg");
        if (!svg) return;
        svg.style.width = "100%";
        svg.style.maxWidth = "320px";
        svg.style.margin = "0 auto";
        // Remove interaction styles
        svg.querySelectorAll("[style*='cursor']").forEach(el => el.style.cursor = "default");
        // Apply readonly selection state
        applyManetteReadonlyState(svg, movement);
      })
      .catch(err => {
        console.error("Failed to load manette SVG for readonly:", err);
        container.innerHTML = "<p style='color:var(--text-dim);text-align:center;'>Erreur chargement manette</p>";
      });
  }

  function applyManetteReadonlyState(svg, movement) {
    const ACCENT = "#3b82f6"; // var(--accent)
    const DEFAULT = "#666";
    const NEUTRAL_FILL = "#e6e6e6"; // fill of neutral state paths

    // Helper to set fill on element(s)
    const setFill = (els, color) => {
      if (!els) return;
      const arr = els.length !== undefined ? Array.from(els) : [els];
      arr.forEach(el => { if (el) el.setAttribute("fill", color); });
    };

    // --- Left joystick ---
    if (movement.manualLeftStick) {
      const dirKey = Object.keys(MANETTE_DIRS).find(k => MANETTE_DIRS[k] === movement.manualLeftStick);
      if (dirKey) {
        const target = svg.querySelector(`#fleche-joystick-gauche [data-name="${dirKey}"]`);
        setFill(target, ACCENT);
      }
    } else {
      // Neutral: the two <path> inside #etat-neutreG
      setFill(svg.querySelectorAll("#etat-neutreG path"), NEUTRAL_FILL);
      // Also ensure arrows are default
      setFill(svg.querySelectorAll("#fleche-joystick-gauche polygon"), DEFAULT);
    }

    // --- Right joystick ---
    if (movement.manualRightStick) {
      const dirKey = Object.keys(MANETTE_DIRS).find(k => MANETTE_DIRS[k] === movement.manualRightStick);
      if (dirKey) {
        const target = svg.querySelector(`#fleche-joystick-droite #${dirKey}`);
        setFill(target, ACCENT);
      }
    } else {
      setFill(svg.querySelectorAll("#etat-neutreD path"), NEUTRAL_FILL);
      setFill(svg.querySelectorAll("#fleche-joystick-droite polygon"), DEFAULT);
    }

    // --- Nacelle ---
    const gauche = svg.querySelector("#fleche-nacelle-gauche");
    const droite = svg.querySelector("#fleche-nacelle-droite");
    setFill(gauche, DEFAULT);
    setFill(droite, DEFAULT);
    // gimbalDegrees can be 0 (neutral), negative, or positive - check for null/undefined explicitly
    if (movement.gimbalDegrees != null) {
      const dir = movement.gimbalDegrees > 0 ? 1 : (movement.gimbalDegrees < 0 ? -1 : 0);
      if (dir !== 0) {
        const target = svg.querySelector(dir === 1 ? "#fleche-nacelle-droite" : "#fleche-nacelle-gauche");
        setFill(target, ACCENT);
      }
    }
  }

  // ---------- Thumbnail generation ----------
  function generateThumbnail(videoBlob) {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(videoBlob);
        const video = document.createElement("video");
        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.addEventListener("loadeddata", () => {
          video.currentTime = Math.min(0.4, (video.duration || 1) / 4);
        });
        video.addEventListener("seeked", () => {
          const canvas = document.createElement("canvas");
          canvas.width = 320;
          canvas.height = Math.round(320 * (video.videoHeight / video.videoWidth || 0.75));
          const ctx = canvas.getContext("2d");
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.75));
          } catch (err) {
            resolve(null);
          }
          URL.revokeObjectURL(url);
        }, { once: true });
        video.addEventListener("error", () => { URL.revokeObjectURL(url); resolve(null); });
      } catch (err) {
        resolve(null);
      }
    });
  }

  // ---------- Rendering ----------
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

  function renderList() {
    const list = getFilteredSorted();
    const container = $("#list-container");
    const empty = $("#empty-state");

    if (allMovements.length === 0) {
      container.innerHTML = "";
      empty.hidden = false;
      $("#empty-title").textContent = "Aucun mouvement";
      $("#empty-text").textContent = "Ajoutez votre premier mouvement de drone pour construire votre bibliothèque.";
      $("#btn-empty-add").hidden = false;
    } else if (list.length === 0) {
      container.innerHTML = "";
      empty.hidden = false;
      $("#empty-title").textContent = "Aucun résultat";
      $("#empty-text").textContent = "Aucun mouvement ne correspond à ta recherche ou à ce filtre.";
      $("#btn-empty-add").hidden = true;
    } else {
      empty.hidden = true;
      container.innerHTML = "";
      list.forEach(m => container.appendChild(renderRow(m)));
    }

    renderPlanChips();
    renderQSChips();
    updateResultsCount();
  }

  function renderRow(m) {
    const row = document.createElement("div");
    row.className = "movement-row";
    row.dataset.id = m.id;

    const badgeClass = m.planType === "quickshot" ? "badge-quickshot" : "badge-manual";
    const badgeText = m.planType === "quickshot" ? "QuickShots" : "Manuel";
    const tagsText = (m.tags && m.tags.length) ? m.tags.join(" · ") : "";

    row.innerHTML = `
      <button class="thumb" data-action="play" aria-label="Voir la vidéo de ${escapeHtml(m.name)}">
        ${m.thumbnail
          ? `<img src="${m.thumbnail}" alt="">`
          : `<span class="thumb-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg></span>`}
        <span class="thumb-play"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg></span>
      </button>
      <div class="row-main">
        <p class="row-name">${escapeHtml(m.name)}</p>
        <div class="row-meta">
          <span class="badge ${badgeClass}">${badgeText}</span>
          ${tagsText ? `<span class="row-tags">${escapeHtml(tagsText)}</span>` : ""}
        </div>
      </div>
      <div class="row-actions">
        <button class="remote-btn" data-action="settings" aria-label="Réglages de vol">
          <img src="icons/manette-joystick-molette.svg" alt="" width="40" height="40">
        </button>
        <button class="btn-presentation" data-action="presentation" data-id="${m.id}" aria-label="Mode présentation">
          <span class="btn-presentation-icon">🎬</span>
        </button>
        <button class="menu-btn" data-action="menu" aria-label="Options">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
        </button>
      </div>
    `;

    const thumbBtn = row.querySelector(".thumb");
    wireThumbPreview(thumbBtn, m);
    thumbBtn.addEventListener("click", (e) => {
      // Always stop preview and open fullscreen on click
      if (thumbBtn.dataset.previewing === "1") {
        const previewVideo = thumbBtn.querySelector("video");
        if (previewVideo) {
          previewVideo.pause();
          previewVideo.remove();
        }
        thumbBtn.dataset.previewing = "0";
        const img = thumbBtn.querySelector("img, .thumb-placeholder");
        if (img) img.style.display = "";
        if (thumbBtn._previewObjectUrl) { URL.revokeObjectURL(thumbBtn._previewObjectUrl); thumbBtn._previewObjectUrl = null; }
      }
      openVideoFullscreen(m);
    });

    row.querySelector('[data-action="settings"]').addEventListener("click", () => openSettingsModal(m));
    row.querySelector('[data-action="menu"]').addEventListener("click", (e) => openRowMenu(e.currentTarget, m));

    return row;
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- Hover / long-press video preview ----------
  function wireThumbPreview(thumbBtn, movement) {
    if (!movement.thumbnail) return;
    let previewVideo = null;
    let longPressTimer = null;
    let cachedBlob = null;

    async function startPreview() {
      if (previewVideo) return;
      if (!cachedBlob) {
        const full = await MovementStore.get(movement.id);
        cachedBlob = full?.videoBlob || null;
      }
      if (!cachedBlob) return;
      const objectUrl = URL.createObjectURL(cachedBlob);
      previewVideo = document.createElement("video");
      previewVideo.src = objectUrl;
      previewVideo.muted = true;
      previewVideo.loop = true;
      previewVideo.playsInline = true;
      previewVideo.autoplay = true;
      previewVideo.style.pointerEvents = "none";
      const img = thumbBtn.querySelector("img, .thumb-placeholder");
      if (img) img.style.display = "none";
      thumbBtn.appendChild(previewVideo);
      thumbBtn.dataset.previewing = "1";
      thumbBtn._previewObjectUrl = objectUrl;
      previewVideo.play().catch(() => {});
    }

    function stopPreview() {
      thumbBtn.dataset.previewing = "0";
      if (previewVideo) {
        previewVideo.pause();
        previewVideo.remove();
        previewVideo = null;
      }
      if (thumbBtn._previewObjectUrl) { URL.revokeObjectURL(thumbBtn._previewObjectUrl); thumbBtn._previewObjectUrl = null; }
      const img = thumbBtn.querySelector("img, .thumb-placeholder");
      if (img) img.style.display = "";
    }

    thumbBtn.addEventListener("mouseenter", startPreview);
    thumbBtn.addEventListener("mouseleave", stopPreview);

    thumbBtn.addEventListener("touchstart", (e) => {
      longPressTimer = setTimeout(() => { startPreview(); }, 420);
    }, { passive: true });
    thumbBtn.addEventListener("touchend", () => {
      clearTimeout(longPressTimer);
      if (thumbBtn.dataset.previewing === "1") {
        setTimeout(stopPreview, 60);
      }
    });
    thumbBtn.addEventListener("touchmove", () => clearTimeout(longPressTimer));
  }

  // ---------- Video fullscreen ----------
  async function openVideoFullscreen(movement) {
    const full = await MovementStore.get(movement.id);
    const blob = full?.videoBlob;
    if (!blob) { showToast("Aucune vidéo pour ce mouvement."); return; }
    const overlay = $("#video-overlay");
    const player = $("#video-player");
    const url = URL.createObjectURL(blob);
    player.src = url;
    overlay.hidden = false;
    player.play().catch(() => {});
    overlay._objectUrl = url;
  }
  $("#btn-video-close").addEventListener("click", closeVideoFullscreen);
  function closeVideoFullscreen() {
    const overlay = $("#video-overlay");
    const player = $("#video-player");
    player.pause();
    player.src = "";
    if (overlay._objectUrl) { URL.revokeObjectURL(overlay._objectUrl); overlay._objectUrl = null; }
    overlay.hidden = true;
  }

  // ---------- Row context menu ----------
  let openMenuEl = null;
  function openRowMenu(anchorBtn, movement) {
    closeRowMenu();
    const menu = document.createElement("div");
    menu.className = "row-menu";
    menu.innerHTML = `
      <button data-act="edit">Modifier</button>
      <button data-act="delete" class="danger">Supprimer</button>
    `;
    document.body.appendChild(menu);
    const rect = anchorBtn.getBoundingClientRect();
    menu.style.top = (window.scrollY + rect.bottom + 6) + "px";
    menu.style.left = (window.scrollX + rect.right - menu.offsetWidth - 140) + "px";
    // clamp after measuring
    requestAnimationFrame(() => {
      const mw = menu.offsetWidth;
      let left = rect.right - mw;
      if (left < 10) left = 10;
      menu.style.left = (window.scrollX + left) + "px";
    });

    menu.querySelector('[data-act="edit"]').addEventListener("click", () => { closeRowMenu(); openForm("edit", movement); });
    menu.querySelector('[data-act="delete"]').addEventListener("click", () => { closeRowMenu(); askDelete(movement.id); });

    openMenuEl = menu;
    setTimeout(() => document.addEventListener("click", onDocClickCloseMenu), 0);
  }
  function onDocClickCloseMenu(e) {
    if (openMenuEl && !openMenuEl.contains(e.target)) closeRowMenu();
  }
  function closeRowMenu() {
    if (openMenuEl) { openMenuEl.remove(); openMenuEl = null; }
    document.removeEventListener("click", onDocClickCloseMenu);
  }

  // ---------- Delete ----------
  function askDelete(id) {
    pendingDeleteId = id;
    openModal("modal-confirm-delete");
  }
  $("#btn-confirm-delete").addEventListener("click", async () => {
    if (!pendingDeleteId) return;
    await MovementStore.delete(pendingDeleteId);
    pendingDeleteId = null;
    closeModal("modal-confirm-delete");
    await reloadMovements();
    showToast("Mouvement supprimé.");
  });

  // ---------- Settings modal (read-only) ----------
  function openSettingsModal(m) {
    $("#settings-movement-name").textContent = m.name;
    const body = $("#settings-body");

    let planHtml = "";
    if (m.planType === "quickshot") {
      const qs = m.quickshotSettings || {};
      let qsDetails = "";

      if (m.quickshotSubmode === "dronie" && qs.distance != null) {
        qsDetails = `<div class="setting-row">
          <span class="setting-row-label">Distance</span>
          <span class="setting-row-value">${qs.distance} m</span>
        </div>`;
      } else if (m.quickshotSubmode === "rocket" && qs.rocketAltitude != null) {
        qsDetails = `<div class="setting-row">
          <span class="setting-row-label">Altitude</span>
          <span class="setting-row-value">${qs.rocketAltitude} m</span>
        </div>`;
      } else if ((m.quickshotSubmode === "circle" || m.quickshotSubmode === "boomerang") && qs.direction) {
        qsDetails = `<div class="setting-row">
          <span class="setting-row-label">Direction</span>
          <span class="setting-row-value">${qs.direction === "right" ? "Droite" : "Gauche"}</span>
        </div>`;
      } else if (m.quickshotSubmode === "helix") {
        if (qs.direction) {
          qsDetails += `<div class="setting-row">
            <span class="setting-row-label">Direction</span>
            <span class="setting-row-value">${qs.direction === "right" ? "Droite" : "Gauche"}</span>
          </div>`;
        }
        if (qs.helixRadius != null) {
          qsDetails += `<div class="setting-row">
            <span class="setting-row-label">Rayon maximum</span>
            <span class="setting-row-value">${qs.helixRadius} m</span>
          </div>`;
        }
      }

      planHtml = `
        <div class="setting-row">
          <span class="setting-row-label">Sous-mode QuickShots</span>
          <span class="setting-row-value">${QUICKSHOT_LABELS[m.quickshotSubmode] || "—"}</span>
        </div>${qsDetails}`;
    } else {
      planHtml = `
        <div class="manual-visual">
          <div class="joystick-picker">
            <span class="joystick-label">Manette de contrôle</span>
            <div id="manette-readonly-container"></div>
          </div>
        </div>
        <div class="setting-row">
          <span class="setting-row-label">Nacelle (gâchette gauche)</span>
          <span class="setting-row-value">${m.gimbalDegrees != null ? (m.gimbalDegrees > 0 ? "+" : "") + m.gimbalDegrees + "°" : "—"}</span>
        </div>`;
    }

    body.innerHTML = `
      <div class="setting-row">
        <span class="setting-row-label">Mode télécommande</span>
        <span class="setting-row-value">${MODE_LABELS[m.remoteMode] || "—"}</span>
      </div>
      <div class="setting-row">
        <span class="setting-row-label">Altitude</span>
        <span class="setting-row-value">${m.altitude != null && m.altitude !== "" ? m.altitude + " m" : "—"}</span>
      </div>
      <div class="setting-row">
        <span class="setting-row-label">Vitesse</span>
        <span class="setting-row-value">${m.speed != null ? m.speed + " km/h" : "—"}</span>
      </div>
      <div class="setting-row">
        <span class="setting-row-label">Type de plan</span>
        <span class="setting-row-value">${m.planType === "quickshot" ? "QuickShots" : "Manuel"}</span>
      </div>
      ${planHtml}
      ${(m.tags && m.tags.length) ? `
      <div style="margin-top:14px;">
        <span class="setting-row-label" style="display:block;margin-bottom:8px;">Tags</span>
        ${m.tags.map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join("")}
      </div>` : ""}
      ${m.notes ? `
      <div style="margin-top:14px;">
        <span class="setting-row-label" style="display:block;margin-bottom:8px;">Notes</span>
        <div class="notes-box">${escapeHtml(m.notes)}</div>
      </div>` : ""}
    `;
    
    // Initialize readonly manette for manual movements
    if (m.planType === "manual") {
      setTimeout(() => initManetteReadonly(m), 50);
    }
    
    openModal("modal-settings");
  }

  // ---------- Load / init ----------
  function resetForm() {
    $("#movement-form").reset();
    $("#f-id").value = "";
    $("#f-video-current").textContent = "";
    editingVideoBlob = null;
    editingThumb = null;
    manualDirections = { left: "", right: "", nacelle: 0 };
    $("#f-speed").value = "36";
    setSegmented("f-plantype", "manual");
    togglePlanBlocks("manual");
    toggleQuickshotFields("dronie");
    formDirty = false;
    // Manette SVG will be loaded when manual block is shown
  }

  function setSegmented(groupId, value) {
    const group = $("#" + groupId);
    group.querySelectorAll(".seg-btn").forEach(b => {
      b.classList.toggle("seg-active", b.dataset.value === value);
    });
    group.dataset.value = value;
  }

  function togglePlanBlocks(planType) {
    const manualBlock = $("#block-manual");
    const quickshotBlock = $("#block-quickshot");
    manualBlock.hidden = planType !== "manual";
    quickshotBlock.hidden = planType !== "quickshot";

    // Load manette SVG when manual block becomes visible
    if (planType === "manual") {
      loadManetteSVG();
    }
  }

  $("#f-plantype").addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    setSegmented("f-plantype", btn.dataset.value);
    togglePlanBlocks(btn.dataset.value);
  });

  // ---------- QuickShot sub-fields ----------
  function toggleQuickshotFields(submode) {
    const hasDistance = submode === "dronie";
    const hasRocketAlt = submode === "rocket";
    const hasDirection = submode === "circle" || submode === "helix" || submode === "boomerang";
    const hasHelixRadius = submode === "helix";

    $("#qs-field-distance").hidden = !hasDistance;
    $("#qs-field-rocket-altitude").hidden = !hasRocketAlt;
    $("#qs-field-direction").hidden = !hasDirection;
    $("#qs-field-helix-radius").hidden = !hasHelixRadius;
  }

  $("#f-quickshot").addEventListener("change", (e) => {
    toggleQuickshotFields(e.target.value);
  });

  $("#f-video").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      editingVideoBlob = file;
      $("#f-video-current").textContent = "Nouvelle vidéo sélectionnée : " + file.name;
    }
  });

  function openForm(mode, movement) {
    resetForm();
    $("#form-title").textContent = mode === "edit" ? "Modifier le mouvement" : "Ajouter un mouvement";

    if (mode === "edit" && movement) {
      $("#f-id").value = movement.id;
      $("#f-name").value = movement.name || "";
      $("#f-mode").value = movement.remoteMode || "normal";
      $("#f-altitude").value = movement.altitude != null ? movement.altitude : "";
      $("#f-speed").value = movement.speed != null ? movement.speed : "36";
      setSegmented("f-plantype", movement.planType || "manual");
      togglePlanBlocks(movement.planType || "manual");
      $("#f-quickshot").value = movement.quickshotSubmode || "dronie";
      toggleQuickshotFields(movement.quickshotSubmode || "dronie");

      // Populate quickshot settings
      const qs = movement.quickshotSettings || {};
      if (qs.distance != null) $("#f-qs-distance").value = qs.distance;
      if (qs.rocketAltitude != null) $("#f-qs-rocket-altitude").value = qs.rocketAltitude;
      if (qs.direction) $("#f-qs-direction").value = qs.direction;
      if (qs.helixRadius != null) $("#f-qs-helix-radius").value = qs.helixRadius;

      $("#f-gimbal").value = movement.gimbalDegrees != null ? movement.gimbalDegrees : "";
      $("#f-tags").value = (movement.tags || []).join(", ");
      $("#f-notes").value = movement.notes || "";

      manualDirections.left = movement.manualLeftStick || "";
      manualDirections.right = movement.manualRightStick || "";
      manualDirections.nacelle = movement.gimbalDegrees ? (movement.gimbalDegrees > 0 ? 1 : -1) : 0;

      // Wait for SVG to load then update visual
      loadManetteSVG().then(() => {
        updateManetteVisual("left");
        updateManetteVisual("right");
        updateNacelleVisual();
      });

      editingVideoBlob = movement.videoBlob || null;
      editingThumb = movement.thumbnail || null;
      if (movement.videoBlob) $("#f-video-current").textContent = "Vidéo actuelle conservée (sélectionne un fichier pour la remplacer).";
    }

    openModal("modal-form");
  }

  $("#movement-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    formDirty = false;
    const id = $("#f-id").value || uid();
    const name = $("#f-name").value.trim();
    if (!name) { showToast("Le nom du mouvement est requis."); return; }

    const planType = $("#f-plantype").dataset.value || "manual";
    const speed = Number($("#f-speed").value) || 36;
    const tags = $("#f-tags").value.split(",").map(t => t.trim()).filter(Boolean);

    let thumbnail = editingThumb;
    if ($("#f-video").files[0]) {
      thumbnail = await generateThumbnail(editingVideoBlob);
    }

    // Nacelle: use gimbal input directly (allows 0, ±30, etc.)
    const gimbalInput = $("#f-gimbal").value;
    const gimbalDegrees = gimbalInput !== "" ? Number(gimbalInput) : null;

    const movement = {
      id,
      name,
      videoBlob: editingVideoBlob || null,
      thumbnail: thumbnail || null,
      remoteMode: $("#f-mode").value,
      altitude: $("#f-altitude").value !== "" ? Number($("#f-altitude").value) : null,
      speed,
      planType,
      quickshotSubmode: planType === "quickshot" ? $("#f-quickshot").value : null,
      quickshotSettings: planType === "quickshot" ? {
        distance: $("#f-qs-distance").value !== "" ? Number($("#f-qs-distance").value) : null,
        rocketAltitude: $("#f-qs-rocket-altitude").value !== "" ? Number($("#f-qs-rocket-altitude").value) : null,
        direction: $("#f-qs-direction").value || null,
        helixRadius: $("#f-qs-helix-radius").value !== "" ? Number($("#f-qs-helix-radius").value) : null,
      } : null,
      manualLeftStick: planType === "manual" ? (manualDirections.left || null) : null,
      manualRightStick: planType === "manual" ? (manualDirections.right || null) : null,
      gimbalDegrees: planType === "manual" ? gimbalDegrees : null,
      tags,
      notes: $("#f-notes").value.trim() || null,
      createdAt: Date.now()
    };

    // preserve original createdAt when editing
    const existingId = $("#f-id").value;
    if (existingId) {
      const original = allMovements.find(m => m.id === existingId);
      if (original) movement.createdAt = original.createdAt;
    }

    await MovementStore.put(movement);
    closeModal("modal-form");
    await reloadMovements();
    showToast(existingId ? "Mouvement modifié." : "Mouvement ajouté.");
  });

  // Track form changes for unsaved warning
  $("#movement-form").addEventListener("input", () => { formDirty = true; });
  $("#movement-form").addEventListener("change", () => { formDirty = true; });

  // ---------- Cascade filter rendering ----------
  function renderPlanChips() {
    const row = $("#filter-plan-row");
    const hasQuickshots = allMovements.some(m => m.planType === "quickshot");
    const hasManual = allMovements.some(m => m.planType === "manual");

    if (!hasQuickshots && !hasManual) {
      row.hidden = true;
      return;
    }
    row.hidden = false;

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

  // ---------- Filters / search / sort ----------
  const debouncedRender = debounce(() => { renderList(); updateResultsCount(); }, 200);
  $("#search-input").addEventListener("input", (e) => {
    currentSearch = e.target.value;
    debouncedRender();
  });

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

  $("#filter-plan-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $$("#filter-plan-chips .chip").forEach(c => c.classList.remove("chip-active"));
    chip.classList.add("chip-active");
    currentPlanType = chip.dataset.plan;
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

  const SORT_CYCLE = ["date", "name", "mode"];
  const SORT_LABELS = { date: "Date d'ajout", name: "Nom (A-Z)", mode: "Mode télécommande" };
  $("#btn-sort").addEventListener("click", () => {
    const idx = SORT_CYCLE.indexOf(sortMode);
    sortMode = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
    $("#btn-sort").classList.toggle("sort-active", sortMode !== "date");
    showToast("Trié par : " + SORT_LABELS[sortMode]);
    renderList();
    updateResultsCount();
  });

  // ---------- FAB / empty add ----------
  $("#btn-fab").addEventListener("click", () => openForm("add"));
  $("#btn-empty-add").addEventListener("click", () => openForm("add"));

  // ---------- Settings (app) ----------
  $("#btn-settings").addEventListener("click", async () => {
    openModal("modal-app-settings");
    await refreshStorageEstimate();
  });

  async function refreshStorageEstimate() {
    const textEl = $("#storage-text");
    const fillEl = $("#storage-bar-fill");
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const { usage, quota } = await navigator.storage.estimate();
        const pct = quota ? Math.min(100, (usage / quota) * 100) : 0;
        textEl.textContent = `${fmtBytes(usage)} sur ~${fmtBytes(quota)}`;
        fillEl.style.width = pct + "%";
        return;
      } catch (err) { /* fall through */ }
    }
    textEl.textContent = "Estimation indisponible sur ce navigateur";
    fillEl.style.width = "0%";
  }

  // ---------- Export ----------
  $("#btn-export").addEventListener("click", async () => {
    const statusEl = $("#export-status");
    try {
      statusEl.textContent = "Préparation de l'export…";
      const zip = new JSZip();
      const videosFolder = zip.folder("videos");
      const data = [];
      const allFull = await MovementStore.getAll();

      for (const m of allFull) {
        const entry = { ...m };
        delete entry.videoBlob;
        if (m.videoBlob) {
          const ext = guessExt(m.videoBlob.type);
          entry.videoFile = `videos/${m.id}.${ext}`;
          videosFolder.file(`${m.id}.${ext}`, m.videoBlob);
        }
        data.push(entry);
      }

      zip.file("data.json", JSON.stringify({ exportedAt: Date.now(), movements: data }, null, 2));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dronemove-export-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      statusEl.textContent = "Export terminé.";
      showToast("Bibliothèque exportée.");
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Erreur pendant l'export.";
    }
  });

  function guessExt(mime) {
    if (!mime) return "mp4";
    const m = mime.split("/")[1];
    return (m || "mp4").split(";")[0];
  }

  // ---------- Import ----------
  $("#import-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const statusEl = $("#export-status");
    try {
      statusEl.textContent = "Import en cours…";
      const zip = await JSZip.loadAsync(file);
      const dataFile = zip.file("data.json");
      if (!dataFile) throw new Error("data.json introuvable dans l'archive.");
      const parsed = JSON.parse(await dataFile.async("string"));
      const movements = parsed.movements || [];

      let count = 0;
      for (const entry of movements) {
        const newId = uid(); // toujours un nouvel id pour ne jamais écraser l'existant
        let videoBlob = null;
        if (entry.videoFile && zip.file(entry.videoFile)) {
          videoBlob = await zip.file(entry.videoFile).async("blob");
        }
        const movement = {
          ...entry,
          id: newId,
          videoBlob,
          createdAt: Date.now()
        };
        delete movement.videoFile;
        await MovementStore.put(movement);
        count++;
      }

      e.target.value = "";
      await reloadMovements();
      statusEl.textContent = `${count} mouvement(s) importé(s).`;
      showToast(`${count} mouvement(s) importé(s) comme nouveaux mouvements.`);
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Erreur : archive invalide.";
    }
  });

  // ---------- Load / init ----------
  async function reloadMovements() {
    allMovements = await MovementStore.getAllMetadata();
    renderList();
  }

  async function init() {
    await reloadMovements();
    // Pre-load manette SVG so it's ready when form opens
    loadManetteSVG();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  init();
})();
