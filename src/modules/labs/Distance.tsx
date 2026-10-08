import { useState } from 'react';
import { Button, Callout, Panel, Readout, Reveal, Toggle } from '../../components/ui';
import { RichText, Tex } from '../../components/Tex';
import { fmt, tex, texP } from '../../math/core';
import type { Pt } from '../../math/geometry';
import { DraggablePoint, Label, Plane, Poly, RightMark, Seg } from '../../visualizations/Plane';
import { useLab } from '../../utils/useLab';

const VIEW = { xmin: -8, xmax: 8, ymin: -6, ymax: 6 };

export default function DistanceLab() {
  const { act, save } = useLab('m2');
  const [A, setA] = useState<Pt>({ x: -3, y: -2 });
  const [B, setB] = useState<Pt>({ x: 3, y: 4 });
  const [snap, setSnap] = useState(true);
  const [squares, setSquares] = useState(false);

  const dx = B.x - A.x, dy = B.y - A.y;
  const d2 = dx * dx + dy * dy;
  const d = Math.sqrt(d2);
  const C = { x: B.x, y: A.y }; // vértice del ángulo recto
  const sgx = Math.sign(dx) || 1, sgy = Math.sign(dy) || 1;

  const steps = [
    <RichText key="1" text={`**Avance horizontal.** $\\Delta x = x_2 - x_1 = ${tex(B.x)} - ${texP(A.x)} = ${tex(dx)}$`} />,
    <RichText key="2" text={`**Avance vertical.** $\\Delta y = y_2 - y_1 = ${tex(B.y)} - ${texP(A.y)} = ${tex(dy)}$`} />,
    <RichText key="3" text={`**Aparece un triángulo rectángulo**: $|\\Delta x|$ y $|\\Delta y|$ son los catetos y el segmento $AB$ es la hipotenusa. Pitágoras dice: $d^2 = \\Delta x^2 + \\Delta y^2 = ${texP(dx)}^2 + ${texP(dy)}^2 = ${tex(d2)}$`} />,
    <RichText key="4" text={`**Raíz cuadrada** para pasar de área a longitud: $d = \\sqrt{${tex(d2)}} \\approx ${tex(d, 3)}$`} />,
    <div key="5"><div className="mb-1 text-[14px] font-semibold">La fórmula general (lo que acabas de hacer, con letras):</div><Tex display>{'d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}'}</Tex></div>,
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Panel pad={false} title="Arrastra A y B" eyebrow="Distancia entre puntos" actions={<Toggle id="m2-sq" checked={squares} onChange={setSquares} label="Cuadrados de Pitágoras" />}>
          <Plane view={VIEW} cursor ariaLabel={`Puntos A(${A.x}, ${A.y}) y B(${B.x}, ${B.y}); distancia ${fmt(d)}`}>
            {squares && Math.abs(dx) > 0 && Math.abs(dy) > 0 && (
              <>
                <Poly pts={[A, C, { x: C.x, y: C.y - sgy * Math.abs(dx) }, { x: A.x, y: A.y - sgy * Math.abs(dx) }]} tone="adj" fillOpacity={0.1} width={1} />
                <Poly pts={[C, B, { x: B.x + sgx * Math.abs(dy), y: B.y }, { x: C.x + sgx * Math.abs(dy), y: C.y }]} tone="opp" fillOpacity={0.1} width={1} />
              </>
            )}
            {dx !== 0 && dy !== 0 && <Poly pts={[A, C, B]} tone="hyp" fillOpacity={0.06} stroke={false} />}
            {dx !== 0 && <Seg a={A} b={C} tone="adj" width={3} />}
            {dy !== 0 && <Seg a={C} b={B} tone="opp" width={3} />}
            {dx !== 0 && dy !== 0 && <RightMark at={C} u={{ x: -sgx, y: 0 }} v={{ x: 0, y: sgy }} />}
            <Seg a={A} b={B} tone="hyp" width={3.5} />
            {dx !== 0 && <Label at={{ x: (A.x + C.x) / 2, y: A.y }} dy={sgy > 0 ? 16 : -16} tone="adj" bg>Δx = {fmt(dx)}</Label>}
            {dy !== 0 && <Label at={{ x: C.x, y: (C.y + B.y) / 2 }} dx={sgx > 0 ? 12 : -12} anchor={sgx > 0 ? 'start' : 'end'} tone="opp" bg>Δy = {fmt(dy)}</Label>}
            <Label at={{ x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }} dx={-sgx * sgy * 14} dy={-14} tone="hyp" bg>d ≈ {fmt(d)}</Label>
            <DraggablePoint at={A} label="A" showCoords snap={snap ? 1 : 0.1} onChange={(p) => { setA(p); act(); }} />
            <DraggablePoint at={B} label="B" showCoords snap={snap ? 1 : 0.1} tone="hyp" onChange={(p) => { setB(p); act(); }} />
          </Plane>
        </Panel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Readout label="Δx" value={fmt(dx)} tone="adj" />
          <Readout label="Δy" value={fmt(dy)} tone="opp" />
          <Readout label="d²" value={fmt(d2)} />
          <Readout label="Distancia d" value={fmt(d, 3)} tone="hyp" />
        </div>
      </div>
      <div className="space-y-4">
        <Panel title="La fórmula aparece paso a paso" eyebrow="Descubrir">
          <Reveal steps={steps} />
        </Panel>
        <Panel title="Controles" eyebrow="Coordenadas">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            {([['A', A, setA], ['B', B, setB]] as const).map(([n, P, set]) => (
              <fieldset key={n} className="space-y-1.5">
                <legend className="font-semibold">{n}</legend>
                {(['x', 'y'] as const).map((k) => (
                  <div key={k} className="flex items-center gap-1">
                    <span className="num w-3">{k}</span>
                    <Button size="sm" variant="soft" aria-label={`${n}.${k} menos 1`} onClick={() => { set({ ...P, [k]: Math.max(k === 'x' ? -8 : -6, P[k] - 1) }); act(); }}>−</Button>
                    <span className="num w-8 text-center">{fmt(P[k])}</span>
                    <Button size="sm" variant="soft" aria-label={`${n}.${k} más 1`} onClick={() => { set({ ...P, [k]: Math.min(k === 'x' ? 8 : 6, P[k] + 1) }); act(); }}>+</Button>
                  </div>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="mt-3"><Toggle id="m2-snap" checked={snap} onChange={setSnap} label="Ajustar a enteros" /></div>
        </Panel>
        <Callout title="¿Importa el orden de A y B?">
          <RichText text={`Si cambias el orden, $\\Delta x$ cambia de signo… pero al elevar al cuadrado el signo desaparece: $(${tex(-dx)})^2 = (${tex(dx)})^2$. La distancia nunca es negativa.`} />
        </Callout>
        <Button variant="ghost" size="sm" onClick={() => save('Distancia entre puntos', `A = (${fmt(A.x)}, ${fmt(A.y)}), B = (${fmt(B.x)}, ${fmt(B.y)})\n$\\Delta x = ${tex(dx)}$, $\\Delta y = ${tex(dy)}$\n$d = \\sqrt{${tex(d2)}} \\approx ${tex(d, 3)}$`)}>Guardar medición en el cuaderno</Button>
      </div>
    </div>
  );
}
