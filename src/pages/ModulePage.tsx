import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { moduleById, MODULES, PRACTICE_GOAL } from '../data/modules';
import { isUnlocked, useStore } from '../store/store';
import { Practice } from '../components/Practice';
import { TeacherMode } from '../components/TeacherMode';
import { Badge, Button, Callout, Segmented } from '../components/ui';
import { DiagnosticPage } from './Diagnostic';

const LABS: Record<string, ComponentType> = {
  m1: lazy(() => import('../modules/labs/Coordinates')),
  m2: lazy(() => import('../modules/labs/Distance')),
  m3: lazy(() => import('../modules/labs/Slope')),
  m4: lazy(() => import('../modules/labs/Angles')),
  m5: lazy(() => import('../modules/labs/Triangles')),
  m6: lazy(() => import('../modules/labs/RightTriangle')),
  m7: lazy(() => import('../modules/labs/Pythagoras')),
  m8: lazy(() => import('../modules/labs/RatioLab').then((m) => ({ default: () => <m.default fn="sin" /> }))),
  m9: lazy(() => import('../modules/labs/RatioLab').then((m) => ({ default: () => <m.default fn="cos" /> }))),
  m10: lazy(() => import('../modules/labs/RatioLab').then((m) => ({ default: () => <m.default fn="tan" /> }))),
  m11: lazy(() => import('../modules/labs/Soh')),
  m12: lazy(() => import('../modules/labs/Solver')),
  m13: lazy(() => import('../modules/labs/UnitCircleLab')),
  m14: lazy(() => import('../modules/labs/Identity')),
  m15: lazy(() => import('../modules/labs/Oblique')),
  m16: lazy(() => import('../modules/labs/Graphs')),
  m17: lazy(() => import('../modules/labs/SumAngles')),
};

type Tab = 'lab' | 'teacher' | 'practice';

export function ModulePage({ id, go }: { id: string; go: (r: string) => void }) {
  const { state, dispatch } = useStore();
  const meta = moduleById(id)!;
  const [tab, setTab] = useState<Tab>('lab');
  const unlocked = isUnlocked(state, id);
  useEffect(() => { setTab('lab'); }, [id]);
  // Solo se marca como visitado un módulo abierto (si no, visitar uno bloqueado lo desbloquearía)
  useEffect(() => { if (unlocked) dispatch({ type: 'visit', module: id }); }, [id, unlocked, dispatch]);

  if (id === 'm0') return <DiagnosticPage go={go} />;

  const idx = MODULES.findIndex((m) => m.id === id);
  const prev = MODULES[idx - 1], next = MODULES[idx + 1];
  const mp = state.modules[id];
  const Lab = LABS[id];

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">Módulo {meta.n} de {MODULES.length - 1}</span>
          {mp?.completed ? <Badge tone="ok">✓ completado</Badge> : <Badge>{Math.min(mp?.practiceCorrect ?? 0, PRACTICE_GOAL)}/{PRACTICE_GOAL} ejercicios</Badge>}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold leading-tight sm:text-[34px]">{meta.title}</h1>
            <p className="mt-1 max-w-[65ch] text-[15px] text-muted">{meta.question} {meta.summary}</p>
          </div>
          <Segmented value={tab} onChange={setTab} ariaLabel="Sección del módulo" options={[{ value: 'lab', label: 'Laboratorio' }, { value: 'teacher', label: 'Profesor' }, { value: 'practice', label: 'Práctica' }]} />
        </div>
      </header>

      {!unlocked && (
        <Callout tone="warn" title="Módulo aún bloqueado en la ruta">
          <div className="flex flex-wrap items-center gap-3">
            <span>La ruta recomienda completar antes «{prev?.title}». Puedes entrar igual activando el modo libre.</span>
            <Button size="sm" onClick={() => dispatch({ type: 'settings', patch: { freeMode: true } })}>Activar modo libre</Button>
            {prev && <Button size="sm" variant="ghost" onClick={() => go(prev.id)}>Ir a «{prev.title}»</Button>}
          </div>
        </Callout>
      )}

      {unlocked && (
        <Suspense fallback={<div className="rounded-xl border border-line bg-panel p-8 text-center text-muted">Cargando laboratorio…</div>}>
          {tab === 'lab' && <Lab />}
          {tab === 'teacher' && <TeacherMode moduleId={id} goLab={() => setTab('lab')} goPractice={() => setTab('practice')} />}
          {tab === 'practice' && meta.practice && <Practice key={id} category={meta.practice} module={id} />}
        </Suspense>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        {prev ? <Button variant="ghost" onClick={() => go(prev.id)}>← {prev.n}. {prev.title}</Button> : <span />}
        {next && <Button variant={mp?.completed ? 'primary' : 'outline'} onClick={() => go(next.id)}>{next.n}. {next.title} →</Button>}
      </footer>
    </div>
  );
}
