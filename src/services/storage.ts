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

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const count = (v: unknown) => Math.max(0, Math.floor(num(v)));
const str = (v: unknown, max: number, d = '') => (typeof v === 'string' ? v.slice(0, max) : d);
const NOTE_KINDS: NoteKind[] = ['nota', 'resultado', 'formula', 'ejercicio', 'descubrimiento'];

function tallies(v: unknown): Record<string, Tally> {
  const out: Record<string, Tally> = {};
  if (!isObj(v)) return out;
  for (const [k, t] of Object.entries(v)) {
    if (!isObj(t)) continue;
    const attempts = count(t.attempts);
    out[k] = { attempts, correct: Math.min(attempts, count(t.correct)) };
  }
  return out;
}

/**
 * Valida la FORMA de cada registro (la fusión solo mira el primer nivel de tipos).
 * Un respaldo editado a mano o dañado no debe dejar páginas rotas de forma permanente.
 */
export function sanitize(st: AppState): AppState {
  const d = defaultState();
  const modules: AppState['modules'] = {};
  for (const [k, m] of Object.entries(st.modules)) {
    if (isObj(m)) modules[k] = { visited: !!m.visited, practiceCorrect: count(m.practiceCorrect), completed: !!m.completed, labActions: count(m.labActions) };
  }
  const dg = st.diagnostic as unknown;
  const diagnostic = isObj(dg) && typeof dg.startModule === 'string'
    ? { date: num(dg.date), score: count(dg.score), total: count(dg.total), byArea: tallies(dg.byArea), level: str(dg.level, 80), startModule: dg.startModule.slice(0, 8) }
    : null;
  return {
    version: SCHEMA_VERSION,
    settings: {
      theme: (['system', 'light', 'dark'] as const).includes(st.settings.theme) ? st.settings.theme : d.settings.theme,
      angleMode: st.settings.angleMode === 'RAD' ? 'RAD' : 'DEG',
      freeMode: !!st.settings.freeMode,
      showTips: !!st.settings.showTips,
    },
    diagnostic,
    modules,
    concepts: tallies(st.concepts),
    stats: {
      attempts: count(st.stats.attempts), correct: count(st.stats.correct), solved: count(st.stats.solved),
      firstTry: count(st.stats.firstTry), hintsUsed: count(st.stats.hintsUsed), xp: count(st.stats.xp), byLevel: tallies(st.stats.byLevel),
    },
    streak: {
      current: count(st.streak.current), best: count(st.streak.best),
      lastDay: typeof st.streak.lastDay === 'string' ? st.streak.lastDay.slice(0, 10) : null,
      days: (Array.isArray(st.streak.days) ? st.streak.days : []).filter((x): x is string => typeof x === 'string').slice(-60),
    },
    history: (st.history as unknown[]).filter(isObj).slice(-80).map((h) => ({
      id: str(h.id, 24) || Math.random().toString(36).slice(2), category: str(h.category, 24), level: count(h.level),
      title: str(h.title, 200), correct: !!h.correct, firstTry: !!h.firstTry, date: num(h.date),
    })),
    notes: (st.notes as unknown[]).filter(isObj).slice(0, 500).map((n) => ({
      id: str(n.id, 24) || Math.random().toString(36).slice(2, 10),
      kind: NOTE_KINDS.includes(n.kind as NoteKind) ? (n.kind as NoteKind) : 'nota',
      title: str(n.title, 200, 'Sin título'), body: str(n.body, 20_000),
      module: typeof n.module === 'string' ? n.module.slice(0, 8) : undefined,
      created: num(n.created), updated: num(n.updated), pinned: !!n.pinned,
    })),
    calcHistory: (st.calcHistory as unknown[]).filter(isObj).slice(-30).map((c) => ({ expr: str(c.expr, 200), result: str(c.result, 60), mode: c.mode === 'RAD' ? 'RAD' as const : 'DEG' as const })),
  };
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
    return sanitize(merge(defaultState(), migrate(parsed)));
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
  if (txt.length > 2_000_000) return null;
  try {
    const parsed = JSON.parse(txt);
    if (!isObj(parsed) || !('settings' in parsed)) return null;
    return sanitize(merge(defaultState(), migrate(parsed)));
  } catch {
    return null;
  }
}

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
