import { useMemo, useState } from 'react';
import { Badge, Button, Callout, Panel, Readout, Reveal, Segmented, Slider } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import { cosDeg, radTex, sinDeg, tanDeg } from '../../math/trig';
import { solveTrigEq, type TrigFn } from '../../math/trigeq';
import { Dot, InfLine, Label, Plane, Seg } from '../../visualizations/Plane';
import { FnCurve, UnitCircleOutline } from '../../visualizations/Curve';
import { useLab } from '../../utils/useLab';
import { useMediaQuery } from '../../utils/hooks';

const F: Record<TrigFn, (d: number) => number> = { sin: sinDeg, cos: cosDeg, tan: tanDeg };
const NAME: Record<TrigFn, string> = { sin: 'sen', cos: 'cos', tan: 'tan' };
const FAMILY_TONE = ['hyp', 'ang'] as const;
const U = 45; // 1 unidad horizontal = 45°
const S2 = Math.SQRT1_2, S3 = Math.sqrt(3) / 2, T3 = Math.sqrt(3);
const PRESETS: Record<TrigFn, { v: number; label: string }[]> = {
  sin: [{ v: -1, label: '−1' }, { v: -S3, label: '−√3/2' }, { v: -0.5, label: '−1/2' }, { v: 0, label: '0' }, { v: 0.5, label: '1/2' }, { v: S2, label: '√2/2' }, { v: S3, label: '√3/2' }, { v: 1, label: '1' }],
  cos: [{ v: -1, label: '−1' }, { v: -S3, label: '−√3/2' }, { v: -0.5, label: '−1/2' }, { v: 0, label: '0' }, { v: 0.5, label: '1/2' }, { v: S2, label: '√2/2' }, { v: S3, label: '√3/2' }, { v: 1, label: '1' }],
  tan: [{ v: -T3, label: '−√3' }, { v: -1, label: '−1' }, { v: 0, label: '0' }, { v: T3 / 3, label: '√3/3' }, { v: 1, label: '1' }, { v: T3, label: '√3' }],
};

const nice = (d: number) => (Math.abs(d - Math.round(d)) < 1e-6 ? Math.round(d) : d);
const degTex = (d: number) => `${tex(nice(d), 2)}°`;
const showAngle = (d: number, rad: boolean) => (rad ? (Number.isInteger(nice(d) * 2) && (nice(d) * 2) % 15 === 0 ? radTex(nice(d)) : tex((d * Math.PI) / 180, 3)) : degTex(d));

export default function EquationsLab() {
  const { act, save } = useLab('m19');
  const [fn, setFn] = useState<TrigFn>('sin');
  const [k, setKRaw] = useState(0.5);
  const [B, setBRaw] = useState(1);
  const [rad, setRad] = useState(false);
  const narrow = !useMediaQuery('(min-width: 640px)');
  const setK = (x: number) => { setKRaw(x); act(); };

  const sol = useMemo(() => solveTrigEq(fn, k, B), [fn, k, B]);
  const { principal: p, bases, period, solutions } = sol;
  const none = p === null;
  const yLim = fn === 'tan' ? 3.2 : 1.8;
  const kLim = fn === 'tan' ? 3 : 1.5;
  const lhs = `\\${fn}${B === 1 ? '\\,x' : `(${B}x)`}`;
  const eq = `${lhs} = ${tex(k, 3)}`;
  const f = (d: number) => F[fn](B * d);
  const u1 = p ?? 0, u2 = bases[1];
  const labelAll = solutions.length <= (narrow ? 4 : 8);

  const method = none ? [
    <RichText key="0" text={`$\\${fn}$ solo toma valores entre $-1$ y $1$. Como $${tex(k, 3)}$ queda fuera, la recta **nunca toca** la curva: la ecuación **no tiene solución**.`} />,
  ] : [
    <RichText key="1" text={B === 1 ? `La incógnita ya está sola dentro de la función: buscamos los ángulos $x$ con $${eq}$.` : `Primero cambia de variable: $u = ${B}x$. La ecuación queda $\\${fn}\\,u = ${tex(k, 3)}$ (más fácil).`} />,
    <RichText key="2" text={`**Ángulo principal** con la inversa: $u_1 = \\${fn}^{-1}(${tex(k, 3)}) = ${degTex(u1)}$.`} />,
    fn === 'tan'
      ? <RichText key="3" text="La tangente se repite cada $180°$: no hay segunda familia, basta sumar medias vueltas." />
      : u2 === undefined
        ? <RichText key="3" text="Aquí las dos familias coinciden (el punto está sobre un eje): hay **un** solo ángulo por vuelta." />
        : <RichText key="3" text={fn === 'sin' ? `**Segundo ángulo** por simetría respecto del eje Y (misma altura): $u_2 = 180° - u_1 = ${degTex(u2)}$.` : `**Segundo ángulo** por simetría respecto del eje X (misma $x$): $u_2 = -u_1 = ${degTex(u2)}$.`} />,
    <RichText key="4" text={`**Todas** las soluciones (n entero): ${bases.map((u) => `$${B === 1 ? 'x' : 'u'} = ${degTex(u)} + ${period}°\\,n$`).join(' ó ')}.`} />,
    ...(B === 1 ? [] : [<RichText key="5" text={`Vuelve a $x$ dividiendo **todo** por ${B} (también el período): ${bases.map((u) => `$x = ${degTex(u / B)} + ${tex(period / B, 2)}°\\,n$`).join(' ó ')}.`} />]),
    <RichText key="6" text={`En $[0°, 360°)$ quedan **${solutions.length}**: ${solutions.map((s) => `$${degTex(s.x)}$`).join(', ')}.`} />,
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-4">
          <Panel pad={false} title={<Tex>{eq}</Tex>} eyebrow="Resolver = encontrar dónde se cortan"
            actions={<Segmented size="sm" value={rad ? 'rad' : 'deg'} onChange={(u) => setRad(u === 'rad')} options={[{ value: 'deg', label: 'grados' }, { value: 'rad', label: 'radianes' }]} />}>
            <Plane view={{ xmin: -0.55, xmax: 8.45, ymin: -yLim, ymax: yLim }} gridStep={0.5} xTickStep={narrow ? 2 : 1} yTickStep={fn === 'tan' ? 1 : 0.5} tickFormat={(x) => `${Math.round(x * U)}°`} yTickFormat={(y) => String(y).replace('-', '−').replace('.', ',')}
              ariaLabel={`Ecuación ${NAME[fn]}(${B}x) = ${fmt(k, 3)}: ${solutions.length} soluciones entre 0 y 360 grados`}>
              <Seg a={{ x: 0, y: -yLim }} b={{ x: 0, y: yLim }} tone="accent" width={1} opacity={0.4} dash={3} />
              <Seg a={{ x: 8, y: -yLim }} b={{ x: 8, y: yLim }} tone="accent" width={1} opacity={0.4} dash={3} />
              <FnCurve f={f} from={-25} to={380} unit={U} tone="accent" width={2.8} clip={yLim + 0.4} step={B > 2 ? 0.5 : 1} glow />
              <Seg a={{ x: -0.55, y: k }} b={{ x: 8.45, y: k }} tone="opp" width={1.8} dash={5} />
              <Label at={{ x: 8.45, y: k }} dx={-6} dy={k > yLim - 0.4 ? 12 : -10} anchor="end" tone="opp" size={11.5} bg>y = {fmt(k, 3)}</Label>
              {solutions.map((s, i) => (
                <g key={s.x}>
                  <Seg a={{ x: s.x / U, y: 0 }} b={{ x: s.x / U, y: k }} tone={FAMILY_TONE[s.family]} width={1.6} dash={3} />
                  <Dot at={{ x: s.x / U, y: k }} tone={FAMILY_TONE[s.family]} r={6} />
                  {labelAll && <Label at={{ x: s.x / U, y: 0 }} dy={(k >= 0 ? 1 : -1) * (i % 2 && solutions.length > 5 ? 27 : 15)} tone={FAMILY_TONE[s.family]} size={11.5} bg>{fmt(nice(s.x), 1)}°</Label>}
                </g>
              ))}
            </Plane>
            <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-4 py-2.5">
              <span className="eyebrow mr-1">x ∈ [0°, 360°)</span>
              {none ? <Badge tone="bad">sin solución</Badge> : solutions.map((s) => <Badge key={s.x} tone={FAMILY_TONE[s.family]}><Tex>{showAngle(s.x, rad)}</Tex></Badge>)}
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
            <Panel pad={false} title={B === 1 ? 'En el círculo' : <>En el círculo, para <Tex>{`u = ${B}x`}</Tex></>} eyebrow="Una vuelta">
              <Plane view={{ xmin: -1.4, xmax: 1.4, ymin: -1.4, ymax: 1.4 }} gridStep={0.5} ticks={false} ariaLabel={`Ángulos base: ${bases.map((u) => fmt(u, 1)).join(' y ')} grados`}>
                <UnitCircleOutline />
                {fn === 'sin' && <Seg a={{ x: -1.4, y: k }} b={{ x: 1.4, y: k }} tone="opp" width={1.6} dash={5} />}
                {fn === 'cos' && <Seg a={{ x: k, y: -1.4 }} b={{ x: k, y: 1.4 }} tone="opp" width={1.6} dash={5} />}
                {fn === 'tan' && <InfLine a={{ x: 0, y: 0 }} b={{ x: 1, y: k }} tone="opp" width={1.6} dash={5} />}
                {(fn === 'tan' && !none ? [u1, u1 + 180] : bases).map((u, i) => {
                  const P = { x: cosDeg(u), y: sinDeg(u) };
                  const tone = FAMILY_TONE[fn === 'tan' ? 0 : i];
                  return <g key={i}><Seg a={{ x: 0, y: 0 }} b={P} tone={tone} width={2.6} /><Dot at={P} tone={tone} r={6} /><Label at={P} dx={P.x >= 0 ? 10 : -10} dy={P.y >= 0 ? -11 : 13} anchor={P.x >= 0 ? 'start' : 'end'} tone={tone} size={11.5} bg>{fmt(nice(u), 1)}°</Label></g>;
                })}
              </Plane>
            </Panel>
            <Panel title="Método paso a paso" eyebrow="Con tus números"><Reveal key={`${fn}-${none}`} steps={method} /></Panel>
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Ecuación" eyebrow="Controles" actions={<Segmented size="sm" value={fn} onChange={(x) => { setFn(x); setKRaw((v) => Math.max(-(x === 'tan' ? 3 : 1.5), Math.min(x === 'tan' ? 3 : 1.5, v))); act(); }} options={[{ value: 'sin', label: 'sen' }, { value: 'cos', label: 'cos' }, { value: 'tan', label: 'tan' }]} />}>
            <div className="space-y-2">
              <Slider id="eq-k" label="k · el valor buscado" value={k} min={-kLim} max={kLim} step={0.01} decimals={3} color="opp" onChange={setK} />
              <Slider id="eq-B" label="B · cuántas veces más rápido gira" value={B} min={1} max={4} step={1} decimals={0} color="adj" onChange={(b) => { setBRaw(Math.round(b)); act(); }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {PRESETS[fn].map((x) => <Button key={x.label} size="sm" variant={Math.abs(x.v - k) < 1e-9 ? 'primary' : 'soft'} className="num !px-2" onClick={() => setK(x.v)}>{x.label}</Button>)}
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-2">
            <Readout label="soluciones en una vuelta" value={solutions.length} tone="accent" sub={none ? 'la recta no toca la curva' : `${bases.length} ${bases.length === 1 ? 'familia' : 'familias'} × ${fmt((360 / period) * B, 0)} períodos`} />
            <Readout label={`período de ${NAME[fn]}(${B === 1 ? '' : B}x)`} value={`${fmt(period / B, 2)}°`} tone="adj" sub={`${period}° ÷ ${B}`} />
            <Readout label="ángulo principal" value={none ? '—' : `${fmt(nice(u1), 2)}°`} tone="hyp" sub={`${NAME[fn]}⁻¹(${fmt(k, 3)})`} />
            <Readout label="segundo ángulo" value={u2 === undefined ? '—' : `${fmt(nice(u2), 2)}°`} tone="ang" sub={fn === 'sin' ? '180° − u₁' : fn === 'cos' ? '−u₁' : 'no hace falta'} />
          </div>
          {none
            ? <Callout tone="bad" title="Sin solución"><RichText text={`$|k| > 1$: ningún ángulo tiene $\\${fn}$ igual a $${tex(k, 3)}$. Baja $|k|$ a 1 o menos.`} /></Callout>
            : <Callout tone="warn" title="El error más común"><RichText text={`Quedarse solo con lo que dice la calculadora ($${degTex(u1)}$). La inversa entrega **un** ángulo; la ecuación tiene **${solutions.length}** en una vuelta${B > 1 ? ` (y con $B = ${B}$ hay que dar ${B} vueltas de $u$ antes de dividir)` : ''}.`} /></Callout>}
          <Button size="sm" variant="ghost" onClick={() => save('Ecuación trigonométrica', `$${eq}$\n${none ? 'Sin solución.' : `En $[0°, 360°)$: ${solutions.map((s) => `$${degTex(s.x)}$`).join(', ')}`}`, 'resultado')}>Guardar en el cuaderno</Button>
        </div>
      </div>
    </div>
  );
}
