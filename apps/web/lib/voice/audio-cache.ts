/**
 * @module lib/voice/audio-cache
 *
 * Client-side audio cache for AI-generated TTS audio.
 *
 * Uses IndexedDB to persist audio blobs across page reloads. The same
 * question text never generates a second API call — the cached blob is
 * replayed directly via the Audio API.
 *
 * Cache key: SHA-like hash of (text + voiceId). Max 200 entries, LRU eviction.
 * This keeps storage bounded at ~20MB (200 × ~100KB per audio clip).
 *
 * Falls back to a simple in-memory Map if IndexedDB is unavailable.
 */

const DB_NAME    = "mathai-audio-cache";
const STORE_NAME = "audio";
const DB_VERSION = 1;
const MAX_ENTRIES = 200;

// ─── Simple hash for cache keys ─────────────────────────────────────────────

export function audioCacheKey(text: string, voiceId: string): string {
  // Simple djb2 hash — not cryptographic, just unique enough for cache keys
  let hash = 5381;
  const input = `${voiceId}::${text}`;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
  }
  return `tts_${hash.toString(36)}`;
}

// ─── IndexedDB helpers ──────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Check if a cached audio blob exists for this key. */
export async function hasCachedAudio(key: string): Promise<boolean> {
  if (!isIDBAvailable()) return memoryCache.has(key);
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx    = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req   = store.get(key);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror   = () => resolve(false);
    });
  } catch {
    return memoryCache.has(key);
  }
}

/** Retrieve a cached audio blob. Returns null if not found. */
export async function getCachedAudio(key: string): Promise<Blob | null> {
  if (!isIDBAvailable()) return memoryCache.get(key) ?? null;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx    = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req   = store.get(key);
      req.onsuccess = () => {
        const result = req.result as { key: string; blob: Blob; ts: number } | undefined;
        resolve(result?.blob ?? null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return memoryCache.get(key) ?? null;
  }
}

/** Store an audio blob in the cache. Evicts oldest entries if at capacity. */
export async function setCachedAudio(key: string, blob: Blob): Promise<void> {
  if (!isIDBAvailable()) {
    if (memoryCache.size >= MAX_ENTRIES) {
      const oldest = memoryCache.keys().next().value;
      if (oldest !== undefined) memoryCache.delete(oldest);
    }
    memoryCache.set(key, blob);
    return;
  }

  try {
    const db = await openDB();

    // Check count and evict if needed
    const count = await new Promise<number>((resolve) => {
      const tx    = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req   = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => resolve(0);
    });

    if (count >= MAX_ENTRIES) {
      // Delete the oldest entry (lowest timestamp)
      await new Promise<void>((resolve) => {
        const tx    = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const cursor = store.openCursor();
        cursor.onsuccess = () => {
          if (cursor.result) cursor.result.delete();
          resolve();
        };
        cursor.onerror = () => resolve();
      });
    }

    // Store
    await new Promise<void>((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req   = store.put({ key, blob, ts: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  } catch {
    // Fallback to memory
    memoryCache.set(key, blob);
  }
}

// ─── Fallback memory cache ──────────────────────────────────────────────────

const memoryCache = new Map<string, Blob>();

function isIDBAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!window.indexedDB;
  } catch {
    return false;
  }
}
