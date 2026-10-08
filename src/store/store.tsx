import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { MODULES, PRACTICE_GOAL } from '../data/modules';
import {
  defaultState, loadState, saveState, todayKey,
  type AppState, type DiagnosticResult, type Note, type ThemePref,
} from '../services/storage';

type Action =
  | { type: 'settings'; patch: Partial<AppState['settings']> }
  | { type: 'visit'; module: string }
  | { type: 'labAction'; module: string }
  | { type: 'attempt'; category: string; level: number; correct: boolean; firstTry: boolean; title: string; module?: string; final: boolean }
  | { type: 'hint' }
  | { type: 'history'; category: string; level: number; title: string }
  | { type: 'diagnostic'; result: DiagnosticResult }
  | { type: 'noteAdd'; note: Note }
  | { type: 'noteUpdate'; id: string; patch: Partial<Note> }
  | { type: 'noteDelete'; id: string }
  | { type: 'calc'; expr: string; result: string; mode: 'DEG' | 'RAD' }
  | { type: 'calcClear' }
  | { type: 'reset' }
  | { type: 'replace'; state: AppState };

function touchStreak(s: AppState): AppState['streak'] {
  const today = todayKey();
  const st = s.streak;
  if (st.lastDay === today) return st;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const current = st.lastDay === todayKey(y) ? st.current + 1 : 1;
  return { current, best: Math.max(st.best, current), lastDay: today, days: [...st.days.slice(-59), today] };
}

const mod = (s: AppState, id: string) => s.modules[id] ?? { visited: false, practiceCorrect: 0, completed: false, labActions: 0 };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'settings':
      return { ...s, settings: { ...s.settings, ...a.patch } };
    case 'visit': {
      const m = mod(s, a.module);
      if (m.visited) return s;
      return { ...s, modules: { ...s.modules, [a.module]: { ...m, visited: true } } };
    }
    case 'labAction': {
      const m = mod(s, a.module);
      return { ...s, streak: touchStreak(s), modules: { ...s.modules, [a.module]: { ...m, visited: true, labActions: m.labActions + 1 } } };
    }
    case 'history':
      return { ...s, history: [...s.history, { id: Math.random().toString(36).slice(2), category: a.category, level: a.level, title: a.title, correct: false, firstTry: false, date: Date.now() }].slice(-80) };
    case 'hint':
      return { ...s, stats: { ...s.stats, hintsUsed: s.stats.hintsUsed + 1 } };
    case 'attempt': {
      const c = s.concepts[a.category] ?? { attempts: 0, correct: 0 };
      const lv = s.stats.byLevel[a.level] ?? { attempts: 0, correct: 0 };
      const gainedXp = a.correct ? a.level * 5 + (a.firstTry ? 5 : 0) : 0;
      let modules = s.modules;
      let bonus = 0;
      if (a.module && a.correct) {
        const m = mod(s, a.module);
        const practiceCorrect = m.practiceCorrect + 1;
        const completed = m.completed || practiceCorrect >= PRACTICE_GOAL;
        if (completed && !m.completed) bonus = 25;
        modules = { ...modules, [a.module]: { ...m, visited: true, practiceCorrect, completed } };
      }
      const history = a.final
        ? [...s.history, { id: Math.random().toString(36).slice(2), category: a.category, level: a.level, title: a.title, correct: a.correct, firstTry: a.firstTry, date: Date.now() }].slice(-80)
        : s.history;
      return {
        ...s,
        modules,
        history,
        streak: touchStreak(s),
        concepts: { ...s.concepts, [a.category]: { attempts: c.attempts + 1, correct: c.correct + (a.correct ? 1 : 0) } },
        stats: {
          ...s.stats,
          attempts: s.stats.attempts + 1,
          correct: s.stats.correct + (a.correct ? 1 : 0),
          solved: s.stats.solved + (a.correct ? 1 : 0),
          firstTry: s.stats.firstTry + (a.correct && a.firstTry ? 1 : 0),
          xp: s.stats.xp + gainedXp + bonus,
          byLevel: { ...s.stats.byLevel, [a.level]: { attempts: lv.attempts + 1, correct: lv.correct + (a.correct ? 1 : 0) } },
        },
      };
    }
    case 'diagnostic': {
      const m0 = mod(s, 'm0');
      const already = m0.completed;
      return {
        ...s,
        diagnostic: a.result,
        streak: touchStreak(s),
        modules: { ...s.modules, m0: { ...m0, visited: true, completed: true } },
        stats: { ...s.stats, xp: s.stats.xp + (already ? 0 : 25) },
      };
    }
    case 'noteAdd':
      return { ...s, notes: [a.note, ...s.notes] };
    case 'noteUpdate':
      return { ...s, notes: s.notes.map((n) => (n.id === a.id ? { ...n, ...a.patch, updated: Date.now() } : n)) };
    case 'noteDelete':
      return { ...s, notes: s.notes.filter((n) => n.id !== a.id) };
    case 'calc':
      return { ...s, calcHistory: [...s.calcHistory, { expr: a.expr, result: a.result, mode: a.mode }].slice(-30) };
    case 'calcClear':
      return { ...s, calcHistory: [] };
    case 'reset':
      return { ...defaultState(), settings: s.settings };
    case 'replace':
      return a.state;
  }
}

// ---------- Derivados ----------

export const LEVELS = [
  { xp: 0, name: 'Observador' },
  { xp: 60, name: 'Explorador' },
  { xp: 160, name: 'Experimentador' },
  { xp: 320, name: 'Analista' },
  { xp: 550, name: 'Investigador' },
  { xp: 850, name: 'Trigonómetra' },
  { xp: 1300, name: 'Arquitecto de triángulos' },
];

export function levelInfo(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  return { index: i + 1, name: cur.name, xp, next: next?.xp ?? null, progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 };
}

export function conceptStatus(t?: { attempts: number; correct: number }): 'nuevo' | 'dominado' | 'reforzar' | 'en progreso' {
  if (!t || t.attempts === 0) return 'nuevo';
  const acc = t.correct / t.attempts;
  if (t.correct >= 3 && acc >= 0.8) return 'dominado';
  if (t.attempts >= 2 && acc < 0.6) return 'reforzar';
  return 'en progreso';
}

/** Un módulo está desbloqueado si el anterior está completo, si el diagnóstico lo recomienda, o en modo libre. */
export function isUnlocked(s: AppState, id: string): boolean {
  if (s.settings.freeMode) return true;
  const idx = MODULES.findIndex((m) => m.id === id);
  if (idx <= 1) return true;
  const start = s.diagnostic ? MODULES.findIndex((m) => m.id === s.diagnostic!.startModule) : 1;
  if (idx <= start) return true;
  return !!s.modules[MODULES[idx - 1].id]?.completed || !!s.modules[id]?.visited;
}

// ---------- Contexto ----------

interface Store {
  state: AppState;
  dispatch: (a: Action) => void;
  setTheme: (t: ThemePref) => void;
  addNote: (n: Omit<Note, 'id' | 'created' | 'updated'>) => void;
  saved: boolean;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const savedRef = useRef(true);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(state);
  latest.current = state;

  // Guardado con debounce + guardado al cerrar/ocultar la pestaña
  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { savedRef.current = saveState(latest.current); }, 250);
  }, [state]);
  useEffect(() => {
    const flush = () => saveState(latest.current);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flush); };
  }, []);

  // Tema: "system" no fija atributo (manda prefers-color-scheme)
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', state.settings.theme);
  }, [state.settings.theme]);

  const setTheme = useCallback((theme: ThemePref) => dispatch({ type: 'settings', patch: { theme } }), []);
  const addNote = useCallback((n: Omit<Note, 'id' | 'created' | 'updated'>) => {
    const now = Date.now();
    dispatch({ type: 'noteAdd', note: { ...n, id: Math.random().toString(36).slice(2, 10), created: now, updated: now } });
  }, []);

  const value = useMemo(() => ({ state, dispatch, setTheme, addNote, saved: savedRef.current }), [state, setTheme, addNote]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fuera de StoreProvider');
  return s;
}
