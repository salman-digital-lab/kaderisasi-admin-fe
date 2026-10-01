import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import {
  saveTalentDraft,
  type TalentDraft,
} from "../../api/services/talent-assessment";

interface TalentDraftSession {
  draft: TalentDraft;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  conflict: boolean;
  update: (answers: number[], question: number) => void;
  flush: () => Promise<boolean>;
  latest: () => TalentDraft;
  hasPending: () => boolean;
}
export function useTalentDraft(initial: TalentDraft): TalentDraftSession {
  const [draft, setDraft] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const current = useRef(initial);
  const sequence = useRef(0);
  const savedSequence = useRef(0);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const mounted = useRef(true);
  const conflicted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const update = useCallback((answers: number[], question: number): void => {
    if (conflicted.current) return;
    current.current = {
      ...current.current,
      answers,
      current_question: question,
    };
    sequence.current++;
    setDraft(current.current);
    setDirty(true);
    setError(null);
  }, []);
  const flush = useCallback((): Promise<boolean> => {
    if (inFlight.current) return inFlight.current;
    if (conflicted.current) return Promise.resolve(false);
    const run = async (): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        while (savedSequence.current !== sequence.current) {
          const snapshot = current.current;
          const sentSequence = sequence.current;
          const saved = await saveTalentDraft(snapshot);
          // Keep edits made while saving; adopt only the acknowledged revision.
          current.current = {
            ...current.current,
            revision: saved.revision,
            updated_at: saved.updated_at,
          };
          savedSequence.current = sentSequence;
          if (!mounted.current) return true;
          setDraft(current.current);
          setDirty(savedSequence.current !== sequence.current);
        }
        return true;
      } catch (reason) {
        if (mounted.current) {
          const stale = isAxiosError(reason) && reason.response?.status === 409;
          conflicted.current = stale;
          setConflict(stale);
          setError(
            stale
              ? "Draf berubah di tab lain. Jawaban di layar ini belum tersimpan. Muat draf terbaru untuk melanjutkan."
              : "Jawaban belum tersimpan. Periksa koneksi, lalu coba simpan lagi.",
          );
        }
        return false;
      } finally {
        inFlight.current = null;
        if (mounted.current) setSaving(false);
      }
    };
    inFlight.current = Promise.resolve().then(run);
    return inFlight.current;
  }, []);
  useEffect(() => {
    if (!dirty || error || conflict) return;
    const timer = window.setTimeout(() => {
      void flush();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft, dirty, error, conflict, flush]);
  return {
    draft,
    dirty,
    saving,
    error,
    conflict,
    update,
    flush,
    latest: (): TalentDraft => current.current,
    hasPending: (): boolean => sequence.current !== savedSequence.current,
  };
}
