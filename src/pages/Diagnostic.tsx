import { useMemo, useState } from 'react';
import { AREA_NAMES, AREA_TIPS, DIAGNOSTIC, type Area } from '../data/diagnostic';
import { moduleById } from '../data/modules';
import { useStore } from '../store/store';
import { RichText } from '../components/Tex';
import { Badge, Button, Callout, Panel } from '../components/ui';
import type { DiagnosticResult } from '../services/storage';

function evaluateDiagnostic(answers: (number | null)[]): DiagnosticResult {
  const byArea: Record<string, { attempts: number; correct: number }> = {};
  let score = 0;
  DIAGNOSTIC.forEach((q, i) => {
    const t = (byArea[q.area] ??= { attempts: 0, correct: 0 });
    t.attempts++;
    if (answers[i] === q.answer) { t.correct++; score++; }
  });
  const pct = score / DIAGNOSTIC.length;
  const level = pct >= 0.85 ? 'Avanzado' : pct >= 0.6 ? 'Intermedio' : 'Inicial';
  const ok = (a: Area) => byArea[a]?.correct === byArea[a]?.attempts;
  // Ruta: nunca se salta el plano si las coordenadas fallan; con base sólida se parte en ángulos
  let start = 'm1';
  if (ok('coordenadas') && ok('raices') && ok('potencias')) start = level === 'Avanzado' && ok('geometria') ? 'm4' : 'm2';
  return { date: Date.now(), score, total: DIAGNOSTIC.length, byArea, level, startModule: start };
}

export function DiagnosticPage({ go }: { go: (r: string) => void }) {
  const { state, dispatch } = useStore();
  const [answers, setAnswers] = useState<(number | null)[]>(() => DIAGNOSTIC.map(() => null));
  const [i, setI] = useState(0);
  const [showResult, setShowResult] = useState(!!state.diagnostic);
  const result = state.diagnostic;
  const q = DIAGNOSTIC[i];
  const answered = answers[i] !== null;

  const finish = () => {
    const r = evaluateDiagnostic(answers);
    dispatch({ type: 'diagnostic', result: r });
    setShowResult(true);
  };

  const areas = Object.keys(AREA_NAMES) as Area[];
  const mastered = useMemo(() => (result ? areas.filter((a) => result.byArea[a] && result.byArea[a].correct === result.byArea[a].attempts) : []), [result]); // eslint-disable-line react-hooks/exhaustive-deps
  const reinforce = useMemo(() => (result ? areas.filter((a) => result.byArea[a] && result.byArea[a].correct < result.byArea[a].attempts) : []), [result]); // eslint-disable-line react-hooks/exhaustive-deps

  if (showResult && result) {
    const start = moduleById(result.startModule)!;
    return (
      <div className="space-y-5">
        <header>
          <div className="eyebrow">Módulo 0 · Diagnóstico</div>
          <h1 className="text-[30px] font-semibold">Tu punto de partida</h1>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <Panel title="Nivel estimado" eyebrow="Resultado">
            <div className="font-display text-[34px] font-semibold text-accent">{result.level}</div>
            <div className="num text-muted">{result.score} de {result.total} correctas ({Math.round((result.score / result.total) * 100)} %)</div>
          </Panel>
          <Panel title="Ruta recomendada" eyebrow="Siguiente paso">
            <p className="text-[14.5px]">Empieza en <strong>{start.n}. {start.title}</strong>. {result.startModule === 'm1' ? 'Construiremos todo desde la base.' : 'Los módulos anteriores quedan desbloqueados por si quieres repasar.'}</p>
            <Button className="mt-3" variant="primary" onClick={() => go(result.startModule)}>Comenzar en el módulo {start.n} →</Button>
          </Panel>
          <Panel title="Recuerda" eyebrow="Sin bloqueos">
            <p className="text-[14px] text-muted">El diagnóstico solo sugiere. Puedes abrir cualquier módulo cuando quieras activando el modo libre (en Progreso).</p>
          </Panel>
        </div>
        <Panel title="Por área" eyebrow="Detalle">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {areas.map((a) => {
              const t = result.byArea[a];
              const full = t && t.correct === t.attempts;
              return (
                <div key={a} className="rounded-lg border border-line px-3 py-2">
                  <div className="text-[13.5px] font-medium">{AREA_NAMES[a]}</div>
                  <div className="mt-1 flex items-center gap-2"><span className="num text-[13px] text-muted">{t?.correct ?? 0}/{t?.attempts ?? 0}</span>{full ? <Badge tone="ok">dominado</Badge> : <Badge tone="warn">reforzar</Badge>}</div>
                </div>
              );
            })}
          </div>
        </Panel>
        {reinforce.length > 0 && (
          <Panel title="Repaso rápido de lo que conviene reforzar" eyebrow={`${reinforce.length} áreas`}>
            <div className="space-y-3">
              {reinforce.map((a) => <div key={a}><div className="text-[14px] font-semibold">{AREA_NAMES[a]}</div><p className="text-[14.5px]"><RichText text={AREA_TIPS[a]} /></p></div>)}
            </div>
          </Panel>
        )}
        {mastered.length > 0 && <Callout tone="ok" title="Conceptos dominados">{mastered.map((a) => AREA_NAMES[a]).join(' · ')}</Callout>}
        <Button variant="ghost" onClick={() => { setAnswers(DIAGNOSTIC.map(() => null)); setI(0); setShowResult(false); }}>Repetir el diagnóstico</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-5">
      <header>
        <div className="eyebrow">Módulo 0 · Diagnóstico</div>
        <h1 className="text-[30px] font-semibold">¿Desde dónde partimos?</h1>
        <p className="mt-1 text-muted">14 preguntas cortas sobre lo que necesitas para llegar a la trigonometría. Si no sabes una, elige "No lo sé": no hay castigo, solo sirve para recomendarte una ruta.</p>
      </header>
      <div className="flex gap-1" aria-hidden>{DIAGNOSTIC.map((_, j) => <span key={j} className={`h-1.5 flex-1 rounded-full ${answers[j] !== null ? 'bg-accent' : j === i ? 'bg-accent/40' : 'bg-line'}`} />)}</div>
      <Panel title={<RichText text={q.q} />} eyebrow={`Pregunta ${i + 1} de ${DIAGNOSTIC.length} · ${AREA_NAMES[q.area]}`}>
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((o, j) => {
            const chosen = answers[i] === j;
            const correct = answered && j === q.answer;
            return (
              <button key={j} type="button" disabled={answered} onClick={() => setAnswers((a) => a.map((x, k) => (k === i ? j : x)))}
                className={`min-h-[46px] rounded-lg border px-3 py-2 text-left text-[15px] ${correct ? 'border-ok bg-ok/10' : chosen ? 'border-bad bg-bad/10' : 'border-line hover:border-accent'}`}>
                <RichText text={o} />
              </button>
            );
          })}
          <button type="button" disabled={answered} onClick={() => setAnswers((a) => a.map((x, k) => (k === i ? -1 : x)))} className={`min-h-[46px] rounded-lg border border-dashed px-3 py-2 text-left text-[14px] text-muted ${answers[i] === -1 ? 'border-warn' : 'border-line hover:border-accent'}`}>No lo sé</button>
        </div>
        {answered && <div className="fade-up mt-3"><Callout tone={answers[i] === q.answer ? 'ok' : 'muted'} title={answers[i] === q.answer ? 'Correcto' : 'Así se resuelve'}><RichText text={q.explain} /></Callout></div>}
        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <Button variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>← Anterior</Button>
          {i < DIAGNOSTIC.length - 1
            ? <Button variant="primary" disabled={!answered} onClick={() => setI(i + 1)}>Siguiente →</Button>
            : <Button variant="primary" disabled={answers.some((a) => a === null)} onClick={finish}>Ver mi resultado</Button>}
        </div>
      </Panel>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => go('m1')}>Saltar el diagnóstico y empezar en el módulo 1</Button>
        {result && <Button variant="ghost" size="sm" onClick={() => setShowResult(true)}>Ver el resultado anterior</Button>}
      </div>
    </div>
  );
}
