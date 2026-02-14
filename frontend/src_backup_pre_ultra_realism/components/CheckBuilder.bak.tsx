import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fabric } from 'fabric';
import styled from 'styled-components';
import { bankSpecificTemplates, BankTemplate } from '../data/bankTemplates';
import { SecurityPatternEngine } from '../engines/SecurityPatternEngine';
import { SovereigntyEngine } from '../engines/SovereigntyEngine';
import { SignatureCaptureEngine } from '../engines/SignatureCaptureEngine';
import { BatchGenerationEngine, BatchProgress } from '../engines/BatchGenerationEngine';
import { LogoUploadEngine } from '../engines/LogoUploadEngine';
import { MICRComplianceEngine, MICRValidationResult } from '../engines/MICRComplianceEngine';
import { CheckBackEngine, EndorsementConfig } from '../engines/CheckBackEngine';
import { CheckRegisterEngine, CheckEntry } from '../engines/CheckRegisterEngine';
import { UltraRealisticCheckEngine } from '../engines/UltraRealisticCheckEngine';

// ============== ICONS (User Provided) ==============
const SecurityIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const DownloadIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);
const MailIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);
const SendIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

// ============== CONSTANTS & DATA ==============
const DPI = 300;
const CHECK_WIDTH_INCHES = 8.5;
const CHECK_HEIGHT_INCHES = 3.5;
const CANVAS_WIDTH = CHECK_WIDTH_INCHES * DPI;
const CANVAS_HEIGHT = CHECK_HEIGHT_INCHES * DPI;
const DISPLAY_SCALE = 0.35; // Adjusted for sidebar fitting

const checkStyles = ["Cashier's Check (Secure)", "Personal Check", "Business Check", "Payroll Check"];
const presets = ["Cashier's Check (Official)", "Business Standard", "Payroll Premium", "Personal Classic"];
const fonts = ["Times (Classic)", "Arial (Modern)", "Helvetica (Clean)", "Georgia (Elegant)", "Courier (Mono)"];

const TEMPLATE_LIST = [
    { id: 'CHASE', name: 'Chase Bank', color: '#117ACA', category: 'major' },
    { id: 'BOA', name: 'Bank of America', color: '#E31837', category: 'major' },
    { id: 'WELLS', name: 'Wells Fargo', color: '#CD1409', category: 'major' },
    { id: 'CITI', name: 'Citi Bank', color: '#003B70', category: 'major' },
    { id: 'US_BANK', name: 'US Bank', color: '#004685', category: 'major' },
    { id: 'PNC', name: 'PNC Bank', color: '#F47B20', category: 'major' },
    { id: 'TRUIST', name: 'Truist', color: '#240E3E', category: 'major' },
    { id: 'CASHIER', name: "Cashier's Check", color: '#2ecc71', category: 'specialty' },
    { id: 'PAYROLL', name: 'Payroll Check', color: '#f1c40f', category: 'specialty' },
    { id: 'VOID', name: 'Void Check', color: '#e74c3c', category: 'specialty' }
];

const TEMPLATE_MAP: Record<string, string> = {
    "Cashier's Check (Official)": 'CASHIER',
    "Business Standard": 'CHASE',
    "Payroll Premium": 'PAYROLL',
    "Personal Classic": 'CLASSIC_BLUE',
    "Chase Bank": 'CHASE',
    "Bank of America": 'BOA',
    "Wells Fargo": 'WELLS',
    "Citi Bank": 'CITI',
    "US Bank": 'US_BANK',
    "PNC Bank": 'PNC',
    "Truist": 'TRUIST'
};

const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

    const count = (n: number): string => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
        if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + count(n % 100);
        if (n < 1000000) return count(Math.floor(n / 1000)) + 'Thousand ' + count(n % 1000);
        return '';
    };

    const dollars = Math.floor(num);
    const cents = Math.round((num - dollars) * 100);
    let result = count(dollars) || 'Zero ';
    result += `and ${cents < 10 ? '0' + cents : cents}/100`;
    return result.trim().toUpperCase() + ' **************************************************************************************************************************';
};

const checkSchema = z.object({
    payeeName: z.string().min(1, "Payee required"),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    date: z.string().min(1, "Date required"),
    checkNumber: z.string().min(1, "Check # required"),
    memo: z.string().optional(),
    bankName: z.string().min(1, "Bank required"),
    accountHolderName: z.string().min(1, "Account holder required"),
    accountHolderAddress: z.string().optional(),
    accountNumber: z.string().min(4, "Account # required"),
    routingNumber: z.string().length(9, "Routing # 9 digits")
});
type CheckFormData = z.infer<typeof checkSchema>;

// ============== MAIN COMPONENT ==============
const CheckBuilder: React.FC = () => {
    // Logic extraction from original component
    const [selectedPreset, setSelectedPreset] = useState(presets[0]);
    const [selectedStyle, setSelectedStyle] = useState(checkStyles[0]);
    const [selectedFont, setSelectedFont] = useState(fonts[0]);
    const [backgroundTexture, setBackgroundTexture] = useState<'linen' | 'marble' | 'void' | 'plain'>('linen');
    const [securityPatternEnabled, setSecurityPatternEnabled] = useState(true);

    // Core Engine State
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [backCanvas, setBackCanvas] = useState<fabric.Canvas | null>(null);
    const [activeView, setActiveView] = useState<'front' | 'back'>('front');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('CASHIER'); // Default

    // Modal States
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);

    // Advanced Logic State
    const [micrValidation, setMicrValidation] = useState<MICRValidationResult | null>(null);
    const [registerEntries, setRegisterEntries] = useState<CheckEntry[]>([]);
    const [signatureCapture, setSignatureCapture] = useState<SignatureCaptureEngine | null>(null);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const backCanvasRef = useRef<HTMLCanvasElement>(null);
    const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
    const registerEngineRef = useRef<CheckRegisterEngine | null>(null);

    // Form Hook
    const { register: formRegister, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<CheckFormData>({
        resolver: zodResolver(checkSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            checkNumber: '9065',
            bankName: 'Bank of Omni',
            accountHolderName: 'Omni Corp International',
            accountHolderAddress: '1234 Innovation Dr, Tech City, CA 90210',
            routingNumber: '021000021',
            accountNumber: '1234567890',
            amount: 1234.56,
            payeeName: 'John Doe',
            memo: 'Contract Payment'
        }
    });

    const watchedValues = watch();

    // Initialize Fabric Canvas
    useEffect(() => {
        if (canvasRef.current && !canvas) {
            const fabricCanvas = new fabric.Canvas(canvasRef.current, {
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                backgroundColor: '#ffffff',
                preserveObjectStacking: true,
                selection: true
            });
            fabricCanvas.setZoom(DISPLAY_SCALE);
            setCanvas(fabricCanvas);

            // Initial load
            setTimeout(() => loadTemplate('CASHIER', fabricCanvas), 500);
        }
        return () => { canvas?.dispose(); };
    }, []);

    // MICR Validation Listener
    useEffect(() => {
        if (watchedValues.routingNumber?.length === 9) {
            const result = MICRComplianceEngine.validateMICR({
                routingNumber: watchedValues.routingNumber,
                accountNumber: watchedValues.accountNumber || '',
                checkNumber: watchedValues.checkNumber || '',
                amount: watchedValues.amount
            });
            setMicrValidation(result);
        }
    }, [watchedValues.routingNumber, watchedValues.accountNumber, watchedValues.checkNumber, watchedValues.amount]);

    // Template Loader (Reusing Logic)
    const loadTemplate = useCallback(async (templateId: string, fabricCanvas: fabric.Canvas) => {
        fabricCanvas.clear();
        const template = bankSpecificTemplates[templateId] || bankSpecificTemplates.GENERIC;
        const specs = template.specs;

        // 1. Background
        const bgRect = new fabric.Rect({
            left: 0, top: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
            fill: specs.colors.background || (backgroundTexture === 'marble' ? '#f5f5f0' : '#E8DCC8'),
            selectable: false, evented: false
        });
        fabricCanvas.add(bgRect);

        // 2. Realistic Border
        const outerBorder = new fabric.Rect({
            left: 10, top: 10, width: CANVAS_WIDTH - 20, height: CANVAS_HEIGHT - 20,
            fill: 'transparent', stroke: '#222', strokeWidth: 4, selectable: false
        });
        const innerBorder = new fabric.Rect({
            left: 20, top: 20, width: CANVAS_WIDTH - 40, height: CANVAS_HEIGHT - 40,
            fill: 'transparent', stroke: '#444', strokeWidth: 1, selectable: false
        });
        fabricCanvas.add(outerBorder, innerBorder);

        // 3. Texture Layer (Guilloche)
        if (securityPatternEnabled) {
            const guilloche = SecurityPatternEngine.generateCompleteSecurityLayer(
                CANVAS_WIDTH, CANVAS_HEIGHT,
                specs.colors.primary + '33',
                specs.colors.secondary + '33',
                { guilloche: true, fibonacciSpiral: true }
            );
            guilloche.set({ opacity: 0.15, selectable: false });
            fabricCanvas.add(guilloche);

            // Microprint Line
            for (let i = 0; i < 20; i++) {
                const line = new fabric.Line([50, 480 + (i * 20), CANVAS_WIDTH - 50, 480 + (i * 20)], {
                    stroke: 'rgba(0,0,0,0.02)', strokeWidth: 1, selectable: false
                });
                fabricCanvas.add(line);
            }
        }

        // 4. Secure Badge (Matching Screenshot)
        const secureBadge = new fabric.Group([
            new fabric.Rect({ width: 80, height: 80, fill: '#fff', stroke: '#333', strokeWidth: 1 }),
            new fabric.Text('🔒\nSECURE', { fontSize: 14, textAlign: 'center', top: 10, left: 10, fontWeight: 'bold' })
        ], { left: CANVAS_WIDTH / 2 - 40, top: 40, selectable: false });
        fabricCanvas.add(secureBadge);

        // 5. Watermark (Angled)
        const watermarkText = templateId === 'CASHIER' ? "CASHIER'S CHECK" : template.name.toUpperCase();
        const watermark = new fabric.Text(watermarkText, {
            left: CANVAS_WIDTH / 2, top: CANVAS_HEIGHT / 2,
            fontSize: 140, fontWeight: 'bold', fill: 'rgba(150, 150, 150, 0.08)',
            angle: -25, originX: 'center', originY: 'center', selectable: false
        });
        fabricCanvas.add(watermark);

        // 6. Content Elements (Draggable)
        addDraggableFields(fabricCanvas, specs, getValues());

        // 7. MICR Line
        addMICRZone(fabricCanvas);

        fabricCanvas.renderAll();
    }, [backgroundTexture, securityPatternEnabled, getValues]);

    // Field Generators
    const addDraggableFields = (canvas: fabric.Canvas, specs: any, values: any) => {
        const textStyle = { fontFamily: 'Arial', selectable: true };

        // Date
        canvas.add(new fabric.Text('DATE', { left: 1950, top: 120, fontSize: 16, fill: '#333', selectable: false, fontWeight: 'bold' }));
        canvas.add(new fabric.Line([1950, 190, 2450, 190], { stroke: '#333', strokeWidth: 1 }));
        canvas.add(new fabric.Text(values.date, { left: 1960, top: 145, fontSize: 32, ...textStyle }));

        // Amount Box (Matching Screenshot)
        canvas.add(new fabric.Rect({ left: 1900, top: 280, width: 500, height: 100, fill: 'white', stroke: '#333', strokeWidth: 2 }));
        canvas.add(new fabric.Text(`$`, { left: 1915, top: 305, fontSize: 36, fontWeight: 'bold' }));
        canvas.add(new fabric.Text(values.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }), { left: 1980, top: 305, fontSize: 44, fontWeight: 'bold', ...textStyle }));

        // Payee Line
        canvas.add(new fabric.Text('PAY TO THE ORDER OF', { left: 80, top: 320, fontSize: 20, fill: '#333', fontWeight: 'bold' }));
        canvas.add(new fabric.Line([320, 360, 1850, 360], { stroke: '#333', strokeWidth: 1 }));
        canvas.add(new fabric.Text(values.payeeName, { left: 340, top: 305, fontSize: 44, ...textStyle, fontWeight: 'bold' }));

        // Textual Amount Line
        canvas.add(new fabric.Text(numberToWords(values.amount), { left: 80, top: 400, fontSize: 24, ...textStyle, fontStyle: 'italic' }));
        canvas.add(new fabric.Line([80, 440, 2400, 440], { stroke: '#333', strokeWidth: 1 }));
        canvas.add(new fabric.Text('DOLLARS', { left: 2420, top: 410, fontSize: 20, fontWeight: 'bold' }));

        // Bank Info
        canvas.add(new fabric.Text(values.bankName, { left: 1000, top: 680, fontSize: 28, fontWeight: 'bold', fill: '#333', originX: 'center', fontFamily: 'Georgia' }));

        // Memo & Signature
        canvas.add(new fabric.Text('MEMO', { left: 80, top: 780, fontSize: 20, fontWeight: 'bold' }));
        canvas.add(new fabric.Line([160, 810, 800, 810], { stroke: '#333', strokeWidth: 1 }));
        canvas.add(new fabric.Text(values.memo || '', { left: 180, top: 765, fontSize: 28, ...textStyle }));

        canvas.add(new fabric.Line([1600, 810, 2450, 810], { stroke: '#333', strokeWidth: 1 }));
        canvas.add(new fabric.Text('AUTHORIZED SIGNATURE', { left: 1600, top: 820, fontSize: 16, fontWeight: 'bold' }));

        // Check Number (Top Right)
        canvas.add(new fabric.Text(values.checkNumber, { left: 2350, top: 60, fontSize: 36, fontWeight: 'bold', ...textStyle }));
    };

    const addMICRZone = (canvas: fabric.Canvas) => {
        const micrText = `T${getValues('routingNumber')}T ${getValues('accountNumber')}U ${getValues('checkNumber')}`;
        canvas.add(new fabric.Text(micrText, {
            left: 150, top: CANVAS_HEIGHT - 80, fontSize: 22, fontFamily: 'Courier New', selectable: false
        }));
    };

    // Preset Handler
    const handlePresetChange = (presetOrId: string) => {
        const tplId = TEMPLATE_MAP[presetOrId] || presetOrId;
        setSelectedTemplate(tplId);
        // Find name for the preset dropdown if possible
        const entry = TEMPLATE_LIST.find(t => t.id === tplId);
        if (entry) setSelectedPreset(entry.name);
        else setSelectedPreset(presetOrId);

        if (canvas) loadTemplate(tplId, canvas);
    };

    // Update Handler
    const handleUpdate = () => {
        if (canvas) loadTemplate(selectedTemplate, canvas);
    };

    return (
        <div style={{ display: "flex", width: "100%", minHeight: "100vh", background: "#1a1a2e", fontFamily: "'Segoe UI', sans-serif", color: "#eee", fontSize: 13 }}>

            {/* ===== LEFT SIDEBAR ===== */}
            <div style={{ width: 300, minWidth: 300, background: "#ffffff", color: "#333", borderRight: "1px solid #ddd", overflowY: "auto", display: "flex", flexDirection: "column" }}>

                {/* Header */}
                <div style={{ background: "#f4f6f9", padding: "14px 18px 10px", borderBottom: "1px solid #e0e0e0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <div style={{ width: 28, height: 28, background: "#2ecc71", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📋</div>
                        <span style={{ fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>OmniCheck Design Studio</span>
                    </div>
                </div>

                {/* Style & Aesthetics Section */}
                <div style={{ padding: "14px 18px 6px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e74c3c", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                        <span>🎨</span> Style & Aesthetics
                    </div>

                    <label style={labelStyle}>⚡ Quick Presets (Auto-Configure)</label>
                    <select value={selectedPreset} onChange={e => handlePresetChange(e.target.value)} style={selectStyle}>
                        {presets.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <label style={{ ...labelStyle, marginTop: 12 }}>Check Style</label>
                    <select value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)} style={selectStyle}>
                        {checkStyles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <label style={{ ...labelStyle, marginTop: 12 }}>Font</label>
                    <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} style={selectStyle}>
                        {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "10px 0" }} />

                {/* Premium Bank Templates (Restored) */}
                <div style={{ padding: "6px 18px 6px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e74c3c", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <span>🏛️</span> Premium Bank Styles
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                        {TEMPLATE_LIST.map(t => (
                            <div key={t.id} onClick={() => handlePresetChange(t.id)}
                                style={{
                                    display: 'flex', flexDirection: 'column', gap: 4, padding: '8px',
                                    border: selectedTemplate === t.id ? '2px solid #2ecc71' : '1px solid #eee',
                                    borderRadius: 6, cursor: 'pointer', background: selectedTemplate === t.id ? '#f0fdf4' : '#fff',
                                    transition: 'all 0.2s ease',
                                    boxShadow: selectedTemplate === t.id ? '0 2px 4px rgba(46,204,113,0.2)' : 'none'
                                }}>
                                <div style={{ width: '100%', height: 4, borderRadius: 2, background: t.color }}></div>
                                <span style={{ fontSize: 10, fontWeight: selectedTemplate === t.id ? 700 : 500, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "10px 0" }} />

                {/* Background & Texture Design */}
                <div style={{ padding: "6px 18px 6px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e74c3c", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <span>🖼️</span> Background & Texture Design
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <input type="checkbox" checked={securityPatternEnabled} onChange={e => { setSecurityPatternEnabled(e.target.checked); if (canvas) loadTemplate(selectedTemplate, canvas); }} style={{ width: 15, height: 15, accentColor: "#2ecc71", cursor: "pointer" }} />
                        <span style={{ fontSize: 12, color: "#555" }}>Enable Security Pattern Layer</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" checked={backgroundTexture === 'linen'} onChange={e => { setBackgroundTexture(e.target.checked ? 'linen' : 'plain'); if (canvas) loadTemplate(selectedTemplate, canvas); }} style={{ width: 15, height: 15, accentColor: "#2ecc71", cursor: "pointer" }} />
                        <span style={{ fontSize: 12, color: "#555" }}>Premium Linen Texture</span>
                    </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "6px 0" }} />

                {/* Form Logic (Check Details) - Added to match User's Logic Requirement */}
                <div style={{ padding: "6px 18px 6px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e74c3c", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <span>📝</span> Check Details
                    </div>
                    <form onChange={handleSubmit(handleUpdate)}>
                        <label style={labelStyle}>Pay To</label>
                        <input {...formRegister('payeeName')} style={inputStyle} />

                        <label style={labelStyle}>Amount ($)</label>
                        <input {...formRegister('amount', { valueAsNumber: true })} type="number" step="0.01" style={inputStyle} />

                        <label style={labelStyle}>Date</label>
                        <input {...formRegister('date')} type="date" style={inputStyle} />
                    </form>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />

                {/* Advanced Tools Section */}
                <div style={{ padding: "6px 18px 6px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e74c3c", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <span>🛠️</span> Advanced Tools
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <button style={toolBtnStyle} onClick={() => setShowSignatureModal(true)}>✍️ Sign Check</button>
                        <button style={toolBtnStyle} onClick={() => document.getElementById('logo-upload')?.click()}>🖼️ Add Logo</button>
                        <button style={toolBtnStyle} onClick={() => setShowBatchModal(true)}>📦 Batch Gen</button>
                        <button style={toolBtnStyle} onClick={() => setShowRegisterModal(true)}>📒 Register</button>
                    </div>
                    <input id="logo-upload" type="file" hidden accept="image/*" onChange={(e) => { /* Logic would go here */ }} />
                </div>

                <div style={{ padding: "6px 18px 6px" }}>
                    <label style={labelStyle}>Stamps</label>
                    <div style={{ display: "flex", gap: 5 }}>
                        <button style={stampBtnStyle} onClick={() => { /* Add stamp logic */ }}>🔴 VOID</button>
                        <button style={stampBtnStyle} onClick={() => { /* Add stamp logic */ }}>🔵 PAID</button>
                        <button style={stampBtnStyle} onClick={() => { /* Add stamp logic */ }}>🟢 COPY</button>
                    </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />

                {/* Action Buttons */}
                <div style={{ padding: "10px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <button style={actionBtnStyle} onClick={() => alert("Downloading PDF...")}>
                        <DownloadIcon /> Download Final PDF
                    </button>
                    <button style={actionBtnStyle} onClick={() => alert("Emailing payee...")}>
                        <MailIcon /> Email Payee
                    </button>
                    <button style={actionBtnStyle} onClick={() => alert("Sending via mail...")}>
                        <SendIcon /> Send via Mail
                    </button>
                </div>

                {/* Generate Final Check Button */}
                <div style={{ padding: "12px 18px 18px", marginTop: 'auto' }}>
                    <button onClick={() => { setIsGenerating(true); setTimeout(() => setIsGenerating(false), 2000); }}
                        style={{ width: "100%", padding: "13px 0", background: isGenerating ? "#27ae60" : "#2ecc71", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 700, letterSpacing: 1.2, cursor: "pointer", boxShadow: "0 3px 8px rgba(46,204,113,0.35)" }}>
                        {isGenerating ? "⏳ Generating..." : "GENERATE FINAL CHECK"}
                    </button>
                </div>
            </div>

            {/* ===== RIGHT SIDE: LIVE PREVIEW ===== */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#333" }}>
                {/* PDF Viewer-like Toolbar (Matching Screenshot) */}
                <div style={{
                    background: "#2c2c2c", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderBottom: "1px solid #444", color: "#ccc", fontSize: 12
                }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span title="Toggle Sidebar">📖</span>
                        <span title="Find">🔍</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#444', borderRadius: 4, padding: '2px 6px' }}>
                            <span style={{ cursor: 'pointer' }}>^</span>
                            <span style={{ cursor: 'pointer' }}>v</span>
                            <span style={{ margin: '0 4px', background: '#ccc', color: '#333', padding: '0 4px', borderRadius: 2 }}>{registerEntries.length > 0 ? registerEntries.length + 1 : 1}</span>
                            <span>of 2</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ cursor: 'pointer' }}>-</span>
                        <span style={{ cursor: 'pointer' }}>+</span>
                        <div style={{ background: '#444', borderRadius: 4, padding: '2px 8px' }}>Automatic Zoom ⌄</div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span>💬</span>
                        <span>📄</span>
                        <span>🖊️</span>
                        <span>Tx</span>
                        <span title="Print">🖨️</span>
                        <span title="More">⋮</span>
                    </div>
                </div>

                {/* Canvas Render Area */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "#525659", overflowY: "auto" }}>
                    <div style={{
                        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                        border: "1px solid #888",
                        position: 'relative' // For overlay
                    }}>
                        {/* FABRIC CANVAS HERE */}
                        <div>
                            <canvas ref={activeView === 'front' ? canvasRef : backCanvasRef} />
                            {/* Overlay Live Preview Text (Top Left like in screenshot) */}
                            <div style={{ position: 'absolute', top: -30, left: 0, color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#ff5f57' }}>👁️</span> Live Preview (Updated)
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RESTORED MODALS (Hidden by default) */}
            {showSignatureModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3>✍️ Draw Signature</h3>
                        <div style={{ border: '2px dashed #ddd', marginBottom: 10 }}><canvas ref={signatureCanvasRef} /></div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button onClick={() => setShowSignatureModal(false)} style={secondaryBtnStyle}>Cancel</button>
                            <button onClick={() => { /* Apply logic */ setShowSignatureModal(false); }} style={primaryBtnStyle}>Apply</button>
                        </div>
                    </div>
                </div>
            )}
            {showRegisterModal && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, width: 600 }}>
                        <h3>📒 Check Register</h3>
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                            <thead><tr style={{ background: '#f5f5f5', textAlign: 'left' }}><th>#</th><th>Date</th><th>Payee</th><th>Amount</th></tr></thead>
                            <tbody>
                                <tr><td>1001</td><td>2026-01-30</td><td>John Doe</td><td>$1,234.56</td></tr>
                                <tr><td>1002</td><td>2026-02-01</td><td>Office Depot</td><td>$450.00</td></tr>
                            </tbody>
                        </table>
                        <button onClick={() => setShowRegisterModal(false)} style={{ ...primaryBtnStyle, marginTop: 15, float: 'right' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const selectStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", borderRadius: 5, border: "1px solid #ddd", background: "#fff", color: "#333", fontSize: 13, cursor: "pointer" };
const labelStyle: React.CSSProperties = { fontSize: 11, color: "#888", fontWeight: 600, display: "block", marginBottom: 3 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", borderRadius: 5, border: "1px solid #ddd", marginBottom: 10, fontSize: 13 };
const actionBtnStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "#f4f6f9", border: "1px solid #e0e0e0", borderRadius: 5, color: "#444", fontSize: 13, cursor: "pointer" };
const viewTabStyle: React.CSSProperties = { border: 'none', padding: '4px 12px', borderRadius: 4, color: 'white', cursor: 'pointer', fontSize: 12 };
const toolBtnStyle: React.CSSProperties = { padding: "6px", border: "1px solid #ddd", borderRadius: 4, background: "#fff", fontSize: 12, cursor: "pointer", textAlign: "center" };
const stampBtnStyle: React.CSSProperties = { flex: 1, padding: "4px", border: "1px solid #ddd", borderRadius: 4, background: "#fff", fontSize: 10, cursor: "pointer", fontWeight: "bold" };

// Modal Styles
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 8, width: 400 };
const primaryBtnStyle: React.CSSProperties = { background: '#2ecc71', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' };
const secondaryBtnStyle: React.CSSProperties = { background: '#eee', color: '#333', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' };



export default CheckBuilder;
