import { useState } from 'react';
import { Badge, Button, Callout, Panel, Readout, Reveal, Segmented, Slider } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import { acosDeg, asinDeg, atanDeg, cosDeg, radTex, sinDeg, tanDeg } from '../../math/trig';
import { principalDeg, type TrigFn } from '../../math/trigeq';
import { Arc, Dot, InfLine, Label, Plane, Seg } from '../../visualizations/Plane';
import { CircleArc, FnCurve, UnitCircleOutline } from '../../visualizations/Curve';
import { useLab } from '../../utils/useLab';

const F: Record<TrigFn, (d: number) => number> = { sin: sinDeg, cos: cosDeg, tan: tanDeg };
const INV: Record<TrigFn, (x: number) => number> = { sin: asinDeg, cos: acosDeg, tan: atanDeg };
const NAME: Record<TrigFn, string> = { sin: 'sen', cos: 'cos', tan: 'tan' };
/** Rama principal: el trozo de la función que la inversa "deshace". */
const BRANCH: Record<TrigFn, [number, number]> = { sin: [-90, 90], cos: [0, 180], tan: [-90, 90] };
const RANGE_TEX: Record<TrigFn, string> = { sin: '[-90°,\\,90°]', cos: '[0°,\\,180°]', tan: '(-90°,\\,90°)' };

const S2 = Math.SQRT1_2, S3 = Math.sqrt(3) / 2;
const PRESETS: Record<TrigFn, { v: number; label: string }[]> = {
  sin: [{ v: -1, label: '−1' }, { v: -S3, label: '−√3/2' }, { v: -S2, label: '−√2/2' }, { v: -0.5, label: '−1/2' }, { v: 0, label: '0' }, { v: 0.5, label: '1/2' }, { v: S2, label: '√2/2' }, { v: S3, label: '√3/2' }, { v: 1, label: '1' }],
  cos: [{ v: -1, label: '−1' }, { v: -S3, label: '−√3/2' }, { v: -S2, label: '−√2/2' }, { v: -0.5, label: '−1/2' }, { v: 0, label: '0' }, { v: 0.5, label: '1/2' }, { v: S2, label: '√2/2' }, { v: S3, label: '√3/2' }, { v: 1, label: '1' }],
  tan: [{ v: -Math.sqrt(3), label: '−√3' }, { v: -1, label: '−1' }, { v: -Math.sqrt(3) / 3, label: '−√3/3' }, { v: 0, label: '0' }, { v: Math.sqrt(3) / 3, label: '√3/3' }, { v: 1, label: '1' }, { v: Math.sqrt(3), label: '√3' }],
};

const U = 90; // 1 unidad horizontal = 90°
const pt = (deg: number) => ({ x: cosDeg(deg), y: sinDeg(deg) });
/** Limpia ruido tipo 29,999999 → 30 en ángulos notables. */
const nice = (deg: number) => (Math.abs(deg - Math.round(deg)) < 1e-6 ? Math.round(deg) : deg);

export default function InverseLab() {
  const { act, save } = useLab('m18');
  const [fn, setFn] = useState<TrigFn>('sin');
  const [v, setVRaw] = useState(0.5);
  const [theta, setTheta] = useState(150);
  const setV = (x: number) => { setVRaw(x); act(); };

  const lim = fn === 'tan' ? 3 : 1;
  const p = nice(principalDeg(fn, v) ?? 0);
  const other = nice(fn === 'sin' ? 180 - p : fn === 'cos' ? 360 - p : p + 180);
  const sameAsPrincipal = Math.abs(((other - p) % 360 + 360) % 360) < 1e-6;
  const P = pt(p), Q = pt(other);
  const [b0, b1] = BRANCH[fn];
  const yLim = fn === 'tan' ? 3.4 : 1.7;

  // todas las intersecciones de y = v con la curva en la ventana
  const hits: number[] = [];
  for (let n = -2; n <= 2; n++) {
    for (const u of fn === 'tan' ? [p] : [p, other]) {
      const x = u + (fn === 'tan' ? 180 : 360) * n;
      if (x >= -360 && x <= 360 && !hits.some((h) => Math.abs(h - x) < 1e-6)) hits.push(x);
    }
  }

  // composición: f⁻¹(f(θ)) solo devuelve θ dentro de la rama principal
  const back = nice(INV[fn](Math.max(-1e9, Math.min(1e9, fn === 'tan' ? F.tan(theta) : Math.max(-1, Math.min(1, F[fn](theta)))))));
  const thetaInBranch = theta >= b0 && theta <= b1;

  const why = [
    <RichText key="1" text={`Una función se puede "deshacer" solo si cada salida viene de **una sola** entrada. Pero $\\${fn} x$ repite sus valores: la recta horizontal de la gráfica corta la curva **muchas veces**.`} />,
    <RichText key="2" text="Si la inversa devolviera todos esos ángulos, no sería una función (una función entrega **un** resultado)." />,
    <RichText key="3" text={`Solución: quedarse con un trozo donde la curva no se repite y recorre todos sus valores. Para $\\${fn}$ se elige el intervalo $${RANGE_TEX[fn]}$: la **rama principal** (trazo grueso).`} />,
    <RichText key="4" text={`Por eso la calculadora siempre responde un ángulo en $${RANGE_TEX[fn]}$. Los demás ángulos con el mismo valor hay que encontrarlos con **simetría** (eso es resolver ecuaciones: el módulo siguiente).`} />,
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <Panel pad={false} title="¿Qué ángulo tiene ese valor?" eyebrow="Círculo unitario">
            <div className="mx-auto max-w-[520px]">
              <Plane view={{ xmin: -1.5, xmax: 1.5, ymin: -1.5, ymax: 1.5 }} gridStep={0.25} xTickStep={0.5} yTickStep={0.5} ariaLabel={`${NAME[fn]} inversa de ${fmt(v, 3)}: ángulo principal ${fmt(p, 1)} grados`}>
                <UnitCircleOutline />
                <CircleArc from={b0} to={b1} tone="accent" width={5} opacity={0.55} />
                {fn === 'sin' && <Seg a={{ x: -1.5, y: v }} b={{ x: 1.5, y: v }} tone="opp" width={1.6} dash={5} />}
                {fn === 'cos' && <Seg a={{ x: v, y: -1.5 }} b={{ x: v, y: 1.5 }} tone="adj" width={1.6} dash={5} />}
                {fn === 'tan' && <><Seg a={{ x: 1, y: -1.5 }} b={{ x: 1, y: 1.5 }} tone="muted" width={1} dash={3} /><InfLine a={{ x: 0, y: 0 }} b={{ x: 1, y: v }} tone="opp" width={1.6} dash={5} />{Math.abs(v) < 1.45 && <Dot at={{ x: 1, y: v }} tone="opp" r={4} />}</>}
                <Arc c={{ x: 0, y: 0 }} from={0} to={p} r={30} tone="ang" />
                {!sameAsPrincipal && <><Seg a={{ x: 0, y: 0 }} b={Q} tone="muted" width={1.8} dash={4} /><Dot at={Q} tone="muted" r={6} ring /></>}
                <Seg a={{ x: 0, y: 0 }} b={P} tone="hyp" width={3} />
                <Dot at={P} tone="hyp" r={7} />
                <Label at={P} dx={P.x >= 0 ? 12 : -12} dy={P.y >= 0 ? -13 : 15} anchor={P.x >= 0 ? 'start' : 'end'} tone="hyp" size={12.5} bg>{fmt(p, 1)}°</Label>
                {!sameAsPrincipal && <Label at={Q} dx={Q.x >= 0 ? 12 : -12} dy={Q.y >= 0 ? -13 : 15} anchor={Q.x >= 0 ? 'start' : 'end'} tone="muted" size={11.5} bg>{fmt(((other % 360) + 360) % 360, 1)}°</Label>}
              </Plane>
            </div>
            <p className="border-t border-line px-4 py-2 text-[12.5px] text-muted">El arco grueso es la <span className="font-semibold text-accent">rama principal</span>: la inversa solo responde ángulos de ahí. El punto hueco es el otro ángulo con el mismo valor.</p>
          </Panel>

          <Panel pad={false} title={<Tex>{`y = \\${fn}\\,x \\quad\\text{y la recta}\\quad y = ${tex(v, 3)}`}</Tex>} eyebrow="Prueba de la recta horizontal">
            <Plane view={{ xmin: -4.35, xmax: 4.35, ymin: -yLim, ymax: yLim }} gridStep={0.5} xTickStep={1} yTickStep={fn === 'tan' ? 1 : 0.5} tickFormat={(x) => `${Math.round(x * U)}°`} yTickFormat={(y) => String(y).replace('-', '−').replace('.', ',')} ariaLabel={`Gráfica de ${NAME[fn]} con la recta y = ${fmt(v, 3)}: ${hits.length} cortes visibles`}>
              <FnCurve f={F[fn]} from={-390} to={390} unit={U} tone="muted" width={1.8} opacity={0.75} clip={yLim + 0.4} />
              <FnCurve f={F[fn]} from={fn === 'tan' ? -89 : b0} to={fn === 'tan' ? 89 : b1} unit={U} tone="accent" width={4} clip={yLim + 0.4} glow />
              <Seg a={{ x: -4.35, y: v }} b={{ x: 4.35, y: v }} tone="opp" width={1.6} dash={5} />
              {hits.filter((h) => Math.abs(h - p) > 1e-6).map((h) => <Dot key={h} at={{ x: h / U, y: v }} tone="muted" r={5} ring />)}
              <Seg a={{ x: p / U, y: 0 }} b={{ x: p / U, y: v }} tone="hyp" width={2} dash={3} />
              <Dot at={{ x: p / U, y: v }} tone="hyp" r={6.5} />
              <Label at={{ x: p / U, y: 0 }} dy={v >= 0 ? 15 : -13} tone="hyp" size={12} bg>{fmt(p, 1)}°</Label>
            </Plane>
            <p className="border-t border-line px-4 py-2 text-[12.5px] text-muted">La recta corta la curva en <span className="num font-semibold text-ink">{hits.length}</span> puntos solo en esta ventana. La inversa elige el único que cae sobre el trazo grueso.</p>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Valor" eyebrow="Controles" actions={<Segmented size="sm" value={fn} onChange={(f) => { setFn(f); setVRaw((x) => (f === 'tan' ? x : Math.max(-1, Math.min(1, x)))); act(); }} options={[{ value: 'sin', label: 'sen⁻¹' }, { value: 'cos', label: 'cos⁻¹' }, { value: 'tan', label: 'tan⁻¹' }]} />}>
            <Slider id="inv-v" label={`valor de ${NAME[fn]} θ`} value={v} min={-lim} max={lim} step={fn === 'tan' ? 0.05 : 0.01} decimals={3} color={fn === 'cos' ? 'adj' : 'opp'} onChange={setV} />
            <div className="mt-2 flex flex-wrap gap-1">
              {PRESETS[fn].map((x) => <Button key={x.label} size="sm" variant={Math.abs(x.v - v) < 1e-9 ? 'primary' : 'soft'} className="num !px-2" onClick={() => setV(x.v)}>{x.label}</Button>)}
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-2">
            <Readout label={`${NAME[fn]}⁻¹(${fmt(v, 3)})`} value={`${fmt(p, 2)}°`} tone="hyp" sub="ángulo principal" />
            <Readout label="en radianes" value={Number.isInteger(p) && p % 15 === 0 ? <Tex>{radTex(p)}</Tex> : fmt((p * Math.PI) / 180, 4)} tone="hyp" sub={`≈ ${fmt((p * Math.PI) / 180, 4)} rad`} />
            <Readout label="otro ángulo en [0°, 360°)" value={sameAsPrincipal ? '—' : `${fmt(((other % 360) + 360) % 360, 2)}°`} tone="muted" sub={sameAsPrincipal ? 'aquí solo hay uno' : fn === 'sin' ? '180° − θ' : fn === 'cos' ? '360° − θ' : 'θ + 180°'} />
            <Readout label="recorrido de la inversa" value={<Tex>{RANGE_TEX[fn]}</Tex>} tone="accent" sub={fn === 'tan' ? 'acepta cualquier número' : 'solo acepta valores en [−1, 1]'} />
          </div>
          <Callout tone="warn" title="El error más común">
            <RichText text={`$\\${fn}^{-1}$ **no** significa $\\dfrac{1}{\\${fn}}$. Con el valor actual: $\\${fn}^{-1}(${tex(v, 3)}) = ${tex(p, 2)}°$ es un **ángulo**, mientras que ${Math.abs(v) < 1e-9 ? `$\\dfrac{1}{${tex(v, 3)}}$ ni siquiera existe` : `$\\dfrac{1}{${tex(v, 3)}} = ${tex(1 / v, 3)}$ es solo un número`}.`} />
          </Callout>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="¿Por qué solo un trozo?" eyebrow="La rama principal"><Reveal steps={why} /></Panel>
        <Panel title="Ida y vuelta" eyebrow={`${NAME[fn]}⁻¹(${NAME[fn]} θ) no siempre es θ`}>
          <Slider id="inv-theta" label="θ de partida" value={theta} min={-180} max={360} step={5} unit="°" color="ang" onChange={(t) => { setTheta(t); act(); }} />
          <div className="mt-2 overflow-x-auto text-[14.5px]">
            <Tex>{`${fmt(theta, 0)}° \\;\\xrightarrow{\\;\\${fn}\\;}\\; ${Number.isFinite(F[fn](theta)) ? tex(F[fn](theta), 4) : '\\text{no definida}'} \\;\\xrightarrow{\\;\\${fn}^{-1}\\;}\\; ${Number.isFinite(F[fn](theta)) ? `${tex(back, 2)}°` : '—'}`}</Tex>
          </div>
          <div className="mt-2">
            {thetaInBranch
              ? <Badge tone="ok">θ está en la rama principal: vuelves al mismo ángulo</Badge>
              : <Badge tone="warn">θ está fuera de {b0}°…{b1}°: vuelves a otro ángulo con el mismo valor</Badge>}
          </div>
          <p className="mt-2 text-[13.5px] text-muted"><RichText text={`En cambio $\\${fn}(\\${fn}^{-1}(x)) = x$ **siempre** que $x$ esté en el dominio: deshacer y rehacer devuelve el valor.`} /></p>
          <button type="button" className="mt-3 text-[13px] text-accent underline" onClick={() => save('Funciones inversas', '$\\sin^{-1}x \\in [-90°, 90°]$\n$\\cos^{-1}x \\in [0°, 180°]$\n$\\tan^{-1}x \\in (-90°, 90°)$\n$\\sin^{-1}x \\neq \\dfrac{1}{\\sin x}$', 'formula')}>Guardar recorridos en el cuaderno</button>
        </Panel>
      </div>
    </div>
  );
}
