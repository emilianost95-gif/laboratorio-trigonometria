import { fmt, toRad } from '../math/core';
import { angleQuadrant, cosDeg, sinDeg, tanDeg } from '../math/trig';
import { Arc, Dot, DraggablePoint, InfLine, Label, Plane, Poly, RightMark, Seg, usePlane } from './Plane';

export interface UnitCircleLayers { triangle: boolean; projections: boolean; tangent: boolean; line: boolean; squares?: boolean; quadrants: boolean }

function CircleShape({ r = 1 }: { r?: number }) {
  const { sx, sy, k, px } = usePlane();
  return <circle cx={sx(0)} cy={sy(0)} r={k * r} fill="none" stroke="rgb(var(--ink))" strokeOpacity={0.55} strokeWidth={px(1.8)} />;
}

function QuadrantShade({ q }: { q: number }) {
  if (!q) return null;
  const L = 1.7;
  const sx = q === 1 || q === 4 ? 1 : -1, sy = q <= 2 ? 1 : -1;
  return <Poly pts={[{ x: 0, y: 0 }, { x: L * sx, y: 0 }, { x: L * sx, y: L * sy }, { x: 0, y: L * sy }]} tone="accent" fillOpacity={0.05} stroke={false} />;
}

/** Círculo unitario interactivo: P = (cos θ, sin θ). */
export function UnitCircleView({ theta, onTheta, layers, snap = 0, r = 1, maxHeight }: { theta: number; onTheta: (t: number) => void; layers: UnitCircleLayers; snap?: number; r?: number; maxHeight?: string }) {
  const c = cosDeg(theta), s = sinDeg(theta), t = tanDeg(theta);
  const P = { x: r * c, y: r * s };
  const Q = { x: r * c, y: 0 };
  const lim = 1.6 * r;
  const view = { xmin: -lim, xmax: lim, ymin: -lim, ymax: lim };
  const q = angleQuadrant(theta);
  const showTan = layers.tangent && Number.isFinite(t) && Math.abs(t) < 1.55;
  return (
    <Plane view={view} gridStep={0.25 * r} xTickStep={0.5 * r} yTickStep={0.5 * r} ariaLabel={`Círculo unitario, θ = ${fmt(theta, 1)}°, cos = ${fmt(c, 3)}, sen = ${fmt(s, 3)}`} maxHeight={maxHeight}>
      {layers.quadrants && <QuadrantShade q={q} />}
      <CircleShape r={r} />
      {layers.line && <InfLine a={{ x: 0, y: 0 }} b={P} tone="hyp" width={1.4} opacity={0.45} dash={5} />}
      {layers.squares && (
        <>
          <Poly pts={[{ x: 0, y: 0 }, Q, { x: Q.x, y: -Math.abs(Q.x) * Math.sign(s || 1) }, { x: 0, y: -Math.abs(Q.x) * Math.sign(s || 1) }]} tone="adj" fillOpacity={0.14} width={1} />
          <Poly pts={[Q, P, { x: P.x + Math.abs(P.y) * Math.sign(c || 1), y: P.y }, { x: Q.x + Math.abs(P.y) * Math.sign(c || 1), y: 0 }]} tone="opp" fillOpacity={0.14} width={1} />
        </>
      )}
      {layers.triangle && q !== 0 && <Poly pts={[{ x: 0, y: 0 }, Q, P]} tone="accent" fillOpacity={0.08} stroke={false} />}
      {layers.triangle && q !== 0 && <RightMark at={Q} u={{ x: -Math.sign(c), y: 0 }} v={{ x: 0, y: Math.sign(s) }} size={10} />}
      {layers.projections && <Seg a={{ x: 0, y: 0 }} b={Q} tone="adj" width={4} />}
      {layers.projections && <Seg a={Q} b={P} tone="opp" width={4} />}
      {layers.projections && <Seg a={P} b={{ x: 0, y: P.y }} tone="opp" width={1.2} dash={3} opacity={0.6} />}
      {showTan && (
        <>
          <Seg a={{ x: r, y: -lim }} b={{ x: r, y: lim }} tone="muted" width={1} dash={3} />
          <Seg a={{ x: 0, y: 0 }} b={{ x: r, y: r * t }} tone="ang" width={1.2} dash={4} opacity={0.7} />
          <Seg a={{ x: r, y: 0 }} b={{ x: r, y: r * t }} tone="ang" width={4} />
          <Label at={{ x: r, y: (r * t) / 2 }} dx={8} anchor="start" tone="ang" size={12} bg>tan θ</Label>
        </>
      )}
      <Seg a={{ x: 0, y: 0 }} b={P} tone="hyp" width={3} />
      {theta > 0.01 && <Arc c={{ x: 0, y: 0 }} from={0} to={theta} r={26} />}
      <Label at={{ x: 0, y: 0 }} dx={38 * Math.cos(toRad(theta / 2))} dy={-38 * Math.sin(toRad(theta / 2))} tone="ang" size={12}>θ</Label>
      {layers.projections && Math.abs(c) > 0.12 && <Label at={{ x: Q.x / 2, y: 0 }} dy={s >= 0 ? 15 : -15} tone="adj" size={12} bg>cos θ</Label>}
      {layers.projections && Math.abs(s) > 0.12 && <Label at={{ x: Q.x, y: P.y / 2 }} dx={c >= 0 ? 9 : -9} anchor={c >= 0 ? 'start' : 'end'} tone="opp" size={12} bg>sen θ</Label>}
      <Label at={P} dx={c >= 0 ? 14 : -14} dy={s >= 0 ? -16 : 16} anchor={c >= 0 ? 'start' : 'end'} tone="hyp" size={13} bg>P</Label>
      <Dot at={{ x: 0, y: 0 }} r={3} />
      <DraggablePoint at={P} tone="hyp" r={8} name="Punto P sobre el círculo"
        constrain={(p) => { const a = Math.atan2(p.y, p.x); return { x: r * Math.cos(a), y: r * Math.sin(a) }; }}
        onChange={(p) => {
          let d = ((Math.atan2(p.y, p.x) * 180) / Math.PI + 360) % 360;
          if (snap) d = (Math.round(d / snap) * snap) % 360;
          else d = Math.round(d * 10) / 10;
          onTheta(d);
        }} />
    </Plane>
  );
}

/** Ondas seno y coseno de 0° a 360° con el θ actual marcado: el círculo "desenrollado". */
export function WavesView({ theta, show = { sin: true, cos: true } }: { theta: number; show?: { sin: boolean; cos: boolean } }) {
  const kY = 60; // 1 unidad vertical = 60 grados de ancho visual
  const view = { xmin: -20, xmax: 375, ymin: -1.35 * kY, ymax: 1.35 * kY };
  return (
    <Plane view={view} W={720} grid={false} ariaLabel="Ondas de seno y coseno" xTickStep={90} yTickStep={kY} tickFormat={(x) => `${x}°`} yTickFormat={(y) => String(Math.round(y / kY))}>
      <WaveCurves kY={kY} show={show} />
      <Seg a={{ x: theta, y: -1.2 * kY }} b={{ x: theta, y: 1.2 * kY }} tone="ang" width={1.4} dash={4} />
      {show.sin && <Dot at={{ x: theta, y: sinDeg(theta) * kY }} tone="opp" r={5.5} />}
      {show.cos && <Dot at={{ x: theta, y: cosDeg(theta) * kY }} tone="adj" r={5.5} />}
    </Plane>
  );
}

function WaveCurves({ kY, show }: { kY: number; show: { sin: boolean; cos: boolean } }) {
  const { sx, sy, px } = usePlane();
  const mk = (f: (d: number) => number) => {
    const pts: string[] = [];
    for (let d = 0; d <= 360; d += 2) pts.push(`${sx(d)},${sy(f(d) * kY)}`);
    return pts.join(' ');
  };
  return (
    <>
      {show.cos && <polyline points={mk(cosDeg)} fill="none" stroke="rgb(var(--adj))" strokeWidth={px(2.2)} />}
      {show.sin && <polyline points={mk(sinDeg)} fill="none" stroke="rgb(var(--opp))" strokeWidth={px(2.2)} />}
    </>
  );
}
