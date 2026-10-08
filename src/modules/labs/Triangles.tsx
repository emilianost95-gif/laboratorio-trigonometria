import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Callout, Panel, Readout, Segmented, Slider } from '../../components/ui';
import { RichText } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import { placeTriangle, signedArea, triangleFromPoints, triangleFromSides, type Pt, type TriangleInfo } from '../../math/geometry';
import { Arc, DraggablePoint, Label, Plane, Poly, RightMark, Seg } from '../../visualizations/Plane';
import { useStore } from '../../store/store';
import { useLab } from '../../utils/useLab';
import { pick } from '../generators';

const VIEW = { xmin: -1, xmax: 11, ymin: -1, ymax: 8 };

function angleDir(from: Pt, to: Pt) { return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI; }

/** Dibuja un triángulo ABC con arcos de ángulos y etiquetas de lados. */
function TriangleDrawing({ P, info, showAngles = true }: { P: [Pt, Pt, Pt]; info: TriangleInfo; showAngles?: boolean }) {
  const [A, B, C] = P;
  const ccw = signedArea(A, B, C) > 0;
  const arcFor = (V: Pt, U: Pt, W: Pt, key: string, val: number) => {
    let a1 = angleDir(V, U), a2 = angleDir(V, W);
    let sweep = a2 - a1;
    while (sweep > 180) sweep -= 360;
    while (sweep < -180) sweep += 360;
    const mid = ((a1 + sweep / 2) * Math.PI) / 180;
    if (Math.abs(val - 90) < 0.6) {
      const u = { x: U.x - V.x, y: U.y - V.y }, w = { x: W.x - V.x, y: W.y - V.y };
      return <g key={key}><RightMark at={V} u={u} v={w} size={14} tone="ang" /><Label at={V} dx={Math.cos(mid) * 34} dy={-Math.sin(mid) * 34} tone="ang" size={12} bg>90°</Label></g>;
    }
    a2 = a1 + sweep;
    if (sweep < 0) [a1, a2] = [a2, a1];
    return <g key={key}><Arc c={V} from={a1} to={a2} r={24} /><Label at={V} dx={Math.cos(mid) * 44} dy={-Math.sin(mid) * 44} tone="ang" size={12} bg>{fmt(val, 1)}°</Label></g>;
  };
  const mid = (p: Pt, q: Pt) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  const out = (p: Pt, q: Pt) => { // normal exterior para la etiqueta del lado
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1;
    const s = ccw ? 1 : -1;
    return { dx: (dy / L) * 16 * s, dy: (dx / L) * 16 * s };
  };
  return (
    <>
      <Poly pts={P} tone="accent" fillOpacity={0.1} strokeTone="ink" width={2.4} />
      {showAngles && info.valid && (
        <>
          {arcFor(A, B, C, 'A', info.angles[0])}
          {arcFor(B, C, A, 'B', info.angles[1])}
          {arcFor(C, A, B, 'C', info.angles[2])}
        </>
      )}
      {([[B, C, 'a', info.sides[0]], [C, A, 'b', info.sides[1]], [A, B, 'c', info.sides[2]]] as const).map(([p, q, n, v]) => {
        const o = out(p, q);
        return <Label key={n} at={mid(p, q)} dx={o.dx} dy={o.dy} size={12} tone="muted" bg>{n} = {fmt(v)}</Label>;
      })}
    </>
  );
}

const GOALS: { bySides?: TriangleInfo['bySides']; byAngles?: TriangleInfo['byAngles']; text: string }[] = [
  { bySides: 'isósceles', byAngles: 'rectángulo', text: 'isósceles rectángulo' },
  { bySides: 'escaleno', byAngles: 'obtusángulo', text: 'escaleno obtusángulo' },
  { bySides: 'isósceles', byAngles: 'acutángulo', text: 'isósceles acutángulo' },
  { bySides: 'escaleno', byAngles: 'rectángulo', text: 'escaleno rectángulo' },
  { bySides: 'isósceles', byAngles: 'obtusángulo', text: 'isósceles obtusángulo' },
  { byAngles: 'acutángulo', bySides: 'escaleno', text: 'escaleno acutángulo' },
];

export default function TrianglesLab() {
  const { act, save } = useLab('m5');
  const { dispatch } = useStore();
  const [mode, setMode] = useState<'vertices' | 'sides' | 'base'>('vertices');
  const [V, setV] = useState<[Pt, Pt, Pt]>([{ x: 1, y: 1 }, { x: 8, y: 1 }, { x: 4, y: 6 }]);
  const [sides, setSides] = useState({ a: 6, b: 5, c: 7 });
  const [bh, setBh] = useState({ base: 8, h: 5, off: 3 });
  const [goal, setGoal] = useState(() => pick(GOALS));
  const [goalDone, setGoalDone] = useState(false);

  const { P, info } = useMemo(() => {
    if (mode === 'vertices') return { P: V, info: triangleFromPoints(V[0], V[1], V[2]) };
    if (mode === 'sides') {
      const inf = triangleFromSides(sides.a, sides.b, sides.c);
      const raw = inf.valid ? placeTriangle(sides.a, sides.b, sides.c) : placeTriangle(1, 1, 1);
      const P2 = raw.map((p) => ({ x: p.x + 1, y: p.y + 1 })) as [Pt, Pt, Pt];
      return { P: P2, info: inf };
    }
    const A = { x: 1, y: 1 }, B = { x: 1 + bh.base, y: 1 }, C = { x: 1 + bh.off, y: 1 + bh.h };
    return { P: [A, B, C] as [Pt, Pt, Pt], info: triangleFromPoints(A, B, C, 0.005, 0.5) };
  }, [mode, V, sides, bh]);

  const degenerate = mode === 'vertices' && Math.abs(signedArea(...V)) < 0.05;
  const valid = info.valid && !degenerate;
  const matchesGoal = valid && (!goal.bySides || info.bySides === goal.bySides) && (!goal.byAngles || info.byAngles === goal.byAngles);
  useEffect(() => {
    if (mode === 'vertices' && matchesGoal && !goalDone) {
      setGoalDone(true);
      dispatch({ type: 'attempt', category: 'triangles', level: 2, correct: true, firstTry: true, title: `Construir: ${goal.text}`, module: 'm5', final: true });
    }
  }, [mode, matchesGoal, goalDone, goal, dispatch]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Panel pad={false} title="Laboratorio de triángulos" eyebrow={mode === 'vertices' ? 'Arrastra los vértices' : mode === 'sides' ? 'Define los tres lados' : 'Base y altura'}
          actions={<Segmented size="sm" value={mode} onChange={(m) => { setMode(m); act(); }} options={[{ value: 'vertices', label: 'Vértices' }, { value: 'sides', label: 'Lados' }, { value: 'base', label: 'Base y altura' }]} />}>
          <Plane view={VIEW} ariaLabel={`Triángulo ${info.bySides} ${info.byAngles}, perímetro ${fmt(info.perimeter)}, área ${fmt(info.area)}`}>
            {valid && <TriangleDrawing P={P} info={info} />}
            {mode === 'base' && <><Seg a={P[2]} b={{ x: P[2].x, y: 1 }} tone="opp" dash={5} width={2} /><RightMark at={{ x: P[2].x, y: 1 }} u={{ x: 1, y: 0 }} v={{ x: 0, y: 1 }} tone="opp" /><Label at={{ x: P[2].x, y: 1 + bh.h / 2 }} dx={8} anchor="start" tone="opp" bg>h = {fmt(bh.h)}</Label>{(bh.off < 0 || bh.off > bh.base) && <Seg a={{ x: 1, y: 1 }} b={{ x: P[2].x, y: 1 }} tone="muted" dash={3} width={1} />}</>}
            {mode === 'vertices' && V.map((p, i) => (
              <DraggablePoint key={i} at={p} label={'ABC'[i]} snap={0.5} tone={['accent', 'hyp', 'opp'][i] as 'accent'} onChange={(np) => { setV((vs) => vs.map((x, j) => (j === i ? np : x)) as [Pt, Pt, Pt]); act(); }} />
            ))}
            {mode !== 'vertices' && valid && P.map((p, i) => <Label key={i} at={p} dx={i === 0 ? -12 : i === 1 ? 12 : 0} dy={i === 2 ? -14 : 12} tone="ink">{'ABC'[i]}</Label>)}
          </Plane>
        </Panel>
        {!valid ? (
          <Callout tone="bad" title={degenerate ? 'Puntos alineados' : 'Ese triángulo no existe'}>
            {degenerate ? 'Los tres vértices están sobre una misma recta: el "triángulo" se aplasta y su área es 0.' : <RichText text={`**Desigualdad triangular:** cada lado debe ser **menor** que la suma de los otros dos. Aquí ${sides.a >= sides.b + sides.c ? `$a = ${tex(sides.a)} \\ge b + c = ${tex(sides.b + sides.c)}$` : sides.b >= sides.a + sides.c ? `$b = ${tex(sides.b)} \\ge a + c = ${tex(sides.a + sides.c)}$` : `$c = ${tex(sides.c)} \\ge a + b = ${tex(sides.a + sides.b)}$`}: los dos lados cortos no alcanzan a juntarse.`} />}
          </Callout>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Readout label="Perímetro" value={fmt(info.perimeter)} sub="a + b + c" />
            <Readout label="Área" value={fmt(info.area)} tone="accent" sub={mode === 'base' ? 'b·h / 2' : 'fórmula de Herón'} />
            <Readout label="Suma de ángulos" value={`${fmt(info.angles[0] + info.angles[1] + info.angles[2], 1)}°`} tone="ang" sub="siempre 180°" />
            <Readout label="Ángulo mayor" value={`${fmt(Math.max(...info.angles), 1)}°`} />
          </div>
        )}
      </div>
      <div className="space-y-4">
        {mode === 'sides' && (
          <Panel title="Lados" eyebrow="Controles">
            <div className="space-y-2">
              <Slider id="m5-a" label="a (BC)" value={sides.a} min={1} max={10} step={0.1} onChange={(v) => { setSides({ ...sides, a: v }); act(); }} />
              <Slider id="m5-b" label="b (CA)" value={sides.b} min={1} max={10} step={0.1} onChange={(v) => { setSides({ ...sides, b: v }); act(); }} />
              <Slider id="m5-c" label="c (AB)" value={sides.c} min={1} max={10} step={0.1} onChange={(v) => { setSides({ ...sides, c: v }); act(); }} />
            </div>
          </Panel>
        )}
        {mode === 'base' && (
          <Panel title="Base y altura" eyebrow="Controles">
            <div className="space-y-2">
              <Slider id="m5-base" label="Base" value={bh.base} min={1} max={9} step={0.5} onChange={(v) => { setBh({ ...bh, base: v }); act(); }} />
              <Slider id="m5-h" label="Altura" value={bh.h} min={0.5} max={6.5} step={0.5} color="opp" onChange={(v) => { setBh({ ...bh, h: v }); act(); }} />
              <Slider id="m5-off" label="Posición del vértice C" value={bh.off} min={-1.5} max={9.5} step={0.5} onChange={(v) => { setBh({ ...bh, off: v }); act(); }} />
            </div>
            <p className="mt-3 text-[14px]"><RichText text={`$A = \\dfrac{b\\cdot h}{2} = \\dfrac{${tex(bh.base)}\\cdot${tex(bh.h)}}{2} = ${tex((bh.base * bh.h) / 2)}$`} /></p>
            <Callout title="Experimento">Mueve solo la <strong>posición del vértice C</strong>: el triángulo cambia de forma (incluso se vuelve obtusángulo), pero el área no cambia. Base y altura son lo único que importa.</Callout>
          </Panel>
        )}
        <Panel title="Clasificación" eyebrow="Automática">
          {valid ? (
            <div className="space-y-2 text-[14px]">
              <div className="flex flex-wrap items-center gap-2"><span className="w-24 text-muted">Por lados</span><Badge tone="accent">{info.bySides}</Badge></div>
              <div className="flex flex-wrap items-center gap-2"><span className="w-24 text-muted">Por ángulos</span><Badge tone="ang">{info.byAngles}</Badge></div>
              <p className="pt-1 text-[13px] text-muted">
                {info.bySides === 'equilátero' ? 'Tres lados iguales → tres ángulos de 60°.' : info.bySides === 'isósceles' ? 'Dos lados iguales → los ángulos opuestos a ellos también son iguales.' : 'Tres lados distintos → tres ángulos distintos.'}{' '}
                {info.byAngles === 'rectángulo' ? 'Tiene un ángulo de 90°: aquí vive la trigonometría.' : info.byAngles === 'obtusángulo' ? 'Tiene un ángulo mayor que 90° (solo puede haber uno).' : 'Sus tres ángulos son menores que 90°.'}
              </p>
            </div>
          ) : <p className="text-muted">—</p>}
        </Panel>
        {mode === 'vertices' && (
          <Panel title="Construye un triángulo" eyebrow="Reto" actions={<Button size="sm" variant="ghost" onClick={() => { setGoal(pick(GOALS.filter((g) => g !== goal))); setGoalDone(false); }}>Otro reto</Button>}>
            <p className="text-[14.5px]">Arrastra los vértices hasta formar un triángulo <strong>{goal.text}</strong>.</p>
            <div className="mt-2">{matchesGoal ? <Badge tone="ok">✓ ¡Logrado!</Badge> : <Badge tone="muted">aún no</Badge>}</div>
            <p className="mt-2 text-[12.5px] text-muted">Tolerancia: lados iguales con ±3 %, ángulo recto con ±1° (los vértices se ajustan a media unidad).</p>
          </Panel>
        )}
        {valid && <Button variant="ghost" size="sm" onClick={() => save('Triángulo construido', `Lados: a = ${fmt(info.sides[0])}, b = ${fmt(info.sides[1])}, c = ${fmt(info.sides[2])}\nÁngulos: A = ${fmt(info.angles[0], 1)}°, B = ${fmt(info.angles[1], 1)}°, C = ${fmt(info.angles[2], 1)}°\nPerímetro ${fmt(info.perimeter)} · Área ${fmt(info.area)}\n${info.bySides}, ${info.byAngles}`)}>Guardar en el cuaderno</Button>}
      </div>
    </div>
  );
}
