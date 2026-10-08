# 🔬 Laboratorio de Matemáticas — Camino a la Trigonometría

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![KaTeX](https://img.shields.io/badge/KaTeX-fórmulas-329894)
![Tests](https://img.shields.io/badge/tests-22_unitarios_·_107_E2E-success)

![Laboratorio de Matemáticas](assets/cover.png)

Laboratorio interactivo para aprender trigonometría **desde cero**: del plano cartesiano a la ley del coseno y las gráficas de funciones. No es una página con texto: el estudiante arrastra puntos, cambia ángulos, registra mediciones y descubre las relaciones antes de ver la fórmula (**observar → experimentar → descubrir → formalizar**).

🌐 **Demo en vivo:** `https://emilianost95-gif.github.io/laboratorio-trigonometria/` *(disponible después de publicarlo, ver abajo)*

---

## ✨ Características

- **18 módulos** (0–17): diagnóstico, plano cartesiano, distancia, pendiente, ángulos, triángulos, triángulo rectángulo, Pitágoras (con demostración animada), seno, coseno, tangente, SOH CAH TOA, resolución de triángulos, círculo unitario, identidad fundamental, **ley del seno y del coseno (con caso ambiguo)** y **gráficas trigonométricas** y **suma de ángulos**.
- Cada módulo con 3 vistas: **Laboratorio** interactivo, **Modo profesor** (qué significa, por qué funciona, visualización, fórmula, ejemplo, experimento, ejercicios, desafío) y **Práctica**.
- **Generador procedural** de ejercicios: 17 categorías × 5 niveles, números distintos cada vez.
- **Detector de errores**: compara la respuesta con los errores típicos (seno↔coseno, grados/radianes, Pitágoras al revés, signos, despejes) y explica qué pasó antes de mostrar la solución.
- **Laboratorio libre** con todo conectado: ángulo → seno/coseno → triángulo → pendiente → tangente → ondas.
- **Modo examen** (sin pistas, nota 1,0–7,0 y revisión al final), calculadora científica **DEG/RAD**, cuaderno de laboratorio con fórmulas, progreso con XP, niveles y racha.
- Modo claro/oscuro, responsive (celular, tablet, notebook), accesible con teclado.
- Todo se guarda en el navegador (localStorage versionado y tolerante a datos corruptos).

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite 5 (+ `vite-plugin-singlefile` para un único `index.html`) |
| Estilos | Tailwind CSS 3 con tokens de color en variables CSS (tema claro/oscuro) |
| Fórmulas | KaTeX |
| Gráficos | SVG propio (plano cartesiano reutilizable con puntos arrastrables) |
| Pruebas | Vitest (matemática) + Playwright (end-to-end) |

## 🚀 Usarlo

**Sin instalar nada:** abre `docs/index.html` con doble clic. Es la app completa en un solo archivo.

**Para programar** (necesitas [Node.js LTS](https://nodejs.org/) instalado en Windows):

```bash
npm install
npm run dev          # abre http://localhost:5173
npm test             # pruebas de la matemática
npm run build:docs   # regenera docs/index.html después de cambiar el código
```

## 🌍 Publicarlo en GitHub Pages (desde el navegador)

1. En GitHub: **New repository** → nombre `laboratorio-trigonometria` → público → *Create*.
2. En el repo vacío: **Add file → Upload files** y arrastra **el contenido** de esta carpeta (sin `node_modules` si existiera). Commit.
3. **Settings → Pages** → *Source: Deploy from a branch* → Branch `main`, carpeta **`/docs`** → *Save*.
4. En 1–2 minutos queda en `https://emilianost95-gif.github.io/laboratorio-trigonometria/`.

> Cada vez que cambies el código: `npm run build:docs` y vuelve a subir `docs/index.html` (con **Upload files**, no "Create new file").

## 🧱 Arquitectura

```
src/
  math/            funciones puras: trig (valores exactos), geometry, solver (rectángulos),
                   oblique (ley del seno/coseno, caso ambiguo), calculator (parser sin eval)
  modules/         generators (ejercicios), checker (diagnóstico de errores), labs/ (18 módulos)
  visualizations/  Plane (plano SVG + primitivas), RightTriangleView, UnitCircle, MiniFigure
  components/      ui, Tex (KaTeX), ProblemCard, Practice, TeacherMode, Calculator, Layout
  pages/           Home, ModulePage, Diagnostic, FreeLab, Challenges, Notebook, Progress
  data/            módulos, contenido del modo profesor, diagnóstico
  services/        storage (localStorage versionado + respaldo)
  store/           estado global, progreso, niveles, desbloqueo
tests/             math.test.ts (unitarias) · e2e.py (Playwright)
docs/              build autocontenido para GitHub Pages
```

## ✅ Calidad verificada

- `sin²θ + cos²θ = 1` comprobado en 10 000 ángulos al azar (error máximo ≈ 1e-16).
- Solucionadores probados con **todas** las combinaciones de datos (rectángulos y oblicuángulos, incluido el caso ambiguo con 0, 1 y 2 soluciones).
- 3 400 ejercicios generados por prueba: la respuesta correcta siempre se acepta y ningún "error típico" coincide con ella.
- Modo examen con nota en escala 1,0–7,0 y revisión de errores.
- 107 pruebas end-to-end: todas las rutas y pestañas, arrastre, calculadora DEG/RAD, persistencia, recuperación de datos corruptos, sin desborde horizontal en 390/820/1280 px.

## 📚 Aprendizajes

- Diseñar un motor de ejercicios que no solo corrige sino que **explica el error**.
- Visualizaciones SVG con escala real y texto de tamaño constante en cualquier pantalla.
- Separar la matemática en funciones puras para poder probarla a fondo.
- Pedagogía aplicada: el estudiante descubre la regla antes de leerla.

## 👤 Autor

**Emiliano Santo Tomás** — desarrollador front-end
[Portafolio](https://emilianost95-gif.github.io/Portafolio-Emiliano-Santo-Tom%C3%A1s/) · [LinkedIn](https://www.linkedin.com/in/emiliano-santo-tom%C3%A1s-718489291) · [GitHub](https://github.com/emilianost95-gif)
