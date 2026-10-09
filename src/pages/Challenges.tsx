import { useState } from 'react';
import { generate, pick } from '../modules/generators';
import { CATEGORY_NAMES, LEVEL_NAMES, type Category, type Level, type Problem } from '../modules/types';
import { ProblemCard } from '../components/ProblemCard';
import { Exam } from '../components/Exam';
import { Button, Panel, Segmented } from '../components/ui';

const ALL = Object.keys(CATEGORY_NAMES) as Category[];
const GROUPS: { name: string; cats: Category[] }[] = [
  { name: 'Base', cats: ['coords', 'distance', 'slope', 'angles', 'triangles'] },
  { name: 'Triángulo rectángulo', cats: ['right', 'pythagoras', 'soh'] },
  { name: 'Razones', cats: ['sin', 'cos', 'tan', 'solve'] },
  { name: 'Círculo y más allá', cats: ['unit', 'identity', 'oblique', 'graphs'] },
  { name: 'Identidades y ecuaciones', cats: ['sum', 'double', 'inverse', 'equations'] },
];

export function Challenges() {
  const [cats, setCats] = useState<Category[]>(['solve']);
  const [level, setLevel] = useState<Level>(4);
  const [problem, setProblem] = useState<Problem>(() => generate('solve', 4));
  const [session, setSession] = useState({ ok: 0, total: 0, streak: 0 });
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');

  const next = (c = cats, l = level) => setProblem(generate(pick(c.length ? c : ALL), l));
  const toggle = (c: Category) => {
    const nc = cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c];
    setCats(nc);
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="eyebrow">Generador procedural · {ALL.length} categorías × 5 niveles</div>
        <h1 className="text-[30px] font-semibold">Desafíos</h1>
        <p className="mt-1 max-w-[70ch] text-muted">Cada ejercicio se genera con números nuevos. Si te equivocas, primero vemos dónde pudo estar el error y recibes una pista; la solución completa está a un clic.</p>
      </header>
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel title="Nivel" eyebrow="Dificultad">
            <div className="grid gap-1.5">
              {([1, 2, 3, 4, 5] as Level[]).map((l) => (
                <button key={l} type="button" onClick={() => { setLevel(l); next(cats, l); }} aria-pressed={level === l}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-[14px] ${level === l ? 'border-accent bg-accent/5' : 'border-line hover:border-accent/50'}`}>
                  <span className="num flex h-6 w-6 items-center justify-center rounded-md bg-panel2 text-[12px] font-semibold">{l}</span>
                  <span>{LEVEL_NAMES[l]}</span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Categorías" eyebrow={cats.length ? `${cats.length} seleccionadas (mezcla aleatoria)` : 'Ninguna = todas'}
            actions={<><Button size="sm" variant="ghost" onClick={() => setCats(ALL)}>Todas</Button><Button size="sm" variant="ghost" onClick={() => setCats([])}>Ninguna</Button></>}>
            <div className="space-y-3">
              {GROUPS.map((g) => (
                <div key={g.name}>
                  <div className="eyebrow mb-1">{g.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.cats.map((c) => (
                      <button key={c} type="button" onClick={() => toggle(c)} aria-pressed={cats.includes(c)}
                        className={`rounded-full border px-2.5 py-1 text-[12.5px] ${cats.includes(c) ? 'border-accent bg-accent text-accentInk' : 'border-line text-muted hover:text-ink'}`}>{CATEGORY_NAMES[c]}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-3 w-full" variant="primary" onClick={() => next()}>Generar ejercicio</Button>
          </Panel>
          <Panel title="Esta sesión" eyebrow="Estadísticas">
            <div className="num grid grid-cols-3 gap-2 text-center">
              <div><div className="text-[22px] font-semibold text-ok">{session.ok}</div><div className="text-[11.5px] text-muted">correctos</div></div>
              <div><div className="text-[22px] font-semibold">{session.total}</div><div className="text-[11.5px] text-muted">terminados</div></div>
              <div><div className="text-[22px] font-semibold text-ang">{session.streak}</div><div className="text-[11.5px] text-muted">racha</div></div>
            </div>
          </Panel>
        </div>
        <div className="min-w-0 space-y-3">
          <Segmented value={mode} onChange={setMode} ariaLabel="Modo" options={[{ value: 'practice', label: 'Práctica con pistas' }, { value: 'exam', label: 'Modo examen' }]} />
          {mode === 'exam' ? <Exam categories={cats} /> : <>
          <Segmented size="sm" value={String(level) as `${Level}`} onChange={(v) => { const l = Number(v) as Level; setLevel(l); next(cats, l); }} options={([1, 2, 3, 4, 5] as Level[]).map((l) => ({ value: String(l) as `${Level}`, label: `N${l}` }))} ariaLabel="Nivel rápido" />
          <ProblemCard problem={problem} onDone={(ok) => setSession((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1, streak: ok ? s.streak + 1 : 0 }))} onNext={() => next()} />
          </>}
        </div>
      </div>
    </div>
  );
}
