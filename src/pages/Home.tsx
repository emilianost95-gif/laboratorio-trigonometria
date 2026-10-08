import { useState } from 'react';
import { MODULES } from '../data/modules';
import { isUnlocked, levelInfo, useStore } from '../store/store';
import { Badge, Button, Panel } from '../components/ui';
import { RichText } from '../components/Tex';
import { fmt } from '../math/core';
import { cosDeg, sinDeg, tanDeg } from '../math/trig';
import { UnitCircleView } from '../visualizations/UnitCircle';

function HeroDemo() {
  const [theta, setTheta] = useState(35);
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-xl border border-line">
        <UnitCircleView theta={theta} onTheta={setTheta} layers={{ triangle: true, projections: true, tangent: false, line: false, quadrants: false }} />
      </div>
      <div className="num grid grid-cols-3 gap-2 text-center sm:grid-cols-1 sm:text-left">
        <div><div className="eyebrow">θ</div><div className="text-[20px] font-semibold text-ang">{fmt(theta, 0)}°</div></div>
        <div><div className="eyebrow">cos θ = x</div><div className="text-[20px] font-semibold text-adj">{fmt(cosDeg(theta), 3)}</div></div>
        <div><div className="eyebrow">sen θ = y</div><div className="text-[20px] font-semibold text-opp">{fmt(sinDeg(theta), 3)}</div></div>
        <div className="hidden sm:block"><div className="eyebrow">tan θ</div><div className="text-[20px] font-semibold text-accent">{Number.isFinite(tanDeg(theta)) ? fmt(tanDeg(theta), 3) : '—'}</div></div>
      </div>
    </div>
  );
}

export function Home({ go }: { go: (r: string) => void }) {
  const { state } = useStore();
  const lv = levelInfo(state.stats.xp);
  const done = MODULES.filter((m) => state.modules[m.id]?.completed).length;
  const nextMod = MODULES.find((m) => m.id !== 'm0' && !state.modules[m.id]?.completed && isUnlocked(state, m.id)) ?? MODULES[1];
  const acc = state.stats.attempts ? Math.round((state.stats.correct / state.stats.attempts) * 100) : null;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 rounded-2xl border border-line bg-panel p-5 sm:p-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col justify-center">
          <div className="eyebrow">Laboratorio interactivo · {MODULES.length} módulos</div>
          <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] sm:text-[44px]">Camino a la trigonometría</h1>
          <p className="mt-3 max-w-[56ch] text-[16px] text-muted">
            <RichText text="Desde el plano cartesiano hasta $\sin^2\theta + \cos^2\theta = 1$. Aquí no se memoriza primero: se **observa**, se **experimenta**, se **descubre** y recién entonces se **formaliza**. Arrastra el punto de la derecha: eso es lo que vas a entender." />
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {!state.diagnostic && <Button variant="primary" onClick={() => go('m0')}>Hacer el diagnóstico (5 min)</Button>}
            <Button variant={state.diagnostic ? 'primary' : 'outline'} onClick={() => go(nextMod.id)}>{done > 0 || state.diagnostic ? 'Continuar' : 'Empezar'}: {nextMod.n}. {nextMod.title} →</Button>
            <Button variant="ghost" onClick={() => go('lab')}>Laboratorio libre</Button>
          </div>
        </div>
        <HeroDemo />
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel><div className="eyebrow">Nivel {lv.index}</div><div className="font-display text-[20px] font-semibold">{lv.name}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel2"><div className="h-full bg-accent" style={{ width: `${lv.progress * 100}%` }} /></div><div className="num mt-1 text-[12px] text-muted">{lv.xp} XP{lv.next ? ` · siguiente en ${lv.next}` : ''}</div></Panel>
        <Panel><div className="eyebrow">Módulos</div><div className="num text-[26px] font-semibold">{done}<span className="text-[15px] text-muted">/{MODULES.length}</span></div><div className="text-[12.5px] text-muted">completados</div></Panel>
        <Panel><div className="eyebrow">Ejercicios</div><div className="num text-[26px] font-semibold">{state.stats.solved}</div><div className="text-[12.5px] text-muted">{acc === null ? 'aún sin intentos' : `${acc} % de precisión`}</div></Panel>
        <Panel><div className="eyebrow">Racha</div><div className="num text-[26px] font-semibold text-ang">{state.streak.current} {state.streak.current === 1 ? 'día' : 'días'}</div><div className="text-[12.5px] text-muted">mejor: {state.streak.best}</div></Panel>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-[22px] font-semibold">El camino</h2>
          <span className="text-[13px] text-muted">{state.settings.freeMode ? 'Modo libre activo: todo desbloqueado' : 'Cada módulo se desbloquea al completar el anterior'}</span>
        </div>
        <ol className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((m) => {
            const p = state.modules[m.id];
            const unlocked = isUnlocked(state, m.id);
            return (
              <li key={m.id}>
                <a href={`#${m.id}`} onClick={(e) => { e.preventDefault(); go(m.id); }}
                  className={`flex h-full gap-3 rounded-xl border bg-panel p-3.5 transition-colors hover:border-accent ${m.id === nextMod.id ? 'border-accent/60' : 'border-line'} ${unlocked ? '' : 'opacity-60'}`}>
                  <span className={`num flex h-11 w-12 shrink-0 items-center justify-center rounded-lg border text-[13px] font-semibold ${p?.completed ? 'border-ok/50 text-ok' : 'border-line text-ink'}`}>{m.glyph}</span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5"><span className="num text-[12px] text-muted">{String(m.n).padStart(2, '0')}</span><span className="font-semibold">{m.title}</span>
                      {p?.completed && <Badge tone="ok">✓</Badge>}{!unlocked && <Badge>bloqueado</Badge>}{m.id === nextMod.id && !p?.completed && <Badge tone="accent">siguiente</Badge>}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{m.summary}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { id: 'lab', t: 'Laboratorio libre', d: 'Círculo, triángulo, pendiente y ondas conectados: mueve un punto y todo cambia a la vez.' },
          { id: 'desafios', t: 'Desafíos', d: 'Problemas generados al azar en 5 niveles, con pistas y diagnóstico de errores.' },
          { id: 'cuaderno', t: 'Cuaderno de laboratorio', d: `Tus notas, fórmulas y descubrimientos. ${state.notes.length ? `${state.notes.length} guardados.` : 'Aún vacío.'}` },
        ].map((x) => (
          <a key={x.id} href={`#${x.id}`} onClick={(e) => { e.preventDefault(); go(x.id); }} className="rounded-xl border border-line bg-panel p-4 hover:border-accent">
            <div className="font-semibold">{x.t} →</div>
            <p className="mt-1 text-[13.5px] text-muted">{x.d}</p>
          </a>
        ))}
      </section>
    </div>
  );
}
