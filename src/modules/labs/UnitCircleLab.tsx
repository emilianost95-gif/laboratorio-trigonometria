import { useState } from 'react';
import { Badge, Button, Panel, Readout, Segmented, Slider, Toggle } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex, toDeg, toRad } from '../../math/core';
import { angleQuadrant, cosDeg, exactTex, radTex, referenceAngle, sinDeg, tanDeg } from '../../math/trig';
import { tryEvaluate } from '../../math/calculator';
import { UnitCircleView, WavesView, type UnitCircleLayers } from '../../visualizations/UnitCircle';
import { useStore } from '../../store/store';
import { useLab } from '../../utils/useLab';

const PRESETS = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
const QN = ['sobre un eje', 'I', 'II', 'III', 'IV'];

export default function UnitCircleLab() {
  const { act, save } = useLab('m13');
  const { state } = useStore();
  const [theta, setThetaRaw] = useState(30);
  const [unit, setUnit] = useState<'DEG' | 'RAD'>(state.settings.angleMode);
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');
  const [snap, setSnap] = useState(false);
  const [layers, setLayers] = useState<UnitCircleLayers>({ triangle: true, projections: true, tangent: false, line: false, quadrants: true });
  const setTheta = (t: number) => { setThetaRaw(t); act(); };

  const c = cosDeg(theta), s = sinDeg(theta), t = tanDeg(theta);
  const q = angleQuadrant(theta);
  const exact = (fn: 'sin' | 'cos' | 'tan') => exactTex(fn, theta);

  const applyInput = () => {
    const v = tryEvaluate(txt, 'RAD'); // la expresión se evalúa numéricamente (π permitido)
    if (v === null) { setErr('No entendí ese valor. Ejemplos: 150, π/3, 2π/3, 1,2'); return; }
    const deg = unit === 'DEG' ? v : toDeg(v);
    if (deg < 0 || deg > 360) { setErr('Usa un ángulo entre 0° y 360° (0 y 2π rad).'); return; }
    setErr('');
    setTheta(Math.round(deg * 1000) / 1000);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel pad={false} title="Círculo unitario (radio = 1)" eyebrow="Arrastra el punto P" actions={<Toggle id="m13-snap" checked={snap} onChange={setSnap} label="Saltos de 15°" />}>
          <div className="mx-auto max-w-[640px]"><UnitCircleView theta={theta} onTheta={setTheta} layers={layers} snap={snap ? 15 : 0} /></div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line px-4 py-2.5">
            <Toggle id="m13-l1" checked={layers.projections} onChange={(v) => setLayers({ ...layers, projections: v })} label="cos y sen" />
            <Toggle id="m13-l2" checked={layers.triangle} onChange={(v) => setLayers({ ...layers, triangle: v })} label="Triángulo" />
            <Toggle id="m13-l3" checked={layers.tangent} onChange={(v) => setLayers({ ...layers, tangent: v })} label="Tangente" />
            <Toggle id="m13-l4" checked={layers.line} onChange={(v) => setLayers({ ...layers, line: v })} label="Recta OP" />
            <Toggle id="m13-l5" checked={layers.quadrants} onChange={(v) => setLayers({ ...layers, quadrants: v })} label="Cuadrante" />
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Ángulo" eyebrow="Controles" actions={<Segmented size="sm" value={unit} onChange={setUnit} options={[{ value: 'DEG', label: 'DEG' }, { value: 'RAD', label: 'RAD' }]} />}>
            <Slider id="m13-theta" label="θ" value={theta} min={0} max={360} step={1} unit="°" color="ang" onChange={setTheta} />
            <form className="mt-2 flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); applyInput(); }}>
              <label htmlFor="m13-in" className="text-[13px]">Escribir θ en {unit === 'DEG' ? 'grados' : 'radianes'}</label>
              <input id="m13-in" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={unit === 'DEG' ? '150' : 'π/3'} className="num h-9 w-24 rounded-md border border-line bg-panel2 px-2" />
              <Button type="submit" size="sm" variant="primary">Ir</Button>
            </form>
            {err && <p className="mt-1 text-[12.5px] text-warn">{err}</p>}
            <div className="mt-3 flex flex-wrap gap-1">
              {PRESETS.map((p) => <Button key={p} size="sm" variant={Math.abs(theta - p) < 1e-6 ? 'primary' : 'soft'} className="!px-2" onClick={() => setTheta(p)}>{unit === 'DEG' ? `${p}°` : <Tex>{radTex(p)}</Tex>}</Button>)}
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-2">
            <Readout label="θ" value={unit === 'DEG' ? `${fmt(theta, 1)}°` : `${fmt(toRad(theta), 4)}`} tone="ang" sub={unit === 'DEG' ? `${fmt(toRad(theta), 4)} rad` : `${fmt(theta, 1)}°`} />
            <Readout label="Cuadrante" value={QN[q]} sub={`referencia ${fmt(referenceAngle(theta), 1)}°`} />
            <Readout label="x = cos θ" value={fmt(c, 4)} tone="adj" />
            <Readout label="y = sen θ" value={fmt(s, 4)} tone="opp" />
            <Readout label="tan θ = y / x" value={Number.isFinite(t) ? fmt(t, 4) : 'no definida'} tone="accent" sub={Number.isFinite(t) ? 'pendiente de OP' : 'x = 0: división por cero'} />
            <Readout label="x² + y²" value={fmt(c * c + s * s, 6)} tone="hyp" sub="siempre 1" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Valores" eyebrow={exact('sin') ? 'Exactos (ángulo notable)' : 'Aproximados'}>
          <div className="grid gap-2 text-[15px] sm:grid-cols-3">
            <div><Tex>{`\\cos ${tex(theta, 1)}° = ${exact('cos') ?? tex(c, 4)}`}</Tex></div>
            <div><Tex>{`\\sin ${tex(theta, 1)}° = ${exact('sin') ?? tex(s, 4)}`}</Tex></div>
            <div><Tex>{`\\tan ${tex(theta, 1)}° = ${Number.isFinite(t) ? (exact('tan') ?? tex(t, 4)) : '\\text{no def.}'}`}</Tex></div>
          </div>
          <p className="mt-3 text-[14px]"><RichText text={`**La gran idea:** en un círculo de radio 1, la hipotenusa del triángulo vale 1. Entonces $\\cos\\theta = \\dfrac{\\text{ady}}{1} = x$ y $\\sin\\theta = \\dfrac{\\text{op}}{1} = y$. Y eso nos deja **definir** seno y coseno para **cualquier** ángulo, incluso mayores que 90°, donde ya no hay triángulo rectángulo "normal".`} /></p>
        </Panel>
        <Panel title="Signos por cuadrante" eyebrow="Dónde es positivo cada uno">
          <div className="grid grid-cols-2 gap-2">
            {[2, 1, 3, 4].map((qq) => {
              const sx = qq === 1 || qq === 4 ? '+' : '−', sy = qq <= 2 ? '+' : '−';
              const tn = sx === sy ? '+' : '−';
              return (
                <div key={qq} className={`rounded-lg border p-2.5 text-[13.5px] ${q === qq ? 'border-accent bg-accent/5' : 'border-line'}`}>
                  <div className="mb-1 flex items-center justify-between"><span className="font-semibold">Cuadrante {QN[qq]}</span>{q === qq && <Badge tone="accent">θ aquí</Badge>}</div>
                  <div className="num space-x-2"><span className="text-adj">cos {sx}</span><span className="text-opp">sen {sy}</span><span className="text-accent">tan {tn}</span></div>
                  <div className="text-[12px] text-muted">{['', '0° – 90°', '90° – 180°', '180° – 270°', '270° – 360°'][qq]}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel title="El círculo desenrollado" eyebrow="Ondas de seno y coseno" actions={<Button size="sm" variant="ghost" onClick={() => save('Círculo unitario', `$\\theta = ${tex(theta, 1)}°$ (cuadrante ${QN[q]})\n$\\cos\\theta = ${exact('cos') ?? tex(c, 4)}$, $\\sin\\theta = ${exact('sin') ?? tex(s, 4)}$, $\\tan\\theta = ${Number.isFinite(t) ? exact('tan') ?? tex(t, 4) : '\\text{no definida}'}$`)}>Guardar valores</Button>}>
        <div className="overflow-x-auto"><div className="min-w-[480px]"><WavesView theta={theta} /></div></div>
        <p className="mt-2 text-[13.5px] text-muted"><span className="text-opp">Rojo: sen θ</span> (la altura de P) · <span className="text-adj">Azul: cos θ</span> (la posición horizontal de P). Al dar una vuelta completa los valores se repiten: son funciones <strong>periódicas</strong>.</p>
      </Panel>
    </div>
  );
}
