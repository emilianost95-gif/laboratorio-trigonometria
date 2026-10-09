import { col, usePlane } from './Plane';

type Tone = Parameters<typeof col>[0];

/**
 * Curva y = f(grados) dentro de un <Plane> donde 1 unidad horizontal = `unit` grados.
 * Corta el trazo en asíntotas y valores fuera de `clip`.
 */
export function FnCurve({ f, from, to, unit = 60, tone = 'accent', width = 2.6, dash, opacity = 1, clip = 9, step = 1, glow = false }: {
  f: (deg: number) => number; from: number; to: number; unit?: number; tone?: Tone; width?: number; dash?: number; opacity?: number; clip?: number; step?: number; glow?: boolean;
}) {
  const { sx, sy, px } = usePlane();
  const segs: string[][] = [[]];
  let prev = NaN;
  for (let d = from; d <= to + 1e-9; d += step) {
    const y = f(d);
    if (!Number.isFinite(y) || Math.abs(y) > clip) { if (segs[segs.length - 1].length) segs.push([]); prev = NaN; continue; }
    if (Number.isFinite(prev) && Math.abs(y - prev) > clip * 0.7) segs.push([]);
    segs[segs.length - 1].push(`${sx(d / unit).toFixed(2)},${sy(y).toFixed(2)}`);
    prev = y;
  }
  return (
    <g pointerEvents="none" className={glow ? 'glow' : undefined} style={glow ? { color: col(tone) } : undefined}>
      {segs.filter((s) => s.length > 1).map((s, i) => (
        <polyline key={i} points={s.join(' ')} fill="none" stroke={col(tone)} strokeOpacity={opacity} strokeWidth={px(width)} strokeDasharray={dash ? `${px(dash)} ${px(dash)}` : undefined} strokeLinejoin="round" strokeLinecap="round" />
      ))}
    </g>
  );
}

/** Arco SOBRE una circunferencia de radio `r` (unidades del mundo) centrada en el origen. */
export function CircleArc({ from, to, r = 1, tone = 'accent', width = 4, opacity = 1 }: { from: number; to: number; r?: number; tone?: Tone; width?: number; opacity?: number }) {
  const { sx, sy, k, px } = usePlane();
  const R = k * r;
  const pt = (deg: number) => `${sx(r * Math.cos((deg * Math.PI) / 180))} ${sy(r * Math.sin((deg * Math.PI) / 180))}`;
  const sweep = to - from;
  if (Math.abs(sweep) < 0.01) return null;
  return <path d={`M ${pt(from)} A ${R} ${R} 0 ${Math.abs(sweep) > 180 ? 1 : 0} ${sweep > 0 ? 0 : 1} ${pt(to)}`} fill="none" stroke={col(tone)} strokeOpacity={opacity} strokeWidth={px(width)} strokeLinecap="round" pointerEvents="none" />;
}

export function UnitCircleOutline({ r = 1 }: { r?: number }) {
  const { sx, sy, k, px } = usePlane();
  return <circle cx={sx(0)} cy={sy(0)} r={k * r} fill="none" stroke="rgb(var(--ink))" strokeOpacity={0.5} strokeWidth={px(1.6)} pointerEvents="none" />;
}
