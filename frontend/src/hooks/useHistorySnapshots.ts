import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useHistorySnapshots - save + undo/redo for design editors.
 *
 * Owner's requirement (2026-10-26): an edited design must be saveable
 * so it does NOT snap back to the old style on reload, and stepping
 * back must be an explicit Undo (with Redo alongside).
 *
 * How it works, editor-agnostically:
 * - The editor describes its design as a JSON snapshot (snapshot()),
 *   knows how to restore one (apply()), and lists the state values
 *   that signal a design change (watch).
 * - Changes are recorded (debounced) onto an undo stack; Undo/Redo
 *   walk the stack by calling apply().
 * - Save writes the current snapshot to localStorage under
 *   storageKey; on mount, a saved snapshot is restored automatically,
 *   so the saved design survives reloads and revisits.
 * - Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z / Ctrl+Y work outside text fields.
 */

export interface HistorySnapshotOptions {
    storageKey: string;
    snapshot: () => any;
    apply: (snap: any) => void;
    watch: unknown[];
    debounceMs?: number;
    historyLimit?: number;
    /** Return a smaller snapshot for storage when the full one is too big (e.g. embedded images). */
    stripForSave?: (snap: any) => any;
}

export interface HistorySnapshots {
    undo: () => void;
    redo: () => void;
    save: () => 'full' | 'partial' | false;
    canUndo: boolean;
    canRedo: boolean;
    dirty: boolean;
    savedAt: number | null;
    saveNote: string | null;
}

const ser = (v: any): string => {
    try { return JSON.stringify(v) ?? ''; } catch { return ''; }
};

export function useHistorySnapshots(opts: HistorySnapshotOptions): HistorySnapshots {
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    const [saveNote, setSaveNote] = useState<string | null>(null);

    const optsRef = useRef(opts);
    optsRef.current = opts;
    const pastRef = useRef<any[]>([]);
    const futureRef = useRef<any[]>([]);
    const presentRef = useRef<any>(null);
    const applyingRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Mount: restore the saved design (if any) and seed the history with
    // whatever the editor then holds, so Undo can always return here.
    useEffect(() => {
        let initial = optsRef.current.snapshot();
        try {
            const raw = localStorage.getItem(optsRef.current.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.state) {
                    applyingRef.current = true;
                    optsRef.current.apply(parsed.state);
                    initial = parsed.state;
                    if (parsed.at) setSavedAt(parsed.at);
                    // The watch effect's next pass treats the applied
                    // state as the present rather than a new edit.
                    setTimeout(() => { applyingRef.current = false; }, 1200);
                }
            }
        } catch { /* storage unavailable or corrupt: start from defaults */ }
        presentRef.current = initial;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Record design changes onto the undo stack (debounced so a drag or
    // a burst of typing becomes one step).
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const snap = optsRef.current.snapshot();
            if (applyingRef.current) {
                // This change came from apply() (restore/undo/redo):
                // adopt it as the present without recording a step.
                presentRef.current = snap;
                applyingRef.current = false;
                return;
            }
            if (presentRef.current == null) { presentRef.current = snap; return; }
            if (ser(snap) === ser(presentRef.current)) return;
            pastRef.current.push(presentRef.current);
            const limit = optsRef.current.historyLimit ?? 60;
            if (pastRef.current.length > limit) pastRef.current.shift();
            presentRef.current = snap;
            futureRef.current = [];
            setCanUndo(true);
            setCanRedo(false);
            setDirty(true);
        }, opts.debounceMs ?? 350);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, opts.watch);

    const applySnap = useCallback((snap: any) => {
        applyingRef.current = true;
        presentRef.current = snap;
        optsRef.current.apply(snap);
        setDirty(true);
        // Safety net: if the applied state produces no watch change
        // (a no-op apply), don't leave the recorder muted.
        setTimeout(() => { applyingRef.current = false; }, 1200);
    }, []);

    const undo = useCallback(() => {
        if (!pastRef.current.length) return;
        const prev = pastRef.current.pop();
        futureRef.current.push(presentRef.current);
        applySnap(prev);
        setCanUndo(pastRef.current.length > 0);
        setCanRedo(true);
    }, [applySnap]);

    const redo = useCallback(() => {
        if (!futureRef.current.length) return;
        const next = futureRef.current.pop();
        pastRef.current.push(presentRef.current);
        applySnap(next);
        setCanRedo(futureRef.current.length > 0);
        setCanUndo(true);
    }, [applySnap]);

    const save = useCallback((): 'full' | 'partial' | false => {
        const snap = optsRef.current.snapshot();
        presentRef.current = snap;
        const write = (value: any) => localStorage.setItem(
            optsRef.current.storageKey,
            JSON.stringify({ at: Date.now(), state: value })
        );
        try {
            write(snap);
            setSavedAt(Date.now());
            setDirty(false);
            setSaveNote(null);
            return 'full';
        } catch {
            // Quota: retry with the editor's stripped snapshot if it has one.
            if (optsRef.current.stripForSave) {
                try {
                    write(optsRef.current.stripForSave(snap));
                    setSavedAt(Date.now());
                    setDirty(false);
                    setSaveNote('Saved without embedded images (too large for browser storage)');
                    return 'partial';
                } catch { /* fall through */ }
            }
            setSaveNote('Save failed — browser storage is full or unavailable');
            return false;
        }
    }, []);

    // Keyboard: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z / Ctrl+Y redo.
    // Skipped while typing so text fields keep their native undo.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            if (!(e.ctrlKey || e.metaKey)) return;
            const key = e.key.toLowerCase();
            if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
            else if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); redo(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [undo, redo]);

    return { undo, redo, save, canUndo, canRedo, dirty, savedAt, saveNote };
}
