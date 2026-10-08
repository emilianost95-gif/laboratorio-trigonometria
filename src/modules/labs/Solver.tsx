import { useMemo, useState } from 'react';
import { Badge, Button, Callout, Panel, Reveal } from '../../components/ui';
import { RichText } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import { solveRight, type Inputs, type Known } from '../../math/solver';
import { RightTriangleView } from '../../visualizations/RightTriangleView';
import { useLab } from '../../utils/useLab';

const FIELDS: { k: Known; label: string; unit: string; hint: string }[] = [
  { k: 'a', label: 'Cateto a', unit: '', hint: 'opuesto a A' },
  { k: 'b', label: 'Cateto b', unit: '', hint: 'adyacente a A' },
  { k: 'c', label: 'Hipotenusa c', unit: '', hint: 'frente al ángulo recto' },
  { k: 'A', label: 'Ángulo A', unit: '°', hint: 'agudo, abajo a la izquierda' },
  { k: 'B', label: 'Ángulo B', unit: '°', hint: 'agudo, arriba a la derecha' },
];

const EXAMPLES: { name: string; v: Inputs }[] = [
  { name: 'Hipotenusa 10 y ángulo 30°', v: { c: 10, A: 30 } },
  { name: 'Catetos 5 y 12', v: { a: 5, b: 12 } },
  { name: 'Cateto 7 e hipotenusa 25', v: { a: 7, c: 25 } },
  { name: 'Cateto b = 8 y B = 40°', v: { b: 8, B: 40 } },
];

export default function SolverLab() {
  const { act, save } = useLab('m12');
  const [vals, setVals] = useState<Record<Known, string>>({ a: '', b: '', c: '10', A: '30', B: '' });
  const [on, setOn] = useState<Known[]>(['c', 'A']);
  const [stepMode, setStepMode] = useState(true);

  const inputs: Inputs = useMemo(() => {
    const r: Inputs = {};
    for (const k of on) {
      const v = Number(vals[k].replace(',', '.'));
      if (vals[k].trim() !== '' && Number.isFinite(v)) r[k] = v;
    }
    return r;
  }, [vals, on]);
  const res = useMemo(() => solveRight(inputs), [inputs]);

  const toggle = (k: Known) => {
    act();
    setOn((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : cur.length >= 2 ? [cur[1], k] : [...cur, k]));
  };
  const loadExample = (v: Inputs) => {
    const nv: Record<Known, string> = { a: '', b: '', c: '', A: '', B: '' };
    (Object.keys(v) as Known[]).forEach((k) => { nv[k] = String(v[k]).replace('.', ','); });
    setVals(nv);
    setOn(Object.keys(v) as Known[]);
    act();
  };

  const V = res.values;
  const scale = V ? Math.max(V.a / 8, V.b / 10, 1e-9) : 1;
  const stepNodes = res.steps.map((s, i) => (
    <div key={i}>
      <div className="font-semibold">{s.title}</div>
      <div className="mt-0.5 space-y-1 text-[14.5px]">{s.lines.map((l, j) => <div key={j} className="overflow-x-auto"><RichText text={l} /></div>)}</div>
    </div>
  ));

  return (
    <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Panel title="Datos conocidos" eyebrow="Marca exactamente dos">
          <div className="space-y-2">
            {FIELDS.map((f) => {
              const active = on.includes(f.k);
              return (
                <div key={f.k} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${active ? 'border-accent bg-accent/5' : 'border-line'}`}>
                  <input id={`solve-chk-${f.k}`} type="checkbox" checked={active} onChange={() => toggle(f.k)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                  <label htmlFor={`solve-chk-${f.k}`} className="min-w-0 flex-1 text-[14px]">
                    <span className="font-medium">{f.label}</span> <span className="text-[12px] text-muted">({f.hint})</span>
                  </label>
                  <input id={`solve-${f.k}`} aria-label={f.label} value={active ? vals[f.k] : V ? fmt(V[f.k], 3) : ''} disabled={!active}
                    onChange={(e) => { setVals({ ...vals, [f.k]: e.target.value }); act(); }} inputMode="decimal"
                    className={`num h-9 w-24 rounded-md border px-2 text-right ${active ? 'border-line bg-panel2' : 'border-transparent bg-transparent font-semibold text-accent'}`} />
                  <span className="num w-3 text-muted">{f.unit}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[12.5px] text-muted">El ángulo recto es C. Al marcar un tercer dato se desmarca el más antiguo.</p>
        </Panel>
        <Panel title="Ejemplos" eyebrow="Carga uno">
          <div className="grid gap-2">
            {EXAMPLES.map((e) => <Button key={e.name} size="sm" variant="soft" className="justify-start" onClick={() => loadExample(e.v)}>{e.name}</Button>)}
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        {!res.ok ? (
          <Callout tone="warn" title="Revisemos los datos">{res.error}</Callout>
        ) : V && (
          <>
            <Panel pad={false} title="Triángulo resuelto" eyebrow="Azul: dato · Verde: calculado" actions={<Badge tone="ok">✓ comprobado</Badge>}>
              <RightTriangleView a={V.a / scale} b={V.b / scale} box={{ w: 10, h: 8 }} showRoles={false} showValues={false} thetaText={`A = ${fmt(V.A, 1)}°`}
                ariaLabel={`Triángulo con a = ${fmt(V.a)}, b = ${fmt(V.b)}, c = ${fmt(V.c)}`} />
              <div className="grid grid-cols-3 gap-2 border-t border-line p-3 sm:grid-cols-5">
                {FIELDS.map((f) => (
                  <div key={f.k} className="min-w-0">
                    <div className="eyebrow">{f.k}</div>
                    <div className="num truncate text-[17px] font-semibold" style={{ color: on.includes(f.k) ? 'rgb(var(--adj))' : 'rgb(var(--ok))' }}>{fmt(V[f.k], 3)}{f.unit}</div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Procedimiento" eyebrow={`${res.steps.length} pasos`} actions={<>
              <Button size="sm" variant="ghost" onClick={() => setStepMode(!stepMode)}>{stepMode ? 'Ver todo de una vez' : 'Paso a paso'}</Button>
              <Button size="sm" variant="ghost" onClick={() => save('Triángulo resuelto', res.steps.map((s, i) => `${i + 1}. ${s.title}\n${s.lines.join('\n')}`).join('\n\n'), 'ejercicio')}>Guardar</Button>
            </>}>
              {stepMode ? <Reveal key={JSON.stringify(inputs)} steps={stepNodes} label="Siguiente paso" /> : (
                <ol className="space-y-3">{stepNodes.map((n, i) => <li key={i} className="flex gap-2.5"><span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panel2 text-[11px] text-muted">{i + 1}</span><div className="min-w-0 flex-1">{n}</div></li>)}</ol>
              )}
            </Panel>
            <Callout title="Estrategia general">
              <RichText text={`1) Si conoces un ángulo agudo, el otro sale gratis: $A + B = 90°$. 2) Para cada lado que falte, mira **qué lados intervienen** respecto del ángulo y elige SOH, CAH o TOA. 3) Con dos lados, usa **Pitágoras** para el tercero y una **razón inversa** para el ángulo. 4) **Comprueba** siempre con una relación distinta a la que usaste. Aquí: $a^2 + b^2 = ${tex(V.a * V.a + V.b * V.b, 3)} = c^2$.`} />
            </Callout>
          </>
        )}
      </div>
    </div>
  );
}
