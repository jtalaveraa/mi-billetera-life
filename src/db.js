/**
 * Persistencia local de los gastos.
 *
 * Motor principal: IndexedDB (nivel avanzado del enunciado).
 * Respaldo automático: localStorage, por si el navegador bloquea IndexedDB
 * (modo privado de algunos navegadores, almacenamiento deshabilitado, etc.).
 *
 * Nada sale del dispositivo: no hay llamadas de red, por eso la app opera
 * exactamente igual en modo avión.
 */

const DB_NAME = 'mi-billetera-lite';
const DB_VERSION = 1;
const STORE_NAME = 'gastos';
const LS_KEY = 'mi-billetera-lite:gastos';

let dbPromise = null;
let engine = 'indexeddb'; // se degrada a 'localstorage' si IndexedDB falla

export function getStorageEngine() {
  return engine;
}

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined' || indexedDB === null) {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('categoria', 'categoria', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB bloqueada'));
  }).catch((error) => {
    console.warn('[DB] IndexedDB no disponible, se usará localStorage.', error);
    engine = 'localstorage';
    dbPromise = null;
    throw error;
  });

  return dbPromise;
}

function transaction(mode, run) {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        let result;
        try {
          result = run(store);
        } catch (error) {
          reject(error);
          return;
        }
        tx.oncomplete = () => resolve(result && result.__req ? result.__req.result : result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

/* --------------------------- respaldo localStorage ------------------------ */
function lsRead() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

function lsWrite(items) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('[DB] No se pudo escribir en localStorage:', error);
  }
}

/* --------------------------------- API ----------------------------------- */
const ordenarRecienteAPrimero = (items) =>
  [...items].sort((a, b) => b.createdAt - a.createdAt);

/** Devuelve todos los gastos, del más reciente al más antiguo. */
export async function getGastos() {
  try {
    const items = await transaction('readonly', (store) => {
      const req = store.getAll();
      return { __req: req };
    });
    return ordenarRecienteAPrimero(items || []);
  } catch {
    return ordenarRecienteAPrimero(lsRead());
  }
}

/** Guarda un gasto nuevo y lo devuelve ya normalizado. */
export async function addGasto({ concepto, monto, categoria }) {
  const gasto = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    concepto: String(concepto).trim(),
    monto: Number(monto),
    categoria,
    createdAt: Date.now(),
  };

  try {
    await transaction('readwrite', (store) => store.add(gasto));
  } catch {
    lsWrite([...lsRead(), gasto]);
  }
  return gasto;
}
