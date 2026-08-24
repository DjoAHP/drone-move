/* db.js — accès IndexedDB pour DroneMove (avec fallback mémoire) */

const DB_NAME = "dronemove-db";
const DB_VERSION = 1;
const STORE = "movements";

let dbPromise = null;
let useMemoryFallback = false;
let memoryStore = new Map();

function openDB() {
  if (useMemoryFallback) return Promise.reject(new Error("memory-only"));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
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
  return dbPromise;
}

async function resetDB() {
  dbPromise = null;
  return new Promise((resolve, reject) => {
    const del = indexedDB.deleteDatabase(DB_NAME);
    del.onsuccess = () => setTimeout(resolve, 200); // attendre propagation
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
      dbPromise = null;
      return await openDB();
    } catch (err2) {
      console.warn("Reset failed, falling back to memory:", err2);
      useMemoryFallback = true;
      return null;
    }
  }
}

function memGetAll() { return [...memoryStore.values()]; }
function memGet(id) { return memoryStore.get(id) || null; }
function memPut(m) { memoryStore.set(m.id, m); return m; }
function memDelete(id) { memoryStore.delete(id); }
function memClear() { memoryStore.clear(); }

const MovementStore = {
  async getAll() {
    const db = await openDBWithRetry();
    if (!db) return memGetAll();
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
      const { videoBlob, ...meta } = m;
      return meta;
    });
  },

  async get(id) {
    const db = await openDBWithRetry();
    if (!db) return memGet(id);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async put(movement) {
    const db = await openDBWithRetry();
    if (!db) return memPut(movement);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(movement);
      tx.oncomplete = () => resolve(movement);
      tx.onerror = () => reject(tx.error);
    });
  },

  async delete(id) {
    const db = await openDBWithRetry();
    if (!db) { memDelete(id); return; }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async clearAll() {
    const db = await openDBWithRetry();
    if (!db) { memClear(); return; }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async resetAll() {
    await resetDB();
    dbPromise = null;
  },

  isMemoryMode() { return useMemoryFallback; }
};

function uid() {
  return "m_" + crypto.randomUUID();
}
