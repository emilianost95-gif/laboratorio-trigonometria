import { useMemo, useState } from 'react';
import { useStore } from '../store/store';
import { moduleById } from '../data/modules';
import type { Note, NoteKind } from '../services/storage';
import { RichText } from '../components/Tex';
import { Badge, Button, Panel, Segmented } from '../components/ui';
import { toast } from '../utils/toast';

const KINDS: { value: NoteKind; label: string; tone: 'accent' | 'ok' | 'hyp' | 'ang' | 'adj' }[] = [
  { value: 'nota', label: 'Nota', tone: 'accent' },
  { value: 'resultado', label: 'Resultado', tone: 'adj' },
  { value: 'formula', label: 'Fórmula', tone: 'hyp' },
  { value: 'ejercicio', label: 'Ejercicio', tone: 'ang' },
  { value: 'descubrimiento', label: 'Descubrimiento', tone: 'ok' },
];
const kindInfo = (k: NoteKind) => KINDS.find((x) => x.value === k) ?? KINDS[0];

function NoteBody({ body }: { body: string }) {
  return <div className="space-y-1 text-[14.5px]">{body.split('\n').map((l, i) => (l.trim() ? <p key={i} className="overflow-x-auto"><RichText text={l} /></p> : <div key={i} className="h-1" />))}</div>;
}

function Editor({ initial, onSave, onCancel }: { initial?: Note; onSave: (n: { title: string; body: string; kind: NoteKind }) => void; onCancel?: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [kind, setKind] = useState<NoteKind>(initial?.kind ?? 'nota');
  const [preview, setPreview] = useState(false);
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (!title.trim() && !body.trim()) return; onSave({ title: title.trim() || 'Sin título', body, kind }); if (!initial) { setTitle(''); setBody(''); } }}>
      <div className="flex flex-wrap gap-2">
        <label htmlFor={`nt-${initial?.id ?? 'new'}`} className="sr-only">Título</label>
        <input id={`nt-${initial?.id ?? 'new'}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-panel2 px-3" />
        <select aria-label="Tipo" value={kind} onChange={(e) => setKind(e.target.value as NoteKind)} className="h-10 rounded-lg border border-line bg-panel2 px-2 text-[14px]">
          {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </div>
      {preview ? (
        <div className="min-h-[110px] rounded-lg border border-line bg-panel2/50 p-3">{body.trim() ? <NoteBody body={body} /> : <span className="text-muted">Nada que previsualizar.</span>}</div>
      ) : (
        <>
          <label htmlFor={`nb-${initial?.id ?? 'new'}`} className="sr-only">Contenido</label>
          <textarea id={`nb-${initial?.id ?? 'new'}`} value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder={'Escribe tu nota. Fórmulas entre signos $, por ejemplo: $\\sin^2\\theta + \\cos^2\\theta = 1$'} className="w-full rounded-lg border border-line bg-panel2 p-3 text-[14.5px]" />
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" size="sm">{initial ? 'Guardar cambios' : 'Agregar al cuaderno'}</Button>
        <Button size="sm" variant="ghost" onClick={() => setPreview(!preview)}>{preview ? 'Editar' : 'Vista previa'}</Button>
        {onCancel && <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <span className="text-[12px] text-muted">Admite fórmulas: <code className="num">$a^2+b^2=c^2$</code>, negritas: <code className="num">**texto**</code></span>
      </div>
    </form>
  );
}

export function Notebook({ go }: { go: (r: string) => void }) {
  const { state, dispatch, addNote } = useStore();
  const [filter, setFilter] = useState<'all' | NoteKind>('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const notes = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return state.notes
      .filter((n) => (filter === 'all' || n.kind === filter) && (!qq || n.title.toLowerCase().includes(qq) || n.body.toLowerCase().includes(qq)))
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updated - a.updated);
  }, [state.notes, filter, q]);

  const copyAll = async () => {
    const txt = state.notes.map((n) => `# ${n.title} [${kindInfo(n.kind).label}]\n${n.body}`).join('\n\n');
    try { await navigator.clipboard.writeText(txt); toast('Cuaderno copiado al portapapeles'); }
    catch { toast('No se pudo copiar: tu navegador bloqueó el portapapeles', 'bad'); }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Guardado en este navegador</div>
          <h1 className="text-[30px] font-semibold">Cuaderno de laboratorio</h1>
          <p className="mt-1 text-muted">Resultados, ejercicios, fórmulas, notas y descubrimientos. Los laboratorios tienen botones "Guardar en el cuaderno".</p>
        </div>
        {state.notes.length > 0 && <Button size="sm" variant="ghost" onClick={copyAll}>Copiar todo como texto</Button>}
      </header>

      <Panel title="Nueva entrada" eyebrow="Escribir"><Editor onSave={(n) => { addNote(n); toast('Nota agregada'); }} /></Panel>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: 'all', label: `Todo (${state.notes.length})` }, ...KINDS.map((k) => ({ value: k.value, label: `${k.label} (${state.notes.filter((n) => n.kind === k.value).length})` }))]} />
        <label htmlFor="nb-search" className="sr-only">Buscar</label>
        <input id="nb-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="h-9 w-full max-w-[240px] rounded-lg border border-line bg-panel px-3 text-[14px]" />
      </div>

      {notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-muted">
          {state.notes.length === 0 ? <>Tu cuaderno está vacío. Escribe una nota arriba o guarda un resultado desde cualquier laboratorio. <button type="button" className="text-accent underline" onClick={() => go('m7')}>Prueba con Pitágoras</button>.</> : 'Ninguna entrada coincide con el filtro.'}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {notes.map((n) => {
            const k = kindInfo(n.kind);
            const mod = n.module ? moduleById(n.module) : undefined;
            return (
              <article key={n.id} className="min-w-0 rounded-xl border border-line bg-panel p-4">
                {editing === n.id ? (
                  <Editor initial={n} onCancel={() => setEditing(null)} onSave={(p) => { dispatch({ type: 'noteUpdate', id: n.id, patch: p }); setEditing(null); toast('Cambios guardados'); }} />
                ) : (
                  <>
                    <header className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge tone={k.tone}>{k.label}</Badge>
                      {n.pinned && <Badge tone="ang">fijada</Badge>}
                      <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{n.title}</h3>
                    </header>
                    <NoteBody body={n.body} />
                    <footer className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line pt-2 text-[12px] text-muted">
                      <span>{new Date(n.updated).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {mod && <button type="button" className="underline hover:text-ink" onClick={() => go(mod.id)}>· {mod.title}</button>}
                      <span className="ml-auto flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'noteUpdate', id: n.id, patch: { pinned: !n.pinned } })}>{n.pinned ? 'Desfijar' : 'Fijar'}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(n.id)}>Editar</Button>
                        {confirmDel === n.id
                          ? <><Button size="sm" variant="danger" onClick={() => { dispatch({ type: 'noteDelete', id: n.id }); setConfirmDel(null); }}>Confirmar</Button><Button size="sm" variant="ghost" onClick={() => setConfirmDel(null)}>No</Button></>
                          : <Button size="sm" variant="ghost" onClick={() => setConfirmDel(n.id)}>Borrar</Button>}
                      </span>
                    </footer>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
