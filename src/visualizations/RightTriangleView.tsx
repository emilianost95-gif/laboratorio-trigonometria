import { fmt } from '../math/core';
import { Arc, Label, Plane, Poly, RightMark, Seg, usePlane, col } from './Plane';

export type Side = 'a' | 'b' | 'c'; // a = vertical (BC), b = horizontal (AC), c = hipotenusa (AB)
export type Role = 'opp' | 'adj' | 'hyp';

export const ROLE_NAMES: Record<Role, string> = { opp: 'cateto opuesto', adj: 'cateto adyacente', hyp: 'hipotenusa' };
export const ROLE_SHORT: Record<Role, string> = { opp: 'opuesto', adj: 'adyacente', hyp: 'hipotenusa' };

/** Rol de cada lado según dónde esté θ. */
export function roleOf(side: Side, thetaAt: 'A' | 'B'): Role {
  if (side === 'c') return 'hyp';
  if (thetaAt === 'A') return side === 'a' ? 'opp' : 'adj';
  return side === 'a' ? 'adj' : 'opp';
}

interface Props {
  a: number; // cateto vertical
  b: number; // cateto horizontal
  thetaAt?: 'A' | 'B';
  highlight?: Role[];
  /** Dimensiones del lienzo en unidades del mundo (para que la escala no salte al cambiar los lados) */
  box?: { w: number; h: number };
  showValues?: boolean;
  showRoles?: boolean;
  onSideClick?: (s: Side) => void;
  sideFeedback?: Partial<Record<Side, 'ok' | 'bad'>>;
  ariaLabel?: string;
  thetaText?: string;
  extra?: React.ReactNode;
  maxHeight?: string;
}

function ClickableSide({ p, q, side, onClick }: { p: { x: number; y: number }; q: { x: number; y: number }; side: Side; onClick: (s: Side) => void }) {
  const { sx, sy, px } = usePlane();
  return (
    <line x1={sx(p.x)} y1={sy(p.y)} x2={sx(q.x)} y2={sy(q.y)} stroke="transparent" strokeWidth={px(26)} strokeLinecap="round" className="cursor-pointer"
      role="button" tabIndex={0} aria-label={`Lado ${side}`}
      onClick={(e) => { e.stopPropagation(); onClick(side); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(side); }} />
  );
}

/** Triángulo rectángulo con lados coloreados por su rol respecto de θ. */
export function RightTriangleView({ a, b, thetaAt = 'A', highlight = ['opp', 'adj', 'hyp'], box, showValues = true, showRoles = true, onSideClick, sideFeedback, ariaLabel, thetaText = 'θ', extra, maxHeight }: Props) {
  const W = box?.w ?? Math.max(b, 1) * 1.0;
  const H = box?.h ?? Math.max(a, 1) * 1.0;
  const m = Math.max(W, H) * 0.16;
  const view = { xmin: -m * 1.2, xmax: W + m * 1.9, ymin: -m * 1.1, ymax: H + m * 0.9 };
  const A = { x: 0, y: 0 }, C = { x: b, y: 0 }, B = { x: b, y: a };
  const angA = (Math.atan2(a, b) * 180) / Math.PI;
  const c = Math.hypot(a, b);
  const sides: { s: Side; p: typeof A; q: typeof A; v: number }[] = [
    { s: 'b', p: A, q: C, v: b },
    { s: 'a', p: C, q: B, v: a },
    { s: 'c', p: A, q: B, v: c },
  ];
  const toneOf = (s: Side) => {
    const fb = sideFeedback?.[s];
    if (fb) return fb;
    const r = roleOf(s, thetaAt);
    return highlight.includes(r) ? r : 'muted';
  };
  const active = (s: Side) => highlight.includes(roleOf(s, thetaAt)) || !!sideFeedback?.[s];
  const label = (s: Side, v: number) => {
    const r = roleOf(s, thetaAt);
    const parts = [] as string[];
    if (showRoles) parts.push(ROLE_SHORT[r]);
    if (showValues) parts.push(fmt(v, 2));
    return parts.join(' = ');
  };
  return (
    <Plane view={view} grid={false} axes={false} ariaLabel={ariaLabel ?? `Triángulo rectángulo con catetos ${fmt(a)} y ${fmt(b)}`} maxHeight={maxHeight}>
      <Poly pts={[A, C, B]} tone="accent" fillOpacity={0.05} stroke={false} />
      {sides.map(({ s, p, q }) => <Seg key={s} a={p} b={q} tone={toneOf(s)} width={active(s) ? 4.5 : 2} opacity={active(s) ? 1 : 0.55} />)}
      <RightMark at={C} u={{ x: -1, y: 0 }} v={{ x: 0, y: 1 }} size={14} />
      {thetaAt === 'A' ? <Arc c={A} from={0} to={angA} r={34} /> : <Arc c={B} from={180 + angA} to={270} r={34} />}
      {thetaAt === 'A'
        ? <Label at={A} dx={50 * Math.cos((angA / 2) * Math.PI / 180) + 4} dy={-50 * Math.sin((angA / 2) * Math.PI / 180)} tone="ang" size={14}>{thetaText}</Label>
        : <Label at={B} dx={-16} dy={52} tone="ang" size={14}>{thetaText}</Label>}
      {(showRoles || showValues) && (
        <>
          <Label at={{ x: b / 2, y: 0 }} dy={17} tone={toneOf('b')} size={12.5} bg>{label('b', b)}</Label>
          <Label at={{ x: b, y: a / 2 }} dx={10} anchor="start" tone={toneOf('a')} size={12.5} bg>{label('a', a)}</Label>
          <Label at={{ x: b / 2, y: a / 2 }} dx={-14 * Math.sin((angA * Math.PI) / 180)} dy={-14 * Math.cos((angA * Math.PI) / 180)} rotate={angA} tone={toneOf('c')} size={12.5} bg>{label('c', c)}</Label>
        </>
      )}
      <Label at={A} dx={-10} dy={10} tone="muted" size={11} weight={500}>A</Label>
      <Label at={C} dx={10} dy={10} tone="muted" size={11} weight={500}>C</Label>
      <Label at={B} dx={10} dy={-8} tone="muted" size={11} weight={500}>B</Label>
      {extra}
      {onSideClick && sides.map(({ s, p, q }) => <ClickableSide key={`h${s}`} p={p} q={q} side={s} onClick={onSideClick} />)}
    </Plane>
  );
}

export const roleColor = (r: Role) => col(r);
