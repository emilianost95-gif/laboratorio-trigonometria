import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react';
import type { Pt } from '../math/geometry';

export interface View { xmin: number; xmax: number; ymin: number; ymax: number }

interface PlaneCtx {
  view: View;
  W: number;
  H: number;
  /** píxeles de viewBox por unidad del mundo */
  k: number;
  sx: (x: number) => number;
  sy: (y: number) => number;
  /** convierte píxeles de PANTALLA a unidades de viewBox (texto y trazos de tamaño constante) */
  px: (n: number) => number;
  toWorld: (clientX: number, clientY: number) => Pt;
}

const Ctx = createContext<PlaneCtx | null>(null);
export const usePlane = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlane fuera de <Plane>');
  return c;
};

const fmtTick = (v: number) => (Math.abs(v) < 1e-9 ? '0' : String(+v.toFixed(2)).replace('-', '−').replace('.', ','));

export interface PlaneProps {
  view: View;
  W?: number;
  grid?: boolean;
  gridStep?: number;
  axes?: boolean;
  ticks?: boolean;
  cursor?: boolean;
  onPlaneClick?: (p: Pt) => void;
  children?: ReactNode;
  ariaLabel: string;
  className?: string;
  maxHeight?: string;
  /** Formato de las etiquetas de los ejes */
  tickFormat?: (v: number) => string;
  yTickFormat?: (v: number) => string;
  xTickStep?: number;
  yTickStep?: number;
  quadrantLabels?: boolean;
}

/**
 * Plano cartesiano en SVG con escala igual en X e Y.
 * Todo lo dibujado dentro usa coordenadas del mundo a través de usePlane().
 */
export function Plane({ view, W = 640, grid = true, gridStep = 1, axes = true, ticks = true, cursor = false, onPlaneClick, children, ariaLabel, className = '', maxHeight, tickFormat = fmtTick, yTickFormat, xTickStep, yTickStep, quadrantLabels = false }: PlaneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rendered, setRendered] = useState(W);
  const [hover, setHover] = useState<Pt | null>(null);

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    // Escala real de dibujo: con maxHeight el SVG puede quedar limitado por el alto (preserveAspectRatio)
    const update = () => {
      const r = el.getBoundingClientRect();
      const ratio = (view.ymax - view.ymin) / (view.xmax - view.xmin);
      setRendered(Math.min(r.width || W, r.height ? r.height / ratio : Infinity));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [W, view.xmin, view.xmax, view.ymin, view.ymax]);

  const ctx = useMemo<PlaneCtx>(() => {
    const k = W / (view.xmax - view.xmin);
    const H = (view.ymax - view.ymin) * k;
    const u = W / Math.max(120, rendered);
    return {
      view, W, H, k,
      sx: (x) => (x - view.xmin) * k,
      sy: (y) => H - (y - view.ymin) * k,
      px: (n) => n * u,
      toWorld: (cx, cy) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const pt = svg.createSVGPoint();
        pt.x = cx; pt.y = cy;
        const m = svg.getScreenCTM();
        if (!m) return { x: 0, y: 0 };
        const p = pt.matrixTransform(m.inverse());
        return { x: view.xmin + p.x / k, y: view.ymin + (H - p.y) / k };
      },
    };
  }, [view, W, rendered]);

  const { sx, sy, H, k, px } = ctx;

  // Paso de etiquetas para que no se amontonen (≥ 30 px de pantalla)
  const autoStep = useCallback((s?: number) => {
    if (s) return s;
    for (const c of [0.5, 1, 2, 5, 10, 20, 50]) if ((c * k) / px(1) >= 30 && c >= gridStep) return c;
    return 100;
  }, [k, px, gridStep]);
  const xs = autoStep(xTickStep), ys = autoStep(yTickStep);

  const gridLines: ReactNode[] = [];
  if (grid) {
    const gx0 = Math.ceil(view.xmin / gridStep) * gridStep;
    for (let x = gx0; x <= view.xmax + 1e-9; x += gridStep) {
      const major = Math.abs(x / xs - Math.round(x / xs)) < 1e-6;
      gridLines.push(<line key={`gx${x}`} x1={sx(x)} x2={sx(x)} y1={0} y2={H} stroke="rgb(var(--ink))" strokeOpacity={major ? 0.11 : 0.05} strokeWidth={px(1)} />);
    }
    const gy0 = Math.ceil(view.ymin / gridStep) * gridStep;
    for (let y = gy0; y <= view.ymax + 1e-9; y += gridStep) {
      const major = Math.abs(y / ys - Math.round(y / ys)) < 1e-6;
      gridLines.push(<line key={`gy${y}`} y1={sy(y)} y2={sy(y)} x1={0} x2={W} stroke="rgb(var(--ink))" strokeOpacity={major ? 0.11 : 0.05} strokeWidth={px(1)} />);
    }
  }

  const tickEls: ReactNode[] = [];
  if (axes && ticks) {
    const fs = px(11);
    const ox = Math.min(Math.max(sx(0), px(4)), W - px(4));
    const oy = Math.min(Math.max(sy(0), px(4)), H - px(16));
    for (let x = Math.ceil(view.xmin / xs) * xs; x <= view.xmax + 1e-9; x += xs) {
      if (Math.abs(x) < 1e-9 || sx(x) < px(8) || sx(x) > W - px(8)) continue;
      tickEls.push(<g key={`tx${x}`}><line x1={sx(x)} x2={sx(x)} y1={oy - px(3)} y2={oy + px(3)} stroke="rgb(var(--muted))" strokeWidth={px(1)} /><text x={sx(x)} y={oy + px(14)} fontSize={fs} textAnchor="middle" className="svg-text" fill="rgb(var(--muted))">{tickFormat(x)}</text></g>);
    }
    for (let y = Math.ceil(view.ymin / ys) * ys; y <= view.ymax + 1e-9; y += ys) {
      if (Math.abs(y) < 1e-9 || sy(y) < px(8) || sy(y) > H - px(8)) continue;
      tickEls.push(<g key={`ty${y}`}><line y1={sy(y)} y2={sy(y)} x1={ox - px(3)} x2={ox + px(3)} stroke="rgb(var(--muted))" strokeWidth={px(1)} /><text x={ox - px(6)} y={sy(y) + px(4)} fontSize={fs} textAnchor="end" className="svg-text" fill="rgb(var(--muted))">{(yTickFormat ?? tickFormat)(y)}</text></g>);
    }
    if (view.xmin < 0 && view.xmax > 0 && view.ymin < 0 && view.ymax > 0)
      tickEls.push(<text key="o" x={sx(0) - px(6)} y={sy(0) + px(14)} fontSize={fs} textAnchor="end" className="svg-text" fill="rgb(var(--muted))">0</text>);
  }

  const onMove = (e: RPointerEvent<SVGSVGElement>) => { if (cursor && e.pointerType === 'mouse') setHover(ctx.toWorld(e.clientX, e.clientY)); };
  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPlaneClick) return;
    if ((e.target as Element).closest('.drag-handle')) return;
    onPlaneClick(ctx.toWorld(e.clientX, e.clientY));
  };

  return (
    <Ctx.Provider value={ctx}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={`plane ${onPlaneClick ? 'cursor-crosshair' : ''} ${className}`}
        style={maxHeight ? { maxHeight, width: '100%' } : undefined}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onClick={onClick}
      >
        <rect x={0} y={0} width={W} height={H} fill="rgb(var(--panel))" />
        {gridLines}
        {quadrantLabels && view.xmin < 0 && view.ymin < 0 && (
          <g className="svg-text" fontSize={px(28)} fill="rgb(var(--ink))" fillOpacity={0.07} fontWeight={700} textAnchor="middle">
            <text x={(sx(0) + W) / 2} y={sy(0) / 2 + px(10)}>I</text>
            <text x={sx(0) / 2} y={sy(0) / 2 + px(10)}>II</text>
            <text x={sx(0) / 2} y={(sy(0) + H) / 2 + px(10)}>III</text>
            <text x={(sx(0) + W) / 2} y={(sy(0) + H) / 2 + px(10)}>IV</text>
          </g>
        )}
        {axes && (
          <g stroke="rgb(var(--ink))" strokeOpacity={0.55} strokeWidth={px(1.4)}>
            {view.ymin <= 0 && view.ymax >= 0 && <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} />}
            {view.xmin <= 0 && view.xmax >= 0 && <line y1={0} y2={H} x1={sx(0)} x2={sx(0)} />}
          </g>
        )}
        {axes && view.ymin <= 0 && view.ymax >= 0 && <text x={W - px(6)} y={sy(0) - px(6)} fontSize={px(12)} textAnchor="end" className="svg-text" fill="rgb(var(--muted))" fontStyle="italic">x</text>}
        {axes && view.xmin <= 0 && view.xmax >= 0 && <text x={sx(0) + px(7)} y={px(14)} fontSize={px(12)} className="svg-text" fill="rgb(var(--muted))" fontStyle="italic">y</text>}
        {tickEls}
        {children}
        {cursor && hover && (
          <g pointerEvents="none">
            <line x1={sx(hover.x)} x2={sx(hover.x)} y1={0} y2={H} stroke="rgb(var(--accent))" strokeOpacity={0.35} strokeDasharray={`${px(3)} ${px(3)}`} strokeWidth={px(1)} />
            <line y1={sy(hover.y)} y2={sy(hover.y)} x1={0} x2={W} stroke="rgb(var(--accent))" strokeOpacity={0.35} strokeDasharray={`${px(3)} ${px(3)}`} strokeWidth={px(1)} />
            <rect x={px(6)} y={px(6)} width={px(118)} height={px(22)} rx={px(4)} fill="rgb(var(--panel2))" stroke="rgb(var(--line))" strokeWidth={px(1)} />
            <text x={px(13)} y={px(21)} fontSize={px(12)} className="svg-text" fill="rgb(var(--ink))">({fmtTick(Math.round(hover.x * 10) / 10)}, {fmtTick(Math.round(hover.y * 10) / 10)})</text>
          </g>
        )}
      </svg>
    </Ctx.Provider>
  );
}

// ================= primitivas =================

type Tone = 'accent' | 'opp' | 'adj' | 'hyp' | 'ang' | 'ink' | 'muted' | 'ok' | 'bad' | 'warn';
export const col = (t: Tone, a = 1) => (a === 1 ? `rgb(var(--${t}))` : `rgb(var(--${t}) / ${a})`);

export function Seg({ a, b, tone = 'ink', width = 2, dash, opacity = 1 }: { a: Pt; b: Pt; tone?: Tone; width?: number; dash?: number; opacity?: number }) {
  const { sx, sy, px } = usePlane();
  return <line x1={sx(a.x)} y1={sy(a.y)} x2={sx(b.x)} y2={sy(b.y)} stroke={col(tone)} strokeOpacity={opacity} strokeWidth={px(width)} strokeLinecap="round" strokeDasharray={dash ? `${px(dash)} ${px(dash)}` : undefined} />;
}

/** Recta infinita por dos puntos (el SVG la recorta). */
export function InfLine({ a, b, tone = 'accent', width = 2, opacity = 1, dash }: { a: Pt; b: Pt; tone?: Tone; width?: number; opacity?: number; dash?: number }) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  if (L < 1e-9) return null;
  const f = 1000 / L;
  return <Seg a={{ x: a.x - dx * f, y: a.y - dy * f }} b={{ x: a.x + dx * f, y: a.y + dy * f }} tone={tone} width={width} opacity={opacity} dash={dash} />;
}

export function Poly({ pts, tone = 'accent', fillOpacity = 0.12, stroke = true, width = 2, strokeTone }: { pts: Pt[]; tone?: Tone; fillOpacity?: number; stroke?: boolean; width?: number; strokeTone?: Tone }) {
  const { sx, sy, px } = usePlane();
  return <polygon points={pts.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill={col(tone, fillOpacity)} stroke={stroke ? col(strokeTone ?? tone) : 'none'} strokeWidth={px(width)} strokeLinejoin="round" />;
}

export function Label({ at, children, tone = 'ink', dx = 0, dy = 0, size = 13, anchor = 'middle', weight = 600, bg = false, rotate = 0 }: { at: Pt; children: ReactNode; tone?: Tone; dx?: number; dy?: number; size?: number; anchor?: 'start' | 'middle' | 'end'; weight?: number; bg?: boolean; rotate?: number }) {
  const { sx, sy, px } = usePlane();
  const x = sx(at.x) + px(dx), y = sy(at.y) + px(dy);
  return (
    <text x={x} y={y} transform={rotate ? `rotate(${-rotate} ${x} ${y})` : undefined} fontSize={px(size)} textAnchor={anchor} dominantBaseline="middle" className="svg-text" fill={col(tone)} fontWeight={weight}
      stroke={bg ? 'rgb(var(--panel))' : undefined} strokeWidth={bg ? px(4) : undefined} paintOrder={bg ? 'stroke' : undefined} strokeLinejoin="round" pointerEvents="none">
      {children}
    </text>
  );
}

export function Dot({ at, tone = 'ink', r = 4.5, ring = false }: { at: Pt; tone?: Tone; r?: number; ring?: boolean }) {
  const { sx, sy, px } = usePlane();
  return <circle cx={sx(at.x)} cy={sy(at.y)} r={px(r)} fill={ring ? 'rgb(var(--panel))' : col(tone)} stroke={col(tone)} strokeWidth={px(ring ? 2 : 0)} pointerEvents="none" />;
}

/** Arco de ángulo con vértice `c`, desde `from`° hasta `to`° (antihorario), radio en px de pantalla. */
export function Arc({ c, from, to, r = 28, tone = 'ang', fill = true, width = 2 }: { c: Pt; from: number; to: number; r?: number; tone?: Tone; fill?: boolean; width?: number }) {
  const { sx, sy, px } = usePlane();
  const R = px(r);
  let sweep = to - from;
  if (Math.abs(sweep) < 0.01) return null;
  const full = Math.abs(sweep) >= 359.99;
  if (full) sweep = 359.99 * Math.sign(sweep);
  const cx = sx(c.x), cy = sy(c.y);
  const p = (deg: number) => [cx + R * Math.cos((deg * Math.PI) / 180), cy - R * Math.sin((deg * Math.PI) / 180)];
  const [x1, y1] = p(from), [x2, y2] = p(from + sweep);
  const large = Math.abs(sweep) > 180 ? 1 : 0;
  const sw = sweep > 0 ? 0 : 1;
  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} ${sw} ${x2} ${y2} Z`;
  const arcOnly = `M ${x1} ${y1} A ${R} ${R} 0 ${large} ${sw} ${x2} ${y2}`;
  return (
    <g pointerEvents="none">
      {fill && <path d={d} fill={col(tone, 0.16)} stroke="none" />}
      <path d={arcOnly} fill="none" stroke={col(tone)} strokeWidth={px(width)} />
    </g>
  );
}

/** Marca de ángulo recto en el vértice `at`, con lados en direcciones u y v (vectores). */
export function RightMark({ at, u, v, size = 12, tone = 'muted' }: { at: Pt; u: Pt; v: Pt; size?: number; tone?: Tone }) {
  const { sx, sy, px, k } = usePlane();
  const s = px(size) / k;
  const nu = Math.hypot(u.x, u.y) || 1, nv = Math.hypot(v.x, v.y) || 1;
  const a = { x: at.x + (u.x / nu) * s, y: at.y + (u.y / nu) * s };
  const b = { x: a.x + (v.x / nv) * s, y: a.y + (v.y / nv) * s };
  const c = { x: at.x + (v.x / nv) * s, y: at.y + (v.y / nv) * s };
  return <polyline points={[a, b, c].map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')} fill="none" stroke={col(tone)} strokeWidth={px(1.5)} />;
}

export interface DragProps {
  at: Pt;
  onChange: (p: Pt) => void;
  tone?: Tone;
  label?: string;
  snap?: number;
  constrain?: (p: Pt) => Pt;
  r?: number;
  showCoords?: boolean;
  onDragEnd?: () => void;
  name?: string;
}

/** Punto arrastrable con mouse, lápiz o dedo (pointer capture + zona táctil ampliada). */
export function DraggablePoint({ at, onChange, tone = 'accent', label, snap = 0, constrain, r = 7, showCoords = false, onDragEnd, name }: DragProps) {
  const { sx, sy, px, toWorld, view } = usePlane();
  const [drag, setDrag] = useState(false);
  const apply = (cx: number, cy: number) => {
    let p = toWorld(cx, cy);
    p = { x: Math.min(view.xmax, Math.max(view.xmin, p.x)), y: Math.min(view.ymax, Math.max(view.ymin, p.y)) };
    if (constrain) p = constrain(p);
    if (snap) p = { x: Math.round(p.x / snap) * snap, y: Math.round(p.y / snap) * snap };
    onChange({ x: +p.x.toFixed(6), y: +p.y.toFixed(6) });
  };
  const onKey = (e: React.KeyboardEvent) => {
    const step = snap || 0.1;
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const v = d[e.key];
    if (!v) return;
    e.preventDefault();
    let p = { x: Math.min(view.xmax, Math.max(view.xmin, at.x + v[0])), y: Math.min(view.ymax, Math.max(view.ymin, at.y + v[1])) };
    if (constrain) p = constrain(p);
    onChange({ x: +p.x.toFixed(6), y: +p.y.toFixed(6) });
  };
  useEffect(() => { if (!drag) onDragEnd?.(); }, [drag]); // eslint-disable-line react-hooks/exhaustive-deps
  const cx = sx(at.x), cy = sy(at.y);
  return (
    <g
      className="drag-handle"
      data-drag={drag}
      tabIndex={0}
      role="slider"
      aria-label={`${name ?? label ?? 'Punto'} (${at.x.toFixed(1)}, ${at.y.toFixed(1)}). Usa las flechas para moverlo.`}
      aria-valuenow={at.x}
      onKeyDown={onKey}
      onPointerDown={(e) => { e.stopPropagation(); (e.currentTarget as Element).setPointerCapture(e.pointerId); setDrag(true); apply(e.clientX, e.clientY); }}
      onPointerMove={(e) => { if (drag) apply(e.clientX, e.clientY); }}
      onPointerUp={(e) => { (e.currentTarget as Element).releasePointerCapture?.(e.pointerId); setDrag(false); }}
      onPointerCancel={() => setDrag(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <circle cx={cx} cy={cy} r={px(20)} fill="transparent" />
      <circle className="drag-halo" cx={cx} cy={cy} r={px(r + 3)} fill={col(tone, 0.2)} />
      <circle cx={cx} cy={cy} r={px(r)} fill={col(tone)} stroke="rgb(var(--panel))" strokeWidth={px(2)} />
      {label && (
        <text x={cx + px(11)} y={cy - px(11)} fontSize={px(14)} fontWeight={700} className="svg-text" fill={col(tone)} stroke="rgb(var(--panel))" strokeWidth={px(4)} paintOrder="stroke" pointerEvents="none">
          {label}{showCoords ? ` (${fmtTick(at.x)}, ${fmtTick(at.y)})` : ''}
        </text>
      )}
    </g>
  );
}
