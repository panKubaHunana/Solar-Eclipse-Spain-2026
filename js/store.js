// =====================================================================
//  Store — datová vrstva
//  --------------------------------------------------------------------
//  • Lokální úložiště (IndexedDB) funguje vždy a offline.
//  • Když je v config.js vyplněný Supabase, data se navíc synchronizují
//    mezi telefony (společný deník). Lokální kopie slouží jako offline
//    cache.
//  API:
//    Store.ready                     -> Promise
//    Store.getDoc(name)              -> objekt (singleton formuláře)
//    Store.setDoc(name, obj)
//    Store.list(collection)          -> pole položek (seřazeno dle ts)
//    Store.add(collection, item)     -> uložená položka (s id, ts)
//    Store.update(collection, id, p)
//    Store.remove(collection, id)
//    Store.onChange(cb)              -> volá se po každé změně
//    Store.isShared()                -> true když běží Supabase sync
// =====================================================================

(function () {
  const DB_NAME = "eclipse-db";
  const DB_VER = 1;
  let db = null;
  const listeners = new Set();
  const cfg = window.ECLIPSE_CONFIG || {};

  // ---- IndexedDB helpers -------------------------------------------
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains("docs")) d.createObjectStore("docs");
        if (!d.objectStoreNames.contains("items")) {
          const s = d.createObjectStore("items", { keyPath: "_key" });
          s.createIndex("collection", "collection", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function tx(store, mode) {
    return db.transaction(store, mode).objectStore(store);
  }
  function reqP(r) {
    return new Promise((res, rej) => {
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }

  async function localGetDoc(name) {
    return (await reqP(tx("docs", "readonly").get(name))) || null;
  }
  async function localSetDoc(name, obj) {
    await reqP(tx("docs", "readwrite").put(obj, name));
  }
  async function localList(collection) {
    const idx = tx("items", "readonly").index("collection");
    const out = await reqP(idx.getAll(collection));
    return out
      .map((r) => r.value)
      .sort((a, b) => (a.ts || 0) - (b.ts || 0));
  }
  async function localPut(collection, item) {
    await reqP(
      tx("items", "readwrite").put({
        _key: collection + ":" + item.id,
        collection,
        value: item
      })
    );
  }
  async function localDelete(collection, id) {
    await reqP(tx("items", "readwrite").delete(collection + ":" + id));
  }

  // ---- Supabase (volitelné) ----------------------------------------
  let sb = null;
  const supaConfigured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);

  async function initSupabase() {
    if (!supaConfigured) return;
    try {
      const mod = await import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
      );
      sb = mod.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      // Realtime: po vzdálené změně přenačti a informuj UI.
      sb.channel("eclipse-sync")
        .on("postgres_changes", { event: "*", schema: "public", table: "items" }, notify)
        .on("postgres_changes", { event: "*", schema: "public", table: "docs" }, notify)
        .subscribe();
    } catch (e) {
      console.warn("Supabase se nepodařilo načíst, pokračuji offline:", e);
      sb = null;
    }
  }

  function notify() {
    listeners.forEach((cb) => {
      try { cb(); } catch (_) {}
    });
  }

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ---- Veřejné API --------------------------------------------------
  const Store = {
    ready: null,

    isShared() {
      return !!sb;
    },

    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    async getDoc(name) {
      let local = await localGetDoc(name);
      if (sb) {
        try {
          const { data } = await sb.from("docs").select("data").eq("name", name).maybeSingle();
          if (data && data.data) {
            local = data.data;
            await localSetDoc(name, local);
          }
        } catch (_) {}
      }
      return local || {};
    },

    async setDoc(name, obj) {
      await localSetDoc(name, obj);
      if (sb) {
        try {
          await sb.from("docs").upsert({ name, data: obj });
        } catch (e) { console.warn(e); }
      }
    },

    async list(collection) {
      if (sb) {
        try {
          const { data } = await sb
            .from("items")
            .select("*")
            .eq("collection", collection)
            .order("ts", { ascending: true });
          if (data) {
            // aktualizuj lokální cache
            for (const row of data) await localPut(collection, row.value);
            return data.map((r) => r.value);
          }
        } catch (_) {}
      }
      return localList(collection);
    },

    async add(collection, item) {
      const rec = Object.assign({ id: uid(), ts: Date.now() }, item);
      await localPut(collection, rec);
      if (sb) {
        try {
          await sb.from("items").insert({
            _key: collection + ":" + rec.id,
            collection,
            ts: rec.ts,
            value: rec
          });
        } catch (e) { console.warn(e); }
      }
      return rec;
    },

    async update(collection, id, patch) {
      const list = await localList(collection);
      const cur = list.find((x) => x.id === id) || { id };
      const rec = Object.assign({}, cur, patch);
      await localPut(collection, rec);
      if (sb) {
        try {
          await sb.from("items").update({ value: rec }).eq("_key", collection + ":" + id);
        } catch (e) { console.warn(e); }
      }
      return rec;
    },

    async remove(collection, id) {
      await localDelete(collection, id);
      if (sb) {
        try {
          await sb.from("items").delete().eq("_key", collection + ":" + id);
        } catch (e) { console.warn(e); }
      }
    }
  };

  Store.ready = (async () => {
    db = await openDB();
    await initSupabase();
  })();

  window.Store = Store;
})();
