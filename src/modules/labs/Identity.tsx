import { useState } from 'react';
import { Badge, Button, Callout, Panel, Readout, Reveal, Slider } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex } from '../../math/core';
import { cosDeg, sinDeg, tanDeg } from '../../math/trig';
import { UnitCircleView } from '../../visualizations/UnitCircle';
import { useLab } from '../../utils/useLab';

export default function IdentityLab() {
  const { act, save } = useLab('m14');
  const [theta, setThetaRaw] = useState(40);
  const [check, setCheck] = useState<{ n: number; maxErr: number; worst: number } | null>(null);
  const setTheta = (t: number) => { setThetaRaw(t); act(); };
  const s = sinDeg(theta), c = cosDeg(theta), t = tanDeg(theta);
  const s2 = s * s, c2 = c * c, sum = s2 + c2;

  const massCheck = () => {
    let maxErr = 0, worst = 0;
    const n = 10000;
    for (let i = 0; i < n; i++) {
      const d = Math.random() * 720 - 360;
      const e = Math.abs(sinDeg(d) ** 2 + cosDeg(d) ** 2 - 1);
      if (e > maxErr) { maxErr = e; worst = d; }
    }
    setCheck({ n, maxErr, worst });
    act();
  };

  const proof = [
    <RichText key="1" text="El punto $P$ del círculo unitario tiene coordenadas $(x, y) = (\cos\theta, \sin\theta)$." />,
    <RichText key="2" text="$P$ está a distancia **1** del origen (es el radio). Con $x$, $y$ y el radio se forma un triángulo rectángulo." />,
    <RichText key="3" text="Pitágoras en ese triángulo: $x^2 + y^2 = 1^2$." />,
    <RichText key="4" text="Sustituyendo $x = \cos\theta$, $y = \sin\theta$: $$\cos^2\theta + \sin^2\theta = 1$$" />,
    <RichText key="5" text="En los cuadrantes II, III y IV, $x$ o $y$ son negativos… pero **al cuadrado** el signo desaparece. Por eso la identidad vale para **todo** ángulo." />,
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel pad={false} title="Los cuadrados de seno y coseno" eyebrow="Mueve P por el círculo">
          <div className="mx-auto max-w-[620px]">
            <UnitCircleView theta={theta} onTheta={setTheta} layers={{ triangle: true, projections: true, tangent: false, line: false, quadrants: false, squares: true }} />
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Ángulo" eyebrow="Control">
            <Slider id="m14-theta" label="θ" value={theta} min={0} max={360} step={1} unit="°" color="ang" onChange={setTheta} />
          </Panel>
          <Panel title="Comprobación en vivo" eyebrow="sin²θ + cos²θ">
            <div className="grid grid-cols-2 gap-2">
              <Readout label="sen θ" value={fmt(s, 5)} tone="opp" />
              <Readout label="cos θ" value={fmt(c, 5)} tone="adj" />
              <Readout label="sen² θ" value={fmt(s2, 5)} tone="opp" />
              <Readout label="cos² θ" value={fmt(c2, 5)} tone="adj" />
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[12px] text-muted"><span>0</span><span>1</span></div>
              <div className="flex h-6 overflow-hidden rounded-md border border-line" role="img" aria-label={`sen² ${fmt(s2, 3)} más cos² ${fmt(c2, 3)} igual a 1`}>
                <div className="flex items-center justify-center bg-opp/80 text-[11px] font-semibold text-white transition-[width] duration-150" style={{ width: `${s2 * 100}%` }}>{s2 > 0.12 ? 'sen²' : ''}</div>
                <div className="flex items-center justify-center bg-adj/80 text-[11px] font-semibold text-white transition-[width] duration-150" style={{ width: `${c2 * 100}%` }}>{c2 > 0.12 ? 'cos²' : ''}</div>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto"><Tex display>{`${tex(s2, 5)} + ${tex(c2, 5)} = ${tex(sum, 12)}`}</Tex></div>
            <Badge tone="ok">✓ suma = {fmt(sum, 12)}</Badge>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="¿Por qué siempre da 1?" eyebrow="Demostración">
          <Reveal steps={proof} />
        </Panel>
        <Panel title="Verificación masiva" eyebrow="10 000 ángulos al azar">
          <p className="text-[14px]">La computadora prueba la identidad con 10 000 ángulos aleatorios entre −360° y 360° y reporta el mayor error encontrado.</p>
          <Button className="mt-3" variant="primary" onClick={massCheck}>Ejecutar prueba</Button>
          {check && (
            <div className="fade-up mt-3 space-y-1 text-[14px]">
              <div>Ángulos probados: <span className="num font-semibold">{check.n.toLocaleString('es-CL')}</span></div>
              <div>Mayor error: <span className="num font-semibold">{check.maxErr === 0 ? '0' : check.maxErr.toExponential(2)}</span> {check.maxErr > 0 && <span className="text-muted">(en θ ≈ {fmt(check.worst, 2)}°)</span>}</div>
              <Callout tone="ok"><RichText text={`Ese error (del orden de $10^{-16}$) no es matemático: es el redondeo de la computadora, que guarda unos 16 dígitos. **La identidad se cumple en todos los casos.**`} /></Callout>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Identidades que salen de aquí" eyebrow="Consecuencias">
          <div className="space-y-3 text-[14.5px]">
            <div>
              <Tex>{'\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta}'}</Tex>
              <div className="text-[13px] text-muted">{Number.isFinite(t) ? <RichText text={`Ahora: $\\dfrac{${tex(s, 4)}}{${tex(c, 4)}} = ${tex(s / c, 4)}$ y $\\tan ${theta}° = ${tex(t, 4)}$ ✓`} /> : 'Con cos θ = 0 la tangente no está definida.'}</div>
            </div>
            <div>
              <Tex>{'1 + \\tan^2\\theta = \\dfrac{1}{\\cos^2\\theta}'}</Tex>
              <div className="text-[13px] text-muted">{Number.isFinite(t) ? <RichText text={`Se obtiene dividiendo la identidad por $\\cos^2\\theta$. Ahora: $1 + ${tex(t * t, 4)} = ${tex(1 + t * t, 4)}$ y $1/${tex(c2, 4)} = ${tex(1 / c2, 4)}$ ✓`} /> : 'No definida cuando cos θ = 0.'}</div>
            </div>
            <div>
              <Tex>{'\\cos\\theta = \\pm\\sqrt{1 - \\sin^2\\theta}'}</Tex>
              <div className="text-[13px] text-muted">El signo lo decide el cuadrante. Es la herramienta para obtener el coseno sabiendo solo el seno.</div>
            </div>
          </div>
        </Panel>
        <Panel title="Si el radio no es 1" eyebrow="Generalización">
          <p className="text-[14.5px]"><RichText text={`Para un punto $(x, y)$ a distancia $r$ del origen: $x = r\\cos\\theta$, $y = r\\sin\\theta$, y Pitágoras da $x^2 + y^2 = r^2$. Dividiendo por $r^2$ volvemos a $\\cos^2\\theta + \\sin^2\\theta = 1$. El tamaño no importa: la identidad habla de **proporciones**, igual que las razones trigonométricas.`} /></p>
          <Button className="mt-3" size="sm" variant="ghost" onClick={() => save('Identidad fundamental', `$\\sin^2\\theta + \\cos^2\\theta = 1$\nEjemplo con θ = ${theta}°: $${tex(s2, 5)} + ${tex(c2, 5)} = ${tex(sum, 10)}$\nViene de Pitágoras en el círculo unitario: $x^2 + y^2 = 1$.`, 'formula')}>Guardar en el cuaderno</Button>
        </Panel>
      </div>
    </div>
  );
}
