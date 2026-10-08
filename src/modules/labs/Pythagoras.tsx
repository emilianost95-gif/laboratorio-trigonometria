import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Badge, Button, Callout, Panel, Readout, Slider, Toggle } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import type { Pt } from '../../math/geometry';
import { Label, Plane, Poly, RightMark, Seg, usePlane } from '../../visualizations/Plane';
import { useLab } from '../../utils/useLab';

/** Cuadrícula de unidades dentro de un cuadrado (para "contar" el área). */
function UnitGrid({ origin, u, v, n, tone }: { origin: Pt; u: Pt; v: Pt; n: number; tone: 'opp' | 'adj' | 'hyp' }) {
  const { sx, sy, px } = usePlane();
  if (n > 12 || !Number.isInteger(Math.round(n * 1000) / 1000)) return null;
  const lines: ReactNode[] = [];
  for (let i = 1; i < n; i++) {
    const p1 = { x: origin.x + u.x * i, y: origin.y + u.y * i };
    const p2 = { x: p1.x + v.x * n, y: p1.y + v.y * n };
    const q1 = { x: origin.x + v.x * i, y: origin.y + v.y * i };
    const q2 = { x: q1.x + u.x * n, y: q1.y + u.y * n };
    lines.push(<line key={`u${i}`} x1={sx(p1.x)} y1={sy(p1.y)} x2={sx(p2.x)} y2={sy(p2.y)} stroke={`rgb(var(--${tone}))`} strokeOpacity={0.35} strokeWidth={px(1)} />);
    lines.push(<line key={`v${i}`} x1={sx(q1.x)} y1={sy(q1.y)} x2={sx(q2.x)} y2={sy(q2.y)} stroke={`rgb(var(--${tone}))`} strokeOpacity={0.35} strokeWidth={px(1)} />);
  }
  return <g pointerEvents="none">{lines}</g>;
}

function SquaresFigure({ a, b, grid }: { a: number; b: number; grid: boolean }) {
  // a = cateto vertical, b = cateto horizontal
  const A = { x: 0, y: 0 }, C = { x: b, y: 0 }, B = { x: b, y: a };
  const c = Math.hypot(a, b);
  const n = { x: -a / c, y: b / c }; // normal exterior a la hipotenusa
  const sqB = [A, C, { x: b, y: -b }, { x: 0, y: -b }];
  const sqA = [C, { x: b + a, y: 0 }, { x: b + a, y: a }, B];
  const sqC = [A, B, { x: B.x + n.x * c, y: B.y + n.y * c }, { x: A.x + n.x * c, y: A.y + n.y * c }];
  const xs = [...sqA, ...sqB, ...sqC].map((p) => p.x), ys = [...sqA, ...sqB, ...sqC].map((p) => p.y);
  const pad = 0.8;
  const view = { xmin: Math.min(...xs) - pad, xmax: Math.max(...xs) + pad, ymin: Math.min(...ys) - pad, ymax: Math.max(...ys) + pad };
  const center = (pts: Pt[]) => ({ x: pts.reduce((s, p) => s + p.x, 0) / 4, y: pts.reduce((s, p) => s + p.y, 0) / 4 });
  const intGrid = grid && Number.isInteger(a) && Number.isInteger(b);
  return (
    <Plane view={view} grid={false} axes={false} ariaLabel={`Cuadrados sobre los lados: ${fmt(a * a)} + ${fmt(b * b)} = ${fmt(c * c)}`} maxHeight="560px">
      <Poly pts={sqA} tone="opp" fillOpacity={0.16} width={2} />
      <Poly pts={sqB} tone="adj" fillOpacity={0.16} width={2} />
      <Poly pts={sqC} tone="hyp" fillOpacity={0.16} width={2} />
      {intGrid && <UnitGrid origin={C} u={{ x: 1, y: 0 }} v={{ x: 0, y: 1 }} n={a} tone="opp" />}
      {intGrid && <UnitGrid origin={{ x: 0, y: -b }} u={{ x: 1, y: 0 }} v={{ x: 0, y: 1 }} n={b} tone="adj" />}
      <Poly pts={[A, C, B]} tone="ink" fillOpacity={0.06} strokeTone="ink" width={2.5} />
      <RightMark at={C} u={{ x: -1, y: 0 }} v={{ x: 0, y: 1 }} />
      <Label at={center(sqA)} tone="opp" size={15} bg>a² = {fmt(a * a)}</Label>
      <Label at={center(sqB)} tone="adj" size={15} bg>b² = {fmt(b * b)}</Label>
      <Label at={center(sqC)} tone="hyp" size={15} bg>c² = {fmt(c * c)}</Label>
      <Label at={{ x: b, y: a / 2 }} dx={-10} anchor="end" tone="opp" size={12}>a</Label>
      <Label at={{ x: b / 2, y: 0 }} dy={-10} tone="adj" size={12}>b</Label>
      <Label at={{ x: b / 2, y: a / 2 }} dx={10} dy={10} tone="hyp" size={12}>c</Label>
    </Plane>
  );
}

// ---------- Demostración por reordenamiento ----------
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function Proof({ a, b }: { a: number; b: number }) {
  // Aquí: p = cateto horizontal del triángulo T1, q = vertical. Cuadrado grande de lado s = p + q.
  const p = b, q = a, s = p + q;
  const [step, setStep] = useState(0);
  const [t, setT] = useState(0); // 0 = configuración c², 1 = configuración a² + b²
  const raf = useRef(0);
  const animateTo = (target: number) => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const from = t;
    const dur = 1500;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      setT(from + (target - from) * ease(k));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => { animateTo(step >= 2 ? 1 : 0); }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const tris: { pts: Pt[]; d: Pt }[] = [
    { pts: [{ x: 0, y: 0 }, { x: p, y: 0 }, { x: 0, y: q }], d: { x: 0, y: p } },
    { pts: [{ x: p, y: 0 }, { x: s, y: 0 }, { x: s, y: p }], d: { x: 0, y: 0 } },
    { pts: [{ x: s, y: p }, { x: s, y: s }, { x: q, y: s }], d: { x: -q, y: 0 } },
    { pts: [{ x: q, y: s }, { x: 0, y: s }, { x: 0, y: q }], d: { x: p, y: -q } },
  ];
  const moved = tris.map((tr) => tr.pts.map((pt) => ({ x: pt.x + tr.d.x * t, y: pt.y + tr.d.y * t })));
  const view = { xmin: -0.12 * s, xmax: 1.12 * s, ymin: -0.12 * s, ymax: 1.12 * s };
  const texts = [
    `Construimos un cuadrado grande de lado $a + b$. Su área no cambia en toda la demostración: $(a+b)^2 = ${tex(s * s)}$.`,
    `Colocamos **4 copias** del triángulo en las esquinas. El hueco del centro es un cuadrado inclinado de lado $c$: su área es $c^2 = ${tex(a * a + b * b)}$.`,
    'Ahora **deslizamos** los triángulos (sin girarlos ni deformarlos). Siguen siendo los mismos 4 triángulos dentro del mismo cuadrado…',
    `…y el espacio libre se reorganizó en **dos cuadrados**: uno de área $a^2 = ${tex(a * a)}$ y otro de área $b^2 = ${tex(b * b)}$.`,
    `Mismo cuadrado grande − mismos 4 triángulos = misma área libre. Antes era $c^2$, ahora es $a^2 + b^2$. Por lo tanto: $$a^2 + b^2 = c^2$$`,
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-lg border border-line">
        <Plane view={view} grid={false} axes={false} ariaLabel={`Demostración de Pitágoras, paso ${step + 1} de 5`}>
          <Poly pts={[{ x: 0, y: 0 }, { x: s, y: 0 }, { x: s, y: s }, { x: 0, y: s }]} tone="ink" fillOpacity={0.03} width={2.5} />
          {step >= 1 && t < 0.02 && <Poly pts={[{ x: p, y: 0 }, { x: s, y: p }, { x: q, y: s }, { x: 0, y: q }]} tone="hyp" fillOpacity={0.28} width={2} />}
          {step >= 3 && t > 0.98 && <><Poly pts={[{ x: 0, y: 0 }, { x: p, y: 0 }, { x: p, y: p }, { x: 0, y: p }]} tone="adj" fillOpacity={0.28} width={2} /><Poly pts={[{ x: p, y: p }, { x: s, y: p }, { x: s, y: s }, { x: p, y: s }]} tone="opp" fillOpacity={0.28} width={2} /></>}
          {step >= 1 && moved.map((pts, i) => <Poly key={i} pts={pts} tone="ang" fillOpacity={0.45} strokeTone="ink" width={1.5} />)}
          {step >= 1 && t < 0.02 && <Label at={{ x: s / 2, y: s / 2 }} tone="hyp" size={16} bg>c²</Label>}
          {step >= 3 && t > 0.98 && <><Label at={{ x: p / 2, y: p / 2 }} tone="adj" size={16} bg>{p === b ? 'b²' : 'a²'}</Label><Label at={{ x: p + q / 2, y: p + q / 2 }} tone="opp" size={16} bg>{p === b ? 'a²' : 'b²'}</Label></>}
          <Seg a={{ x: 0, y: -0.06 * s }} b={{ x: p, y: -0.06 * s }} tone="adj" width={2} />
          <Seg a={{ x: p, y: -0.06 * s }} b={{ x: s, y: -0.06 * s }} tone="opp" width={2} />
          <Label at={{ x: p / 2, y: -0.06 * s }} dy={12} tone="adj" size={12}>b</Label>
          <Label at={{ x: p + q / 2, y: -0.06 * s }} dy={12} tone="opp" size={12}>a</Label>
        </Plane>
      </div>
      <div className="flex flex-col gap-3">
        <div className="eyebrow">Paso {step + 1} de 5</div>
        <div key={step} className="fade-up min-h-[110px] text-[15px] leading-relaxed"><RichText text={texts[step]} /></div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="soft" disabled={step === 0} onClick={() => setStep(step - 1)}>← Anterior</Button>
          <Button size="sm" variant="primary" disabled={step === 4} onClick={() => setStep(step + 1)}>Siguiente →</Button>
          <Button size="sm" variant="ghost" onClick={() => setStep(0)}>Reiniciar</Button>
        </div>
        <div className="flex gap-1" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-line'}`} />)}</div>
      </div>
    </div>
  );
}

function RightChecker() {
  const [v, setV] = useState({ x: '6', y: '8', z: '10' });
  const nums = [v.x, v.y, v.z].map((s) => Number(s.replace(',', '.')));
  const ok = nums.every((n) => Number.isFinite(n) && n > 0);
  const sorted = ok ? [...nums].sort((p, q) => p - q) : [0, 0, 0];
  const [p, q, r] = sorted;
  const lhs = p * p + q * q, rhs = r * r;
  const exists = ok && p + q > r;
  const isRight = exists && Math.abs(lhs - rhs) <= 1e-9 * Math.max(1, rhs);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(['x', 'y', 'z'] as const).map((k, i) => (
          <label key={k} className="text-[13px]">Lado {i + 1}<input value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} inputMode="decimal" className="num ml-1 h-9 w-16 rounded-md border border-line bg-panel2 px-2" /></label>
        ))}
      </div>
      {ok && (
        exists ? (
          <div className="space-y-1 text-[14px]">
            <RichText text={`Lado mayor: $${tex(r)}$ → candidato a hipotenusa.`} />
            <div><RichText text={`$${tex(p)}^2 + ${tex(q)}^2 = ${tex(lhs, 4)}$ y $${tex(r)}^2 = ${tex(rhs, 4)}$`} /></div>
            <Badge tone={isRight ? 'ok' : lhs > rhs ? 'adj' : 'opp'}>{isRight ? '✓ Es rectángulo' : lhs > rhs ? 'No: es acutángulo (c² < a²+b²)' : 'No: es obtusángulo (c² > a²+b²)'}</Badge>
          </div>
        ) : <Callout tone="bad">Con esos lados no se forma un triángulo (el mayor es ≥ que la suma de los otros dos).</Callout>
      )}
    </div>
  );
}

export default function PythagorasLab() {
  const { act, save } = useLab('m7');
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const [grid, setGrid] = useState(true);
  const [proof, setProof] = useState(false);
  const c = Math.hypot(a, b);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel pad={false} title="Cuadrados sobre los lados" eyebrow="Laboratorio visual" actions={<Toggle id="m7-grid" checked={grid} onChange={setGrid} label="Contar cuadraditos" />}>
          <SquaresFigure a={a} b={b} grid={grid} />
        </Panel>
        <div className="space-y-4">
          <Panel title="Catetos" eyebrow="Controles">
            <div className="space-y-2">
              <Slider id="m7-a" label="a" value={a} min={1} max={8} step={0.5} color="opp" onChange={(v) => { setA(v); act(); }} />
              <Slider id="m7-b" label="b" value={b} min={1} max={8} step={0.5} color="adj" onChange={(v) => { setB(v); act(); }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Readout label="a²" value={fmt(a * a)} tone="opp" />
              <Readout label="b²" value={fmt(b * b)} tone="adj" />
              <Readout label="a² + b²" value={fmt(a * a + b * b)} />
              <Readout label="c²" value={fmt(c * c)} tone="hyp" sub={`c ≈ ${fmt(c, 3)}`} />
            </div>
            <div className="mt-3 text-center"><Tex display>{`${tex(a * a)} + ${tex(b * b)} = ${tex(a * a + b * b)} = ${tex(c, 3)}^2`}</Tex></div>
            <Badge tone="ok">✓ a² + b² = c² se cumple</Badge>
          </Panel>
          <Button variant="primary" className="w-full" onClick={() => { setProof(true); act(); setTimeout(() => document.getElementById('m7-proof')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}>DEMOSTRAR</Button>
          <Button variant="ghost" size="sm" onClick={() => save('Pitágoras', `$a = ${tex(a)}$, $b = ${tex(b)}$\n$a^2 + b^2 = ${tex(a * a)} + ${tex(b * b)} = ${tex(a * a + b * b)}$\n$c = \\sqrt{${tex(a * a + b * b)}} \\approx ${tex(c, 3)}$`, 'descubrimiento')}>Guardar en el cuaderno</Button>
        </div>
      </div>
      {proof && (
        <div id="m7-proof" className="scroll-mt-20">
          <Panel title="Demostración paso a paso" eyebrow="¿Por qué funciona?" actions={<Button size="sm" variant="ghost" onClick={() => setProof(false)}>Cerrar</Button>}>
            <Proof a={a} b={b} />
          </Panel>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="¿Es un triángulo rectángulo?" eyebrow="Comprobador"><RightChecker /></Panel>
        <Callout title="Lo que el teorema NO dice">
          <RichText text={`Solo vale en triángulos **rectángulos**, y $c$ debe ser la **hipotenusa** (el lado frente al ángulo recto). Para buscar un cateto se **resta**: $a^2 = c^2 - b^2$. Y ojo: $c \\neq a + b$ — aquí $a + b = ${tex(a + b)}$ pero $c \\approx ${tex(c, 3)}$.`} />
        </Callout>
      </div>
    </div>
  );
}
