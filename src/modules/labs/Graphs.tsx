import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Callout, Panel, Readout, Segmented, Slider, Toggle } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import { cosDeg, sinDeg, tanDeg } from '../../math/trig';
import { Dot, Label, Plane, Seg, usePlane } from '../../visualizations/Plane';
import { useStore } from '../../store/store';
import { useLab } from '../../utils/useLab';
import { useMediaQuery } from '../../utils/hooks';
import { pick } from '../generators';

type Fn = 'sin' | 'cos' | 'tan';
interface Params { fn: Fn; A: number; B: number; C: number; D: number }
const F: Record<Fn, (d: number) => number> = { sin: sinDeg, cos: cosDeg, tan: tanDeg };
const U = 60; // 1 unidad del mundo = 60°
const VIEW = { xmin: -3.6, xmax: 12.6, ymin: -6.5, ymax: 6.5 };
const evalP = (p: Params, deg: number) => p.A * F[p.fn](p.B * (deg - p.C)) + p.D;
const periodOf = (p: Params) => (p.fn === 'tan' ? 180 : 360) / Math.abs(p.B);

function radLabel(deg: number) {
  const k = Math.round(deg / 30); // múltiplos de π/6
  if (k === 0) return '0';
  const g = (x: number, y: number): number => (y ? g(y, x % y) : x);
  const d = g(Math.abs(k), 6);
  const num = k / d, den = 6 / d;
  const n = num === 1 ? 'π' : num === -1 ? '−π' : `${String(num).replace('-', '−')}π`;
  return den === 1 ? n : `${n}/${den}`;
}

/** Curva y = A·f(B(x − C)) + D. Corta en las asíntotas de la tangente. */
function Curve({ p, tone = 'accent', width = 2.6, dash, opacity = 1, upTo }: { p: Params; tone?: string; width?: number; dash?: number; opacity?: number; upTo?: number }) {
  const { sx, sy, px } = usePlane();
  const segs: string[][] = [[]];
  const end = upTo ?? VIEW.xmax * U;
  for (let deg = VIEW.xmin * U; deg <= end; deg += 1) {
    const y = evalP(p, deg);
    if (!Number.isFinite(y) || Math.abs(y) > 9) { if (segs[segs.length - 1].length) segs.push([]); continue; }
    if (p.fn === 'tan') {
      const prev = evalP(p, deg - 1);
      if (Number.isFinite(prev) && Math.abs(y - prev) > 6) segs.push([]);
    }
    segs[segs.length - 1].push(`${sx(deg / U)},${sy(y)}`);
  }
  return <g pointerEvents="none" className={tone === 'accent' && opacity === 1 ? 'glow' : undefined} style={{ color: `rgb(var(--${tone}))` }}>{segs.filter((s) => s.length > 1).map((s, i) => <polyline key={i} points={s.join(' ')} fill="none" stroke={`rgb(var(--${tone}))`} strokeOpacity={opacity} strokeWidth={px(width)} strokeDasharray={dash ? `${px(dash)} ${px(dash)}` : undefined} strokeLinejoin="round" />)}</g>;
}

function Equation({ p }: { p: Params }) {
  const A = p.A === 1 ? '' : p.A === -1 ? '-' : tex(p.A);
  const inner = p.C === 0 ? `${p.B === 1 ? '' : tex(p.B)}x` : `${p.B === 1 ? '' : tex(p.B)}(x ${p.C > 0 ? '-' : '+'} ${tex(Math.abs(p.C))}°)`;
  const D = p.D === 0 ? '' : ` ${p.D > 0 ? '+' : '-'} ${tex(Math.abs(p.D))}`;
  return <Tex display>{`y = ${A}\\${p.fn}\\left(${inner}\\right)${D}`}</Tex>;
}

const randomTarget = (fn: Fn): Params => ({ fn, A: pick([1, 1.5, 2, 3, -2, 4]), B: pick([0.5, 1, 2, 3]), C: pick([0, 30, 45, 60, 90, -45, -90]), D: pick([-2, -1, 0, 1, 2]) });

export default function GraphsLab() {
  const { act, save } = useLab('m16');
  const { dispatch } = useStore();
  const [p, setP] = useState<Params>({ fn: 'sin', A: 2, B: 1, C: 0, D: 0 });
  const [unit, setUnit] = useState<'deg' | 'rad'>('deg');
  const [base, setBase] = useState(true);
  const [anim, setAnim] = useState<number | null>(null);
  const [target, setTarget] = useState<Params | null>(null);
  const [matched, setMatched] = useState(false);
  const raf = useRef(0);
  const narrow = !useMediaQuery('(min-width: 640px)');
  const set = (patch: Partial<Params>) => { setP((x) => ({ ...x, ...patch })); act(); };

  const T = periodOf(p);
  const isTan = p.fn === 'tan';
  const amp = Math.abs(p.A);

  // "desenrollar": recorrer un período con un cursor
  const play = () => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const x0 = p.C, dur = 3500;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      setAnim(x0 + k * (isTan ? T : T));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    act();
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // reto: igualar la curva
  const close = useMemo(() => {
    if (!target || target.fn !== p.fn) return false;
    // comparar valores en muchos puntos (dos parámetros distintos pueden dar la misma curva)
    for (let d = -180; d <= 720; d += 7) {
      const y1 = evalP(p, d), y2 = evalP(target, d);
      if (!Number.isFinite(y1) || !Number.isFinite(y2)) continue;
      if (Math.abs(y1) > 8 || Math.abs(y2) > 8) continue;
      if (Math.abs(y1 - y2) > 0.06) return false;
    }
    return true;
  }, [p, target]);
  useEffect(() => {
    if (close && target && !matched) {
      setMatched(true);
      dispatch({ type: 'attempt', category: 'graphs', level: 3, correct: true, firstTry: true, title: 'Iguala la onda', module: 'm16', final: true });
    }
  }, [close, target, matched, dispatch]);

  const cursorDeg = anim;
  const cursorY = cursorDeg !== null ? evalP(p, cursorDeg) : null;
  const xTick = (x: number) => (unit === 'deg' ? `${Math.round(x * U)}°` : radLabel(x * U));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel pad={false} title={<Equation p={p} />} eyebrow="y = A · f(B(x − C)) + D"
          actions={<><Segmented size="sm" value={unit} onChange={setUnit} options={[{ value: 'deg', label: 'grados' }, { value: 'rad', label: 'radianes' }]} /><Toggle id="g-base" checked={base} onChange={setBase} label="Función base" /></>}>
          <Plane view={VIEW} gridStep={0.5} xTickStep={narrow ? 3 : 1.5} yTickStep={1} tickFormat={xTick} yTickFormat={(y) => String(y).replace('-', '−')} ariaLabel={`Gráfica de ${p.fn}: amplitud ${fmt(amp)}, período ${fmt(T)} grados`}>
            {base && <Curve p={{ fn: p.fn, A: 1, B: 1, C: 0, D: 0 }} tone="muted" width={1.6} dash={5} opacity={0.7} />}
            {target && <Curve p={target} tone="ang" width={6} opacity={0.35} />}
            {!isTan && <><Seg a={{ x: VIEW.xmin, y: p.D }} b={{ x: VIEW.xmax, y: p.D }} tone="hyp" width={1.2} dash={5} /><Seg a={{ x: VIEW.xmin, y: p.D + amp }} b={{ x: VIEW.xmax, y: p.D + amp }} tone="ok" width={1} dash={2} opacity={0.6} /><Seg a={{ x: VIEW.xmin, y: p.D - amp }} b={{ x: VIEW.xmax, y: p.D - amp }} tone="ok" width={1} dash={2} opacity={0.6} /></>}
            {isTan && Array.from({ length: 30 }, (_, i) => p.C + (90 + 180 * (i - 10)) / p.B).filter((d) => d / U > VIEW.xmin && d / U < VIEW.xmax).map((d) => <Seg key={d} a={{ x: d / U, y: VIEW.ymin }} b={{ x: d / U, y: VIEW.ymax }} tone="bad" width={1} dash={4} opacity={0.5} />)}
            {/* un período marcado desde C */}
            <Seg a={{ x: p.C / U, y: VIEW.ymin + 0.6 }} b={{ x: (p.C + T) / U, y: VIEW.ymin + 0.6 }} tone="ang" width={3} />
            <Seg a={{ x: p.C / U, y: VIEW.ymin + 0.35 }} b={{ x: p.C / U, y: VIEW.ymin + 0.85 }} tone="ang" width={2} />
            <Seg a={{ x: (p.C + T) / U, y: VIEW.ymin + 0.35 }} b={{ x: (p.C + T) / U, y: VIEW.ymin + 0.85 }} tone="ang" width={2} />
            <Label at={{ x: (p.C + T / 2) / U, y: VIEW.ymin + 0.6 }} dy={-11} tone="ang" size={11.5} bg>período {unit === 'deg' ? `${fmt(T, 1)}°` : radLabel(T) || fmt((T * Math.PI) / 180, 3)}</Label>
            <Curve p={p} upTo={anim !== null ? anim : undefined} />
            {anim !== null && anim < p.C + T - 0.5 && <Curve p={p} opacity={0.18} />}
            {cursorDeg !== null && cursorY !== null && Number.isFinite(cursorY) && Math.abs(cursorY) < 6.4 && <><Seg a={{ x: cursorDeg / U, y: p.D }} b={{ x: cursorDeg / U, y: cursorY }} tone="opp" width={2} /><Dot at={{ x: cursorDeg / U, y: cursorY }} tone="opp" r={5.5} /></>}
          </Plane>
        </Panel>
        <div className="space-y-4">
          <Panel title="Parámetros" eyebrow="Mueve uno a la vez" actions={<Segmented size="sm" value={p.fn} onChange={(fn) => { set({ fn }); if (target) setTarget({ ...target, fn }); }} options={[{ value: 'sin', label: 'sen' }, { value: 'cos', label: 'cos' }, { value: 'tan', label: 'tan' }]} />}>
            <div className="space-y-2">
              <Slider id="g-A" label="A · amplitud (estira en vertical)" value={p.A} min={-5} max={5} step={0.5} color="opp" onChange={(A) => set({ A })} />
              <Slider id="g-B" label="B · frecuencia (comprime en horizontal)" value={p.B} min={0.25} max={4} step={0.25} color="adj" onChange={(B) => set({ B })} />
              <Slider id="g-C" label="C · desfase (mueve a los lados)" value={p.C} min={-180} max={180} step={15} unit="°" color="ang" onChange={(C) => set({ C })} />
              <Slider id="g-D" label="D · desplazamiento vertical" value={p.D} min={-4} max={4} step={0.5} color="hyp" onChange={(D) => set({ D })} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={play}>▶ Recorrer un período</Button>
              <Button size="sm" variant="ghost" onClick={() => { setP({ fn: p.fn, A: 1, B: 1, C: 0, D: 0 }); setAnim(null); }}>Volver a la base</Button>
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-2">
            <Readout label="Amplitud |A|" value={isTan ? '—' : fmt(amp, 2)} tone="opp" sub={isTan ? 'la tangente no tiene' : `oscila ±${fmt(amp, 2)} del centro`} />
            <Readout label="Período" value={`${fmt(T, 1)}°`} tone="adj" sub={`= ${radLabel(T) && Number.isInteger(T / 30) ? radLabel(T) : fmt((T * Math.PI) / 180, 3)} rad`} />
            <Readout label="Desfase C" value={`${fmt(p.C, 0)}°`} tone="ang" sub={p.C > 0 ? 'hacia la derecha' : p.C < 0 ? 'hacia la izquierda' : 'sin desfase'} />
            <Readout label="Recorrido" value={isTan ? 'todos los reales' : `[${fmt(p.D - amp)}, ${fmt(p.D + amp)}]`} tone="hyp" sub={`eje central y = ${fmt(p.D)}`} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Iguala la onda" eyebrow="Reto" actions={<Button size="sm" variant={target ? 'ghost' : 'primary'} onClick={() => { setTarget(randomTarget(p.fn === 'tan' ? 'sin' : p.fn)); if (p.fn === 'tan') set({ fn: 'sin' }); setMatched(false); }}>{target ? 'Otro reto' : 'Empezar reto'}</Button>}>
          {target ? (
            <div className="space-y-2 text-[14px]">
              <p>Ajusta A, B, C y D hasta que tu curva quede encima de la <span className="font-semibold text-ang">curva ancha dorada</span>.</p>
              {close ? <Callout tone="ok" title="¡Coinciden!"><span>La ecuación objetivo era</span> <Equation p={target} />{(target.A !== p.A || target.C !== p.C) && <span className="text-[13px] text-muted">Tus parámetros son distintos pero dibujan la misma curva: un desfase de un período completo, o reflejar con −A y desfasar medio período, da la misma onda.</span>}</Callout>
                : <ul className="list-disc space-y-1 pl-5 text-muted"><li>Primero la altura del centro (D) y la amplitud (A).</li><li>Luego cuenta cuánto mide un ciclo para sacar B.</li><li>Al final, desliza con C.</li></ul>}
            </div>
          ) : <p className="text-[14px] text-muted">Aparecerá una onda objetivo. Tu misión: reproducirla solo con los cuatro parámetros.</p>}
        </Panel>
        <Panel title="Qué hace cada parámetro" eyebrow="Resumen">
          <ul className="space-y-1.5 text-[14px]">
            <li><Badge tone="opp">A</Badge> <RichText text="multiplica la **salida**: estira la onda en vertical. Negativo = reflejada." /></li>
            <li><Badge tone="adj">B</Badge> <RichText text="multiplica la **entrada**: la onda gira más rápido. Período $T = \dfrac{360°}{|B|}$ (o $\dfrac{180°}{|B|}$ en la tangente)." /></li>
            <li><Badge tone="ang">C</Badge> <RichText text="resta a la entrada: la onda se mueve **a la derecha** si $C > 0$ (el signo engaña: $x - 60°$ va a la derecha)." /></li>
            <li><Badge tone="hyp">D</Badge> <RichText text="suma a la salida: sube o baja todo. El eje central queda en $y = D$." /></li>
          </ul>
          <Button className="mt-3" size="sm" variant="ghost" onClick={() => save('Gráfica trigonométrica', `$y = ${tex(p.A)}\\${p.fn}(${tex(p.B)}(x - ${tex(p.C)}°)) + ${tex(p.D)}$\nAmplitud ${isTan ? '—' : fmt(amp)}, período ${fmt(T, 1)}°, desfase ${fmt(p.C)}°, eje y = ${fmt(p.D)}`, 'formula')}>Guardar en el cuaderno</Button>
        </Panel>
      </div>
    </div>
  );
}
