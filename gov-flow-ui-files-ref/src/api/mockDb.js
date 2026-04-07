import { createMockDbSeed } from "./mockSeed";

const STORAGE_KEY = "govflow_mock_db_v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function deepClone(value) {
  // Avoid structuredClone for older environments; good enough for JSON data.
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function uuidLike() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function normalizeSort(sort) {
  if (!sort) return null;
  if (typeof sort !== "string") return null;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  if (!field) return null;
  return { field, desc };
}

function getField(obj, field) {
  return obj?.[field];
}

function compareValues(a, b) {
  if (a === b) return 0;
  if (a === undefined || a === null) return 1;
  if (b === undefined || b === null) return -1;
  // Dates stored as ISO strings sort correctly lexicographically.
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function matchesWhere(item, where) {
  if (!where) return true;
  for (const [k, v] of Object.entries(where)) {
    if (v === undefined || v === null || v === "") continue;
    const actual = item?.[k];
    if (Array.isArray(v)) {
      if (!v.includes(actual)) return false;
      continue;
    }
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      if (actual !== v) return false;
      continue;
    }
    // Fallback: deep-ish compare
    if (JSON.stringify(actual) !== JSON.stringify(v)) return false;
  }
  return true;
}

export function resetMockDb() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function loadMockDb() {
  if (typeof window === "undefined") {
    return createMockDbSeed();
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParse(raw) : null;
  if (parsed?.entities) return parsed;
  const seed = createMockDbSeed();
  saveMockDb(seed);
  return seed;
}

export function saveMockDb(db) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function ensureCollection(db, entityName) {
  if (!db.entities) db.entities = {};
  if (!Array.isArray(db.entities[entityName])) db.entities[entityName] = [];
  return db.entities[entityName];
}

export function entityApi(entityName) {
  return {
    list: async (sort, limit) => {
      const db = loadMockDb();
      const col = ensureCollection(db, entityName);
      let items = [...col];
      const s = normalizeSort(sort);
      if (s) {
        items.sort((x, y) => {
          const cmp = compareValues(getField(x, s.field), getField(y, s.field));
          return s.desc ? -cmp : cmp;
        });
      }
      if (limit) items = items.slice(0, limit);
      return deepClone(items);
    },

    filter: async (where = {}, sort, limit) => {
      const db = loadMockDb();
      const col = ensureCollection(db, entityName);
      let items = col.filter((it) => matchesWhere(it, where));
      const s = normalizeSort(sort);
      if (s) {
        items.sort((x, y) => {
          const cmp = compareValues(getField(x, s.field), getField(y, s.field));
          return s.desc ? -cmp : cmp;
        });
      }
      if (limit) items = items.slice(0, limit);
      return deepClone(items);
    },

    get: async (id) => {
      const db = loadMockDb();
      const col = ensureCollection(db, entityName);
      const found = col.find((it) => it.id === id) || null;
      return deepClone(found);
    },

    create: async (data) => {
      const db = loadMockDb();
      const col = ensureCollection(db, entityName);
      const now = new Date().toISOString();
      const record = {
        id: data?.id || `${entityName.toLowerCase()}_${uuidLike()}`,
        created_date: data?.created_date || now,
        updated_date: data?.updated_date || now,
        ...deepClone(data),
      };
      col.push(record);
      saveMockDb(db);
      return deepClone(record);
    },

    bulkCreate: async (items) => {
      const created = [];
      for (const item of items || []) {
        created.push(await entityApi(entityName).create(item));
      }
      return created;
    },

    update: async (id, patch) => {
      const db = loadMockDb();
      const col = ensureCollection(db, entityName);
      const idx = col.findIndex((it) => it.id === id);
      if (idx === -1) {
        // Match Base44-ish ergonomics: create-on-update is NOT desired; throw.
        const err = new Error(`${entityName}.update: record not found (${id})`);
        err.status = 404;
        throw err;
      }
      const now = new Date().toISOString();
      col[idx] = { ...col[idx], ...deepClone(patch), updated_date: now };
      saveMockDb(db);
      return deepClone(col[idx]);
    },

    delete: async (id) => {
      const db = loadMockDb();
      const col = ensureCollection(db, entityName);
      const idx = col.findIndex((it) => it.id === id);
      if (idx === -1) return { success: true };
      col.splice(idx, 1);
      saveMockDb(db);
      return { success: true };
    },
  };
}

