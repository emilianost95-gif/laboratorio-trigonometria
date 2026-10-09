import type { Category } from '../modules/types';

export interface ModuleMeta {
  id: string;
  n: number;
  title: string;
  glyph: string;
  summary: string;
  /** Categoría de ejercicios que se practica en el módulo. */
  practice?: Category;
  /** Pregunta guía: lo que el módulo responde. */
  question: string;
}

export const MODULES: ModuleMeta[] = [
  { id: 'm0', n: 0, title: 'Diagnóstico', glyph: '?', summary: 'Un test corto para saber desde dónde partir.', question: '¿Qué sé ya y qué necesito reforzar?' },
  { id: 'm1', n: 1, title: 'Plano cartesiano', glyph: 'xy', summary: 'Ejes, cuadrantes y cómo una pareja de números se vuelve un lugar.', practice: 'coords', question: '¿Cómo describo una posición con números?' },
  { id: 'm2', n: 2, title: 'Distancia entre puntos', glyph: 'd', summary: 'Δx, Δy y la primera aparición de Pitágoras.', practice: 'distance', question: '¿Qué tan lejos están dos puntos?' },
  { id: 'm3', n: 3, title: 'Pendiente y rectas', glyph: 'm', summary: 'Cuánto sube una recta por cada paso que avanza.', practice: 'slope', question: '¿Cómo mido la inclinación de una recta?' },
  { id: 'm4', n: 4, title: 'Ángulos', glyph: '∠', summary: 'Transportador virtual, grados y radianes.', practice: 'angles', question: '¿Cómo mido un giro?' },
  { id: 'm5', n: 5, title: 'Triángulos', glyph: '△', summary: 'Lados, ángulos, perímetro, área y clasificación.', practice: 'triangles', question: '¿Qué hace que un triángulo sea un triángulo?' },
  { id: 'm6', n: 6, title: 'Triángulo rectángulo', glyph: '⊿', summary: 'Opuesto, adyacente e hipotenusa: los nombres dependen de θ.', practice: 'right', question: '¿Cómo nombro los lados respecto de un ángulo?' },
  { id: 'm7', n: 7, title: 'Teorema de Pitágoras', glyph: 'c²', summary: 'Áreas que encajan: a² + b² = c², demostrado paso a paso.', practice: 'pythagoras', question: '¿Por qué a² + b² = c²?' },
  { id: 'm8', n: 8, title: 'Laboratorio de seno', glyph: 'sin', summary: 'Opuesto ÷ hipotenusa: una razón que depende solo del ángulo.', practice: 'sin', question: '¿Qué mide el seno?' },
  { id: 'm9', n: 9, title: 'Laboratorio de coseno', glyph: 'cos', summary: 'Adyacente ÷ hipotenusa: la "sombra" horizontal.', practice: 'cos', question: '¿Qué mide el coseno?' },
  { id: 'm10', n: 10, title: 'Laboratorio de tangente', glyph: 'tan', summary: 'Opuesto ÷ adyacente: la pendiente disfrazada.', practice: 'tan', question: '¿Por qué la tangente es una pendiente?' },
  { id: 'm11', n: 11, title: 'SOH CAH TOA', glyph: 'SOH', summary: 'Elegir la razón correcta sabiendo qué lados intervienen.', practice: 'soh', question: '¿Qué razón uso en cada caso?' },
  { id: 'm12', n: 12, title: 'Resolver triángulos', glyph: '⊾', summary: 'Solucionador paso a paso: datos → razón → resultado → comprobación.', practice: 'solve', question: '¿Cómo encuentro todo lo que falta?' },
  { id: 'm13', n: 13, title: 'Círculo trigonométrico', glyph: '○', summary: 'Radio 1: el coseno es x y el seno es y, para cualquier ángulo.', practice: 'unit', question: '¿Qué pasa más allá de 90°?' },
  { id: 'm14', n: 14, title: 'Identidad fundamental', glyph: '≡', summary: 'sin²θ + cos²θ = 1, siempre. Y por qué.', practice: 'identity', question: '¿Por qué sin²θ + cos²θ = 1 para todo θ?' },
  { id: 'm15', n: 15, title: 'Ley del seno y del coseno', glyph: '△⁺', summary: 'Trigonometría para cualquier triángulo, incluido el caso ambiguo.', practice: 'oblique', question: '¿Y si el triángulo no es rectángulo?' },
  { id: 'm16', n: 16, title: 'Gráficas trigonométricas', glyph: '∿', summary: 'Amplitud, período, desfase y desplazamiento: y = A·sen(B(x − C)) + D.', practice: 'graphs', question: '¿Cómo se ve una función trigonométrica y cómo se transforma?' },
  { id: 'm17', n: 17, title: 'Suma de ángulos', glyph: 'α+β', summary: 'sen(α + β), cos(α + β) y el ángulo doble, demostrados girando en el círculo.', practice: 'sum', question: '¿Por qué sen(α + β) no es sen α + sen β?' },
  { id: 'm18', n: 18, title: 'Funciones inversas', glyph: 'sin⁻¹', summary: 'Del valor al ángulo: arcoseno, arcocoseno y arcotangente, y por qué responden un solo ángulo.', practice: 'inverse', question: '¿Cómo recupero el ángulo si conozco su seno?' },
  { id: 'm19', n: 19, title: 'Ecuaciones trigonométricas', glyph: 'x=?', summary: 'Todas las soluciones de sen(Bx) = k: ángulo principal, simetría y período.', practice: 'equations', question: '¿Cuántos ángulos cumplen la misma condición?' },
  { id: 'm20', n: 20, title: 'Ángulo doble y mitad', glyph: '2θ', summary: 'sen 2θ, cos 2θ y θ/2 demostrados con áreas, más el alcance de un lanzamiento.', practice: 'double', question: '¿Por qué duplicar el ángulo no duplica el seno?' },
];

export const moduleById = (id: string) => MODULES.find((m) => m.id === id);
export const PRACTICE_GOAL = 3; // ejercicios correctos para completar un módulo
