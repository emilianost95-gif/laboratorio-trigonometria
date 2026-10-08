import { useEffect, useMemo, useRef, useState } from 'react';
import { CalcError, evaluate } from '../math/calculator';
import { useStore } from '../store/store';

const fmtResult = (v: number) => {
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
  const s = Math.abs(v) >= 1e9 || (Math.abs(v) < 1e-6 && v !== 0) ? v.toExponential(8) : String(+v.toPrecision(12));
  return s.replace('.', ',');
};

type Key = { label: string; ins?: string; act?: 'eval' | 'clear' | 'back' | 'mode'; tone?: 'fn' | 'op' | 'num' | 'eq' | 'util'; aria?: string };
const KEYS: Key[] = [
  { label: 'sin', ins: 'sin(', tone: 'fn' }, { label: 'cos', ins: 'cos(', tone: 'fn' }, { label: 'tan', ins: 'tan(', tone: 'fn' }, { label: 'MODE', act: 'mode', tone: 'util' }, { label: 'AC', act: 'clear', tone: 'util', aria: 'Borrar todo' },
  { label: 'sin⁻¹', ins: 'asin(', tone: 'fn', aria: 'arcoseno' }, { label: 'cos⁻¹', ins: 'acos(', tone: 'fn', aria: 'arcocoseno' }, { label: 'tan⁻¹', ins: 'atan(', tone: 'fn', aria: 'arcotangente' }, { label: '(', ins: '(', tone: 'op' }, { label: ')', ins: ')', tone: 'op' },
  { label: '√', ins: '√(', tone: 'fn', aria: 'raíz cuadrada' }, { label: 'x²', ins: '^2', tone: 'fn', aria: 'al cuadrado' }, { label: 'xʸ', ins: '^', tone: 'fn', aria: 'potencia' }, { label: 'π', ins: 'π', tone: 'fn', aria: 'pi' }, { label: '⌫', act: 'back', tone: 'util', aria: 'Borrar' },
  { label: '7', ins: '7', tone: 'num' }, { label: '8', ins: '8', tone: 'num' }, { label: '9', ins: '9', tone: 'num' }, { label: '÷', ins: '÷', tone: 'op', aria: 'dividir' }, { label: '×', ins: '×', tone: 'op', aria: 'multiplicar' },
  { label: '4', ins: '4', tone: 'num' }, { label: '5', ins: '5', tone: 'num' }, { label: '6', ins: '6', tone: 'num' }, { label: '−', ins: '−', tone: 'op', aria: 'restar' }, { label: '+', ins: '+', tone: 'op', aria: 'sumar' },
  { label: '1', ins: '1', tone: 'num' }, { label: '2', ins: '2', tone: 'num' }, { label: '3', ins: '3', tone: 'num' }, { label: 'Ans', ins: 'ans', tone: 'fn', aria: 'respuesta anterior' }, { label: '=', act: 'eval', tone: 'eq', aria: 'calcular' },
  { label: '0', ins: '0', tone: 'num' }, { label: ',', ins: ',', tone: 'num', aria: 'coma decimal' }, { label: 'e', ins: 'e', tone: 'fn' }, { label: 'ln', ins: 'ln(', tone: 'fn' }, { label: 'log', ins: 'log(', tone: 'fn' },
];

export function Calculator({ compact = false }: { compact?: boolean }) {
  const { state, dispatch } = useStore();
  const mode = state.settings.angleMode;
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<{ value?: number; error?: string } | null>(null);
  const [ans, setAns] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => {
    if (!expr.trim()) return null;
    try { return fmtResult(evaluate(autoClose(expr), { mode, ans })); } catch { return null; }
  }, [expr, mode, ans]);

  const run = () => {
    if (!expr.trim()) return;
    try {
      const v = evaluate(autoClose(expr), { mode, ans });
      setResult({ value: v });
      setAns(v);
      dispatch({ type: 'calc', expr: autoClose(expr), result: fmtResult(v), mode });
    } catch (e) {
      setResult({ error: e instanceof CalcError ? e.message : 'No se pudo calcular' });
    }
  };
  const press = (k: Key) => {
    if (k.act === 'eval') return run();
    if (k.act === 'clear') { setExpr(''); setResult(null); return; }
    if (k.act === 'back') { setExpr((e) => e.slice(0, -1)); return; }
    if (k.act === 'mode') { dispatch({ type: 'settings', patch: { angleMode: mode === 'DEG' ? 'RAD' : 'DEG' } }); return; }
    // Tras "=": un operador continúa desde Ans; cualquier otra tecla empieza una expresión nueva
    const ins = k.ins ?? '';
    if (result?.value !== undefined) setExpr(/^[+−×÷^]/.test(ins) ? `ans${ins}` : ins);
    else setExpr((e) => e + ins);
    setResult(null);
    if (!compact) inputRef.current?.focus();
  };
  useEffect(() => { setResult(null); }, [mode]);

  const tone: Record<string, string> = {
    fn: 'bg-panel2 text-ink', op: 'bg-panel2 text-accent', num: 'bg-panel text-ink border border-line', eq: 'bg-accent text-accentInk', util: 'bg-panel2 text-muted',
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-panel2/60 p-3">
        <div className="mb-1 flex items-center justify-between">
          <button type="button" onClick={() => press({ label: 'MODE', act: 'mode' })} className="num rounded-md border border-line bg-panel px-2 py-0.5 text-[12px] font-semibold" aria-label={`Modo angular: ${mode}. Pulsa para cambiar`}>
            <span className={mode === 'DEG' ? 'text-accent' : 'text-muted'}>DEG</span> / <span className={mode === 'RAD' ? 'text-accent' : 'text-muted'}>RAD</span>
          </button>
          <span className="num text-[11.5px] text-muted">Ans = {fmtResult(ans)}</span>
        </div>
        <input ref={inputRef} value={expr} onChange={(e) => { setExpr(e.target.value); setResult(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } }}
          aria-label="Expresión" placeholder="ej: 12·tan(35)" className="num w-full bg-transparent text-[20px] outline-none placeholder:text-muted/60" autoComplete="off" spellCheck={false} />
        <div className="num min-h-[30px] text-right text-[24px] font-semibold" aria-live="polite">
          {result?.error ? <span className="text-[14px] font-medium text-bad">{result.error}</span> : result?.value !== undefined ? <span className="text-accent">= {fmtResult(result.value)}</span> : preview ? <span className="text-muted">{preview}</span> : null}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {KEYS.map((k) => (
          <button key={k.label} type="button" aria-label={k.aria ?? k.label} onClick={() => press(k)}
            className={`num h-11 rounded-lg text-[15px] font-medium transition hover:brightness-95 active:scale-[0.97] ${tone[k.tone ?? 'num']}`}>
            {k.act === 'mode' ? mode : k.label}
          </button>
        ))}
      </div>
      {!compact && state.calcHistory.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between"><span className="eyebrow">Historial</span><button type="button" className="text-[12px] text-muted hover:text-bad" onClick={() => dispatch({ type: 'calcClear' })}>Borrar</button></div>
          <ul className="max-h-48 space-y-0.5 overflow-y-auto scroll-thin">
            {[...state.calcHistory].reverse().map((h, i) => (
              <li key={i}><button type="button" className="num flex w-full justify-between gap-2 rounded px-2 py-1 text-left text-[13px] hover:bg-panel2" onClick={() => { setExpr(h.expr); setResult(null); }}>
                <span className="truncate">{h.expr} <span className="text-[11px] text-muted">{h.mode}</span></span><span className="shrink-0 font-semibold">= {h.result}</span>
              </button></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Cierra paréntesis abiertos al final: "sin(30" → "sin(30)". */
function autoClose(e: string) {
  const open = (e.match(/\(/g) ?? []).length - (e.match(/\)/g) ?? []).length;
  return open > 0 ? e + ')'.repeat(open) : e;
}

/** Calculadora flotante accesible desde cualquier pantalla. */
export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen((o) => !o);
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('labtrig:calc', on);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('labtrig:calc', on); window.removeEventListener('keydown', key); };
  }, []);
  if (!open) return null;
  return (
    <div role="dialog" aria-label="Calculadora científica" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-panel shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[360px] sm:rounded-xl sm:border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="font-display text-[14px] font-semibold">Calculadora científica</span>
        <button type="button" aria-label="Cerrar calculadora" className="h-8 w-8 rounded-md hover:bg-panel2" onClick={() => setOpen(false)}>✕</button>
      </div>
      <div className="p-3"><Calculator compact /></div>
    </div>
  );
}
