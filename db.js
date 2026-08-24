/* db.js — accès IndexedDB pour DroneMove (avec fallback localStorage) */

const DB_NAME = "dronemove-db";
const DB_VERSION = 1;
const STORE = "movements";
const LS_KEY = "dronemove-data";

let dbInstance = null;
let useMemoryFallback = false;

// ---------- IndexedDB ----------

function openDB() {
  if (useMemoryFallback) return Promise.reject(new Error("memory-only"));
  if (dbInstance) return Promise.resolve(dbInstance);

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
    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };
    req.onerror = () => reject(req.error);
  });
}

async function resetDB() {
  dbInstance = null;
  return new Promise((resolve, reject) => {
    const del = indexedDB.deleteDatabase(DB_NAME);
    del.onsuccess = () => setTimeout(resolve, 300);
    del.onerror = () => reject(del.error);
  });
}

async function openDBWithRetry() {
  try {
    return await openDB();
  } catch (err) {
    console.warn("IndexedDB open failed, resetting:", err);
    try {
      await resetDB();
      return await openDB();
    } catch (err2) {
      console.warn("Reset failed, falling back to localStorage:", err2);
      useMemoryFallback = true;
      return null;
    }
  }
}

// ---------- localStorage helpers ----------

function lsLoad() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function lsSave(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); }
  catch (e) { console.error("localStorage save failed:", e); }
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function base64ToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

// ---------- MovementStore ----------

const MovementStore = {
  async getAll() {
    const db = await openDBWithRetry();
    if (!db) return lsLoad();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async getAllMetadata() {
    const all = await this.getAll();
    return all.map(m => {
      const { videoBlob, _videoBase64, ...meta } = m;
      return meta;
    });
  },

  async get(id) {
    const db = await openDBWithRetry();
    if (!db) {
      const m = lsLoad().find(x => x.id === id) || null;
      if (m && m._videoBase64) m.videoBlob = await base64ToBlob(m._videoBase64);
      return m;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async put(movement) {
    const db = await openDBWithRetry();
    if (!db) {
      const raw = lsLoad();
      const idx = raw.findIndex(x => x.id === movement.id);
      const entry = { ...movement };
      if (movement.videoBlob instanceof Blob) {
        entry._videoBase64 = await blobToBase64(movement.videoBlob);
      } else if (idx >= 0 && raw[idx]._videoBase64) {
        entry._videoBase64 = raw[idx]._videoBase64;
      }
      delete entry.videoBlob;
      if (idx >= 0) raw[idx] = entry; else raw.push(entry);
      lsSave(raw);
      return movement;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(movement);
      tx.oncomplete = () => resolve(movement);
      tx.onerror = () => reject(tx.error);
    });
  },

  async delete(id) {
    const db = await openDBWithRetry();
    if (!db) { lsSave(lsLoad().filter(x => x.id !== id)); return; }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async clearAll() {
    const db = await openDBWithRetry();
    if (!db) { localStorage.removeItem(LS_KEY); return; }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async resetAll() {
    await resetDB();
  },

  isMemoryMode() { return useMemoryFallback; }
};

function uid() {
  return "m_" + crypto.randomUUID();
}
