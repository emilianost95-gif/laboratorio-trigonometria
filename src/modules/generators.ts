import { round, tex, texP, fmt } from '../math/core';
import { acosDeg, asinDeg, atanDeg, cosDeg, sinDeg, tanDeg, exactTex, radTex, referenceAngle } from '../math/trig';
import type { Category, Figure, Level, Mistake, Problem } from './types';

// ============ utilidades de aleatoriedad ============
export const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rndNZ = (a: number, b: number) => { let v = 0; while (v === 0) v = rnd(a, b); return v; };
const uid = () => Math.random().toString(36).slice(2, 10);
const rndDec = (a: number, b: number, d = 1) => round(a + Math.random() * (b - a), d);
/** Ángulo agudo "interesante": evita 45° (donde seno = coseno y no se detectaría la confusión). */
const acute = (a = 20, b = 70) => { let t = 45; while (t === 45) t = rnd(a, b); return t; };

const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29], [12, 16, 20]];

function shuffleChoices(correct: string, wrong: string[], explain: string[] = []) {
  const items = [{ t: correct, ok: true, e: '' }, ...wrong.map((t, i) => ({ t, ok: false, e: explain[i] ?? '' }))];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const choiceExplain: Record<number, string> = {};
  items.forEach((it, i) => { if (!it.ok && it.e) choiceExplain[i] = it.e; });
  return { choices: items.map((i) => i.t), answer: items.findIndex((i) => i.ok), choiceExplain };
}

/** Quita errores "esperables" que coinciden con la respuesta correcta o entre sí. */
function cleanMistakes(answer: number, ms: Mistake[]): Mistake[] {
  const out: Mistake[] = [];
  for (const m of ms) {
    if (!Number.isFinite(m.value)) continue;
    if (Math.abs(m.value - answer) <= Math.max(0.03, Math.abs(answer) * 0.01)) continue;
    if (out.some((o) => Math.abs(o.value - m.value) < 1e-6)) continue;
    out.push(m);
  }
  return out;
}

type Base = Omit<Problem, 'id' | 'category' | 'level'>;
function mk(category: Category, level: Level, p: Base): Problem {
  return { id: uid(), category, level, ...p, mistakes: p.mistakes ? cleanMistakes(p.answer, p.mistakes) : undefined };
}

const RAD_MISTAKE = (value: number): Mistake => ({
  value,
  label: 'Calculadora en radianes',
  explain: 'Ese resultado aparece si la calculadora está en modo **RAD** pero el ángulo está en **grados**. Cambia a **DEG** y repite.',
});

// ======================================================
// COORDENADAS
// ======================================================
function genCoords(level: Level): Problem {
  if (level === 1) {
    const x = rndNZ(-8, 8), y = rndNZ(-8, 8);
    const q = x > 0 ? (y > 0 ? 0 : 3) : y > 0 ? 1 : 2;
    const names = ['Cuadrante I', 'Cuadrante II', 'Cuadrante III', 'Cuadrante IV'];
    const signs = ['(+, +)', '(−, +)', '(−, −)', '(+, −)'];
    const { choices, answer, choiceExplain } = shuffleChoices(
      names[q],
      names.filter((_, i) => i !== q),
      names.map((_, i) => i).filter((i) => i !== q).map((i) => `El ${names[i]} tiene signos ${signs[i]}, pero el punto tiene $x ${x > 0 ? '> 0' : '< 0'}$ e $y ${y > 0 ? '> 0' : '< 0'}$.`),
    );
    return mk('coords', level, {
      title: 'Identificar el cuadrante',
      statement: `¿En qué cuadrante está el punto $P = (${x}, ${y})$?`,
      data: [`$x = ${x}$`, `$y = ${y}$`],
      kind: 'choice', choices, answer, choiceExplain,
      figure: { type: 'points', points: [{ name: 'P', x, y }] },
      hints: ['Mira primero el **signo** de cada coordenada.', 'Los cuadrantes se numeran en sentido **antihorario** empezando arriba a la derecha: I (+,+), II (−,+), III (−,−), IV (+,−).'],
      steps: [`$x = ${x}$ es ${x > 0 ? 'positiva → derecha del eje Y' : 'negativa → izquierda del eje Y'}.`, `$y = ${y}$ es ${y > 0 ? 'positiva → arriba del eje X' : 'negativa → abajo del eje X'}.`, `Signos ${signs[q]} → **${names[q]}**.`],
    });
  }
  if (level === 2) {
    const x = rnd(-6, 6), y = rnd(-6, 6), dx = rndNZ(-5, 5), dy = rndNZ(-5, 5);
    const ask = pick(['x', 'y'] as const);
    const ans = ask === 'x' ? x + dx : y + dy;
    const dirX = dx > 0 ? `${dx} unidades a la derecha` : `${-dx} unidades a la izquierda`;
    const dirY = dy > 0 ? `${dy} unidades hacia arriba` : `${-dy} unidades hacia abajo`;
    return mk('coords', level, {
      title: 'Trasladar un punto',
      statement: `El punto $A = (${x}, ${y})$ se mueve ${dirX} y ${dirY}. ¿Cuál es la coordenada **${ask}** del nuevo punto?`,
      data: [`$A = (${x}, ${y})$`, `Desplazamiento horizontal: ${dx > 0 ? '+' : '−'}${Math.abs(dx)}`, `Desplazamiento vertical: ${dy > 0 ? '+' : '−'}${Math.abs(dy)}`],
      kind: 'numeric', answer: ans,
      hints: ['Derecha suma a $x$, izquierda resta. Arriba suma a $y$, abajo resta.', `Solo cambia la coordenada ${ask} con el movimiento ${ask === 'x' ? 'horizontal' : 'vertical'}.`],
      steps: ask === 'x' ? [`$x' = x + \\Delta x = ${x} + ${texP(dx)} = ${ans}$`] : [`$y' = y + \\Delta y = ${y} + ${texP(dy)} = ${ans}$`],
      mistakes: [
        { value: ask === 'x' ? x - dx : y - dy, label: 'Dirección invertida', explain: 'Moviste el punto en la dirección contraria. Derecha/arriba **suman**; izquierda/abajo **restan**.' },
        { value: ask === 'x' ? y + dy : x + dx, label: 'Coordenadas intercambiadas', explain: 'Calculaste la otra coordenada. En $(x, y)$ la primera es horizontal y la segunda vertical.' },
      ],
    });
  }
  // nivel 3+: punto medio
  const A = { x: rnd(-8, 8), y: rnd(-8, 8) }, B = { x: rnd(-8, 8), y: rnd(-8, 8) };
  const ask = pick(['x', 'y'] as const);
  const ans = ask === 'x' ? (A.x + B.x) / 2 : (A.y + B.y) / 2;
  const u1 = ask === 'x' ? A.x : A.y, u2 = ask === 'x' ? B.x : B.y;
  return mk('coords', 3, {
    title: 'Punto medio',
    statement: `Un sensor está justo a mitad de camino entre $A = (${A.x}, ${A.y})$ y $B = (${B.x}, ${B.y})$. ¿Cuál es su coordenada **${ask}**?`,
    data: [`$A = (${A.x}, ${A.y})$`, `$B = (${B.x}, ${B.y})$`],
    kind: 'numeric', answer: ans,
    figure: { type: 'points', points: [{ name: 'A', ...A }, { name: 'B', ...B }], segment: true },
    hints: ['El punto medio es el **promedio** de las coordenadas.', `$${ask}_M = \\dfrac{${ask}_1 + ${ask}_2}{2}$`],
    steps: [`$${ask}_M = \\dfrac{${u1} + ${texP(u2)}}{2} = \\dfrac{${u1 + u2}}{2} = ${tex(ans)}$`],
    mistakes: [
      { value: (u2 - u1) / 2, label: 'Restaste en vez de sumar', explain: 'El punto medio **promedia**: se suman las coordenadas y se divide por 2.' },
      { value: u1 + u2, label: 'Faltó dividir por 2', explain: 'Sumaste bien, pero el promedio de dos valores se divide por **2**.' },
    ],
  });
}

// ======================================================
// DISTANCIA
// ======================================================
function genDistance(level: Level): Problem {
  if (level === 1) {
    const y = rnd(-6, 6), x1 = rnd(-9, 0), x2 = rnd(1, 9);
    const ans = x2 - x1;
    return mk('distance', level, {
      title: 'Distancia horizontal',
      statement: `¿Cuál es la distancia entre $A = (${x1}, ${y})$ y $B = (${x2}, ${y})$?`,
      data: [`$A = (${x1}, ${y})$`, `$B = (${x2}, ${y})$`],
      kind: 'numeric', answer: ans,
      figure: { type: 'points', points: [{ name: 'A', x: x1, y }, { name: 'B', x: x2, y }], segment: true },
      hints: ['Ambos puntos tienen la misma $y$: están sobre una recta horizontal.', 'Cuenta cuántas unidades hay de una $x$ a la otra: $|x_2 - x_1|$.'],
      steps: [`Misma altura → solo cuenta $\\Delta x$.`, `$d = |x_2 - x_1| = |${x2} - ${texP(x1)}| = ${ans}$`],
      mistakes: [{ value: Math.abs(x2 + x1), label: 'Error de signo', explain: `Al restar un número negativo hay que **sumar**: $${x2} - (${x1}) = ${x2} + ${-x1}$.` }],
    });
  }
  const [p, q] = level === 2 ? pick(TRIPLES.slice(0, 5)) : [rndNZ(-7, 7), rndNZ(-7, 7)];
  const dx = level === 2 ? p * pick([1, -1]) : p, dy = level === 2 ? q * pick([1, -1]) : q;
  const A = { x: rnd(-5, 5), y: rnd(-5, 5) };
  const B = { x: A.x + dx, y: A.y + dy };
  const d = Math.hypot(dx, dy);
  const ctx = level === 2 ? '' : level === 3 ? 'Un dron vuela en línea recta desde la base $A$ hasta el punto $B$ (coordenadas en km). ' : 'En un mapa a escala, cada unidad equivale a 1 km. ';
  const statement = level >= 4
    ? `${ctx}Un ciclista va de $A = (${A.x}, ${A.y})$ a $B = (${B.x}, ${B.y})$ por las calles (primero en horizontal y luego en vertical). ¿Cuántos km **se ahorraría** si pudiera ir en línea recta?`
    : `${ctx}Calcula la distancia entre $A = (${A.x}, ${A.y})$ y $B = (${B.x}, ${B.y})$.`;
  const ans = level >= 4 ? Math.abs(dx) + Math.abs(dy) - d : d;
  const steps = [
    `$\\Delta x = x_2 - x_1 = ${B.x} - ${texP(A.x)} = ${dx}$`,
    `$\\Delta y = y_2 - y_1 = ${B.y} - ${texP(A.y)} = ${dy}$`,
    `$\\Delta x$ y $\\Delta y$ son los **catetos** de un triángulo rectángulo; la distancia es su **hipotenusa**.`,
    `$d = \\sqrt{(${dx})^2 + (${dy})^2} = \\sqrt{${dx * dx} + ${dy * dy}} = \\sqrt{${dx * dx + dy * dy}} \\approx ${tex(d, 3)}$`,
  ];
  if (level >= 4) steps.push(`Por calles: $|\\Delta x| + |\\Delta y| = ${Math.abs(dx)} + ${Math.abs(dy)} = ${Math.abs(dx) + Math.abs(dy)}$ km.`, `Ahorro: $${Math.abs(dx) + Math.abs(dy)} - ${tex(d, 3)} \\approx ${tex(ans, 3)}$ km.`);
  return mk('distance', level, {
    title: level >= 4 ? 'Ruta recta vs. calles' : 'Distancia entre dos puntos',
    statement,
    data: [`$A = (${A.x}, ${A.y})$`, `$B = (${B.x}, ${B.y})$`],
    kind: 'numeric', answer: ans, unit: level >= 3 ? 'km' : undefined,
    answerHint: 'Redondea a 2 decimales (o escribe la raíz, por ejemplo √29).',
    figure: { type: 'points', points: [{ name: 'A', ...A }, { name: 'B', ...B }], segment: true },
    hints: ['Dibuja el triángulo: sube/baja desde $A$ y avanza en horizontal hasta $B$.', 'Calcula $\\Delta x$ y $\\Delta y$, y aplica Pitágoras: $d = \\sqrt{\\Delta x^2 + \\Delta y^2}$.'],
    steps,
    mistakes: level >= 4 ? [] : [
      { value: dx * dx + dy * dy, label: 'Faltó la raíz', explain: 'Llegaste a $d^2$. Pitágoras da el **cuadrado** de la distancia: falta sacar la **raíz cuadrada**.' },
      { value: Math.abs(dx) + Math.abs(dy), label: 'Sumaste los catetos', explain: 'Sumar $|\\Delta x| + |\\Delta y|$ es el camino "por las calles". En línea recta se usa Pitágoras: $\\sqrt{\\Delta x^2 + \\Delta y^2}$.' },
      { value: Math.hypot(B.x + A.x, B.y + A.y), label: 'Error de signo en Δ', explain: 'Parece que **sumaste** coordenadas en vez de restarlas. $\\Delta x = x_2 - x_1$ (¡cuidado al restar negativos!).' },
      { value: Math.sqrt(Math.abs(dx * dx - dy * dy)), label: 'Restaste los cuadrados', explain: 'En la distancia los cuadrados se **suman**: $d^2 = \\Delta x^2 + \\Delta y^2$.' },
    ],
  });
}

// ======================================================
// PENDIENTE
// ======================================================
function genSlope(level: Level): Problem {
  if (level === 1) {
    const kind = pick(['pos', 'neg', 'zero', 'vert'] as const);
    const A = { x: rnd(-6, 2), y: rnd(-6, 2) };
    const B = kind === 'zero' ? { x: A.x + rnd(2, 6), y: A.y } : kind === 'vert' ? { x: A.x, y: A.y + rnd(2, 6) } : { x: A.x + rnd(2, 6), y: A.y + (kind === 'pos' ? 1 : -1) * rnd(1, 6) };
    const names = ['Positiva', 'Negativa', 'Cero', 'No definida (vertical)'];
    const idx = { pos: 0, neg: 1, zero: 2, vert: 3 }[kind];
    const { choices, answer, choiceExplain } = shuffleChoices(names[idx], names.filter((_, i) => i !== idx), names.filter((_, i) => i !== idx).map(() => 'Calcula $\\Delta y$ y $\\Delta x$: el signo del cociente $\\Delta y / \\Delta x$ te dice si sube, baja, es plana o vertical.'));
    return mk('slope', level, {
      title: 'Tipo de pendiente',
      statement: `¿Cómo es la pendiente de la recta que pasa por $A = (${A.x}, ${A.y})$ y $B = (${B.x}, ${B.y})$?`,
      data: [`$A = (${A.x}, ${A.y})$`, `$B = (${B.x}, ${B.y})$`],
      kind: 'choice', choices, answer, choiceExplain,
      figure: { type: 'points', points: [{ name: 'A', ...A }, { name: 'B', ...B }], segment: true },
      hints: ['Recorre la recta de izquierda a derecha: ¿sube, baja o se mantiene?', 'Si $\\Delta x = 0$ la recta es vertical: no se puede dividir por cero.'],
      steps: [`$\\Delta y = ${B.y - A.y}$, $\\Delta x = ${B.x - A.x}$`, kind === 'vert' ? '$\\Delta x = 0$ → división por cero → pendiente **no definida**.' : `$m = \\dfrac{${B.y - A.y}}{${B.x - A.x}}$ → **${names[idx]}**.`],
    });
  }
  if (level === 2) {
    let A, B;
    do { A = { x: rnd(-6, 6), y: rnd(-6, 6) }; B = { x: rnd(-6, 6), y: rnd(-6, 6) }; } while (A.x === B.x || A.y === B.y || Math.abs(B.y - A.y) === Math.abs(B.x - A.x));
    const dy = B.y - A.y, dx = B.x - A.x, m = dy / dx;
    return mk('slope', level, {
      title: 'Calcular la pendiente',
      statement: `Calcula la pendiente de la recta que pasa por $A = (${A.x}, ${A.y})$ y $B = (${B.x}, ${B.y})$.`,
      data: [`$A = (${A.x}, ${A.y})$`, `$B = (${B.x}, ${B.y})$`],
      kind: 'numeric', answer: m, answerHint: 'Puedes responder como fracción (ej: -3/4) o decimal.',
      figure: { type: 'points', points: [{ name: 'A', ...A }, { name: 'B', ...B }], segment: true },
      hints: ['Pendiente = cuánto **sube** por cada unidad que **avanza**: $m = \\dfrac{\\Delta y}{\\Delta x}$.', 'Resta en el **mismo orden** arriba y abajo: $(y_2 - y_1)$ y $(x_2 - x_1)$.'],
      steps: [`$\\Delta y = ${B.y} - ${texP(A.y)} = ${dy}$`, `$\\Delta x = ${B.x} - ${texP(A.x)} = ${dx}$`, `$m = \\dfrac{\\Delta y}{\\Delta x} = \\dfrac{${dy}}{${dx}} \\approx ${tex(m, 3)}$`],
      mistakes: [
        { value: dx / dy, label: 'Δx/Δy invertido', explain: 'Pusiste $\\Delta x$ arriba. La pendiente es **subida / avance**: $\\Delta y$ va en el numerador.' },
        { value: -m, label: 'Orden de resta distinto', explain: 'El signo salió al revés: restaste en un orden arriba y en otro abajo. Usa $(y_2 - y_1)/(x_2 - x_1)$, ambos desde el mismo punto.' },
      ],
    });
  }
  if (level === 3) {
    const rise = rnd(3, 12), run = pick([40, 50, 60, 80, 100, 120, 150]);
    const ans = (rise / run) * 100;
    return mk('slope', level, {
      title: 'Pendiente de una calle',
      statement: `Una calle sube ${rise} m por cada ${run} m recorridos en horizontal. ¿Cuál es su pendiente expresada en **porcentaje**?`,
      data: [`Subida: ${rise} m`, `Avance horizontal: ${run} m`],
      kind: 'numeric', answer: ans, unit: '%',
      hints: ['La pendiente es $\\Delta y / \\Delta x$.', 'Para expresarla en %, multiplica por 100.'],
      steps: [`$m = \\dfrac{${rise}}{${run}} = ${tex(rise / run, 4)}$`, `En porcentaje: $${tex(rise / run, 4)} \\times 100 = ${tex(ans, 2)}\\%$`],
      mistakes: [
        { value: rise / run, label: 'Faltó el ×100', explain: 'Ese es el valor decimal de la pendiente. En porcentaje se multiplica por **100**.' },
        { value: (run / rise) * 100, label: 'Cociente invertido', explain: 'La pendiente es subida **dividida por** avance, no al revés.' },
      ],
    });
  }
  if (level === 4) {
    const m = pick([0.25, 0.4, 0.5, 0.75, 1.2, 1.5, 2, 3]);
    const ans = atanDeg(m);
    return mk('slope', level, {
      title: 'Ángulo de inclinación',
      statement: `Una rampa tiene pendiente $m = ${tex(m)}$. ¿Qué **ángulo** forma con el suelo?`,
      data: [`$m = ${tex(m)}$`],
      kind: 'numeric', answer: ans, unit: '°', answerHint: 'Responde en grados, con 1 decimal.',
      hints: ['La pendiente es $\\dfrac{\\Delta y}{\\Delta x}$ = opuesto / adyacente respecto del ángulo con el suelo… ¿qué razón es esa?', 'Si $\\tan\\theta = m$, entonces $\\theta = \\tan^{-1}(m)$.'],
      steps: [`En el triángulo de la rampa, $\\Delta y$ es el cateto **opuesto** y $\\Delta x$ el **adyacente** al ángulo con el suelo.`, `Por eso $\\tan\\theta = m = ${tex(m)}$.`, `$\\theta = \\tan^{-1}(${tex(m)}) \\approx ${tex(ans, 2)}°$`],
      mistakes: [
        { value: Math.atan(m), label: 'Resultado en radianes', explain: 'Ese número está en **radianes**. Usa la calculadora en modo **DEG** (o multiplica por $180/\\pi$).' },
        { value: tanDeg(m), label: 'tan en vez de tan⁻¹', explain: 'Calculaste $\\tan(m)$. Si conoces el valor de la tangente y buscas el **ángulo**, se usa la **inversa** $\\tan^{-1}$.' },
        { value: asinDeg(Math.min(1, m)), label: 'Usaste sen⁻¹', explain: 'La pendiente es opuesto/**adyacente**: corresponde a la **tangente**, no al seno.' },
      ],
    });
  }
  const t = acute(15, 60), x = rnd(4, 15);
  const ans = x * tanDeg(t);
  return mk('slope', 5, {
    title: 'Recta con ángulo dado',
    statement: `Una recta pasa por el origen y forma un ángulo de $${t}°$ con el eje X positivo. ¿Cuál es el valor de $y$ cuando $x = ${x}$?`,
    data: [`$\\theta = ${t}°$`, `$x = ${x}$`],
    kind: 'numeric', answer: ans,
    hints: ['La pendiente de una recta es la **tangente** de su ángulo de inclinación: $m = \\tan\\theta$.', 'Recta por el origen: $y = m\\,x$.'],
    steps: [`$m = \\tan ${t}° \\approx ${tex(tanDeg(t), 4)}$`, `$y = m\\,x = ${tex(tanDeg(t), 4)} \\cdot ${x} \\approx ${tex(ans, 2)}$`],
    mistakes: [
      { value: x * sinDeg(t), label: 'Usaste seno', explain: 'La pendiente es $\\Delta y/\\Delta x$ = opuesto/**adyacente** → es la **tangente**, no el seno.' },
      { value: x * cosDeg(t), label: 'Usaste coseno', explain: 'El coseno relaciona adyacente e hipotenusa. La pendiente es la **tangente**.' },
      RAD_MISTAKE(x * Math.tan(t)),
    ],
  });
}

// ======================================================
// ÁNGULOS
// ======================================================
function genAngles(level: Level): Problem {
  if (level === 1) {
    const kinds = [
      { n: 'Agudo', v: () => rnd(5, 85) },
      { n: 'Recto', v: () => 90 },
      { n: 'Obtuso', v: () => rnd(95, 175) },
      { n: 'Llano', v: () => 180 },
      { n: 'Completo', v: () => 360 },
    ];
    const k = pick(kinds);
    const v = k.v();
    const { choices, answer, choiceExplain } = shuffleChoices(k.n, kinds.filter((x) => x !== k).map((x) => x.n), kinds.filter((x) => x !== k).map(() => 'Agudo: menos de 90°. Recto: 90°. Obtuso: entre 90° y 180°. Llano: 180°. Completo: 360°.'));
    return mk('angles', level, {
      title: 'Clasificar un ángulo', statement: `¿Cómo se clasifica un ángulo de $${v}°$?`, data: [`$${v}°$`],
      kind: 'choice', choices, answer, choiceExplain,
      hints: ['Compáralo con 90° (una esquina de un cuadrado) y con 180° (media vuelta).'],
      steps: [`$${v}°$ → **${k.n}**.`],
    });
  }
  if (level === 2) {
    const d = pick([15, 20, 30, 36, 40, 45, 60, 72, 75, 90, 120, 135, 150, 210, 225, 240, 270, 300, 315]);
    const ans = (d * Math.PI) / 180;
    return mk('angles', level, {
      title: 'Grados → radianes', statement: `Convierte $${d}°$ a radianes.`, data: [`$${d}°$`],
      kind: 'numeric', answer: ans, unit: 'rad', answerHint: 'Puedes escribir la fracción de π (ej: π/6) o un decimal con 3 decimales.',
      hints: ['Media vuelta mide $180°$ y también $\\pi$ radianes.', 'Multiplica por $\\dfrac{\\pi}{180°}$.'],
      steps: [`$${d}° \\cdot \\dfrac{\\pi}{180°} = ${radTex(d)} \\approx ${tex(ans, 4)}$ rad`],
      mistakes: [{ value: (d * 180) / Math.PI, label: 'Factor invertido', explain: 'Multiplicaste por $180/\\pi$, que convierte de radianes a grados. Para ir **a radianes**: $\\times\\,\\pi/180$.' }],
    });
  }
  if (level === 3) {
    const d = pick([30, 45, 60, 90, 120, 135, 150, 180, 240, 270, 300, 330]);
    return mk('angles', level, {
      title: 'Radianes → grados', statement: `Un ángulo mide $${radTex(d)}$ radianes. ¿Cuántos grados son?`, data: [`$${radTex(d)}$ rad`],
      kind: 'numeric', answer: d, unit: '°',
      hints: ['Reemplaza $\\pi$ por $180°$.'],
      steps: [`$${radTex(d)} \\cdot \\dfrac{180°}{\\pi} = ${d}°$`],
      mistakes: [{ value: (d * Math.PI) / 180, label: 'Dejaste el valor en radianes', explain: 'Ese número es el ángulo en radianes (decimal). Para pasarlo a grados multiplica por $180/\\pi$.' }],
    });
  }
  if (level === 4) {
    const type = pick(['complemento', 'suplemento'] as const);
    const v = type === 'complemento' ? rnd(5, 85) : rnd(10, 170);
    const ans = (type === 'complemento' ? 90 : 180) - v;
    return mk('angles', level, {
      title: type === 'complemento' ? 'Ángulo complementario' : 'Ángulo suplementario',
      statement: `En un triángulo rectángulo los ángulos agudos son complementarios. Calcula el **${type}** de $${v}°$.`,
      data: [`$${v}°$`], kind: 'numeric', answer: ans, unit: '°',
      hints: ['Complementarios suman **90°**; suplementarios suman **180°**.'],
      steps: [`$${type === 'complemento' ? 90 : 180}° - ${v}° = ${ans}°$`],
      mistakes: [{ value: (type === 'complemento' ? 180 : 90) - v, label: 'Complemento ↔ suplemento', explain: 'Complemento → completa **90°**. Suplemento → completa **180°**.' }],
    });
  }
  const h = rnd(1, 11), m = pick([0, 30]);
  const raw = Math.abs(30 * h - 5.5 * m);
  const ans = Math.min(raw, 360 - raw);
  return mk('angles', 5, {
    title: 'El ángulo del reloj',
    statement: `¿Qué ángulo (el menor) forman las agujas de un reloj a las ${h}:${m === 0 ? '00' : '30'}?`,
    data: [`Hora: ${h}:${m === 0 ? '00' : '30'}`], kind: 'numeric', answer: ans, unit: '°',
    hints: ['El reloj completo son 360° en 12 horas → cada hora son **30°**; cada minuto del minutero son **6°**.', 'Ojo: el horario también avanza: **0,5° por minuto**.'],
    steps: [`Minutero: $${m} \\cdot 6° = ${6 * m}°$`, `Horario: $${h} \\cdot 30° + ${m} \\cdot 0{,}5° = ${tex(30 * h + 0.5 * m, 1)}°$`, `Diferencia: $${tex(raw, 1)}°$ → el menor: $${tex(ans, 1)}°$`],
    mistakes: [
      { value: Math.min(Math.abs(30 * h - 6 * m), 360 - Math.abs(30 * h - 6 * m)), label: 'El horario no se queda quieto', explain: 'A las y media el horario ya avanzó medio tramo (15°) hacia la hora siguiente.' },
      { value: 360 - ans, label: 'Tomaste el ángulo mayor', explain: 'Las agujas forman dos ángulos que suman 360°; se pide el **menor**.' },
    ],
  });
}

// ======================================================
// TRIÁNGULOS
// ======================================================
function genTriangles(level: Level): Problem {
  if (level === 1) {
    const t = pick(['eq', 'iso', 'esc'] as const);
    const s = rnd(3, 9);
    const sides = t === 'eq' ? [s, s, s] : t === 'iso' ? [s, s, rnd(2, 2 * s - 1)] : [s, s + 1, s + 3];
    if (t === 'iso' && sides[2] === s) sides[2] = s + 1;
    const names = ['Equilátero', 'Isósceles', 'Escaleno'];
    const idx = { eq: 0, iso: 1, esc: 2 }[t];
    const { choices, answer, choiceExplain } = shuffleChoices(names[idx], names.filter((_, i) => i !== idx), names.filter((_, i) => i !== idx).map(() => 'Equilátero: 3 lados iguales. Isósceles: exactamente 2 iguales. Escaleno: los 3 distintos.'));
    return mk('triangles', level, {
      title: 'Clasificar por lados', statement: `Un triángulo tiene lados ${sides.join(' cm, ')} cm. ¿Cómo se clasifica según sus lados?`, data: sides.map((x, i) => `Lado ${i + 1}: ${x} cm`),
      kind: 'choice', choices, answer, choiceExplain, hints: ['Cuenta cuántos lados son iguales.'], steps: [`Lados: ${sides.join(', ')} → **${names[idx]}**.`],
    });
  }
  if (level === 2) {
    const A = rnd(20, 100), B = rnd(15, 160 - A - 5);
    const ans = 180 - A - B;
    return mk('triangles', level, {
      title: 'El tercer ángulo', statement: `Dos ángulos de un triángulo miden $${A}°$ y $${B}°$. ¿Cuánto mide el tercero?`, data: [`$A = ${A}°$`, `$B = ${B}°$`],
      kind: 'numeric', answer: ans, unit: '°',
      hints: ['Los tres ángulos interiores de **cualquier** triángulo suman $180°$.'],
      steps: [`$C = 180° - ${A}° - ${B}° = ${ans}°$`],
      mistakes: [
        { value: 360 - A - B, label: 'Usaste 360°', explain: '360° es la suma de los ángulos de un **cuadrilátero**. En un triángulo suman **180°**.' },
        { value: 90 - A - B, label: 'Usaste 90°', explain: 'Los ángulos de un triángulo suman **180°**, no 90°.' },
      ],
    });
  }
  if (level === 3) {
    const b = rnd(4, 20), h = rnd(3, 15);
    const ans = (b * h) / 2;
    return mk('triangles', level, {
      title: 'Área de un triángulo', statement: `Una vela triangular tiene base ${b} m y altura ${h} m. ¿Cuál es su área?`, data: [`Base: ${b} m`, `Altura: ${h} m`],
      kind: 'numeric', answer: ans, unit: 'm²',
      hints: ['Un triángulo es **la mitad** de un rectángulo de la misma base y altura.'],
      steps: [`$A = \\dfrac{b\\cdot h}{2} = \\dfrac{${b}\\cdot ${h}}{2} = ${tex(ans)}$ m²`],
      mistakes: [
        { value: b * h, label: 'Faltó dividir por 2', explain: '$b \\cdot h$ es el área del **rectángulo**; el triángulo es la mitad.' },
        { value: (b + h) / 2, label: 'Sumaste en vez de multiplicar', explain: 'El área se obtiene **multiplicando** base por altura (y dividiendo por 2).' },
      ],
    });
  }
  if (level === 4) {
    const kind = pick(['acu', 'rect', 'obt'] as const);
    let s: number[];
    if (kind === 'rect') s = pick(TRIPLES).slice() as number[];
    else if (kind === 'acu') s = pick([[5, 6, 7], [6, 7, 8], [7, 8, 9], [4, 5, 6], [8, 9, 10]]);
    else s = pick([[3, 5, 7], [4, 6, 9], [5, 7, 11], [2, 4, 5], [6, 8, 12]]);
    const [a, b, c] = s;
    const names = ['Acutángulo', 'Rectángulo', 'Obtusángulo'];
    const idx = { acu: 0, rect: 1, obt: 2 }[kind];
    const { choices, answer, choiceExplain } = shuffleChoices(names[idx], names.filter((_, i) => i !== idx), names.filter((_, i) => i !== idx).map(() => `Compara $c^2 = ${c * c}$ (lado mayor) con $a^2 + b^2 = ${a * a + b * b}$.`));
    return mk('triangles', level, {
      title: 'Clasificar por ángulos (sin medir)', statement: `Un triángulo tiene lados $${a}$, $${b}$ y $${c}$. Sin transportador, ¿qué tipo de triángulo es según sus ángulos?`,
      data: [`$a = ${a}$`, `$b = ${b}$`, `$c = ${c}$ (mayor)`], kind: 'choice', choices, answer, choiceExplain,
      hints: ['Usa Pitágoras como "detector": compara el cuadrado del lado mayor con la suma de los cuadrados de los otros dos.', '$c^2 = a^2+b^2$ → recto; $c^2 < a^2+b^2$ → agudo; $c^2 > a^2+b^2$ → obtuso.'],
      steps: [`$c^2 = ${c * c}$`, `$a^2 + b^2 = ${a * a} + ${b * b} = ${a * a + b * b}$`, `${c * c === a * a + b * b ? 'Iguales' : c * c < a * a + b * b ? '$c^2 <  a^2+b^2$' : '$c^2 > a^2+b^2$'} → **${names[idx]}**.`],
    });
  }
  const [a, b, c] = pick([[5, 6, 7], [7, 8, 9], [6, 9, 11], [4, 7, 9], [8, 10, 13]]);
  const s = (a + b + c) / 2;
  const ans = Math.sqrt(s * (s - a) * (s - b) * (s - c));
  return mk('triangles', 5, {
    title: 'Área sin altura (Herón)', statement: `Un terreno triangular mide ${a} m, ${b} m y ${c} m. No conocemos la altura. ¿Cuál es su área?`,
    data: [`$a = ${a}$ m`, `$b = ${b}$ m`, `$c = ${c}$ m`], kind: 'numeric', answer: ans, unit: 'm²',
    hints: ['Fórmula de Herón: $A = \\sqrt{s(s-a)(s-b)(s-c)}$ con $s$ el **semiperímetro**.', `$s = \\dfrac{a+b+c}{2} = ${tex(s)}$`],
    steps: [`$s = \\dfrac{${a}+${b}+${c}}{2} = ${tex(s)}$`, `$A = \\sqrt{${tex(s)}\\cdot${tex(s - a)}\\cdot${tex(s - b)}\\cdot${tex(s - c)}} = \\sqrt{${tex(s * (s - a) * (s - b) * (s - c))}} \\approx ${tex(ans)}$ m²`],
    mistakes: [
      { value: (a * b) / 2, label: 'Usaste un lado como altura', explain: '$\\dfrac{b\\cdot h}{2}$ necesita la **altura** (perpendicular a la base), no otro lado. Sin altura, usa Herón.' },
      { value: Math.sqrt(2 * s * (2 * s - a) * (2 * s - b) * (2 * s - c)), label: 'Usaste el perímetro', explain: 'En Herón, $s$ es el **semi**perímetro: $(a+b+c)/2$.' },
    ],
  });
}

// ======================================================
// TRIÁNGULO RECTÁNGULO (identificar lados)
// ======================================================
function genRight(level: Level): Problem {
  if (level >= 2) {
    const t = rnd(10, 80);
    return mk('right', 2, {
      title: 'El otro ángulo agudo', statement: `En un triángulo rectángulo uno de los ángulos agudos mide $${t}°$. ¿Cuánto mide el otro ángulo agudo?`,
      data: [`$\\theta = ${t}°$`, 'Ángulo recto: $90°$'], kind: 'numeric', answer: 90 - t, unit: '°',
      hints: ['Los tres ángulos suman $180°$, y uno ya es de $90°$.'],
      steps: [`$180° - 90° - ${t}° = ${90 - t}°$`],
      mistakes: [{ value: 180 - t, label: 'Olvidaste el ángulo recto', explain: 'Restaste solo $\\theta$ de 180°. El ángulo recto también cuenta: quedan $90° - \\theta$.' }],
    });
  }
  const [p, q, r] = pick(TRIPLES.slice(0, 4));
  const thetaAt = pick(['A', 'B'] as const);
  // a = vertical (BC), b = horizontal (AC)
  const labels = { a: String(p), b: String(q), c: String(r) };
  const target = pick(['a', 'b', 'c'] as const);
  const role = (s: 'a' | 'b' | 'c') => (s === 'c' ? 'Hipotenusa' : (s === 'a') === (thetaAt === 'A') ? 'Cateto opuesto' : 'Cateto adyacente');
  const correct = role(target);
  const all = ['Cateto opuesto', 'Cateto adyacente', 'Hipotenusa'];
  const wrong = all.filter((x) => x !== correct);
  const { choices, answer, choiceExplain } = shuffleChoices(correct, wrong, wrong.map((w) =>
    w === 'Hipotenusa' ? 'La hipotenusa es siempre el lado **frente al ángulo recto** (el más largo). Este no lo es.'
      : w === 'Cateto opuesto' ? 'El opuesto **no toca** a θ: está enfrente. Este lado sí toca el vértice de θ.'
        : 'El adyacente **toca** el vértice de θ (y no es la hipotenusa). Este lado no lo toca.'));
  return mk('right', 1, {
    title: 'Identificar lados respecto de θ',
    statement: `En la figura, respecto del ángulo $\\theta$, ¿qué es el lado que mide **${labels[target]}**?`,
    data: ['Fíjate en dónde está $\\theta$ en el dibujo.'],
    kind: 'choice', choices, answer, choiceExplain,
    figure: { type: 'right', thetaAt, labels, ratio: p / q },
    hints: ['Primero ubica el ángulo recto: el lado frente a él es la hipotenusa.', 'De los catetos, el que **toca** el vértice de θ es el adyacente; el que está **enfrente** es el opuesto.'],
    steps: [`El lado ${labels.c} está frente al ángulo recto → hipotenusa.`, `θ está en el vértice ${thetaAt === 'A' ? 'inferior izquierdo' : 'superior derecho'}.`, `El lado ${labels[target]} es el **${correct.toLowerCase()}**.`],
    concept: 'right',
  });
}

// ======================================================
// PITÁGORAS
// ======================================================
function genPythagoras(level: Level): Problem {
  if (level === 1) {
    const L = pick([['p', 'q', 'r'], ['m', 'n', 'k'], ['x', 'y', 'z'], ['u', 'v', 'w']]);
    const [l1, l2, h] = L;
    const correct = `$${l1}^2 + ${l2}^2 = ${h}^2$`;
    const wrongs = [`$${l1}^2 + ${h}^2 = ${l2}^2$`, `$${l1} + ${l2} = ${h}$`, `$${h}^2 + ${l2}^2 = ${l1}^2$`];
    const { choices, answer, choiceExplain } = shuffleChoices(correct, wrongs, ['Ahí la hipotenusa quedó sumando. La hipotenusa va **sola** del otro lado: es la mayor.', 'Pitágoras relaciona las **áreas** de los cuadrados: los lados van al cuadrado.', 'La hipotenusa es la que está sola: aquí quedó sumando.']);
    return mk('pythagoras', level, {
      title: 'Plantear Pitágoras', statement: `Un triángulo rectángulo tiene catetos $${l1}$ y $${l2}$ e hipotenusa $${h}$. ¿Qué relación es correcta?`,
      data: [`Catetos: $${l1}$, $${l2}$`, `Hipotenusa: $${h}$`], kind: 'choice', choices, answer, choiceExplain,
      hints: ['Los cuadrados construidos sobre los dos lados cortos juntos tienen la misma área que el cuadrado sobre el lado largo.'],
      steps: [`Suma de cuadrados de catetos = cuadrado de la hipotenusa: ${correct}.`],
    });
  }
  if (level === 2) {
    const nice = Math.random() < 0.6;
    const [a, b] = nice ? pick(TRIPLES) : [rnd(2, 12), rnd(2, 12)];
    const c = Math.hypot(a, b);
    return mk('pythagoras', level, {
      title: 'Encontrar la hipotenusa', statement: `Los catetos de un triángulo rectángulo miden $${a}$ y $${b}$. ¿Cuánto mide la hipotenusa?`,
      data: [`$a = ${a}$`, `$b = ${b}$`], kind: 'numeric', answer: c, answerHint: 'Redondea a 2 decimales si no es exacta.',
      figure: { type: 'right', thetaAt: 'A', labels: { a: String(a), b: String(b), c: '?' }, ratio: a / b },
      hints: ['$c^2 = a^2 + b^2$', 'Después de sumar los cuadrados, saca la **raíz**.'],
      steps: [`$c^2 = ${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${a * a + b * b}$`, `$c = \\sqrt{${a * a + b * b}} \\approx ${tex(c, 3)}$`],
      mistakes: [
        { value: a + b, label: 'Sumaste los lados', explain: 'Pitágoras suma los **cuadrados**, no los lados: $c = \\sqrt{a^2+b^2} \\ne a + b$.' },
        { value: a * a + b * b, label: 'Faltó la raíz', explain: 'Ese valor es $c^2$. Te falta la **raíz cuadrada**.' },
        { value: Math.sqrt(Math.abs(b * b - a * a)), label: 'Restaste', explain: 'Para la **hipotenusa** se suman los cuadrados; se resta solo cuando buscas un **cateto**.' },
      ],
    });
  }
  if (level === 3) {
    const nice = Math.random() < 0.6;
    let a: number, c: number;
    if (nice) { const t = pick(TRIPLES); a = t[0]; c = t[2]; } else { c = rnd(8, 20); a = rnd(2, c - 2); }
    const b = Math.sqrt(c * c - a * a);
    return mk('pythagoras', level, {
      title: 'Encontrar un cateto', statement: `La hipotenusa de un triángulo rectángulo mide $${c}$ y un cateto mide $${a}$. ¿Cuánto mide el otro cateto?`,
      data: [`$c = ${c}$`, `$a = ${a}$`], kind: 'numeric', answer: b,
      figure: { type: 'right', thetaAt: 'A', labels: { a: String(a), b: '?', c: String(c) }, ratio: a / Math.max(1, b) },
      hints: ['Despeja: $b^2 = c^2 - a^2$.', 'La hipotenusa es la más larga, así que el cateto debe salir **menor** que ella.'],
      steps: [`$b^2 = c^2 - a^2 = ${c * c} - ${a * a} = ${c * c - a * a}$`, `$b = \\sqrt{${c * c - a * a}} \\approx ${tex(b, 3)}$`],
      mistakes: [
        { value: Math.hypot(a, c), label: 'Pitágoras al revés', explain: 'Sumaste $a^2 + c^2$ como si $c$ fuera un cateto. Si buscas un **cateto**, se **resta**: $b^2 = c^2 - a^2$. (Mira: tu resultado es mayor que la hipotenusa, ¡imposible!)' },
        { value: c - a, label: 'Restaste los lados', explain: 'Se restan los **cuadrados**, no los lados: $b = \\sqrt{c^2 - a^2}$.' },
        { value: c * c - a * a, label: 'Faltó la raíz', explain: 'Ese valor es $b^2$. Saca la **raíz cuadrada**.' },
      ],
    });
  }
  if (level === 4) {
    const L = rndDec(3, 8, 1), base = rndDec(0.8, L * 0.45, 1);
    const h = Math.sqrt(L * L - base * base);
    return mk('pythagoras', level, {
      title: 'La escalera', statement: `Una escalera de ${fmt(L)} m está apoyada en una pared. Su pie está a ${fmt(base)} m de la pared. ¿A qué altura toca la pared?`,
      data: [`Escalera (hipotenusa): ${fmt(L)} m`, `Distancia a la pared (cateto): ${fmt(base)} m`], kind: 'numeric', answer: h, unit: 'm',
      hints: ['Pared, suelo y escalera forman un triángulo rectángulo. ¿Cuál es la hipotenusa?', 'La escalera es la hipotenusa: $h^2 = L^2 - d^2$.'],
      steps: [`$h = \\sqrt{${tex(L)}^2 - ${tex(base)}^2} = \\sqrt{${tex(L * L)} - ${tex(base * base)}} \\approx ${tex(h)}$ m`],
      mistakes: [{ value: Math.hypot(L, base), label: 'Pitágoras al revés', explain: 'La escalera es la **hipotenusa** (frente al ángulo recto pared-suelo). Para la altura (cateto) se **resta**.' }, { value: L - base, label: 'Restaste los lados', explain: 'Se restan los **cuadrados**.' }],
    });
  }
  const d = pick([32, 40, 43, 50, 55, 65, 75]);
  const w = (d * 16) / Math.hypot(16, 9);
  return mk('pythagoras', 5, {
    title: 'Pantalla 16:9', statement: `Una TV de ${d} pulgadas (diagonal) tiene proporción 16:9 (ancho:alto). ¿Cuánto mide su **ancho** en pulgadas?`,
    data: [`Diagonal: ${d}"`, 'Ancho : alto = 16 : 9'], kind: 'numeric', answer: w, unit: 'in',
    hints: ['Escribe ancho $= 16k$ y alto $= 9k$.', '$(16k)^2 + (9k)^2 = d^2$ → despeja $k$.'],
    steps: [`$(16k)^2 + (9k)^2 = ${d}^2 \\Rightarrow 337k^2 = ${d * d}$`, `$k = \\dfrac{${d}}{\\sqrt{337}} \\approx ${tex(d / Math.sqrt(337), 4)}$`, `Ancho $= 16k \\approx ${tex(w)}$"`],
    mistakes: [{ value: (d * 16) / 25, label: 'Proporción sobre la suma', explain: 'La diagonal no se reparte como 16+9. Los lados se combinan con **Pitágoras**: $\\sqrt{16^2+9^2} = \\sqrt{337}$.' }],
  });
}

// ======================================================
// SENO / COSENO / TANGENTE
// ======================================================
type Fn = 'sin' | 'cos' | 'tan';
const FN_ES: Record<Fn, string> = { sin: 'seno', cos: 'coseno', tan: 'tangente' };
const f = (fn: Fn, d: number) => (fn === 'sin' ? sinDeg(d) : fn === 'cos' ? cosDeg(d) : tanDeg(d));
const af = (fn: Fn, x: number) => (fn === 'sin' ? asinDeg(x) : fn === 'cos' ? acosDeg(x) : atanDeg(x));

function ratioRecognition(fn: Fn): Problem {
  const [a, b, c] = pick(TRIPLES.slice(0, 4)); // a vertical (opuesto a θ en A), b horizontal
  const opts: Record<string, string> = { sin: `$\\dfrac{${a}}{${c}}$`, cos: `$\\dfrac{${b}}{${c}}$`, tan: `$\\dfrac{${a}}{${b}}$`, inv: `$\\dfrac{${c}}{${a}}$` };
  const correct = opts[fn];
  const others = (['sin', 'cos', 'tan', 'inv'] as const).filter((k) => k !== fn);
  const exp: Record<string, string> = {
    sin: 'Eso es **opuesto / hipotenusa**: el **seno**.',
    cos: 'Eso es **adyacente / hipotenusa**: el **coseno**. ¿Confundiste opuesto con adyacente?',
    tan: 'Eso es **opuesto / adyacente**: la **tangente**. No usa la hipotenusa.',
    inv: 'Está invertido: la hipotenusa quedó arriba. Seno y coseno son siempre **≤ 1** porque la hipotenusa va **abajo**.',
  };
  const { choices, answer, choiceExplain } = shuffleChoices(correct, others.map((k) => opts[k]), others.map((k) => exp[k]));
  const def = { sin: '\\dfrac{\\text{opuesto}}{\\text{hipotenusa}}', cos: '\\dfrac{\\text{adyacente}}{\\text{hipotenusa}}', tan: '\\dfrac{\\text{opuesto}}{\\text{adyacente}}' }[fn];
  return mk(fn, 1, {
    title: `Reconocer el ${FN_ES[fn]}`, statement: `En el triángulo de la figura, ¿cuánto vale $\\${fn}\\theta$?`, data: ['Respecto de θ: identifica opuesto, adyacente e hipotenusa.'],
    kind: 'choice', choices, answer, choiceExplain,
    figure: { type: 'right', thetaAt: 'A', labels: { a: String(a), b: String(b), c: String(c) }, ratio: a / b },
    hints: [`$\\${fn}\\theta = ${def}$`, `Respecto de θ: opuesto = ${a}, adyacente = ${b}, hipotenusa = ${c}.`],
    steps: [`Opuesto a θ: ${a}. Adyacente: ${b}. Hipotenusa: ${c}.`, `$\\${fn}\\theta = ${def} = ${correct.replace(/\$/g, '')}$`],
  });
}

function ratioSide(fn: Fn, level: Level, applied: boolean): Problem {
  const t = acute();
  const v = fn === 'tan' ? rnd(4, 20) : rnd(5, 30);
  const val = f(fn, t);
  // fn=sin: conocido hip, busca opuesto | cos: hip → adyacente | tan: adyacente → opuesto
  const known = fn === 'tan' ? 'adyacente' : 'hipotenusa';
  const want = fn === 'cos' ? 'adyacente' : 'opuesto';
  // nivel 3 (y la mitad de los de nivel 4): la incógnita queda en el denominador
  const findInverse = level === 3 || (level === 4 && Math.random() < 0.5);
  let ans: number, statement: string, steps: string[], mistakes: Mistake[], hints: string[];
  const ctx = applied ? APPLIED[fn](t, v, findInverse) : null;
  if (!findInverse) {
    ans = v * val;
    statement = ctx?.statement ?? '';
    if (!ctx) statement = `En un triángulo rectángulo, $\\theta = ${t}°$ y ${known === 'hipotenusa' ? 'la hipotenusa' : 'el cateto adyacente a θ'} mide $${v}$. Calcula el cateto **${want}** a θ.`;
    steps = [
      `Datos: $\\theta = ${t}°$, ${known} $= ${v}$. Incógnita: ${want}.`,
      `${want} y ${known} se relacionan con el **${FN_ES[fn]}**: $\\${fn}\\theta = \\dfrac{\\text{${want}}}{\\text{${known}}}$`,
      `Despejar: $\\text{${want}} = ${v} \\cdot \\${fn} ${t}°$`,
      `$= ${v} \\cdot ${tex(val, 4)} \\approx ${tex(ans, 2)}$`,
    ];
    hints = [`¿Qué lados intervienen? Conoces la **${known}** y buscas el **${want}**.`, `Esa pareja de lados corresponde al **${FN_ES[fn]}**: $\\${fn}\\theta = \\dfrac{\\text{${want}}}{\\text{${known}}}$.`];
    mistakes = [
      { value: v * (fn === 'sin' ? cosDeg(t) : fn === 'cos' ? sinDeg(t) : 1 / tanDeg(t)), label: fn === 'tan' ? 'Tangente invertida' : 'Seno ↔ coseno', explain: fn === 'tan' ? 'Usaste adyacente/opuesto. La tangente es **opuesto / adyacente**.' : `Confundiste el cateto **opuesto** con el **adyacente** (o el seno con el coseno). ${fn === 'sin' ? 'El seno usa el lado que está **enfrente** de θ.' : 'El coseno usa el lado que **toca** a θ.'}` },
      { value: v / val, label: 'Despeje incorrecto', explain: `Dividiste en vez de multiplicar. Si $\\${fn}\\theta = x/${v}$, entonces $x = ${v} \\cdot \\${fn}\\theta$.` },
      RAD_MISTAKE(v * (fn === 'sin' ? Math.sin(t) : fn === 'cos' ? Math.cos(t) : Math.tan(t))),
      ...(fn !== 'tan' ? [{ value: v * tanDeg(t), label: 'Usaste tangente', explain: 'La tangente no usa la hipotenusa. Con hipotenusa conocida se usa **seno** u **coseno**.' }] : [{ value: v * sinDeg(t), label: 'Usaste seno', explain: 'No conoces la hipotenusa: con **opuesto** y **adyacente** se usa la **tangente**.' }]),
    ];
  } else {
    // incógnita en el denominador: sin/cos → hipotenusa; tan → adyacente
    const knownSide = fn === 'cos' ? 'adyacente' : 'opuesto';
    const unknownSide = fn === 'tan' ? 'adyacente' : 'hipotenusa';
    ans = v / val;
    statement = ctx?.statement ?? `En un triángulo rectángulo, $\\theta = ${t}°$ y el cateto ${knownSide} a θ mide $${v}$. Calcula ${unknownSide === 'hipotenusa' ? 'la **hipotenusa**' : 'el cateto **adyacente**'}.`;
    steps = [
      `Datos: $\\theta = ${t}°$, ${knownSide} $= ${v}$. Incógnita: ${unknownSide}.`,
      `Razón: $\\${fn}\\theta = \\dfrac{\\text{${knownSide}}}{\\text{${unknownSide}}}$`,
      `La incógnita está en el **denominador**: $\\text{${unknownSide}} = \\dfrac{${v}}{\\${fn} ${t}°}$`,
      `$= \\dfrac{${v}}{${tex(val, 4)}} \\approx ${tex(ans, 2)}$`,
    ];
    hints = [`Conoces el ${knownSide} y buscas ${unknownSide === 'hipotenusa' ? 'la hipotenusa' : 'el adyacente'} → **${FN_ES[fn]}**.`, 'Cuando la incógnita está abajo en la fracción, al despejar se **divide**.'];
    mistakes = [
      { value: v * val, label: 'Despeje incorrecto', explain: `Multiplicaste, pero la incógnita está en el **denominador**: $x = \\dfrac{${v}}{\\${fn}\\theta}$. Pista: ${unknownSide === 'hipotenusa' ? 'la hipotenusa debe salir **mayor** que el cateto' : 'revisa si el resultado tiene sentido'}.` },
      { value: v / (fn === 'sin' ? cosDeg(t) : fn === 'cos' ? sinDeg(t) : 1 / tanDeg(t)), label: 'Razón equivocada', explain: fn === 'tan' ? 'Invertiste la tangente: es **opuesto/adyacente**.' : 'Usaste la otra razón: revisa si el lado conocido es **opuesto** (seno) o **adyacente** (coseno) a θ.' },
      RAD_MISTAKE(v / (fn === 'sin' ? Math.sin(t) : fn === 'cos' ? Math.cos(t) : Math.tan(t))),
    ];
  }
  const fig: Figure = {
    type: 'right', thetaAt: 'A', ratio: tanDeg(t),
    labels: fn === 'sin' ? (findInverse ? { a: String(v), c: '?' } : { a: '?', c: String(v) }) : fn === 'cos' ? (findInverse ? { b: String(v), c: '?' } : { b: '?', c: String(v) }) : findInverse ? { a: String(v), b: '?' } : { a: '?', b: String(v) },
    thetaLabel: `${t}°`,
  };
  return mk(fn, level, {
    title: ctx?.title ?? (findInverse ? `${FN_ES[fn][0].toUpperCase() + FN_ES[fn].slice(1)}: incógnita abajo` : `Usar el ${FN_ES[fn]}`),
    statement, data: ctx?.data ?? [`$\\theta = ${t}°$`, `Lado conocido: $${v}$`], kind: 'numeric', answer: ans, unit: ctx?.unit,
    answerHint: 'Redondea a 2 decimales. Calculadora en DEG.', figure: ctx ? undefined : fig, hints, steps, mistakes,
  });
}

// Contextos de aplicación para nivel 4
const APPLIED: Record<Fn, (t: number, v: number, inv: boolean) => { title: string; statement: string; data: string[]; unit: string }> = {
  sin: (t, v, inv) => inv
    ? { title: 'Rampa de acceso', statement: `Una rampa debe subir ${v} dm de altura con una inclinación de $${t}°$. ¿Qué **largo** (hipotenusa) debe tener?`, data: [`Altura: ${v} dm`, `Inclinación: $${t}°$`], unit: 'dm' }
    : { title: 'Cometa', statement: `Una cometa está sujeta con ${v} m de hilo tenso que forma $${t}°$ con el suelo. ¿A qué **altura** vuela?`, data: [`Hilo: ${v} m`, `Ángulo: $${t}°$`], unit: 'm' },
  cos: (t, v, inv) => inv
    ? { title: 'Cable tensor', statement: `Un cable va desde lo alto de una antena hasta el suelo, formando $${t}°$ con el suelo. Su anclaje está a ${v} m de la base de la antena. ¿Cuánto mide el cable?`, data: [`Distancia al anclaje: ${v} m`, `Ángulo con el suelo: $${t}°$`], unit: 'm' }
    : { title: 'Escalera apoyada', statement: `Una escalera de ${v} dm forma $${t}°$ con el suelo. ¿A qué **distancia de la pared** está su pie?`, data: [`Escalera: ${v} dm`, `Ángulo con el suelo: $${t}°$`], unit: 'dm' },
  tan: (t, v, inv) => inv
    ? { title: 'Distancia a la torre', statement: `Una torre mide ${v} m. Desde un punto en el suelo se ve su punta con un ángulo de elevación de $${t}°$. ¿A qué distancia de la torre está el observador?`, data: [`Altura: ${v} m`, `Elevación: $${t}°$`], unit: 'm' }
    : { title: 'Sombra de un edificio', statement: `Un edificio proyecta una sombra de ${v} m. El ángulo de elevación del Sol es de $${t}°$. ¿Cuál es aproximadamente la **altura** del edificio?`, data: [`Sombra: ${v} m`, `Elevación del Sol: $${t}°$`], unit: 'm' },
};

function ratioAngle(fn: Fn): Problem {
  let num: number, den: number;
  if (fn === 'tan') { num = rnd(2, 15); den = rnd(2, 15); while (num === den) den = rnd(2, 15); } else { den = rnd(6, 20); num = rnd(2, den - 1); }
  const ratio = num / den;
  const ans = af(fn, ratio);
  const sides = { sin: ['opuesto', 'hipotenusa'], cos: ['adyacente', 'hipotenusa'], tan: ['opuesto', 'adyacente'] }[fn];
  const ms: Mistake[] = [
    { value: (af(fn, ratio) * Math.PI) / 180, label: 'Resultado en radianes', explain: 'El ángulo salió en **radianes**. Pon la calculadora en **DEG**.' },
    { value: f(fn, ratio), label: 'Función directa en vez de inversa', explain: `Calculaste $\\${fn}(${tex(ratio, 3)})$. Si conoces la razón y buscas el **ángulo**, usa la **inversa**: $\\${fn}^{-1}$.` },
  ];
  if (fn !== 'tan') ms.push({ value: af(fn === 'sin' ? 'cos' : 'sin', ratio), label: 'Seno ↔ coseno', explain: `Usaste la inversa equivocada: ${fn === 'sin' ? 'opuesto/hipotenusa → **seno**' : 'adyacente/hipotenusa → **coseno**'}.` });
  else ms.push({ value: atanDeg(1 / ratio), label: 'Tangente invertida', explain: 'Calculaste el **otro** ángulo agudo: la tangente de θ es **opuesto/adyacente** respecto de θ.' });
  return mk(fn, 5, {
    title: 'Encontrar el ángulo',
    statement: `En un triángulo rectángulo, el cateto ${sides[0]} a θ mide $${num}$ y ${sides[1] === 'hipotenusa' ? 'la hipotenusa' : 'el cateto adyacente'} mide $${den}$. ¿Cuánto mide θ?`,
    data: [`${sides[0]}: $${num}$`, `${sides[1]}: $${den}$`], kind: 'numeric', answer: ans, unit: '°', answerHint: 'En grados, con 1 decimal.',
    hints: [`Con ${sides[0]} y ${sides[1]} se usa el **${FN_ES[fn]}**.`, `Buscas el ángulo: $\\theta = \\${fn}^{-1}\\left(\\dfrac{${num}}{${den}}\\right)$.`],
    steps: [`$\\${fn}\\theta = \\dfrac{${num}}{${den}} \\approx ${tex(ratio, 4)}$`, `$\\theta = \\${fn}^{-1}(${tex(ratio, 4)}) \\approx ${tex(ans, 2)}°$`, `Comprobación: $\\${fn}(${tex(ans, 2)}°) \\approx ${tex(f(fn, ans), 4)}$ ✔`],
    mistakes: ms,
  });
}

function genRatio(fn: Fn) {
  return (level: Level): Problem => {
    if (level === 1) return ratioRecognition(fn);
    if (level === 2) return ratioSide(fn, 2, false);
    if (level === 3) return ratioSide(fn, 3, false);
    if (level === 4) return ratioSide(fn, 4, true);
    return ratioAngle(fn);
  };
}

// ======================================================
// SOH CAH TOA (elegir razón)
// ======================================================
function genSoh(level: Level): Problem {
  if (level >= 3) return genSolve(level);
  const pairs: { k: string; w: string; fn: Fn }[] = [
    { k: 'hipotenusa', w: 'cateto opuesto', fn: 'sin' }, { k: 'cateto opuesto', w: 'hipotenusa', fn: 'sin' },
    { k: 'hipotenusa', w: 'cateto adyacente', fn: 'cos' }, { k: 'cateto adyacente', w: 'hipotenusa', fn: 'cos' },
    { k: 'cateto adyacente', w: 'cateto opuesto', fn: 'tan' }, { k: 'cateto opuesto', w: 'cateto adyacente', fn: 'tan' },
  ];
  const p = pick(pairs);
  const names: Record<Fn, string> = { sin: 'Seno (SOH)', cos: 'Coseno (CAH)', tan: 'Tangente (TOA)' };
  const exp: Record<Fn, string> = {
    sin: 'El **seno** relaciona **O**puesto e **H**ipotenusa.',
    cos: 'El **coseno** relaciona **A**dyacente e **H**ipotenusa.',
    tan: 'La **tangente** relaciona **O**puesto y **A**dyacente (sin hipotenusa).',
  };
  const others = (['sin', 'cos', 'tan'] as Fn[]).filter((x) => x !== p.fn);
  const { choices, answer, choiceExplain } = shuffleChoices(names[p.fn], others.map((o) => names[o]), others.map((o) => exp[o] + ' Pero aquí intervienen el ' + p.k + ' y el ' + p.w + '.'));
  return mk('soh', level, {
    title: '¿Qué razón uso?', statement: `Conoces θ y el **${p.k}**. Quieres calcular el **${p.w}**. ¿Qué razón trigonométrica debes usar?`, data: [`Conocido: ${p.k}`, `Buscado: ${p.w}`],
    kind: 'choice', choices, answer, choiceExplain,
    hints: ['Escribe las iniciales de los dos lados involucrados (O, A, H).', 'Busca la sílaba que contenga esas dos letras: S**OH**, C**AH**, T**OA**.'],
    steps: [`Lados: ${p.k} y ${p.w}.`, exp[p.fn], `→ **${names[p.fn]}**.`],
  });
}

// ======================================================
// RESOLVER TRIÁNGULOS
// ======================================================
function genSolve(level: Level): Problem {
  if (level <= 2) {
    const fn = pick(['sin', 'cos'] as const);
    const p = ratioSide(fn, 2, false);
    return { ...p, category: 'solve', concept: fn };
  }
  if (level === 3) {
    const a = rnd(3, 15), b = rnd(3, 15);
    const ans = atanDeg(a / b);
    return mk('solve', 3, {
      title: 'Ángulo desde dos catetos', statement: `Los catetos de un triángulo rectángulo miden $a = ${a}$ (opuesto a $A$) y $b = ${b}$ (adyacente a $A$). Calcula el ángulo $A$.`,
      data: [`$a = ${a}$`, `$b = ${b}$`], kind: 'numeric', answer: ans, unit: '°', answerHint: 'En grados, con 1 decimal.',
      figure: { type: 'right', thetaAt: 'A', thetaLabel: 'A', labels: { a: String(a), b: String(b) }, ratio: a / b },
      hints: ['Conoces opuesto y adyacente → **tangente**.', '$A = \\tan^{-1}(a/b)$'],
      steps: [`$\\tan A = \\dfrac{${a}}{${b}} \\approx ${tex(a / b, 4)}$`, `$A = \\tan^{-1}(${tex(a / b, 4)}) \\approx ${tex(ans, 2)}°$`, `Control: $B = 90° - A \\approx ${tex(90 - ans, 2)}°$`],
      mistakes: [
        { value: atanDeg(b / a), label: 'Tangente invertida', explain: 'Calculaste el ángulo $B$: usaste adyacente/opuesto. Respecto de $A$, la tangente es $a/b$.' },
        { value: Math.atan(a / b), label: 'Resultado en radianes', explain: 'Cambia la calculadora a **DEG**.' },
      ],
    });
  }
  if (level === 4) {
    // El ejemplo del enunciado: sombra y ángulo de elevación
    const s = rnd(8, 30), t = acute(20, 65);
    const ans = s * tanDeg(t);
    return mk('solve', 4, {
      title: 'Altura por la sombra',
      statement: `Un edificio proyecta una sombra de ${s} metros. El ángulo de elevación del Sol es de $${t}°$. ¿Cuál es aproximadamente la altura del edificio?`,
      data: [`Sombra (cateto adyacente al ángulo): ${s} m`, `Ángulo de elevación: $${t}°$`], kind: 'numeric', answer: ans, unit: 'm',
      hints: ['Dibuja: edificio vertical, sombra horizontal, rayo de sol como hipotenusa. El ángulo está en la punta de la sombra.', 'Conoces el **adyacente** (sombra), buscas el **opuesto** (altura) → **tangente**.'],
      steps: [`Lados: altura = opuesto, sombra = adyacente → **TOA**.`, `$\\tan ${t}° = \\dfrac{h}{${s}}$`, `$h = ${s}\\cdot\\tan ${t}° = ${s}\\cdot ${tex(tanDeg(t), 4)} \\approx ${tex(ans, 2)}$ m`],
      mistakes: [
        { value: s * sinDeg(t), label: 'Usaste seno', explain: 'El seno necesita la **hipotenusa** (el rayo de sol), que no conoces. Con sombra (adyacente) y altura (opuesto) se usa **tangente**.' },
        { value: s / tanDeg(t), label: 'Despeje incorrecto', explain: '$h$ está en el **numerador**: se multiplica, no se divide.' },
        { value: s * cosDeg(t), label: 'Usaste coseno', explain: 'El coseno relaciona adyacente e hipotenusa. Aquí buscas el opuesto → **tangente**.' },
        RAD_MISTAKE(s * Math.tan(t)),
      ],
      concept: 'tan',
    });
  }
  // nivel 5: dos ángulos de elevación
  const alpha = rnd(20, 35), beta = rnd(alpha + 10, 60), d = rnd(10, 50);
  const ta = tanDeg(alpha), tb = tanDeg(beta);
  const h = (d * ta * tb) / (tb - ta);
  return mk('solve', 5, {
    title: 'Dos miradas a la misma cima',
    statement: `Desde un punto P ves la cima de un cerro con un ángulo de elevación de $${alpha}°$. Avanzas ${d} m hacia el cerro y ahora lo ves con $${beta}°$. ¿Qué altura tiene el cerro sobre tus ojos?`,
    data: [`$\\alpha = ${alpha}°$`, `$\\beta = ${beta}°$`, `Avance: ${d} m`], kind: 'numeric', answer: h, unit: 'm',
    hints: ['Llama $x$ a la distancia desde el segundo punto hasta la base del cerro. Escribe una tangente para cada punto.', `$h = x\\tan ${beta}°$ y $h = (x + ${d})\\tan ${alpha}°$. Iguala y despeja $x$.`],
    steps: [
      `Segundo punto: $h = x\\cdot\\tan ${beta}° = ${tex(tb, 4)}\\,x$`,
      `Primer punto: $h = (x + ${d})\\cdot\\tan ${alpha}° = ${tex(ta, 4)}\\,(x + ${d})$`,
      `Igualar: $${tex(tb, 4)}x = ${tex(ta, 4)}x + ${tex(ta * d, 4)} \\Rightarrow x = \\dfrac{${tex(ta * d, 4)}}{${tex(tb - ta, 4)}} \\approx ${tex((ta * d) / (tb - ta), 3)}$ m`,
      `$h = ${tex(tb, 4)} \\cdot ${tex((ta * d) / (tb - ta), 3)} \\approx ${tex(h, 2)}$ m`,
    ],
    mistakes: [{ value: d * tb, label: 'Usaste el avance como base', explain: 'Los ' + d + ' m no son la distancia hasta la base del cerro: son solo lo que avanzaste. Necesitas una incógnita $x$ y dos ecuaciones.' }, { value: d * ta, label: 'Usaste el avance como base', explain: 'Los ' + d + ' m no son la distancia al cerro; plantea dos tangentes con una incógnita $x$.' }],
    concept: 'tan',
  });
}

// ======================================================
// CÍRCULO UNITARIO
// ======================================================
const NOTABLE = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
function genUnit(level: Level): Problem {
  if (level === 1) {
    const q = rnd(1, 4);
    const signs = ['', 'sen > 0 y cos > 0', 'sen > 0 y cos < 0', 'sen < 0 y cos < 0', 'sen < 0 y cos > 0'];
    const names = ['', 'Cuadrante I', 'Cuadrante II', 'Cuadrante III', 'Cuadrante IV'];
    const { choices, answer, choiceExplain } = shuffleChoices(names[q], [1, 2, 3, 4].filter((i) => i !== q).map((i) => names[i]), [1, 2, 3, 4].filter((i) => i !== q).map((i) => `En el ${names[i]}: ${signs[i]}. Recuerda: $\\cos\\theta = x$ y $\\sin\\theta = y$.`));
    return mk('unit', 1, {
      title: 'Signos por cuadrante', statement: `¿En qué cuadrante se cumple que **${signs[q]}**?`, data: ['$\\cos\\theta$ = coordenada $x$', '$\\sin\\theta$ = coordenada $y$'],
      kind: 'choice', choices, answer, choiceExplain,
      hints: ['En el círculo unitario el punto es $(\\cos\\theta, \\sin\\theta)$.', 'Traduce: el signo del coseno es el signo de $x$, el del seno es el de $y$.'],
      steps: [`${signs[q]} ⇒ $x ${q === 1 || q === 4 ? '>' : '<'} 0$, $y ${q <= 2 ? '>' : '<'} 0$ → **${names[q]}**.`],
    });
  }
  if (level === 2) {
    const fn = pick(['sin', 'cos'] as const);
    const d = pick(NOTABLE.filter((x) => x % 90 !== 0 && x !== 45 && x !== 135 && x !== 225 && x !== 315));
    const ans = f(fn, d);
    return mk('unit', 2, {
      title: 'Valor en el círculo unitario', statement: `Usando el círculo unitario, calcula $\\${fn}(${d}°)$.`, data: [`$\\theta = ${d}°$`],
      kind: 'numeric', answer: ans, answerHint: 'Acepta exactos como √3/2 o decimales (3 cifras).',
      hints: [`Ángulo de referencia: $${referenceAngle(d)}°$. Luego decide el **signo** por el cuadrante.`, fn === 'sin' ? 'El seno es la altura $y$ del punto.' : 'El coseno es la coordenada horizontal $x$ del punto.'],
      steps: [`Ángulo de referencia: $${referenceAngle(d)}°$`, `En el cuadrante del ángulo, ${fn === 'sin' ? '$y$' : '$x$'} es ${ans > 0 ? 'positiva' : 'negativa'}.`, `$\\${fn}(${d}°) = ${exactTex(fn, d)} \\approx ${tex(ans, 4)}$`],
      mistakes: [
        { value: -ans, label: 'Signo equivocado', explain: 'El valor absoluto está bien, pero el **signo** depende del cuadrante: mira si el punto está a la izquierda/derecha (coseno) o arriba/abajo (seno).' },
        { value: f(fn === 'sin' ? 'cos' : 'sin', d), label: 'x ↔ y', explain: 'Confundiste las coordenadas: $\\cos\\theta = x$ (horizontal) y $\\sin\\theta = y$ (vertical).' },
        RAD_MISTAKE(fn === 'sin' ? Math.sin(d) : Math.cos(d)),
      ],
    });
  }
  if (level === 3) {
    const r = rnd(2, 12), d = rnd(10, 350);
    const fn = pick(['cos', 'sin'] as const);
    const ans = r * f(fn, d);
    return mk('unit', 3, {
      title: 'Punto sobre una circunferencia', statement: `Una rueda de radio ${r} cm gira $${d}°$ desde el eje X positivo (sentido antihorario). ¿Cuál es la coordenada **${fn === 'cos' ? 'x' : 'y'}** de la válvula?`,
      data: [`$r = ${r}$`, `$\\theta = ${d}°$`], kind: 'numeric', answer: ans, unit: 'cm',
      hints: ['En un círculo de radio $r$: $x = r\\cos\\theta$, $y = r\\sin\\theta$.', 'El círculo unitario escalado por $r$.'],
      steps: [`$${fn === 'cos' ? 'x' : 'y'} = r\\${fn}\\theta = ${r}\\cdot\\${fn}(${d}°) = ${r}\\cdot ${tex(f(fn, d), 4)} \\approx ${tex(ans, 2)}$`],
      mistakes: [
        { value: r * f(fn === 'sin' ? 'cos' : 'sin', d), label: 'x ↔ y', explain: '$x$ va con **coseno** y $y$ con **seno**.' },
        { value: f(fn, d), label: 'Olvidaste el radio', explain: 'Eso sería en el círculo **unitario**. Con radio $r$ hay que multiplicar por $r$.' },
        RAD_MISTAKE(r * (fn === 'sin' ? Math.sin(d) : Math.cos(d))),
      ],
    });
  }
  if (level === 4) {
    const d = pick([120, 135, 150, 200, 210, 225, 240, 250, 300, 315, 330, 340, 110, 160]);
    const ans = referenceAngle(d);
    return mk('unit', 4, {
      title: 'Ángulo de referencia', statement: `¿Cuál es el ángulo de referencia de $${d}°$ (el ángulo agudo con el eje X)?`, data: [`$\\theta = ${d}°$`],
      kind: 'numeric', answer: ans, unit: '°',
      hints: ['Ubica el cuadrante y mide la distancia al eje X más cercano (0°, 180° o 360°).'],
      steps: [`$${d}°$ está en el cuadrante ${['', 'I', 'II', 'III', 'IV'][d < 90 ? 1 : d < 180 ? 2 : d < 270 ? 3 : 4]}.`, `Ángulo de referencia: $${ans}°$`],
      mistakes: [{ value: Math.abs(d - 90), label: 'Mediste desde el eje Y', explain: 'El ángulo de referencia se mide hasta el eje **X** (0°/180°/360°), no hasta el eje Y.' }, { value: 360 - d, label: 'Restaste de 360°', explain: 'Eso solo vale en el cuadrante IV. Mira a qué parte del eje X está más cerca el lado terminal.' }],
    });
  }
  const q = pick([2, 3, 4] as const);
  const refA = pick([30, 45, 60]);
  const fn = pick(['sin', 'cos'] as const);
  const ang = q === 2 ? 180 - refA : q === 3 ? 180 + refA : 360 - refA;
  const val = f(fn, ang);
  return mk('unit', 5, {
    title: 'Ángulo desde su valor', statement: `Si $\\${fn}\\theta = ${exactTex(fn, ang)}$ y θ está en el cuadrante ${['', 'I', 'II', 'III', 'IV'][q]} (entre 0° y 360°), ¿cuánto mide θ?`,
    data: [`$\\${fn}\\theta \\approx ${tex(val, 4)}$`, `Cuadrante ${['', 'I', 'II', 'III', 'IV'][q]}`], kind: 'numeric', answer: ang, unit: '°',
    hints: ['Primero encuentra el ángulo de referencia ignorando el signo.', 'Luego ubícalo en el cuadrante pedido: II → 180° − ref; III → 180° + ref; IV → 360° − ref.'],
    steps: [`Referencia: $\\${fn}^{-1}(${tex(Math.abs(val), 4)}) = ${refA}°$`, `Cuadrante ${['', 'I', 'II', 'III', 'IV'][q]} → $\\theta = ${ang}°$`, `Comprobación: $\\${fn}(${ang}°) = ${tex(val, 4)}$ ✔`],
    mistakes: [
      { value: af(fn, val), label: 'Solo la calculadora', explain: `La calculadora da un solo ángulo (${tex(af(fn, val), 1)}°), pero hay **dos** con ese valor entre 0° y 360°. Usa el cuadrante pedido.` },
      { value: refA, label: 'Solo el de referencia', explain: 'Ese es el ángulo de referencia (cuadrante I). Trasládalo al cuadrante pedido.' },
    ],
  });
}

// ======================================================
// IDENTIDAD FUNDAMENTAL
// ======================================================
function genIdentity(level: Level): Problem {
  if (level === 1) {
    const { choices, answer, choiceExplain } = shuffleChoices('$1$', ['$0$', '$\\tan\\theta$', 'Depende de θ'], ['Nunca puede ser 0: ambos cuadrados son ≥ 0 y no pueden anularse a la vez.', 'La tangente es $\\sin\\theta/\\cos\\theta$, otra relación.', 'Ese es el punto clave: **no depende** de θ. Es una identidad: vale para todos los ángulos.']);
    return mk('identity', 1, {
      title: 'La identidad fundamental', statement: 'Para cualquier ángulo θ, ¿cuánto vale $\\sin^2\\theta + \\cos^2\\theta$?', data: ['El punto $(\\cos\\theta, \\sin\\theta)$ está en el círculo de radio 1.'],
      kind: 'choice', choices, answer, choiceExplain,
      hints: ['El punto $(x, y) = (\\cos\\theta, \\sin\\theta)$ está a distancia 1 del origen.', 'Distancia al origen: $\\sqrt{x^2 + y^2} = 1$.'],
      steps: ['$x^2 + y^2 = r^2$ (Pitágoras) y en el círculo unitario $r = 1$.', '$\\cos^2\\theta + \\sin^2\\theta = 1$.'],
    });
  }
  if (level === 2 || level === 3) {
    const t = rnd(5, 85);
    const known = pick(['sin', 'cos'] as const);
    const q = level === 2 ? 1 : pick([2, 3, 4] as const);
    const ang = q === 1 ? t : q === 2 ? 180 - t : q === 3 ? 180 + t : 360 - t;
    const kv = round(f(known, ang), 3);
    const other = known === 'sin' ? 'cos' : 'sin';
    const mag = Math.sqrt(1 - kv * kv);
    const sign = Math.sign(f(other, ang)) || 1;
    const ans = sign * mag;
    return mk('identity', level, {
      title: level === 2 ? 'Usar la identidad' : 'Identidad + signo del cuadrante',
      statement: `Si $\\${known}\\theta = ${tex(kv, 3)}$ y θ está en el cuadrante ${['', 'I', 'II', 'III', 'IV'][q]}, calcula $\\${other}\\theta$.`,
      data: [`$\\${known}\\theta = ${tex(kv, 3)}$`, `Cuadrante ${['', 'I', 'II', 'III', 'IV'][q]}`], kind: 'numeric', answer: ans, answerHint: '3 decimales.',
      hints: [`Despeja de $\\sin^2\\theta + \\cos^2\\theta = 1$: $\\${other}^2\\theta = 1 - \\${known}^2\\theta$.`, level === 3 ? `La raíz da dos signos (±). Decide con el cuadrante: ${other === 'cos' ? '¿$x$' : '¿$y$'} es positiva o negativa ahí?` : 'En el cuadrante I todo es positivo.'],
      steps: [`$\\${other}^2\\theta = 1 - (${tex(kv, 3)})^2 = ${tex(1 - kv * kv, 4)}$`, `$\\${other}\\theta = \\pm\\sqrt{${tex(1 - kv * kv, 4)}} = \\pm ${tex(mag, 4)}$`, `Cuadrante ${['', 'I', 'II', 'III', 'IV'][q]} → signo ${sign > 0 ? '+' : '−'}: $\\${other}\\theta \\approx ${tex(ans, 3)}$`],
      mistakes: [
        { value: -ans, label: 'Signo del cuadrante', explain: 'El valor absoluto es correcto, pero el **signo** depende del cuadrante.' },
        { value: sign * (1 - Math.abs(kv)), label: 'Restaste sin elevar al cuadrado', explain: 'La identidad es con **cuadrados**: $\\cos^2 = 1 - \\sin^2$, no $\\cos = 1 - \\sin$.' },
        { value: sign * (1 - kv * kv), label: 'Faltó la raíz', explain: 'Ese valor es el **cuadrado**. Saca la raíz.' },
        { value: sign * Math.sqrt(1 + kv * kv), label: 'Sumaste', explain: 'Despejando, el cuadrado conocido pasa **restando**.' },
      ],
    });
  }
  if (level === 4) {
    const s = rndDec(0.15, 0.95, 2);
    const c = Math.sqrt(1 - s * s);
    const ans = s / c;
    return mk('identity', 4, {
      title: 'Tangente desde el seno', statement: `θ es agudo y $\\sin\\theta = ${tex(s)}$. Calcula $\\tan\\theta$ sin usar la tecla de ángulo.`,
      data: [`$\\sin\\theta = ${tex(s)}$`, 'θ agudo'], kind: 'numeric', answer: ans, answerHint: '3 decimales.',
      hints: ['$\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta}$', 'Obtén primero $\\cos\\theta$ con la identidad fundamental.'],
      steps: [`$\\cos\\theta = \\sqrt{1 - ${tex(s)}^2} \\approx ${tex(c, 4)}$`, `$\\tan\\theta = \\dfrac{${tex(s)}}{${tex(c, 4)}} \\approx ${tex(ans, 3)}$`],
      mistakes: [{ value: c / s, label: 'Cociente invertido', explain: '$\\tan = \\sin / \\cos$ (opuesto/adyacente). Lo pusiste al revés.' }, { value: s / (1 - s), label: 'cos = 1 − sen', explain: 'El coseno se obtiene con **cuadrados**: $\\cos\\theta = \\sqrt{1-\\sin^2\\theta}$.' }],
    });
  }
  let x = 0, y = 0;
  do { x = rndNZ(-9, 9); y = rndNZ(-9, 9); } while (Math.abs(x) === Math.abs(y));
  const r = Math.hypot(x, y);
  const fn = pick(['sin', 'cos'] as const);
  const ans = (fn === 'sin' ? y : x) / r;
  return mk('identity', 5, {
    title: 'Razones desde un punto', statement: `El punto $P = (${x}, ${y})$ está sobre el lado terminal de θ. Calcula $\\${fn}\\theta$.`,
    data: [`$P = (${x}, ${y})$`], kind: 'numeric', answer: ans, answerHint: '3 decimales o fracción con raíz.',
    figure: { type: 'points', points: [{ name: 'O', x: 0, y: 0 }, { name: 'P', x, y }], segment: true },
    hints: ['$P$ no está en el círculo unitario: primero calcula su distancia al origen $r$.', `$\\sin\\theta = y/r$, $\\cos\\theta = x/r$ (se "normaliza" el punto al radio 1).`],
    steps: [`$r = \\sqrt{${texP(x)}^2 + ${texP(y)}^2} = \\sqrt{${x * x + y * y}} \\approx ${tex(r, 4)}$`, `$\\${fn}\\theta = \\dfrac{${fn === 'sin' ? y : x}}{${tex(r, 4)}} \\approx ${tex(ans, 3)}$`, `Control: $(${tex(x / r, 3)})^2 + (${tex(y / r, 3)})^2 \\approx 1$ ✔`],
    mistakes: [
      { value: (fn === 'sin' ? x : y) / r, label: 'x ↔ y', explain: '$\\cos\\theta$ usa $x$ y $\\sin\\theta$ usa $y$.' },
      { value: fn === 'sin' ? y : x, label: 'Faltó dividir por r', explain: 'Solo en el círculo **unitario** el seno es directamente $y$. Aquí $r \\neq 1$: divide por $r$.' },
      { value: -ans, label: 'Signo', explain: 'Respeta el signo de la coordenada: indica el cuadrante.' },
    ],
  });
}

// ======================================================
// LEY DEL SENO Y DEL COSENO
// ======================================================
function genOblique(level: Level): Problem {
  if (level === 1) {
    const cases = [
      { data: 'tres lados', law: 'coseno', why: 'Sin ningún ángulo no hay un par lado–ángulo opuesto completo: la ley del seno no sirve. La ley del coseno relaciona los tres lados con un ángulo.' },
      { data: 'dos lados y el ángulo comprendido entre ellos', law: 'coseno', why: 'El ángulo conocido está **entre** los dos lados: no tienes ningún par lado–ángulo opuesto. Ley del coseno para el tercer lado.' },
      { data: 'dos ángulos y un lado', law: 'seno', why: 'Con dos ángulos sacas el tercero (suman 180°), y entonces tienes un par lado–ángulo opuesto completo: ley del seno.' },
      { data: 'un lado, su ángulo opuesto y otro ángulo', law: 'seno', why: 'Ya tienes un par lado–ángulo opuesto completo: ley del seno.' },
    ];
    const c = pick(cases);
    const names = ['Ley del seno', 'Ley del coseno', 'Teorema de Pitágoras', 'SOH CAH TOA directo'];
    const correct = c.law === 'seno' ? 0 : 1;
    const { choices, answer, choiceExplain } = shuffleChoices(names[correct], names.filter((_, i) => i !== correct), names.filter((_, i) => i !== correct).map((n) => n.includes('Pitágoras') || n.includes('SOH') ? 'Eso solo vale en triángulos **rectángulos**. Aquí el triángulo es cualquiera.' : c.why));
    return mk('oblique', 1, {
      title: '¿Qué ley uso?', statement: `En un triángulo **no rectángulo** conoces **${c.data}**. ¿Qué herramienta te permite empezar a resolverlo?`, data: [`Datos: ${c.data}`],
      kind: 'choice', choices, answer, choiceExplain,
      hints: ['¿Tienes algún **par completo** (un lado y el ángulo opuesto a él)? Si lo tienes → ley del seno.', 'Si no hay par completo (LLL o LAL) → ley del coseno.'],
      steps: [c.why, `→ **${names[correct]}**.`],
    });
  }
  if (level === 4 && Math.random() < 0.5) {
    const d = rnd(3, 12), al = rnd(35, 75), be = rnd(35, 75);
    const ga = 180 - al - be;
    const PB = (d * sinDeg(be)) / sinDeg(ga);
    return mk('oblique', 4, {
      title: 'Triangulación desde la costa',
      statement: `Dos faros P y Q están separados ${d} km. Un barco B se observa con un ángulo de $${al}°$ desde P y de $${be}°$ desde Q (medidos respecto de la línea PQ). ¿A qué distancia del faro P está el barco?`,
      data: [`$PQ = ${d}$ km`, `Ángulo en P: $${al}°$`, `Ángulo en Q: $${be}°$`], kind: 'numeric', answer: PB, unit: 'km', answerHint: '2 decimales, calculadora en DEG.',
      hints: ['Primero el ángulo en el barco: los tres suman 180°.', `PB es el lado **opuesto al ángulo en Q**; PQ es opuesto al ángulo en B. Ley del seno.`],
      steps: [`Ángulo en B: $180° - ${al}° - ${be}° = ${ga}°$`, `$\\dfrac{PB}{\\sin ${be}°} = \\dfrac{${d}}{\\sin ${ga}°}$`, `$PB = \\dfrac{${d}\\cdot ${tex(sinDeg(be), 4)}}{${tex(sinDeg(ga), 4)}} \\approx ${tex(PB, 2)}$ km`],
      mistakes: [
        { value: (d * sinDeg(al)) / sinDeg(ga), label: 'Ángulo opuesto equivocado', explain: 'PB está **frente al ángulo en Q**, no al de P. Cada lado se empareja con el ángulo que tiene enfrente.' },
        { value: (d * sinDeg(be)) / sinDeg(al), label: 'Faltó el tercer ángulo', explain: 'PQ está frente al ángulo en **B**, que se calcula como $180° - P - Q$.' },
        RAD_MISTAKE((d * Math.sin(be)) / Math.sin(ga)),
      ],
    });
  }
  if (level === 2) {
    const A = rnd(30, 80), B = rnd(25, 150 - A - 10), a = rnd(5, 25);
    const b = (a * sinDeg(B)) / sinDeg(A);
    return mk('oblique', level, {
      title: 'Ley del seno: un lado',
      statement: `En un triángulo, $A = ${A}°$, $B = ${B}°$ y $a = ${a}$. Calcula $b$.`,
      data: [`$A = ${A}°$`, `$B = ${B}°$`, `$a = ${a}$`], kind: 'numeric', answer: b, answerHint: '2 decimales, calculadora en DEG.',
      hints: ['Tienes el par completo $a$ y $A$. Busca $b$, el lado opuesto a $B$.', '$\\dfrac{b}{\\sin B} = \\dfrac{a}{\\sin A}$ → despeja $b$.'],
      steps: [`$\\dfrac{b}{\\sin ${B}°} = \\dfrac{${a}}{\\sin ${A}°}$`, `$b = \\dfrac{${a}\\cdot\\sin ${B}°}{\\sin ${A}°} = \\dfrac{${a}\\cdot${tex(sinDeg(B), 4)}}{${tex(sinDeg(A), 4)}} \\approx ${tex(b, 2)}$`],
      mistakes: [
        { value: (a * sinDeg(A)) / sinDeg(B), label: 'Senos invertidos', explain: 'Cada lado va con el seno de **su ángulo opuesto**: $b$ con $\\sin B$ arriba, $a$ con $\\sin A$ abajo.' },
        { value: (a * cosDeg(B)) / cosDeg(A), label: 'Usaste coseno', explain: 'La ley del seno usa **senos**.' },
        RAD_MISTAKE((a * Math.sin(B)) / Math.sin(A)),
      ],
    });
  }
  if (level === 3 || level === 4) {
    const a = rnd(4, 20), b = rnd(4, 20), C = rnd(25, 140);
    const c = Math.sqrt(a * a + b * b - 2 * a * b * cosDeg(C));
    const ctx = level === 4;
    return mk('oblique', level, {
      title: ctx ? 'Túnel bajo el cerro' : 'Ley del coseno: el tercer lado',
      statement: ctx
        ? `Para medir un túnel que atravesará un cerro, una topógrafa se ubica en un punto desde el que ve ambas bocas: una a ${a}0 m y otra a ${b}0 m, con un ángulo de $${C}°$ entre ambas visuales. ¿Cuánto medirá el túnel?`
        : `En un triángulo, $a = ${a}$, $b = ${b}$ y el ángulo comprendido $C = ${C}°$. Calcula $c$.`,
      data: ctx ? [`Distancias: ${a}0 m y ${b}0 m`, `Ángulo entre visuales: $${C}°$`] : [`$a = ${a}$`, `$b = ${b}$`, `$C = ${C}°$`],
      kind: 'numeric', answer: ctx ? c * 10 : c, unit: ctx ? 'm' : undefined, answerHint: '2 decimales, calculadora en DEG.',
      hints: ['Dos lados y el ángulo **entre** ellos → ley del coseno.', '$c^2 = a^2 + b^2 - 2ab\\cos C$ y al final la raíz.'],
      steps: ctx
        ? [`$t^2 = ${a}0^2 + ${b}0^2 - 2\\cdot${a}0\\cdot${b}0\\cdot\\cos ${C}°$`, `$t^2 \\approx ${tex(c * c * 100, 2)} \\Rightarrow t \\approx ${tex(c * 10, 2)}$ m`]
        : [`$c^2 = ${a}^2 + ${b}^2 - 2\\cdot${a}\\cdot${b}\\cdot\\cos ${C}° = ${a * a + b * b} - ${2 * a * b}\\cdot${tex(cosDeg(C), 4)}$`, `$c^2 \\approx ${tex(c * c, 3)} \\Rightarrow c \\approx ${tex(c, 2)}$`],
      mistakes: [
        { value: (ctx ? 10 : 1) * Math.hypot(a, b), label: 'Usaste Pitágoras', explain: 'Pitágoras solo vale si el ángulo es de **90°**. Con otro ángulo falta el término de corrección $-2ab\\cos C$.' },
        { value: (ctx ? 10 : 1) * Math.sqrt(a * a + b * b + 2 * a * b * cosDeg(C)), label: 'Signo del término', explain: 'La ley del coseno **resta**: $c^2 = a^2 + b^2 - 2ab\\cos C$.' },
        { value: (ctx ? 100 : 1) * c * c, label: 'Faltó la raíz', explain: 'Ese valor es $c^2$. Saca la **raíz cuadrada**.' },
        { value: (ctx ? 10 : 1) * Math.sqrt(Math.max(0, a * a + b * b - 2 * a * b * Math.cos(C))), label: 'Calculadora en radianes', explain: 'El coseno se calculó con el ángulo en radianes. Pon la calculadora en **DEG**.' },
      ],
    });
  }
  // nivel 5: ángulo desde tres lados
  let a = 0, b = 0, c = 0;
  do { a = rnd(4, 15); b = rnd(4, 15); c = rnd(4, 15); } while (!(a + b > c && a + c > b && b + c > a) || c * c === a * a + b * b);
  const cosC = (a * a + b * b - c * c) / (2 * a * b);
  const C = acosDeg(cosC);
  return mk('oblique', 5, {
    title: 'Ángulo desde tres lados', statement: `Un terreno triangular mide $a = ${a}$ m, $b = ${b}$ m y $c = ${c}$ m. ¿Cuánto mide el ángulo $C$ (opuesto a $c$)?`,
    data: [`$a = ${a}$`, `$b = ${b}$`, `$c = ${c}$`], kind: 'numeric', answer: C, unit: '°', answerHint: 'Grados con 1 decimal.',
    hints: ['Tres lados → ley del coseno, despejando el coseno del ángulo.', '$\\cos C = \\dfrac{a^2 + b^2 - c^2}{2ab}$, luego $\\cos^{-1}$.'],
    steps: [`$\\cos C = \\dfrac{${a * a} + ${b * b} - ${c * c}}{${2 * a * b}} \\approx ${tex(cosC, 4)}$`, `$C = \\cos^{-1}(${tex(cosC, 4)}) \\approx ${tex(C, 2)}°$`, cosC < 0 ? 'El coseno es negativo → $C$ es **obtuso**.' : 'El coseno es positivo → $C$ es **agudo**.'],
    mistakes: [
      { value: acosDeg(Math.max(-1, Math.min(1, (a * a + b * b + c * c) / (2 * a * b)))), label: 'Signo en el numerador', explain: 'El lado **opuesto** al ángulo buscado va restando: $a^2 + b^2 - c^2$.' },
      { value: Math.acos(cosC), label: 'Resultado en radianes', explain: 'Cambia la calculadora a **DEG**.' },
      { value: cosC, label: 'Faltó el coseno inverso', explain: 'Ese número es $\\cos C$, no el ángulo. Aplica $\\cos^{-1}$.' },
    ],
  });
}

// ======================================================
// GRÁFICAS TRIGONOMÉTRICAS  y = A·f(B(x − C)) + D
// ======================================================
function genGraphs(level: Level): Problem {
  const fn = pick(['sin', 'cos'] as const);
  if (level === 1) {
    const B = pick([2, 3, 4, 6]);
    const per = 360 / B;
    const opts = [per, 360 * B, 360, 180 / B].map((v) => `$${tex(v, 1)}°$`);
    const { choices, answer, choiceExplain } = shuffleChoices(opts[0], opts.slice(1), ['Multiplicaste: si $B$ es mayor, la onda va **más rápido** y el período se **acorta**: se divide.', 'Ese es el período de la función base: el factor $B$ lo cambia.', 'Ese sería el período de la **tangente** (180°/B).']);
    return mk('graphs', 1, {
      title: 'Leer el período', statement: `¿Cuál es el período de $y = \\${fn}(${tex(B)}x)$ (con $x$ en grados)?`, data: [`$B = ${tex(B)}$`],
      kind: 'choice', choices, answer, choiceExplain,
      hints: ['El período es lo que tarda la onda en repetirse. $\\sin x$ y $\\cos x$ se repiten cada $360°$.', 'Con $B$ la onda avanza $B$ veces más rápido: $T = \\dfrac{360°}{|B|}$.'],
      steps: [`$T = \\dfrac{360°}{${tex(B)}} = ${tex(per, 1)}°$`],
    });
  }
  if (level === 2) {
    const A = pick([2, 3, 4, 5, 0.5, 1.5]) * pick([1, -1]);
    return mk('graphs', 2, {
      title: 'Amplitud', statement: `¿Cuál es la amplitud de $y = ${tex(A)}\\${fn}(x)$?`, data: [`$A = ${tex(A)}$`],
      kind: 'numeric', answer: Math.abs(A),
      hints: ['La amplitud es la distancia del eje central al máximo.', 'Es $|A|$: siempre positiva. Un $A$ negativo solo **refleja** la onda.'],
      steps: [`Amplitud $= |A| = |${tex(A)}| = ${tex(Math.abs(A))}$`, A < 0 ? 'El signo negativo voltea la onda (reflexión respecto del eje), pero no cambia la altura.' : 'La onda oscila entre $-|A|$ y $|A|$.'],
      mistakes: [{ value: A, label: 'Amplitud negativa', explain: 'La amplitud es una **distancia**: se toma $|A|$. El signo solo indica que la onda está reflejada.' }, { value: 2 * Math.abs(A), label: 'Altura total', explain: 'Eso es de mínimo a máximo. La amplitud es la **mitad**: del centro al máximo.' }],
    });
  }
  if (level === 3) {
    const B = pick([2, 3, 4, 5, 6, 0.5, 0.25]);
    const rad = Math.random() < 0.5;
    const per = rad ? (2 * Math.PI) / B : 360 / B;
    return mk('graphs', 3, {
      title: 'Período', statement: `Calcula el período de $y = 3\\${fn}(${tex(B)}x)$ con $x$ en **${rad ? 'radianes' : 'grados'}**.`, data: [`$B = ${tex(B)}$`, rad ? 'unidad: radianes' : 'unidad: grados'],
      kind: 'numeric', answer: per, unit: rad ? 'rad' : '°', answerHint: rad ? 'Puedes escribir la fracción de π, por ejemplo π/2.' : undefined,
      hints: ['El 3 (amplitud) no afecta el período.', rad ? '$T = \\dfrac{2\\pi}{|B|}$' : '$T = \\dfrac{360°}{|B|}$'],
      steps: [rad ? `$T = \\dfrac{2\\pi}{${tex(B)}} \\approx ${tex(per, 4)}$` : `$T = \\dfrac{360°}{${tex(B)}} = ${tex(per, 2)}°$`],
      mistakes: [
        { value: rad ? 2 * Math.PI * B : 360 * B, label: 'Multiplicaste por B', explain: 'Un $B$ grande **comprime** la onda: el período se **divide** por $B$.' },
        { value: rad ? 360 / B : (2 * Math.PI) / B, label: 'Grados ↔ radianes', explain: `En ${rad ? 'radianes una vuelta es $2\\pi$' : 'grados una vuelta es $360°$'}.` },
        { value: (3 * (rad ? 2 * Math.PI : 360)) / B, label: 'Usaste la amplitud', explain: 'La amplitud (el 3) no cambia el período.' },
      ],
    });
  }
  if (level === 4) {
    const A = rnd(2, 6), D = rnd(-4, 6);
    const askMax = Math.random() < 0.5;
    const ans = askMax ? D + A : D - A;
    return mk('graphs', 4, {
      title: askMax ? 'Valor máximo' : 'Valor mínimo', statement: `¿Cuál es el valor ${askMax ? 'máximo' : 'mínimo'} de $y = ${A}\\${fn}(2x) ${D < 0 ? '-' : '+'} ${Math.abs(D)}$?`, data: [`Amplitud $A = ${A}$`, `Desplazamiento vertical $D = ${D}$`],
      kind: 'numeric', answer: ans,
      hints: [`$\\${fn}$ toma valores entre $-1$ y $1$.`, `Multiplica por ${A} y luego ${D < 0 ? 'resta' : 'suma'} ${Math.abs(D)}.`],
      steps: [`$-1 \\le \\${fn}(2x) \\le 1$`, `$${-A + D} \\le y \\le ${A + D}$ → ${askMax ? 'máximo' : 'mínimo'} $= ${ans}$`],
      mistakes: [{ value: askMax ? A : -A, label: 'Olvidaste D', explain: 'El término independiente **sube o baja** toda la onda: el eje central queda en $y = D$.' }, { value: askMax ? D - A : D + A, label: 'Máximo ↔ mínimo', explain: `El ${askMax ? 'máximo es $D + |A|$' : 'mínimo es $D - |A|$'}.` }],
    });
  }
  // nivel 5: aplicación — rueda de la fortuna
  const R = rnd(8, 25), H = R + rnd(1, 4), T = pick([20, 24, 30, 36, 40, 60]), t = rnd(2, T - 2);
  const h = H - R * cosDeg((360 / T) * t);
  return mk('graphs', 5, {
    title: 'Rueda de la fortuna', statement: `Una rueda de ${R} m de radio tiene su centro a ${H} m del suelo y da una vuelta cada ${T} s. Subes por el punto más bajo en $t = 0$. Su altura es $h(t) = ${H} - ${R}\\cos\\left(\\frac{360°}{${T}}\\,t\\right)$. ¿A qué altura estás a los ${t} s?`,
    data: [`Radio ${R} m`, `Centro a ${H} m`, `Período ${T} s`, `$t = ${t}$ s`], kind: 'numeric', answer: h, unit: 'm', answerHint: '2 decimales, calculadora en DEG.',
    hints: [`Primero el ángulo girado: $\\frac{360°}{${T}}\\cdot ${t} = ${tex((360 / T) * t, 2)}°$.`, 'Luego evalúa el coseno y sustituye.'],
    steps: [`Ángulo: $${tex((360 / T) * t, 2)}°$`, `$h = ${H} - ${R}\\cdot\\cos(${tex((360 / T) * t, 2)}°) = ${H} - ${R}\\cdot ${tex(cosDeg((360 / T) * t), 4)} \\approx ${tex(h, 2)}$ m`],
    mistakes: [
      { value: H + R * cosDeg((360 / T) * t), label: 'Signo del coseno', explain: 'El modelo resta: en $t = 0$ debes estar **abajo** ($h = ' + (H - R) + '$ m).' },
      { value: H - R * Math.cos((360 / T) * t), label: 'Calculadora en radianes', explain: 'El ángulo está en grados: usa **DEG**.' },
      { value: H - R * cosDeg(t), label: 'Faltó convertir el tiempo en ángulo', explain: `El argumento es $\\frac{360°}{${T}}t$, no solo $t$.` },
    ],
  });
}

// ======================================================
// SUMA Y DIFERENCIA DE ÁNGULOS
// ======================================================
function genSum(level: Level): Problem {
  if (level === 1) {
    const fn = pick(['sin', 'cos'] as const);
    const correct = fn === 'sin' ? '$\\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta$' : '$\\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta$';
    const wrongs = fn === 'sin'
      ? ['$\\sin\\alpha + \\sin\\beta$', '$\\sin\\alpha\\sin\\beta + \\cos\\alpha\\cos\\beta$', '$\\sin\\alpha\\cos\\beta - \\cos\\alpha\\sin\\beta$']
      : ['$\\cos\\alpha + \\cos\\beta$', '$\\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta$', '$\\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta$'];
    const { choices, answer, choiceExplain } = shuffleChoices(correct, wrongs, fn === 'sin'
      ? ['El seno **no se reparte** en la suma. Prueba con 30° + 60°: daría más que 1.', 'Esa mezcla corresponde a $\\cos(\\alpha - \\beta)$.', 'Ese es $\\sin(\\alpha - \\beta)$: para la suma va **+**.']
      : ['El coseno **no se reparte** en la suma: $\\cos(30°+60°) = 0$, pero $\\cos30° + \\cos60° \\approx 1{,}37$.', 'Con **+** es $\\cos(\\alpha - \\beta)$. Para la suma el signo es **−**.', 'Ese es $\\sin(\\alpha+\\beta)$.']);
    return mk('sum', 1, {
      title: 'Reconocer la fórmula', statement: `¿A qué es igual $\\${fn}(\\alpha + \\beta)$?`, data: ['Identidad de suma de ángulos'],
      kind: 'choice', choices, answer, choiceExplain,
      hints: ['Comprueba con ángulos fáciles: $\\alpha = \\beta = 45°$.', fn === 'sin' ? 'Seno de la suma: "seno·coseno + coseno·seno".' : 'Coseno de la suma: "coseno·coseno − seno·seno" (el signo cambia).'],
      steps: [`$\\${fn}(\\alpha+\\beta) = ${correct.replace(/\$/g, '')}$`],
    });
  }
  if (level === 2 || level === 3) {
    const pairs: [number, number, '+' | '-'][] = [[45, 30, '+'], [60, 45, '+'], [45, 30, '-'], [60, 45, '-'], [90, 15, '-'], [120, 45, '-']].filter((p) => p[0] !== 90) as [number, number, '+' | '-'][];
    const [x, y, op] = pick(pairs);
    const fn = level === 2 ? 'sin' : 'cos';
    const ang = op === '+' ? x + y : x - y;
    const ans = fn === 'sin' ? sinDeg(ang) : cosDeg(ang);
    const sx = sinDeg(x), cx = cosDeg(x), sy = sinDeg(y), cy = cosDeg(y);
    const formula = fn === 'sin'
      ? `\\sin ${x}°\\cos ${y}° ${op} \\cos ${x}°\\sin ${y}°`
      : `\\cos ${x}°\\cos ${y}° ${op === '+' ? '-' : '+'} \\sin ${x}°\\sin ${y}°`;
    return mk('sum', level, {
      title: `${fn === 'sin' ? 'Seno' : 'Coseno'} de ${ang}° sin calculadora`, statement: `Calcula $\\${fn}(${ang}°)$ escribiéndolo como $\\${fn}(${x}° ${op} ${y}°)$.`,
      data: [`$${ang}° = ${x}° ${op} ${y}°$`], kind: 'numeric', answer: ans, answerHint: 'Exacto (con √) o decimal con 4 cifras.',
      hints: [fn === 'sin' ? `$\\sin(\\alpha ${op} \\beta) = \\sin\\alpha\\cos\\beta ${op} \\cos\\alpha\\sin\\beta$` : `$\\cos(\\alpha ${op} \\beta) = \\cos\\alpha\\cos\\beta ${op === '+' ? '-' : '+'} \\sin\\alpha\\sin\\beta$`, `Usa los valores exactos de ${x}° y ${y}°.`],
      steps: [`$\\${fn}(${x}° ${op} ${y}°) = ${formula}$`, `$= ${tex(fn === 'sin' ? sx * cy : cx * cy, 4)} ${fn === 'sin' ? op : op === '+' ? '-' : '+'} ${tex(fn === 'sin' ? cx * sy : sx * sy, 4)} \\approx ${tex(ans, 4)}$`],
      mistakes: [
        { value: fn === 'sin' ? (op === '+' ? sx + sy : sx - sy) : op === '+' ? cx + cy : cx - cy, label: 'Repartiste la función', explain: `$\\${fn}(\\alpha ${op} \\beta) \\neq \\${fn}\\alpha ${op} \\${fn}\\beta$. Hace falta la fórmula de suma.` },
        { value: fn === 'sin' ? (op === '+' ? sx * cy - cx * sy : sx * cy + cx * sy) : op === '+' ? cx * cy + sx * sy : cx * cy - sx * sy, label: 'Signo equivocado', explain: fn === 'sin' ? 'En el seno el signo **se conserva**: suma → +, resta → −.' : 'En el coseno el signo **se invierte**: suma → −, resta → +.' },
      ],
    });
  }
  if (level === 4) {
    const s0 = pick([0.6, 0.8, 0.28, 0.96, 0.5]);
    const c0 = Math.sqrt(1 - s0 * s0);
    const fn = pick(['sin', 'cos'] as const);
    const ans = fn === 'sin' ? 2 * s0 * c0 : c0 * c0 - s0 * s0;
    return mk('sum', 4, {
      title: 'Ángulo doble', statement: `θ es agudo y $\\sin\\theta = ${tex(s0)}$. Calcula $\\${fn}(2\\theta)$.`, data: [`$\\sin\\theta = ${tex(s0)}$`, 'θ agudo (cos θ > 0)'],
      kind: 'numeric', answer: ans, answerHint: '4 decimales.',
      hints: ['Primero $\\cos\\theta = \\sqrt{1 - \\sin^2\\theta}$.', fn === 'sin' ? '$\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$' : '$\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta$'],
      steps: [`$\\cos\\theta = \\sqrt{1 - ${tex(s0 * s0, 4)}} = ${tex(c0, 4)}$`, fn === 'sin' ? `$\\sin 2\\theta = 2\\cdot${tex(s0)}\\cdot${tex(c0, 4)} = ${tex(ans, 4)}$` : `$\\cos 2\\theta = ${tex(c0 * c0, 4)} - ${tex(s0 * s0, 4)} = ${tex(ans, 4)}$`],
      mistakes: [
        { value: fn === 'sin' ? 2 * s0 : 2 * c0, label: 'Doblaste el valor', explain: `$\\${fn}(2\\theta) \\neq 2\\${fn}\\theta$: duplicar el ángulo no duplica el ${fn === 'sin' ? 'seno' : 'coseno'}.` },
        { value: fn === 'sin' ? s0 * c0 : s0 * s0 - c0 * c0, label: fn === 'sin' ? 'Faltó el 2' : 'Orden invertido', explain: fn === 'sin' ? 'La fórmula es $2\\sin\\theta\\cos\\theta$.' : 'Es $\\cos^2\\theta - \\sin^2\\theta$ (primero el coseno).' },
      ],
    });
  }
  const a = pick([20, 25, 35, 40, 50]), b = pick([10, 15, 20, 25]);
  const ta = tanDeg(a), tb = tanDeg(b);
  const ans = (ta + tb) / (1 - ta * tb);
  return mk('sum', 5, {
    title: 'Tangente de una suma', statement: `Sabiendo que $\\tan ${a}° \\approx ${tex(ta, 4)}$ y $\\tan ${b}° \\approx ${tex(tb, 4)}$, calcula $\\tan(${a}° + ${b}°)$ usando la fórmula.`,
    data: [`$\\tan ${a}° \\approx ${tex(ta, 4)}$`, `$\\tan ${b}° \\approx ${tex(tb, 4)}$`], kind: 'numeric', answer: ans, answerHint: '3 decimales.',
    hints: ['$\\tan(\\alpha+\\beta) = \\dfrac{\\tan\\alpha + \\tan\\beta}{1 - \\tan\\alpha\\tan\\beta}$', 'Calcula numerador y denominador por separado.'],
    steps: [`Numerador: $${tex(ta, 4)} + ${tex(tb, 4)} = ${tex(ta + tb, 4)}$`, `Denominador: $1 - ${tex(ta, 4)}\\cdot${tex(tb, 4)} = ${tex(1 - ta * tb, 4)}$`, `$\\tan(${a + b}°) \\approx ${tex(ans, 4)}$ (comprueba: $\\tan ${a + b}° \\approx ${tex(tanDeg(a + b), 4)}$)`],
    mistakes: [
      { value: ta + tb, label: 'Repartiste la tangente', explain: 'La tangente no se reparte en la suma: falta dividir por $1 - \\tan\\alpha\\tan\\beta$.' },
      { value: (ta + tb) / (1 + ta * tb), label: 'Signo del denominador', explain: 'Para la **suma** el denominador es $1 - \\tan\\alpha\\tan\\beta$.' },
    ],
  });
}

// ======================================================
// FUNCIONES INVERSAS
// ======================================================
type Fn3 = 'sin' | 'cos' | 'tan';

/** Valores notables positivos: [TeX, valor, ángulo agudo]. */
const NOTABLE3: Record<Fn3, [string, number, number][]> = {
  sin: [['\\tfrac{1}{2}', 0.5, 30], ['\\tfrac{\\sqrt2}{2}', Math.SQRT1_2, 45], ['\\tfrac{\\sqrt3}{2}', Math.sqrt(3) / 2, 60]],
  cos: [['\\tfrac{\\sqrt3}{2}', Math.sqrt(3) / 2, 30], ['\\tfrac{\\sqrt2}{2}', Math.SQRT1_2, 45], ['\\tfrac{1}{2}', 0.5, 60]],
  tan: [['\\tfrac{\\sqrt3}{3}', Math.sqrt(3) / 3, 30], ['1', 1, 45], ['\\sqrt3', Math.sqrt(3), 60]],
};
const INV_RANGE: Record<Fn3, string> = { sin: '$[-90°,\\,90°]$', cos: '$[0°,\\,180°]$', tan: '$(-90°,\\,90°)$' };

function genInverse(level: Level): Problem {
  const fn = pick(['sin', 'cos', 'tan'] as const);
  if (level === 1) {
    const others = (['sin', 'cos', 'tan'] as const).filter((f) => f !== fn);
    const why: Record<Fn3, string> = {
      sin: 'Ese es el recorrido de $\\sin^{-1}$: la mitad derecha del círculo, donde el seno recorre de $-1$ a $1$ sin repetirse.',
      cos: 'Ese es el recorrido de $\\cos^{-1}$: la mitad superior del círculo, donde el coseno recorre de $1$ a $-1$ sin repetirse.',
      tan: 'Ese es el de $\\tan^{-1}$: intervalo **abierto**, porque la tangente no existe en $\\pm90°$.',
    };
    const { choices, answer, choiceExplain } = shuffleChoices(INV_RANGE[fn], [...others.map((f) => INV_RANGE[f]), '$[0°,\\,360°)$'], [...others.map((f) => why[f]), 'En una vuelta completa cada valor aparece **dos veces**: la inversa no sabría cuál elegir. Por eso se recorta.']);
    return mk('inverse', 1, {
      title: 'Recorrido de la inversa', statement: `¿En qué intervalo están **siempre** las respuestas de $\\${fn}^{-1}(x)$?`, data: [`Función inversa del ${FN_ES[fn]}`],
      kind: 'choice', choices, answer, choiceExplain,
      hints: ['La inversa solo puede devolver **un** ángulo por valor: se queda con un trozo donde la función no se repite.', fn === 'cos' ? 'El coseno es la coordenada $x$: recorre todos sus valores en la mitad **superior** del círculo.' : `${fn === 'sin' ? 'El seno es la coordenada $y$' : 'La tangente es la pendiente'}: recorre todos sus valores en la mitad **derecha** del círculo.`],
      steps: [`$\\${fn}^{-1}$ devuelve ángulos en ${INV_RANGE[fn]} (la rama principal).`, fn === 'tan' ? 'El intervalo es abierto: $\\tan(\\pm90°)$ no existe.' : `En los extremos la función alcanza $${fn === 'sin' ? '-1$ y $1' : '1$ y $-1'}$.`],
    });
  }
  if (level === 2 || level === 3) {
    const [t, v, ref] = pick(NOTABLE3[fn]);
    const neg = level === 3;
    const ans = !neg ? ref : fn === 'cos' ? 180 - ref : -ref;
    return mk('inverse', level, {
      title: neg ? 'Inversa de un valor negativo' : 'Inversa de un valor notable',
      statement: `Calcula $\\${fn}^{-1}\\!\\left(${neg ? '-' : ''}${t}\\right)$ en grados, sin calculadora.`,
      data: [`$x = ${neg ? '-' : ''}${t} \\approx ${tex(neg ? -v : v, 4)}$`, `Recorrido de $\\${fn}^{-1}$: ${INV_RANGE[fn]}`], kind: 'numeric', answer: ans, unit: '°',
      hints: [`Pregúntate: ¿qué ángulo tiene ${FN_ES[fn]} igual a $${neg ? '-' : ''}${t}$?`, neg ? (fn === 'cos' ? 'Con coseno negativo el ángulo está en el **II cuadrante**: $180°$ menos el ángulo de referencia.' : 'Con valor negativo la respuesta es un ángulo **negativo** (IV cuadrante), no uno mayor que 180°.') : 'Recuerda la tabla de 30°, 45° y 60°.'],
      steps: neg
        ? [`Ángulo de referencia: $\\${fn}\\,${ref}° = ${t}$.`, fn === 'cos' ? `El coseno es negativo en el II cuadrante (dentro de $[0°, 180°]$): $180° - ${ref}° = ${ans}°$.` : `La respuesta debe quedar en ${INV_RANGE[fn]}: se toma el ángulo negativo, $${ans}°$.`]
        : [`$\\${fn}\\,${ref}° = ${t}$, y $${ref}°$ está en ${INV_RANGE[fn]}.`, `$\\${fn}^{-1}\\!\\left(${t}\\right) = ${ref}°$`],
      mistakes: neg
        ? [
          { value: ref, label: 'Ignoraste el signo', explain: 'Ese es el ángulo para el valor **positivo**. El signo negativo cambia el cuadrante.' },
          fn === 'cos'
            ? { value: -ref, label: 'El coseno no es impar', explain: `$\\cos(-${ref}°) = +${t}$: el coseno de un ángulo negativo es positivo. Para un coseno negativo hay que ir al **II cuadrante**.` }
            : { value: 360 - ref, label: 'Fuera del recorrido', explain: `$${360 - ref}°$ tiene el mismo valor, pero la inversa responde en ${INV_RANGE[fn]}: es $-${ref}°$.` },
          { value: 180 + ref, label: 'Cuadrante equivocado', explain: `Ese ángulo queda fuera de ${INV_RANGE[fn]}, donde vive la respuesta de la inversa.` },
        ]
        : [
          { value: 90 - ref, label: 'Ángulo complementario', explain: `Ese es el ángulo cuyo **${fn === 'sin' ? 'coseno' : fn === 'cos' ? 'seno' : 'cotangente'}** vale $${t}$. Revisa la tabla de valores notables.` },
          { value: 1 / v, label: 'Recíproco, no inversa', explain: `$\\${fn}^{-1}$ no es $\\dfrac{1}{\\${fn}}$: la inversa devuelve un **ángulo**.` },
          { value: (ref * Math.PI) / 180, label: 'Respuesta en radianes', explain: 'El valor es correcto pero en **radianes**. Se pide en grados.' },
        ],
    });
  }
  if (level === 4) {
    const kind = pick(['rampa', 'escalera', 'sombra'] as const);
    let L = 0, s = 0;
    do { L = rnd(5, 14); s = rndDec(1.5, L - 1.5, 1); } while (s / L < 0.2 || s / L > 0.95);
    if (kind === 'sombra') {
      const h = rnd(3, 12), sh = rndDec(2, 14, 1);
      const ans = atanDeg(h / sh);
      return mk('inverse', 4, {
        title: 'Altura del sol', statement: `Un poste de ${h} m proyecta una sombra de ${fmt(sh, 1)} m. ¿Con qué ángulo sobre el horizonte llegan los rayos del sol?`,
        data: [`Altura: ${h} m (opuesto)`, `Sombra: ${fmt(sh, 1)} m (adyacente)`], kind: 'numeric', answer: ans, unit: '°', tolerance: 0.06, answerHint: 'Grados con 1 decimal, calculadora en DEG.',
        figure: { type: 'right', thetaAt: 'A', labels: { a: `${h}`, b: fmt(sh, 1) } },
        hints: ['Conoces el lado opuesto y el adyacente al ángulo: la razón es la tangente.', '$\\theta = \\tan^{-1}\\!\\left(\\dfrac{\\text{altura}}{\\text{sombra}}\\right)$'],
        steps: [`$\\tan\\theta = \\dfrac{${h}}{${tex(sh, 1)}} \\approx ${tex(h / sh, 4)}$`, `$\\theta = \\tan^{-1}(${tex(h / sh, 4)}) \\approx ${tex(ans, 2)}°$`],
        mistakes: [
          { value: atanDeg(sh / h), label: 'Razón invertida', explain: 'Dividiste sombra entre altura. La tangente es **opuesto / adyacente**: altura entre sombra.' },
          { value: Math.atan(h / sh), label: 'Resultado en radianes', explain: 'La calculadora está en **RAD**. Cámbiala a **DEG**.' },
          { value: h / sh, label: 'Faltó la inversa', explain: 'Ese número es $\\tan\\theta$, no el ángulo. Aplica $\\tan^{-1}$.' },
        ],
      });
    }
    const isRamp = kind === 'rampa';
    const ans = isRamp ? asinDeg(s / L) : acosDeg(s / L);
    return mk('inverse', 4, {
      title: isRamp ? 'Inclinación de una rampa' : 'Ángulo de una escalera',
      statement: isRamp
        ? `Una rampa de ${L} m de largo sube ${fmt(s, 1)} m de altura. ¿Qué ángulo forma con el suelo?`
        : `Una escalera de ${L} m se apoya en un muro con su base a ${fmt(s, 1)} m de él. ¿Qué ángulo forma con el suelo?`,
      data: isRamp ? [`Largo: ${L} m (hipotenusa)`, `Altura: ${fmt(s, 1)} m (opuesto)`] : [`Escalera: ${L} m (hipotenusa)`, `Distancia al muro: ${fmt(s, 1)} m (adyacente)`],
      kind: 'numeric', answer: ans, unit: '°', tolerance: 0.06, answerHint: 'Grados con 1 decimal, calculadora en DEG.',
      figure: { type: 'right', thetaAt: 'A', labels: isRamp ? { a: fmt(s, 1), c: `${L}` } : { b: fmt(s, 1), c: `${L}` } },
      hints: [isRamp ? 'Conoces el opuesto y la hipotenusa: la razón es el seno.' : 'Conoces el adyacente y la hipotenusa: la razón es el coseno.', `$\\theta = \\${isRamp ? 'sin' : 'cos'}^{-1}\\!\\left(\\dfrac{${tex(s, 1)}}{${L}}\\right)$`],
      steps: [`$\\${isRamp ? 'sin' : 'cos'}\\theta = \\dfrac{${tex(s, 1)}}{${L}} \\approx ${tex(s / L, 4)}$`, `$\\theta = \\${isRamp ? 'sin' : 'cos'}^{-1}(${tex(s / L, 4)}) \\approx ${tex(ans, 2)}°$`],
      mistakes: [
        { value: isRamp ? acosDeg(s / L) : asinDeg(s / L), label: 'Seno ↔ coseno', explain: isRamp ? 'Usaste $\\cos^{-1}$. La altura es el lado **opuesto** al ángulo con el suelo: corresponde $\\sin^{-1}$.' : 'Usaste $\\sin^{-1}$. La distancia al muro es el lado **adyacente**: corresponde $\\cos^{-1}$.' },
        { value: atanDeg(s / L), label: 'Usaste tangente', explain: 'La tangente relaciona los dos catetos. Aquí uno de los datos es la **hipotenusa**.' },
        { value: isRamp ? Math.asin(s / L) : Math.acos(s / L), label: 'Resultado en radianes', explain: 'La calculadora está en **RAD**. Cámbiala a **DEG**.' },
        { value: s / L, label: 'Faltó la inversa', explain: 'Ese número es la razón, no el ángulo. Aplica la función inversa.' },
      ],
    });
  }
  // nivel 5: composición con un triángulo auxiliar
  const tr = pick(TRIPLES);
  const [a, b] = Math.random() < 0.5 ? [tr[0], tr[1]] : [tr[1], tr[0]];
  const c = tr[2];
  const ratio: Record<Fn3, [number, number]> = { sin: [a, c], cos: [b, c], tan: [a, b] };
  const outer = pick((['sin', 'cos', 'tan'] as const).filter((f) => f !== fn));
  const [n1, d1] = ratio[fn], [n2, d2] = ratio[outer];
  const [n3, d3] = ratio[(['sin', 'cos', 'tan'] as const).find((f) => f !== fn && f !== outer)!];
  return mk('inverse', 5, {
    title: 'Componer sin calculadora', statement: `Calcula el valor exacto de $\\${outer}\\!\\left(\\${fn}^{-1}\\tfrac{${n1}}{${d1}}\\right)$.`,
    data: [`$\\theta = \\${fn}^{-1}\\tfrac{${n1}}{${d1}}$ es un ángulo agudo`], kind: 'numeric', answer: n2 / d2, answerHint: 'Fracción (ej: 3/5) o decimal con 3 cifras.',
    hints: [`Llama $\\theta$ al ángulo de adentro: entonces $\\${fn}\\theta = \\tfrac{${n1}}{${d1}}$. Dibuja un triángulo rectángulo con esos lados.`, 'Encuentra el tercer lado con Pitágoras y lee la razón que te piden.'],
    steps: [`Sea $\\theta = \\${fn}^{-1}\\tfrac{${n1}}{${d1}}$, es decir $\\${fn}\\theta = \\tfrac{${n1}}{${d1}}$.`, `Triángulo: opuesto $${a}$, adyacente $${b}$, hipotenusa $${c}$ (porque $${a}^2 + ${b}^2 = ${c}^2$).`, `$\\${outer}\\theta = \\dfrac{${n2}}{${d2}} \\approx ${tex(n2 / d2, 4)}$`],
    mistakes: [
      { value: n1 / d1, label: 'No se cancelan', explain: `$\\${outer}$ y $\\${fn}^{-1}$ son funciones **distintas**: no se anulan. Solo $\\${fn}(\\${fn}^{-1}x) = x$.` },
      { value: d2 / n2, label: 'Razón invertida', explain: 'Tienes los lados correctos pero dividiste al revés.' },
      { value: n3 / d3, label: 'Otra razón', explain: `Ese es el valor de otra razón del mismo triángulo, no de $\\${outer}\\theta$.` },
    ],
  });
}

// ======================================================
// ECUACIONES TRIGONOMÉTRICAS
// ======================================================
function genEquations(level: Level): Problem {
  if (level === 1) {
    const fn = pick(['sin', 'cos'] as const);
    const [k, n] = pick([[0.5, 2], [1, 1], [-1, 1], [2, 0], [0.3, 2], [-0.8, 2], [1.5, 0], [-1.2, 0]] as const);
    const opts = ['Ninguna', '1', '2', 'Infinitas'];
    const correct = opts[n];
    const why: Record<string, string> = {
      Ninguna: `No hay solución solo cuando $|k| > 1$. Aquí $k = ${tex(k)}$ sí está entre $-1$ y $1$.`,
      1: 'Una única solución ocurre solo en los extremos $k = \\pm1$, donde la recta toca justo la cresta o el valle.',
      2: n === 1 ? `Con $k = ${tex(k)}$ la recta toca la curva en un solo punto (el extremo): las dos soluciones se funden en una.` : `$\\${fn}$ nunca vale $${tex(k)}$: su recorrido es $[-1, 1]$.`,
      Infinitas: 'Infinitas hay en **todos** los reales. En una sola vuelta, $[0°, 360°)$, la cantidad es finita.',
    };
    const wrong = opts.filter((o) => o !== correct);
    const { choices, answer, choiceExplain } = shuffleChoices(correct, wrong, wrong.map((o) => why[o]));
    return mk('equations', 1, {
      title: 'Contar soluciones', statement: `¿Cuántas soluciones tiene $\\${fn}\\,x = ${tex(k)}$ en $[0°, 360°)$?`, data: [`$k = ${tex(k)}$`, 'Una vuelta completa'],
      kind: 'choice', choices, answer, choiceExplain,
      hints: [`Imagina la recta horizontal $y = ${tex(k)}$ sobre la gráfica de $\\${fn}\\,x$: ¿cuántas veces la corta en una vuelta?`, `Recuerda que $-1 \\le \\${fn}\\,x \\le 1$.`],
      steps: [n === 0 ? `$|${tex(k)}| > 1$: fuera del recorrido de $\\${fn}$ → **ninguna**.` : n === 1 ? `$k = ${tex(k)}$ es un extremo: se alcanza una sola vez por vuelta → **1**.` : `$|${tex(k)}| < 1$: la recta corta la curva dos veces por vuelta → **2**.`],
    });
  }
  const fn = pick(['sin', 'cos', 'tan'] as const);
  const [t, , ref] = pick(NOTABLE3[fn]);
  if (level === 2) {
    const sols = { sin: 180 - ref, cos: 360 - ref, tan: 180 + ref };
    const ans = sols[fn];
    const sym = { sin: 'El seno se repite por simetría respecto del **eje Y**: $180° - \\theta$.', cos: 'El coseno se repite por simetría respecto del **eje X**: $360° - \\theta$.', tan: 'La tangente se repite cada **media vuelta**: $\\theta + 180°$.' };
    return mk('equations', 2, {
      title: 'La otra solución', statement: `Una solución de $\\${fn}\\,x = ${t}$ es $x = ${ref}°$. ¿Cuál es la **otra** solución en $[0°, 360°)$?`,
      data: [`$\\${fn}\\,${ref}° = ${t}$`, 'Intervalo: $[0°, 360°)$'], kind: 'numeric', answer: ans, unit: '°',
      hints: ['Busca en el círculo unitario otro punto con el mismo valor.', sym[fn]],
      steps: [sym[fn], `$x_2 = ${fn === 'sin' ? `180° - ${ref}°` : fn === 'cos' ? `360° - ${ref}°` : `${ref}° + 180°`} = ${ans}°$`],
      mistakes: (['sin', 'cos', 'tan'] as const).filter((f) => f !== fn).map((f) => ({ value: sols[f], label: `Regla ${f === 'tan' ? 'de la tangente' : `del ${FN_ES[f]}`}`, explain: `Esa regla es la de **${FN_ES[f]}**. ${sym[fn]}` })),
    });
  }
  if (level === 3) {
    const sols = fn === 'sin' ? [180 + ref, 360 - ref] : fn === 'cos' ? [180 - ref, 180 + ref] : [180 - ref, 360 - ref];
    const askMin = Math.random() < 0.5;
    const ans = askMin ? sols[0] : sols[1];
    const quad = fn === 'sin' ? 'III y IV' : fn === 'cos' ? 'II y III' : 'II y IV';
    return mk('equations', 3, {
      title: 'Valor negativo', statement: `Resuelve $\\${fn}\\,x = -${t}$ en $[0°, 360°)$ y entrega la solución **${askMin ? 'menor' : 'mayor'}**.`,
      data: [`Ángulo de referencia: $${ref}°$`, `$\\${fn}$ es negativo en los cuadrantes ${quad}`], kind: 'numeric', answer: ans, unit: '°',
      hints: [`Primero ignora el signo: $\\${fn}\\,${ref}° = ${t}$. Ese es el ángulo de **referencia**.`, `El ${FN_ES[fn]} es negativo en los cuadrantes ${quad}: construye ahí los ángulos con referencia $${ref}°$.`],
      steps: [`Referencia: $${ref}°$.`, `Cuadrantes ${quad}: $x = ${sols[0]}°$ y $x = ${sols[1]}°$.`, `La ${askMin ? 'menor' : 'mayor'} es $${ans}°$.`],
      mistakes: [
        { value: askMin ? sols[1] : sols[0], label: 'Es la otra', explain: `Ese ángulo también es solución, pero se pide la **${askMin ? 'menor' : 'mayor'}**.` },
        { value: ref, label: 'Ignoraste el signo', explain: `$${ref}°$ resuelve la ecuación con valor **positivo**. Con signo negativo cambian los cuadrantes.` },
        { value: fn === 'cos' ? 360 - ref : -ref, label: fn === 'cos' ? 'Cuadrante equivocado' : 'Fuera del intervalo', explain: fn === 'cos' ? 'En el IV cuadrante el coseno es **positivo**.' : `La calculadora entrega $-${ref}°$, que no está en $[0°, 360°)$. Súmale $360°$ y busca también la otra solución.` },
      ],
    });
  }
  if (level === 4) {
    const B = pick([2, 3, 4]);
    const per = (fn === 'tan' ? 180 : 360) / B;
    const count = 2 * B; // sen/cos: 2 por vuelta × B vueltas · tan: 1 por período, 2B períodos
    if (Math.random() < 0.5) {
      return mk('equations', 4, {
        title: 'Contar con frecuencia', statement: `¿Cuántas soluciones tiene $\\${fn}(${B}x) = ${t}$ en $[0°, 360°)$?`, data: [`$B = ${B}$`, `Período de $\\${fn}(${B}x)$: $${tex(per, 2)}°$`],
        kind: 'numeric', answer: count,
        hints: [`Con $u = ${B}x$, cuando $x$ da una vuelta $u$ da **${B}**.`, fn === 'tan' ? 'La tangente toma cada valor **una vez por período**. ¿Cuántos períodos caben en $360°$?' : 'En cada vuelta de $u$ hay 2 soluciones.'],
        steps: fn === 'tan'
          ? [`Período de $\\tan(${B}x)$: $\\dfrac{180°}{${B}} = ${tex(per, 2)}°$.`, `Una solución por período: $\\dfrac{360°}{${tex(per, 2)}°} = ${count}$ soluciones.`]
          : [`$x \\in [0°, 360°) \\Rightarrow u = ${B}x \\in [0°, ${360 * B}°)$: ${B} vueltas.`, `2 soluciones por vuelta × ${B} vueltas $= ${count}$.`],
        mistakes: fn === 'tan'
          ? [{ value: B, label: 'Período de la tangente', explain: 'La tangente se repite cada **180°**, no cada 360°: hay el doble de soluciones.' }, { value: 2, label: 'Olvidaste B', explain: `Eso vale para $\\tan x$. Con $${B}x$ el ángulo gira ${B} veces más rápido.` }]
          : [{ value: 2, label: 'Olvidaste B', explain: `Eso vale para $\\${fn}\\,x$. Con $${B}x$ el ángulo da ${B} vueltas: hay ${B} veces más soluciones.` }, { value: B, label: 'Faltó la segunda familia', explain: 'En cada vuelta hay **dos** ángulos con el mismo valor.' }],
      });
    }
    const ans = ref / B;
    return mk('equations', 4, {
      title: 'La primera solución positiva', statement: `¿Cuál es la **menor** solución positiva de $\\${fn}(${B}x) = ${t}$?`, data: [`$\\${fn}\\,${ref}° = ${t}$`, `$B = ${B}$`],
      kind: 'numeric', answer: ans, unit: '°', answerHint: 'En grados.',
      hints: [`Cambia de variable: $u = ${B}x$ y resuelve $\\${fn}\\,u = ${t}$.`, `El menor $u$ positivo es $${ref}°$. Luego $x = \\dfrac{u}{${B}}$.`],
      steps: [`$${B}x = ${ref}°$ (el menor ángulo positivo con ese valor).`, `$x = \\dfrac{${ref}°}{${B}} = ${tex(ans, 2)}°$`],
      mistakes: [
        { value: ref, label: 'Faltó dividir por B', explain: `$${ref}°$ es el valor de $${B}x$, no de $x$. Divide por ${B}.` },
        { value: ref * B, label: 'Multiplicaste por B', explain: `Para despejar $x$ de $${B}x = ${ref}°$ se **divide** por ${B}.` },
      ],
    });
  }
  // nivel 5: aplicación — ¿cuándo se alcanza una altura?
  const R = rnd(8, 20), H = R + rnd(2, 5), T = pick([24, 30, 36, 40, 60]);
  const frac = pick([-0.5, 0.5, 0.25, -0.25, 0.6, -0.6, 0.8]);
  const h0 = H - R * frac, w = 360 / T;
  const ans = acosDeg(frac) / w;
  return mk('equations', 5, {
    title: '¿Cuándo llego a esa altura?', statement: `En una rueda de la fortuna tu altura es $h(t) = ${H} - ${R}\\cos(${tex(w, 2)}°\\,t)$ metros, con $t$ en segundos y subiendo desde abajo en $t = 0$. ¿En qué instante alcanzas **por primera vez** los ${fmt(h0, 2)} m?`,
    data: [`$h(t) = ${H} - ${R}\\cos(${tex(w, 2)}°\\,t)$`, `Altura buscada: ${fmt(h0, 2)} m`, `Período: ${T} s`], kind: 'numeric', answer: ans, unit: 's', answerHint: '2 decimales, calculadora en DEG.',
    hints: ['Iguala $h(t)$ a la altura y **despeja el coseno** antes de usar la inversa.', `$\\cos(${tex(w, 2)}°\\,t) = \\dfrac{${H} - ${tex(h0, 2)}}{${R}}$. Luego $\\cos^{-1}$ y divide por $${tex(w, 2)}°$.`],
    steps: [`$${H} - ${R}\\cos(${tex(w, 2)}°\\,t) = ${tex(h0, 2)} \\Rightarrow \\cos(${tex(w, 2)}°\\,t) = ${tex(frac, 2)}$`, `$${tex(w, 2)}°\\,t = \\cos^{-1}(${tex(frac, 2)}) \\approx ${tex(acosDeg(frac), 2)}°$ (la primera vez es el ángulo principal).`, `$t = \\dfrac{${tex(acosDeg(frac), 2)}°}{${tex(w, 2)}°} \\approx ${tex(ans, 2)}$ s`],
    mistakes: [
      { value: acosDeg(frac), label: 'Faltó dividir', explain: `Ese es el **ángulo** girado. Para el tiempo divide por $${tex(w, 2)}°$ por segundo.` },
      { value: acosDeg(-frac) / w, label: 'Signo al despejar', explain: `Al pasar el término restando queda $\\cos(\\dots) = \\dfrac{${H} - h}{${R}}$, no $\\dfrac{h - ${H}}{${R}}$.` },
      { value: T - ans, label: 'Es la segunda vez', explain: 'Esa es la segunda vez que pasas por esa altura (al **bajar**). Se pide la primera.' },
      { value: Math.acos(frac) / w, label: 'Calculadora en radianes', explain: 'El modelo está en grados: usa **DEG**.' },
    ],
  });
}

// ======================================================
// ÁNGULO DOBLE Y ÁNGULO MITAD
// ======================================================
function genDouble(level: Level): Problem {
  if (level === 1) {
    const isSin = Math.random() < 0.5;
    const correct = isSin ? '$2\\sin\\theta\\cos\\theta$' : pick(['$\\cos^2\\theta - \\sin^2\\theta$', '$1 - 2\\sin^2\\theta$', '$2\\cos^2\\theta - 1$']);
    const wrong = isSin ? ['$2\\sin\\theta$', '$\\sin^2\\theta$', '$\\sin\\theta\\cos\\theta$'] : ['$2\\cos\\theta$', '$\\cos^2\\theta + \\sin^2\\theta$', '$1 - \\cos^2\\theta$'];
    const explain = isSin
      ? ['Duplicar el ángulo **no** duplica el seno: con $\\theta = 90°$ daría 2, imposible.', 'Eso es el seno **al cuadrado**, no el seno del doble.', 'Falta el **2**: $\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$. (Ese producto es la mitad.)']
      : ['Duplicar el ángulo **no** duplica el coseno: con $\\theta = 0°$ daría 2, imposible.', 'Esa suma vale siempre **1** (identidad fundamental). En $\\cos 2\\theta$ los cuadrados se **restan**.', 'Eso es $\\sin^2\\theta$. La forma correcta con un solo término es $1 - 2\\sin^2\\theta$ o $2\\cos^2\\theta - 1$.'];
    const { choices, answer, choiceExplain } = shuffleChoices(correct, wrong, explain);
    return mk('double', 1, {
      title: 'Reconocer la fórmula', statement: `¿A qué es igual $\\${isSin ? 'sin' : 'cos'}\\,2\\theta$?`, data: ['Identidad de ángulo doble'],
      kind: 'choice', choices, answer, choiceExplain,
      hints: ['Viene de la suma de ángulos con $\\beta = \\alpha$.', `Comprueba con $\\theta = ${isSin ? '45°$: $\\sin 90° = 1' : '60°$: $\\cos 120° = -\\tfrac12'}$.`],
      steps: [isSin ? '$\\sin(\\theta+\\theta) = \\sin\\theta\\cos\\theta + \\cos\\theta\\sin\\theta = 2\\sin\\theta\\cos\\theta$' : '$\\cos(\\theta+\\theta) = \\cos^2\\theta - \\sin^2\\theta$, que con $\\sin^2\\theta + \\cos^2\\theta = 1$ también se escribe $1 - 2\\sin^2\\theta$ o $2\\cos^2\\theta - 1$.'],
    });
  }
  if (level === 2) {
    const c = pick([0.6, 0.8, 0.28, 0.96, 0.2, 0.5, 0.9, 0.3]);
    const ans = 2 * c * c - 1;
    return mk('double', 2, {
      title: 'Coseno del doble', statement: `Si $\\cos\\theta = ${tex(c)}$, calcula $\\cos 2\\theta$.`, data: [`$\\cos\\theta = ${tex(c)}$`], kind: 'numeric', answer: ans, answerHint: '4 decimales.',
      hints: ['Usa la forma que solo necesita el coseno.', '$\\cos 2\\theta = 2\\cos^2\\theta - 1$'],
      steps: [`$\\cos 2\\theta = 2\\cdot(${tex(c)})^2 - 1 = 2\\cdot${tex(c * c, 4)} - 1 = ${tex(ans, 4)}$`, ans < 0 ? 'Sale negativo: $2\\theta$ pasa de $90°$.' : 'Sale positivo: $2\\theta$ sigue siendo agudo.'],
      mistakes: [
        { value: 2 * c, label: 'Doblaste el valor', explain: '$\\cos 2\\theta \\neq 2\\cos\\theta$. Duplicar el ángulo no duplica el coseno.' },
        { value: 1 - 2 * c * c, label: 'Fórmula del seno', explain: 'Usaste $1 - 2x^2$, que es la forma con **seno**. Con coseno es $2\\cos^2\\theta - 1$.' },
        { value: c * c, label: 'Solo elevaste al cuadrado', explain: '$\\cos^2\\theta$ no es $\\cos 2\\theta$: falta multiplicar por 2 y restar 1.' },
        { value: 2 * c * c + 1, label: 'Signo del 1', explain: 'El 1 va **restando**: $2\\cos^2\\theta - 1$.' },
      ],
    });
  }
  if (level === 3) {
    const t = pick([0.5, 2, 3, 0.25, 1.5, 0.2, 4]);
    const ans = (2 * t) / (1 - t * t);
    return mk('double', 3, {
      title: 'Tangente del doble', statement: `Si $\\tan\\theta = ${tex(t)}$, calcula $\\tan 2\\theta$.`, data: [`$\\tan\\theta = ${tex(t)}$`], kind: 'numeric', answer: ans, answerHint: 'Fracción o decimal con 3 cifras.',
      hints: ['$\\tan 2\\theta = \\dfrac{2\\tan\\theta}{1 - \\tan^2\\theta}$', 'Calcula numerador y denominador por separado. Cuidado con el signo del denominador.'],
      steps: [`Numerador: $2\\cdot${tex(t)} = ${tex(2 * t)}$`, `Denominador: $1 - ${tex(t)}^2 = ${tex(1 - t * t, 4)}$`, `$\\tan 2\\theta = \\dfrac{${tex(2 * t)}}{${tex(1 - t * t, 4)}} \\approx ${tex(ans, 4)}$${ans < 0 ? ' (negativa: $2\\theta$ es obtuso)' : ''}`],
      mistakes: [
        { value: 2 * t, label: 'Doblaste el valor', explain: '$\\tan 2\\theta \\neq 2\\tan\\theta$: falta dividir por $1 - \\tan^2\\theta$.' },
        { value: (2 * t) / (1 + t * t), label: 'Signo del denominador', explain: 'El denominador es $1 - \\tan^2\\theta$ (con **menos**).' },
        { value: (2 * t) / (t * t - 1), label: 'Denominador al revés', explain: 'Es $1 - \\tan^2\\theta$, no $\\tan^2\\theta - 1$: te cambió el signo.' },
      ],
    });
  }
  if (level === 4) {
    const q = pick([1, 2, 3] as const);
    const m = pick([0.28, 0.6, 0.8, 0.96, 0.5, 0.2]);
    const c = q === 1 ? m : -m;
    const fn = pick(['sin', 'cos'] as const);
    const range = ['', '0° < \\theta < 90°', '90° < \\theta < 180°', '180° < \\theta < 270°'][q];
    const halfRange = ['', '0°$ y $45°', '45°$ y $90°', '90°$ y $135°'][q];
    const sign = fn === 'cos' && q === 3 ? -1 : 1;
    const inside = fn === 'sin' ? (1 - c) / 2 : (1 + c) / 2;
    const ans = sign * Math.sqrt(inside);
    return mk('double', 4, {
      title: 'Ángulo mitad', statement: `Se sabe que $\\cos\\theta = ${tex(c)}$ y que $${range}$. Calcula $\\${fn}\\dfrac{\\theta}{2}$.`,
      data: [`$\\cos\\theta = ${tex(c)}$`, `$${range}$`], kind: 'numeric', answer: ans, answerHint: '4 decimales. Revisa el signo.',
      hints: [fn === 'sin' ? '$\\sin\\dfrac{\\theta}{2} = \\pm\\sqrt{\\dfrac{1 - \\cos\\theta}{2}}$' : '$\\cos\\dfrac{\\theta}{2} = \\pm\\sqrt{\\dfrac{1 + \\cos\\theta}{2}}$', `El signo lo decide dónde cae $\\theta/2$: aquí está entre $${halfRange}$.`],
      steps: [`$\\${fn}^2\\dfrac{\\theta}{2} = \\dfrac{1 ${fn === 'sin' ? '-' : '+'} ${texP(c)}}{2} = ${tex(inside, 4)}$`, `$\\theta/2$ está entre $${halfRange}$: ahí el ${FN_ES[fn]} es **${sign < 0 ? 'negativo' : 'positivo'}**.`, `$\\${fn}\\dfrac{\\theta}{2} = ${sign < 0 ? '-' : ''}\\sqrt{${tex(inside, 4)}} \\approx ${tex(ans, 4)}$`],
      mistakes: [
        { value: c / 2, label: 'Dividiste el coseno', explain: 'Partir el ángulo no parte el coseno: $\\cos\\dfrac{\\theta}{2} \\neq \\dfrac{\\cos\\theta}{2}$. Hace falta la fórmula con raíz.' },
        { value: Math.sqrt(fn === 'sin' ? (1 + c) / 2 : (1 - c) / 2), label: 'Signo dentro de la raíz', explain: 'El seno usa $1 - \\cos\\theta$ y el coseno usa $1 + \\cos\\theta$. Los intercambiaste.' },
        { value: -ans, label: 'Signo de la raíz', explain: `La raíz deja elegir $\\pm$. Con $\\theta/2$ entre $${halfRange}$, el ${FN_ES[fn]} es **${sign < 0 ? 'negativo' : 'positivo'}**.` },
        { value: inside, label: 'Faltó la raíz', explain: `Ese valor es $\\${fn}^2\\dfrac{\\theta}{2}$. Saca la **raíz cuadrada**.` },
      ],
    });
  }
  // nivel 5: aplicación — alcance de un lanzamiento
  const v = pick([10, 15, 20, 25, 30]), a = pick([15, 20, 25, 35, 40, 50, 55, 65, 70, 75]);
  const g = 9.8;
  const ans = (v * v * sinDeg(2 * a)) / g;
  return mk('double', 5, {
    title: 'Alcance de un lanzamiento', statement: `Un balón sale a ${v} m/s con un ángulo de $${a}°$ sobre el suelo. Su alcance es $R = \\dfrac{v^2\\sin 2\\theta}{g}$, con $g = 9{,}8\\ \\text{m/s}^2$. ¿A qué distancia cae?`,
    data: [`$v = ${v}$ m/s`, `$\\theta = ${a}°$`, '$g = 9{,}8$ m/s²'], kind: 'numeric', answer: ans, unit: 'm', answerHint: '2 decimales, calculadora en DEG.',
    hints: [`Primero el ángulo doble: $2\\theta = ${2 * a}°$.`, `$R = \\dfrac{${v}^2\\cdot\\sin ${2 * a}°}{9{,}8}$`],
    steps: [`$2\\theta = ${2 * a}°$ y $\\sin ${2 * a}° \\approx ${tex(sinDeg(2 * a), 4)}$`, `$R = \\dfrac{${v * v}\\cdot${tex(sinDeg(2 * a), 4)}}{9{,}8} \\approx ${tex(ans, 2)}$ m`, `Con $${90 - a}°$ caería en el mismo lugar: $\\sin ${2 * (90 - a)}° = \\sin ${2 * a}°$.`],
    mistakes: [
      { value: (v * v * sinDeg(a)) / g, label: 'Usaste sen θ', explain: 'La fórmula lleva el seno del **ángulo doble**: $\\sin 2\\theta$, no $\\sin\\theta$.' },
      { value: (v * v * 2 * sinDeg(a)) / g, label: '2 sen θ ≠ sen 2θ', explain: 'Multiplicaste el seno por 2. Hay que duplicar el **ángulo** antes de calcular el seno.' },
      { value: (v * sinDeg(2 * a)) / g, label: 'Faltó el cuadrado', explain: 'La velocidad va **al cuadrado**: $v^2$.' },
      { value: (v * v * Math.sin(2 * a)) / g, label: 'Calculadora en radianes', explain: 'El ángulo está en grados: usa **DEG**.' },
    ],
  });
}

// ======================================================
export const GENERATORS: Record<Category, (level: Level) => Problem> = {
  coords: genCoords, distance: genDistance, slope: genSlope, angles: genAngles, triangles: genTriangles,
  right: genRight, pythagoras: genPythagoras, sin: genRatio('sin'), cos: genRatio('cos'), tan: genRatio('tan'),
  soh: genSoh, solve: genSolve, unit: genUnit, identity: genIdentity, oblique: genOblique, graphs: genGraphs, sum: genSum,
  inverse: genInverse, equations: genEquations, double: genDouble,
};

export function generate(category: Category, level: Level): Problem {
  return GENERATORS[category](level);
}
