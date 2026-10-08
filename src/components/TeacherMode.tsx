import { useState } from 'react';
import { TEACHER } from '../data/teacher';
import { RichText, Tex } from './Tex';
import { Button } from './ui';

const SECTIONS = [
  { n: 1, key: 'what', title: '¿Qué significa?' },
  { n: 2, key: 'why', title: '¿Por qué funciona?' },
  { n: 3, key: 'visual', title: 'Visualización' },
  { n: 4, key: 'formula', title: 'Fórmula' },
  { n: 5, key: 'example', title: 'Ejemplo resuelto' },
  { n: 6, key: 'experiment', title: 'Experimento' },
  { n: 7, key: 'exercises', title: 'Ejercicios' },
  { n: 8, key: 'challenge', title: 'Desafío' },
] as const;

export function TeacherMode({ moduleId, goLab, goPractice }: { moduleId: string; goLab: () => void; goPractice: () => void }) {
  const t = TEACHER[moduleId];
  const [showAns, setShowAns] = useState(false);
  if (!t) return <p className="text-muted">Este módulo no tiene explicación de profesor.</p>;
  return (
    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="Secciones" className="hidden lg:block">
        <ol className="sticky top-20 space-y-1 text-[13.5px]">
          {SECTIONS.map((s) => <li key={s.key}><a href={`#${moduleId}`} onClick={(e) => { e.preventDefault(); document.getElementById(`t-${moduleId}-${s.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="flex gap-2 rounded-md px-2 py-1 text-muted hover:bg-panel2 hover:text-ink"><span className="num text-[12px]">{s.n}</span>{s.title}</a></li>)}
        </ol>
      </nav>
      <div className="min-w-0 space-y-3">
        {SECTIONS.map((s) => (
          <section key={s.key} id={`t-${moduleId}-${s.key}`} className="scroll-mt-20 rounded-xl border border-line bg-panel p-4">
            <h3 className="mb-2 flex items-center gap-2.5 text-[16px] font-semibold"><span className="num flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-[12px] text-accent">{s.n}</span>{s.title}</h3>
            <div className="max-w-[72ch] text-[15px] leading-relaxed">
              {s.key === 'what' && <RichText text={t.what} />}
              {s.key === 'why' && <RichText text={t.why} />}
              {s.key === 'visual' && (<><RichText text={t.visual} /><div className="mt-3"><Button size="sm" variant="primary" onClick={goLab}>Abrir el laboratorio →</Button></div></>)}
              {s.key === 'formula' && (<><div className="overflow-x-auto rounded-lg bg-panel2/60 px-3 py-2"><Tex display>{t.formula}</Tex></div>{t.formulaNote && <p className="mt-2 text-[14px] text-muted"><RichText text={t.formulaNote} /></p>}</>)}
              {s.key === 'example' && (
                <>
                  <p className="font-medium"><RichText text={t.example.problem} /></p>
                  <ol className="mt-2 space-y-1.5">
                    {t.example.steps.map((st, i) => <li key={i} className="flex gap-2"><span className="num text-[12px] text-muted">{i + 1}.</span><div className="min-w-0 overflow-x-auto"><RichText text={st} /></div></li>)}
                  </ol>
                </>
              )}
              {s.key === 'experiment' && (<><RichText text={t.experiment} /><div className="mt-3"><Button size="sm" variant="soft" onClick={goLab}>Hacer el experimento</Button></div></>)}
              {s.key === 'exercises' && (<><p>Ejercicios generados automáticamente, con números distintos cada vez, pistas y diagnóstico de errores. Completa 3 correctos para cerrar el módulo.</p><div className="mt-3"><Button size="sm" variant="primary" onClick={goPractice}>Ir a practicar →</Button></div></>)}
              {s.key === 'challenge' && (
                <>
                  <p><RichText text={t.challenge.text} /></p>
                  <div className="mt-3">
                    {showAns ? <div className="fade-up rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-[14.5px]"><RichText text={t.challenge.answer} /></div>
                      : <Button size="sm" variant="ghost" onClick={() => setShowAns(true)}>Ver solución (inténtalo primero)</Button>}
                  </div>
                </>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
