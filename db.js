/* db.js — accès stockage pour DroneMove
   Stratégie : IndexedDB si dispo, sinon Cache API (vidéos) + localStorage (métadonnées) */

const DB_NAME = "dronemove-db";
const DB_VERSION = 1;
const STORE = "movements";
const LS_KEY = "dronemove-meta";
const VIDEO_CACHE = "dronemove-videos";

let dbInstance = null;
let storageMode = "idb"; // "idb" | "cache+ls"

// ---------- Détection du mode de stockage ----------

async function tryOpenIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
        store.createIndex("name", "name");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function detectStorageMode() {
  if (dbInstance) return "idb";
  try {
    dbInstance = await tryOpenIDB();
    return "idb";
  } catch {
    return "cache+ls";
  }
}

// ---------- localStorage (métadonnées uniquement) ----------

function lsLoad() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function lsSave(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); }
  catch (e) { console.error("localStorage save failed:", e); }
}

// ---------- Cache API (vidéos) ----------

async function cachePutVideo(id, blob) {
  const cache = await caches.open(VIDEO_CACHE);
  const url = `https://dronemove.local/video/${id}`;
  const response = new Response(blob, { headers: { "Content-Type": blob.type || "video/mp4" } });
  await cache.put(url, response);
}

async function cacheGetVideo(id) {
  const cache = await caches.open(VIDEO_CACHE);
  const resp = await cache.match(`https://dronemove.local/video/${id}`);
  return resp ? await resp.blob() : null;
}

async function cacheDeleteVideo(id) {
  const cache = await caches.open(VIDEO_CACHE);
  await cache.delete(`https://dronemove.local/video/${id}`);
}

async function cacheClearAll() {
  await caches.delete(VIDEO_CACHE);
}

// ---------- IndexedDB CRUD ----------

function idbGetAll() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(id) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(movement) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(movement);
    tx.oncomplete = () => resolve(movement);
    tx.onerror = () => reject(tx.error);
  });
}

function idbDelete(id) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbClear() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- MovementStore ----------

const MovementStore = {
  async getAll() {
    const mode = await detectStorageMode();
    if (mode === "idb") return idbGetAll();
    return lsLoad();
  },

  async getAllMetadata() {
    const all = await this.getAll();
    return all.map(m => {
      const { videoBlob, _videoBase64, ...meta } = m;
      return meta;
    });
  },

  async get(id) {
    const mode = await detectStorageMode();
    if (mode === "idb") return idbGet(id);
    const m = lsLoad().find(x => x.id === id) || null;
    if (m) m.videoBlob = await cacheGetVideo(id);
    return m;
  },

  async put(movement) {
    const mode = await detectStorageMode();

    if (mode === "idb") {
      return idbPut(movement);
    }

    // Cache API + localStorage
    const raw = lsLoad();
    const idx = raw.findIndex(x => x.id === movement.id);
    const meta = { ...movement };
    delete meta.videoBlob;

    if (movement.videoBlob instanceof Blob) {
      await cachePutVideo(movement.id, movement.videoBlob);
    }

    if (idx >= 0) raw[idx] = meta; else raw.push(meta);
    lsSave(raw);
    return movement;
  },

  async delete(id) {
    const mode = await detectStorageMode();
    if (mode === "idb") return idbDelete(id);
    lsSave(lsLoad().filter(x => x.id !== id));
    await cacheDeleteVideo(id);
  },

  async clearAll() {
    const mode = await detectStorageMode();
    if (mode === "idb") return idbClear();
    localStorage.removeItem(LS_KEY);
    await cacheClearAll();
  },

  async resetAll() {
    dbInstance = null;
    try { await new Promise((r, j) => { const r2 = indexedDB.deleteDatabase(DB_NAME); r2.onsuccess = r; r2.onerror = j; }); } catch {}
    localStorage.removeItem(LS_KEY);
    await cacheClearAll();
  },

  isMemoryMode() { return false; }
};

function uid() {
  return "m_" + crypto.randomUUID();
}
