import { useEffect, useMemo, useRef, useState } from 'react';
import { generate, pick } from '../modules/generators';
import { checkAnswer } from '../modules/checker';
import { CATEGORY_NAMES, type Category, type CheckResult, type Level, type Problem } from '../modules/types';
import { fmt } from '../math/core';
import { useStore } from '../store/store';
import { MiniFigure } from '../visualizations/MiniFigure';
import { RichText } from './Tex';
import { Badge, Button, Callout, Panel, Segmented } from './ui';

interface Answer { problem: Problem; raw: string; result: CheckResult }
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/**
 * Modo examen: preguntas seguidas, sin pistas ni corrección inmediata.
 * Al final: nota, tiempo, resultado por categoría y revisión con diagnóstico y solución.
 */
export function Exam({ categories }: { categories: Category[] }) {
  const { dispatch } = useStore();
  const [n, setN] = useState(10);
  const [levelMode, setLevelMode] = useState<'mix' | Level>('mix');
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [i, setI] = useState(0);
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [parseErr, setParseErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const done = problems !== null && answers.length === problems.length;

  useEffect(() => {
    if (!problems || done) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [problems, done]);

  const begin = () => {
    const cats = categories.length ? categories : (Object.keys(CATEGORY_NAMES) as Category[]);
    const list = Array.from({ length: n }, (_, k) => {
      const lv: Level = levelMode === 'mix' ? (([1, 2, 2, 3, 3, 4, 4, 5] as Level[])[Math.min(7, Math.floor((k / n) * 8))]) : levelMode;
      return generate(pick(cats), lv);
    });
    setProblems(list); setI(0); setAnswers([]); setInput(''); setStart(Date.now()); setNow(Date.now()); setParseErr('');
  };

  const submit = (raw: string | number) => {
    if (!problems) return;
    const p = problems[i];
    const blank = raw === '';
    const r: CheckResult = blank ? { correct: false, parsed: null } : checkAnswer(p, raw);
    if (!blank && r.parseError && p.kind === 'numeric') { setParseErr(r.parseError); return; }
    setParseErr('');
    dispatch({ type: 'attempt', category: p.concept ?? p.category, level: p.level, correct: r.correct, firstTry: true, title: `Examen · ${p.title}`, final: true });
    setAnswers((a) => [...a, { problem: p, raw: String(raw), result: r }]);
    setInput('');
    setI((x) => x + 1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const summary = useMemo(() => {
    const byCat: Record<string, { ok: number; t: number }> = {};
    answers.forEach((a) => { const c = (byCat[a.problem.category] ??= { ok: 0, t: 0 }); c.t++; if (a.result.correct) c.ok++; });
    const ok = answers.filter((a) => a.result.correct).length;
    return { ok, byCat };
  }, [answers]);

  if (!problems) {
    return (
      <Panel title="Modo examen" eyebrow="Sin pistas · corrección al final">
        <div className="space-y-4 text-[14.5px]">
          <p className="text-muted">Responde todo seguido, como en una prueba. Al terminar ves tu nota, el tiempo, cómo te fue en cada tema y la revisión de cada error con su explicación.</p>
          <div className="flex flex-wrap items-center gap-3"><span className="w-28">Preguntas</span><Segmented size="sm" value={String(n)} onChange={(v) => setN(Number(v))} options={[{ value: '5', label: '5' }, { value: '10', label: '10' }, { value: '15', label: '15' }]} /></div>
          <div className="flex flex-wrap items-center gap-3"><span className="w-28">Dificultad</span><Segmented size="sm" value={String(levelMode)} onChange={(v) => setLevelMode(v === 'mix' ? 'mix' : (Number(v) as Level))} options={[{ value: 'mix', label: 'Progresiva' }, { value: '2', label: 'N2' }, { value: '3', label: 'N3' }, { value: '4', label: 'N4' }, { value: '5', label: 'N5' }]} /></div>
          <p className="text-[13px] text-muted">Temas: {categories.length ? categories.map((c) => CATEGORY_NAMES[c]).join(', ') : 'todos'} (se eligen en el panel de categorías).</p>
          <Button variant="primary" onClick={begin}>Comenzar examen</Button>
        </div>
      </Panel>
    );
  }

  if (done) {
    const elapsed = Math.round((now - start) / 1000);
    const grade = 1 + 6 * (summary.ok / problems.length); // escala chilena 1,0 – 7,0
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Panel><div className="eyebrow">Resultado</div><div className="num text-[30px] font-semibold">{summary.ok}<span className="text-[16px] text-muted">/{problems.length}</span></div><div className="text-[13px] text-muted">{Math.round((summary.ok / problems.length) * 100)} % correctas</div></Panel>
          <Panel><div className="eyebrow">Nota (escala 1,0 – 7,0)</div><div className="num text-[30px] font-semibold" style={{ color: `rgb(var(--${grade >= 4 ? 'ok' : 'bad'}))` }}>{fmt(grade, 1)}</div><div className="text-[13px] text-muted">lineal, sin exigencia mínima</div></Panel>
          <Panel><div className="eyebrow">Tiempo</div><div className="num text-[30px] font-semibold">{mmss(elapsed)}</div><div className="text-[13px] text-muted">{fmt(elapsed / problems.length, 0)} s por pregunta</div></Panel>
        </div>
        <Panel title="Por tema" eyebrow="Dónde reforzar">
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byCat).map(([c, v]) => <Badge key={c} tone={v.ok === v.t ? 'ok' : v.ok === 0 ? 'bad' : 'warn'}>{CATEGORY_NAMES[c as Category]} {v.ok}/{v.t}</Badge>)}
          </div>
        </Panel>
        <Panel title="Revisión" eyebrow="Cada pregunta con su explicación">
          <ol className="space-y-3">
            {answers.map((a, k) => (
              <li key={k} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center gap-2 text-[13px]"><span className={a.result.correct ? 'text-ok' : 'text-bad'}>{a.result.correct ? '✓' : '✗'}</span><span className="num text-muted">{k + 1}.</span><Badge>{CATEGORY_NAMES[a.problem.category]} · N{a.problem.level}</Badge><span className="font-semibold">{a.problem.title}</span></div>
                <p className="mt-1 text-[14.5px]"><RichText text={a.problem.statement} /></p>
                <p className="mt-1 text-[13.5px]">Tu respuesta: <span className="num">{a.problem.kind === 'choice' ? (a.problem.choices![Number(a.raw)] ? <RichText text={a.problem.choices![Number(a.raw)]} /> : '—') : a.raw || '—'}</span> · Correcta: <span className="num font-semibold">{a.problem.kind === 'choice' ? <RichText text={a.problem.choices![a.problem.answer]} /> : `${fmt(a.problem.answer, 3)}${a.problem.unit ? ' ' + a.problem.unit : ''}`}</span></p>
                {!a.result.correct && a.result.diagnosis && <div className="mt-1 text-[13.5px]"><Badge tone="warn" className="mr-1">{a.result.diagnosis.label}</Badge><RichText text={a.result.diagnosis.explain} /></div>}
                {!a.result.correct && (
                  <details className="mt-1"><summary className="cursor-pointer text-[13px] text-accent">Ver solución</summary>
                    <ol className="mt-1 space-y-1 text-[14px]">{a.problem.steps.map((s, j) => <li key={j} className="overflow-x-auto"><RichText text={s} /></li>)}</ol>
                  </details>
                )}
              </li>
            ))}
          </ol>
        </Panel>
        <div className="flex gap-2"><Button variant="primary" onClick={begin}>Otro examen</Button><Button variant="ghost" onClick={() => setProblems(null)}>Cambiar configuración</Button></div>
      </div>
    );
  }

  const p = problems[i];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="num text-[13px] text-muted">Pregunta {i + 1} de {problems.length}</span>
        <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-panel2"><div className="h-full bg-accent transition-[width]" style={{ width: `${(i / problems.length) * 100}%` }} /></div>
        <span className="num text-[13px]">⏱ {mmss(Math.round((now - start) / 1000))}</span>
      </div>
      <article className="rounded-xl border border-line bg-panel">
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5"><Badge tone="accent">{CATEGORY_NAMES[p.category]}</Badge><Badge>Nivel {p.level}</Badge><h3 className="ml-auto text-[14px] font-semibold">{p.title}</h3></header>
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
          <div className="min-w-0 space-y-2">
            <p className="text-[15.5px] leading-relaxed"><RichText text={p.statement} /></p>
            {p.data.length > 0 && <ul className="flex flex-wrap gap-x-5 gap-y-1 rounded-lg bg-panel2/70 px-3 py-2 text-[14px]">{p.data.map((d, k) => <li key={k}><RichText text={d} /></li>)}</ul>}
          </div>
          {p.figure && <div className="md:w-[300px]"><MiniFigure fig={p.figure} /></div>}
        </div>
        <div className="border-t border-line px-4 py-3">
          {p.kind === 'choice' ? (
            <div className="grid gap-2 sm:grid-cols-2">{p.choices!.map((c, k) => <button key={k} type="button" onClick={() => submit(k)} className="min-h-[44px] rounded-lg border border-line px-3 py-2 text-left text-[14.5px] hover:border-accent"><span className="num mr-2 text-[12px] text-muted">{String.fromCharCode(65 + k)}</span><RichText text={c} /></button>)}</div>
          ) : (
            <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); submit(input); }}>
              <label htmlFor="exam-ans" className="sr-only">Tu respuesta</label>
              <input id="exam-ans" ref={inputRef} autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tu respuesta" autoComplete="off" className="num h-11 w-44 rounded-lg border border-line bg-panel2 px-3 text-[16px]" />
              {p.unit && <span className="num text-muted">{p.unit}</span>}
              <Button type="submit" variant="primary" disabled={!input.trim()}>Responder</Button>
              <Button variant="ghost" onClick={() => submit('')}>Dejar en blanco</Button>
              {p.answerHint && <p className="w-full text-[12.5px] text-muted">{p.answerHint}</p>}
            </form>
          )}
          {parseErr && <div className="mt-2"><Callout tone="warn">{parseErr}</Callout></div>}
        </div>
      </article>
    </div>
  );
}
