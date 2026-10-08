import { useEffect, useRef, useState } from 'react';
import { checkAnswer } from '../modules/checker';
import { CATEGORY_NAMES, LEVEL_NAMES, type CheckResult, type Problem } from '../modules/types';
import { useStore } from '../store/store';
import { fmt } from '../math/core';
import { MiniFigure } from '../visualizations/MiniFigure';
import { RichText } from './Tex';
import { Badge, Button } from './ui';
import { toast } from '../utils/toast';

/**
 * Un ejercicio completo: enunciado, datos, respuesta, pistas graduales,
 * diagnóstico del error, solución paso a paso y guardado en el cuaderno.
 * Regla pedagógica: tras un error se ofrece primero una PISTA; la solución completa queda a un clic, nunca se impone.
 */
export function ProblemCard({ problem, module, onDone, onNext }: { problem: Problem; module?: string; onDone?: (correct: boolean) => void; onNext?: () => void }) {
  const { dispatch, addNote } = useStore();
  const [input, setInput] = useState('');
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [wrongChoices, setWrongChoices] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput(''); setTries(0); setHints(0); setResult(null); setSolved(false); setRevealed(false); setWrongChoices([]);
  }, [problem.id]);

  const finished = solved || revealed;
  const concept = problem.concept ?? problem.category;

  const submit = (raw: string | number) => {
    if (finished) return;
    const r = checkAnswer(problem, raw);
    if (r.parseError) { setResult(r); return; }
    setResult(r);
    const firstTry = tries === 0;
    setTries((t) => t + 1);
    dispatch({ type: 'attempt', category: concept, level: problem.level, correct: r.correct, firstTry, title: problem.title, module, final: r.correct });
    if (r.correct) {
      setSolved(true);
      onDone?.(true);
    } else {
      if (problem.kind === 'choice') setWrongChoices((w) => [...w, Number(raw)]);
      // Pista antes de la solución
      setHints((h) => Math.min(problem.hints.length, Math.max(h, Math.min(tries + 1, problem.hints.length))));
    }
  };

  const reveal = () => {
    setRevealed(true);
    if (!solved) { dispatch({ type: 'history', category: concept, level: problem.level, title: problem.title }); onDone?.(false); }
  };

  const showHint = () => { setHints((h) => Math.min(problem.hints.length, h + 1)); dispatch({ type: 'hint' }); };

  const save = () => {
    const body = [problem.statement, '', ...problem.steps.map((s, i) => `${i + 1}. ${s}`), '', `Respuesta: ${problem.kind === 'choice' ? problem.choices![problem.answer] : fmt(problem.answer, 3) + (problem.unit ? ` ${problem.unit}` : '')}`].join('\n');
    addNote({ kind: 'ejercicio', title: problem.title, body, module });
    toast('Ejercicio guardado en el cuaderno');
  };

  return (
    <article className="fade-up rounded-xl border border-line bg-panel" aria-live="polite">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <Badge tone="accent">{CATEGORY_NAMES[problem.category]}</Badge>
        <Badge>Nivel {problem.level} · {LEVEL_NAMES[problem.level]}</Badge>
        <h3 className="ml-auto text-[14px] font-semibold">{problem.title}</h3>
      </header>

      <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-3">
          <p className="text-[15.5px] leading-relaxed"><RichText text={problem.statement} /></p>
          {problem.data.length > 0 && (
            <div className="rounded-lg bg-panel2/70 px-3 py-2">
              <div className="eyebrow mb-1">Datos</div>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
                {problem.data.map((d, i) => <li key={i}><RichText text={d} /></li>)}
              </ul>
            </div>
          )}
        </div>
        {problem.figure && <div className="md:w-[300px]"><MiniFigure fig={problem.figure} /></div>}
      </div>

      <div className="space-y-3 border-t border-line px-4 py-3">
        {problem.kind === 'choice' ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {problem.choices!.map((c, i) => {
              const isWrong = wrongChoices.includes(i);
              const isRight = finished && i === problem.answer;
              return (
                <button key={i} type="button" disabled={finished || isWrong} onClick={() => submit(i)}
                  className={`min-h-[44px] rounded-lg border px-3 py-2 text-left text-[14.5px] transition-colors ${isRight ? 'border-ok bg-ok/10' : isWrong ? 'border-bad/40 bg-bad/5 opacity-60 line-through' : 'border-line bg-panel hover:border-accent'}`}>
                  <span className="num mr-2 text-[12px] text-muted">{String.fromCharCode(65 + i)}</span>
                  <RichText text={c} />
                </button>
              );
            })}
          </div>
        ) : (
          <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); submit(input); }}>
            <label htmlFor={`ans-${problem.id}`} className="sr-only">Tu respuesta</label>
            <input id={`ans-${problem.id}`} ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} disabled={finished}
              placeholder="Tu respuesta" inputMode="text" autoComplete="off"
              className="num h-11 w-44 rounded-lg border border-line bg-panel2 px-3 text-[16px] disabled:opacity-60" />
            {problem.unit && <span className="num text-muted">{problem.unit}</span>}
            <Button type="submit" variant="primary" disabled={finished || !input.trim()}>Comprobar</Button>
            <div className="flex gap-1">
              {['√', 'π', '/', '^'].map((s) => (
                <button key={s} type="button" disabled={finished} onClick={() => { setInput((v) => v + s); inputRef.current?.focus(); }}
                  className="num h-9 w-9 rounded-md border border-line text-[14px] text-muted hover:text-ink">{s}</button>
              ))}
            </div>
            {problem.answerHint && <p className="w-full text-[12.5px] text-muted">{problem.answerHint}</p>}
          </form>
        )}

        {result?.parseError && <p className="text-[13.5px] text-warn">{result.parseError}</p>}

        {/* Retroalimentación */}
        {solved && (
          <div className="fade-up rounded-lg border border-ok/40 bg-ok/10 px-3.5 py-2.5">
            <div className="font-semibold text-ok">{tries <= 1 ? '¡Correcto a la primera!' : '¡Correcto!'}</div>
            <div className="text-[14px]">Respuesta: <span className="num font-semibold">{problem.kind === 'choice' ? <RichText text={problem.choices![problem.answer]} /> : `${fmt(problem.answer, 3)}${problem.unit ? ' ' + problem.unit : ''}`}</span>
              {problem.kind === 'numeric' && result?.parsed !== null && result?.parsed !== undefined && Math.abs(result.parsed - problem.answer) > 1e-9 && <span className="text-muted"> (tu valor {fmt(result.parsed, 4)} está dentro del margen de redondeo)</span>}
            </div>
          </div>
        )}
        {!finished && result && !result.correct && !result.parseError && (
          <div className="fade-up rounded-lg border border-warn/40 bg-warn/10 px-3.5 py-2.5">
            <div className="font-semibold text-warn">Revisemos dónde pudo aparecer el error.</div>
            {result.diagnosis ? (
              <div className="mt-1 text-[14px]"><Badge tone="warn" className="mr-1.5">{result.diagnosis.label}</Badge><RichText text={result.diagnosis.explain} /></div>
            ) : (
              <div className="mt-1 text-[14px]">No reconozco un error típico en {problem.kind === 'numeric' && result.parsed !== null ? <span className="num">{fmt(result.parsed, 4)}</span> : 'esa opción'}. Revisa la pista y vuelve a intentarlo.</div>
            )}
          </div>
        )}

        {hints > 0 && (
          <div className="space-y-1.5">
            {problem.hints.slice(0, hints).map((h, i) => (
              <div key={i} className="fade-up flex gap-2 text-[14px]"><span className="eyebrow mt-0.5 shrink-0 text-ang">Pista {i + 1}</span><RichText text={h} /></div>
            ))}
          </div>
        )}

        {(revealed || solved) && (
          <details open={revealed} className="rounded-lg border border-line bg-panel2/50 px-3.5 py-2.5">
            <summary className="cursor-pointer text-[14px] font-semibold">Solución paso a paso</summary>
            <ol className="mt-2 space-y-1.5">
              {problem.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[14.5px]"><span className="num mt-0.5 text-[12px] text-muted">{i + 1}.</span><div className="min-w-0 overflow-x-auto"><RichText text={s} /></div></li>
              ))}
            </ol>
            {revealed && !solved && <p className="mt-2 text-[13px] text-muted">Respuesta: <span className="num font-semibold text-ink">{problem.kind === 'choice' ? <RichText text={problem.choices![problem.answer]} /> : `${fmt(problem.answer, 3)}${problem.unit ? ' ' + problem.unit : ''}`}</span>. Intenta otro ejercicio parecido para fijar la idea.</p>}
          </details>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!finished && hints < problem.hints.length && <Button size="sm" variant="soft" onClick={showHint}>Pedir pista ({hints}/{problem.hints.length})</Button>}
          {!finished && tries > 0 && <Button size="sm" variant="ghost" onClick={reveal}>Ver solución</Button>}
          {finished && <Button size="sm" variant="ghost" onClick={save}>Guardar en cuaderno</Button>}
          {onNext && <Button size="sm" variant={finished ? 'primary' : 'ghost'} className="ml-auto" onClick={onNext}>{finished ? 'Siguiente ejercicio →' : 'Saltar'}</Button>}
        </div>
      </div>
    </article>
  );
}
