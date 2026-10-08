import { useState } from 'react';
import { Badge, Button, Callout, Panel, Readout, Toggle } from '../../components/ui';
import { RichText } from '../../components/Tex';
import { fmt, tex, texP } from '../../math/core';
import { slopeKind, type Pt } from '../../math/geometry';
import { atanDeg } from '../../math/trig';
import { Arc, DraggablePoint, InfLine, Label, Plane, RightMark, Seg } from '../../visualizations/Plane';
import { useLab } from '../../utils/useLab';

const VIEW = { xmin: -8, xmax: 8, ymin: -6, ymax: 6 };

const QUESTIONS = [
  {
    q: '¿Qué ocurre con la pendiente si aumentamos Δy (sin tocar Δx)?',
    run: (A: Pt, B: Pt) => ({ A, B: { ...B, y: Math.min(6, B.y + 1) } }),
    a: 'La pendiente **aumenta**: la recta sube más por cada paso horizontal. Δy está en el **numerador**, así que crecen juntos (son proporcionales).',
  },
  {
    q: '¿Qué ocurre si Δx disminuye (acercamos B horizontalmente a A)?',
    run: (A: Pt, B: Pt) => ({ A, B: { ...B, x: B.x - Math.sign(B.x - A.x || 1) * Math.min(1, Math.abs(B.x - A.x) - 0) } }),
    a: 'Si Δy se mantiene y Δx **disminuye**, la pendiente crece en valor absoluto: la misma subida en menos avance = más empinada. Si Δx llega a **0**, la recta es **vertical** y la pendiente no existe (división por cero).',
  },
  {
    q: '¿Y si intercambiamos A y B?',
    run: (A: Pt, B: Pt) => ({ A: B, B: A }),
    a: 'La pendiente **no cambia**: Δy y Δx cambian **ambos** de signo y el cociente se mantiene. La inclinación es una propiedad de la recta, no del orden en que eliges los puntos.',
  },
  {
    q: '¿Cuándo es negativa la pendiente?',
    run: (A: Pt, B: Pt) => ({ A, B: { x: B.x, y: A.y - (B.y - A.y || 2) } }),
    a: 'Cuando Δy y Δx tienen **signos distintos**: al avanzar a la derecha, la recta **baja**.',
  },
];

export default function SlopeLab() {
  const { act, save } = useLab('m3');
  const [A, setA] = useState<Pt>({ x: -2, y: -1 });
  const [B, setB] = useState<Pt>({ x: 3, y: 2 });
  const [showTri, setShowTri] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

  const dx = B.x - A.x, dy = B.y - A.y;
  const kind = slopeKind(A, B);
  const m = dx !== 0 ? dy / dx : NaN;
  const b = Number.isFinite(m) ? A.y - m * A.x : NaN;
  const ang = dx !== 0 ? atanDeg(m) : 90;
  const C = { x: B.x, y: A.y };
  const tone = kind === 'positiva' ? 'ok' : kind === 'negativa' ? 'bad' : kind === 'cero' ? 'adj' : 'warn';

  const preset = (k: 'pos' | 'neg' | 'zero' | 'vert') => {
    act();
    if (k === 'pos') { setA({ x: -3, y: -2 }); setB({ x: 3, y: 2 }); }
    if (k === 'neg') { setA({ x: -3, y: 3 }); setB({ x: 3, y: -1 }); }
    if (k === 'zero') { setA({ x: -4, y: 1 }); setB({ x: 4, y: 1 }); }
    if (k === 'vert') { setA({ x: 2, y: -3 }); setB({ x: 2, y: 4 }); }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Panel pad={false} title="Recta por A y B" eyebrow="Pendiente" actions={<Toggle id="m3-tri" checked={showTri} onChange={setShowTri} label="Triángulo de pendiente" />}>
          <Plane view={VIEW} cursor ariaLabel={`Recta por A y B con pendiente ${kind}`}>
            {(dx !== 0 || dy !== 0) && <InfLine a={A} b={B} tone="accent" width={2.5} />}
            {showTri && dx !== 0 && dy !== 0 && (
              <>
                <Seg a={A} b={C} tone="adj" width={3} />
                <Seg a={C} b={B} tone="opp" width={3} />
                <RightMark at={C} u={{ x: -Math.sign(dx), y: 0 }} v={{ x: 0, y: Math.sign(dy) }} />
                <Label at={{ x: (A.x + C.x) / 2, y: A.y }} dy={dy > 0 ? 16 : -16} tone="adj" bg>Δx = {fmt(dx)}</Label>
                <Label at={{ x: C.x, y: (C.y + B.y) / 2 }} dx={dx > 0 ? 12 : -12} anchor={dx > 0 ? 'start' : 'end'} tone="opp" bg>Δy = {fmt(dy)}</Label>
                {dx > 0 && <Arc c={A} from={0} to={ang} r={30} />}
                {dx < 0 && <Arc c={A} from={180} to={180 + ang} r={30} />}
              </>
            )}
            <DraggablePoint at={A} label="A" showCoords snap={1} onChange={(p) => { setA(p); act(); }} />
            <DraggablePoint at={B} label="B" showCoords snap={1} tone="hyp" onChange={(p) => { setB(p); act(); }} />
          </Plane>
        </Panel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Readout label="Δy (subida)" value={fmt(dy)} tone="opp" />
          <Readout label="Δx (avance)" value={fmt(dx)} tone="adj" />
          <Readout label="Pendiente m" value={dx === 0 ? (dy === 0 ? '—' : 'no definida') : fmt(m, 3)} tone="accent" />
          <Readout label="Inclinación" value={dx === 0 ? '90°' : `${fmt(ang, 1)}°`} tone="ang" sub="ángulo con el eje X" />
        </div>
      </div>
      <div className="space-y-4">
        <Panel title="Lectura de la recta" eyebrow="Análisis">
          <div className="space-y-3 text-[14.5px]">
            <div className="flex flex-wrap items-center gap-2">Dirección: <Badge tone={tone}>{kind === 'positiva' ? '↗ sube' : kind === 'negativa' ? '↘ baja' : kind === 'cero' ? '→ horizontal' : kind === 'vertical' ? '↑ vertical' : 'A = B'}</Badge><Badge>pendiente {kind}</Badge></div>
            {dx !== 0 ? (
              <RichText className="block" text={`$m = \\dfrac{\\Delta y}{\\Delta x} = \\dfrac{${tex(B.y)} - ${texP(A.y)}}{${tex(B.x)} - ${texP(A.x)}} = \\dfrac{${tex(dy)}}{${tex(dx)}} ${Math.abs(m - Math.round(m * 1000) / 1000) < 1e-12 ? '=' : '\\approx'} ${tex(m, 3)}$`} />
            ) : dy !== 0 ? (
              <RichText text={`$m = \\dfrac{${tex(dy)}}{0}$ → **no se puede dividir por cero**. Una recta vertical no tiene pendiente: su ecuación es $x = ${tex(A.x)}$.`} />
            ) : <p className="text-muted">A y B coinciden: por un solo punto pasan infinitas rectas.</p>}
            {Number.isFinite(m) && <RichText className="block" text={`Ecuación: $y = ${tex(m, 3)}\\,x ${b < 0 ? '-' : '+'} ${tex(Math.abs(b), 3)}$`} />}
            {Number.isFinite(m) && dx !== 0 && <p className="text-[13.5px] text-muted"><RichText text={`Por cada **1** unidad hacia la derecha, la recta ${m >= 0 ? 'sube' : 'baja'} **${fmt(Math.abs(m), 3)}** unidades. Guarda esta idea: en el módulo 10 verás que $m = \\tan(${fmt(ang, 1)}°)$.`} /></p>}
          </div>
        </Panel>
        <Panel title="Prueba cada caso" eyebrow="Presets">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => preset('pos')}>↗ Positiva</Button>
            <Button size="sm" onClick={() => preset('neg')}>↘ Negativa</Button>
            <Button size="sm" onClick={() => preset('zero')}>→ Cero</Button>
            <Button size="sm" onClick={() => preset('vert')}>↑ Vertical</Button>
          </div>
        </Panel>
        <Panel title="Preguntas para experimentar" eyebrow="Investiga">
          <ul className="space-y-2">
            {QUESTIONS.map((q, i) => (
              <li key={i} className="rounded-lg border border-line p-2.5">
                <p className="text-[14px] font-medium">{q.q}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="soft" onClick={() => { const r = q.run(A, B); setA(r.A); setB(r.B); act(); }}>Probarlo en el plano</Button>
                  <Button size="sm" variant="ghost" onClick={() => setOpen(open === i ? null : i)}>{open === i ? 'Ocultar' : 'Ver explicación'}</Button>
                </div>
                {open === i && <div className="fade-up mt-2 text-[14px]"><RichText text={q.a} /></div>}
              </li>
            ))}
          </ul>
        </Panel>
        <Callout title="Idea clave">La pendiente es una <strong>razón</strong>: subida ÷ avance. No depende de qué dos puntos de la recta elijas.</Callout>
        <Button variant="ghost" size="sm" onClick={() => save('Pendiente', `A = (${fmt(A.x)}, ${fmt(A.y)}), B = (${fmt(B.x)}, ${fmt(B.y)})\n${dx === 0 ? 'Recta vertical: pendiente no definida' : `$m = ${tex(dy)}/${tex(dx)} \\approx ${tex(m, 3)}$, inclinación ${fmt(ang, 1)}°`}`)}>Guardar en el cuaderno</Button>
      </div>
    </div>
  );
}
