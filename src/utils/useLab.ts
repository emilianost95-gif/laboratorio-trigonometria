import { useCallback, useRef } from 'react';
import { useStore } from '../store/store';
import type { NoteKind } from '../services/storage';
import { toast } from './toast';

/** Utilidades compartidas por los laboratorios: registrar interacción (con límite) y guardar en el cuaderno. */
export function useLab(moduleId: string) {
  const { dispatch, addNote } = useStore();
  const last = useRef(0);
  const act = useCallback(() => {
    const now = Date.now();
    if (now - last.current < 4000) return;
    last.current = now;
    dispatch({ type: 'labAction', module: moduleId });
  }, [dispatch, moduleId]);
  const save = useCallback((title: string, body: string, kind: NoteKind = 'resultado') => {
    addNote({ kind, title, body, module: moduleId });
    toast('Guardado en el cuaderno');
  }, [addNote, moduleId]);
  return { act, save };
}
