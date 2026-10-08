import { useState } from 'react';
import { Badge, Button, Callout, Panel, Readout, Segmented, Slider } from '../../components/ui';
import { RichText } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import { cosDeg, sinDeg } from '../../math/trig';
import { RightTriangleView, ROLE_NAMES, roleOf, type Role, type Side } from '../../visualizations/RightTriangleView';
import { useStore } from '../../store/store';
import { useLab } from '../../utils/useLab';
import { pick } from '../generators';

const BOX = { w: 10, h: 8 };

export default function RightTriangleLab() {
  const { act, save } = useLab('m6');
  const { dispatch } = useStore();
  const [a, setA] = useState(4.5); // vertical
  const [b, setB] = useState(7); // horizontal
  const [thetaAt, setThetaAt] = useState<'A' | 'B'>('A');
  const [quiz, setQuiz] = useState<{ role: Role; at: 'A' | 'B' } | null>(null);
  const [fb, setFb] = useState<{ side: Side; ok: boolean; msg: string } | null>(null);
  const [score, setScore] = useState({ ok: 0, t: 0 });

  const c = Math.hypot(a, b);
  const angA = (Math.atan2(a, b) * 180) / Math.PI;
  const theta = thetaAt === 'A' ? angA : 90 - angA;
  const at = quiz?.at ?? thetaAt;

  // Controles enlazados
  const setTheta = (t: number) => { // mantiene la hipotenusa
    const tA = thetaAt === 'A' ? t : 90 - t;
    const nb = c * cosDeg(tA), na = c * sinDeg(tA);
    if (na <= 8 && nb <= 10) { setA(na); setB(nb); }
    else { const k = Math.min(8 / na, 10 / nb); setA(na * k); setB(nb * k); }
    act();
  };
  const setHyp = (h: number) => { const k = h / c; const na = a * k, nb = b * k; if (na <= 8 && nb <= 10) { setA(na); setB(nb); } act(); };
  const opp = thetaAt === 'A' ? a : b, adj = thetaAt === 'A' ? b : a;

  const newQuiz = () => { setQuiz({ role: pick(['opp', 'adj', 'hyp'] as Role[]), at: pick(['A', 'B'] as const) }); setFb(null); };
  const answer = (s: Side) => {
    if (!quiz || fb?.ok) return;
    const r = roleOf(s, quiz.at);
    const ok = r === quiz.role;
    const why: Record<Role, string> = {
      hyp: 'Ese lado está **frente al ángulo recto**: es la hipotenusa (la más larga), sin importar dónde esté θ.',
      opp: 'Ese lado **no toca** el vértice de θ: está enfrente, es el **opuesto**.',
      adj: 'Ese lado **toca** el vértice de θ y no es la hipotenusa: es el **adyacente** ("el que está al lado").',
    };
    setFb({ side: s, ok, msg: ok ? `¡Correcto! ${why[r]}` : `Tocaste el ${ROLE_NAMES[r]}. ${why[r]}` });
    setScore((x) => ({ ok: x.ok + (ok ? 1 : 0), t: x.t + 1 }));
    dispatch({ type: 'attempt', category: 'right', level: 1, correct: ok, firstTry: !fb, title: 'Identificar lados', module: 'm6', final: ok });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Panel pad={false} title={quiz ? `Toca el ${ROLE_NAMES[quiz.role]} respecto de θ` : 'Triángulo rectángulo'} eyebrow={quiz ? `Quiz · aciertos ${score.ok}/${score.t}` : 'Los nombres dependen de θ'}
          actions={!quiz && <Segmented size="sm" value={thetaAt} onChange={(v) => { setThetaAt(v); act(); }} options={[{ value: 'A', label: 'θ abajo' }, { value: 'B', label: 'θ arriba' }]} />}>
          <RightTriangleView a={a} b={b} thetaAt={at} box={BOX} showValues={!quiz} showRoles={!quiz || !!fb}
            onSideClick={quiz ? answer : undefined} sideFeedback={fb ? { [fb.side]: fb.ok ? 'ok' : 'bad' } : undefined}
            thetaText={quiz ? 'θ' : `θ = ${fmt(theta, 1)}°`} />
        </Panel>
        {!quiz && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Readout label="Opuesto a θ" value={fmt(opp)} tone="opp" />
            <Readout label="Adyacente a θ" value={fmt(adj)} tone="adj" />
            <Readout label="Hipotenusa" value={fmt(c)} tone="hyp" />
            <Readout label="Ángulo θ" value={`${fmt(theta, 1)}°`} tone="ang" sub={`el otro: ${fmt(90 - theta, 1)}° (suman 90°)`} />
          </div>
        )}
      </div>
      <div className="space-y-4">
        {!quiz ? (
          <Panel title="Controles enlazados" eyebrow="Cambia uno, cambia todo">
            <div className="space-y-2">
              <Slider id="m6-theta" label="Ángulo θ" value={theta} min={5} max={85} step={0.5} unit="°" color="ang" onChange={setTheta} />
              <Slider id="m6-opp" label={`Cateto opuesto (${thetaAt === 'A' ? 'vertical' : 'horizontal'})`} value={opp} min={0.5} max={thetaAt === 'A' ? 8 : 10} step={0.1} color="opp" onChange={(v) => { if (thetaAt === 'A') setA(v); else setB(v); act(); }} />
              <Slider id="m6-adj" label={`Cateto adyacente (${thetaAt === 'A' ? 'horizontal' : 'vertical'})`} value={adj} min={0.5} max={thetaAt === 'A' ? 10 : 8} step={0.1} color="adj" onChange={(v) => { if (thetaAt === 'A') setB(v); else setA(v); act(); }} />
              <Slider id="m6-hyp" label="Hipotenusa (escala sin cambiar θ)" value={c} min={1} max={12.8} step={0.1} color="hyp" onChange={setHyp} />
            </div>
            <p className="mt-2 text-[12.5px] text-muted">Al mover θ se conserva la hipotenusa; al mover un cateto cambian θ y la hipotenusa; al mover la hipotenusa el triángulo se agranda o achica con la misma forma.</p>
          </Panel>
        ) : (
          <Panel title="Quiz de lados" eyebrow="Toca un lado del dibujo">
            {fb ? <Callout tone={fb.ok ? 'ok' : 'warn'} title={fb.ok ? 'Correcto' : 'Revisemos'}><RichText text={fb.msg} /></Callout> : <p className="text-[14px]">θ está en el vértice <strong>{quiz.at === 'A' ? 'inferior izquierdo' : 'superior derecho'}</strong>. ¿Cuál es el <strong>{ROLE_NAMES[quiz.role]}</strong>?</p>}
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant={fb?.ok ? 'primary' : 'soft'} onClick={newQuiz}>Otra pregunta →</Button>
              <Button size="sm" variant="ghost" onClick={() => { setQuiz(null); setFb(null); }}>Salir del quiz</Button>
            </div>
          </Panel>
        )}
        {!quiz && <Button variant="primary" onClick={newQuiz}>Practicar: identificar lados</Button>}
        <Panel title="Cómo nombrar los lados" eyebrow="La regla">
          <ol className="list-decimal space-y-1.5 pl-5 text-[14px]">
            <li><RichText text="Encuentra el **ángulo recto**. El lado de enfrente es la **hipotenusa** (siempre la más larga)." /></li>
            <li><RichText text="Ubica **θ**. El cateto que **toca** su vértice es el **adyacente**." /></li>
            <li><RichText text="El cateto que queda **enfrente** de θ es el **opuesto**." /></li>
          </ol>
          <div className="mt-3 flex flex-wrap gap-1.5"><Badge tone="opp">opuesto</Badge><Badge tone="adj">adyacente</Badge><Badge tone="hyp">hipotenusa</Badge><Badge tone="ang">θ</Badge></div>
        </Panel>
        <Callout title="Experimento clave">Cambia θ de abajo a arriba con el selector: los catetos <strong>intercambian sus nombres</strong>, aunque el triángulo es el mismo. "Opuesto" y "adyacente" no son propiedades del lado, sino de su relación con el ángulo.</Callout>
        {!quiz && <Button variant="ghost" size="sm" onClick={() => save('Triángulo rectángulo', `θ = ${fmt(theta, 1)}°: opuesto = ${fmt(opp)}, adyacente = ${fmt(adj)}, hipotenusa = ${fmt(c)}\n$${tex(opp)}^2 + ${tex(adj)}^2 = ${tex(opp * opp + adj * adj)} \\approx ${tex(c)}^2$`)}>Guardar en el cuaderno</Button>}
      </div>
    </div>
  );
}
