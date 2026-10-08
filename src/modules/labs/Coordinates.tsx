import { useMemo, useState } from 'react';
import { Badge, Button, Callout, Panel, Segmented, Toggle } from '../../components/ui';
import { RichText } from '../../components/Tex';
import { quadrant, QUAD_NAMES, type Pt } from '../../math/geometry';
import { fmt } from '../../math/core';
import { DraggablePoint, Dot, Label, Plane, Seg } from '../../visualizations/Plane';
import { useStore } from '../../store/store';
import { useLab } from '../../utils/useLab';
import { rnd } from '../generators';

const VIEW = { xmin: -8, xmax: 8, ymin: -6, ymax: 6 };
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
type NamedPt = Pt & { name: string };

function Explore() {
  const { act, save } = useLab('m1');
  const [pts, setPts] = useState<NamedPt[]>([{ name: 'A', x: 3, y: 4 }, { name: 'B', x: -5, y: 2 }]);
  const [sel, setSel] = useState('A');
  const [snap, setSnap] = useState(true);
  const [proj, setProj] = useState(true);
  const [mx, setMx] = useState('');
  const [my, setMy] = useState('');
  const [err, setErr] = useState('');
  const selected = pts.find((p) => p.name === sel) ?? pts[0];

  const nextName = () => LETTERS.split('').find((l) => !pts.some((p) => p.name === l)) ?? `P${pts.length}`;
  const add = (p: Pt) => {
    if (pts.length >= 12) { setErr('Máximo 12 puntos: borra alguno para seguir.'); return; }
    const n = nextName();
    const q = snap ? { x: Math.round(p.x), y: Math.round(p.y) } : { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
    setPts((xs) => [...xs, { name: n, ...q }]);
    setSel(n);
    setErr('');
    act();
  };
  const addManual = () => {
    const x = Number(mx.replace(',', '.')), y = Number(my.replace(',', '.'));
    if (!Number.isFinite(x) || !Number.isFinite(y) || mx === '' || my === '') { setErr('Escribe dos números, por ejemplo x = 3 e y = −2.'); return; }
    if (x < VIEW.xmin || x > VIEW.xmax || y < VIEW.ymin || y > VIEW.ymax) { setErr(`Ese punto queda fuera de la vista (x entre −8 y 8, y entre −6 y 6).`); return; }
    add({ x, y });
    setMx(''); setMy('');
  };

  const q = selected ? quadrant(selected) : 0;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Panel pad={false} title="Plano cartesiano" eyebrow="Explorar" actions={<span className="text-[12px] text-muted">Toca el plano para crear un punto · arrastra para moverlo</span>}>
        <Plane view={VIEW} cursor quadrantLabels onPlaneClick={add} ariaLabel="Plano cartesiano interactivo">
          {proj && selected && (
            <>
              <Seg a={selected} b={{ x: selected.x, y: 0 }} tone="adj" dash={4} width={1.6} />
              <Seg a={selected} b={{ x: 0, y: selected.y }} tone="opp" dash={4} width={1.6} />
              <Label at={{ x: selected.x, y: 0 }} dy={selected.y >= 0 ? 14 : -14} tone="adj" bg>{fmt(selected.x)}</Label>
              <Label at={{ x: 0, y: selected.y }} dx={selected.x >= 0 ? -16 : 16} tone="opp" bg>{fmt(selected.y)}</Label>
            </>
          )}
          <Dot at={{ x: 0, y: 0 }} tone="ink" r={3.5} />
          {pts.map((p) => (
            <DraggablePoint key={p.name} at={p} label={p.name} showCoords tone={p.name === sel ? 'accent' : 'hyp'} snap={snap ? 1 : 0.1}
              onChange={(np) => { setPts((xs) => xs.map((x) => (x.name === p.name ? { ...x, ...np } : x))); setSel(p.name); act(); }} />
          ))}
        </Plane>
      </Panel>
      <div className="space-y-4">
        <Panel title={selected ? `Punto ${selected.name}` : 'Sin puntos'} eyebrow="Lectura">
          {selected ? (
            <div className="space-y-3">
              <div className="num text-[26px] font-semibold">{selected.name} = (<span className="text-adj">{fmt(selected.x)}</span>, <span className="text-opp">{fmt(selected.y)}</span>)</div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={q ? 'accent' : 'muted'}>{q ? `Cuadrante ${QUAD_NAMES[q]}` : selected.x === 0 && selected.y === 0 ? 'Origen' : selected.x === 0 ? 'Sobre el eje Y' : 'Sobre el eje X'}</Badge>
                <Badge>signos ({selected.x > 0 ? '+' : selected.x < 0 ? '−' : '0'}, {selected.y > 0 ? '+' : selected.y < 0 ? '−' : '0'})</Badge>
              </div>
              <p className="text-[14px] text-muted"><RichText text={`Desde el origen: **${Math.abs(selected.x)}** ${selected.x >= 0 ? 'a la derecha' : 'a la izquierda'} (eso es $x$) y **${Math.abs(selected.y)}** ${selected.y >= 0 ? 'hacia arriba' : 'hacia abajo'} (eso es $y$). El orden importa: primero horizontal, luego vertical.`} /></p>
            </div>
          ) : <p className="text-muted">Toca el plano para crear uno.</p>}
        </Panel>
        <Panel title="Agregar por coordenadas" eyebrow="Manual">
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); addManual(); }}>
            <label className="text-[13px]">x<input id="m1-x" value={mx} onChange={(e) => setMx(e.target.value)} inputMode="decimal" className="num ml-1 h-9 w-16 rounded-md border border-line bg-panel2 px-2" /></label>
            <label className="text-[13px]">y<input id="m1-y" value={my} onChange={(e) => setMy(e.target.value)} inputMode="decimal" className="num ml-1 h-9 w-16 rounded-md border border-line bg-panel2 px-2" /></label>
            <Button type="submit" variant="primary" size="sm">Agregar</Button>
          </form>
          {err && <p className="mt-2 text-[13px] text-warn">{err}</p>}
          <div className="mt-3 space-y-2">
            <Toggle id="m1-snap" checked={snap} onChange={setSnap} label="Ajustar a enteros" />
            <Toggle id="m1-proj" checked={proj} onChange={setProj} label="Mostrar proyecciones a los ejes" />
          </div>
        </Panel>
        <Panel title="Puntos" eyebrow={`${pts.length} en el plano`} actions={<Button size="sm" variant="ghost" onClick={() => save('Puntos en el plano', pts.map((p) => `${p.name} = (${fmt(p.x)}, ${fmt(p.y)}) — ${quadrant(p) ? 'cuadrante ' + QUAD_NAMES[quadrant(p)] : 'sobre un eje'}`).join('\n'))}>Guardar</Button>}>
          <ul className="max-h-48 space-y-1 overflow-y-auto scroll-thin">
            {pts.map((p) => (
              <li key={p.name} className={`flex items-center justify-between rounded-md px-2 py-1 ${p.name === sel ? 'bg-accent/10' : ''}`}>
                <button type="button" className="num text-left text-[14px]" onClick={() => setSel(p.name)}>{p.name} ({fmt(p.x)}, {fmt(p.y)})</button>
                <button type="button" className="text-[12px] text-muted hover:text-bad" aria-label={`Borrar ${p.name}`} onClick={() => setPts((xs) => xs.filter((x) => x.name !== p.name))}>borrar</button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

type ChKind = 'place' | 'read' | 'quadrant' | 'move';
const CH_NAMES: Record<ChKind, string> = { place: 'Ubica el punto', read: 'Descubre las coordenadas', quadrant: 'Identifica el cuadrante', move: 'Mueve el punto' };

function newTarget(kind: ChKind): Pt {
  let p: Pt;
  do { p = { x: rnd(-7, 7), y: rnd(-5, 5) }; } while ((kind === 'quadrant' && (p.x === 0 || p.y === 0)) || (p.x === 0 && p.y === 0) || Math.abs(p.x) === Math.abs(p.y));
  return p;
}

function diagnosePlace(got: Pt, t: Pt): string {
  if (got.x === t.y && got.y === t.x) return 'Intercambiaste $x$ e $y$. En $(x, y)$ el **primer** número es horizontal y el **segundo** vertical.';
  if (got.x === -t.x && got.y === t.y) return 'La coordenada $x$ tiene el **signo** contrario: positivos a la derecha, negativos a la izquierda.';
  if (got.x === t.x && got.y === -t.y) return 'La coordenada $y$ tiene el **signo** contrario: positivos arriba, negativos abajo.';
  if (got.x === -t.x && got.y === -t.y) return 'Ambos signos están invertidos: quedaste en el cuadrante opuesto.';
  return 'Parte desde el origen: avanza $x$ unidades en horizontal y luego $y$ en vertical. Cuenta las líneas de la cuadrícula.';
}

function Challenges() {
  const { dispatch } = useStore();
  const { act } = useLab('m1');
  const [kind, setKind] = useState<ChKind>('place');
  const [target, setTarget] = useState<Pt>(() => newTarget('place'));
  const [placed, setPlaced] = useState<Pt | null>(null);
  const [mover, setMover] = useState<Pt>({ x: 0, y: 0 });
  const [rx, setRx] = useState('');
  const [ry, setRy] = useState('');
  const [fb, setFb] = useState<{ ok: boolean; msg: string } | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const [tries, setTries] = useState(0);

  const reset = (k: ChKind = kind) => { setKind(k); setTarget(newTarget(k)); setPlaced(null); setMover({ x: 0, y: 0 }); setRx(''); setRy(''); setFb(null); setTries(0); };
  const record = (ok: boolean, msg: string) => {
    setFb({ ok, msg });
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
    dispatch({ type: 'attempt', category: 'coords', level: 1, correct: ok, firstTry: tries === 0, title: CH_NAMES[kind], module: 'm1', final: ok });
    setTries((t) => t + 1);
    act();
  };
  const tq = quadrant(target);

  const prompt = useMemo(() => {
    switch (kind) {
      case 'place': return `Toca el plano donde está $P = (${target.x}, ${target.y})$.`;
      case 'read': return '¿Cuáles son las coordenadas del punto $Q$?';
      case 'quadrant': return '¿En qué cuadrante está el punto $R$?';
      case 'move': return `Arrastra el punto $M$ hasta $(${target.x}, ${target.y})$ y pulsa Comprobar.`;
    }
  }, [kind, target]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Panel pad={false} title={CH_NAMES[kind]} eyebrow="Desafío" actions={<span className="num text-[13px] text-muted">aciertos {score.ok}/{score.total}</span>}>
        <Plane view={VIEW} cursor={kind === 'place'} quadrantLabels={kind !== 'quadrant'} onPlaneClick={kind === 'place' && !fb?.ok ? (p) => setPlaced({ x: Math.round(p.x), y: Math.round(p.y) }) : undefined} ariaLabel="Plano del desafío">
          {kind === 'place' && placed && <><Dot at={placed} tone={fb ? (fb.ok ? 'ok' : 'bad') : 'accent'} r={6} /><Label at={placed} dx={12} dy={-12} anchor="start" bg tone="accent">P?</Label></>}
          {kind === 'place' && fb && !fb.ok && tries >= 2 && <Dot at={target} tone="ok" r={6} ring />}
          {(kind === 'read' || kind === 'quadrant') && <><Dot at={target} tone="hyp" r={6} /><Label at={target} dx={12} dy={-12} anchor="start" tone="hyp" bg>{kind === 'read' ? 'Q' : 'R'}</Label></>}
          {kind === 'move' && <><Dot at={target} tone="ok" r={9} ring /><DraggablePoint at={mover} label="M" showCoords snap={1} onChange={(p) => { setMover(p); setFb(null); }} /></>}
        </Plane>
      </Panel>
      <div className="space-y-4">
        <Panel title="Tipo de desafío">
          <Segmented size="sm" value={kind} onChange={(k) => reset(k)} options={(Object.keys(CH_NAMES) as ChKind[]).map((k) => ({ value: k, label: CH_NAMES[k] }))} />
        </Panel>
        <Panel title="Consigna">
          <p className="mb-3 text-[15px]"><RichText text={prompt} /></p>
          {kind === 'place' && (
            <Button variant="primary" disabled={!placed || fb?.ok} onClick={() => {
              if (!placed) return;
              const ok = placed.x === target.x && placed.y === target.y;
              record(ok, ok ? '¡Exacto!' : diagnosePlace(placed, target));
            }}>Comprobar</Button>
          )}
          {kind === 'read' && (
            <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
              e.preventDefault();
              const x = Number(rx.replace(',', '.')), y = Number(ry.replace(',', '.'));
              if (rx === '' || ry === '' || !Number.isFinite(x) || !Number.isFinite(y)) { setFb({ ok: false, msg: 'Escribe ambos números.' }); return; }
              const ok = x === target.x && y === target.y;
              record(ok, ok ? '¡Exacto!' : diagnosePlace({ x, y }, target));
            }}>
              <span className="num text-[18px]">Q = (</span>
              <input aria-label="x" value={rx} onChange={(e) => setRx(e.target.value)} className="num h-10 w-16 rounded-md border border-line bg-panel2 px-2" inputMode="numeric" />
              <span className="num text-[18px]">,</span>
              <input aria-label="y" value={ry} onChange={(e) => setRy(e.target.value)} className="num h-10 w-16 rounded-md border border-line bg-panel2 px-2" inputMode="numeric" />
              <span className="num text-[18px]">)</span>
              <Button type="submit" variant="primary" disabled={fb?.ok}>Comprobar</Button>
            </form>
          )}
          {kind === 'quadrant' && (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((qq) => (
                <Button key={qq} disabled={fb?.ok} onClick={() => record(qq === tq, qq === tq ? `¡Sí! Signos (${target.x > 0 ? '+' : '−'}, ${target.y > 0 ? '+' : '−'}).` : `El cuadrante ${QUAD_NAMES[qq]} tiene signos ${['', '(+, +)', '(−, +)', '(−, −)', '(+, −)'][qq]}. Mira el signo de cada coordenada de R.`)}>Cuadrante {QUAD_NAMES[qq]}</Button>
              ))}
            </div>
          )}
          {kind === 'move' && (
            <Button variant="primary" disabled={fb?.ok} onClick={() => {
              const ok = mover.x === target.x && mover.y === target.y;
              record(ok, ok ? '¡Llegaste!' : `M está en (${mover.x}, ${mover.y}). ${diagnosePlace(mover, target)}`);
            }}>Comprobar</Button>
          )}
          {fb && (
            <div className="mt-3">
              <Callout tone={fb.ok ? 'ok' : 'warn'} title={fb.ok ? 'Correcto' : 'Revisemos dónde pudo aparecer el error'}><RichText text={fb.msg} /></Callout>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant={fb?.ok ? 'primary' : 'soft'} onClick={() => reset()}>Nuevo desafío →</Button>
            {kind === 'read' && fb && !fb.ok && <Button size="sm" variant="ghost" onClick={() => setFb({ ok: false, msg: `Las coordenadas son $(${target.x}, ${target.y})$.` })}>Ver respuesta</Button>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default function CoordinatesLab() {
  const [mode, setMode] = useState<'explore' | 'challenge'>('explore');
  return (
    <div className="space-y-4">
      <Segmented value={mode} onChange={setMode} ariaLabel="Modo" options={[{ value: 'explore', label: 'EXPLORAR' }, { value: 'challenge', label: 'DESAFÍOS' }]} />
      {mode === 'explore' ? <Explore /> : <Challenges />}
    </div>
  );
}
