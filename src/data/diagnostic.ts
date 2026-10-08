export type Area = 'operaciones' | 'fracciones' | 'potencias' | 'raices' | 'ecuaciones' | 'geometria' | 'coordenadas';

export const AREA_NAMES: Record<Area, string> = {
  operaciones: 'Operaciones básicas',
  fracciones: 'Fracciones',
  potencias: 'Potencias',
  raices: 'Raíces',
  ecuaciones: 'Ecuaciones simples',
  geometria: 'Geometría básica',
  coordenadas: 'Coordenadas',
};

/** Repaso breve para cada área a reforzar. */
export const AREA_TIPS: Record<Area, string> = {
  operaciones: 'Prioridad: paréntesis → potencias → multiplicación/división → suma/resta. Y con signos: restar un negativo es sumar, $5 - (-3) = 8$.',
  fracciones: 'Para dividir fracciones se multiplica por la inversa: $\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b}\\cdot\\frac{d}{c}$. Una fracción es una división: $\\frac{3}{4} = 0{,}75$. Esto es clave porque **seno, coseno y tangente son fracciones**.',
  potencias: '$a^2 = a\\cdot a$ (no $2a$). Un negativo al cuadrado es positivo: $(-3)^2 = 9$, pero $-3^2 = -9$. Pitágoras y la distancia usan cuadrados todo el tiempo.',
  raices: '$\\sqrt{a}$ es el número que al cuadrado da $a$. $\\sqrt{a^2 + b^2} \\neq a + b$ (¡error muy común!). Se puede simplificar: $\\sqrt{50} = \\sqrt{25\\cdot 2} = 5\\sqrt2$.',
  ecuaciones: 'Despejar = deshacer operaciones en orden inverso. Si $\\frac{x}{5} = 0{,}6$, multiplica por 5: $x = 3$. Si $\\frac{5}{x} = 0{,}6$, la incógnita está abajo: $x = \\frac{5}{0{,}6}$. Así se despejan las razones trigonométricas.',
  geometria: 'Los ángulos de un triángulo suman $180°$. Un ángulo recto mide $90°$. Área del triángulo: $\\frac{b\\cdot h}{2}$.',
  coordenadas: 'Un punto $(x, y)$: primero horizontal (derecha +, izquierda −), luego vertical (arriba +, abajo −). El módulo 1 lo trabaja desde cero.',
};

export interface DiagQuestion { area: Area; q: string; options: string[]; answer: number; explain: string }

export const DIAGNOSTIC: DiagQuestion[] = [
  { area: 'operaciones', q: '¿Cuánto es $8 - 3 \\cdot 2$?', options: ['$10$', '$2$', '$13$', '$-2$'], answer: 1, explain: 'Primero la multiplicación: $3\\cdot2 = 6$; luego $8 - 6 = 2$.' },
  { area: 'operaciones', q: '¿Cuánto es $-4 - (-7)$?', options: ['$-11$', '$3$', '$-3$', '$11$'], answer: 1, explain: 'Restar un negativo es sumar: $-4 + 7 = 3$.' },
  { area: 'fracciones', q: '¿Cuánto es $\\frac{3}{4} + \\frac{1}{2}$?', options: ['$\\frac{4}{6}$', '$\\frac{5}{4}$', '$\\frac{4}{8}$', '$1$'], answer: 1, explain: 'Común denominador: $\\frac34 + \\frac24 = \\frac54$.' },
  { area: 'fracciones', q: '¿Cuánto es $\\frac{2}{3} \\div \\frac{4}{9}$?', options: ['$\\frac{8}{27}$', '$\\frac{3}{2}$', '$\\frac{2}{3}$', '$6$'], answer: 1, explain: 'Multiplica por la inversa: $\\frac23\\cdot\\frac94 = \\frac{18}{12} = \\frac32$.' },
  { area: 'potencias', q: '¿Cuánto es $(-5)^2$?', options: ['$-25$', '$-10$', '$25$', '$10$'], answer: 2, explain: '$(-5)\\cdot(-5) = 25$: menos por menos es más.' },
  { area: 'potencias', q: '¿Cuánto es $3^2 + 4^2$?', options: ['$49$', '$14$', '$25$', '$7$'], answer: 2, explain: '$9 + 16 = 25$ (¡no es $(3+4)^2 = 49$!).' },
  { area: 'raices', q: '¿Cuánto es $\\sqrt{144}$?', options: ['$72$', '$12$', '$14$', '$12^2$'], answer: 1, explain: '$12 \\cdot 12 = 144$.' },
  { area: 'raices', q: '¿Es cierto que $\\sqrt{9 + 16} = \\sqrt9 + \\sqrt{16}$?', options: ['Sí, ambos dan 7', 'No: el lado izquierdo da 5', 'Sí, ambos dan 5', 'Depende'], answer: 1, explain: '$\\sqrt{25} = 5$, pero $3 + 4 = 7$. La raíz **no** se reparte en una suma.' },
  { area: 'ecuaciones', q: 'Si $\\frac{x}{8} = 0{,}5$, ¿cuánto vale $x$?', options: ['$16$', '$0{,}0625$', '$4$', '$8{,}5$'], answer: 2, explain: 'Multiplica ambos lados por 8: $x = 0{,}5\\cdot8 = 4$.' },
  { area: 'ecuaciones', q: 'Si $\\frac{6}{x} = 0{,}3$, ¿cuánto vale $x$?', options: ['$1{,}8$', '$20$', '$2$', '$0{,}05$'], answer: 1, explain: 'La incógnita está abajo: $x = \\frac{6}{0{,}3} = 20$.' },
  { area: 'geometria', q: 'Un triángulo tiene ángulos de $90°$ y $35°$. ¿Cuánto mide el tercero?', options: ['$55°$', '$65°$', '$145°$', '$235°$'], answer: 0, explain: '$180° - 90° - 35° = 55°$.' },
  { area: 'geometria', q: '¿Cuál es el área de un triángulo de base 10 y altura 6?', options: ['$60$', '$16$', '$30$', '$8$'], answer: 2, explain: '$\\frac{10\\cdot6}{2} = 30$.' },
  { area: 'coordenadas', q: '¿En qué cuadrante está el punto $(-3, 5)$?', options: ['I', 'II', 'III', 'IV'], answer: 1, explain: '$x$ negativa (izquierda), $y$ positiva (arriba) → cuadrante II.' },
  { area: 'coordenadas', q: 'El punto $(4, -2)$ está…', options: ['4 a la derecha y 2 abajo del origen', '4 arriba y 2 a la izquierda', '4 a la izquierda y 2 arriba', '2 a la derecha y 4 abajo'], answer: 0, explain: 'Primero $x$ (horizontal): +4 a la derecha. Luego $y$: −2 hacia abajo.' },
];
