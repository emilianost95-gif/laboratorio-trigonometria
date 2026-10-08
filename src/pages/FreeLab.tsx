import { useState, type ReactNode } from 'react';
import { Badge, Button, Panel, Readout, Segmented, Slider, Toggle } from '../components/ui';
import { RichText } from '../components/Tex';
import { fmt, tex, toRad } from '../math/core';
import { dist, signedArea, slope, triangleFromPoints, type Pt } from '../math/geometry';
import { angleQuadrant, cosDeg, sinDeg, tanDeg } from '../math/trig';
import { Arc, DraggablePoint, Dot, InfLine, Label, Plane, Poly, RightMark, Seg, usePlane } from '../visualizations/Plane';
import { WavesView } from '../visualizations/UnitCircle';
import { useStore } from '../store/store';
import { toast } from '../utils/toast';

const VIEW = { xmin: -6.5, xmax: 6.5, ymin: -6.5, ymax: 6.5 };

function ProtractorRing({ r }: { r: number }) {
  const { sx, sy, px } = usePlane();
  const els: ReactNode[] = [];
  for (let d = 0; d < 360; d += 5) {
    const len = d % 30 === 0 ? 0.35 : d % 10 === 0 ? 0.2 : 0.1;
    const c = Math.cos(toRad(d)), s = Math.sin(toRad(d));
    els.push(<line key={d} x1={sx(c * r)} y1={sy(s * r)} x2={sx(c * (r + len))} y2={sy(s * (r + len))} stroke="rgb(var(--ink))" strokeOpacity={0.45} strokeWidth={px(1)} />);
    if (d % 30 === 0) els.push(<text key={`t${d}`} x={sx(c * (r + 0.7))} y={sy(s * (r + 0.7))} fontSize={px(10)} textAnchor="middle" dominantBaseline="middle" className="svg-text" fill="rgb(var(--muted))">{d}°</text>);
  }
  return <g pointerEvents="none">{els}</g>;
}

interface Layers { circle: boolean; triangle: boolean; projections: boolean; line: boolean; tangent: boolean; protractor: boolean; waves: boolean }

function Connected() {
  const { addNote } = useStore();
  const [theta, setTheta] = useState(40);
  const [r, setR] = useState(4);
  const [L, setL] = useState<Layers>({ circle: true, triangle: true, projections: true, line: true, tangent: true, protractor: false, waves: true });
  const c = cosDeg(theta), s = sinDeg(theta), t = tanDeg(theta);
  const P = { x: r * c, y: r * s }, Q = { x: r * c, y: 0 };
  const q = angleQuadrant(theta);
  const m = Number.isFinite(t) ? P.y / P.x : Infinity;
  const tanPt = { x: r, y: r * t };
  const tanVisible = L.tangent && Number.isFinite(t) && Math.abs(r * t) < 6.4;
  const toggles: [keyof Layers, string][] = [['circle', 'Círculo'], ['triangle', 'Triángulo'], ['projections', 'cos / sen'], ['line', 'Recta OP'], ['tangent', 'Tangente'], ['protractor', 'Transportador'], ['waves', 'Ondas']];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel pad={false} title="Todo conectado" eyebrow="Arrastra P · cambia el radio"
          actions={<span className="text-[12px] text-muted">θ → seno/coseno → triángulo → pendiente → tangente</span>}>
          <div className="mx-auto max-w-[680px]">
            <Plane view={VIEW} ariaLabel={`Laboratorio conectado: θ ${fmt(theta)}°, radio ${fmt(r)}`}>
              {L.circle && <CircleR r={r} />}
              {L.protractor && <ProtractorRing r={r} />}
              {L.line && <InfLine a={{ x: 0, y: 0 }} b={P} tone="hyp" width={1.6} opacity={0.5} dash={6} />}
              {L.triangle && q !== 0 && <><Poly pts={[{ x: 0, y: 0 }, Q, P]} tone="accent" fillOpacity={0.1} stroke={false} /><RightMark at={Q} u={{ x: -Math.sign(c), y: 0 }} v={{ x: 0, y: Math.sign(s) }} /></>}
              {L.projections && <><Seg a={{ x: 0, y: 0 }} b={Q} tone="adj" width={4} /><Seg a={Q} b={P} tone="opp" width={4} /></>}
              {L.projections && Math.abs(c) > 0.1 && <Label at={{ x: Q.x / 2, y: 0 }} dy={s >= 0 ? 15 : -15} tone="adj" size={12} bg>x = r·cos θ = {fmt(P.x)}</Label>}
              {L.projections && Math.abs(s) > 0.1 && <Label at={{ x: Q.x, y: P.y / 2 }} dx={c >= 0 ? -9 : 9} anchor={c >= 0 ? 'end' : 'start'} tone="opp" size={12} bg>y = r·sen θ = {fmt(P.y)}</Label>}
              {tanVisible && <><Seg a={{ x: r, y: -6.5 }} b={{ x: r, y: 6.5 }} tone="muted" width={1} dash={3} /><Seg a={{ x: r, y: 0 }} b={tanPt} tone="ang" width={4} /><Dot at={tanPt} tone="ang" r={4} /><Label at={{ x: r, y: tanPt.y / 2 }} dx={8} anchor="start" tone="ang" size={12} bg>r·tan θ = {fmt(r * t)}</Label></>}
              <Seg a={{ x: 0, y: 0 }} b={P} tone="hyp" width={3} />
              {theta > 0.01 && <Arc c={{ x: 0, y: 0 }} from={0} to={theta} r={30} />}
              <Label at={{ x: 0, y: 0 }} dx={44 * Math.cos(toRad(theta / 2))} dy={-44 * Math.sin(toRad(theta / 2))} tone="ang" size={12}>θ</Label>
              <DraggablePoint at={P} label="P" tone="hyp" r={8} constrain={(p) => { const a = Math.atan2(p.y, p.x); return { x: r * Math.cos(a), y: r * Math.sin(a) }; }}
                onChange={(p) => setTheta(Math.round(((Math.atan2(p.y, p.x) * 180) / Math.PI + 360) % 360 * 10) / 10)} />
            </Plane>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line px-4 py-2.5">
            {toggles.map(([k, label]) => <Toggle key={k} id={`fl-${k}`} checked={L[k]} onChange={(v) => setL({ ...L, [k]: v })} label={label} />)}
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Controles" eyebrow="Entrada">
            <div className="space-y-2">
              <Slider id="fl-theta" label="Ángulo θ" value={theta} min={0} max={360} step={1} unit="°" color="ang" onChange={setTheta} />
              <Slider id="fl-r" label="Radio r (hipotenusa)" value={r} min={1} max={5.5} step={0.1} color="hyp" onChange={setR} />
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-2">
            <Readout label="θ" value={`${fmt(theta, 1)}°`} tone="ang" sub={`${fmt(toRad(theta), 4)} rad`} />
            <Readout label="cuadrante" value={['eje', 'I', 'II', 'III', 'IV'][q]} />
            <Readout label="sen θ = y / r" value={fmt(s, 4)} tone="opp" sub={`${fmt(P.y, 2)} / ${fmt(r, 2)}`} />
            <Readout label="cos θ = x / r" value={fmt(c, 4)} tone="adj" sub={`${fmt(P.x, 2)} / ${fmt(r, 2)}`} />
            <Readout label="pendiente OP" value={Number.isFinite(m) ? fmt(m, 4) : 'vertical'} tone="hyp" sub="Δy / Δx" />
            <Readout label="tan θ" value={Number.isFinite(t) ? fmt(t, 4) : 'no def.'} tone="ang" sub="= pendiente ✓" />
            <Readout label="x² + y²" value={fmt(P.x * P.x + P.y * P.y, 4)} sub={`= r² = ${fmt(r * r, 4)}`} />
            <Readout label="sen² + cos²" value={fmt(s * s + c * c, 6)} tone="ok" sub="siempre 1" />
          </div>
          <Panel title="Relaciones que puedes comprobar" eyebrow="Descubre">
            <ul className="space-y-1.5 text-[13.5px]">
              <li><RichText text="Cambia **r** sin tocar θ: x e y cambian, pero **sen, cos y tan no**." /></li>
              <li><RichText text="La **pendiente** de OP es siempre igual a **tan θ**." /></li>
              <li><RichText text="Pasa θ por 90°: la pendiente se vuelve vertical y **tan θ deja de existir**." /></li>
              <li><RichText text="$x^2 + y^2 = r^2$ es Pitágoras; dividido por $r^2$ da $\cos^2\theta + \sin^2\theta = 1$." /></li>
            </ul>
            <Button className="mt-3" size="sm" variant="ghost" onClick={() => { addNote({ kind: 'resultado', title: 'Laboratorio libre', body: `$\\theta = ${tex(theta, 1)}°$, $r = ${tex(r)}$\n$P = (${tex(P.x, 3)}, ${tex(P.y, 3)})$\n$\\sin\\theta = ${tex(s, 4)}$, $\\cos\\theta = ${tex(c, 4)}$, $\\tan\\theta = ${Number.isFinite(t) ? tex(t, 4) : '\\text{no def.}'}$\nPendiente de OP = ${Number.isFinite(m) ? fmt(m, 4) : 'vertical'}` }); toast('Guardado en el cuaderno'); }}>Guardar estado en el cuaderno</Button>
          </Panel>
        </div>
      </div>
      {L.waves && (
        <Panel title="Ondas: el ángulo convertido en función" eyebrow="sen θ y cos θ de 0° a 360°">
          <div className="overflow-x-auto"><div className="min-w-[480px]"><WavesView theta={theta} /></div></div>
        </Panel>
      )}
    </div>
  );
}

function CircleR({ r }: { r: number }) {
  const { sx, sy, k, px } = usePlane();
  return <circle cx={sx(0)} cy={sy(0)} r={k * r} fill="none" stroke="rgb(var(--ink))" strokeOpacity={0.5} strokeWidth={px(1.6)} />;
}

const NAMES = 'ABCDEFGH';
function FreeGeometry() {
  const [pts, setPts] = useState<(Pt & { n: string })[]>([{ n: 'A', x: -3, y: -2 }, { n: 'B', x: 3, y: 2 }]);
  const [snap, setSnap] = useState(true);
  const add = (p: Pt) => {
    if (pts.length >= 3) { toast('Máximo 3 puntos en este modo: arrastra los existentes o limpia', 'accent'); return; }
    const n = NAMES.split('').find((l) => !pts.some((x) => x.n === l))!;
    setPts([...pts, { n, x: snap ? Math.round(p.x) : +p.x.toFixed(1), y: snap ? Math.round(p.y) : +p.y.toFixed(1) }]);
  };
  const [A, B, C] = pts;
  const tri = pts.length === 3 && Math.abs(signedArea(A, B, C)) > 0.01 ? triangleFromPoints(A, B, C) : null;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel pad={false} title="Geometría libre" eyebrow="Toca para crear (hasta 3 puntos)" actions={<><Toggle id="fg-snap" checked={snap} onChange={setSnap} label="Enteros" /><Button size="sm" variant="ghost" onClick={() => setPts([])}>Limpiar</Button></>}>
        <Plane view={VIEW} cursor onPlaneClick={add} ariaLabel="Geometría libre">
          {pts.length === 2 && <InfLine a={A} b={B} tone="accent" width={2} opacity={0.6} />}
          {pts.length >= 2 && <Seg a={A} b={B} tone="hyp" width={3} />}
          {tri && <Poly pts={[A, B, C]} tone="accent" fillOpacity={0.1} strokeTone="ink" width={2.5} />}
          {pts.map((p, i) => <DraggablePoint key={p.n} at={p} label={p.n} showCoords snap={snap ? 1 : 0.1} tone={(['accent', 'hyp', 'opp'] as const)[i]} onChange={(np) => setPts(pts.map((x) => (x.n === p.n ? { ...x, ...np } : x)))} />)}
        </Plane>
      </Panel>
      <div className="space-y-3">
        {pts.length < 2 && <Panel title="Empieza"><p className="text-[14px] text-muted">Toca el plano para crear puntos. Con 2 puntos verás distancia y pendiente; con 3, un triángulo completo.</p></Panel>}
        {pts.length >= 2 && (
          <Panel title={`Segmento ${A.n}${B.n}`} eyebrow="2 puntos">
            <div className="grid grid-cols-2 gap-2">
              <Readout label="distancia" value={fmt(dist(A, B), 3)} tone="hyp" />
              <Readout label="pendiente" value={Number.isFinite(slope(A, B)) ? fmt(slope(A, B), 3) : 'vertical'} tone="accent" />
              <Readout label="punto medio" value={`(${fmt((A.x + B.x) / 2)}, ${fmt((A.y + B.y) / 2)})`} />
              <Readout label="inclinación" value={A.x === B.x ? '90°' : `${fmt((Math.atan(slope(A, B)) * 180) / Math.PI, 1)}°`} tone="ang" sub="arctan(m)" />
            </div>
          </Panel>
        )}
        {tri && (
          <Panel title="Triángulo ABC" eyebrow="3 puntos">
            <div className="grid grid-cols-2 gap-2">
              <Readout label="perímetro" value={fmt(tri.perimeter, 2)} />
              <Readout label="área" value={fmt(tri.area, 2)} tone="accent" />
              <Readout label="ángulos" value={tri.angles.map((a) => fmt(a, 0) + '°').join(' ')} tone="ang" sub={`suma ${fmt(tri.angles.reduce((x, y) => x + y), 1)}°`} />
              <Readout label="lados" value={tri.sides.map((x) => fmt(x, 1)).join(' · ')} />
            </div>
            <div className="mt-2 flex gap-2"><Badge tone="accent">{tri.bySides}</Badge><Badge tone="ang">{tri.byAngles}</Badge></div>
          </Panel>
        )}
        {pts.length === 3 && !tri && <Panel title="Puntos alineados"><p className="text-[14px] text-muted">Los tres puntos están en una recta: no forman triángulo.</p></Panel>}
      </div>
    </div>
  );
}

export function FreeLab() {
  const [tab, setTab] = useState<'connected' | 'geometry'>('connected');
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Sin ejercicios · solo experimentar</div>
          <h1 className="text-[30px] font-semibold">Laboratorio libre</h1>
          <p className="mt-1 max-w-[65ch] text-muted">Todas las herramientas en un solo espacio. Mueve algo y observa qué más cambia.</p>
        </div>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'connected', label: 'Ángulo conectado' }, { value: 'geometry', label: 'Geometría libre' }]} />
      </header>
      {tab === 'connected' ? <Connected /> : <FreeGeometry />}
    </div>
  );
}
