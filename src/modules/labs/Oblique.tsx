import { useMemo, useState } from 'react';
import { Badge, Button, Callout, Panel, Readout, Reveal, Segmented, Slider } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import { signedArea, triangleFromPoints, type Pt } from '../../math/geometry';
import { solveOblique, type OKey, type OSolution } from '../../math/oblique';
import { cosDeg, sinDeg } from '../../math/trig';
import { Arc, DraggablePoint, Dot, Label, Plane, Poly, Seg, usePlane } from '../../visualizations/Plane';
import { useLab } from '../../utils/useLab';

const VIEW = { xmin: -1, xmax: 11, ymin: -1.5, ymax: 8 };

function Circle({ c, r, tone = 'hyp', dash = true }: { c: Pt; r: number; tone?: string; dash?: boolean }) {
  const { sx, sy, k, px } = usePlane();
  return <circle cx={sx(c.x)} cy={sy(c.y)} r={k * r} fill="none" stroke={`rgb(var(--${tone}))`} strokeOpacity={0.6} strokeWidth={px(1.5)} strokeDasharray={dash ? `${px(5)} ${px(4)}` : undefined} pointerEvents="none" />;
}

/** Circuncentro: punto equidistante de los tres vértices. */
function circumcenter(A: Pt, B: Pt, C: Pt): Pt {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  const a2 = A.x ** 2 + A.y ** 2, b2 = B.x ** 2 + B.y ** 2, c2 = C.x ** 2 + C.y ** 2;
  return { x: (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d, y: (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d };
}

/** Dibuja un triángulo con nombres de vértices y lados (a frente a A, etc.). */
function TriangleFigure({ A, B, C, labels = true }: { A: Pt; B: Pt; C: Pt; labels?: boolean }) {
  const ccw = signedArea(A, B, C) > 0 ? 1 : -1;
  const out = (p: Pt, q: Pt) => { const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1; return { dx: (dy / L) * 15 * ccw, dy: (dx / L) * 15 * ccw }; };
  const mid = (p: Pt, q: Pt) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  return (
    <>
      <Poly pts={[A, B, C]} tone="accent" fillOpacity={0.08} strokeTone="ink" width={2.4} />
      {labels && (
        <>
          <Label at={mid(B, C)} {...out(B, C)} tone="opp" size={13} bg>a</Label>
          <Label at={mid(C, A)} {...out(C, A)} tone="adj" size={13} bg>b</Label>
          <Label at={mid(A, B)} {...out(A, B)} tone="hyp" size={13} bg>c</Label>
        </>
      )}
    </>
  );
}

function Explore() {
  const { act, save } = useLab('m15');
  const [V, setV] = useState<[Pt, Pt, Pt]>([{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 3.5, y: 6 }]);
  const [layer, setLayer] = useState<'sines' | 'cosines'>('sines');
  const [A, B, C] = V;
  const flat = Math.abs(signedArea(A, B, C)) < 0.05;
  const info = triangleFromPoints(A, B, C, 0.005, 0.5);
  const [a, b, c] = info.sides;
  const [aA, aB, aC] = info.angles;
  const O = flat ? null : circumcenter(A, B, C);
  const R = O ? Math.hypot(O.x - A.x, O.y - A.y) : 0;
  const corr = -2 * a * b * cosDeg(aC);
  const move = (i: number) => (p: Pt) => { setV((vs) => vs.map((x, j) => (j === i ? p : x)) as [Pt, Pt, Pt]); act(); };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Panel pad={false} title="Arrastra los vértices" eyebrow="Cualquier triángulo" actions={<Segmented size="sm" value={layer} onChange={setLayer} options={[{ value: 'sines', label: 'Ley del seno' }, { value: 'cosines', label: 'Ley del coseno' }]} />}>
        <Plane view={VIEW} ariaLabel="Triángulo con vértices arrastrables">
          {layer === 'sines' && O && R < 30 && <><Circle c={O} r={R} /><Dot at={O} tone="hyp" r={3} /><Seg a={O} b={A} tone="hyp" width={1.2} dash={3} /><Label at={{ x: (O.x + A.x) / 2, y: (O.y + A.y) / 2 }} dx={-8} dy={-8} tone="hyp" size={11} bg>R</Label></>}
          {!flat && <TriangleFigure A={A} B={B} C={C} />}
          {!flat && (
            <>
              <Arc c={A} from={(Math.atan2(B.y - A.y, B.x - A.x) * 180) / Math.PI} to={(Math.atan2(B.y - A.y, B.x - A.x) * 180) / Math.PI + ((signedArea(A, B, C) > 0 ? 1 : -1) * aA)} r={22} tone={layer === 'cosines' ? 'muted' : 'ang'} />
              <Arc c={C} from={(Math.atan2(A.y - C.y, A.x - C.x) * 180) / Math.PI} to={(Math.atan2(A.y - C.y, A.x - C.x) * 180) / Math.PI + ((signedArea(A, B, C) > 0 ? 1 : -1) * aC)} r={22} tone="ang" />
            </>
          )}
          {V.map((p, i) => <DraggablePoint key={i} at={p} label={'ABC'[i]} snap={0.5} tone={(['accent', 'hyp', 'ang'] as const)[i]} onChange={move(i)} />)}
        </Plane>
      </Panel>
      <div className="space-y-4">
        {flat ? <Callout tone="bad" title="Puntos alineados">No hay triángulo: mueve un vértice.</Callout> : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Readout label="a / A" value={fmt(a, 2)} tone="opp" sub={`${fmt(aA, 1)}°`} />
              <Readout label="b / B" value={fmt(b, 2)} tone="adj" sub={`${fmt(aB, 1)}°`} />
              <Readout label="c / C" value={fmt(c, 2)} tone="hyp" sub={`${fmt(aC, 1)}°`} />
            </div>
            {layer === 'sines' ? (
              <Panel title="Ley del seno" eyebrow="Se comprueba en vivo">
                <div className="overflow-x-auto"><Tex display>{'\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R'}</Tex></div>
                <div className="num mt-2 space-y-1 text-[14px]">
                  <div><RichText text={`$\\dfrac{${tex(a, 2)}}{\\sin ${tex(aA, 1)}°} \\approx ${tex(a / sinDeg(aA), 4)}$`} /></div>
                  <div><RichText text={`$\\dfrac{${tex(b, 2)}}{\\sin ${tex(aB, 1)}°} \\approx ${tex(b / sinDeg(aB), 4)}$`} /></div>
                  <div><RichText text={`$\\dfrac{${tex(c, 2)}}{\\sin ${tex(aC, 1)}°} \\approx ${tex(c / sinDeg(aC), 4)}$`} /></div>
                  <div className="text-hyp"><RichText text={`$2R \\approx ${tex(2 * R, 4)}$ (diámetro del círculo punteado)`} /></div>
                </div>
                <p className="mt-2 text-[13.5px] text-muted"><RichText text="**Por qué:** todo triángulo cabe en un círculo que pasa por sus tres vértices. Cada lado es una cuerda de ese círculo, y una cuerda mide $2R\sin(\text{ángulo opuesto})$. Por eso los tres cocientes dan el mismo número: el diámetro." /></p>
              </Panel>
            ) : (
              <Panel title="Ley del coseno" eyebrow="Pitágoras corregido">
                <div className="overflow-x-auto"><Tex display>{'c^2 = a^2 + b^2 - 2ab\\cos C'}</Tex></div>
                <div className="num mt-2 space-y-1 text-[14px]">
                  <div><RichText text={`$a^2 + b^2 = ${tex(a * a + b * b, 3)}$`} /></div>
                  <div><RichText text={`$-2ab\\cos C = ${tex(corr, 3)}$ ${corr < -0.01 ? '(C agudo: resta)' : corr > 0.01 ? '(C obtuso: suma)' : '(C ≈ 90°: no corrige)'}`} /></div>
                  <div className="font-semibold"><RichText text={`$c^2 = ${tex(c * c, 3)}$ ✔`} /></div>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="text-[12px] text-muted">Comparación de áreas</div>
                  <div className="flex h-3 overflow-hidden rounded bg-panel2"><div className="bg-opp/70" style={{ width: `${(a * a / Math.max(a * a + b * b, c * c)) * 100}%` }} /><div className="bg-adj/70" style={{ width: `${(b * b / Math.max(a * a + b * b, c * c)) * 100}%` }} /></div>
                  <div className="flex h-3 overflow-hidden rounded bg-panel2"><div className="bg-hyp/70" style={{ width: `${(c * c / Math.max(a * a + b * b, c * c)) * 100}%` }} /></div>
                  <div className="text-[12px] text-muted">arriba a² + b² · abajo c²</div>
                </div>
                <p className="mt-2 text-[13.5px] text-muted"><RichText text="Lleva C a 90° (arrastra el vértice C): el término de corrección se anula y aparece **Pitágoras**. La ley del coseno es Pitágoras generalizado a cualquier triángulo." /></p>
              </Panel>
            )}
            <Button size="sm" variant="ghost" onClick={() => save('Ley del seno y del coseno', `a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}; A = ${fmt(aA, 1)}°, B = ${fmt(aB, 1)}°, C = ${fmt(aC, 1)}°\n$\\dfrac{a}{\\sin A} \\approx ${tex(a / sinDeg(aA), 3)}$ (= 2R)\n$c^2 = a^2 + b^2 - 2ab\\cos C \\approx ${tex(c * c, 3)}$`, 'descubrimiento')}>Guardar en el cuaderno</Button>
          </>
        )}
      </div>
    </div>
  );
}

const FIELDS: { k: OKey; label: string; unit: string }[] = [
  { k: 'a', label: 'Lado a', unit: '' }, { k: 'b', label: 'Lado b', unit: '' }, { k: 'c', label: 'Lado c', unit: '' },
  { k: 'A', label: 'Ángulo A', unit: '°' }, { k: 'B', label: 'Ángulo B', unit: '°' }, { k: 'C', label: 'Ángulo C', unit: '°' },
];
const EXAMPLES: { name: string; v: Partial<Record<OKey, number>> }[] = [
  { name: 'LLL: 7, 9, 11', v: { a: 7, b: 9, c: 11 } },
  { name: 'LAL: a = 8, b = 5, C = 110°', v: { a: 8, b: 5, C: 110 } },
  { name: 'AAL: A = 40°, B = 65°, a = 12', v: { A: 40, B: 65, a: 12 } },
  { name: 'LLA ambiguo: a = 8, b = 10, A = 40°', v: { a: 8, b: 10, A: 40 } },
];

function SolutionView({ s }: { s: OSolution }) {
  const pts = useMemo(() => {
    const A = { x: 0, y: 0 }, B = { x: s.c, y: 0 }, C = { x: s.b * cosDeg(s.A), y: s.b * sinDeg(s.A) };
    const xs = [A.x, B.x, C.x], ys = [A.y, B.y, C.y];
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const m = Math.max(w, h) * 0.15;
    return { A, B, C, view: { xmin: Math.min(...xs) - m, xmax: Math.max(...xs) + m, ymin: -m, ymax: Math.max(...ys) + m } };
  }, [s]);
  return (
    <div className="mx-auto max-w-[420px] overflow-hidden rounded-lg border border-line">
      <Plane view={pts.view} W={420} grid={false} axes={false} ariaLabel="Triángulo resuelto" maxHeight="260px">
        <TriangleFigure A={pts.A} B={pts.B} C={pts.C} />
        <Label at={pts.A} dx={-10} dy={10} size={12}>A</Label><Label at={pts.B} dx={10} dy={10} size={12}>B</Label><Label at={pts.C} dy={-12} size={12}>C</Label>
      </Plane>
    </div>
  );
}

function Solver() {
  const { act, save } = useLab('m15');
  const [vals, setVals] = useState<Record<OKey, string>>({ a: '8', b: '10', c: '', A: '40', B: '', C: '' });
  const [on, setOn] = useState<OKey[]>(['a', 'b', 'A']);
  const [idx, setIdx] = useState(0);
  const inputs = useMemo(() => {
    const r: Partial<Record<OKey, number>> = {};
    for (const k of on) { const v = Number(vals[k].replace(',', '.')); if (vals[k].trim() !== '' && Number.isFinite(v)) r[k] = v; }
    return r;
  }, [vals, on]);
  const res = useMemo(() => solveOblique(inputs), [inputs]);
  const sol = res.solutions[Math.min(idx, res.solutions.length - 1)];
  const toggle = (k: OKey) => { act(); setIdx(0); setOn((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : cur.length >= 3 ? [...cur.slice(1), k] : [...cur, k])); };
  const load = (v: Partial<Record<OKey, number>>) => {
    const nv = { a: '', b: '', c: '', A: '', B: '', C: '' } as Record<OKey, string>;
    (Object.keys(v) as OKey[]).forEach((k) => { nv[k] = String(v[k]); });
    setVals(nv); setOn(Object.keys(v) as OKey[]); setIdx(0); act();
  };
  return (
    <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Panel title="Datos" eyebrow="Marca exactamente tres">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {FIELDS.map((f) => {
              const active = on.includes(f.k);
              const computed = sol ? sol[f.k] : undefined;
              return (
                <div key={f.k} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${active ? 'border-accent bg-accent/5' : 'border-line'}`}>
                  <input id={`ob-chk-${f.k}`} type="checkbox" checked={active} onChange={() => toggle(f.k)} className="h-4 w-4" />
                  <label htmlFor={`ob-chk-${f.k}`} className="flex-1 text-[14px] font-medium">{f.label}</label>
                  <input aria-label={f.label} disabled={!active} value={active ? vals[f.k] : computed !== undefined ? fmt(computed, 3) : ''} onChange={(e) => { setVals({ ...vals, [f.k]: e.target.value }); act(); }} inputMode="decimal"
                    className={`num h-9 w-24 rounded-md border px-2 text-right ${active ? 'border-line bg-panel2' : 'border-transparent bg-transparent font-semibold text-accent'}`} />
                  <span className="num w-3 text-muted">{f.unit}</span>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title="Ejemplos" eyebrow="Un caso de cada tipo">
          <div className="grid gap-2">{EXAMPLES.map((e) => <Button key={e.name} size="sm" variant="soft" className="justify-start" onClick={() => load(e.v)}>{e.name}</Button>)}</div>
        </Panel>
      </div>
      <div className="space-y-4">
        {!res.ok ? <Callout tone="warn" title="Revisemos los datos">{res.error}</Callout> : sol && (
          <>
            <div className="flex flex-wrap items-center gap-2"><Badge tone="accent">Caso {res.caseName}</Badge><span className="text-[14px] text-muted">{res.caseText}</span></div>
            {res.note && <Callout tone={res.solutions.length === 2 ? 'warn' : 'muted'} title={res.solutions.length === 2 ? 'Dos triángulos posibles' : 'Caso ambiguo resuelto'}>{res.note}</Callout>}
            {res.solutions.length > 1 && <Segmented value={String(idx)} onChange={(v) => setIdx(Number(v))} options={res.solutions.map((_, i) => ({ value: String(i), label: `Solución ${i + 1}` }))} />}
            <Panel title={`Triángulo ${res.solutions.length > 1 ? idx + 1 : 'resuelto'}`} eyebrow="Dibujado a escala">
              <SolutionView s={sol} />
              <div className="num mt-3 grid grid-cols-3 gap-2 text-[14px] sm:grid-cols-6">
                {FIELDS.map((f) => <div key={f.k}><div className="eyebrow">{f.k}</div><div className="font-semibold" style={{ color: on.includes(f.k) ? 'rgb(var(--adj))' : 'rgb(var(--ok))' }}>{fmt(sol[f.k], 3)}{f.unit}</div></div>)}
              </div>
            </Panel>
            <Panel title="Procedimiento" eyebrow={`${sol.steps.length} pasos`} actions={<Button size="sm" variant="ghost" onClick={() => save(`Triángulo ${res.caseName}`, sol.steps.map((s, i) => `${i + 1}. ${s.title}\n${s.lines.join('\n')}`).join('\n\n'), 'ejercicio')}>Guardar</Button>}>
              <Reveal key={JSON.stringify(inputs) + idx} steps={sol.steps.map((s, i) => <div key={i}><div className="font-semibold">{s.title}</div><div className="mt-0.5 space-y-1 text-[14.5px]">{s.lines.map((l, j) => <div key={j} className="overflow-x-auto"><RichText text={l} /></div>)}</div></div>)} />
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function Ambiguous() {
  const { act } = useLab('m15');
  const [Aang, setA] = useState(35);
  const [b, setB] = useState(7);
  const [a, setAside] = useState(5);
  const C = { x: b * cosDeg(Aang), y: b * sinDeg(Aang) };
  const h = b * sinDeg(Aang); // altura desde C
  const disc = a * a - h * h;
  const xs = disc < -1e-9 ? [] : disc < 1e-9 ? [C.x] : [C.x - Math.sqrt(disc), C.x + Math.sqrt(disc)];
  const valid = xs.filter((x) => x > 1e-6);
  const view = { xmin: -1, xmax: 13, ymin: -1.5, ymax: 8.5 };
  const n = valid.length;
  const msg = n === 0 ? (a < h ? `a = ${fmt(a)} es menor que la altura h = ${fmt(h)}: el lado no alcanza la base. **Ningún triángulo.**` : 'El círculo corta la base solo a la izquierda de A: **ningún triángulo** válido.')
    : n === 1 ? (Math.abs(disc) < 1e-9 ? `a = h: el lado toca la base en un solo punto, formando un ángulo recto. **Un triángulo (rectángulo).**` : `a ≥ b: el lado corta la base una sola vez del lado correcto. **Un triángulo.**`)
      : `h < a < b: el lado puede caer en **dos** posiciones. **Dos triángulos distintos** con los mismos datos.`;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Panel pad={false} title="Caso ambiguo (LLA)" eyebrow="Conoces A, b y a: ¿cuántos triángulos hay?">
        <Plane view={view} ariaLabel={`Caso ambiguo: ${n} triángulos`}>
          <Seg a={{ x: 0, y: 0 }} b={{ x: 13, y: 0 }} tone="muted" width={1.5} />
          <Arc c={{ x: 0, y: 0 }} from={0} to={Aang} r={30} />
          <Seg a={{ x: 0, y: 0 }} b={C} tone="adj" width={3} />
          <Seg a={C} b={{ x: C.x, y: 0 }} tone="muted" width={1.2} dash={4} />
          <Label at={{ x: C.x, y: h / 2 }} dx={-6} anchor="end" tone="muted" size={11} bg>h = {fmt(h)}</Label>
          <Circle c={C} r={a} tone="opp" />
          {valid.map((x, i) => (
            <g key={i}>
              <Poly pts={[{ x: 0, y: 0 }, { x, y: 0 }, C]} tone={i === 0 ? 'accent' : 'ang'} fillOpacity={0.12} stroke={false} />
              <Seg a={C} b={{ x, y: 0 }} tone="opp" width={3} />
              <Dot at={{ x, y: 0 }} tone={i === 0 ? 'accent' : 'ang'} r={5} />
              <Label at={{ x, y: 0 }} dy={16} tone={i === 0 ? 'accent' : 'ang'} size={12}>B{n > 1 ? i + 1 : ''}</Label>
            </g>
          ))}
          <Label at={{ x: 0, y: 0 }} dx={-10} dy={10} size={12}>A</Label>
          <Label at={C} dy={-14} size={12}>C</Label>
          <Label at={{ x: C.x / 2, y: C.y / 2 }} dx={-10} dy={-8} anchor="end" tone="adj" size={12} bg>b</Label>
        </Plane>
      </Panel>
      <div className="space-y-4">
        <Panel title="Datos" eyebrow="Mueve a y observa">
          <div className="space-y-2">
            <Slider id="amb-A" label="Ángulo A" value={Aang} min={15} max={80} step={1} unit="°" color="ang" onChange={(v) => { setA(v); act(); }} />
            <Slider id="amb-b" label="Lado b (AC)" value={b} min={3} max={9} step={0.1} color="adj" onChange={(v) => { setB(v); act(); }} />
            <Slider id="amb-a" label="Lado a (CB, el que 'cuelga')" value={a} min={1} max={11} step={0.1} color="opp" onChange={(v) => { setAside(v); act(); }} />
          </div>
        </Panel>
        <Callout tone={n === 2 ? 'warn' : n === 1 ? 'ok' : 'bad'} title={`${n} ${n === 1 ? 'triángulo' : 'triángulos'}`}><RichText text={msg} /></Callout>
        <Panel title="Por qué pasa" eyebrow="La ley del seno da dos ángulos">
          <p className="text-[14px]"><RichText text={`Al despejar $\\sin B = \\dfrac{b\\sin A}{a}$, hay **dos** ángulos entre 0° y 180° con ese seno: $B$ y $180° - B$. El dibujo muestra ambos: el círculo de radio $a$ centrado en C corta la base en ${n === 2 ? 'dos puntos' : n === 1 ? 'un punto' : 'ningún punto'}. Siempre que tengas **LLA**, revisa si existe la segunda solución.`} /></p>
        </Panel>
      </div>
    </div>
  );
}

export default function ObliqueLab() {
  const [mode, setMode] = useState<'explore' | 'solve' | 'amb'>('explore');
  return (
    <div className="space-y-4">
      <Segmented value={mode} onChange={setMode} ariaLabel="Modo" options={[{ value: 'explore', label: 'Explorar leyes' }, { value: 'solve', label: 'Solucionador' }, { value: 'amb', label: 'Caso ambiguo' }]} />
      {mode === 'explore' ? <Explore /> : mode === 'solve' ? <Solver /> : <Ambiguous />}
    </div>
  );
}
