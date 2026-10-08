/**
 * Persistencia local robusta.
 * - Un solo documento versionado en localStorage.
 * - Si el JSON está corrupto se guarda una copia de respaldo y se arranca con valores por defecto.
 * - Se fusiona con los valores por defecto (campos nuevos en futuras versiones no rompen datos viejos).
 * - Todas las lecturas/escrituras van en try/catch (modo privado, cuota llena, almacenamiento bloqueado).
 */

export const STORAGE_KEY = 'labtrig:state';
export const SCHEMA_VERSION = 1;

export type ThemePref = 'system' | 'light' | 'dark';
export type NoteKind = 'nota' | 'resultado' | 'formula' | 'ejercicio' | 'descubrimiento';

export interface Note {
  id: string;
  kind: NoteKind;
  title: string;
  body: string; // admite $TeX$
  module?: string;
  created: number;
  updated: number;
  pinned?: boolean;
}

export interface Tally { attempts: number; correct: number }

export interface DiagnosticResult {
  date: number;
  score: number;
  total: number;
  byArea: Record<string, Tally>;
  level: string;
  startModule: string;
}

export interface ModuleProgress { visited: boolean; practiceCorrect: number; completed: boolean; labActions: number }

export interface HistoryItem { id: string; category: string; level: number; title: string; correct: boolean; firstTry: boolean; date: number }

export interface AppState {
  version: number;
  settings: { theme: ThemePref; angleMode: 'DEG' | 'RAD'; freeMode: boolean; showTips: boolean };
  diagnostic: DiagnosticResult | null;
  modules: Record<string, ModuleProgress>;
  concepts: Record<string, Tally>;
  stats: { attempts: number; correct: number; solved: number; firstTry: number; hintsUsed: number; xp: number; byLevel: Record<string, Tally> };
  streak: { current: number; best: number; lastDay: string | null; days: string[] };
  history: HistoryItem[];
  notes: Note[];
  calcHistory: { expr: string; result: string; mode: 'DEG' | 'RAD' }[];
}

export function defaultState(): AppState {
  return {
    version: SCHEMA_VERSION,
    settings: { theme: 'system', angleMode: 'DEG', freeMode: false, showTips: true },
    diagnostic: null,
    modules: {},
    concepts: {},
    stats: { attempts: 0, correct: 0, solved: 0, firstTry: 0, hintsUsed: 0, xp: 0, byLevel: {} },
    streak: { current: 0, best: 0, lastDay: null, days: [] },
    history: [],
    notes: [],
    calcHistory: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Fusión profunda: conserva lo guardado y completa lo que falte con los valores por defecto. */
function merge<T>(def: T, saved: unknown): T {
  if (Array.isArray(def)) return (Array.isArray(saved) ? saved : def) as T;
  if (isObj(def)) {
    if (!isObj(saved)) return def;
    const out: Record<string, unknown> = { ...saved };
    for (const k of Object.keys(def)) out[k] = merge((def as Record<string, unknown>)[k], saved[k]);
    return out as T;
  }
  if (def === null) return (saved ?? null) as T;
  return (typeof saved === typeof def ? saved : def) as T;
}

/** Migraciones entre versiones del esquema (preparado para V2). */
function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  const v = typeof raw.version === 'number' ? raw.version : 0;
  if (v < 1) {
    // v0 (inexistente) → v1: nada que transformar, solo marcar versión
    raw.version = 1;
  }
  return raw;
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function loadState(): AppState {
  const txt = safeGet(STORAGE_KEY);
  if (!txt) return defaultState();
  try {
    const parsed = JSON.parse(txt);
    if (!isObj(parsed)) throw new Error('formato inválido');
    const st = merge(defaultState(), migrate(parsed));
    st.version = SCHEMA_VERSION;
    return st;
  } catch {
    safeSet(`${STORAGE_KEY}:backup-${Date.now()}`, txt);
    return defaultState();
  }
}

export function saveState(state: AppState): boolean {
  const txt = JSON.stringify(state);
  if (safeSet(STORAGE_KEY, txt)) return true;
  // Cuota llena: recortar lo prescindible y reintentar
  const slim: AppState = { ...state, history: state.history.slice(-20), calcHistory: state.calcHistory.slice(-10) };
  return safeSet(STORAGE_KEY, JSON.stringify(slim));
}

export function storageAvailable(): boolean {
  try {
    const k = '__labtrig_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/** Exportar / importar (para copiar el progreso a otro navegador). */
export function exportState(state: AppState): string {
  return JSON.stringify(state);
}
export function importState(txt: string): AppState | null {
  try {
    const parsed = JSON.parse(txt);
    if (!isObj(parsed) || !('settings' in parsed)) return null;
    return merge(defaultState(), migrate(parsed));
  } catch {
    return null;
  }
}

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
