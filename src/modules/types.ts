export type Category =
  | 'coords' | 'distance' | 'slope' | 'angles' | 'triangles' | 'right' | 'pythagoras'
  | 'sin' | 'cos' | 'tan' | 'soh' | 'solve' | 'unit' | 'identity' | 'oblique' | 'graphs' | 'sum' | 'inverse' | 'equations' | 'double';

export type Level = 1 | 2 | 3 | 4 | 5;

export const LEVEL_NAMES: Record<Level, string> = {
  1: 'Reconocimiento',
  2: 'Cálculo directo',
  3: 'Problemas',
  4: 'Aplicación',
  5: 'Desafío',
};

export const CATEGORY_NAMES: Record<Category, string> = {
  coords: 'Coordenadas',
  distance: 'Distancia',
  slope: 'Pendiente',
  angles: 'Ángulos',
  triangles: 'Triángulos',
  right: 'Triángulo rectángulo',
  pythagoras: 'Pitágoras',
  sin: 'Seno',
  cos: 'Coseno',
  tan: 'Tangente',
  soh: 'SOH CAH TOA',
  solve: 'Resolver triángulos',
  unit: 'Círculo unitario',
  identity: 'Identidad fundamental',
  oblique: 'Ley del seno y del coseno',
  graphs: 'Gráficas trigonométricas',
  sum: 'Suma de ángulos',
  inverse: 'Funciones inversas',
  equations: 'Ecuaciones trigonométricas',
  double: 'Ángulo doble y mitad',
};

/** Una respuesta equivocada "esperable" y por qué aparece. */
export interface Mistake { value: number; label: string; explain: string }

/** Figura opcional que acompaña al enunciado. */
export type Figure =
  | {
      type: 'right';
      /** Vértice donde está θ: 'A' (abajo-izquierda) o 'B' (arriba-derecha). */
      thetaAt: 'A' | 'B';
      thetaLabel?: string;
      /** Etiquetas de lados: a = vertical (BC), b = horizontal (AC), c = hipotenusa. */
      labels: { a?: string; b?: string; c?: string };
      ratio?: number; // alto/ancho del dibujo
    }
  | { type: 'points'; points: { name: string; x: number; y: number }[]; segment?: boolean };

export interface Problem {
  id: string;
  category: Category;
  level: Level;
  title: string;
  /** Texto con $TeX$ en línea y **negritas**. */
  statement: string;
  data: string[];
  kind: 'numeric' | 'choice';
  /** numeric: valor correcto · choice: índice de la opción correcta. */
  answer: number;
  choices?: string[];
  /** Explicación específica cuando se elige una opción incorrecta (índice → texto). */
  choiceExplain?: Record<number, string>;
  unit?: string;
  /** Consejo de formato: "redondea a 2 decimales", "puedes escribir √3/2"… */
  answerHint?: string;
  tolerance?: number;
  hints: string[];
  steps: string[];
  mistakes?: Mistake[];
  figure?: Figure;
  /** Concepto que se registra en el progreso (por defecto, la categoría). */
  concept?: Category;
}

export interface CheckResult {
  correct: boolean;
  parsed: number | null;
  /** Mensaje del diagnóstico de error (si se detecta uno). */
  diagnosis?: { label: string; explain: string };
  parseError?: string;
}
