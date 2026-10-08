import type { Figure } from '../modules/types';
import { Arc, Dot, Label, Plane, Poly, RightMark, Seg } from './Plane';

/** Figura pequeña que acompaña a un ejercicio. */
export function MiniFigure({ fig }: { fig: Figure }) {
  if (fig.type === 'points') {
    const xs = fig.points.map((p) => p.x), ys = fig.points.map((p) => p.y);
    const pad = 2;
    const xmin = Math.min(-1, ...xs) - pad, xmax = Math.max(1, ...xs) + pad;
    const ymin = Math.min(-1, ...ys) - pad, ymax = Math.max(1, ...ys) + pad;
    const view = { xmin, xmax, ymin, ymax };
    return (
      <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-lg border border-line">
        <Plane view={view} W={360} ariaLabel={`Puntos ${fig.points.map((p) => `${p.name}(${p.x}, ${p.y})`).join(', ')}`}>
          {fig.segment && fig.points.length >= 2 && <Seg a={fig.points[0]} b={fig.points[1]} tone="accent" width={2} />}
          {fig.points.map((p) => (
            <g key={p.name}>
              <Dot at={p} tone="accent" r={5} />
              <Label at={p} dx={10} dy={-10} tone="accent" anchor="start" bg>{p.name}</Label>
            </g>
          ))}
        </Plane>
      </div>
    );
  }
  // Triángulo rectángulo: C (recto) abajo-derecha, A abajo-izquierda, B arriba-derecha
  const ratio = Math.min(1.6, Math.max(0.35, fig.ratio ?? 0.75));
  const w = 6, h = w * ratio;
  const A = { x: 0, y: 0 }, C = { x: w, y: 0 }, B = { x: w, y: h };
  const view = { xmin: -1.6, xmax: w + 1.8, ymin: -1.3, ymax: h + 1 };
  const th = fig.thetaAt === 'A' ? A : B;
  const angA = (Math.atan2(h, w) * 180) / Math.PI;
  const thLabel = fig.thetaLabel ?? 'θ';
  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-lg border border-line">
      <Plane view={view} W={360} grid={false} axes={false} ariaLabel="Triángulo rectángulo del ejercicio">
        <Poly pts={[A, C, B]} tone="accent" fillOpacity={0.07} strokeTone="ink" width={2} />
        <RightMark at={C} u={{ x: -1, y: 0 }} v={{ x: 0, y: 1 }} />
        {fig.thetaAt === 'A' ? <Arc c={A} from={0} to={angA} r={30} /> : <Arc c={B} from={180 + angA} to={270} r={30} />}
        <Label at={th} dx={fig.thetaAt === 'A' ? 44 : -14} dy={fig.thetaAt === 'A' ? -12 : 46} tone="ang">{thLabel}</Label>
        {fig.labels.b && <Label at={{ x: w / 2, y: 0 }} dy={16} bg>{fig.labels.b}</Label>}
        {fig.labels.a && <Label at={{ x: w, y: h / 2 }} dx={16} anchor="start" bg>{fig.labels.a}</Label>}
        {fig.labels.c && <Label at={{ x: w / 2, y: h / 2 }} dx={-14} dy={-12} anchor="end" bg>{fig.labels.c}</Label>}
      </Plane>
    </div>
  );
}
