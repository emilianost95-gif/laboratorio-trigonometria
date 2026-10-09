import { Component, type ReactNode } from 'react';
import { StoreProvider } from './store/store';
import { Layout } from './components/Layout';
import { Calculator, FloatingCalculator } from './components/Calculator';
import { Panel } from './components/ui';
import { Toaster } from './utils/toast';
import { useHashRoute } from './utils/hooks';
import { moduleById } from './data/modules';
import { Home } from './pages/Home';
import { ModulePage } from './pages/ModulePage';
import { FreeLab } from './pages/FreeLab';
import { Challenges } from './pages/Challenges';
import { Notebook } from './pages/Notebook';
import { Progress } from './pages/Progress';
import { RichText } from './components/Tex';

class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (this.state.error) return (
      <div className="rounded-xl border border-bad/40 bg-bad/5 p-5">
        <h2 className="font-semibold text-bad">Algo falló en esta sección</h2>
        <p className="mt-1 text-[14px] text-muted">Tu progreso está a salvo. Prueba volver al inicio o recargar la página.</p>
        <pre className="num mt-2 overflow-x-auto text-[12px] text-muted">{this.state.error.message}</pre>
      </div>
    );
    return this.props.children;
  }
}

function CalculatorPage() {
  return (
    <div className="space-y-5">
      <header>
        <div className="eyebrow">También disponible con el botón ∑ de arriba</div>
        <h1 className="text-[30px] font-semibold">Calculadora científica</h1>
      </header>
      <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Panel title="Calculadora" eyebrow="DEG / RAD"><Calculator /></Panel>
        <Panel title="Cómo usarla" eyebrow="Guía rápida">
          <ul className="space-y-2 text-[14.5px]">
            <li><RichText text="**DEG** interpreta los ángulos en grados; **RAD** en radianes. $\sin(30)$ da $0{,}5$ en DEG pero $-0{,}988$ en RAD: ¡el error más común en trigonometría!" /></li>
            <li><RichText text="Escribe con el teclado: «12*tan(35)», «sqrt(2)/2», «asin(0,5)», «2π». Acepta coma decimal y multiplicación implícita: «2sin30»." /></li>
            <li><RichText text="Las inversas ($\sin^{-1}$, $\cos^{-1}$, $\tan^{-1}$) devuelven un **ángulo** (en la unidad del modo). $\sin^{-1}$ y $\cos^{-1}$ solo aceptan valores entre $-1$ y $1$." /></li>
            <li><RichText text="**Ans** reutiliza el último resultado. Después de **=**, al pulsar un operador se continúa desde Ans." /></li>
            <li><RichText text="Paréntesis abiertos se cierran solos al calcular: «sin(30» funciona." /></li>
            <li><RichText text="$\tan(90°)$ muestra un aviso: no está definida porque $\cos 90° = 0$." /></li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Router() {
  const [route, go] = useHashRoute();
  let page: ReactNode;
  if (route === 'inicio') page = <Home go={go} />;
  else if (moduleById(route)) page = <ModulePage id={route} go={go} />;
  else if (route === 'lab') page = <FreeLab />;
  else if (route === 'desafios') page = <Challenges />;
  else if (route === 'cuaderno') page = <Notebook go={go} />;
  else if (route === 'calculadora') page = <CalculatorPage />;
  else if (route === 'progreso') page = <Progress go={go} />;
  else page = <Home go={go} />;
  return (
    <Layout route={route} go={go}>
      <ErrorBoundary resetKey={route}><div key={route} className="page-in">{page}</div></ErrorBoundary>
      <FloatingCalculator />
      <Toaster />
    </Layout>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Router />
    </StoreProvider>
  );
}
