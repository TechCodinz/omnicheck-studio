import React from 'react';
import type { HistorySnapshots } from '../hooks/useHistorySnapshots';

/**
 * HistoryBar - the Save Design / Undo / Redo control strip shared by
 * every design editor (owner's requirement, 2026-10-26).
 */
export default function HistoryBar({ history, dark, label }: { history: HistorySnapshots; dark?: boolean; label?: string }) {
    const { undo, redo, save, canUndo, canRedo, dirty, savedAt, saveNote } = history;

    const btn = (enabled: boolean): React.CSSProperties => ({
        padding: '7px 14px',
        borderRadius: 8,
        border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : '#CBD5E1'}`,
        background: enabled
            ? (dark ? 'rgba(255,255,255,0.10)' : '#FFFFFF')
            : (dark ? 'rgba(255,255,255,0.03)' : '#F1F5F9'),
        color: enabled ? (dark ? '#F1F5F9' : '#0F172A') : (dark ? '#64748B' : '#94A3B8'),
        fontSize: 12,
        fontWeight: 600,
        cursor: enabled ? 'pointer' : 'not-allowed',
        whiteSpace: 'nowrap' as const
    });

    const status = saveNote
        ? saveNote
        : dirty
            ? 'Unsaved changes'
            : savedAt
                ? `Saved ${new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                : 'Not saved yet';

    return (
        <div
            data-history-bar
            style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                padding: '8px 10px', borderRadius: 10,
                background: dark ? 'rgba(20,22,29,0.92)' : '#F8FAFC',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#E2E8F0'}`
            }}
        >
            {label && (
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: dark ? '#94A3B8' : '#64748B', marginRight: 2 }}>
                    {label}
                </span>
            )}
            <button type="button" onClick={undo} disabled={!canUndo} style={btn(canUndo)} title="Undo the last design change (Ctrl+Z)">
                ↩ Undo
            </button>
            <button type="button" onClick={redo} disabled={!canRedo} style={btn(canRedo)} title="Redo the change you undid (Ctrl+Shift+Z)">
                ↪ Redo
            </button>
            <button
                type="button"
                onClick={() => save()}
                style={{
                    ...btn(true),
                    background: dark ? '#2563EB' : '#2563EB',
                    border: '1px solid #2563EB',
                    color: '#FFFFFF'
                }}
                title="Save this design — it will still be here when you come back, until you undo it"
            >
                💾 Save Design
            </button>
            <span style={{ fontSize: 11, color: dirty ? (dark ? '#FBBF24' : '#B45309') : (dark ? '#34D399' : '#047857') }}>
                {status}
            </span>
        </div>
    );
}
