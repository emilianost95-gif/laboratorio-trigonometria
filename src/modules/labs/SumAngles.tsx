import { useState } from 'react';
import { Badge, Callout, Panel, Readout, Reveal, Slider, Toggle } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex, toRad } from '../../math/core';
import { cosDeg, sinDeg } from '../../math/trig';
import { Arc, Dot, Label, Plane, Seg, usePlane } from '../../visualizations/Plane';
import { useLab } from '../../utils/useLab';

function UnitCircleShape() {
  const { sx, sy, k, px } = usePlane();
  return <circle cx={sx(0)} cy={sy(0)} r={k} fill="none" stroke="rgb(var(--ink))" strokeOpacity={0.5} strokeWidth={px(1.6)} />;
}

/** Barra apilada que muestra cómo dos productos se suman (o restan) para dar el resultado. */
function StackBar({ parts, total, label }: { parts: { v: number; tone: string; name: string }[]; total: number; label: string }) {
  const scale = 46; // % por unidad
  const left = (v: number) => `${50 + v * scale}%`;
  let acc = 0;
  return (
    <div>
      <div className="mb-1 text-[12.5px] text-muted">{label}</div>
      <div className="relative h-9 rounded-md bg-panel2">
        <div className="absolute inset-y-0 left-1/2 w-px bg-line" />
        {parts.map((p, i) => {
          const a = acc, b = acc + p.v;
          acc = b;
          const lo = Math.min(a, b), hi = Math.max(a, b);
          return <div key={i} title={p.name} className="absolute rounded-sm" style={{ left: left(lo), width: `${(hi - lo) * scale}%`, top: 4 + i * 11, height: 9, background: `rgb(var(--${p.tone}) / 0.8)` }} />;
        })}
        <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: left(total) }} title="resultado" />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted"><span>−1</span><span>0</span><span>1</span></div>
    </div>
  );
}

export default function SumAnglesLab() {
  const { act, save } = useLab('m17');
  const [a, setA] = useState(30);
  const [b, setB] = useState(45);
  const [double, setDouble] = useState(false);
  const beta = double ? a : b;
  const s = a + beta;
  const sa = sinDeg(a), ca = cosDeg(a), sb = sinDeg(beta), cb = cosDeg(beta);
  const sinSum = sa * cb + ca * sb, cosSum = ca * cb - sa * sb;
  const A = { x: ca, y: sa }, B = { x: cosDeg(s), y: sinDeg(s) };
  const naive = sa + sb;

  const proof = [
    <RichText key="1" text="El punto del círculo unitario a ángulo $\beta$ es $(\cos\beta, \sin\beta)$." />,
    <RichText key="2" text="**Girar** ese punto un ángulo $\alpha$ lo lleva al punto de ángulo $\alpha + \beta$. Girar un punto $(x, y)$ un ángulo $\alpha$ da $(x\cos\alpha - y\sin\alpha,\; x\sin\alpha + y\cos\alpha)$." />,
    <RichText key="3" text="Con $x = \cos\beta$, $y = \sin\beta$: la coordenada $y$ del punto girado es $\cos\beta\sin\alpha + \sin\beta\cos\alpha$." />,
    <RichText key="4" text="Pero esa coordenada también es $\sin(\alpha+\beta)$. Igualando: $$\sin(\alpha+\beta) = \sin\alpha\cos\beta + \cos\alpha\sin\beta$$ y, con la coordenada $x$, $\cos(\alpha+\beta) = \cos\alpha\cos\beta - \sin\alpha\sin\beta$." />,
    <RichText key="5" text="**Ángulo doble:** con $\beta = \alpha$ sale $\sin 2\alpha = 2\sin\alpha\cos\alpha$ y $\cos 2\alpha = \cos^2\alpha - \sin^2\alpha$." />,
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel pad={false} title="Sumar ángulos = girar dos veces" eyebrow="Círculo unitario" actions={<Toggle id="sum-double" checked={double} onChange={(v) => { setDouble(v); act(); }} label="Ángulo doble (β = α)" />}>
          <div className="mx-auto max-w-[600px]">
            <Plane view={{ xmin: -1.45, xmax: 1.45, ymin: -1.45, ymax: 1.45 }} gridStep={0.25} xTickStep={0.5} yTickStep={0.5} ariaLabel={`Ángulos ${fmt(a)}° y ${fmt(beta)}°, suma ${fmt(s)}°`}>
              <UnitCircleShape />
              <Arc c={{ x: 0, y: 0 }} from={0} to={a} r={34} tone="adj" />
              <Arc c={{ x: 0, y: 0 }} from={a} to={s} r={52} tone="ang" />
              <Seg a={{ x: 0, y: 0 }} b={A} tone="adj" width={2.5} />
              <Seg a={{ x: 0, y: 0 }} b={B} tone="hyp" width={3} />
              <Seg a={B} b={{ x: B.x, y: 0 }} tone="opp" width={3} dash={4} />
              <Dot at={A} tone="adj" r={6} />
              <Dot at={B} tone="hyp" r={7} />
              <Label at={{ x: 0, y: 0 }} dx={58 * Math.cos(toRad(a / 2))} dy={-58 * Math.sin(toRad(a / 2))} tone="adj" size={12}>α</Label>
              <Label at={{ x: 0, y: 0 }} dx={74 * Math.cos(toRad(a + beta / 2))} dy={-74 * Math.sin(toRad(a + beta / 2))} tone="ang" size={12}>β</Label>
              <Label at={B} dx={B.x >= 0 ? 12 : -12} dy={-14} anchor={B.x >= 0 ? 'start' : 'end'} tone="hyp" size={12} bg>α + β = {fmt(s, 0)}°</Label>
              <Label at={{ x: B.x, y: B.y / 2 }} dx={B.x >= 0 ? 8 : -8} anchor={B.x >= 0 ? 'start' : 'end'} tone="opp" size={11.5} bg>sen(α+β)</Label>
            </Plane>
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Ángulos" eyebrow="Controles">
            <div className="space-y-2">
              <Slider id="sum-a" label="α" value={a} min={0} max={180} step={1} unit="°" color="adj" onChange={(v) => { setA(v); act(); }} />
              {!double && <Slider id="sum-b" label="β" value={b} min={0} max={180} step={1} unit="°" color="ang" onChange={(v) => { setB(v); act(); }} />}
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-2">
            <Readout label="sen(α + β)" value={fmt(sinDeg(s), 4)} tone="hyp" sub="medido en el círculo" />
            <Readout label="sen(α+β) por fórmula" value={fmt(sinSum, 4)} tone="opp" sub="sen α cos β + cos α sen β ✓" />
            <Readout label="cos(α + β)" value={fmt(cosDeg(s), 4)} tone="hyp" />
            <Readout label="cos(α+β) por fórmula" value={fmt(cosSum, 4)} tone="adj" sub="cos α cos β − sen α sen β ✓" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="La suma, pieza por pieza" eyebrow={double ? 'sen 2α = 2 sen α cos α' : 'sen(α+β) = sen α cos β + cos α sen β'}>
          <div className="space-y-4">
            <StackBar label="sen(α+β): barra roja = sen α · cos β, barra dorada = cos α · sen β; la raya negra es el resultado" total={sinDeg(s)}
              parts={[{ v: sa * cb, tone: 'opp', name: 'sen α cos β' }, { v: ca * sb, tone: 'ang', name: 'cos α sen β' }]} />
            <StackBar label="cos(α+β): barra azul = cos α · cos β, barra violeta = −sen α · sen β" total={cosDeg(s)}
              parts={[{ v: ca * cb, tone: 'adj', name: 'cos α cos β' }, { v: -sa * sb, tone: 'hyp', name: '− sen α sen β' }]} />
            <div className="overflow-x-auto text-[14px]"><Tex>{`\\sin(${a}°+${beta}°) = ${tex(sa, 3)}\\cdot${tex(cb, 3)} + ${tex(ca, 3)}\\cdot${tex(sb, 3)} = ${tex(sinSum, 4)}`}</Tex></div>
          </div>
        </Panel>
        <Callout tone="warn" title="El error más común">
          <RichText text={`¿Es $\\sin(\\alpha+\\beta) = \\sin\\alpha + \\sin\\beta$? Con los ángulos actuales: $\\sin\\alpha + \\sin\\beta = ${tex(naive, 4)}$, pero $\\sin(${fmt(s, 0)}°) = ${tex(sinDeg(s), 4)}$. ${Math.abs(naive - sinDeg(s)) < 1e-6 ? 'Coinciden solo por casualidad en este caso (prueba otros ángulos).' : '**No coinciden.**'} El seno no se "reparte" en la suma: por eso hace falta la fórmula.`} />
          <div className="mt-2"><Badge tone="muted">Prueba α = 30°, β = 60°: sen 30° + sen 60° ≈ 1,366, ¡mayor que 1!</Badge></div>
        </Callout>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="¿Por qué funciona?" eyebrow="Demostración por rotación"><Reveal steps={proof} /></Panel>
        <Panel title="Para qué sirve" eyebrow="Valores exactos nuevos">
          <div className="space-y-2 text-[14.5px]">
            <RichText className="block" text="$\sin 75° = \sin(45° + 30°) = \dfrac{\sqrt2}{2}\cdot\dfrac{\sqrt3}{2} + \dfrac{\sqrt2}{2}\cdot\dfrac12 = \dfrac{\sqrt6 + \sqrt2}{4} \approx 0{,}9659$" />
            <RichText className="block" text="$\cos 15° = \cos(45° - 30°) = \dfrac{\sqrt6 + \sqrt2}{4}$ (para restar se cambia el signo de $\beta$)." />
            <RichText className="block" text="$\tan(\alpha+\beta) = \dfrac{\tan\alpha + \tan\beta}{1 - \tan\alpha\tan\beta}$ (dividiendo seno entre coseno)." />
          </div>
          <button type="button" className="mt-3 text-[13px] text-accent underline" onClick={() => save('Suma de ángulos', '$\\sin(\\alpha+\\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta$\n$\\cos(\\alpha+\\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta$\n$\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha$\n$\\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha$', 'formula')}>Guardar fórmulas en el cuaderno</button>
        </Panel>
      </div>
    </div>
  );
}
