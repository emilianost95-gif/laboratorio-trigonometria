import { useState, type ReactNode } from 'react';
import { Badge, Button, Callout, Panel, Readout, Segmented, Slider } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, norm360, tex, toRad } from '../../math/core';
import { angleKind } from '../../math/geometry';
import { radTex } from '../../math/trig';
import { Arc, DraggablePoint, Label, Plane, Seg, usePlane } from '../../visualizations/Plane';
import { useStore } from '../../store/store';
import { useLab } from '../../utils/useLab';
import { rnd, pick } from '../generators';

const VIEW = { xmin: -1.32, xmax: 1.32, ymin: -1.32, ymax: 1.32 };
const PRESETS = [0, 30, 45, 60, 90, 180, 270, 360];

function ProtractorScale({ unit }: { unit: 'deg' | 'rad' }) {
  const { sx, sy, px } = usePlane();
  const els: ReactNode[] = [];
  for (let d = 0; d < 360; d += 1) {
    const len = d % 10 === 0 ? 0.09 : d % 5 === 0 ? 0.06 : 0.03;
    const c = Math.cos(toRad(d)), s = Math.sin(toRad(d));
    els.push(<line key={d} x1={sx(c)} y1={sy(s)} x2={sx(c * (1 - len))} y2={sy(s * (1 - len))} stroke="rgb(var(--ink))" strokeOpacity={d % 10 === 0 ? 0.6 : 0.3} strokeWidth={px(d % 10 === 0 ? 1.2 : 0.8)} />);
  }
  const labels = unit === 'deg' ? Array.from({ length: 12 }, (_, i) => i * 30) : [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
  labels.forEach((d) => {
    const r = 1.16;
    els.push(
      <text key={`l${d}`} x={sx(r * Math.cos(toRad(d)))} y={sy(r * Math.sin(toRad(d)))} fontSize={px(unit === 'deg' ? 11 : 10)} textAnchor="middle" dominantBaseline="middle" className="svg-text" fill="rgb(var(--muted))">
        {unit === 'deg' ? `${d}°` : radLabel(d)}
      </text>,
    );
  });
  return (
    <g pointerEvents="none">
      <circle cx={sx(0)} cy={sy(0)} r={sx(1) - sx(0)} fill="rgb(var(--panel2))" fillOpacity={0.5} stroke="rgb(var(--ink))" strokeOpacity={0.5} strokeWidth={px(1.2)} />
      {els}
    </g>
  );
}

function radLabel(d: number) {
  if (d === 0) return '0';
  const map: Record<number, string> = { 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2', 120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π', 210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2', 300: '5π/3', 315: '7π/4', 330: '11π/6' };
  return map[d] ?? '';
}

const KIND_INFO: Record<string, { tone: 'ok' | 'adj' | 'opp' | 'hyp' | 'ang' | 'muted'; text: string }> = {
  nulo: { tone: 'muted', text: 'Ángulo nulo: los dos lados coinciden (0°).' },
  agudo: { tone: 'ok', text: 'Agudo: más que 0° y menos que 90°. "Más cerrado que una esquina".' },
  recto: { tone: 'adj', text: 'Recto: exactamente 90°, un cuarto de vuelta. La esquina de una hoja.' },
  obtuso: { tone: 'opp', text: 'Obtuso: entre 90° y 180°. Más abierto que una esquina.' },
  llano: { tone: 'hyp', text: 'Llano: 180°, media vuelta. Los lados forman una recta.' },
  cóncavo: { tone: 'ang', text: 'Cóncavo (o entrante): entre 180° y 360°.' },
  completo: { tone: 'muted', text: 'Completo: 360°, una vuelta entera.' },
};

function Protractor({ theta, setTheta, unit, onAct }: { theta: number; setTheta: (t: number) => void; unit: 'deg' | 'rad'; onAct?: () => void }) {
  const P = { x: Math.cos(toRad(theta)), y: Math.sin(toRad(theta)) };
  return (
    <Plane view={VIEW} W={520} grid={false} axes={false} ariaLabel={`Transportador con un ángulo de ${fmt(theta, 1)} grados`} maxHeight="520px">
      <ProtractorScale unit={unit} />
      {theta > 0 && <Arc c={{ x: 0, y: 0 }} from={0} to={theta} r={70} />}
      <Seg a={{ x: 0, y: 0 }} b={{ x: 1, y: 0 }} tone="ink" width={3} />
      <Seg a={{ x: 0, y: 0 }} b={P} tone="accent" width={3.5} />
      <Label at={{ x: 0.42 * Math.cos(toRad(theta / 2)), y: 0.42 * Math.sin(toRad(theta / 2)) }} tone="ang" size={15} bg>
        {unit === 'deg' ? `${fmt(theta, 1)}°` : `${fmt(toRad(theta), 3)} rad`}
      </Label>
      <DraggablePoint at={P} tone="accent" r={9} name="Brazo del transportador"
        constrain={(p) => { const a = Math.atan2(p.y, p.x); return { x: Math.cos(a), y: Math.sin(a) }; }}
        onChange={(p) => { setTheta(Math.round(norm360((Math.atan2(p.y, p.x) * 180) / Math.PI) * 10) / 10); onAct?.(); }} />
    </Plane>
  );
}

function Explore() {
  const { act, save } = useLab('m4');
  const [theta, setTheta] = useState(60);
  const [unit, setUnit] = useState<'deg' | 'rad'>('deg');
  const kind = angleKind(theta);
  const info = KIND_INFO[kind];
  const rad = toRad(theta);
  const exactRad = Number.isInteger(theta) && theta % 15 === 0;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel pad={false} title="Transportador virtual" eyebrow="Arrastra el brazo" actions={<Segmented size="sm" value={unit} onChange={setUnit} options={[{ value: 'deg', label: 'Grados' }, { value: 'rad', label: 'Radianes' }]} />}>
        <div className="mx-auto max-w-[520px]"><Protractor theta={theta} setTheta={setTheta} unit={unit} onAct={act} /></div>
      </Panel>
      <div className="space-y-4">
        <Panel title="Medida" eyebrow="Lectura">
          <Slider id="m4-theta" label="Ángulo θ" value={theta} min={0} max={360} step={1} unit="°" color="ang" onChange={(v) => { setTheta(v); act(); }} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => <Button key={p} size="sm" variant={theta === p ? 'primary' : 'soft'} onClick={() => { setTheta(p); act(); }}>{p}°</Button>)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Readout label="Grados" value={`${fmt(theta, 1)}°`} tone="ang" />
            <Readout label="Radianes" value={fmt(rad, 4)} tone="accent" sub={exactRad ? undefined : 'aprox.'} />
            <Readout label="Fracción de vuelta" value={fmt(theta / 360, 4)} />
            <Readout label="Arco (radio 1)" value={fmt(rad, 3)} sub="= medida en radianes" />
          </div>
          {exactRad && <div className="mt-2 text-[14px]"><RichText text={`Exacto: $${theta}° = ${radTex(theta)}$ rad`} /></div>}
        </Panel>
        <Panel title="Clasificación" eyebrow="Tipo de ángulo">
          <Badge tone={info.tone} className="mb-2 text-[13px]">{kind.toUpperCase()}</Badge>
          <p className="text-[14px]">{info.text}</p>
        </Panel>
        <Callout title="¿Qué es un radián?">
          <RichText text={`En un círculo de radio $1$, un ángulo de **1 radián** abarca un arco de longitud **1** (igual al radio). La vuelta completa mide $2\\pi \\approx 6{,}28$ radios de arco, por eso $360° = 2\\pi$ rad y $180° = \\pi$ rad.`} />
          <div className="mt-1"><Tex>{`\\text{rad} = \\text{grados}\\cdot\\frac{\\pi}{180°} \\quad\\Rightarrow\\quad ${tex(theta, 1)}° \\approx ${tex(rad, 4)}\\text{ rad}`}</Tex></div>
        </Callout>
        <Button variant="ghost" size="sm" onClick={() => save('Ángulo medido', `$\\theta = ${tex(theta, 1)}° = ${exactRad ? radTex(theta) : tex(rad, 4)}$ rad — ${kind}`)}>Guardar en el cuaderno</Button>
      </div>
    </div>
  );
}

type Ch = 'classify' | 'build' | 'estimate';
const KINDS = ['agudo', 'recto', 'obtuso', 'llano', 'completo'] as const;
function newAngle(c: Ch): number {
  if (c === 'classify') {
    const k = pick(KINDS);
    return k === 'agudo' ? rnd(10, 80) : k === 'recto' ? 90 : k === 'obtuso' ? rnd(100, 170) : k === 'llano' ? 180 : 360;
  }
  return pick([rnd(1, 35) * 10, pick([30, 45, 60, 90, 120, 135, 150, 210, 225, 240, 300, 315])]);
}

function Challenges() {
  const { dispatch } = useStore();
  const [c, setC] = useState<Ch>('classify');
  const [target, setTarget] = useState(() => newAngle('classify'));
  const [theta, setTheta] = useState(0);
  const [est, setEst] = useState('');
  const [fb, setFb] = useState<{ ok: boolean; msg: string } | null>(null);
  const [score, setScore] = useState({ ok: 0, t: 0 });
  const reset = (k: Ch = c) => { setC(k); setTarget(newAngle(k)); setTheta(0); setEst(''); setFb(null); };
  const rec = (ok: boolean, msg: string) => {
    setFb({ ok, msg });
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), t: s.t + 1 }));
    dispatch({ type: 'attempt', category: 'angles', level: c === 'classify' ? 1 : 2, correct: ok, firstTry: !fb, title: 'Desafío de ángulos', module: 'm4', final: ok });
  };
  const shown = c === 'build' ? theta : target;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel pad={false} title={c === 'classify' ? 'Clasifica el ángulo' : c === 'build' ? `Construye un ángulo de ${target}°` : 'Estima la medida'} eyebrow="Desafío" actions={<span className="num text-[13px] text-muted">aciertos {score.ok}/{score.t}</span>}>
        <div className="mx-auto max-w-[520px]">
          {c === 'build' ? <Protractor theta={theta} setTheta={(t) => { setTheta(t); setFb(null); }} unit="deg" /> : (
            <Plane view={VIEW} W={520} grid={false} axes={false} ariaLabel="Ángulo del desafío" maxHeight="520px">
              {c !== 'estimate' && <ProtractorScale unit="deg" />}
              {shown > 0 && <Arc c={{ x: 0, y: 0 }} from={0} to={shown} r={60} />}
              <Seg a={{ x: 0, y: 0 }} b={{ x: 1, y: 0 }} tone="ink" width={3} />
              <Seg a={{ x: 0, y: 0 }} b={{ x: Math.cos(toRad(shown)), y: Math.sin(toRad(shown)) }} tone="accent" width={3.5} />
            </Plane>
          )}
        </div>
      </Panel>
      <div className="space-y-4">
        <Panel title="Tipo de desafío">
          <Segmented size="sm" value={c} onChange={(k) => reset(k)} options={[{ value: 'classify', label: 'Clasificar' }, { value: 'build', label: 'Construir' }, { value: 'estimate', label: 'Estimar' }]} />
        </Panel>
        <Panel title="Tu respuesta">
          {c === 'classify' && (
            <div className="grid grid-cols-2 gap-2">
              {KINDS.map((k) => <Button key={k} disabled={fb?.ok} onClick={() => rec(angleKind(target) === k, angleKind(target) === k ? `Sí: ${target}° es ${k}.` : `No es ${k}. ${KIND_INFO[k].text} Compara con 90° (esquina) y 180° (recta).`)}>{k}</Button>)}
            </div>
          )}
          {c === 'build' && (
            <>
              <p className="mb-2 text-[14px]">Arrastra el brazo hasta <strong>{target}°</strong> (margen ±2°). Ahora marca <span className="num">{fmt(theta, 1)}°</span>.</p>
              <Button variant="primary" disabled={fb?.ok} onClick={() => { const e = theta - target; rec(Math.abs(e) <= 2, Math.abs(e) <= 2 ? '¡Preciso!' : `Te ${e > 0 ? 'pasaste' : 'faltaron'} ${fmt(Math.abs(e), 1)}°. Usa las marcas largas: cada una son 10°.`); }}>Comprobar</Button>
            </>
          )}
          {c === 'estimate' && (
            <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); const v = Number(est.replace(',', '.')); if (!Number.isFinite(v) || est === '') return; const err = Math.abs(v - target); rec(err <= 10, err <= 10 ? `¡Buen ojo! Medía ${target}° (error ${fmt(err)}°).` : `Medía ${target}°. Referencias: 90° es una esquina, 45° la mitad de una esquina, 180° una recta.`); }}>
              <label htmlFor="m4-est" className="text-[14px]">Medida estimada (±10°):</label>
              <input id="m4-est" value={est} onChange={(e) => setEst(e.target.value)} className="num h-10 w-20 rounded-md border border-line bg-panel2 px-2" inputMode="decimal" />
              <span>°</span>
              <Button type="submit" variant="primary" disabled={fb?.ok}>Comprobar</Button>
            </form>
          )}
          {fb && <div className="mt-3"><Callout tone={fb.ok ? 'ok' : 'warn'} title={fb.ok ? 'Correcto' : 'Revisemos'}>{fb.msg}</Callout></div>}
          <Button className="mt-3" size="sm" variant={fb?.ok ? 'primary' : 'soft'} onClick={() => reset()}>Nuevo desafío →</Button>
        </Panel>
      </div>
    </div>
  );
}

export default function AnglesLab() {
  const [mode, setMode] = useState<'explore' | 'challenge'>('explore');
  return (
    <div className="space-y-4">
      <Segmented value={mode} onChange={setMode} ariaLabel="Modo" options={[{ value: 'explore', label: 'EXPLORAR' }, { value: 'challenge', label: 'DESAFÍOS' }]} />
      {mode === 'explore' ? <Explore /> : <Challenges />}
    </div>
  );
}
