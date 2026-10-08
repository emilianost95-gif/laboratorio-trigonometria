import { useState } from 'react';
import { Badge, Button, Callout, Panel, Readout, Segmented, Slider } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import { cosDeg, exactTex, sinDeg, tanDeg } from '../../math/trig';
import { Arc, Dot, InfLine, Label, Plane, Poly, RightMark, Seg, usePlane } from '../../visualizations/Plane';
import { RightTriangleView, type Role } from '../../visualizations/RightTriangleView';
import { useLab } from '../../utils/useLab';

type Fn = 'sin' | 'cos' | 'tan';

const CFG: Record<Fn, { name: string; module: string; num: Role; den: Role; numName: string; denName: string; tex: string; f: (d: number) => number; grow: string; meaning: string }> = {
  sin: { name: 'seno', module: 'm8', num: 'opp', den: 'hyp', numName: 'opuesto', denName: 'hipotenusa', tex: '\\sin', f: sinDeg, grow: 'crece de 0 a 1', meaning: 'qué fracción de la hipotenusa se convierte en **altura**' },
  cos: { name: 'coseno', module: 'm9', num: 'adj', den: 'hyp', numName: 'adyacente', denName: 'hipotenusa', tex: '\\cos', f: cosDeg, grow: 'decrece de 1 a 0', meaning: 'qué fracción de la hipotenusa se convierte en **avance horizontal** (la "sombra" del lado inclinado)' },
  tan: { name: 'tangente', module: 'm10', num: 'opp', den: 'adj', numName: 'opuesto', denName: 'adyacente', tex: '\\tan', f: tanDeg, grow: 'crece de 0 hacia infinito', meaning: 'cuánto se **sube** por cada unidad que se **avanza**: es una **pendiente**' },
};

type Phase = 'observe' | 'experiment' | 'discover' | 'formalize';
const PHASES: { value: Phase; label: string }[] = [
  { value: 'observe', label: '1 · Observar' },
  { value: 'experiment', label: '2 · Experimentar' },
  { value: 'discover', label: '3 · Descubrir' },
  { value: 'formalize', label: '4 · Formalizar' },
];

/** Gráfica de f(θ) en [0°, 90°] con el punto actual (eje Y reescalado para que la curva se vea). */
function FnGraph({ fn, theta }: { fn: Fn; theta: number }) {
  const f = CFG[fn].f;
  const ymax = fn === 'tan' ? 4 : 1.15;
  const kY = (90 / ymax) * 0.55;
  const V = { xmin: -8, xmax: 96, ymin: -0.18 * ymax * kY, ymax: ymax * kY };
  const v = f(theta);
  return (
    <Plane view={V} W={520} grid={false} axes ariaLabel={`Gráfica de ${CFG[fn].name} entre 0 y 90 grados`} xTickStep={30} yTickStep={(fn === 'tan' ? 1 : 0.5) * kY}
      tickFormat={(x) => `${x}°`} yTickFormat={(y) => String(+(y / kY).toFixed(2)).replace('.', ',')}>
      <Curve fn={fn} kY={kY} ymax={ymax} />
      {v <= ymax && <Dot at={{ x: theta, y: v * kY }} tone="ang" r={6} />}
      <Seg a={{ x: theta, y: 0 }} b={{ x: theta, y: Math.min(ymax, v) * kY }} tone="ang" dash={3} width={1.4} />
      <Label at={{ x: theta, y: Math.min(ymax * 0.9, v) * kY }} dx={theta > 55 ? -12 : 12} dy={-14} anchor={theta > 55 ? 'end' : 'start'} tone="ang" size={12} bg>{`${CFG[fn].tex.slice(1)} ${fmt(theta, 0)}° ≈ ${fmt(v, 3)}`}</Label>
    </Plane>
  );
}

function Curve({ fn, kY, ymax }: { fn: Fn; kY: number; ymax: number }) {
  const { sx, sy, px } = usePlane();
  const f = CFG[fn].f;
  const pts: string[] = [];
  for (let d = 0; d <= 90; d += 0.5) {
    const v = f(d);
    if (!Number.isFinite(v) || v > ymax * 1.05) break;
    pts.push(`${sx(d)},${sy(v * kY)}`);
  }
  return <polyline points={pts.join(' ')} fill="none" stroke="rgb(var(--accent))" strokeWidth={px(2.5)} />;
}

/** Vista de tangente sobre el plano: el lado inclinado es una recta por el origen con pendiente tan θ. */
function TanPlane({ theta, adj }: { theta: number; adj: number }) {
  const opp = adj * tanDeg(theta);
  const view = { xmin: -1, xmax: 9.2, ymin: -1, ymax: 6.5 };
  const B = { x: adj, y: opp };
  return (
    <Plane view={view} ariaLabel={`Recta de pendiente tan ${fmt(theta)}°`}>
      <InfLine a={{ x: 0, y: 0 }} b={{ x: 1, y: tanDeg(theta) }} tone="hyp" width={2} opacity={0.5} dash={6} />
      <Poly pts={[{ x: 0, y: 0 }, { x: adj, y: 0 }, B]} tone="accent" fillOpacity={0.07} stroke={false} />
      <Seg a={{ x: 0, y: 0 }} b={{ x: adj, y: 0 }} tone="adj" width={4.5} />
      <Seg a={{ x: adj, y: 0 }} b={B} tone="opp" width={4.5} />
      <Seg a={{ x: 0, y: 0 }} b={B} tone="hyp" width={2} opacity={0.6} />
      <RightMark at={{ x: adj, y: 0 }} u={{ x: -1, y: 0 }} v={{ x: 0, y: 1 }} />
      <Arc c={{ x: 0, y: 0 }} from={0} to={theta} r={34} />
      <Label at={{ x: 0, y: 0 }} dx={52} dy={-14} tone="ang">θ</Label>
      <Label at={{ x: adj / 2, y: 0 }} dy={16} tone="adj" bg>Δx = {fmt(adj)}</Label>
      {opp < 7.6 && <Label at={{ x: adj, y: opp / 2 }} dx={10} anchor="start" tone="opp" bg>Δy = {fmt(opp)}</Label>}
      {/* unidad: por cada 1 que avanza, sube tan θ */}
      {tanDeg(theta) < 7 && <><Seg a={{ x: 0, y: 0 }} b={{ x: 1, y: 0 }} tone="ink" width={2} /><Seg a={{ x: 1, y: 0 }} b={{ x: 1, y: tanDeg(theta) }} tone="ang" width={3} /><Label at={{ x: 1, y: tanDeg(theta) / 2 }} dx={-8} anchor="end" tone="ang" size={11} bg>tan θ</Label></>}
    </Plane>
  );
}

const BOX = { w: 10, h: 8 };

export default function RatioLab({ fn }: { fn: Fn }) {
  const cfg = CFG[fn];
  const { act, save } = useLab(cfg.module);
  const [phase, setPhase] = useState<Phase>('observe');
  const [theta, setTheta] = useState(30);
  const [size, setSize] = useState(fn === 'tan' ? 6 : 8); // hipotenusa (sin/cos) o adyacente (tan)
  const [rows, setRows] = useState<{ theta: number; num: number; den: number }[]>([]);
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);

  // Geometría: θ en A. a = vertical (opuesto), b = horizontal (adyacente)
  let a: number, b: number, c: number;
  if (fn === 'tan') { b = size; a = size * tanDeg(theta); c = Math.hypot(a, b); }
  else { c = size; a = c * sinDeg(theta); b = c * cosDeg(theta); }
  // evitar que el dibujo se salga de la caja
  const fit = Math.min(1, BOX.w / b, BOX.h / a);
  const val = (r: Role) => (r === 'opp' ? a : r === 'adj' ? b : c);
  const num = val(cfg.num), den = val(cfg.den);
  const ratio = num / den;
  const sizeLabel = fn === 'tan' ? 'Tamaño (cateto adyacente)' : 'Tamaño (hipotenusa)';
  const thetaMax = fn === 'tan' ? 80 : 89;

  const triangle = fn === 'tan' && phase !== 'observe'
    ? <TanPlane theta={theta} adj={Math.min(size, 8)} />
    : <RightTriangleView a={a * fit} b={b * fit} box={BOX} highlight={[cfg.num, cfg.den]} showValues={false} showRoles thetaText={`θ = ${fmt(theta, 1)}°`} ariaLabel={`Triángulo con θ = ${fmt(theta)}°`} />;

  const record = () => { setRows((r) => [...r.slice(-9), { theta, num, den }]); act(); };
  const sameTheta = rows.filter((r) => r.theta === theta);
  const ratioTex = `${cfg.tex}\\theta = \\dfrac{\\text{${cfg.numName}}}{\\text{${cfg.denName}}}`;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto scroll-thin"><Segmented value={phase} onChange={(p) => { setPhase(p); act(); }} ariaLabel="Fase" options={PHASES} /></div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Panel pad={false} title={fn === 'tan' && phase !== 'observe' ? 'La tangente como pendiente' : `Triángulo: ${cfg.numName} y ${cfg.denName}`} eyebrow={`Laboratorio de ${cfg.name}`}>
            {triangle}
          </Panel>
          <div className="grid grid-cols-3 gap-2">
            <Readout label={cfg.numName} value={fmt(num)} tone={cfg.num} />
            <Readout label={cfg.denName} value={fmt(den)} tone={cfg.den} />
            <Readout label={`${cfg.numName} ÷ ${cfg.denName}`} value={fmt(ratio, 4)} tone="ang" sub={phase === 'formalize' ? `= ${cfg.tex.slice(1)} ${fmt(theta, 1)}°` : 'la razón'} />
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Controles" eyebrow={phase === 'experiment' ? 'Cambia el tamaño sin cambiar θ' : 'Mueve θ'}>
            <div className="space-y-2">
              <Slider id={`${fn}-theta`} label="Ángulo θ" value={theta} min={1} max={thetaMax} step={1} unit="°" color="ang" onChange={(v) => { setTheta(v); act(); }} />
              {phase !== 'observe' && <Slider id={`${fn}-size`} label={sizeLabel} value={size} min={1} max={fn === 'tan' ? 9 : 12} step={0.1} color={fn === 'tan' ? 'adj' : 'hyp'} onChange={(v) => { setSize(v); act(); }} />}
            </div>
          </Panel>

          {phase === 'observe' && (
            <Panel title="Observa" eyebrow="Sin fórmulas todavía">
              <p className="text-[14.5px]"><RichText text={`Mueve **θ** despacio. Mira los dos lados resaltados: el **${cfg.numName}** y ${cfg.den === 'hyp' ? 'la' : 'el'} **${cfg.denName}**. Abajo ves su cociente.`} /></p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[12px] text-muted"><span>0</span><span>{fn === 'tan' ? '5+' : '1'}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-panel2"><div className="h-full rounded-full bg-ang transition-[width] duration-150" style={{ width: `${Math.min(100, (ratio / (fn === 'tan' ? 5 : 1)) * 100)}%` }} /></div>
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[13.5px] text-muted">
                <li>¿Qué pasa con el cociente cuando θ es muy pequeño?</li>
                <li>¿Y cuando θ se acerca a 90°?</li>
                {fn !== 'tan' && <li>¿Puede el cociente pasar de 1? ¿Por qué?</li>}
                {fn === 'tan' && <li>¿Cuánto vale cuando θ = 45°? ¿Qué tienen de especial los catetos ahí?</li>}
              </ul>
              <Button className="mt-3" size="sm" variant="primary" onClick={() => setPhase('experiment')}>Pasar a experimentar →</Button>
            </Panel>
          )}

          {phase === 'experiment' && (
            <Panel title="Registra mediciones" eyebrow="Experimento" actions={<Button size="sm" variant="primary" onClick={record}>Registrar</Button>}>
              <p className="mb-2 text-[13.5px]">Registra <strong>3 mediciones con el mismo θ</strong> y tamaños distintos. Después cambia θ y repite.</p>
              <div className="overflow-x-auto">
                <table className="num w-full text-[13px]">
                  <thead><tr className="text-left text-muted"><th className="py-1 font-medium">θ</th><th className="font-medium">{cfg.numName.slice(0, 3)}.</th><th className="font-medium">{cfg.denName.slice(0, 3)}.</th><th className="font-medium">cociente</th></tr></thead>
                  <tbody>
                    {rows.length === 0 && <tr><td colSpan={4} className="py-2 text-muted">Aún no hay mediciones.</td></tr>}
                    {rows.map((r, i) => (
                      <tr key={i} className={`border-t border-line ${r.theta === theta ? 'text-ink' : 'text-muted'}`}>
                        <td className="py-1">{r.theta}°</td><td>{fmt(r.num)}</td><td>{fmt(r.den)}</td><td className="font-semibold" style={{ color: r.theta === theta ? 'rgb(var(--ang))' : undefined }}>{fmt(r.num / r.den, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sameTheta.length >= 3 && <Callout tone="ok" title="¿Lo notas?">Con θ = {theta}° registraste {sameTheta.length} triángulos de distinto tamaño… y el cociente es el mismo.</Callout>}
              <div className="mt-2 flex gap-2">
                {rows.length > 0 && <Button size="sm" variant="ghost" onClick={() => setRows([])}>Borrar tabla</Button>}
                <Button size="sm" variant="soft" onClick={() => setPhase('discover')}>Pasar a descubrir →</Button>
              </div>
            </Panel>
          )}

          {phase === 'discover' && (
            <Panel title="¿Qué descubriste?" eyebrow="Preguntas">
              <p className="text-[14px] font-medium">1. Si agrandas el triángulo <em>sin cambiar θ</em>, el cociente {cfg.numName}/{cfg.denName}…</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {['aumenta', 'disminuye', 'se mantiene igual', 'depende del tamaño'].map((o, i) => (
                  <Button key={o} size="sm" variant={q1 === i ? (i === 2 ? 'primary' : 'danger') : 'outline'} onClick={() => { setQ1(i); act(); }}>{o}</Button>
                ))}
              </div>
              {q1 !== null && (
                <div className="mt-2">
                  <Callout tone={q1 === 2 ? 'ok' : 'warn'}>
                    {q1 === 2 ? <RichText text="¡Exacto! Al agrandar, **ambos** lados crecen en la misma proporción (triángulos **semejantes**), así que su cociente no cambia. **El cociente depende solo del ángulo.**" /> : 'Vuelve a la fase 2: deja θ fijo, mueve el tamaño y mira la columna "cociente". Ambos lados crecen en la misma proporción…'}
                  </Callout>
                </div>
              )}
              {q1 === 2 && (
                <>
                  <p className="mt-3 text-[14px] font-medium">2. Cuando θ va de 0° a 90°, el cociente…</p>
                  <div className="mt-2 grid gap-2">
                    {['crece de 0 a 1', 'decrece de 1 a 0', 'crece de 0 hacia infinito', 'se mantiene constante'].map((o, i) => {
                      const correct = ['crece de 0 a 1', 'decrece de 1 a 0', 'crece de 0 hacia infinito'].indexOf(cfg.grow);
                      return <Button key={o} size="sm" variant={q2 === i ? (i === correct ? 'primary' : 'danger') : 'outline'} onClick={() => { setQ2(i); act(); }}>{o}</Button>;
                    })}
                  </div>
                  {q2 !== null && (
                    <div className="mt-2">
                      <Callout tone={['crece de 0 a 1', 'decrece de 1 a 0', 'crece de 0 hacia infinito', 'x'][q2] === cfg.grow ? 'ok' : 'warn'}>
                        {['crece de 0 a 1', 'decrece de 1 a 0', 'crece de 0 hacia infinito', 'x'][q2] === cfg.grow
                          ? <RichText text={fn === 'sin' ? 'Sí: con θ ≈ 0° el opuesto casi desaparece; con θ ≈ 90° el opuesto casi iguala a la hipotenusa. Nunca la supera: la hipotenusa es el lado mayor.' : fn === 'cos' ? 'Sí: con θ ≈ 0° el adyacente casi coincide con la hipotenusa (cociente ≈ 1); al levantarse el lado inclinado, su "sombra" horizontal se acorta hasta 0.' : 'Sí: a 45° opuesto = adyacente (tan = 1). Cerca de 90° el adyacente se achica mucho y el cociente se dispara: la recta se vuelve casi vertical.'} />
                          : 'Mueve θ en la fase 1 y observa la barra del cociente.'}
                      </Callout>
                    </div>
                  )}
                  {q2 !== null && ['crece de 0 a 1', 'decrece de 1 a 0', 'crece de 0 hacia infinito', 'x'][q2] === cfg.grow && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="primary" onClick={() => setPhase('formalize')}>Darle nombre: formalizar →</Button>
                      <Button size="sm" variant="ghost" onClick={() => save(`Descubrimiento: ${cfg.name}`, `Para un ángulo fijo, ${cfg.numName}/${cfg.denName} es siempre el mismo número, sin importar el tamaño del triángulo. Al crecer θ de 0° a 90°, el cociente ${cfg.grow}.`, 'descubrimiento')}>Guardar descubrimiento</Button>
                    </div>
                  )}
                </>
              )}
            </Panel>
          )}

          {phase === 'formalize' && (
            <Panel title={`Definición de ${cfg.name}`} eyebrow="Formalizar">
              <div className="text-center"><Tex display>{ratioTex}</Tex></div>
              <p className="mt-1 text-[14px]"><RichText text={`Como el cociente depende **solo de θ**, le damos un nombre: el **${cfg.name}** de θ. Mide ${cfg.meaning}.`} /></p>
              <div className="mt-2 text-[14px]"><RichText text={`Ahora: $${cfg.tex}(${fmt(theta, 0)}°) = \\dfrac{${tex(num)}}{${tex(den)}} \\approx ${tex(ratio, 4)}$`} /></div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-[13.5px]">
                  <thead><tr className="text-left text-muted"><th className="py-1 font-medium">θ</th>{[30, 45, 60].map((d) => <th key={d} className="font-medium">{d}°</th>)}</tr></thead>
                  <tbody><tr className="border-t border-line"><td className="py-1.5">{cfg.name}</td>{[30, 45, 60].map((d) => <td key={d}><Tex>{exactTex(fn, d) ?? ''}</Tex></td>)}</tr></tbody>
                </table>
              </div>
              {fn !== 'tan' && <p className="mt-2 text-[13px] text-muted"><RichText text={`Siempre $0 < ${cfg.tex}\\theta < 1$ para θ agudo: ${cfg.den === 'hyp' ? 'el denominador es la hipotenusa, el lado mayor' : ''}.`} /></p>}
              {fn === 'tan' && <Callout title="Tangente = pendiente"><RichText text={`Si pones el vértice de θ en el origen, el lado inclinado es una recta con $m = \\dfrac{\\Delta y}{\\Delta x} = \\dfrac{\\text{opuesto}}{\\text{adyacente}} = \\tan\\theta$. Por eso $\\tan ${fmt(theta, 0)}° \\approx ${tex(ratio, 3)}$ es la pendiente de esta recta. También: $\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta} = \\dfrac{${tex(sinDeg(theta), 3)}}{${tex(cosDeg(theta), 3)}}$.`} /></Callout>}
              <Button className="mt-3" size="sm" variant="ghost" onClick={() => save(`Fórmula: ${cfg.name}`, `$${ratioTex}$\nEjemplo: $${cfg.tex}(${fmt(theta, 0)}°) \\approx ${tex(ratio, 4)}$`, 'formula')}>Guardar fórmula</Button>
            </Panel>
          )}
        </div>
      </div>

      {phase === 'formalize' && (
        <Panel title={`Gráfica de ${cfg.name}(θ) entre 0° y 90°`} eyebrow="Cada ángulo, un valor">
          <div className="mx-auto max-w-[640px]"><FnGraph fn={fn} theta={theta} /></div>
          <div className="mt-2 flex flex-wrap gap-2"><Badge tone="ang">punto actual: θ = {theta}°</Badge><Badge>{cfg.grow}</Badge></div>
        </Panel>
      )}
    </div>
  );
}
