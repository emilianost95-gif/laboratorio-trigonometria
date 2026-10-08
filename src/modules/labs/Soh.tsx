import { useState } from 'react';
import { Callout, Panel, Slider } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { tex } from '../../math/core';
import { cosDeg, sinDeg, tanDeg } from '../../math/trig';
import { RightTriangleView, type Role } from '../../visualizations/RightTriangleView';
import { useLab } from '../../utils/useLab';

type Fn = 'sin' | 'cos' | 'tan';
const CARDS: { fn: Fn; word: string; letters: [string, string, string]; es: string; num: Role; den: Role; meaning: string }[] = [
  { fn: 'sin', word: 'SOH', letters: ['S', 'O', 'H'], es: 'Seno = Opuesto / Hipotenusa', num: 'opp', den: 'hyp', meaning: '¿Qué fracción de la hipotenusa se convierte en **altura** (lo que está enfrente de θ)?' },
  { fn: 'cos', word: 'CAH', letters: ['C', 'A', 'H'], es: 'Coseno = Adyacente / Hipotenusa', num: 'adj', den: 'hyp', meaning: '¿Qué fracción de la hipotenusa se convierte en **avance** (lo que toca a θ)?' },
  { fn: 'tan', word: 'TOA', letters: ['T', 'O', 'A'], es: 'Tangente = Opuesto / Adyacente', num: 'opp', den: 'adj', meaning: '¿Cuánto se **sube** por cada unidad que se **avanza**? Es la pendiente del lado inclinado.' },
];
const ROLE_ES: Record<Role, string> = { opp: 'opuesto', adj: 'adyacente', hyp: 'hipotenusa' };
const TEX_FN: Record<Fn, string> = { sin: '\\sin', cos: '\\cos', tan: '\\tan' };

/** Para cada par (conozco, busco): qué razón usar y cómo queda despejada. */
function chooser(known: Role, want: Role): { fn: Fn; formula: string; why: string } | null {
  if (known === want) return null;
  const pair = [known, want].sort().join('+');
  const fn: Fn = pair === 'hyp+opp' ? 'sin' : pair === 'adj+hyp' ? 'cos' : 'tan';
  const T = TEX_FN[fn];
  const name = { opp: '\\text{op}', adj: '\\text{ady}', hyp: '\\text{hip}' };
  const card = CARDS.find((c) => c.fn === fn)!;
  const numerator = card.num, denominator = card.den;
  const formula = want === numerator
    ? `${name[want]} = ${name[denominator]} \\cdot ${T}\\theta`
    : `${name[want]} = \\dfrac{${name[numerator]}}{${T}\\theta}`;
  const why = `Los lados que intervienen son **${ROLE_ES[known]}** y **${ROLE_ES[want]}** → la única razón que los une es **${card.word}** (${card.es.toLowerCase()}). ${want === numerator ? 'La incógnita está **arriba**: se multiplica.' : 'La incógnita está **abajo**: se divide.'}`;
  return { fn, formula, why };
}

export default function SohLab() {
  const { act } = useLab('m11');
  const [theta, setTheta] = useState(35);
  const [focus, setFocus] = useState<Fn>('sin');
  const [known, setKnown] = useState<Role>('hyp');
  const [want, setWant] = useState<Role>('opp');
  const c = 9, a = c * sinDeg(theta), b = c * cosDeg(theta);
  const val: Record<Role, number> = { opp: a, adj: b, hyp: c };
  const fv: Record<Fn, number> = { sin: sinDeg(theta), cos: cosDeg(theta), tan: tanDeg(theta) };
  const card = CARDS.find((x) => x.fn === focus)!;
  const ch = chooser(known, want);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel pad={false} title={card.es} eyebrow="Toca una sílaba para ver sus lados">
          <RightTriangleView a={a} b={b} box={{ w: 9, h: 8.5 }} highlight={[card.num, card.den]} showValues thetaText={`θ = ${theta}°`} />
        </Panel>
        <div className="space-y-4">
          <Panel title="Ángulo" eyebrow="Control">
            <Slider id="soh-theta" label="θ" value={theta} min={5} max={85} step={1} unit="°" color="ang" onChange={(v) => { setTheta(v); act(); }} />
          </Panel>
          <Callout title="¿Por qué funciona en español?">
            <RichText text="Las iniciales coinciden: **O**puesto, **A**dyacente, **H**ipotenusa; **S**eno, **C**oseno, **T**angente. Cada sílaba dice: función + lado de arriba + lado de abajo." />
          </Callout>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {CARDS.map((cd) => {
          const on = focus === cd.fn;
          return (
            <button key={cd.fn} type="button" onClick={() => { setFocus(cd.fn); act(); }} onMouseEnter={() => setFocus(cd.fn)} aria-pressed={on}
              className={`rounded-xl border p-4 text-left transition-colors ${on ? 'border-accent bg-accent/5' : 'border-line bg-panel hover:border-accent/60'}`}>
              <div className="flex items-baseline gap-1 font-display text-[34px] font-bold tracking-wide">
                <span className="text-ang">{cd.letters[0]}</span>
                <span style={{ color: `rgb(var(--${cd.num}))` }}>{cd.letters[1]}</span>
                <span style={{ color: `rgb(var(--${cd.den}))` }}>{cd.letters[2]}</span>
              </div>
              <div className="text-[13.5px] font-medium">{cd.es}</div>
              <div className="mt-2 text-[13.5px] text-muted"><RichText text={cd.meaning} /></div>
              <div className="mt-2 overflow-x-auto"><Tex>{`${TEX_FN[cd.fn]}\\,${theta}° = \\frac{${tex(val[cd.num])}}{${tex(val[cd.den])}} \\approx ${tex(fv[cd.fn], 4)}`}</Tex></div>
            </button>
          );
        })}
      </div>

      <Panel title="¿Qué razón uso?" eyebrow="Herramienta de decisión">
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="flex flex-wrap items-center gap-3 text-[14px] md:flex-col md:items-start">
            <label className="flex items-center gap-2">Conozco el/la
              <select value={known} onChange={(e) => { setKnown(e.target.value as Role); act(); }} className="h-9 rounded-md border border-line bg-panel2 px-2">
                {(['opp', 'adj', 'hyp'] as Role[]).map((r) => <option key={r} value={r}>{ROLE_ES[r]}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2">Busco el/la
              <select value={want} onChange={(e) => { setWant(e.target.value as Role); act(); }} className="h-9 rounded-md border border-line bg-panel2 px-2">
                {(['opp', 'adj', 'hyp'] as Role[]).map((r) => <option key={r} value={r}>{ROLE_ES[r]}</option>)}
              </select>
            </label>
          </div>
          <div className="min-w-0">
            {ch ? (
              <div className="space-y-2">
                <p className="text-[14.5px]"><RichText text={ch.why} /></p>
                <div className="overflow-x-auto"><Tex display>{ch.formula}</Tex></div>
                <p className="text-[13.5px] text-muted"><RichText text={`Con los valores del dibujo: ${ROLE_ES[want]} $\\approx ${tex(val[want], 3)}$ (conocido: ${ROLE_ES[known]} $= ${tex(val[known], 3)}$, $\\theta = ${theta}°$).`} /></p>
              </div>
            ) : <p className="text-[14px] text-muted">Elige dos lados distintos: el que conoces y el que buscas.</p>}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-[13.5px]">
            <thead><tr className="text-left text-muted"><th className="py-1 font-medium">Conozco ↓ / Busco →</th>{(['opp', 'adj', 'hyp'] as Role[]).map((r) => <th key={r} className="font-medium">{ROLE_ES[r]}</th>)}</tr></thead>
            <tbody>
              {(['opp', 'adj', 'hyp'] as Role[]).map((k) => (
                <tr key={k} className="border-t border-line">
                  <td className="py-1.5 font-medium">{ROLE_ES[k]}</td>
                  {(['opp', 'adj', 'hyp'] as Role[]).map((w) => {
                    const r = chooser(k, w);
                    const on = k === known && w === want;
                    return <td key={w} className={on ? 'font-semibold text-accent' : ''}>{r ? CARDS.find((c2) => c2.fn === r.fn)!.word : '—'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
