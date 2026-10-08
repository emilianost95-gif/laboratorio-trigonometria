import { useCallback, useState } from 'react';
import { generate } from '../modules/generators';
import { LEVEL_NAMES, type Category, type Level, type Problem } from '../modules/types';
import { PRACTICE_GOAL } from '../data/modules';
import { useStore } from '../store/store';
import { ProblemCard } from './ProblemCard';
import { Segmented } from './ui';

/** Práctica de un módulo: ejercicios generados de su categoría, con selector de nivel. */
export function Practice({ category, module }: { category: Category; module: string }) {
  const { state } = useStore();
  const [level, setLevel] = useState<Level>(1);
  const [problem, setProblem] = useState<Problem>(() => generate(category, 1));
  const [streak, setStreak] = useState(0);
  const next = useCallback((lv: Level = level) => setProblem(generate(category, lv)), [category, level]);
  const mp = state.modules[module];
  const done = mp?.practiceCorrect ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented ariaLabel="Nivel" value={String(level) as `${Level}`} onChange={(v) => { const l = Number(v) as Level; setLevel(l); next(l); }}
          options={([1, 2, 3, 4, 5] as Level[]).map((l) => ({ value: String(l) as `${Level}`, label: <span title={LEVEL_NAMES[l]}>N{l}<span className="hidden sm:inline"> · {LEVEL_NAMES[l]}</span></span> }))} />
        <div className="flex items-center gap-3 text-[13px] text-muted">
          <span>Objetivo del módulo: <span className="num font-semibold text-ink">{Math.min(done, PRACTICE_GOAL)}/{PRACTICE_GOAL}</span> {mp?.completed && <span className="text-ok">✓ completado</span>}</span>
          {streak >= 2 && <span className="num text-ang">racha ×{streak}</span>}
        </div>
      </div>
      <ProblemCard problem={problem} module={module} onDone={(ok) => setStreak((s) => (ok ? s + 1 : 0))} onNext={() => next()} />
    </div>
  );
}
