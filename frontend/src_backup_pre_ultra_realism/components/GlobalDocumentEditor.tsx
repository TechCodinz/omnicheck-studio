/**
 * GlobalDocumentEditor - Edit cloned documents with live preview
 */

import React, { useState, useCallback, useRef } from 'react';

type FieldType = 'text' | 'number' | 'date' | 'photo' | 'signature' | 'ssn' | 'ein' | 'currency' | 'select';

interface EditableField {
    id: string;
    name: string;
    label: string;
    type: FieldType;
    value: string;
    required: boolean;
    options?: string[];
    position: { x: number; y: number; width: number; height: number };
    style?: { fontSize?: number; fontWeight?: string; color?: string; textTransform?: string };
}

interface DocumentData {
    id: string;
    name: string;
    category: string;
    country: string;
    region?: string;
    fields: EditableField[];
    layout: { width: number; height: number; orientation: string; backgroundColor: string };
}

interface GlobalDocumentEditorProps {
    document?: DocumentData;
    onSave?: (doc: DocumentData) => void;
    onExport?: (format: 'pdf' | 'png') => void;
    theme?: 'light' | 'dark';
}

const TEMPLATES: Record<string, DocumentData> = {
    us_passport: {
        id: 'us_passport', name: 'US Passport', category: 'passport', country: 'United States',
        fields: [
            { id: 'f1', name: 'surname', label: 'Surname', type: 'text', value: '', required: true, position: { x: 140, y: 50, width: 180, height: 22 }, style: { textTransform: 'uppercase', fontWeight: 'bold' } },
            { id: 'f2', name: 'givenNames', label: 'Given Names', type: 'text', value: '', required: true, position: { x: 140, y: 80, width: 180, height: 22 }, style: { textTransform: 'uppercase' } },
            { id: 'f3', name: 'passportNo', label: 'Passport No.', type: 'text', value: '', required: true, position: { x: 140, y: 110, width: 120, height: 22 } },
            { id: 'f4', name: 'nationality', label: 'Nationality', type: 'text', value: 'UNITED STATES', required: true, position: { x: 140, y: 140, width: 150, height: 22 } },
            { id: 'f5', name: 'dob', label: 'Date of Birth', type: 'date', value: '', required: true, position: { x: 140, y: 170, width: 100, height: 22 } },
            { id: 'f6', name: 'sex', label: 'Sex', type: 'select', value: 'M', required: true, options: ['M', 'F', 'X'], position: { x: 260, y: 170, width: 50, height: 22 } },
            { id: 'f7', name: 'pob', label: 'Place of Birth', type: 'text', value: '', required: true, position: { x: 140, y: 200, width: 150, height: 22 } },
            { id: 'f8', name: 'issue', label: 'Date of Issue', type: 'date', value: '', required: true, position: { x: 140, y: 230, width: 100, height: 22 } },
            { id: 'f9', name: 'expiry', label: 'Date of Expiry', type: 'date', value: '', required: true, position: { x: 140, y: 260, width: 100, height: 22 } },
            { id: 'f10', name: 'photo', label: 'Photo', type: 'photo', value: '', required: true, position: { x: 15, y: 50, width: 110, height: 140 } },
            { id: 'f11', name: 'signature', label: 'Signature', type: 'signature', value: '', required: true, position: { x: 15, y: 200, width: 110, height: 40 } }
        ],
        layout: { width: 350, height: 380, orientation: 'portrait', backgroundColor: '#1a3a5c' }
    },
    ssn_card: {
        id: 'ssn_card', name: 'SSN Card', category: 'ssn_card', country: 'United States',
        fields: [
            { id: 'f1', name: 'name', label: 'Full Name', type: 'text', value: '', required: true, position: { x: 60, y: 70, width: 200, height: 28 }, style: { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' } },
            { id: 'f2', name: 'ssn', label: 'SSN', type: 'ssn', value: '', required: true, position: { x: 60, y: 110, width: 180, height: 32 }, style: { fontSize: 22, fontWeight: 'bold' } },
            { id: 'f3', name: 'signature', label: 'Signature', type: 'signature', value: '', required: true, position: { x: 60, y: 150, width: 150, height: 30 } }
        ],
        layout: { width: 320, height: 200, orientation: 'landscape', backgroundColor: '#E8E4D9' }
    },
    california_dl: {
        id: 'california_dl', name: 'California DL', category: 'drivers_license', country: 'United States', region: 'California',
        fields: [
            { id: 'f1', name: 'dlNumber', label: 'DL Number', type: 'text', value: '', required: true, position: { x: 130, y: 25, width: 140, height: 20 }, style: { fontWeight: 'bold' } },
            { id: 'f2', name: 'class', label: 'Class', type: 'select', value: 'C', required: true, options: ['A', 'B', 'C', 'M'], position: { x: 280, y: 25, width: 40, height: 20 } },
            { id: 'f3', name: 'lastName', label: 'Last Name', type: 'text', value: '', required: true, position: { x: 130, y: 50, width: 180, height: 18 }, style: { textTransform: 'uppercase', fontWeight: 'bold' } },
            { id: 'f4', name: 'firstName', label: 'First Name', type: 'text', value: '', required: true, position: { x: 130, y: 72, width: 120, height: 18 }, style: { textTransform: 'uppercase' } },
            { id: 'f5', name: 'address', label: 'Address', type: 'text', value: '', required: true, position: { x: 130, y: 94, width: 190, height: 32 } },
            { id: 'f6', name: 'dob', label: 'DOB', type: 'date', value: '', required: true, position: { x: 130, y: 132, width: 80, height: 18 } },
            { id: 'f7', name: 'sex', label: 'Sex', type: 'select', value: 'M', required: true, options: ['M', 'F', 'X'], position: { x: 220, y: 132, width: 30, height: 18 } },
            { id: 'f8', name: 'height', label: 'HGT', type: 'text', value: '', required: true, position: { x: 260, y: 132, width: 40, height: 18 } },
            { id: 'f9', name: 'eyes', label: 'Eyes', type: 'select', value: 'BRO', required: true, options: ['BLK', 'BLU', 'BRO', 'GRN', 'GRY', 'HAZ'], position: { x: 130, y: 154, width: 45, height: 18 } },
            { id: 'f10', name: 'exp', label: 'EXP', type: 'date', value: '', required: true, position: { x: 200, y: 154, width: 70, height: 18 } },
            { id: 'f11', name: 'photo', label: 'Photo', type: 'photo', value: '', required: true, position: { x: 10, y: 25, width: 105, height: 130 } },
            { id: 'f12', name: 'signature', label: 'Signature', type: 'signature', value: '', required: true, position: { x: 10, y: 160, width: 105, height: 30 } }
        ],
        layout: { width: 340, height: 210, orientation: 'landscape', backgroundColor: '#FFFFFF' }
    },
    uk_passport: {
        id: 'uk_passport', name: 'UK Passport', category: 'passport', country: 'United Kingdom',
        fields: [
            { id: 'f1', name: 'surname', label: 'Surname', type: 'text', value: '', required: true, position: { x: 140, y: 50, width: 180, height: 22 }, style: { textTransform: 'uppercase', fontWeight: 'bold' } },
            { id: 'f2', name: 'givenNames', label: 'Given Names', type: 'text', value: '', required: true, position: { x: 140, y: 80, width: 180, height: 22 } },
            { id: 'f3', name: 'passportNo', label: 'Passport No.', type: 'text', value: '', required: true, position: { x: 140, y: 110, width: 120, height: 22 } },
            { id: 'f4', name: 'nationality', label: 'Nationality', type: 'text', value: 'BRITISH CITIZEN', required: true, position: { x: 140, y: 140, width: 150, height: 22 } },
            { id: 'f5', name: 'dob', label: 'Date of Birth', type: 'date', value: '', required: true, position: { x: 140, y: 170, width: 100, height: 22 } },
            { id: 'f6', name: 'sex', label: 'Sex', type: 'select', value: 'M', required: true, options: ['M', 'F', 'X'], position: { x: 260, y: 170, width: 50, height: 22 } },
            { id: 'f7', name: 'pob', label: 'Place of Birth', type: 'text', value: '', required: true, position: { x: 140, y: 200, width: 150, height: 22 } },
            { id: 'f8', name: 'issue', label: 'Date of Issue', type: 'date', value: '', required: true, position: { x: 140, y: 230, width: 100, height: 22 } },
            { id: 'f9', name: 'expiry', label: 'Date of Expiry', type: 'date', value: '', required: true, position: { x: 140, y: 260, width: 100, height: 22 } },
            { id: 'f10', name: 'photo', label: 'Photo', type: 'photo', value: '', required: true, position: { x: 15, y: 50, width: 110, height: 140 } },
            { id: 'f11', name: 'signature', label: 'Signature', type: 'signature', value: '', required: true, position: { x: 15, y: 200, width: 110, height: 40 } }
        ],
        layout: { width: 350, height: 380, orientation: 'portrait', backgroundColor: '#8a1a34' }
    },
    german_id: {
        id: 'german_id', name: 'German ID', category: 'national_id', country: 'Germany',
        fields: [
            { id: 'f1', name: 'surname', label: 'Familienname', type: 'text', value: '', required: true, position: { x: 130, y: 35, width: 150, height: 20 }, style: { textTransform: 'uppercase', fontWeight: 'bold' } },
            { id: 'f2', name: 'givenNames', label: 'Vornamen', type: 'text', value: '', required: true, position: { x: 130, y: 58, width: 150, height: 20 } },
            { id: 'f3', name: 'idNumber', label: 'Ausweisnummer', type: 'text', value: '', required: true, position: { x: 130, y: 81, width: 120, height: 20 } },
            { id: 'f4', name: 'nationality', label: 'Staatsangehörigkeit', type: 'text', value: 'DEUTSCH', required: true, position: { x: 130, y: 104, width: 100, height: 20 } },
            { id: 'f5', name: 'dob', label: 'Geburtsdatum', type: 'date', value: '', required: true, position: { x: 130, y: 127, width: 90, height: 20 } },
            { id: 'f6', name: 'expiry', label: 'Gültig bis', type: 'date', value: '', required: true, position: { x: 130, y: 150, width: 90, height: 20 } },
            { id: 'f7', name: 'photo', label: 'Foto', type: 'photo', value: '', required: true, position: { x: 10, y: 30, width: 105, height: 130 } },
            { id: 'f8', name: 'signature', label: 'Unterschrift', type: 'signature', value: '', required: true, position: { x: 130, y: 173, width: 100, height: 25 } }
        ],
        layout: { width: 320, height: 210, orientation: 'landscape', backgroundColor: '#D4E7F0' }
    }
};

export const GlobalDocumentEditor: React.FC<GlobalDocumentEditorProps> = ({ document: initial, onSave, onExport, theme = 'light' }) => {
    const [activeTemplate, setActiveTemplate] = useState<string>('us_passport');
    const [doc, setDoc] = useState<DocumentData>(initial || TEMPLATES.us_passport);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const colors = { bg: theme === 'dark' ? '#111827' : '#F9FAFB', card: theme === 'dark' ? '#1F2937' : '#FFFFFF', text: theme === 'dark' ? '#FFF' : '#111827', textSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280', border: theme === 'dark' ? '#374151' : '#E5E7EB', primary: '#3B82F6', success: '#10B981' };

    const loadTemplate = (id: string) => { if (TEMPLATES[id]) { setDoc(TEMPLATES[id]); setActiveTemplate(id); setSelectedField(null); } };
    const updateField = (fieldId: string, value: string) => setDoc(prev => ({ ...prev, fields: prev.fields.map(f => f.id === fieldId ? { ...f, value } : f) }));

    const formatSSN = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 9); if (d.length >= 5) return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`; if (d.length >= 3) return `${d.slice(0, 3)}-${d.slice(3)}`; return d; };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
        const file = e.target.files?.[0];
        if (file) { const r = new FileReader(); r.onload = ev => updateField(fieldId, ev.target?.result as string); r.readAsDataURL(file); }
    };

    const handleExport = (fmt: 'pdf' | 'png') => { onExport?.(fmt); alert(`Exported as ${fmt.toUpperCase()}`); };
    const handleSave = () => { onSave?.(doc); alert('Saved!'); };

    const isComplete = doc.fields.filter(f => f.required).every(f => f.value);

    return (
        <div style={{ background: colors.bg, borderRadius: '16px', padding: '24px', minHeight: '600px' }}>
            <h2 style={{ margin: '0 0 4px', color: colors.text, fontSize: '20px', fontWeight: '700' }}>🌍 Global Document Editor</h2>
            <p style={{ margin: '0 0 20px', color: colors.textSecondary, fontSize: '13px' }}>Edit passports, IDs, SSN cards from any country</p>

            {/* Template Select */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {Object.entries(TEMPLATES).map(([id, t]) => (
                    <button key={id} onClick={() => loadTemplate(id)} style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', background: activeTemplate === id ? colors.primary : colors.card, color: activeTemplate === id ? '#FFF' : colors.text, border: `1px solid ${activeTemplate === id ? colors.primary : colors.border}`, fontSize: '12px', fontWeight: '500' }}>
                        {t.category === 'passport' ? '🛂' : t.category === 'ssn_card' ? '📋' : t.category === 'national_id' ? '🆔' : '🪪'} {t.name}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
                {/* Preview */}
                <div style={{ background: colors.card, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.border}` }}>
                    <h3 style={{ margin: '0 0 12px', color: colors.text, fontSize: '14px' }}>📄 Preview</h3>
                    <div style={{ background: doc.layout.backgroundColor, width: doc.layout.width, height: doc.layout.height, borderRadius: '8px', position: 'relative', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                        {doc.fields.map(f => (
                            <div key={f.id} onClick={() => setSelectedField(f.id)} style={{
                                position: 'absolute', left: f.position.x, top: f.position.y, width: f.position.width, height: f.position.height,
                                background: f.type === 'photo' ? (f.value ? `url(${f.value}) center/cover` : '#E5E7EB') : f.type === 'signature' ? (f.value ? `url(${f.value}) center/contain no-repeat` : '#F3F4F6') : 'transparent',
                                border: selectedField === f.id ? '2px solid #3B82F6' : '1px dashed rgba(255,255,255,0.3)', borderRadius: '2px', cursor: 'pointer',
                                fontSize: f.style?.fontSize || 11, fontWeight: f.style?.fontWeight || 'normal', color: f.style?.color || (doc.layout.backgroundColor === '#FFFFFF' || doc.layout.backgroundColor === '#E8E4D9' || doc.layout.backgroundColor === '#D4E7F0' ? '#000' : '#FFF'),
                                textTransform: (f.style?.textTransform as any) || 'none', display: 'flex', alignItems: 'center', paddingLeft: ['photo', 'signature'].includes(f.type) ? 0 : '4px', overflow: 'hidden'
                            }}>
                                {!['photo', 'signature'].includes(f.type) && (f.value || <span style={{ opacity: 0.5, fontSize: 10 }}>{f.label}</span>)}
                                {f.type === 'photo' && !f.value && <span style={{ margin: 'auto', fontSize: 20 }}>📷</span>}
                                {f.type === 'signature' && !f.value && <span style={{ margin: 'auto', fontSize: 9, color: '#999' }}>Sign</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fields */}
                <div style={{ background: colors.card, borderRadius: '12px', padding: '16px', border: `1px solid ${colors.border}`, maxHeight: '500px', overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 12px', color: colors.text, fontSize: '14px' }}>📝 Fields</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {doc.fields.map(f => (
                            <div key={f.id}>
                                <label style={{ display: 'block', color: colors.text, fontSize: '11px', fontWeight: '500', marginBottom: '3px' }}>{f.label}{f.required && <span style={{ color: '#EF4444' }}> *</span>}</label>
                                {f.type === 'select' ? (
                                    <select value={f.value} onChange={e => updateField(f.id, e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '12px' }}>
                                        {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : f.type === 'photo' ? (
                                    <>
                                        <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, f.id)} id={`p-${f.id}`} style={{ display: 'none' }} />
                                        <button onClick={() => document.getElementById(`p-${f.id}`)?.click()} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, cursor: 'pointer', fontSize: '12px' }}>{f.value ? '✅ Photo' : '📤 Upload'}</button>
                                    </>
                                ) : f.type === 'signature' ? (
                                    <div>
                                        <div style={{ border: `1px solid ${colors.border}`, borderRadius: '6px', height: '50px', background: '#FFF', marginBottom: '4px' }}>
                                            <canvas ref={canvasRef} width={280} height={48} style={{ cursor: 'crosshair' }}
                                                onMouseDown={() => setIsDrawing(true)}
                                                onMouseUp={() => { setIsDrawing(false); if (canvasRef.current) updateField(f.id, canvasRef.current.toDataURL()); }}
                                                onMouseMove={e => { if (!isDrawing || !canvasRef.current) return; const ctx = canvasRef.current.getContext('2d'); if (ctx) { const r = canvasRef.current.getBoundingClientRect(); ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke(); } }} />
                                        </div>
                                        <button onClick={() => { if (canvasRef.current) { canvasRef.current.getContext('2d')?.clearRect(0, 0, 280, 48); updateField(f.id, ''); } }} style={{ padding: '3px 6px', fontSize: '10px', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '4px', color: colors.textSecondary, cursor: 'pointer' }}>Clear</button>
                                    </div>
                                ) : (
                                    <input type={f.type === 'date' ? 'date' : 'text'} value={f.value} onChange={e => updateField(f.id, f.type === 'ssn' ? formatSSN(e.target.value) : e.target.value)} placeholder={f.label} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '12px' }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleExport('pdf')} style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, cursor: 'pointer', fontSize: '12px' }}>📄 PDF</button>
                    <button onClick={() => handleExport('png')} style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, cursor: 'pointer', fontSize: '12px' }}>🖼️ PNG</button>
                </div>
                <button onClick={handleSave} disabled={!isComplete} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: isComplete ? 'pointer' : 'not-allowed', background: isComplete ? colors.primary : colors.border, color: '#FFF', fontWeight: '600', fontSize: '13px' }}>💾 Save</button>
            </div>

            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: isComplete ? `${colors.success}15` : `${colors.border}50`, textAlign: 'center' }}>
                <span style={{ color: isComplete ? colors.success : colors.textSecondary, fontSize: '12px' }}>{isComplete ? '✅ Complete' : `⏳ ${doc.fields.filter(f => f.required && !f.value).length} required fields`}</span>
            </div>
        </div>
    );
};

export default GlobalDocumentEditor;
