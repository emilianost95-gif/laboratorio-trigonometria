import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Callout, Panel, Readout, Reveal, Segmented, Slider } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import { cosDeg, sinDeg, tanDeg } from '../../math/trig';
import { Arc, col, Dot, Label, Plane, Poly, RightMark, Seg, usePlane } from '../../visualizations/Plane';
import { FnCurve, UnitCircleOutline } from '../../visualizations/Curve';
import { useLab } from '../../utils/useLab';
import { prefersReducedMotion } from '../../utils/motion';

type Mode = 'double' | 'half';
const U = 45;
const G = 9.8, V0 = 20;
const pt = (deg: number, r = 1) => ({ x: r * cosDeg(deg), y: r * sinDeg(deg) });

/** Tiro parabólico: el alcance depende de sen 2α, por eso α y 90° − α llegan al mismo lugar. */
function Projectile({ onAct }: { onAct: () => void }) {
  const [alpha, setAlpha] = useState(30);
  const [t, setT] = useState<number | null>(null);
  const raf = useRef(0);
  const flight = (a: number) => (2 * V0 * sinDeg(a)) / G;
  const range = (a: number) => (V0 * V0 * sinDeg(2 * a)) / G;
  const pos = (a: number, time: number) => ({ x: V0 * cosDeg(a) * time, y: Math.max(0, V0 * sinDeg(a) * time - 0.5 * G * time * time) });
  const path = (a: number, upTo = flight(a)) => Array.from({ length: 61 }, (_, i) => pos(a, (upTo * i) / 60));
  const comp = 90 - alpha;

  const launch = () => {
    cancelAnimationFrame(raf.current);
    onAct();
    const T = flight(alpha);
    if (prefersReducedMotion()) { setT(T); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const time = Math.min(T, ((now - start) / 1000) * 1.6); // 1,6× para que no se haga largo
      setT(time);
      if (time < T) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => { cancelAnimationFrame(raf.current); setT(null); }, [alpha]);

  const R = range(alpha);
  const ball = t !== null ? pos(alpha, t) : null;
  const trail = t !== null ? path(alpha, t) : null;

  return (
    <Panel pad={false} title="Para qué sirve: el alcance de un lanzamiento" eyebrow={`v₀ = ${V0} m/s · R = v₀² · sen 2α / g`} actions={<Button size="sm" variant="primary" onClick={launch}>▶ Lanzar</Button>}>
      <Plane view={{ xmin: -3, xmax: 45, ymin: -3.5, ymax: 22.5 }} gridStep={5} xTickStep={10} yTickStep={10} tickFormat={(x) => `${x} m`} ariaLabel={`Lanzamiento a ${alpha} grados: alcance ${fmt(R, 1)} metros`}>
        <Seg a={{ x: -3, y: 0 }} b={{ x: 45, y: 0 }} tone="ink" width={2} opacity={0.5} />
        {Math.abs(comp - alpha) > 0.5 && <SvgPath pts={path(comp)} tone="ang" width={1.8} dash={5} opacity={0.75} />}
        <SvgPath pts={path(alpha)} tone="hyp" width={trail ? 1.6 : 2.6} opacity={trail ? 0.3 : 1} />
        {trail && <SvgPath pts={trail} tone="hyp" width={3} glow />}
        <Arc c={{ x: 0, y: 0 }} from={0} to={alpha} r={30} tone="hyp" />
        <Dot at={{ x: R, y: 0 }} tone="opp" r={5.5} />
        <Label at={{ x: R, y: 0 }} dy={15} tone="opp" size={12} bg>{fmt(R, 1)} m</Label>
        <Label at={pos(alpha, flight(alpha) / 2)} dy={-12} tone="hyp" size={11.5} bg>α = {alpha}°</Label>
        {Math.abs(comp - alpha) > 6 && <Label at={pos(comp, flight(comp) / 2)} dy={-12} tone="ang" size={11.5} bg>90° − α = {comp}°</Label>}
        {ball && <Dot at={ball} tone="hyp" r={7} />}
      </Plane>
      <div className="space-y-2 border-t border-line px-4 py-3">
        <Slider id="dh-alpha" label="α · ángulo de lanzamiento" value={alpha} min={5} max={85} step={1} unit="°" color="hyp" onChange={(a) => { setAlpha(Math.round(a)); onAct(); }} />
        <div className="overflow-x-auto text-[14px]"><Tex>{`R = \\dfrac{${V0}^2\\cdot\\sin(2\\cdot${alpha}°)}{${tex(G, 1)}} = \\dfrac{400\\cdot${tex(sinDeg(2 * alpha), 4)}}{${tex(G, 1)}} \\approx ${tex(R, 2)}\\text{ m}`}</Tex></div>
        <p className="text-[13.5px] text-muted"><RichText text={`Con $${comp}°$ el alcance es **el mismo**, porque $\\sin(2\\cdot${comp}°) = \\sin(${180 - 2 * alpha}°) = \\sin(${2 * alpha}°)$. El máximo está en $45°$, donde $\\sin 2\\alpha = 1$.`} /></p>
      </div>
    </Panel>
  );
}

function SvgPath({ pts, tone, width = 2, dash, opacity = 1, glow = false }: { pts: { x: number; y: number }[]; tone: Parameters<typeof col>[0]; width?: number; dash?: number; opacity?: number; glow?: boolean }) {
  const { sx, sy, px } = usePlane();
  return <polyline className={glow ? 'glow' : undefined} style={glow ? { color: col(tone) } : undefined} points={pts.map((p) => `${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`).join(' ')} fill="none" stroke={col(tone)} strokeOpacity={opacity} strokeWidth={px(width)} strokeDasharray={dash ? `${px(dash)} ${px(dash)}` : undefined} strokeLinejoin="round" strokeLinecap="round" pointerEvents="none" />;
}

export default function DoubleHalfLab() {
  const { act, save } = useLab('m20');
  const [mode, setMode] = useState<Mode>('double');
  const [theta, setThetaRaw] = useState(35);
  const setTheta = (t: number) => { setThetaRaw(t); act(); };
  const s = sinDeg(theta), c = cosDeg(theta);
  const dbl = mode === 'double';
  const target = dbl ? 2 * theta : theta / 2;
  const P = pt(theta), Q = pt(target);
  const acute = theta > 0 && theta < 90;

  // ángulo mitad: el signo lo decide el cuadrante de θ/2
  const sh = sinDeg(theta / 2), ch = cosDeg(theta / 2);
  const rootS = Math.sqrt(Math.max(0, (1 - c) / 2)), rootC = Math.sqrt(Math.max(0, (1 + c) / 2));
  const signC = ch < 0 ? '-' : '+';

  const proofDouble = [
    <RichText key="1" text="Dibuja el punto $P$ a ángulo $\theta$ y su reflejo $P'$ a ángulo $-\theta$. Con el origen forman un triángulo **isósceles** de lados 1 y ángulo $2\theta$ entre ellos." />,
    <RichText key="2" text="Su área, con la fórmula «medio producto de dos lados por el seno del ángulo entre ellos»: $\tfrac12\cdot1\cdot1\cdot\sin 2\theta$." />,
    <RichText key="3" text="Su área, con «base por altura sobre 2»: la base $PP'$ mide $2\sin\theta$ y la altura es $\cos\theta$, así que da $\tfrac12\cdot 2\sin\theta\cdot\cos\theta = \sin\theta\cos\theta$." />,
    <RichText key="4" text="Es el **mismo** triángulo, así que las áreas son iguales: $$\tfrac12\sin 2\theta = \sin\theta\cos\theta \;\Longrightarrow\; \sin 2\theta = 2\sin\theta\cos\theta$$" />,
  ];
  const proofHalf = [
    <RichText key="1" text="Parte del ángulo doble del coseno escrito con senos: $\cos 2\alpha = 1 - 2\sin^2\alpha$." />,
    <RichText key="2" text="Llama $\theta = 2\alpha$, es decir $\alpha = \tfrac{\theta}{2}$: $\cos\theta = 1 - 2\sin^2\tfrac{\theta}{2}$." />,
    <RichText key="3" text="Despeja: $\sin^2\tfrac{\theta}{2} = \dfrac{1 - \cos\theta}{2}$, y con $\cos 2\alpha = 2\cos^2\alpha - 1$ sale $\cos^2\tfrac{\theta}{2} = \dfrac{1 + \cos\theta}{2}$." />,
    <RichText key="4" text="Al sacar la raíz aparece $\pm$. El signo **no** lo da la fórmula: lo decide el **cuadrante donde cae** $\tfrac{\theta}{2}$. En la gráfica, la raíz (siempre positiva) se separa de $\cos\tfrac{\theta}{2}$ justo cuando este se vuelve negativo." />,
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <Panel pad={false} title={dbl ? 'θ y su doble' : 'θ y su mitad'} eyebrow="Círculo unitario">
            <div className="mx-auto max-w-[520px]">
              <Plane view={{ xmin: -1.5, xmax: 1.5, ymin: -1.5, ymax: 1.5 }} gridStep={0.25} xTickStep={0.5} yTickStep={0.5} ariaLabel={`θ = ${fmt(theta, 0)}°, ${dbl ? 'doble' : 'mitad'} = ${fmt(target, 1)}°`}>
                <UnitCircleOutline />
                {dbl && acute && (
                  <>
                    <Poly pts={[{ x: 0, y: 0 }, P, pt(-theta)]} tone="accent" fillOpacity={0.12} width={1.4} />
                    <Seg a={P} b={pt(-theta)} tone="opp" width={2.6} />
                    <Seg a={{ x: 0, y: 0 }} b={{ x: c, y: 0 }} tone="adj" width={2.6} />
                    <RightMark at={{ x: c, y: 0 }} u={{ x: -1, y: 0 }} v={{ x: 0, y: 1 }} size={9} />
                    <Label at={{ x: c, y: 0 }} dx={10} anchor="start" tone="opp" size={11} bg>2 sen θ</Label>
                    <Label at={{ x: c / 2, y: 0 }} dy={13} tone="adj" size={11} bg>cos θ</Label>
                    <Dot at={pt(-theta)} tone="muted" r={4.5} />
                  </>
                )}
                <Arc c={{ x: 0, y: 0 }} from={0} to={theta} r={30} tone="adj" />
                <Arc c={{ x: 0, y: 0 }} from={0} to={target} r={dbl ? 46 : 18} tone={dbl ? 'hyp' : 'ang'} fill={false} />
                <Seg a={{ x: 0, y: 0 }} b={P} tone="adj" width={2.6} />
                <Seg a={{ x: 0, y: 0 }} b={Q} tone={dbl ? 'hyp' : 'ang'} width={3} />
                <Seg a={Q} b={{ x: Q.x, y: 0 }} tone={dbl ? 'hyp' : 'ang'} width={2} dash={4} />
                <Dot at={P} tone="adj" r={6} />
                <Dot at={Q} tone={dbl ? 'hyp' : 'ang'} r={7} />
                <Label at={pt(theta, 1.19)} tone="adj" size={12} bg>θ = {fmt(theta, 0)}°</Label>
                <Label at={pt(target, dbl ? 1.2 : 1.33)} tone={dbl ? 'hyp' : 'ang'} size={12} bg>{dbl ? '2θ' : 'θ/2'} = {fmt(target, 1)}°</Label>
              </Plane>
            </div>
            {dbl && <p className="border-t border-line px-4 py-2 text-[12.5px] text-muted">{acute ? <>El triángulo sombreado tiene ángulo <span className="font-semibold text-hyp">2θ</span> en el origen: su área se puede calcular de dos formas (ver la demostración).</> : 'Lleva θ entre 0° y 90° para ver el triángulo de la demostración.'}</p>}
          </Panel>

          <Panel pad={false} title={dbl ? <Tex>{'2\\sin x\\cos x \\;\\text{ encima de }\\; \\sin 2x'}</Tex> : <Tex>{'\\sqrt{\\tfrac{1+\\cos x}{2}} \\;\\text{ frente a }\\; \\cos\\tfrac{x}{2}'}</Tex>} eyebrow={dbl ? 'Dos fórmulas, una sola curva' : 'Por qué hace falta el ±'}>
            <Plane view={{ xmin: -0.5, xmax: 8.5, ymin: -1.7, ymax: 1.7 }} gridStep={0.5} xTickStep={2} yTickStep={0.5} tickFormat={(x) => `${Math.round(x * U)}°`} yTickFormat={(y) => String(y).replace('-', '−').replace('.', ',')} ariaLabel={dbl ? 'Las curvas de 2 sen x cos x y sen 2x coinciden' : 'La raíz coincide con cos de x medios solo mientras este es positivo'}>
              {dbl ? (
                <>
                  <FnCurve f={sinDeg} from={0} to={360} unit={U} tone="opp" width={1.4} dash={4} opacity={0.6} />
                  <FnCurve f={cosDeg} from={0} to={360} unit={U} tone="adj" width={1.4} dash={4} opacity={0.6} />
                  <FnCurve f={(d) => sinDeg(2 * d)} from={0} to={360} unit={U} tone="hyp" width={7} opacity={0.3} />
                  <FnCurve f={(d) => 2 * sinDeg(d) * cosDeg(d)} from={0} to={360} unit={U} tone="accent" width={2.4} glow />
                  <Seg a={{ x: theta / U, y: 0 }} b={{ x: theta / U, y: sinDeg(2 * theta) }} tone="hyp" width={2} />
                  <Dot at={{ x: theta / U, y: sinDeg(2 * theta) }} tone="hyp" r={6} />
                </>
              ) : (
                <>
                  <FnCurve f={cosDeg} from={0} to={360} unit={U} tone="adj" width={1.4} dash={4} opacity={0.6} />
                  <FnCurve f={(d) => cosDeg(d / 2)} from={0} to={360} unit={U} tone="ang" width={7} opacity={0.3} />
                  <FnCurve f={(d) => Math.sqrt(Math.max(0, (1 + cosDeg(d)) / 2))} from={0} to={360} unit={U} tone="accent" width={2.4} glow />
                  <Seg a={{ x: theta / U, y: 0 }} b={{ x: theta / U, y: ch }} tone="ang" width={2} />
                  <Dot at={{ x: theta / U, y: ch }} tone="ang" r={6} />
                  {ch < -1e-9 && <Dot at={{ x: theta / U, y: rootC }} tone="accent" r={5} ring />}
                </>
              )}
            </Plane>
            <p className="border-t border-line px-4 py-2 text-[12.5px] text-muted">
              {dbl
                ? <>Línea fina = <span className="font-semibold text-accent">2 sen x cos x</span>; banda ancha = <span className="font-semibold text-hyp">sen 2x</span>. Calzan en todos los puntos. Punteadas: sen x y cos x.</>
                : <>Línea fina = <span className="font-semibold text-accent">la raíz</span> (nunca negativa); banda ancha = <span className="font-semibold text-ang">cos(x/2)</span>. Se separan pasado 180°: ahí el signo correcto es −.</>}
            </p>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Ángulo" eyebrow="Controles" actions={<Segmented size="sm" value={mode} onChange={(m) => { setMode(m); act(); }} options={[{ value: 'double', label: 'Ángulo doble' }, { value: 'half', label: 'Ángulo mitad' }]} />}>
            <Slider id="dh-theta" label="θ" value={theta} min={0} max={360} step={1} unit="°" color="adj" onChange={setTheta} />
            <div className="mt-2 flex flex-wrap gap-1">
              {[15, 30, 45, 60, 90, 120, 210, 300].map((a) => <Button key={a} size="sm" variant={a === theta ? 'primary' : 'soft'} className="num !px-2" onClick={() => setTheta(a)}>{a}°</Button>)}
            </div>
          </Panel>
          {dbl ? (
            <div className="grid grid-cols-2 gap-2">
              <Readout label="sen 2θ (medido)" value={fmt(sinDeg(2 * theta), 4)} tone="hyp" sub={`sen ${fmt(2 * theta, 0)}°`} />
              <Readout label="2 sen θ cos θ" value={fmt(2 * s * c, 4)} tone="accent" sub="por fórmula ✓" />
              <Readout label="cos 2θ (medido)" value={fmt(cosDeg(2 * theta), 4)} tone="hyp" sub={`cos ${fmt(2 * theta, 0)}°`} />
              <Readout label="cos²θ − sen²θ" value={fmt(c * c - s * s, 4)} tone="accent" sub="por fórmula ✓" />
              <Readout label="1 − 2 sen²θ" value={fmt(1 - 2 * s * s, 4)} tone="opp" sub="solo con seno" />
              <Readout label="2 cos²θ − 1" value={fmt(2 * c * c - 1, 4)} tone="adj" sub="solo con coseno" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Readout label="sen(θ/2) (medido)" value={fmt(sh, 4)} tone="ang" sub={`sen ${fmt(theta / 2, 1)}°`} />
              <Readout label="+√((1 − cos θ)/2)" value={fmt(rootS, 4)} tone="accent" sub="por fórmula ✓" />
              <Readout label="cos(θ/2) (medido)" value={fmt(ch, 4)} tone="ang" sub={`cos ${fmt(theta / 2, 1)}°`} />
              <Readout label={`${signC === '-' ? '−' : '+'}√((1 + cos θ)/2)`} value={fmt((signC === '-' ? -1 : 1) * rootC, 4)} tone="accent" sub={signC === '-' ? 'θ/2 en el II cuadrante → signo −' : 'θ/2 en el I cuadrante → signo +'} />
              <Readout label="tan(θ/2)" value={Number.isFinite(tanDeg(theta / 2)) ? fmt(tanDeg(theta / 2), 4) : '—'} tone="ang" />
              <Readout label="sen θ / (1 + cos θ)" value={Math.abs(1 + c) > 1e-9 ? fmt(s / (1 + c), 4) : '—'} tone="accent" sub="sin raíz ni ±" />
            </div>
          )}
          <Callout tone="warn" title="El error más común">
            {dbl
              ? <RichText text={`Duplicar el ángulo **no** duplica el seno. Con $\\theta = ${fmt(theta, 0)}°$: $2\\sin\\theta = ${tex(2 * s, 4)}$, pero $\\sin 2\\theta = ${tex(sinDeg(2 * theta), 4)}$.${Math.abs(2 * s) > 1 ? ' Además $2\\sin\\theta$ supera 1: imposible para un seno.' : ''}`} />
              : <RichText text={`Partir el ángulo **no** parte el coseno. Con $\\theta = ${fmt(theta, 0)}°$: $\\dfrac{\\cos\\theta}{2} = ${tex(c / 2, 4)}$, pero $\\cos\\dfrac{\\theta}{2} = ${tex(ch, 4)}$.`} />}
            <div className="mt-2"><Badge tone="muted">{dbl ? 'Prueba θ = 45°: sen 2θ llega a su máximo, 1' : 'Prueba θ = 300°: la raíz da positivo, pero cos 150° es negativo'}</Badge></div>
          </Callout>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="¿Por qué funciona?" eyebrow={dbl ? 'Demostración con áreas' : 'Del doble a la mitad'}><Reveal key={mode} steps={dbl ? proofDouble : proofHalf} /></Panel>
        <Projectile onAct={act} />
      </div>
      <button type="button" className="text-[13px] text-accent underline" onClick={() => save('Ángulo doble y mitad', '$\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$\n$\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta = 1 - 2\\sin^2\\theta = 2\\cos^2\\theta - 1$\n$\\tan 2\\theta = \\dfrac{2\\tan\\theta}{1 - \\tan^2\\theta}$\n$\\sin\\tfrac{\\theta}{2} = \\pm\\sqrt{\\tfrac{1 - \\cos\\theta}{2}}$, $\\cos\\tfrac{\\theta}{2} = \\pm\\sqrt{\\tfrac{1 + \\cos\\theta}{2}}$ (el signo lo da el cuadrante de $\\theta/2$)', 'formula')}>Guardar fórmulas en el cuaderno</button>
    </div>
  );
}
