import { useState } from 'react';
import { MODULES, PRACTICE_GOAL } from '../data/modules';
import { AREA_NAMES, type Area } from '../data/diagnostic';
import { CATEGORY_NAMES, LEVEL_NAMES, type Category } from '../modules/types';
import { conceptStatus, levelInfo, LEVELS, useStore } from '../store/store';
import { exportState, importState, storageAvailable } from '../services/storage';
import { Badge, Button, Callout, Panel, Segmented, Toggle } from '../components/ui';
import { toast } from '../utils/toast';

export function Progress({ go }: { go: (r: string) => void }) {
  const { state, dispatch, setTheme } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [restoreTxt, setRestoreTxt] = useState('');
  const lv = levelInfo(state.stats.xp);
  const done = MODULES.filter((m) => state.modules[m.id]?.completed).length;
  const acc = state.stats.attempts ? state.stats.correct / state.stats.attempts : 0;
  const cats = Object.keys(CATEGORY_NAMES) as Category[];
  const mastered = cats.filter((c) => conceptStatus(state.concepts[c]) === 'dominado');
  const reinforce = cats.filter((c) => conceptStatus(state.concepts[c]) === 'reforzar');
  const diagWeak = state.diagnostic ? (Object.keys(AREA_NAMES) as Area[]).filter((a) => { const t = state.diagnostic!.byArea[a]; return t && t.correct < t.attempts; }) : [];
  const okStorage = storageAvailable();

  const copyBackup = async () => {
    try { await navigator.clipboard.writeText(exportState(state)); toast('Respaldo copiado: pégalo en otro navegador para restaurar'); }
    catch { setRestoreTxt(exportState(state)); toast('Copia el texto del recuadro manualmente', 'accent'); }
  };
  const restore = () => {
    const st = importState(restoreTxt);
    if (!st) { toast('Ese texto no es un respaldo válido', 'bad'); return; }
    dispatch({ type: 'replace', state: st });
    setRestoreTxt('');
    toast('Progreso restaurado');
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="eyebrow">Se guarda automáticamente en este navegador</div>
        <h1 className="text-[30px] font-semibold">Progreso</h1>
      </header>
      {!okStorage && <Callout tone="warn" title="Almacenamiento no disponible">Tu navegador está bloqueando el guardado local (modo privado o permisos). Puedes usar la app, pero el progreso se perderá al cerrar.</Callout>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel>
          <div className="eyebrow">Nivel actual · {lv.index}/{LEVELS.length}</div>
          <div className="font-display text-[22px] font-semibold">{lv.name}</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel2"><div className="h-full bg-accent" style={{ width: `${lv.progress * 100}%` }} /></div>
          <div className="num mt-1 text-[12px] text-muted">{lv.xp} XP {lv.next ? `/ ${lv.next}` : '(máximo)'}</div>
        </Panel>
        <Panel><div className="eyebrow">Módulos completados</div><div className="num text-[28px] font-semibold">{done}<span className="text-[15px] text-muted">/{MODULES.length}</span></div></Panel>
        <Panel><div className="eyebrow">Ejercicios resueltos</div><div className="num text-[28px] font-semibold">{state.stats.solved}</div><div className="num text-[12px] text-muted">{state.stats.firstTry} a la primera · {state.stats.hintsUsed} pistas</div></Panel>
        <Panel><div className="eyebrow">Precisión</div><div className="num text-[28px] font-semibold">{state.stats.attempts ? `${Math.round(acc * 100)} %` : '—'}</div><div className="num text-[12px] text-muted">{state.stats.correct}/{state.stats.attempts} intentos · racha {state.streak.current} d (mejor {state.streak.best})</div></Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Módulos" eyebrow={`Meta: ${PRACTICE_GOAL} ejercicios correctos por módulo`}>
          <ul className="space-y-1.5">
            {MODULES.map((m) => {
              const p = state.modules[m.id];
              const frac = m.id === 'm0' ? (p?.completed ? 1 : 0) : Math.min(1, (p?.practiceCorrect ?? 0) / PRACTICE_GOAL);
              return (
                <li key={m.id}>
                  <button type="button" onClick={() => go(m.id)} className="flex w-full items-center gap-3 rounded-md px-1 py-1 text-left hover:bg-panel2">
                    <span className="num w-6 text-[12px] text-muted">{m.n}</span>
                    <span className="min-w-0 flex-1 truncate text-[14px]">{m.title}</span>
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-panel2"><span className={`block h-full ${p?.completed ? 'bg-ok' : 'bg-accent'}`} style={{ width: `${frac * 100}%` }} /></span>
                    <span className="w-5 text-[12px]">{p?.completed ? <span className="text-ok">✓</span> : p?.visited ? '·' : ''}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
        <div className="space-y-4">
          <Panel title="Conceptos" eyebrow="Según tus respuestas">
            <div className="space-y-3 text-[14px]">
              <div>
                <div className="mb-1 font-medium text-ok">Dominados</div>
                <div className="flex flex-wrap gap-1.5">{mastered.length ? mastered.map((c) => <Badge key={c} tone="ok">{CATEGORY_NAMES[c]}</Badge>) : <span className="text-muted">Aún ninguno: se necesitan 3 aciertos con ≥ 80 % de precisión.</span>}</div>
              </div>
              <div>
                <div className="mb-1 font-medium text-warn">Por reforzar</div>
                <div className="flex flex-wrap gap-1.5">
                  {reinforce.map((c) => <Badge key={c} tone="warn">{CATEGORY_NAMES[c]}</Badge>)}
                  {diagWeak.map((a) => <Badge key={a} tone="warn">{AREA_NAMES[a]} (diagnóstico)</Badge>)}
                  {!reinforce.length && !diagWeak.length && <span className="text-muted">Nada pendiente por ahora.</span>}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="num w-full min-w-[320px] text-[12.5px]">
                  <thead><tr className="text-left text-muted"><th className="py-1 font-medium">Concepto</th><th className="font-medium">aciertos</th><th className="font-medium">precisión</th><th className="font-medium">estado</th></tr></thead>
                  <tbody>
                    {cats.filter((c) => state.concepts[c]).map((c) => {
                      const t = state.concepts[c];
                      return <tr key={c} className="border-t border-line"><td className="py-1 font-sans">{CATEGORY_NAMES[c]}</td><td>{t.correct}/{t.attempts}</td><td>{Math.round((t.correct / t.attempts) * 100)} %</td><td className="font-sans">{conceptStatus(t)}</td></tr>;
                    })}
                    {!Object.keys(state.concepts).length && <tr><td colSpan={4} className="py-2 font-sans text-muted">Resuelve ejercicios para ver tu mapa de conceptos.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
          <Panel title="Precisión por nivel" eyebrow="1 → 5">
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5].map((l) => {
                const t = state.stats.byLevel[l];
                const p = t ? t.correct / t.attempts : 0;
                return (
                  <div key={l} className="flex items-center gap-2 text-[13px]">
                    <span className="w-32 truncate">N{l} · {LEVEL_NAMES[l as 1]}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-panel2"><span className="block h-full bg-accent" style={{ width: `${p * 100}%` }} /></span>
                    <span className="num w-16 text-right text-muted">{t ? `${Math.round(p * 100)} % (${t.attempts})` : '—'}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Actividad reciente" eyebrow="Últimos ejercicios">
          {state.history.length ? (
            <ul className="max-h-72 space-y-1 overflow-y-auto scroll-thin text-[13.5px]">
              {[...state.history].reverse().slice(0, 25).map((h) => (
                <li key={h.id} className="flex items-center gap-2 border-b border-line py-1 last:border-0">
                  <span className={h.correct ? 'text-ok' : 'text-warn'}>{h.correct ? '✓' : '○'}</span>
                  <span className="min-w-0 flex-1 truncate">{h.title}</span>
                  <span className="num text-[11.5px] text-muted">{CATEGORY_NAMES[h.category as Category] ?? h.category} · N{h.level}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted">Sin actividad todavía.</p>}
        </Panel>
        <Panel title="Ajustes" eyebrow="Configuración">
          <div className="space-y-4 text-[14px]">
            <div className="flex flex-wrap items-center justify-between gap-2"><span>Tema</span><Segmented size="sm" value={state.settings.theme} onChange={setTheme} options={[{ value: 'system', label: 'Sistema' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]} /></div>
            <div className="flex flex-wrap items-center justify-between gap-2"><span>Unidad angular (calculadora)</span><Segmented size="sm" value={state.settings.angleMode} onChange={(v) => dispatch({ type: 'settings', patch: { angleMode: v } })} options={[{ value: 'DEG', label: 'DEG' }, { value: 'RAD', label: 'RAD' }]} /></div>
            <Toggle id="set-free" checked={state.settings.freeMode} onChange={(v) => dispatch({ type: 'settings', patch: { freeMode: v } })} label="Modo libre: abrir cualquier módulo sin seguir la ruta" />
            <div className="border-t border-line pt-3">
              <div className="mb-2 font-medium">Respaldo</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={copyBackup}>Copiar respaldo</Button>
              </div>
              <label htmlFor="restore" className="mt-2 block text-[12.5px] text-muted">Para restaurar, pega un respaldo aquí:</label>
              <textarea id="restore" value={restoreTxt} onChange={(e) => setRestoreTxt(e.target.value)} rows={2} className="num mt-1 w-full rounded-md border border-line bg-panel2 p-2 text-[11px]" />
              {restoreTxt && <Button size="sm" variant="primary" className="mt-1" onClick={restore}>Restaurar</Button>}
            </div>
            <div className="border-t border-line pt-3">
              {confirmReset ? (
                <div className="flex flex-wrap items-center gap-2"><span className="text-bad">¿Borrar todo el progreso? Las notas también se borran.</span><Button size="sm" variant="danger" onClick={() => { dispatch({ type: 'reset' }); setConfirmReset(false); toast('Progreso reiniciado'); }}>Sí, reiniciar</Button><Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>Cancelar</Button></div>
              ) : <Button size="sm" variant="danger" onClick={() => setConfirmReset(true)}>Reiniciar progreso</Button>}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
