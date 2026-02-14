/**
 * OmniCheck Design Studio - Advanced Check Builder v3.0
 * Full-featured check designer with all premium features
 */

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { fabric } from 'fabric';
import { bankSpecificTemplates } from '../data/bankTemplates';
import { CheckBackEngine } from '../engines/CheckBackEngine';
import { SignatureExtractorEngine } from '../engines/SignatureExtractorEngine';
import { SignatureCaptureEngine } from '../engines/SignatureCaptureEngine';
import { BorderlineEngine, BorderConfig } from './BorderlineEngine';
import UltimateCustomizationPanel from './UltimateCustomizationPanel';
import { processAiPrompt } from '../engines/AiDesignEngine';
import { useLicense } from '../contexts/LicenseContext';

// ============== CONSTANTS ==============
// Standard Business Check: 8.25" x 3.00" -> 825px x 300px (100px/inch base)
// Personal Check: 6.00" x 2.75" -> 600px x 275px
const DEFAULT_BUSINESS_WIDTH = 850; // 8.5" at 100 DPI
const DEFAULT_BUSINESS_HEIGHT = 350; // 3.5" at 100 DPI
const DEFAULT_PERSONAL_WIDTH = 600;
const DEFAULT_PERSONAL_HEIGHT = 275; // 6.00" x 2.75" at 100 DPI

const RAINBOW_COLORS = [
    '#FF0000', '#FF3300', '#FF6600', '#FF9900', '#FFCC00', '#FFFF00',
    '#CCFF00', '#99FF00', '#66FF00', '#33FF00', '#00FF00', '#00FF33',
    '#00FF66', '#00FF99', '#00FFCC', '#00FFFF', '#00CCFF', '#0099FF',
    '#0066FF', '#0033FF', '#0000FF', '#3300FF', '#6600FF', '#9900FF',
    '#CC00FF', '#FF00FF', '#FF00CC', '#FF0099', '#FF0066', '#FF0033'
];

// ============== PRESET DATA ==============
const CHECK_STYLES = [
    { id: 'cashier', name: "Cashier's Check (Secure)", icon: '🏦' },
    { id: 'personal', name: 'Personal Check', icon: '👤' },
    { id: 'business', name: 'Business Check (Professional)', icon: '💼' },
    { id: 'payroll', name: 'Payroll Check (Industrial)', icon: '💰' },
    { id: 'payroll_classic', name: 'Payroll Check (Classic)', icon: '🎁' },
    { id: 'payroll_karen', name: 'Karen Art Studio Payroll', icon: '🎨' },
    { id: 'echeck', name: 'eCheck Digital', icon: '💳' },
    { id: 'money_order', name: 'Money Order Style', icon: '📜' },
    { id: 'certified', name: 'Certified Check', icon: '✅' },
    { id: 'counter', name: 'Counter Check', icon: '🏪' },
    { id: 'bofa_classic', name: 'Bank of America Classic', icon: '🏦' },
    { id: 'bofa_v2', name: 'Bank of America Business (v2)', icon: '💼' },
    { id: 'us_treasury', name: 'U.S. Treasury Official', icon: '🏛️' }
];

const FONTS = [
    { id: 'times', name: 'Times (Classic)', family: 'Times New Roman, serif' },
    { id: 'arial', name: 'Arial (Modern)', family: 'Arial, sans-serif' },
    { id: 'courier', name: 'Courier (Typewriter)', family: 'Courier New, monospace' },
    { id: 'garamond', name: 'Garamond (Elegant)', family: 'Garamond, serif' },
    { id: 'georgia', name: 'Georgia (Readable)', family: 'Georgia, serif' },
    { id: 'helvetica', name: 'Helvetica (Clean)', family: 'Helvetica, Arial, sans-serif' }
];

const MICR_FONTS = [
    { id: 'e13b', name: 'Standard E-13B (US/UK)', family: '"MICR E13B Match", "MICR E-13B", monospace' },
    { id: 'cmc7', name: 'CMC-7 (European)', family: '"Glegoo", "Courier New", monospace' },
    { id: 'ocra', name: 'OCR-A (Digital Pro)', family: '"OCR A Extended", "OCR-A", monospace' },
    { id: 'modern', name: 'Modern Sans MICR', family: 'Arial, sans-serif' }
];

const TEXTURES = [
    { id: 'linen', name: 'Linen Weave', icon: '🧵' },
    { id: 'parchment', name: 'Parchment', icon: '📜' },
    { id: 'marble', name: 'Marble Swirl', icon: '🪨' },
    { id: 'security', name: 'Security Crosshatch', icon: '🔒' },
    { id: 'plain', name: 'Plain Paper', icon: '📄' },
    { id: 'cotton', name: 'Cotton Fiber', icon: '🌾' },
    { id: 'particles', name: 'Premium Particles', icon: '✨' },
    { id: 'rough', name: 'Rough Paper', icon: '📃' },
    { id: 'guilloche_bg', name: 'Guilloché Wave', icon: '🌀' },
    { id: 'blue_wave', name: 'Blue Wave (Safety)', icon: '🌊' },
    { id: 'prismatic', name: 'Prismatic Security', icon: '🌈' },
    { id: 'laser_security', name: 'Laser Security Moiré', icon: '🛰️' },
    { id: 'fluorescent_fibers', name: 'Fluorescent Fibers', icon: '🧬' },
    { id: 'toner_adhesion', name: 'Toner Adhesion Grain', icon: '🎞️' },
    { id: 'nano_optical', name: 'Nano-Optical Screen', icon: '💠' },
    { id: 'interference', name: 'Interference Pattern', icon: '📡' },
    { id: 'multi_tone', name: 'Multi-Tone Depth', icon: '🏔️' },
    { id: 'fiber_optic', name: 'Fiber Optic Security', icon: '✨' },
    { id: 'micro_embossed', name: 'Micro-Embossed Vellum', icon: '🎞️' },
    { id: 'geometric_diamond', name: 'Geometric Diamond', icon: '💎' },
    { id: 'circuit_board', name: 'FinTech Circuitry', icon: '🔌' },
    { id: 'royal_damask', name: 'Royal Damask', icon: '⚜️' },
    { id: 'digital_hive', name: 'Digital Hive', icon: '🐝' },
    { id: 'cloud_marble', name: 'Classic Cloud Marble', icon: '☁️' }
];

const PAPER_COLORS = [
    { id: 'cream', name: 'Classic Cream', color: '#f8f4ec' },
    { id: 'white', name: 'Bright White', color: '#ffffff' },
    { id: 'ivory', name: 'Ivory', color: '#fffff0' },
    { id: 'light_blue', name: 'Safety Blue', color: '#e8f4fc' },
    { id: 'light_green', name: 'Sage Green', color: '#f0f8f0' },
    { id: 'light_pink', name: 'Blush Pink', color: '#fff0f5' },
    { id: 'antique', name: 'Antique Gold', color: '#faebd7' },
    { id: 'lavender', name: 'Lavender Mist', color: '#f5f0ff' },
    { id: 'peach', name: 'Peach Glow', color: '#fff5ee' },
    { id: 'treasury_green', name: 'Treasury Green', color: '#e8f0e0' }
];

const SECURITY_FEATURES = [
    { id: 'microprint', name: 'Microprint Border', enabled: true },
    { id: 'guilloche', name: 'Guilloche Pattern', enabled: true },
    { id: 'void_pantograph', name: 'VOID Pantograph', enabled: true },
    { id: 'watermark', name: 'Watermark', enabled: true },
    { id: 'uv_markers', name: 'UV Security Markers', enabled: false },
    { id: 'holographic', name: 'Holographic Strip', enabled: false },
    { id: 'chemical_reactive', name: 'Chemical Reactive Paper', enabled: true },
    { id: 'rainbow_stripe', name: 'Rainbow Security Stripe', enabled: true },
    { id: 'thermochromic', name: 'Thermochromic Ink', enabled: true },
    { id: 'warning_band', name: 'Security Warning Band', enabled: true },
    { id: 'anti_copy_vdot', name: 'Anti-Copy V-Dot', enabled: true },
    { id: 'prismatic_column', name: 'Prismatic Security Column', enabled: true },
    { id: 'microprint_sig', name: 'Microprint Signature Line', enabled: true },
    { id: 'cpsa_padlock', name: 'CPSA Padlock Icon', enabled: true }
];

// SOPHISTICATED NON-BANK TEMPLATES (Premium depositable designs)
const PREMIUM_TEMPLATES = [
    { id: 'classic_elegant', name: 'Classic Elegant', colors: { primary: '#2c3e50', secondary: '#34495e', accent: '#c9a227', background: '#fdfbf7' } },
    { id: 'executive_gold', name: 'Executive Gold', colors: { primary: '#8b6914', secondary: '#5d4e37', accent: '#d4af37', background: '#fffef8' } },
    { id: 'royal_blue', name: 'Royal Blue', colors: { primary: '#1a3a6e', secondary: '#4169e1', accent: '#ffd700', background: '#f8faff' } },
    { id: 'corporate_grey', name: 'Corporate Grey', colors: { primary: '#2f4f4f', secondary: '#708090', accent: '#b8860b', background: '#f5f5f5' } },
    { id: 'emerald_prestige', name: 'Emerald Prestige', colors: { primary: '#006400', secondary: '#228b22', accent: '#ffd700', background: '#f8fff8' } },
    { id: 'burgundy_classic', name: 'Burgundy Classic', colors: { primary: '#722f37', secondary: '#8b0000', accent: '#daa520', background: '#fffaf5' } },
    { id: 'midnight_premium', name: 'Midnight Premium', colors: { primary: '#191970', secondary: '#000080', accent: '#c0c0c0', background: '#f5f5ff' } },
    { id: 'bronze_heritage', name: 'Bronze Heritage', colors: { primary: '#8b4513', secondary: '#a0522d', accent: '#cd7f32', background: '#faf5f0' } },
    { id: 'ultra_obsidian', name: 'Ultra Prestige Obsidian', colors: { primary: '#000000', secondary: '#434343', accent: '#ff0000', background: '#f9f9f9' } },
    { id: 'ultra_sapphire', name: 'Ultra Prestige Sapphire', colors: { primary: '#0f0c29', secondary: '#302b63', accent: '#24243e', background: '#fbfcff' } },
    { id: 'ultra_amethyst', name: 'Ultra Prestige Amethyst', colors: { primary: '#4b1248', secondary: '#f0c27b', accent: '#e8cbc0', background: '#fffafa' } },
    { id: 'ultra_crimson', name: 'Ultra Prestige Crimson', colors: { primary: '#870000', secondary: '#190a05', accent: '#ff4b2b', background: '#fffcfc' } },
    { id: 'ultra_diamond', name: 'Ultra Prestige Diamond', colors: { primary: '#202020', secondary: '#777777', accent: '#00d2ff', background: '#ffffff' } },
    { id: 'corporate_safety', name: 'Corporate Safety (Blue)', colors: { primary: '#0055a4', secondary: '#003366', accent: '#00a0e9', background: '#f0f8ff' } },
    { id: 'us_treasury', name: 'U.S. Treasury / Stimulus', colors: { primary: '#1e3932', secondary: '#2d5a27', accent: '#d4af37', background: '#f4f8f0' } },
    { id: 'chime_pro', name: 'Chime / Digital Pro', colors: { primary: '#24c25f', secondary: '#000000', accent: '#24c25f', background: '#ffffff' } },
    { id: 'credit_union_classic', name: 'Credit Union Classic', colors: { primary: '#003b71', secondary: '#00254b', accent: '#fdb913', background: '#fbfcff' } },
    { id: 'varo_style', name: 'Varo / Modern Neo', colors: { primary: '#5c2d91', secondary: '#411e64', accent: '#ff00ff', background: '#fcf8ff' } },
    { id: 'prepaid_gold', name: 'Prepaid Gold Card', colors: { primary: '#111111', secondary: '#333333', accent: '#ffd700', background: '#fffef0' } }
];

const BANK_TEMPLATES = [
    ...PREMIUM_TEMPLATES,
    ...Object.entries(bankSpecificTemplates).slice(0, 15).map(([id, template]) => ({
        id,
        name: template.name,
        colors: template.specs.colors
    }))
];

const BACK_SIDE_STYLES = [
    { id: 'standard', name: 'Standard (Personal)', icon: '📄' },
    { id: 'mobile', name: 'Mobile Deposit', icon: '📱' },
    { id: 'atm', name: 'ATM / Branch Deposit', icon: '🏦' },
    { id: 'business', name: 'Corporate / Business', icon: '🏢' }
];

const HANDWRITING_STYLES = [
    { id: 'none', name: 'Standard (Typed)', icon: '⌨️' },
    { id: 'ballpoint', name: 'Ballpoint Pen', icon: '🖊️' },
    { id: 'fountain', name: 'Fountain Pen', icon: '🖋️' },
    { id: 'felt_tip', name: 'Felt Tip', icon: '🖍️' },
    { id: 'cursive', name: 'Cursive Script', icon: '✒️' },
    { id: 'stephanie_lacey', name: 'Stephanie Lacey', icon: '👑' }
];

// --- STYLES (Professional Studio — Light Sidebar + Dark Canvas) ---

const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#1a1d23',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
};

const sidebarStyle: React.CSSProperties = {
    width: '290px',
    minWidth: '290px',
    background: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 16px rgba(0,0,0,0.08)',
    zIndex: 10
};

const headerStyle: React.CSSProperties = {
    padding: '16px 18px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
    color: 'white'
};

const sectionStyle: React.CSSProperties = {
    borderBottom: '1px solid #F1F5F9'
};

const sectionHeaderStyle: React.CSSProperties = {
    padding: '11px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: '#FAFBFC',
    fontWeight: '600',
    fontSize: '12px',
    color: '#334155',
    transition: 'all 0.2s ease',
    letterSpacing: '0.2px'
};

const inputGroupStyle: React.CSSProperties = {
    marginBottom: '12px'
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #E2E8F0',
    fontSize: '12px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: "'Inter', sans-serif"
};

const checkboxStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#475569',
    padding: '5px 0',
    transition: 'color 0.2s'
};

const actionBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
    color: '#334155',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    marginBottom: '8px',
    boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
    letterSpacing: '0.2px'
};

const generateBtnStyle: React.CSSProperties = {
    ...actionBtnStyle,
    background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
    color: '#FFFFFF',
    border: 'none',
    marginTop: '12px',
    boxShadow: '0 4px 14px rgba(26,35,126,0.3)',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
};

const previewContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1d23',
    overflow: 'hidden'
};

const previewHeaderStyle: React.CSSProperties = {
    padding: '8px 20px',
    background: '#22252d',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#22252d',
    padding: '6px 16px',
    color: '#CBD5E1',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
};

const toolBtnStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#94A3B8',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '5px 8px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
};

const zoomSelectStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#CBD5E1',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    outline: 'none',
    fontFamily: "'Inter', sans-serif"
};

const canvasWrapperStyle: React.CSSProperties = {
    flex: 1,
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto',
    gap: '30px',
    background: '#1a1d23',
    justifyContent: 'flex-start'
};

const pageInputStyle: React.CSSProperties = {
    width: '32px',
    padding: '3px 5px',
    textAlign: 'center',
    borderRadius: '5px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#334155',
    outline: 'none',
    fontSize: '12px',
    fontFamily: "'Inter', sans-serif"
};

const dropdownItemStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    textAlign: 'left',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '13px',
    color: '#475569',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', sans-serif"
};

const getHandwritingFont = (style: string, fallback: string = 'Arial, sans-serif') => {
    switch (style) {
        case 'ballpoint': return "'Dancing Script', cursive";
        case 'fountain': return "'Alex Brush', cursive";
        case 'felt_tip': return "'Pinyon Script', cursive";
        case 'cursive': return "'Great Vibes', cursive";
        default: return fallback;
    }
};

// --- HELPER COMPONENT ---
const CheckBack = forwardRef<{ getDataURL: () => string | null }, {
    securityFeatures: any[],
    paperColor: string,
    selectedBank: string,
    width: number,
    height: number,
    checkData: any,
    handwritingColor: string,
    signatureStyle: string,
    backSideStyle: string,
    objectPositions: Record<string, any>,
    setObjectPositions: React.Dispatch<React.SetStateAction<Record<string, any>>>,
    signatureImage: string | null,
    deletedIds: string[],
    setDeletedIds: React.Dispatch<React.SetStateAction<string[]>>
}>(({ securityFeatures, paperColor, selectedBank, width, height, checkData, handwritingColor, signatureStyle, backSideStyle, signatureImage, objectPositions, setObjectPositions, deletedIds, setDeletedIds }, ref) => {
    const backCanvasRef = useRef<HTMLCanvasElement>(null);
    const fabRef = useRef<fabric.Canvas | null>(null);
    const backPositionsRef = useRef(objectPositions);

    // Sync Ref when prop changes (from external updates)
    useEffect(() => {
        backPositionsRef.current = objectPositions;
    }, [objectPositions]);

    useImperativeHandle(ref, () => ({
        getDataURL: () => {
            if (fabRef.current) {
                return fabRef.current.toDataURL({ format: 'png', multiplier: 2 });
            }
            return null;
        }
    }));

    const getCurrentPaperColor = () => {
        const colorObj = PAPER_COLORS.find(c => c.id === paperColor);
        return colorObj ? colorObj.color : '#f8f4ec';
    };

    useEffect(() => {
        if (!backCanvasRef.current) return;

        // Initialize canvas
        const canvas = new fabric.Canvas(backCanvasRef.current, {
            width,
            height,
            backgroundColor: getCurrentPaperColor(),
            selection: true,
            interactive: true,
            preserveObjectStacking: true
        });
        fabRef.current = canvas;

        const updatePosition = (obj: any) => {
            if (obj && (obj as any).id) {
                const newPos = {
                    left: obj.left ?? 0,
                    top: obj.top ?? 0,
                    scaleX: obj.scaleX ?? 1,
                    scaleY: obj.scaleY ?? 1,
                    angle: obj.angle ?? 0
                };
                backPositionsRef.current[(obj as any).id] = newPos;
                setObjectPositions((prev: any) => ({
                    ...prev,
                    [(obj as any).id]: newPos
                }));
            }
        };

        canvas.on('object:modified', (e) => updatePosition(e.target));

        // KEYBOARD CONTROLS FOR BACK SIDE
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!canvas || (canvas as any).__isDisposed) return;
            const activeObj = canvas.getActiveObject();
            // Delete / Backspace
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (activeObj) {
                    e.preventDefault();
                    if ((activeObj as any).type === 'activeSelection') {
                        (activeObj as any).forEachObject((obj: any) => {
                            if (obj.id) setDeletedIds(prev => [...prev, obj.id]);
                            canvas.remove(obj);
                        });
                        canvas.discardActiveObject();
                    } else {
                        if ((activeObj as any).id) setDeletedIds(prev => [...prev, (activeObj as any).id]);
                        canvas.remove(activeObj);
                    }
                    canvas.requestRenderAll();
                }
            }
            // Arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && activeObj) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                if (e.key === 'ArrowUp') activeObj.set('top', (activeObj.top ?? 0) - step);
                if (e.key === 'ArrowDown') activeObj.set('top', (activeObj.top ?? 0) + step);
                if (e.key === 'ArrowLeft') activeObj.set('left', (activeObj.left ?? 0) - step);
                if (e.key === 'ArrowRight') activeObj.set('left', (activeObj.left ?? 0) + step);
                activeObj.setCoords();
                updatePosition(activeObj);
                canvas.requestRenderAll();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (fabRef.current) {
                fabRef.current.dispose();
                fabRef.current = null;
            }
        };
    }, [width, height, setObjectPositions]); // Initialize once


    // Effect for content update
    useEffect(() => {
        const canvas = fabRef.current;
        if (!canvas) return;

        // Save selection
        const activeObj = canvas.getActiveObject();
        const activeId = activeObj ? (activeObj as any).id : null;

        canvas.clear();
        canvas.setBackgroundColor(getCurrentPaperColor(), () => canvas.renderAll());

        try {
            const backObjects = CheckBackEngine.generateCheckBack(width, height, {
                type: 'mobile',
                includeSignatureLine: true,
                bankName: selectedBank,
                style: backSideStyle,
                accountNumber: checkData.accountNumber,
                name: checkData.payeeName || checkData.accountHolderName,
                date: checkData.date
            }, 72, {
                name: checkData.payeeName || checkData.accountHolderName,
                date: checkData.date,
                signatureFont: getHandwritingFont(signatureStyle),
                style: backSideStyle,
                accountNumber: checkData.accountNumber,
                handwritingColor: handwritingColor
            }, signatureImage);

            backObjects.forEach(obj => {
                const id = (obj as any).id;
                if (id) {
                    const pos = backPositionsRef.current[id];
                    if (pos) {
                        obj.set({
                            left: pos.left,
                            top: pos.top,
                            scaleX: pos.scaleX ?? 1,
                            scaleY: pos.scaleY ?? 1,
                            angle: pos.angle ?? 0
                        });
                        obj.setCoords();
                    }
                }

                if (id) {
                    obj.set({
                        selectable: true,
                        evented: true,
                        hasControls: true,
                        hasBorders: true
                    });
                }
                canvas.add(obj);
            });

            // FILTER OUT DELETED OBJECTS
            if (deletedIds && deletedIds.length > 0) {
                const currentObjects = canvas.getObjects();
                currentObjects.forEach((obj: any) => {
                    if (obj.id && deletedIds.includes(obj.id)) {
                        canvas.remove(obj);
                    }
                });
            }

            if (activeId) {
                const newActive = canvas.getObjects().find(o => (o as any).id === activeId);
                if (newActive) {
                    canvas.setActiveObject(newActive);
                }
            }

            canvas.requestRenderAll();
        } catch (err) {
            console.error('Check Back Render Error:', err);
        }
    }, [securityFeatures, paperColor, selectedBank, width, height, checkData, handwritingColor, signatureStyle, signatureImage, backSideStyle, deletedIds]);

    return (
        <div style={{
            width,
            height,
            background: getCurrentPaperColor(),
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden'
        }}>
            <canvas ref={backCanvasRef} />
        </div>
    );
});

// --- SIGNATURE LAB COMPONENT ---
interface SignatureLabProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dataUrl: string) => void;
    initialColor?: string;
    signatureImage: string | null;
    setSignatureImage: (url: string | null) => void;
    rawSignatureImage: string | null;
    setRawSignatureImage: (url: string | null) => void;
}

const SignatureLab: React.FC<SignatureLabProps> = ({
    isOpen,
    onClose,
    onSave,
    initialColor = '#000080',
    signatureImage,
    setSignatureImage,
    rawSignatureImage,
    setRawSignatureImage
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<SignatureCaptureEngine | null>(null);
    const [penStyle, setPenStyle] = useState<'ballpoint' | 'fountain' | 'felt-tip' | 'marker'>('ballpoint');
    const [inkColor, setInkColor] = useState(initialColor);

    useEffect(() => {
        if (isOpen && canvasRef.current && !engineRef.current) {
            engineRef.current = new SignatureCaptureEngine(canvasRef.current, 500, 200);
            engineRef.current.setInkColor(inkColor);
            engineRef.current.setPenStyle(penStyle);
        }

        return () => {
            if (engineRef.current) {
                engineRef.current.dispose();
                engineRef.current = null;
            }
        };
    }, [isOpen]);

    const handleSave = () => {
        if (engineRef.current) {
            const dataUrl = engineRef.current.toDataURL({ multiplier: 2 });
            onSave(dataUrl);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                width: '550px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#1a3a5c' }}>Signature Lab</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', color: '#666' }}>&times;</button>
                </div>

                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Pen Style</label>
                        <select
                            value={penStyle}
                            onChange={(e) => {
                                const style = e.target.value as any;
                                setPenStyle(style);
                                engineRef.current?.setPenStyle(style);
                            }}
                            style={inputStyle}
                        >
                            <option value="ballpoint">Ballpoint Pen</option>
                            <option value="fountain">Fountain Pen</option>
                            <option value="felt-tip">Felt Tip</option>
                            <option value="marker">Marker</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Ink Color</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            {['#000080', '#1a1a1a', '#8B0000', '#006400'].map(c => (
                                <div
                                    key={c}
                                    onClick={() => {
                                        setInkColor(c);
                                        engineRef.current?.setInkColor(c);
                                    }}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: c,
                                        cursor: 'pointer',
                                        border: inkColor === c ? '2px solid #3498db' : '2px solid transparent'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <button
                        onClick={async () => {
                            try {
                                const text = await navigator.clipboard.readText();
                                if (text.startsWith('data:image')) {
                                    setRawSignatureImage(text);
                                    const cleaned = await SignatureExtractorEngine.processSignature(text, { tintColor: initialColor });
                                    setSignatureImage(cleaned);
                                } else {
                                    alert('Clipboard does not contain a valid image data URL. Please copy a signature image first.');
                                }
                            } catch (err) {
                                alert('Clipboard access denied or failed.');
                            }
                        }}
                        style={{ ...actionBtnStyle, backgroundColor: '#3498db', flex: 1, gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        📋 Paste from Clipboard
                    </button>
                    <button
                        onClick={async () => {
                            const source = rawSignatureImage || signatureImage;
                            if (source) {
                                const cleaned = await SignatureExtractorEngine.processSignature(source, { tintColor: initialColor });
                                setSignatureImage(cleaned);
                            }
                        }}
                        style={{ ...actionBtnStyle, backgroundColor: '#f39c12', flex: 1, gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        ✨ Isolate Signature (AI)
                    </button>
                </div>

                <div style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    position: 'relative',
                    cursor: 'crosshair'
                }}>
                    <canvas ref={canvasRef} />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => engineRef.current?.clear()}
                        style={{ ...actionBtnStyle, backgroundColor: '#64748b', flex: 1 }}
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => engineRef.current?.undo()}
                        style={{ ...actionBtnStyle, backgroundColor: '#94a3b8', flex: 1 }}
                    >
                        Undo
                    </button>
                    <button
                        onClick={handleSave}
                        style={{ ...actionBtnStyle, flex: 2 }}
                    >
                        Save Signature
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============== MAIN COMPONENT ==============
const CheckBuilder: React.FC = () => {
    const { isPaid, canExport, useCheckExport, currentPlan, checksRemaining, activatePlan, isEnterprise } = useLicense();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const checkBackRef = useRef<{ getDataURL: () => string | null }>(null);
    const [fabricCanvas, setFabricCanvas] = useState<any | null>(null);
    const [borderConfig, setBorderConfig] = useState<BorderConfig>({
        style: 'BRAIDED',
        color: '#003366',
        thickness: 3,
        cornerRadius: 0
    });

    // Style Settings State
    const [checkStyle, setCheckStyle] = useState('personal');
    const [selectedFont, setSelectedFont] = useState('times');
    const [selectedTexture, setSelectedTexture] = useState('linen');
    const [paperColor, setPaperColor] = useState('#f8f4ec');
    const [selectedBank, setSelectedBank] = useState('');

    // Phase 43: Dimensional Accuracy - All checks use same canvas size
    const [checkDimensions, setCheckDimensions] = useState({ width: DEFAULT_BUSINESS_WIDTH, height: DEFAULT_BUSINESS_HEIGHT });

    // All check styles use the same 825x300 canvas for consistent rendering
    useEffect(() => {
        setCheckDimensions({ width: DEFAULT_BUSINESS_WIDTH, height: DEFAULT_BUSINESS_HEIGHT });
    }, [checkStyle]);

    const getLayout = (style: string, W: number, H: number) => {
        // Base template from counter check (works perfectly for 825x300)
        const baseLayout = {
            checkNumber: { left: W - 100, top: 10 },
            fractionalRouting: { left: W - 100, top: 31 },
            accHolder: { left: 40, top: 40 },
            dateGroup: { left: W - 220, top: 40 },
            amountGroup: { left: W - 150, top: 80 },
            payTo: { left: 40, top: 110 },
            writtenAmount: { left: 40, top: 150 },
            bankDetails: { left: 40, top: 15 },
            memoGroup: { left: 40, top: 220 },
            signatureGroup: { left: W - 350, top: 220 }
        };

        const layouts: any = {
            personal: { ...baseLayout },
            business: { ...baseLayout },
            cashier: { ...baseLayout, signatureGroup2: { left: W - 350, top: 245 } },
            payroll: { ...baseLayout, earningsGroup: { left: 40, top: 115 } },
            payroll_classic: { ...baseLayout, payeeAddress: { left: 150, top: 160 } },
            payroll_karen: { ...baseLayout, payeeAddress: { left: 40, top: 200 }, earningsGroup: { left: 40, top: 350 } },
            echeck: { ...baseLayout },
            money_order: { ...baseLayout },
            certified: { ...baseLayout },
            counter: { ...baseLayout },
            bofa_classic: { ...baseLayout },
            bofa_v2: { ...baseLayout, hologram: { left: W - 340, top: 210 } },
            us_treasury: { ...baseLayout }
        };
        return layouts[style] || baseLayout;
    };

    // Form Data State
    const [checkData, setCheckData] = useState({
        checkNumber: '9065',
        fractionalRouting: '12-30/21',
        date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
        amount: 1234.56,
        payeeName: '',
        writtenAmount: '1,234 and 56/100',
        bankName: 'Bank of Omni',
        memo: '',
        routingNumber: '122000218',
        accountNumber: '0234567890',
        accountHolderName: 'JOHN DOE',
        accountHolderAddress: '123 MAIN ST, ANYTOWN, USA 12345',
        bankAddress: '456 FINANCE WAY, NEW YORK, NY 10001',
        watermarkText: 'AUTHENTIC DOCUMENT',
        payeeFontSize: 18,
        memoFontSize: 13,
        aiPrompt: '', // Start with empty prompt
        isAiActive: false,
        micrFont: 'e13b',
        micrFontSize: 22,
        epcDigit: '', // Optional External Processing Code
        ein: '12-3456789',
        lastFour: '4567', // Last 4 of card for filename
        hoursWorked: '',
        payRate: '',
        payTotal: '',
        ytdGross: '0,000.00',
        ytdNet: '0,000.00',
        payeeAddress: '1123 RIVER ROAD\nLOUISVILLE, KY 42011'
    });

    const [logoImage, setLogoImage] = useState<string | null>(null);
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [rawSignatureImage, setRawSignatureImage] = useState<string | null>(null);
    const [isSignatureLabOpen, setIsSignatureLabOpen] = useState(false);

    const [showMicrGuide, setShowMicrGuide] = useState(false);

    // Mod-10 Routing Validation
    const isValidRouting = (routing: string) => {
        const digits = routing.replace(/\D/g, '');
        if (digits.length !== 9) return false;
        let checksum = 0;
        const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1];
        for (let i = 0; i < 9; i++) {
            checksum += parseInt(digits[i]) * weights[i];
        }
        return checksum % 10 === 0;
    };

    // Persistent positions for manual draggability
    const [objectPositions, setObjectPositions] = useState<Record<string, { left: number, top: number, scaleX?: number, scaleY?: number, angle?: number }>>({});
    const objectPositionsRef = useRef(objectPositions);

    // Keep ref in sync for structural renders
    useEffect(() => {
        objectPositionsRef.current = objectPositions;
    }, [objectPositions]);

    const [handwritingStyle, setHandwritingStyle] = useState('cursive');
    const [signatureStyle, setSignatureStyle] = useState('ballpoint'); // Different default style
    const [backSideStyle, setBackSideStyle] = useState('mobile'); // Default to Mobile Deposit
    const [handwritingRotation, setHandwritingRotation] = useState(-1.2);
    const [handwritingVariation, setHandwritingVariation] = useState(0.5);
    const [handwritingColor, setHandwritingColor] = useState('#003366'); // Default Blue
    const [textureOpacity, setTextureOpacity] = useState(1.0);
    const [securityFeatures, setSecurityFeatures] = useState(SECURITY_FEATURES);
    const [mobileBackground, setMobileBackground] = useState<'dark' | 'wood' | 'granite' | 'office'>('dark');
    const [showMicrBand, setShowMicrBand] = useState(true); // Default: show white band
    const [showAmountBorder, setShowAmountBorder] = useState(true); // Default: show amount box border

    // UI State
    const [activeSection, setActiveSection] = useState<string | null>('check_info');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [viewSide, setViewSide] = useState<'front' | 'back'>('front');
    const [activeObjectId, setActiveObjectId] = useState<string | null>(null);
    const [deletedIds, setDeletedIds] = useState<string[]>([]); // Front deleted objects
    const [deletedBackIds, setDeletedBackIds] = useState<string[]>([]); // Back deleted objects

    // AI Bar Draggability State
    const [aiBarPosition, setAiBarPosition] = useState({ x: window.innerWidth / 2 - 300, y: window.innerHeight - 80 });
    const [isDraggingAiBar, setIsDraggingAiBar] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // =========================================================================
    // COLOR THEME ENGINE (Lifted for Global Access)
    // =========================================================================
    const bankTemplate = selectedBank ? (bankSpecificTemplates[selectedBank] as any) : null;
    const premiumTemplate = selectedBank ? PREMIUM_TEMPLATES.find((p: any) => p.id === selectedBank) : null;
    const isPayroll = checkStyle === 'payroll';

    const primaryColor = isPayroll ? '#000000' : (bankTemplate?.specs?.colors?.primary || premiumTemplate?.colors?.primary || '#1a3a5c');
    const secondaryColor = isPayroll ? '#333333' : (bankTemplate?.specs?.colors?.secondary || premiumTemplate?.colors?.secondary || '#666666');

    // Auto-sync Border Colors with Theme
    useEffect(() => {
        if (borderConfig && borderConfig.style !== 'NONE') {
            setBorderConfig(prev => ({
                ...prev!,
                color: primaryColor,
                secondaryColor: secondaryColor
            }));
        }
    }, [selectedBank, checkStyle, primaryColor, secondaryColor]);

    // --- HELPER FUNCTIONS ---

    // Number to words conversion
    const numberToWords = (num: number): string => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        const dollars = Math.floor(num);
        const cents = Math.round((num - dollars) * 100);

        let result = '';
        if (dollars === 0) {
            result = 'Zero';
        } else {
            if (dollars >= 1000) {
                result += ones[Math.floor(dollars / 1000)] + ' Thousand ';
            }
            if (dollars >= 100) {
                const hundreds = Math.floor((dollars % 1000) / 100);
                if (hundreds > 0) result += ones[hundreds] + ' Hundred ';
            }
            const remainder = dollars % 100;
            if (remainder >= 20) {
                result += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10];
            } else if (remainder >= 10) {
                result += teens[remainder - 10];
            } else if (remainder > 0) {
                result += ones[remainder];
            }
        }

        return `***${result.trim()} and ${cents.toString().padStart(2, '0')}/100***`;
    };

    // Get current paper color
    const getCurrentPaperColor = () => PAPER_COLORS.find(c => c.id === paperColor)?.color || '#f8f4ec';

    // Check if security feature is enabled
    const isSecurityEnabled = (id: string) => securityFeatures.find(f => f.id === id)?.enabled || false;

    // Toggle security feature
    const toggleSecurityFeature = (id: string) => {
        setSecurityFeatures(prev => prev.map(f =>
            f.id === id ? { ...f, enabled: !f.enabled } : f
        ));
    };

    // Render check with PREMIUM details - BANK TEMPLATE AWARE
    const renderCheck = useCallback((c: fabric.Canvas) => {
        if (!c || (c as any).__isDisposed) return;

        const W = checkDimensions.width;
        // Dynamic Height for Full Page Payroll
        const isKarenCheck = checkStyle === 'payroll_karen' || selectedBank === 'KAREN_ART_STUDIO_PAYROLL';
        const H = isKarenCheck ? 1000 : checkDimensions.height;
        const MICR_CLEAR_BAND = 65; // Strict compliance
        const textureBottom = showMicrBand ? H - MICR_CLEAR_BAND : H;

        const bankTemplate = selectedBank ? (bankSpecificTemplates[selectedBank] as any) : null;
        const premiumTemplate = selectedBank ? PREMIUM_TEMPLATES.find((p: any) => p.id === selectedBank) : null;
        const isTreasury = checkStyle === 'us_treasury' || selectedBank === 'US_TREASURY_OFFICIAL';
        const isPayroll = checkStyle === 'payroll';
        const isPayrollClassic = checkStyle === 'payroll_classic';
        const isKarenPayroll = isKarenCheck;
        const isBofaV2 = checkStyle === 'bofa_v2' || selectedBank === 'BOFA_BUSINESS_V2';
        const isAnyPayroll = isPayroll || isPayrollClassic || isKarenPayroll;
        const isCashier = checkStyle === 'cashier';
        const isMoneyOrder = checkStyle === 'money_order';
        const isCertified = checkStyle === 'certified';

        const primaryColor = isPayroll ? '#000000' : (bankTemplate?.specs?.colors?.primary || premiumTemplate?.colors?.primary || '#1a3a5c');
        const secondaryColor = isPayroll ? '#333333' : (bankTemplate?.specs?.colors?.secondary || premiumTemplate?.colors?.secondary || '#666666');
        const accentColor = isPayroll ? '#000000' : (bankTemplate?.specs?.colors?.accent || premiumTemplate?.colors?.accent || '#d4a574');
        const fontFamily = (isPayroll || isKarenPayroll) ? (isKarenPayroll ? 'Times New Roman, serif' : 'Arial, sans-serif') : (bankTemplate?.specs?.fontFamily || (FONTS.find((f: any) => f.id === selectedFont)?.family || 'Arial, sans-serif'));

        // Check again before clearing
        if ((c as any).__isDisposed) return;

        // PRESERVE SELECTION
        const activeObj = c.getActiveObject();
        const activeId = activeObj ? (activeObj as any).id : null;

        c.clear();

        c.setBackgroundColor(getCurrentPaperColor(), () => {
            if (!c || (c as any).__isDisposed) return;
            const offscreen = document.createElement('canvas');
            offscreen.width = W;
            offscreen.height = H;
            const ctx = offscreen.getContext('2d')!;

            // 1. Procedural Texture
            ctx.save();
            ctx.globalAlpha = textureOpacity;

            if (selectedTexture === 'blue_wave') {
                ctx.fillStyle = '#f0f8ff';
                ctx.fillRect(0, 0, W, H);
                ctx.strokeStyle = '#0055a450'; // Higher visibility for safety blue
                ctx.lineWidth = 0.6;
                for (let i = 0; i < H; i += 4) {
                    ctx.beginPath();
                    for (let x = 0; x < W; x += 10) {
                        ctx.lineTo(x, i + Math.sin(x * 0.02) * 3);
                    }
                    ctx.stroke();
                }
            } else if (selectedTexture === 'security') {
                // SECURITY CROSSHATCH - Ultra Premium visibility
                ctx.strokeStyle = `${primaryColor}60`; // Increased from 40
                ctx.lineWidth = 0.7; // Thicker lines
                for (let i = -H; i < W + H; i += 5) {
                    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(i + H, 0); ctx.lineTo(i, H); ctx.stroke();
                }
            }

            // 2. Procedural Fluorescent Fibers (New Feature)
            if (isSecurityEnabled('fluorescent_fibers') || selectedTexture === 'fluorescent_fibers') {
                const colors = ['#ff00ff20', '#00ffff20', '#ffff0020', '#00ff0020'];
                for (let i = 0; i < 200; i++) {
                    ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
                    ctx.lineWidth = 0.5 + Math.random();
                    const x = Math.random() * W;
                    const y = Math.random() * H;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.bezierCurveTo(x + 5, y - 5, x + 10, y + 5, x + 15, y);
                    ctx.stroke();
                }
            } else if (selectedTexture === 'parchment') {
                // Aged paper effect with spots
                ctx.fillStyle = 'rgba(139,119,101,0.28)'; // SIGNIFICANT visibility boost
                for (let i = 0; i < 800; i++) {
                    const size = Math.random() * 4 + 1;
                    ctx.beginPath();
                    ctx.arc(Math.random() * W, Math.random() * (textureBottom), size, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (selectedTexture === 'marble') {
                // Swirling marble veins
                ctx.strokeStyle = 'rgba(80,100,120,0.32)'; // Ultra High Precision visibility
                ctx.lineWidth = 2.5; // Heavier premium veins
                ctx.stroke();
            } else if (selectedTexture === 'cloud_marble') {
                // CLOUD MARBLE (BofA Style)
                ctx.fillStyle = paperColor === '#f8f4ec' ? '#f0f4f8' : paperColor;
                ctx.fillRect(0, 0, W, H);
                // Soft clouds
                for (let i = 0; i < 15; i++) {
                    const x = Math.random() * W;
                    const y = Math.random() * H;
                    const r = 100 + Math.random() * 200;
                    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
                    grad.addColorStop(0, 'rgba(210, 220, 230, 0.4)');
                    grad.addColorStop(1, 'rgba(240, 244, 248, 0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill();
                }
                // veins
                ctx.strokeStyle = 'rgba(120,135,150,0.1)';
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 20; i++) {
                    ctx.beginPath();
                    let curX = Math.random() * W; let curY = Math.random() * H;
                    ctx.moveTo(curX, curY);
                    for (let j = 0; j < 5; j++) {
                        curX += (Math.random() - 0.5) * 200; curY += (Math.random() - 0.5) * 100;
                        ctx.lineTo(curX, curY);
                    }
                    ctx.stroke();
                }
            } else if (selectedTexture === 'cotton') {
                // Dense fiber threads
                ctx.strokeStyle = 'rgba(120,110,100,0.25)';
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 400; i++) {
                    const x = Math.random() * W;
                    const y = Math.random() * (textureBottom);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 15);
                    ctx.stroke();
                }
            } else if (selectedTexture === 'particles') {
                // PREMIUM PARTICLES - Security dots and sparkles
                for (let i = 0; i < 300; i++) {
                    const x = Math.random() * W;
                    const y = Math.random() * (textureBottom);
                    const size = Math.random() * 2 + 0.5;
                    const hue = Math.random() * 60 + 30; // Gold-ish range
                    ctx.fillStyle = `hsla(${hue}, 50%, 50%, 0.15)`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Add metallic flecks
                ctx.fillStyle = `${accentColor}25`;
                for (let i = 0; i < 150; i++) {
                    ctx.fillRect(Math.random() * W, Math.random() * (textureBottom), 1.5, 1.5);
                }
            } else if (selectedTexture === 'rough') {
                // ROUGH PAPER - visible grain
                for (let y = 0; y < textureBottom; y += 2) {
                    for (let x = 0; x < W; x += 3) {
                        const brightness = Math.random() * 20 - 10;
                        ctx.fillStyle = `rgba(${128 + brightness},${120 + brightness},${110 + brightness},0.2)`;
                        ctx.fillRect(x, y, 3, 2);
                    }
                }
                // Add texture lines
                ctx.strokeStyle = 'rgba(100,90,80,0.08)';
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 100; i++) {
                    ctx.beginPath();
                    ctx.moveTo(Math.random() * W, Math.random() * (textureBottom));
                    ctx.lineTo(Math.random() * W, Math.random() * (textureBottom));
                    ctx.stroke();
                }
            } else if (selectedTexture === 'guilloche_bg') {
                // GUILLOCHÉ WAVE background - elegant spirograph pattern
                ctx.strokeStyle = `${primaryColor}30`; // Boosted for premium feel
                ctx.lineWidth = 0.5;
                for (let centerY = 50; centerY < textureBottom; centerY += 80) {
                    for (let centerX = 50; centerX < W; centerX += 100) {
                        for (let ring = 0; ring < 4; ring++) {
                            ctx.beginPath();
                            for (let angle = 0; angle < Math.PI * 2; angle += 0.03) {
                                const r = 20 + ring * 10 + Math.sin(angle * 6) * 6;
                                const x = centerX + r * Math.cos(angle);
                                const y = centerY + r * Math.sin(angle);
                                if (angle === 0) ctx.moveTo(x, y);
                                else ctx.lineTo(x, y);
                            }
                            ctx.closePath();
                            ctx.stroke();
                        }
                    }
                }
            } else if (selectedTexture === 'prismatic') {
                // PRISMATIC SECURITY - Rainbow color bands
                for (let band = 0; band < W; band += 15) {
                    const hue = (band / W) * 360;
                    ctx.fillStyle = `hsla(${hue}, 40%, 80%, 0.08)`;
                    ctx.fillRect(band, 0, 15, textureBottom);
                }
                // Add security crosshatch over it
                ctx.strokeStyle = 'rgba(100,100,100,0.1)';
                ctx.lineWidth = 0.3;
                for (let i = -H; i < W + H; i += 8) {
                    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, textureBottom); ctx.stroke();
                }
            } else if (selectedTexture === 'laser_security') {
                // LASER SECURITY - Fine-line moiré pattern
                ctx.strokeStyle = `${primaryColor}15`;
                ctx.lineWidth = 0.4;
                for (let i = 0; i < W; i += 4) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.bezierCurveTo(i + 20, H / 3, i - 20, (2 * H) / 3, i, textureBottom);
                    ctx.stroke();
                }
            } else if (selectedTexture === 'fluorescent_fibers') {
                // FLUORESCENT FIBERS - scattered colored threads
                const fiberColors = ['#ff000030', '#00ff0030', '#0000ff30', '#ffff0030'];
                for (let i = 0; i < 600; i++) {
                    ctx.strokeStyle = fiberColors[Math.floor(Math.random() * fiberColors.length)];
                    ctx.lineWidth = 0.6;
                    const x = Math.random() * W;
                    const y = Math.random() * (textureBottom);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.quadraticCurveTo(x + 10, y + 5, x + 5, y + 15);
                    ctx.stroke();
                }
            } else if (selectedTexture === 'blue_wave') {
                // BLUE WAVE SAFETY PATTERN - Complex Bezier Curves
                ctx.lineWidth = 0.8;
                const colors = ['rgba(0, 100, 200, 0.15)', 'rgba(0, 150, 255, 0.1)', 'rgba(0, 50, 150, 0.08)'];

                // Multiple overlapping wave layers
                for (let layer = 0; layer < 3; layer++) {
                    ctx.strokeStyle = colors[layer];
                    const phaseShift = layer * 150;
                    const freq = 0.01 + (layer * 0.005);

                    for (let y = -50; y < H; y += 15) {
                        ctx.beginPath();
                        for (let x = 0; x <= W; x += 10) {
                            // Complex wave modulation
                            const yOffset = Math.sin((x + phaseShift) * freq) * 40 * Math.sin(x * 0.002);
                            const yMod = Math.cos((x - phaseShift) * (freq * 1.5)) * 20;

                            if (x === 0) ctx.moveTo(x, y + yOffset + yMod);
                            else ctx.lineTo(x, y + yOffset + yMod);
                        }
                        ctx.stroke();
                    }
                }

                // Add subtle vertical safety lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 0.5;
                for (let x = 0; x < W; x += 4) {
                    if (x % 40 === 0) continue; // Create "columns"
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, H);
                    ctx.stroke();
                }
            } else if (selectedTexture === 'toner_adhesion') {
                // TONER ADHESION - granular micro-texture
                for (let i = 0; i < 2000; i++) {
                    ctx.fillStyle = 'rgba(0,0,0,0.03)';
                    ctx.fillRect(Math.random() * W, Math.random() * (textureBottom), 1, 1);
                }
            } else if (selectedTexture === 'nano_optical') {
                // NANO-OPTICAL SCREEN - very fine hexagonal grid
                ctx.strokeStyle = `${primaryColor}15`;
                ctx.lineWidth = 0.2;
                const size = 6;
                for (let y = 0; y < H; y += size * 1.5) {
                    for (let x = 0; x < W + size; x += size * Math.sqrt(3)) {
                        const offsetX = (Math.floor(y / (size * 1.5)) % 2 === 0) ? 0 : (size * Math.sqrt(3)) / 2;
                        ctx.beginPath();
                        for (let i = 0; i < 6; i++) {
                            const angle = (Math.PI / 3) * i;
                            const hX = x + offsetX + size * Math.cos(angle);
                            const hY = y + size * Math.sin(angle);
                            if (i === 0) ctx.moveTo(hX, hY);
                            else ctx.lineTo(hX, hY);
                        }
                        ctx.closePath();
                        ctx.stroke();
                    }
                }
            } else if (selectedTexture === 'interference') {
                // INTERFERENCE PATTERN - Moiré-like overlapping circles
                ctx.lineWidth = 0.3;
                const centers = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W / 2, y: H }];
                centers.forEach((center, idx) => {
                    ctx.strokeStyle = idx === 0 ? `${primaryColor}08` : idx === 1 ? `${secondaryColor}08` : `${accentColor}08`;
                    for (let r = 0; r < W * 1.2; r += 5) {
                        ctx.beginPath();
                        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                });
            } else if (selectedTexture === 'multi_tone') {
                // MULTI-TONE DEPTH - Topographic-like lines
                ctx.strokeStyle = `${primaryColor}12`;
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 15; i++) {
                    ctx.beginPath();
                    const startY = (i / 15) * H;
                    ctx.moveTo(0, startY);
                    for (let x = 0; x <= W; x += 20) {
                        const noise = Math.sin(x * 0.01 + i) * 30 + Math.cos(x * 0.005) * 20;
                        ctx.lineTo(x, startY + noise);
                    }
                    ctx.stroke();
                }
            } else if (selectedTexture === 'fiber_optic') {
                // FIBER OPTIC - bright, scattered thin lines
                const opticColors = ['#00ffff40', '#ff00ff40', '#ffff0040', '#00ff0040'];
                for (let i = 0; i < 400; i++) {
                    ctx.strokeStyle = opticColors[Math.floor(Math.random() * opticColors.length)];
                    ctx.lineWidth = 0.8;
                    const x = Math.random() * W;
                    const y = Math.random() * (textureBottom);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 10);
                    ctx.stroke();
                }
            } else if (selectedTexture === 'micro_embossed') {
                // MICRO-EMBOSSED - very fine raised dots
                for (let y = 0; y < textureBottom; y += 4) {
                    for (let x = 0; x < W; x += 4) {
                        const shade = Math.random() * 20 - 10;
                        ctx.fillStyle = `rgba(0,0,0,${0.05 + shade / 100})`;
                        ctx.beginPath();
                        ctx.arc(x, y, 0.5, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = `rgba(255,255,255,${0.05 - shade / 100})`;
                        ctx.beginPath();
                        ctx.arc(x + 1, y + 1, 0.5, 0, Math.PI * 2);
                        ctx.fill();
                    }

                }
            }

            // --- AI GENERATIVE PATTERN ENGINE (Phase 72) ---
            if (checkData.isAiActive && checkData.aiPrompt) {
                const prompt = checkData.aiPrompt.toLowerCase();
                ctx.save();

                // 1. Determine Colors (NLP)
                let strokeColor = 'rgba(0,0,0,0.1)';
                if (prompt.includes('blue')) strokeColor = 'rgba(0,0,255,0.15)';
                if (prompt.includes('red')) strokeColor = 'rgba(255,0,0,0.15)';
                if (prompt.includes('green')) strokeColor = 'rgba(0,128,0,0.15)';
                if (prompt.includes('gold')) strokeColor = 'rgba(218,165,32,0.2)';
                if (prompt.includes('purple')) strokeColor = 'rgba(128,0,128,0.15)';

                // 2. Determine Style (NLP)
                const isComplex = prompt.includes('complex') || prompt.includes('intricate') || prompt.includes('high detail');
                const isTech = prompt.includes('tech') || prompt.includes('cyber') || prompt.includes('circuit') || prompt.includes('digital');
                const isOrganic = prompt.includes('organic') || prompt.includes('natural') || prompt.includes('flow');

                // 3. Shape Engine
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = isComplex ? 0.3 : 0.8;

                if (prompt.includes('hex') || prompt.includes('honeycomb')) {
                    // HEXAGONAL GRID
                    const r = isComplex ? 8 : 15;
                    const h = r * Math.sin(Math.PI / 3);
                    for (let y = 0, i = 0; y < H + r; y += h, i++) {
                        for (let x = 0; x < W + r; x += r * 1.5) {
                            const cx = x + (i % 2 === 0 ? 0 : r * 0.75);
                            ctx.beginPath();
                            for (let a = 0; a < 6; a++) {
                                const angle = a * Math.PI / 3;
                                const px = cx + r * Math.cos(angle);
                                const py = y + r * Math.sin(angle);
                                if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                            }
                            ctx.closePath(); ctx.stroke();
                        }
                    }
                } else if (prompt.includes('wave') || prompt.includes('ocean')) {
                    // COMPLEX WAVES
                    const layers = isComplex ? 10 : 5;
                    for (let i = 0; i < layers; i++) {
                        ctx.beginPath();
                        for (let x = 0; x <= W; x += 10) {
                            const y = (i * (H / layers)) + Math.sin(x * 0.01 + i) * 20;
                            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }
                } else if (prompt.includes('circle') || prompt.includes('dot') || prompt.includes('bubble')) {
                    // CIRCLES / DOTS
                    const count = isComplex ? 500 : 100;
                    for (let i = 0; i < count; i++) {
                        const x = Math.random() * W;
                        const y = Math.random() * textureBottom;
                        ctx.beginPath();
                        ctx.arc(x, y, Math.random() * (isComplex ? 5 : 15), 0, Math.PI * 2);
                        ctx.stroke();
                    }
                } else if (isTech) {
                    // CIRCUITRY
                    for (let i = 0; i < (isComplex ? 100 : 40); i++) {
                        const x = Math.random() * W;
                        const y = Math.random() * textureBottom;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + (Math.random() > 0.5 ? 50 : -50), y);
                        ctx.lineTo(x + (Math.random() > 0.5 ? 50 : -50), y + (Math.random() > 0.5 ? 20 : -20));
                        ctx.stroke();
                        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
                    }
                } else {
                    // DEFAULT: CHAOTIC LINES (if no specific shape recognized)
                    for (let i = 0; i < (isComplex ? 300 : 100); i++) {
                        ctx.beginPath();
                        ctx.moveTo(Math.random() * W, Math.random() * textureBottom);
                        ctx.lineTo(Math.random() * W, Math.random() * textureBottom);
                        ctx.stroke();
                    }
                }

                ctx.restore();
            }

            // --- INSTITUTION-SPECIFIC PROCEDURAL RENDERING (Universal Realism) ---
            if (selectedBank === 'us_treasury') {
                // U.S. TREASURY SPECIALIZED BACKGROUND
                ctx.save();
                // 1. Pale Green Microprint Pattern
                ctx.fillStyle = 'rgba(60, 90, 60, 0.08)';
                ctx.font = 'bold 3.5px "Arial", sans-serif';
                const treasuryText = ' UNITED STATES TREASURY FISCAL SERVICE • ';
                for (let y = 0; y < textureBottom; y += 5) {
                    ctx.fillText(treasuryText.repeat(10), (y % 10 === 0 ? 0 : -30), y);
                }
                // 2. Multi-Tone Security Waves (IRIS PRINTING)
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 12; i++) {
                    ctx.strokeStyle = i % 2 === 0 ? '#1e393210' : '#d4af3710';
                    ctx.beginPath();
                    const startY = (i / 12) * H;
                    ctx.moveTo(0, startY);
                    for (let x = 0; x <= W; x += 15) {
                        ctx.lineTo(x, startY + Math.sin(x * 0.008 + i) * 25);
                    }
                    ctx.stroke();
                }
                // 3. Official Red/Blue Security Fibers
                for (let i = 0; i < 250; i++) {
                    ctx.strokeStyle = Math.random() > 0.5 ? '#e74c3c35' : '#3498db35';
                    ctx.lineWidth = 0.7;
                    const fx = Math.random() * W;
                    const fy = Math.random() * (textureBottom);
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx + (Math.random() - 0.5) * 12, fy + (Math.random() - 0.5) * 8);
                    ctx.stroke();
                }
                ctx.restore();
            } else if (selectedBank === 'chime_pro' || selectedBank === 'varo_style') {
                // MODERN DIGITAL BANK GRID
                ctx.save();
                ctx.strokeStyle = `${primaryColor}15`;
                ctx.lineWidth = 0.4;
                for (let x = 0; x < W; x += 12) {
                    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, textureBottom); ctx.stroke();
                }
                for (let y = 0; y < textureBottom; y += 12) {
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                }
                // Subtle central radial glow
                const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
                glow.addColorStop(0, `${primaryColor}05`);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, W, textureBottom);
                ctx.restore();
            } else if (selectedTexture === 'marble') {
                // MARBLE: Organic swirls
                ctx.save();
                for (let i = 0; i < 200; i++) {
                    ctx.beginPath();
                    const x = Math.random() * W;
                    const y = Math.random() * H;
                    ctx.arc(x, y, Math.random() * 40 + 10, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.03})`;
                    ctx.fill();
                }
                ctx.restore();
            } else if (selectedTexture === 'linen') {
                // LINEN: Bank-grade security paper with embedded fibers
                ctx.save();
                // Base weave pattern
                ctx.strokeStyle = 'rgba(0,0,0,0.12)';
                ctx.lineWidth = 0.35;
                for (let i = 0; i < W; i += 2.5) {
                    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
                }
                for (let i = 0; i < H; i += 2.5) {
                    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
                }
                // Cross-weave variation (diagonal threads)
                ctx.strokeStyle = 'rgba(0,0,0,0.04)';
                ctx.lineWidth = 0.3;
                for (let i = -H; i < W + H; i += 8) {
                    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
                }
                // Security fibers (red and blue - standard bank check paper)
                const fiberSeed = 42;
                const seededRandom = (n: number) => {
                    const x = Math.sin(n * 9301 + fiberSeed) * 10000;
                    return x - Math.floor(x);
                };
                for (let i = 0; i < 60; i++) {
                    const fx = seededRandom(i) * W;
                    const fy = seededRandom(i + 100) * (H - 55);
                    const angle = seededRandom(i + 200) * Math.PI;
                    const len = 8 + seededRandom(i + 300) * 12;
                    ctx.strokeStyle = i % 3 === 0 ? 'rgba(180,30,30,0.18)' : 'rgba(30,60,180,0.15)';
                    ctx.lineWidth = 0.4 + seededRandom(i + 400) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(fx, fy);
                    ctx.lineTo(fx + Math.cos(angle) * len, fy + Math.sin(angle) * len);
                    ctx.stroke();
                }
                ctx.restore();
            } else if (selectedTexture === 'geometric_diamond') {
                // GEOMETRIC DIAMOND: Precision grid
                ctx.strokeStyle = `${primaryColor}40`; // Significantly boosted
                ctx.lineWidth = 0.5;
                const size = 20;
                for (let x = 0; x < W + size; x += size) {
                    for (let y = 0; y < H + size; y += size) {
                        ctx.beginPath();
                        ctx.moveTo(x, y - size / 2);
                        ctx.lineTo(x + size / 2, y);
                        ctx.lineTo(x, y + size / 2);
                        ctx.lineTo(x - size / 2, y);
                        ctx.closePath();
                        ctx.stroke();
                    }
                }
            } else if (selectedTexture === 'circuit_board') {
                // CIRCUIT BOARD: Tech security
                ctx.strokeStyle = `${primaryColor}35`; // Tech-forward visibility
                ctx.lineWidth = 0.8;
                for (let i = 0; i < 50; i++) {
                    const x = Math.random() * W;
                    const y = Math.random() * H;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + 20, y);
                    ctx.lineTo(x + 30, y + (Math.random() > 0.5 ? 10 : -10));
                    ctx.lineTo(x + 50, y + (Math.random() > 0.5 ? 20 : -20));
                    ctx.stroke();
                    // Nodes
                    ctx.fillStyle = `${primaryColor}30`;
                    ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(x + 50, y + (Math.random() > 0.5 ? 20 : -20), 1.5, 0, Math.PI * 2); ctx.fill();
                }
            } else if (selectedTexture === 'royal_damask') {
                // ROYAL DAMASK: Elegant swirls
                ctx.strokeStyle = `${primaryColor}28`; // High precision boost
                ctx.lineWidth = 1.1;
                for (let y = 0; y < H; y += 40) {
                    for (let x = 0; x < W; x += 40) {
                        ctx.beginPath();
                        ctx.arc(x, y, 15, 0, Math.PI, true);
                        ctx.bezierCurveTo(x - 5, y - 20, x + 5, y - 20, x + 20, y);
                        ctx.stroke();
                    }
                }
            } else if (selectedTexture === 'digital_hive') {
                // DIGITAL HIVE: Hexagonal depth
                ctx.strokeStyle = `${primaryColor}30`; // Matrix visibility boost
                ctx.lineWidth = 0.7;
                const r = 12;
                const h = r * Math.sin(Math.PI / 3);
                for (let y = 0, i = 0; y < H + r; y += h, i++) {
                    for (let x = 0; x < W + r; x += r * 1.5) {
                        const cx = x + (i % 2 === 0 ? 0 : r * 0.75);
                        ctx.beginPath();
                        for (let a = 0; a < 6; a++) {
                            const angle = a * Math.PI / 3;
                            const px = cx + r * Math.cos(angle);
                            const py = y + r * Math.sin(angle);
                            if (a === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        }
                        ctx.closePath();
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();

            // DYNAMIC BANK PATTERNS (Overlay on top of texture)
            if (selectedBank) {
                // === DYNAMIC BANK PATTERN ENGINES ===
                // This ensures each bank type has a visually distinct background strategy
                const isTechBank = ['chime_pro', 'varo_style', 'ally_bank', 'sofi_money', 'cash_app'].some(b => selectedBank.includes(b));
                const isGov = ['us_treasury', 'state_comptroller'].some(b => selectedBank.includes(b));
                const isCreditUnion = ['credit_union_classic', 'navy_federal', 'penfed'].some(b => selectedBank.includes(b));
                const isPremium = ['midnight_premium', 'ultra_obsidian', 'chase_sapphire'].some(b => selectedBank.includes(b));

                if (isTechBank) {
                    // ENGINE: DIGITAL GRID (Clean, Geometric, Tech-forward)
                    ctx.save();
                    ctx.globalAlpha = textureOpacity;
                    ctx.strokeStyle = `${primaryColor}25`; // Boosted
                    ctx.lineWidth = 0.5;
                    // Vertical tech lines
                    for (let x = 0; x < W; x += 15) {
                        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, textureBottom); ctx.stroke();
                        // Tech nodes
                        if (x % 45 === 0) {
                            ctx.fillStyle = `${primaryColor}30`;
                            ctx.beginPath(); ctx.arc(x, (x * 1.5) % (textureBottom), 1.5, 0, Math.PI * 2); ctx.fill();
                        }
                    }
                    // Horizontal tech lines
                    for (let y = 0; y < textureBottom; y += 15) {
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                    }
                    ctx.restore();

                } else if (isGov) {
                    // ENGINE: FEDERAL GUILLOCHE (Complex, Detailed, Authoritative)
                    ctx.save();
                    ctx.globalAlpha = textureOpacity;
                    ctx.strokeStyle = `${primaryColor}20`; // Boosted
                    ctx.lineWidth = 0.4;
                    for (let x = 0; x < W; x += 3) {
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        // Complex sine wave interference
                        for (let y = 0; y < textureBottom; y += 5) {
                            ctx.lineTo(x + Math.sin(y * 0.1) * 10, y);
                        }
                        ctx.stroke();
                    }
                    ctx.restore();

                } else if (isCreditUnion) {
                    // ENGINE: RADIAL COMMUNITY (Warm, Centralized, Flowing)
                    ctx.save();
                    ctx.globalAlpha = textureOpacity;
                    const cx = W / 2;
                    const cy = H / 2;
                    ctx.strokeStyle = `${primaryColor}15`; // Boosted
                    ctx.lineWidth = 0.8;
                    for (let i = 0; i < 360; i += 5) {
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        const angle = (i * Math.PI) / 180;
                        ctx.lineTo(cx + Math.cos(angle) * W, cy + Math.sin(angle) * H);
                        ctx.stroke();
                    }
                    // Soft circular waves
                    for (let r = 20; r < W; r += 20) {
                        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
                    }
                    ctx.restore();

                } else if (isPremium) {
                    // ENGINE: LUXURY DARK MODE (Minimalist, Metallic)
                    ctx.save();
                    ctx.globalAlpha = textureOpacity;
                    const grad = ctx.createLinearGradient(0, 0, W, H);
                    grad.addColorStop(0, '#111');
                    grad.addColorStop(0.5, '#222');
                    grad.addColorStop(1, '#111');
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, W, textureBottom);
                    ctx.restore();
                    for (let y = 0; y < textureBottom; y += 25) {
                        ctx.beginPath();
                        for (let x = 0; x < W; x += 5) {
                            ctx.lineTo(x, y + Math.sin(x * 0.04) * 12 + Math.cos(x * 0.02) * 5);
                        }
                        ctx.stroke();
                    }
                } else if (isBofaV2 && (!borderConfig || borderConfig.style === 'NONE')) {
                    // ENGINE: BOFA V2 REPLICA - HYPER-FIDELITY FINE RADIAL GUILLOCHE
                    ctx.save();

                    // Center of the "Starburst" (Using Hologram position as anchor)
                    const cx = W - 340;
                    const cy = 210;
                    const maxR = Math.sqrt(W * W + H * H);

                    // 1. Fine Radial Starburst (High Frequency Moiré)
                    ctx.lineWidth = 0.3; // Slightly thicker for better visibility

                    // Layer A: Primary Dense Blue Radial
                    ctx.strokeStyle = '#d9eefcCC'; // 0.8 opacity approx (CC in hex)
                    for (let r = 10; r < maxR; r += 4) { // Higher density
                        ctx.beginPath();
                        for (let theta = 0; theta < Math.PI * 2; theta += 0.01) {
                            const rPrime = r + (r * 0.035) * Math.sin(64 * theta); // Higher frequency
                            const x = cx + rPrime * Math.cos(theta);
                            const y = cy + rPrime * Math.sin(theta);
                            if (theta === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }

                    // Layer B: Interference Weave (Teal/Greenish tint)
                    ctx.strokeStyle = 'rgba(203, 221, 232, 0.6)';
                    ctx.lineWidth = 0.2;
                    for (let r = 12; r < maxR; r += 6) {
                        ctx.beginPath();
                        for (let theta = 0; theta < Math.PI * 2; theta += 0.015) {
                            const rPrime = r + (r * 0.025) * Math.sin(72 * theta + Math.PI);
                            const x = cx + rPrime * Math.cos(theta);
                            const y = cy + rPrime * Math.sin(theta);
                            if (theta === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }

                    // 2. Removed V-Dot Grid Pattern (Per user request)
                    ctx.restore();
                } else {
                    // ENGINE: STANDARD COMMERCIAL (Standard Linen/Security Weave)
                    ctx.save();
                    ctx.globalAlpha = textureOpacity;
                    ctx.strokeStyle = `${primaryColor}15`;
                    ctx.lineWidth = 0.5;

                    // Classic Step-and-Repeat or Crosshatch
                    const spacing = 4;
                    for (let x = 0; x < W; x += spacing) {
                        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, textureBottom); ctx.stroke();
                    }
                    for (let y = 0; y < textureBottom; y += spacing) {
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
                    }

                    // Add subtle logo-like repetition if possible, or just a diamond pattern
                    ctx.fillStyle = `${primaryColor}08`;
                    for (let y = 0; y < textureBottom; y += 40) {
                        for (let x = 0; x < W; x += 40) {
                            if ((x + y) % 80 === 0) {
                                ctx.beginPath();
                                ctx.arc(x, y, 2, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                    }
                    ctx.restore();

                    // 3b-special. THEMATIC UNDERLAYS (Money Order/Cashier/Certified)
                    if (isMoneyOrder || isCashier || isCertified) {
                        ctx.save();
                        ctx.globalAlpha = 0.04;
                        ctx.fillStyle = primaryColor;
                        const patternText = isMoneyOrder ? 'MONEY ORDER' : (isCashier ? 'OFFICIAL INSTRUMENT' : 'CERTIFIED');

                        if (isCertified) {
                            // Guilloché-like Waves for Certified
                            ctx.strokeStyle = '#c9a227';
                            ctx.lineWidth = 0.5;
                            ctx.globalAlpha = 0.15;
                            for (let y = 0; y < textureBottom; y += 25) {
                                ctx.beginPath();
                                for (let x = 0; x < W; x += 5) {
                                    ctx.lineTo(x, y + Math.sin(x * 0.04) * 12 + Math.cos(x * 0.02) * 5);
                                }
                                ctx.stroke();
                            }
                        } else {
                            // Diagonal Repeating Text for MO/Cashier
                            ctx.font = 'bold 10px Arial';
                            for (let y = -W; y < H; y += 80) {
                                for (let x = 0; x < W; x += 150) {
                                    ctx.save();
                                    ctx.translate(x, y);
                                    ctx.rotate(-Math.PI / 4);
                                    ctx.fillText(patternText, 0, 0);
                                    ctx.restore();
                                }
                            }
                        }
                        ctx.restore();
                    }
                }
            }
            // 3c. SECURITY FIBER INJECTION (Red/Blue Silk Fibers)
            for (let i = 0; i < 400; i++) {
                const fx = Math.random() * W;
                const fy = Math.random() * (textureBottom);
                const length = 2 + Math.random() * 4;
                const fAngle = Math.random() * Math.PI * 2;
                ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(180, 20, 20, 0.4)' : 'rgba(20, 20, 180, 0.4)';
                ctx.lineWidth = 0.3;
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                ctx.quadraticCurveTo(fx + Math.cos(fAngle) * length, fy + Math.sin(fAngle) * length, fx + Math.cos(fAngle + 0.2) * (length + 1), fy + Math.sin(fAngle + 0.2) * (length + 1));
                ctx.stroke();
            }

            // 3d. GOLD/SILVER DUST
            for (let i = 0; i < 500; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? `${accentColor}40` : '#ffffff20';
                ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * (textureBottom), 0.5, 0, Math.PI * 2); ctx.fill();
            }

            // 3e. MICR ISOLATION ZONE (Ensure clean band is pure white/noise-free)
            if (showMicrBand) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, textureBottom, W, MICR_CLEAR_BAND);
            }

            // 4. PRISMATIC NOISE for security paper effect (FULL HEIGHT)
            if (!isBofaV2) { // Skip noise for BofA v2 to keep guilloché sharp
                const imageData = ctx.getImageData(0, 0, W, H);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const noise = (Math.random() - 0.5) * 8;
                    data[i] = Math.min(255, Math.max(0, data[i] + noise));
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
                }
                ctx.putImageData(imageData, 0, 0);
            }

            // 5. DECORATIVE BORDER - DYNAMIC STYLES based on Check Style
            const isModern = ['echeck', 'payroll', 'clean_modern', 'counter'].includes(checkStyle);
            const isClassic = ['personal', 'business', 'certified'].includes(checkStyle);
            const isFormal = ['cashier', 'money_order'].includes(checkStyle);

            if (isClassic && (!borderConfig || borderConfig.style === 'NONE')) {
                // CLASSIC DOUBLE BORDER
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 3;
                ctx.strokeRect(6, 6, W - 12, H - 12);
                ctx.strokeStyle = secondaryColor + '40';
                ctx.lineWidth = 1;
                ctx.strokeRect(12, 12, W - 24, H - 24);
            } else if (isFormal && (!borderConfig || borderConfig.style === 'NONE')) {
                // FORMAL HEAVY BORDER
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 6;
                ctx.strokeRect(4, 4, W - 8, H - 8);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.strokeRect(6, 6, W - 12, H - 12);
            } else if (isModern && (!borderConfig || borderConfig.style === 'NONE')) {
                // MODERN MINIMALIST BORDER
                if (checkStyle !== 'echeck') { // eChecks are borderless by default
                    ctx.strokeStyle = `${primaryColor}60`;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(2, 2, W - 4, H - 4);
                }
            } else if (checkStyle === 'bofa_classic' && (!borderConfig || borderConfig.style === 'NONE')) {
                // BOFA CLASSIC DOUBLE BORDER
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(10, 10, W - 20, H - 20);
                ctx.strokeStyle = '#5d728d60';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(13, 13, W - 26, H - 26);
            } else if (isBofaV2 && (!borderConfig || borderConfig.style === 'NONE')) {
                // ENGINE: BOFA V2 REPLICA - HYPER-FIDELITY BRAIDED RIBBON BORDER
                // Concept: A solid blue band with interlaced white sine waves ("Chain Link" effect)

                const m = 15; // Margin
                const bandWidth = 5;

                ctx.save();

                // 1. Draw the Solid Blue Band (Background of the braid)
                ctx.strokeStyle = '#3b5a9a'; // BofA Blue
                ctx.lineWidth = bandWidth;
                ctx.lineJoin = 'round';
                ctx.strokeRect(m, m, W - m * 2, H - m * 2);

                // 2. Draw Interlaced White Braid (The "Chain")
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.2;
                ctx.lineCap = 'round';

                // Optimized Braid Function
                const drawBraidSide = (x1: number, y1: number, x2: number, y2: number) => {
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);

                    ctx.save();
                    ctx.translate(x1, y1);
                    ctx.rotate(angle);

                    ctx.beginPath();
                    // Draw two out-of-phase sine waves along the band
                    for (let t = 0; t <= len; t += 1) {
                        const freq = 0.5;
                        const amp = bandWidth * 0.35;

                        // Wave A
                        ctx.moveTo(t, Math.sin(t * freq) * amp);
                        ctx.lineTo(t + 1, Math.sin((t + 1) * freq) * amp);

                        // Wave B (Phase shifted PI)
                        ctx.moveTo(t, Math.sin(t * freq + Math.PI) * amp);
                        ctx.lineTo(t + 1, Math.sin((t + 1) * freq + Math.PI) * amp);
                    }
                    ctx.stroke();
                    ctx.restore();
                };

                // Apply Braid to all 4 sides
                drawBraidSide(m, m, W - m, m);      // Top
                drawBraidSide(W - m, m, W - m, H - m); // Right
                drawBraidSide(W - m, H - m, m, H - m); // Bottom
                drawBraidSide(m, H - m, m, m);      // Left

                // 3. Corner Medallions (Ornate Rosettes)
                const drawCornerMedallion = (cx: number, cy: number) => {
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.fillStyle = '#3b5a9a';
                    // Solid circle backing
                    ctx.beginPath();
                    ctx.arc(0, 0, bandWidth * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    // White starburst center
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 8; i++) {
                        ctx.rotate(Math.PI / 4);
                        ctx.beginPath();
                        ctx.moveTo(-4, 0);
                        ctx.lineTo(4, 0);
                        ctx.stroke();
                    }
                    ctx.restore();
                };

                drawCornerMedallion(m, m);
                drawCornerMedallion(W - m, m);
                drawCornerMedallion(W - m, H - m);
                drawCornerMedallion(m, H - m);

                // 4. Integrated Security Text (Right Side - White on Blue for Contrast)
                ctx.save();
                ctx.translate(W - m, H / 2);
                ctx.rotate(Math.PI / 2);
                ctx.font = 'bold 5px Arial';
                ctx.fillStyle = '#3b5a9a'; // Dark blue text OUTSIDE the band slightly or on it? Reference shows ON text line usually.
                // Adjusting to sit just inside the line for legibility
                ctx.fillText("ORIGINAL DOCUMENT HAS A COLORED BACKGROUND", 0, 10);
                ctx.restore();

                ctx.restore();
            }

            // 4b. SECURITY WARNING BAND (TOP OF CHECK) - ANSI Requirement for High Security
            if (isSecurityEnabled('microprint') && (isClassic || isFormal || isPayroll)) {
                ctx.save();
                ctx.font = 'bold 5.5px Arial';
                ctx.fillStyle = '#444';
                ctx.textAlign = 'center';
                ctx.imageSmoothingEnabled = false;
                const warningText = isPayroll
                    ? 'THIS PAYROLL CHECK HAS A SECURITY BACKGROUND, AN ARTIFICIAL WATERMARK ON THE BACK, AND MICROPRINTING IN THE BORDERS.'
                    : 'THE FACE OF THIS DOCUMENT HAS A COLORED BACKGROUND ON WHITE PAPER AND CONTAINS MICROPRINTING AND A VOID PANTOGRAPH.';
                ctx.fillText(warningText, W / 2, 22);
                ctx.restore();
            }

            // 4c. INDUSTRIAL SPECIALTY HEADERS — now rendered as Fabric objects (see below, after c.setBackgroundImage)

            // 4d. CLASSIC PAYROLL HEADER (Karen Art Studio Style)
            if (isKarenPayroll) {
                ctx.save();
                // TOP BLUE BANNER
                ctx.fillStyle = '#0055a4';
                ctx.fillRect(0, 0, W, 18);

                ctx.font = 'bold 8px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText('FOR SECURITY PURPOSES, THE FACE OF THIS DOCUMENT CONTAINS A COLORED BACKGROUND AND MICROPRINTING IN THE BORDER', W / 2, 12);

                // BLUE BORDER LINE
                ctx.strokeStyle = '#0055a4';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(5, 20, W - 10, textureBottom - 25);

                // Blue Safety Band at the bottom of the check part
                ctx.fillStyle = '#dae9f7';
                ctx.fillRect(40, textureBottom - 15, W - 80, 12);
                ctx.strokeStyle = '#0055a4';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(40, textureBottom - 15, W - 80, 12);

                ctx.font = 'bold 7px Arial';
                ctx.fillStyle = '#0055a4';
                ctx.textAlign = 'center';
                ctx.fillText('🔒 SECURITY FEATURES INCLUDED. DETAILS ON BACK 🔒', W / 2, textureBottom - 6);
                ctx.restore();
            } else if (isPayrollClassic) {
                // ... (Existing logic for payroll_classic if different)
                ctx.save();
                ctx.fillStyle = '#dae9f7';
                ctx.fillRect(40, textureBottom - 15, W - 80, 12);
                ctx.strokeStyle = '#0055a4';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(40, textureBottom - 15, W - 80, 12);
                ctx.font = 'bold 7px Arial';
                ctx.fillStyle = '#0055a4';
                ctx.textAlign = 'center';
                ctx.fillText('🔒 SECURITY FEATURES INCLUDED. DETAILS ON BACK 🔒', W / 2, textureBottom - 6);
                ctx.restore();
            }

            // 6. MICROPRINT FRAME (High-Fidelity)
            if (isSecurityEnabled('microprint')) {
                ctx.save();
                ctx.font = '3px Arial';
                ctx.fillStyle = `${primaryColor}60`;
                const microText = 'SAFE DOCUMENT • ORIGINAL DOCUMENT • '.repeat(20);

                // Top border
                ctx.fillText(microText, 10, 8);
                // Bottom border
                ctx.fillText(microText, 10, H - 10); // Edge to edge at bottom

                // Left Vertical
                ctx.save();
                ctx.translate(8, H - 10);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(microText, 0, 0);
                ctx.restore();

                // Right Vertical
                ctx.save();
                ctx.translate(W - 8, 8);
                ctx.rotate(Math.PI / 2);
                ctx.fillText(microText, 0, 0);
                ctx.restore();

                ctx.restore();
            }

            // 6b. PRISMATIC SECURITY COLUMN (Right Margin - Authentic Position)
            if (isSecurityEnabled('prismatic_column')) {
                ctx.save();
                // Positioned on the right margin, spanning full height between borders
                const colX = W - 30;
                const colW = 15;
                const prismGrad = ctx.createLinearGradient(colX, 0, colX + colW, 0);
                prismGrad.addColorStop(0, 'rgba(255,0,0,0.12)');
                prismGrad.addColorStop(0.5, 'rgba(0,255,0,0.12)');
                prismGrad.addColorStop(1, 'rgba(0,0,255,0.12)');

                ctx.fillStyle = prismGrad;
                ctx.fillRect(colX, 10, colW, H - 20); // Spans full height

                // Vertical text in column
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.font = 'bold 5px Arial'; ctx.textAlign = 'center';
                for (let y = 30; y < H - 30; y += 40) {
                    ctx.save();
                    ctx.translate(colX + (colW / 2), y);
                    ctx.rotate(Math.PI / 2);
                    ctx.fillText('SECURITY', 0, 0);
                    ctx.restore();
                }
                ctx.restore();
            }

            // 6c. BOFA VERTICAL SECURITY STRIPE
            if (checkStyle === 'bofa_classic' || (selectedBank === 'BOFA_CLASSIC')) {
                ctx.fillStyle = isBofaV2 ? '#3b5a9a' : '#012169'; // Slightly brighter blue for v2
                const barWidth = isBofaV2 ? 18 : 22;
                const barX = W - barWidth - 12;
                const barY = 12;
                const barH = H - 65;
                ctx.fillRect(barX, barY, barWidth, barH);

                ctx.save();
                ctx.fillStyle = 'white';
                ctx.font = isBofaV2 ? 'bold 6px Arial' : 'bold 6.5px Arial';
                ctx.textAlign = 'center';
                ctx.translate(barX + barWidth / 2 + 2, barY + barH / 2);
                ctx.rotate(Math.PI / 2);
                const barText = isBofaV2
                    ? "SECURITY FEATURES INCLUDE TRUE WATERMARK PAPER, MICROPRINT BORDER, HEAT SENSITIVE ICON, AND FOIL HOLOGRAM"
                    : "THIS DOCUMENT HAS A COLORED BACKGROUND AND MICROPRINTING. THE REVERSE SIDE INCLUDES AN ARTIFICIAL WATERMARK.";
                ctx.fillText(barText, 0, 0);
                ctx.restore();
            }

            // 7. WATERMARK - REMOVED from background context (Moved to Fabric Object for Draggability)
            // if (isSecurityEnabled('watermark')) { ... }

            // 8. GUILLOCHE PATTERN with IRIS PRINTING (Color Shifting)
            if (isSecurityEnabled('guilloche')) {
                const irisGrad = ctx.createLinearGradient(W - 120, 30, W - 40, 110);
                irisGrad.addColorStop(0, `${primaryColor}20`);
                irisGrad.addColorStop(0.5, `${secondaryColor}15`);
                irisGrad.addColorStop(1, `${accentColor}20`);

                ctx.strokeStyle = irisGrad;
                ctx.lineWidth = 0.6;
                for (let ring = 0; ring < 8; ring++) { // Increased complexity
                    ctx.beginPath();
                    for (let angle = 0; angle < Math.PI * 2; angle += 0.04) {
                        const r = 25 + ring * 6 + Math.sin(angle * 12) * 6;
                        const x = W - 80 + r * Math.cos(angle);
                        const y = 70 + r * Math.sin(angle);
                        if (angle === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
            }

            // 20. ANTI-COPY V-DOT (highly sophisticated dotted pattern)
            if (isSecurityEnabled('anti_copy_vdot')) {
                ctx.fillStyle = `${secondaryColor}10`;
                for (let y = 30; y < textureBottom - 30; y += 15) {
                    for (let x = 30; x < W - 30; x += 15) {
                        ctx.beginPath();
                        ctx.arc(x, y, 0.4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            // --- SYNCHRONOUS FABRIC INTEGRATION ---
            const bgImg = new fabric.Image(offscreen, {
                left: 0, top: 0, selectable: false, evented: false
            });
            c.add(bgImg);
            c.sendToBack(bgImg);

            // 9. HOLOGRAPHIC STRIP on LEFT (correct placement)
            if (isSecurityEnabled('holographic')) {
                const prismGradient = new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: 0, y2: textureBottom },
                    colorStops: [
                        { offset: 0, color: `${primaryColor}40` },
                        { offset: 0.25, color: `${secondaryColor}40` },
                        { offset: 0.5, color: `${accentColor}40` },
                        { offset: 0.75, color: `${primaryColor}40` },
                        { offset: 1, color: `${secondaryColor}40` }
                    ]
                });

                const holoRect = new fabric.Rect({
                    width: 25, height: textureBottom - 80,
                    fill: prismGradient, stroke: 'rgba(255,255,255,0.2)', strokeWidth: 0.5
                });

                // Micro-Logo Pattern Overlay for Hologram
                const logoPattern = [];
                for (let py = 10; py < textureBottom - 100; py += 30) {
                    logoPattern.push(new fabric.Text('★', {
                        left: 12, top: py, fontSize: 8, fill: 'rgba(255,255,255,0.3)', originX: 'center'
                    }));
                }

                const holoGroup = new fabric.Group([holoRect, ...logoPattern], {
                    left: W - 45, top: 40, selectable: true, hasControls: true
                });
                c.add(holoGroup);
            }

            // 10. EMBEDDED SECURITY THREAD (High-Fidelity)
            // Logic: A vertical thread with repeating micro-text
            const threadX = W * 0.7; // Positioned around 70% width
            const threadGroup = new fabric.Group([
                new fabric.Rect({
                    left: 0, top: 5, width: 8, height: textureBottom - 10,
                    fill: 'rgba(0,0,0,0.05)', stroke: 'rgba(0,0,0,0.03)', strokeWidth: 0.3
                }),
                ...Array.from({ length: 20 }).map((_, i) => new fabric.Text("OMNICHECK SECURE", {
                    left: 4, top: 10 + i * 15, fontSize: 3, angle: -90, fill: 'rgba(0,0,0,0.3)', originX: 'center'
                }))
            ], { left: threadX, top: 0, selectable: true, hasControls: true });
            c.add(threadGroup);

            // 11. SIMULATED PERFORATION (Realistic Tear Edge)
            c.add(new fabric.Line([0, 2, W, 2], {
                stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1, strokeDashArray: [1, 3], selectable: false
            }));
            c.add(new fabric.Line([2, 0, 2, H], {
                stroke: 'rgba(0,0,0,0.1)', strokeWidth: 1, strokeDashArray: [1, 3], selectable: false
            }));

            // 12. LATENT IMAGE SECURITY (Micro-Line Pattern)
            // Logic: A region where "SAFE" is visible only via scanning/tilting
            const latentText = 'SAFE';
            const latentX = W - 150;
            const latentY = 40;
            // Background for latent image (fine vertical lines)
            for (let i = 0; i < 40; i++) {
                ctx.strokeStyle = 'rgba(0,0,0,0.03)';
                ctx.lineWidth = 0.2;
                ctx.beginPath(); ctx.moveTo(latentX + i * 1, latentY); ctx.lineTo(latentX + i * 1, latentY + 20); ctx.stroke();
            }
            // The text itself in very faint horizontal lines
            ctx.strokeStyle = 'rgba(0,0,0,0.05)';
            ctx.font = 'bold 12px Arial';
            ctx.lineWidth = 0.5;
            ctx.strokeText(latentText, latentX + 5, latentY + 15);



            // THERMOCHROMIC INK SEAL (ULTRA-REALISTIC METALLIC SHINE)
            if (isSecurityEnabled('thermochromic')) {
                const sealColor = secondaryColor;

                // Shiny radial gradient for the seal background
                const shinyGradient = new fabric.Gradient({
                    type: 'radial',
                    coords: { x1: 18, y1: 18, x2: 18, y2: 18, r1: 0, r2: 18 },
                    colorStops: [
                        { offset: 0, color: `${sealColor}80` },
                        { offset: 0.7, color: `${sealColor}A0` },
                        { offset: 1, color: `${sealColor}C0` }
                    ]
                });

                const thermoSealGroup = new fabric.Group([
                    // Main Seal Body
                    new fabric.Circle({ radius: 18, fill: shinyGradient, stroke: `${sealColor}60`, strokeWidth: 0.8 }),
                    // Specular Highlight (The "Shine")
                    new fabric.Circle({
                        radius: 12, left: 4, top: 4,
                        fill: new fabric.Gradient({
                            type: 'radial',
                            coords: { x1: 6, y1: 6, x2: 6, y2: 6, r1: 0, r2: 12 },
                            colorStops: [
                                { offset: 0, color: 'rgba(255,255,255,0.4)' },
                                { offset: 1, color: 'rgba(255,255,255,0)' }
                            ]
                        })
                    }),
                    new fabric.Text('SAFE', { left: 18, top: 11, fontSize: 8, fontWeight: 'bold', fill: '#FFF', originX: 'center' }),
                    new fabric.Text('TOUCH TO VERIFY', { left: 18, top: 21, fontSize: 4.5, fill: '#EEE', originX: 'center', fontWeight: 'bold' }),
                    new fabric.Text('REACTS TO HEAT', { left: 18, top: 28, fontSize: 3.5, fill: '#DDD', originX: 'center' })
                ], {
                    id: 'thermoSeal',
                    left: objectPositionsRef.current.thermoSeal?.left ?? W - 70,
                    top: Math.min(objectPositionsRef.current.thermoSeal?.top ?? 175, textureBottom - 35), // MICR GUARD
                    scaleX: objectPositionsRef.current.thermoSeal?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.thermoSeal?.scaleY ?? 1,
                    selectable: true, hasControls: true
                } as any);
                c.add(thermoSealGroup);
            }

            // CPSA PADLOCK ICON (AUTHENTIC POSITION - NEXT TO AMOUNT BOX)
            if (isSecurityEnabled('padlock_icon')) {
                const padlockGroup = new fabric.Group([
                    new fabric.Text('🔒', { fontSize: 13, fill: '#222' }),
                    new fabric.Text('SECURE', { left: 18, top: 3, fontSize: 6, fontWeight: 'bold', fill: '#444' }),
                    new fabric.Text('DETAILS\nON BACK', { left: 18, top: 10, fontSize: 3.5, fontWeight: 'bold', fill: '#666', lineHeight: 1 })
                ], {
                    id: 'padlockGroup',
                    left: objectPositionsRef.current.padlockGroup?.left ?? W - 155,
                    top: Math.min(objectPositionsRef.current.padlockGroup?.top ?? 105, textureBottom - 20), // MICR GUARD
                    scaleX: objectPositionsRef.current.padlockGroup?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.padlockGroup?.scaleY ?? 1,
                    selectable: true, hasControls: true
                } as any);
                c.add(padlockGroup);
            }

            // SECURITY WARNING BAND (REPOSITIONED TO BOTTOM - DRAGGABLE)
            if (isSecurityEnabled('warning_band')) {
                const bandingGroup = new fabric.Group([
                    new fabric.Rect({
                        left: 0, top: 0, width: W - 140, height: 10,
                        fill: 'rgba(0,0,0,0.02)', stroke: '#ccc', strokeWidth: 0.3
                    }),
                    new fabric.Text("THE FRONT OF THIS DOCUMENT HAS A MICROPRINT BORDER, THE PADLOCK ICON, A MICROPRINT SIGNATURE LINE, AND THE SECURITY WARNING BOX. THE REVERSE HAS AN ARTIFICIAL WATERMARK AND A LIST OF SECURITY FEATURES.", {
                        left: (W - 140) / 2, top: 3, fontSize: 5.2, fontWeight: 'bold', fill: '#444', originX: 'center'
                    })
                ], {
                    id: 'warning_band',
                    left: objectPositionsRef.current.warning_band?.left ?? 45,
                    top: objectPositionsRef.current.warning_band?.top ?? H - 20,
                    scaleX: objectPositionsRef.current.warning_band?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.warning_band?.scaleY ?? 1,
                    selectable: true, hasControls: true
                } as any);
                c.add(bandingGroup);
            }


            const layout = getLayout(checkStyle, W, H);
            // "No Lines" style for modern digital/e-checks
            const showLines = !['echeck', 'payroll', 'clean_modern'].includes(checkStyle);
            const lineStroke = showLines ? '#333' : 'transparent';

            // 11. CHECK NUMBER (DRAGGABLE) (Modified for Treasury "B" prefix and Karen "No." prefix)
            const displayCheckNum = isTreasury && !checkData.checkNumber.startsWith('B') ? 'B ' + checkData.checkNumber : (isKarenPayroll ? `No. ${checkData.checkNumber}` : (isBofaV2 ? checkData.checkNumber.padStart(8, '0') : checkData.checkNumber));
            c.add(new fabric.Text(displayCheckNum, {
                id: 'checkNumber',
                left: objectPositionsRef.current.checkNumber?.left ?? layout.checkNumber.left,
                top: objectPositionsRef.current.checkNumber?.top ?? layout.checkNumber.top,
                scaleX: objectPositionsRef.current.checkNumber?.scaleX ?? 1,
                scaleY: objectPositionsRef.current.checkNumber?.scaleY ?? 1,
                fontSize: isTreasury ? 28 : (isKarenPayroll ? 18 : (isBofaV2 ? 28 : 24)),
                fontWeight: 'bold',
                fill: '#000',
                fontFamily: (isTreasury || isKarenPayroll || isBofaV2) ? (isKarenPayroll ? 'Times New Roman, serif' : 'Arial') : fontFamily,
                selectable: true, hasControls: true
            } as any));

            if (!isTreasury) {
                c.add(new fabric.Text(checkData.fractionalRouting, {
                    id: 'fractionalRouting',
                    left: objectPositionsRef.current.fractionalRouting?.left ?? layout.fractionalRouting.left,
                    top: objectPositionsRef.current.fractionalRouting?.top ?? layout.fractionalRouting.top,
                    scaleX: objectPositionsRef.current.fractionalRouting?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.fractionalRouting?.scaleY ?? 1,
                    fontSize: isKarenPayroll ? 9 : 11, fill: '#666',
                    fontFamily: isKarenPayroll ? 'Times New Roman, serif' : fontFamily,
                    selectable: true, hasControls: true
                } as any));
            }

            // 11b. INDUSTRIAL SPECIALTY HEADERS (Fabric objects — selectable/deletable)
            if (isPayroll || isCashier || isMoneyOrder) {
                const headerText = isPayroll ? 'PAYROLL CHECK' : (isCashier ? 'CASHIER\'S CHECK' : 'MONEY ORDER');
                const subHeaderText = isPayroll ? 'NON-NEGOTIABLE ADVICE' : (isCashier ? 'OFFICIAL INSTRUMENT' : 'PERSONAL MONEY ORDER');

                c.add(new fabric.Text(headerText, {
                    id: 'specialtyHeader',
                    left: objectPositionsRef.current.specialtyHeader?.left ?? (W / 2),
                    top: objectPositionsRef.current.specialtyHeader?.top ?? 28,
                    scaleX: objectPositionsRef.current.specialtyHeader?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.specialtyHeader?.scaleY ?? 1,
                    fontSize: 16, fontWeight: 'bold', fill: primaryColor,
                    fontFamily: 'Arial Black, Arial, sans-serif',
                    originX: 'center',
                    selectable: true, hasControls: true
                } as any));

                c.add(new fabric.Text(subHeaderText, {
                    id: 'specialtySubHeader',
                    left: objectPositionsRef.current.specialtySubHeader?.left ?? (W / 2),
                    top: objectPositionsRef.current.specialtySubHeader?.top ?? 48,
                    scaleX: objectPositionsRef.current.specialtySubHeader?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.specialtySubHeader?.scaleY ?? 1,
                    fontSize: 9, fontWeight: 'bold', fill: '#333',
                    fontFamily: 'Arial, sans-serif',
                    originX: 'center',
                    selectable: true, hasControls: true
                } as any));
            }

            // 12. ACCOUNT HOLDER / COMPANY HEADER (DRAGGABLE)
            const companyHeader = (isAnyPayroll)
                ? `${checkData.accountHolderName}\n${checkData.accountHolderAddress}`
                : checkData.accountHolderName;

            c.add(new fabric.IText(companyHeader, {
                id: 'accHolderName',
                left: objectPositionsRef.current.accHolderName?.left ?? layout.accHolder.left,
                top: objectPositionsRef.current.accHolderName?.top ?? layout.accHolder.top,
                scaleX: objectPositionsRef.current.accHolderName?.scaleX ?? 1,
                scaleY: objectPositionsRef.current.accHolderName?.scaleY ?? 1,
                fontSize: isKarenPayroll ? 17 : 14,
                fontWeight: 'bold', fill: '#000',
                fontFamily: isKarenPayroll ? 'Times New Roman, serif' : fontFamily,
                selectable: true, hasControls: true,
                lineHeight: 1.2
            } as any));

            // 12b. EIN (Separate editable/deletable object — Payroll only)
            if (isPayroll) {
                c.add(new fabric.IText(`EIN: ${checkData.ein}`, {
                    id: 'einText',
                    left: objectPositionsRef.current.einText?.left ?? layout.accHolder.left,
                    top: objectPositionsRef.current.einText?.top ?? (layout.accHolder.top + (isKarenPayroll ? 50 : 42)),
                    scaleX: objectPositionsRef.current.einText?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.einText?.scaleY ?? 1,
                    fontSize: 12, fontWeight: 'bold', fill: '#000',
                    fontFamily: isKarenPayroll ? 'Times New Roman, serif' : fontFamily,
                    selectable: true, hasControls: true
                } as any));
            }

            if (!isAnyPayroll) {
                c.add(new fabric.IText(checkData.accountHolderAddress, {
                    id: 'accHolderAddr',
                    left: objectPositionsRef.current.accHolderAddr?.left ?? layout.accHolder.left,
                    top: objectPositionsRef.current.accHolderAddr?.top ?? layout.accHolder.top + 18,
                    scaleX: objectPositionsRef.current.accHolderAddr?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.accHolderAddr?.scaleY ?? 1,
                    fontSize: 12, fill: '#444', fontFamily, selectable: true, hasControls: true
                } as any));
            }

            // 13. DATE (DRAGGABLE GROUP)
            // 13. DATE (UNGROUPED)
            if (!isTreasury) {
                // 13a. Date Label
                c.add(new fabric.Text(isBofaV2 ? 'DATE : ' : (isKarenPayroll ? '' : 'DATE'), {
                    id: 'dateLabel',
                    left: objectPositionsRef.current.dateLabel?.left ?? layout.dateGroup.left,
                    top: objectPositionsRef.current.dateLabel?.top ?? (layout.dateGroup.top + 3),
                    fontSize: isBofaV2 ? 14 : 10,
                    fontWeight: 'bold', fill: isBofaV2 ? '#000' : '#555',
                    fontFamily: isBofaV2 ? 'Arial' : fontFamily,
                    selectable: true, hasControls: true
                } as any));

                // 13b. Date Value (IText)
                const dateIText = new fabric.IText(checkData.date, {
                    id: 'dateValue',
                    left: objectPositionsRef.current.dateValue?.left ?? (layout.dateGroup.left + (isBofaV2 ? 60 : (isKarenPayroll ? 0 : 55))),
                    top: objectPositionsRef.current.dateValue?.top ?? (layout.dateGroup.top + (isBofaV2 ? 1.5 : -2)),
                    fontSize: isKarenPayroll ? 17 : 22,
                    fill: (handwritingStyle !== 'none' && !isBofaV2) ? handwritingColor : '#000',
                    fontFamily: isKarenPayroll ? 'Times New Roman' : (isBofaV2 ? 'Arial' : getHandwritingFont(handwritingStyle)),
                    fontStyle: (handwritingStyle !== 'none' && !isBofaV2) ? 'normal' : (isBofaV2 ? 'normal' : 'italic'),
                    shadow: (handwritingStyle !== 'none' && !isBofaV2) ? new fabric.Shadow({
                        color: `${handwritingColor}40`, blur: 1.5, offsetX: 0, offsetY: 0
                    }) : undefined,
                    selectable: true, hasControls: true, lockScalingY: false, lockScalingX: false
                } as any);

                // Auto-scale Date
                const maxDateWidth = isKarenPayroll ? 80 : (isBofaV2 ? 120 : 80); // Approx width
                if (dateIText.width && dateIText.width > maxDateWidth) {
                    const scale = maxDateWidth / dateIText.width;
                    dateIText.set({ scaleX: scale, scaleY: scale });
                }
                c.add(dateIText);

                // 13c. Date Line
                if (!isBofaV2) {
                    const lineCoords = isKarenPayroll ? [-5, 0, 80, 0] : [0, 0, 100, 0];
                    c.add(new fabric.Line(lineCoords, {
                        id: 'dateLine',
                        left: objectPositionsRef.current.dateLine?.left ?? (layout.dateGroup.left + (isKarenPayroll ? -5 : 35)),
                        top: objectPositionsRef.current.dateLine?.top ?? (layout.dateGroup.top + (isKarenPayroll ? 12 : 16)),
                        stroke: lineStroke, strokeWidth: isKarenPayroll ? 0.5 : 1,
                        selectable: true, hasControls: true
                    } as any));
                }
            }

            // 14. AMOUNT BOX (DRAGGABLE GROUP)
            // 14. AMOUNT BOX (UNGROUPED)
            // 14a. Amount Box (Deletable)
            c.add(new fabric.Rect({
                id: 'amountBox',
                left: objectPositionsRef.current.amountBox?.left ?? layout.amountGroup.left,
                top: objectPositionsRef.current.amountBox?.top ?? layout.amountGroup.top,
                width: 160, height: 38,
                fill: isKarenPayroll ? 'transparent' : 'rgba(255,255,255,0.6)',
                stroke: (!showAmountBorder || isTreasury || isKarenPayroll) ? 'transparent' : '#222',
                strokeWidth: 1.5,
                selectable: true, hasControls: true, lockScalingY: false, lockScalingX: false
            } as any));

            // 14b. Dollar Sign
            c.add(new fabric.Text('$', {
                id: 'amountSign',
                left: objectPositionsRef.current.amountSign?.left ?? (layout.amountGroup.left - 20),
                top: objectPositionsRef.current.amountSign?.top ?? (layout.amountGroup.top + 10),
                fontSize: 20, fontWeight: 'bold', fill: '#333',
                fontFamily: isKarenPayroll ? 'Times New Roman' : fontFamily,
                selectable: true, hasControls: true
            } as any));

            // 14c. Amount Value (IText)
            c.add(new fabric.IText((isTreasury || isKarenPayroll || isCashier) ? `**${(isTreasury || isKarenPayroll) ? '**' : ''} ${checkData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : checkData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }), {
                id: 'amountValue',
                left: objectPositionsRef.current.amountValue?.left ?? (layout.amountGroup.left + 10),
                top: objectPositionsRef.current.amountValue?.top ?? (layout.amountGroup.top + (handwritingStyle !== 'none' ? 4 : 8)),
                fontSize: handwritingStyle !== 'none' ? 24 : 20,
                fontWeight: handwritingStyle !== 'none' ? 'normal' : 'bold',
                fill: handwritingStyle !== 'none' ? handwritingColor : '#000',
                fontFamily: (isKarenPayroll && handwritingStyle === 'none') ? 'Times New Roman' : getHandwritingFont(handwritingStyle),
                shadow: handwritingStyle !== 'none' ? new fabric.Shadow({
                    color: `${handwritingColor}40`, blur: 1.5, offsetX: 0, offsetY: 0
                }) : undefined,
                selectable: true, hasControls: true, lockScalingY: false, lockScalingX: false
            } as any));

            // 14d. Dollars Label (Small)
            if (!(isTreasury || isKarenPayroll || isPayrollClassic || isBofaV2)) {
                c.add(new fabric.Text('DOLLARS', {
                    id: 'amountLabel',
                    left: objectPositionsRef.current.amountLabel?.left ?? (layout.amountGroup.left + 75),
                    top: objectPositionsRef.current.amountLabel?.top ?? (layout.amountGroup.top + 31),
                    fontSize: 6, fontWeight: 'bold', fill: '#555', fontFamily,
                    selectable: true, hasControls: true
                } as any));
            }

            // 15. PAY TO THE ORDER OF (UNGROUPED)
            const payToLabel1 = isPayroll ? 'Pay to the' : (isTreasury ? 'Pay to' : 'PAY TO THE');
            const payToLabel2 = isPayroll ? 'order of' : (isTreasury ? 'the order of' : 'ORDER OF');

            // 15a. Label 1
            c.add(new fabric.Text(isBofaV2 ? 'Pay To :' : payToLabel1, {
                id: 'payToLabel1',
                left: objectPositionsRef.current.payToLabel1?.left ?? layout.payTo.left,
                top: objectPositionsRef.current.payToLabel1?.top ?? layout.payTo.top,
                fontSize: isBofaV2 ? 15 : 11,
                fontWeight: isBofaV2 ? '900' : 'bold',
                fill: isBofaV2 ? '#000' : '#555',
                fontFamily: (isTreasury || isBofaV2) ? (isBofaV2 ? 'Arial Black' : 'Times New Roman') : fontFamily,
                selectable: true, hasControls: true, lockScalingY: true, lockScalingX: true
            } as any));

            // 15b. Label 2
            if (!isBofaV2) {
                c.add(new fabric.Text(payToLabel2, {
                    id: 'payToLabel2',
                    left: objectPositionsRef.current.payToLabel2?.left ?? layout.payTo.left,
                    top: objectPositionsRef.current.payToLabel2?.top ?? (layout.payTo.top + 16),
                    fontSize: 11, fontWeight: 'bold', fill: '#555',
                    fontFamily: isTreasury ? 'Times New Roman' : fontFamily,
                    selectable: true, hasControls: true, lockScalingY: true, lockScalingX: true
                } as any));
            }

            // 15c. Payee Name (IText - Editable)
            const payeeNameIText = new fabric.IText(checkData.payeeName || ' ', {
                id: 'payeeNameVal',
                left: objectPositionsRef.current.payeeNameVal?.left ?? (layout.payTo.left + (isTreasury ? 70 : 70)),
                top: objectPositionsRef.current.payeeNameVal?.top ?? (layout.payTo.top + (handwritingStyle !== 'none' ? 2 : 5)),
                fontSize: checkData.payeeFontSize,
                fill: handwritingStyle !== 'none' ? handwritingColor : '#000',
                fontFamily: getHandwritingFont(handwritingStyle),
                angle: handwritingRotation + (Math.random() - 0.5) * handwritingVariation,
                shadow: (handwritingStyle !== 'none' && !isBofaV2) ? new fabric.Shadow({
                    color: `${handwritingColor}40`, blur: 1.5, offsetX: 0, offsetY: 0
                }) : undefined,
                selectable: true, hasControls: true, lockScalingY: false, lockScalingX: false
            } as any);

            // Auto-scale logic for Payee (Initial render)
            const maxPayeeWidth = (W - 230) - 70;
            if (payeeNameIText.width && payeeNameIText.width > maxPayeeWidth) {
                const scale = maxPayeeWidth / payeeNameIText.width;
                payeeNameIText.set({ scaleX: scale, scaleY: scale });
            }
            c.add(payeeNameIText);

            // 15d. Payee Line (Deletable)
            if (!isTreasury && !isBofaV2) {
                c.add(new fabric.Line([0, 0, (W - 230 - 65), 0], {
                    id: 'payeeLine',
                    left: objectPositionsRef.current.payeeLine?.left ?? (layout.payTo.left + 65),
                    top: objectPositionsRef.current.payeeLine?.top ?? (layout.payTo.top + 28),
                    stroke: lineStroke, strokeWidth: 1,
                    selectable: true, hasControls: true, lockScalingY: true
                } as any));
            }

            // 16. WRITTEN AMOUNT (UNGROUPED)
            if (!isTreasury) {
                // Auto-scale logic for long amounts
                const amountString = isBofaV2 ? `***${numberToWords(checkData.amount).toUpperCase()}***` : numberToWords(checkData.amount).toUpperCase();
                const maxAmountWidth = (W - 220) - (isBofaV2 ? 90 : 0);

                // 16a. Amount Words Value (IText)
                const amountWordsIText = new fabric.IText(amountString, {
                    id: 'amountWordsValue',
                    left: objectPositionsRef.current.amountWordsValue?.left ?? (layout.writtenAmount.left + (isBofaV2 ? 90 : 0)),
                    top: objectPositionsRef.current.amountWordsValue?.top ?? (layout.writtenAmount.top + ((handwritingStyle !== 'none' && !isBofaV2) ? -3 : 0)),
                    fontSize: (handwritingStyle !== 'none' || isPayroll || isBofaV2) ? 19 : 16,
                    fontWeight: 'bold',
                    fill: (handwritingStyle !== 'none' && !isPayroll && !isBofaV2) ? handwritingColor : '#000',
                    fontFamily: (handwritingStyle !== 'none' && !isPayroll && !isBofaV2) ? getHandwritingFont(handwritingStyle) : (isBofaV2 ? 'Arial' : 'Times New Roman, serif'),
                    shadow: (handwritingStyle !== 'none' && !isBofaV2) ? new fabric.Shadow({
                        color: `${handwritingColor}40`, blur: 1.5, offsetX: 0, offsetY: 0
                    }) : undefined,
                    selectable: true, hasControls: true, lockScalingY: false, lockScalingX: false
                } as any);

                // Check text width and scale if needed
                if (amountWordsIText.width && amountWordsIText.width > maxAmountWidth) {
                    const scaleFactor = maxAmountWidth / amountWordsIText.width;
                    amountWordsIText.set({ scaleX: scaleFactor, scaleY: scaleFactor });
                }
                c.add(amountWordsIText);

                // 16b. BofA Label
                if (isBofaV2) {
                    c.add(new fabric.Text('Amount :', {
                        id: 'amountWordsLabel',
                        left: objectPositionsRef.current.amountWordsLabel?.left ?? layout.writtenAmount.left,
                        top: objectPositionsRef.current.amountWordsLabel?.top ?? layout.writtenAmount.top,
                        fontSize: 15, fontWeight: '900',
                        fill: '#000', fontFamily: 'Arial Black',
                        selectable: true, hasControls: true
                    } as any));
                }

                // 16c. Dollars Suffix
                if (!isPayroll && !isBofaV2) {
                    c.add(new fabric.Text('DOLLARS', {
                        id: 'amountWordsSuffix',
                        left: objectPositionsRef.current.amountWordsSuffix?.left ?? (layout.writtenAmount.left + (W - 200)),
                        top: objectPositionsRef.current.amountWordsSuffix?.top ?? (layout.writtenAmount.top + 2),
                        fontSize: 10, fontWeight: 'bold', fill: '#222', fontFamily,
                        selectable: true, hasControls: true
                    } as any));
                }

                // 16d. Line (Deletable)
                if (!isPayroll && !isBofaV2) {
                    c.add(new fabric.Line([0, 0, (W - 110 + 5), 0], {
                        id: 'amountWordsLine',
                        left: objectPositionsRef.current.amountWordsLine?.left ?? (layout.writtenAmount.left - 5),
                        top: objectPositionsRef.current.amountWordsLine?.top ?? (layout.writtenAmount.top + 22),
                        stroke: lineStroke, strokeWidth: 1,
                        selectable: true, hasControls: true, lockScalingY: true
                    } as any));
                }
            }

            // 16b. PAYEE ADDRESS BLOCK (Classic Style)
            // 16b. PAYEE ADDRESS BLOCK (Classic Style & Karen Style)
            if (isPayrollClassic || isKarenPayroll) {
                const payeeAddrGroup = new fabric.Group([
                    new fabric.Text(checkData.payeeName || '', { left: 0, top: 0, fontSize: 13, fontWeight: 'bold', fill: '#000', fontFamily: isKarenPayroll ? 'Times New Roman, serif' : fontFamily }),
                    new fabric.Text(checkData.payeeAddress || '', { left: 0, top: 16, fontSize: 11, fill: '#333', fontFamily: isKarenPayroll ? 'Times New Roman, serif' : fontFamily, lineHeight: 1.1 })
                ], {
                    id: 'payeeAddress',
                    left: objectPositionsRef.current.payeeAddress?.left ?? (layout as any).payeeAddress.left,
                    top: objectPositionsRef.current.payeeAddress?.top ?? (layout as any).payeeAddress.top,
                    selectable: true, hasControls: true
                } as any);
                c.add(payeeAddrGroup);
            }

            const bankNameText = isTreasury ? "United States Treasury" : ((isPayrollClassic || isKarenPayroll || isBofaV2) ? checkData.bankName : '🏦 ' + checkData.bankName);

            const bankDetailsGroup = new fabric.Group([
                isBofaV2 ? new fabric.Text('BANK OF AMERICA', { left: 0, top: 0, fontSize: 13, fontWeight: 'bold', fill: '#012169', fontFamily: 'Arial' }) :
                    new fabric.Text(bankNameText, {
                        left: 0, top: 0,
                        fontSize: isTreasury ? 28 : (isKarenPayroll ? 13 : 14),
                        fontWeight: 'bold',
                        fill: primaryColor,
                        fontFamily: (isTreasury || isKarenPayroll) ? (isKarenPayroll ? 'Times New Roman, serif' : 'Garamond, serif') : fontFamily,
                        shadow: (!isBofaV2) ? new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 0.5, offsetX: 0.2, offsetY: 0.2 }) : undefined
                    }),
                isBofaV2 ? new fabric.Rect({ left: 135, top: 0, width: 20, height: 12, fill: '#da291c' }) : // BofA Red Flag
                    new fabric.Text(isTreasury ? '' : `${(checkData as any).bankAddress || ''}\nRouting: ${checkData.routingNumber}`, { left: 0, top: 18, fontSize: isKarenPayroll ? 9 : 10, fill: secondaryColor, fontFamily: isKarenPayroll ? 'Times New Roman, serif' : fontFamily })
            ], {
                id: 'bankDetails',
                left: objectPositionsRef.current.bankDetails?.left ?? layout.bankDetails.left,
                top: objectPositionsRef.current.bankDetails?.top ?? layout.bankDetails.top,
                scaleX: objectPositionsRef.current.bankDetails?.scaleX ?? 1,
                scaleY: objectPositionsRef.current.bankDetails?.scaleY ?? 1,
                selectable: true, hasControls: true
            } as any);
            c.add(bankDetailsGroup);

            // US TREASURY SPECIFIC DATA BLOCKS
            if (isTreasury) {
                // Disbursing Center & Date Block
                const dateParts = checkData.date.replace(/\//g, ' ').split(' ');
                // Simple spaced date if 3 parts, else literal
                const dateStr = dateParts.length === 3 ? `${dateParts[0]} ${dateParts[1]} ${dateParts[2].slice(-2)}` : checkData.date;

                const disburseGroup = new fabric.Group([
                    new fabric.Text(`${dateStr}   20090900   KANSAS CITY, MO`, {
                        left: 0, top: 0, fontSize: 11, fontFamily: 'Courier New', fontWeight: 'bold'
                    }),
                    new fabric.Text('000791312102   4045  09201401  I', {
                        left: 0, top: 14, fontSize: 11, fontFamily: 'Courier New', fontWeight: 'bold'
                    })
                ], {
                    left: 280, top: 80, selectable: true
                });
                c.add(disburseGroup);

                // Check No. Label
                c.add(new fabric.Text('Check No.', {
                    left: W - 180, top: 60, fontSize: 8, fill: '#666', fontFamily: 'Arial'
                }));
                // Fractional Routing Stack
                c.add(new fabric.Text('15-51\n 000', {
                    left: 560, top: 35, fontSize: 9, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center'
                }));
            }

            // 18. MEMO (DRAGGABLE GROUP)
            // 18. MEMO (UNGROUPED)
            if (!isTreasury) {
                // 18a. Memo Label
                c.add(new fabric.Text(isBofaV2 ? 'MEMO :' : 'MEMO', {
                    id: 'memoLabel',
                    left: objectPositionsRef.current.memoLabel?.left ?? layout.memoGroup.left,
                    top: objectPositionsRef.current.memoLabel?.top ?? (layout.memoGroup.top + 2),
                    fontSize: isBofaV2 ? 10 : 8, fontWeight: 'bold', fill: isBofaV2 ? '#000' : '#555',
                    fontFamily: isBofaV2 ? 'Arial' : fontFamily,
                    selectable: true, hasControls: true
                } as any));

                // 18b. Memo Value (IText)
                const memoIText = new fabric.IText(checkData.memo || '', {
                    id: 'memoValue',
                    left: objectPositionsRef.current.memoValue?.left ?? (layout.memoGroup.left + (isBofaV2 ? 60 : 50)),
                    top: objectPositionsRef.current.memoValue?.top ?? layout.memoGroup.top,
                    fontSize: checkData.memoFontSize,
                    fill: handwritingStyle !== 'none' ? handwritingColor : '#000',
                    fontFamily: (isBofaV2 && handwritingStyle === 'none') ? 'Arial' : getHandwritingFont(handwritingStyle),
                    angle: handwritingRotation + (Math.random() - 0.5) * handwritingVariation,
                    shadow: (handwritingStyle !== 'none' && !isBofaV2) ? new fabric.Shadow({
                        color: `${handwritingColor}40`, blur: 1.5, offsetX: 0, offsetY: 0
                    }) : undefined,
                    selectable: true, hasControls: true, lockScalingY: false, lockScalingX: false
                } as any);

                // Auto-scale Memo
                const maxMemoWidth = 260 - 50;
                if (memoIText.width && memoIText.width > maxMemoWidth) {
                    const scale = maxMemoWidth / memoIText.width;
                    memoIText.set({ scaleX: scale, scaleY: scale });
                }
                c.add(memoIText);

                // 18c. Memo Line
                if (!isBofaV2) {
                    c.add(new fabric.Line([0, 0, (260 - 45), 0], {
                        id: 'memoLine',
                        left: objectPositionsRef.current.memoLine?.left ?? (layout.memoGroup.left + 45),
                        top: objectPositionsRef.current.memoLine?.top ?? (layout.memoGroup.top + 17),
                        stroke: lineStroke, strokeWidth: 1,
                        selectable: true, hasControls: true, lockScalingY: true
                    } as any));
                }
            }

            // 19. SIGNATURE AREA (UNGROUPED)
            // 19a. Signature Line
            if (!isBofaV2) {
                c.add(new fabric.Line([0, 0, 300, 0], {
                    id: 'signatureLine',
                    left: objectPositionsRef.current.signatureLine?.left ?? layout.signatureGroup.left,
                    top: objectPositionsRef.current.signatureLine?.top ?? (layout.signatureGroup.top + 20),
                    stroke: lineStroke, strokeWidth: 1.2,
                    selectable: true, hasControls: true, lockScalingY: true
                } as any));
            } else {
                c.add(new fabric.Line([0, 0, 260, 0], {
                    id: 'signatureLine',
                    left: objectPositionsRef.current.signatureLine?.left ?? layout.signatureGroup.left,
                    top: objectPositionsRef.current.signatureLine?.top ?? (layout.signatureGroup.top + 20),
                    stroke: '#333', strokeWidth: 0.5,
                    selectable: true, hasControls: true, lockScalingY: true
                } as any));
            }

            // 19b. X Mark
            c.add(new fabric.Polyline([
                { x: 0, y: 0 },
                { x: 0, y: 20 }
            ], {
                id: 'signatureX',
                left: objectPositionsRef.current.signatureX?.left ?? layout.signatureGroup.left,
                top: objectPositionsRef.current.signatureX?.top ?? layout.signatureGroup.top,
                stroke: isPayroll ? '#555' : lineStroke, strokeWidth: 1.5, fill: 'transparent',
                selectable: true, hasControls: true
            } as any));

            // 19c. Signature Label (Authorized Signature)
            c.add(new fabric.Text((checkStyle === 'bofa_classic' || isPayroll || isKarenPayroll) ? '' : (isCashier ? 'OFFICER SIGNATURE' : 'AUTHORIZED SIGNATURE'), {
                id: 'signatureLabel',
                left: objectPositionsRef.current.signatureLabel?.left ?? layout.signatureGroup.left,
                top: objectPositionsRef.current.signatureLabel?.top ?? (layout.signatureGroup.top + 25),
                fontSize: 7, fontWeight: 'bold', fill: '#444', fontFamily: 'Arial',
                selectable: true, hasControls: true
            } as any));

            // 19d. Void / Warning Text
            c.add(new fabric.Text(isTreasury ? 'VOID AFTER ONE YEAR' : (checkStyle === 'bofa_classic' ? '(VOID AFTER 90 DAYS)' : (isPayroll ? '' : (isCashier ? 'NOT VALID WITHOUT TWO SIGNATURES' : (isMoneyOrder ? 'REPORT FRAUD - CALL 1-800-BANK' : 'NOT VALID WITHOUT TWO SIGNATURES IF OVER $10,000')))), {
                id: 'signatureWarning',
                left: objectPositionsRef.current.signatureWarning?.left ?? layout.signatureGroup.left,
                top: objectPositionsRef.current.signatureWarning?.top ?? (layout.signatureGroup.top + 35),
                fontSize: 6, fill: '#444', fontFamily: 'Arial', fontWeight: isTreasury ? 'bold' : 'normal',
                selectable: true, hasControls: true
            } as any));

            // 19e. Treasury Regional Officer Label
            if (isTreasury) {
                c.add(new fabric.Text('REGIONAL DISBURSING OFFICER', {
                    id: 'treasuryOfficerLabel',
                    left: objectPositionsRef.current.treasuryOfficerLabel?.left ?? layout.signatureGroup.left,
                    top: objectPositionsRef.current.treasuryOfficerLabel?.top ?? (layout.signatureGroup.top - 10),
                    fontSize: 6, fill: '#444', fontFamily: 'Arial', fontWeight: 'bold',
                    selectable: true, hasControls: true
                } as any));
            }

            // 19f. Microprint Indicator (MP)
            if (!isKarenPayroll && !isBofaV2) {
                c.add(new fabric.Text('MP', {
                    id: 'mpIndicator',
                    left: objectPositionsRef.current.mpIndicator?.left ?? (layout.signatureGroup.left + 255),
                    top: objectPositionsRef.current.mpIndicator?.top ?? (layout.signatureGroup.top + 20),
                    fontSize: 7, fontWeight: 'bold', fill: '#444', fontFamily: 'Arial',
                    selectable: true, hasControls: true
                } as any));
            }

            // SPECIAL: BofA Business v2 Octagonal Hologram (SHINING GLOWING SPOT)
            if (isBofaV2) {
                const sideLen = 16;
                const points = [];
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI) / 4;
                    points.push({ x: 25 + sideLen * Math.cos(angle), y: 25 + sideLen * Math.sin(angle) });
                }

                // 1. Bloom Layer (Soft Focus Light Emission)
                const bloom = new fabric.Circle({
                    radius: 28, left: 25, top: 25, originX: 'center', originY: 'center',
                    fill: new fabric.Gradient({
                        type: 'radial',
                        coords: { x1: 28, y1: 28, x2: 28, y2: 28, r1: 0, r2: 28 },
                        colorStops: [
                            { offset: 0, color: 'rgba(255, 215, 0, 0.4)' },
                            { offset: 1, color: 'rgba(255, 215, 0, 0)' }
                        ]
                    }),
                    selectable: false, evented: false
                });

                // 2. Main Iridescent Octagon
                const holoPolygon = new fabric.Polygon(points, {
                    left: 25, top: 25, originX: 'center', originY: 'center',
                    fill: new fabric.Gradient({
                        type: 'linear',
                        coords: { x1: 0, y1: 0, x2: 40, y2: 40 },
                        colorStops: [
                            { offset: 0, color: '#ffd700cc' },
                            { offset: 0.25, color: '#ffffff' },
                            { offset: 0.5, color: '#c0c0c0' },
                            { offset: 0.75, color: '#ffd70099' },
                            { offset: 1, color: '#ffffffcc' }
                        ]
                    }),
                    stroke: '#ffd700', strokeWidth: 1.2,
                    shadow: new fabric.Shadow({ color: 'rgba(255,215,0,0.6)', blur: 15, offsetX: 0, offsetY: 0 })
                });

                // 3. Central Shining Spot (Specular Highlight)
                const shine = new fabric.Circle({
                    radius: 5, left: 20, top: 20, originX: 'center', originY: 'center',
                    fill: 'rgba(255, 255, 255, 0.9)', blur: 4
                } as any);

                const holoText = new fabric.Text('🔒', { left: 25, top: 25, fontSize: 18, originX: 'center', originY: 'center', fill: '#8b6914', shadow: '0 0 5px rgba(255,255,255,0.8)' });

                const holoGroup = new fabric.Group([bloom, holoPolygon, shine, holoText], {
                    id: 'bofa_hologram',
                    left: objectPositionsRef.current.bofa_hologram?.left ?? (layout.hologram?.left || (W - 340)),
                    top: objectPositionsRef.current.bofa_hologram?.top ?? (layout.hologram?.top || 210),
                    scaleX: objectPositionsRef.current.bofa_hologram?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.bofa_hologram?.scaleY ?? 1,
                    selectable: true, hasControls: true
                } as any);
                c.add(holoGroup);
            }

            // SPECIAL: Second Signature Line for Cashier/Official Checks
            if ((layout as any).signatureGroup2) {
                // Create a fresh group for the second signature since signatureGroup is now ungrouped
                const sig2 = new fabric.Group([
                    new fabric.Line([0, 0, 300, 0], { stroke: lineStroke, strokeWidth: 1.2 }),
                    new fabric.Polyline([{ x: 0, y: 0 }, { x: 0, y: 20 }], { stroke: lineStroke, strokeWidth: 1.5, fill: 'transparent' }),
                    new fabric.Text('COUNTERSIGNATURE', { left: 0, top: 25, fontSize: 7, fontWeight: 'bold', fill: '#444', fontFamily: 'Arial' })
                ], {
                    id: 'signatureGroup2',
                    left: objectPositionsRef.current.signatureGroup2?.left ?? (layout as any).signatureGroup2.left,
                    top: objectPositionsRef.current.signatureGroup2?.top ?? (layout as any).signatureGroup2.top,
                    selectable: true, hasControls: true
                } as any);
                c.add(sig2);
            }

            // SPECIAL: Certified / Official Stamp
            if (isCertified) {
                const certifiedStamp = new fabric.Group([
                    new fabric.Rect({ width: 140, height: 60, rx: 10, ry: 10, fill: 'transparent', stroke: '#c9a227', strokeWidth: 3, opacity: 0.7 }),
                    new fabric.Text('CERTIFIED', { left: 70, top: 15, fontSize: 16, fontWeight: 'bold', fill: '#c9a227', originX: 'center', opacity: 0.8 }),
                    new fabric.Text('OFFICIAL INSTRUMENT', { left: 70, top: 38, fontSize: 8, fontWeight: 'bold', fill: '#c9a227', originX: 'center', opacity: 0.8 })
                ], {
                    left: W / 2 - 70, top: 110, angle: -5, selectable: true
                });
                c.add(certifiedStamp);
            }
            if (isSecurityEnabled('void_pantograph')) {
                for (let y = 55; y < textureBottom - 30; y += 45) {
                    for (let x = 70; x < W - 70; x += 90) {
                        c.add(new fabric.Text('VOID', {
                            left: x, top: y, fontSize: 9, fill: `${primaryColor}06`,
                            fontWeight: 'bold', angle: -25, fontFamily: 'Arial', selectable: false
                        }));
                    }
                }
            }

            // 20b. US TREASURY MAILING NOTICE / E-CHECK STAMP
            if (isTreasury) {
                c.add(new fabric.Text('PER ENCLOSED MAILING NOTICE', {
                    left: layout.payTo.left || 310,
                    top: (layout.payTo.top || 100) + 130,
                    fontSize: 8, fontWeight: 'bold', fill: '#222', fontFamily: 'Arial', selectable: true
                } as any));
            } else if (checkStyle === 'echeck') {
                const echeckStamp = new fabric.Group([
                    new fabric.Rect({ width: 140, height: 35, rx: 5, ry: 5, fill: 'transparent', stroke: `${primaryColor}60`, strokeWidth: 2 }),
                    new fabric.Text('ELECTRONICALLY', { left: 70, top: 8, fontSize: 9, fontWeight: 'bold', fill: primaryColor, originX: 'center' }),
                    new fabric.Text('PROCESSED', { left: 70, top: 22, fontSize: 9, fontWeight: 'bold', fill: primaryColor, originX: 'center' })
                ], {
                    left: W - 180, top: 60, angle: -10, opacity: 0.6, selectable: true
                });
                c.add(echeckStamp);
            }

            // 21. CHEMICAL REACTIVE INDICATOR (Moved to Footer - Draggable)
            if (isSecurityEnabled('chemical_reactive')) {
                const chemGroup = new fabric.Group([
                    new fabric.Text('⚗️', { left: 0, top: 0, fontSize: 9 }),
                    new fabric.Text('CHEMICAL SENSITIVE', { left: 14, top: 2, fontSize: 6, fill: '#888', fontFamily: 'Arial' })
                ], {
                    id: 'chemGroup',
                    left: objectPositionsRef.current.chemGroup?.left ?? 50,
                    top: objectPositionsRef.current.chemGroup?.top ?? H - 25,
                    scaleX: objectPositionsRef.current.chemGroup?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.chemGroup?.scaleY ?? 1,
                    selectable: true, hasControls: true
                } as any);
                c.add(chemGroup);
            }

            // 22. RAINBOW STRIPE REMOVED - per user request for realism
            // (Feature disabled - uncomment to re-enable)
            // if (isSecurityEnabled('rainbow_stripe')) { ... }

            // 23. MICR LINE: PROFESSIONAL BANKING STANDARD
            const isBusinessStyle = ['business', 'payroll', 'cashier', 'certified'].includes(checkStyle);
            const selectedMicrFontObj = MICR_FONTS.find(f => f.id === checkData.micrFont) || MICR_FONTS[0];
            const micrFontFamily = selectedMicrFontObj.family;

            let micrLine = '';
            let accNum = checkData.accountNumber.replace(/\s/g, '');
            let routing = checkData.routingNumber.replace(/\s/g, '');
            let checkNum = checkData.checkNumber.padStart(4, '0');

            // Symbol mapping helper (E-13B vs CMC-7)
            const getMicrSymbol = (symbol: 'transit' | 'onus' | 'dash') => {
                if (checkData.micrFont === 'cmc7') {
                    if (symbol === 'transit') return '⑇'; // CMC-7 S1
                    if (symbol === 'onus') return '⑊';    // CMC-7 S3
                    if (symbol === 'dash') return '⑉';    // CMC-7 S2
                }
                // Default E-13B
                if (symbol === 'transit') return '⑆';
                if (symbol === 'onus') return '⑈';
                if (symbol === 'dash') return '⑉';
                return '';
            };

            const t = getMicrSymbol('transit');
            const o = getMicrSymbol('onus');
            const d = getMicrSymbol('dash');
            const epc = (checkData as any).epcDigit || '';

            // PERFECT READ Sequence: Routing -> Account -> Check Number
            const isBofAClassic = checkStyle === 'bofa_classic' || selectedBank === 'BOFA_CLASSIC';

            if (isBofAClassic) {
                // Precision calibrated for BofA Mobile Deposit
                micrLine = `${t}${routing}${t} ${accNum}${o} ${checkNum}`;
            } else {
                micrLine = `${t}${routing}${t} ${accNum}${o} ${checkNum}${o}`;
            }
            if (epc) micrLine = `${epc} ${micrLine}`;

            const micrObject = new fabric.Text(micrLine, {
                id: 'micrLine',
                // Bank Standard: 0.625" (5/8") from Left | 0.5" from Bottom implied aligned
                left: objectPositionsRef.current.micrLine?.left ?? (isBusinessStyle ? 62.5 : 60),
                top: objectPositionsRef.current.micrLine?.top ?? H - 50, // 0.5" from bottom approx
                fontSize: checkData.micrFontSize,
                fontFamily: micrFontFamily,
                fill: '#1a1a1a',
                charSpacing: checkData.micrFont === 'cmc7' ? 40 : 45, // Tighter E-13B spacing (was 55)
                fontWeight: '500',
                shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.7)', blur: 0.8, offsetX: 0.3, offsetY: 0.3 }),
                selectable: true,
                hasControls: true,
                lockRotation: true
            } as any);
            c.add(micrObject);

            // WATERMARK: High-Fidelity & Draggable
            if (isSecurityEnabled('watermark') && !isBofaV2) {
                const watermarkText = (checkData as any).watermarkText || getWatermarkText();
                const watermark = new fabric.Text(watermarkText, {
                    id: 'watermark',
                    left: objectPositionsRef.current.watermark?.left ?? W / 2,
                    top: objectPositionsRef.current.watermark?.top ?? H / 2,
                    scaleX: objectPositionsRef.current.watermark?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.watermark?.scaleY ?? 1,
                    fontSize: 55, fontFamily: 'Arial Black',
                    fill: 'rgba(0,0,0,0.04)', angle: -25, originX: 'center', originY: 'center',
                    selectable: true, hasControls: true
                } as any);
                c.add(watermark);
                c.sendToBack(watermark);
            }

            // 9. HOLOGRAPHIC STRIP on LEFT (RESTORED & GROUPED)
            if (isSecurityEnabled('holographic')) {
                const prismGradient = new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: 0, y2: textureBottom },
                    colorStops: [
                        { offset: 0, color: 'rgba(255,0,0,0.15)' },
                        { offset: 0.2, color: 'rgba(255,255,0,0.15)' },
                        { offset: 0.4, color: 'rgba(0,255,0,0.15)' },
                        { offset: 0.6, color: 'rgba(0,0,255,0.15)' },
                        { offset: 0.8, color: 'rgba(75,0,130,0.15)' },
                        { offset: 1, color: 'rgba(148,0,211,0.15)' }
                    ]
                });

                const holoGroup = new fabric.Group([
                    new fabric.Rect({
                        left: 0, top: 0, width: 35, height: textureBottom - 40,
                        fill: prismGradient, stroke: 'rgba(0,0,0,0.1)', strokeWidth: 0.5
                    }),
                    ...Array.from({ length: 15 }).map((_, i) => new fabric.Text("SECURE", {
                        left: 17.5, top: 20 + i * 40, fontSize: 5,
                        angle: -90, fill: 'rgba(0,0,0,0.3)', originX: 'center'
                    }))
                ], {
                    id: 'holoGroup',
                    left: objectPositionsRef.current.holoGroup?.left ?? W - 60,
                    top: objectPositionsRef.current.holoGroup?.top ?? 20,
                    scaleX: objectPositionsRef.current.holoGroup?.scaleX ?? 1,
                    scaleY: objectPositionsRef.current.holoGroup?.scaleY ?? 1,
                    selectable: true, hasControls: true
                } as any);
                c.add(holoGroup);
            }



            // 24. MICR CLEAR ZONE GUIDE (IF ENABLED)
            if (showMicrGuide) {
                const guide = new fabric.Rect({
                    left: 0,
                    top: H - MICR_CLEAR_BAND,
                    width: W,
                    height: MICR_CLEAR_BAND,
                    fill: 'rgba(231, 76, 60, 0.12)',
                    stroke: 'rgba(231, 76, 60, 0.5)',
                    strokeWidth: 1,
                    strokeDashArray: [5, 5],
                    selectable: false,
                    evented: false
                });
                c.add(guide);
                c.add(new fabric.Text('MICR CLEAR ZONE (0.625") - KEEP CLEAR', {
                    left: 10, top: H - MICR_CLEAR_BAND + 5, fontSize: 8, fill: '#c0392b', fontWeight: 'bold'
                }));
            }

            // 25. CUSTOM ASSETS: LOGO & SIGNATURE
            if (logoImage) {
                fabric.Image.fromURL(logoImage, (img) => {
                    img.set({
                        id: 'customLogo',
                        left: objectPositionsRef.current.customLogo?.left ?? 50,
                        top: objectPositionsRef.current.customLogo?.top ?? 50,
                        selectable: true,
                        hasControls: true
                    } as any);
                    if (objectPositionsRef.current.customLogo) {
                        img.scale(objectPositionsRef.current.customLogo.scaleX || 0.5);
                    } else {
                        img.scaleToWidth(60);
                    }
                    c.add(img);
                    c.renderAll();
                });
            }

            if (signatureImage) {
                fabric.Image.fromURL(signatureImage, (img) => {
                    img.set({
                        id: 'customSignature',
                        left: objectPositionsRef.current.customSignature?.left ?? layout.signatureGroup.left,
                        top: objectPositionsRef.current.customSignature?.top ?? layout.signatureGroup.top - 20,
                        selectable: true,
                        hasControls: true
                    } as any);
                    if (objectPositionsRef.current.customSignature) {
                        img.scaleX = objectPositionsRef.current.customSignature.scaleX || 1;
                        img.scaleY = objectPositionsRef.current.customSignature.scaleY || 1;
                    } else {
                        img.scaleToWidth(150);
                    }
                    c.add(img);
                    c.renderAll();
                });
            }

            // 25b. RESTORE SELECTION
            if (activeId) {
                const newActive = c.getObjects().find(o => (o as any).id === activeId);
                if (newActive) {
                    c.setActiveObject(newActive);
                }
            }

            c.renderAll();

            // FREE USER WATERMARK — blocks screenshot/deposit usability
            if (!isPaid) {
                const wmLines = ['OMNICHECK', 'SAMPLE', 'UPGRADE TO', 'EXPORT'];
                wmLines.forEach((txt, i) => {
                    const wm = new fabric.Text(txt, {
                        left: W / 2,
                        top: 60 + i * 65,
                        fontSize: 42,
                        fontFamily: 'Arial Black, Impact, sans-serif',
                        fill: 'rgba(255, 80, 80, 0.22)',
                        fontWeight: '900',
                        angle: -35,
                        originX: 'center',
                        originY: 'center',
                        selectable: false,
                        evented: false
                    });
                    c.add(wm);
                    c.bringToFront(wm);
                });
                c.renderAll();
            }

            // FILTER OUT DELETED OBJECTS (Persistence of Deletion)
            if (deletedIds.length > 0) {
                const objects = c.getObjects();
                objects.forEach((obj: any) => {
                    if (obj.id && deletedIds.includes(obj.id)) {
                        c.remove(obj);
                    }
                });
                c.requestRenderAll();
            }
        }); // Close setBackgroundColor callback
    }, [checkData, checkStyle, selectedFont, selectedTexture, paperColor, selectedBank, securityFeatures, handwritingStyle, handwritingRotation, handwritingVariation, handwritingColor, textureOpacity, logoImage, signatureImage, signatureStyle, deletedIds]);

    const getWatermarkText = () => {
        if (checkStyle === 'cashier') return "CASHIER'S CHECK";
        if (selectedBank && bankSpecificTemplates[selectedBank]) {
            return bankSpecificTemplates[selectedBank].name.toUpperCase();
        }
        return "SECURE DOCUMENT";
    };

    // Handle form changes
    const handleInputChange = (field: string, value: string | number) => {
        setCheckData(prev => {
            const newData = { ...prev, [field]: value };

            // Auto-fill bank details if routing number is provided
            if (field === 'routingNumber') {
                const routing = value.toString().replace(/\D/g, '').trim();
                if (routing.length >= 9) {
                    const bankInfo: Record<string, { name: string, address: string, template?: string }> = {
                        '021000021': { name: 'JPMorgan Chase Bank, N.A.', address: '270 Park Ave, New York, NY 10017', template: 'CHASE' },
                        '121000248': { name: 'Wells Fargo Bank, N.A.', address: '420 Montgomery St, San Francisco, CA 94104', template: 'WELLS' },
                        '026009593': { name: 'Bank of America, N.A.', address: '100 N Tryon St, Charlotte, NC 28202', template: 'BOFA_CLASSIC' },
                        '021000018': { name: 'Citibank, N.A.', address: '388 Greenwich St, New York, NY 10013', template: 'CITI' },
                        '053000219': { name: 'PNC Bank, N.A.', address: '300 Fifth Ave, Pittsburgh, PA 15222', template: 'PNC' },
                        '031100209': { name: 'TD Bank, N.A.', address: '1701 Route 70 East, Cherry Hill, NJ 08034', template: 'TD' },
                        '051000017': { name: 'U.S. Bank National Association', address: '800 Nicollet Mall, Minneapolis, MN 55402', template: 'US_BANK' },
                        '053101121': { name: 'Capital One, N.A.', address: '1680 Capital One Dr, McLean, VA 22102', template: 'CAPITAL_ONE' },
                        '071000013': { name: 'BMO Harris Bank, N.A.', address: '111 W Monroe St, Chicago, IL 60603', template: 'BMO' },
                        '042000314': { name: 'Fifth Third Bank, N.A.', address: '38 Fountain Square Plaza, Cincinnati, OH 45263', template: 'FIFTH_THIRD' },
                        '054000030': { name: 'SunTrust Bank (Truist)', address: '303 Peachtree St NE, Atlanta, GA 30308', template: 'TRUIST' },
                        '061113415': { name: 'Navy Federal Credit Union', address: '820 Follin Ln, Vienna, VA 22180', template: 'NAVY_FCU' }
                    };

                    if (bankInfo[routing]) {
                        newData.bankName = bankInfo[routing].name.toUpperCase();
                        newData.bankAddress = bankInfo[routing].address.toUpperCase();
                        if (bankInfo[routing].template) {
                            // Apply template settings as well
                            setTimeout(() => applyBankTemplate(bankInfo[routing].template!), 0);
                        }
                    }
                }
            }
            return newData;
        });
    };

    // Generate/Download check
    const handleGenerate = () => {
        if (fabricCanvas) {
            const dataUrl = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });
            const link = document.createElement('a');
            link.download = `check_${checkData.checkNumber}.png`;
            link.href = dataUrl;
            link.click();
        }
    };

    const handleGenerateMobileShot = async () => {
        if (!fabricCanvas) return;

        // Create a temporary high-res composite canvas
        const compositeW = 1200;
        const compositeH = 1600;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = compositeW;
        tempCanvas.height = compositeH;
        const ctx = tempCanvas.getContext('2d')!;

        // 1. Background Generation
        if (mobileBackground === 'wood') {
            // Rich Mahogany Wood
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(0, 0, compositeW, compositeH);

            // Wood grain texture
            for (let i = 0; i < 2000; i++) {
                ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
                const x = Math.random() * compositeW;
                const y = Math.random() * compositeH;
                const w = 50 + Math.random() * 150;
                const h = 2 + Math.random() * 4;
                ctx.fillRect(x, y, w, h);
            }
        } else if (mobileBackground === 'granite') {
            // Granite / Marble
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, 0, compositeW, compositeH);

            // Speckles
            for (let i = 0; i < 5000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)';
                ctx.fillRect(Math.random() * compositeW, Math.random() * compositeH, 2, 2);
            }
        } else if (mobileBackground === 'office') {
            // Clean Office Desk (White/Beige Laminate)
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, 0, compositeW, compositeH);
            // Subtle noise
            for (let i = 0; i < 1000; i++) {
                ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.03})`;
                ctx.fillRect(Math.random() * compositeW, Math.random() * compositeH, 1, 1);
            }
        } else {
            // Default: Dark Studio Table
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, compositeW, compositeH);

            // Add subtle table grain
            for (let i = 0; i < 500; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
                ctx.fillRect(Math.random() * compositeW, Math.random() * compositeH, 2, 2);
            }
        }

        // 2. Render Front of Check
        const frontImg = new Image();
        frontImg.src = fabricCanvas.toDataURL({ format: 'png', multiplier: 1.5 });
        await new Promise(resolve => frontImg.onload = resolve);

        // Draw front with slight shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 10;
        ctx.drawImage(frontImg, 50, 100, compositeW - 100, 400);

        // 3. Render Back of Check (using engine)
        const backFabricCanvas = new fabric.StaticCanvas(null, {
            width: 900,
            height: 300,
            backgroundColor: '#ffffff' // Ensure white paper background
        });
        const backObjects = CheckBackEngine.generateCheckBack(900, 300, securityFeatures, 72, {
            name: checkData.payeeName || checkData.accountHolderName,
            date: checkData.date,
            signatureFont: getHandwritingFont(signatureStyle),
            style: backSideStyle,
            accountNumber: checkData.accountNumber,
            handwritingColor: handwritingColor
        }, signatureImage);
        backObjects.forEach(obj => {
            const id = (obj as any).id;
            if (id && objectPositions[id]) {
                obj.set({
                    left: objectPositions[id].left,
                    top: objectPositions[id].top,
                    scaleX: objectPositions[id].scaleX ?? 1,
                    scaleY: objectPositions[id].scaleY ?? 1,
                    angle: objectPositions[id].angle ?? obj.angle
                });
            }
            backFabricCanvas.add(obj);
        });
        backFabricCanvas.renderAll();

        const backImg = new Image();
        backImg.src = backFabricCanvas.toDataURL({ format: 'png', multiplier: 1.5 });
        await new Promise(resolve => backImg.onload = resolve);

        // Draw back with same shadow
        ctx.drawImage(backImg, 50, 600, compositeW - 100, 400);
        ctx.shadowBlur = 0; // Reset shadow

        // 4. Timestamp - 07 03 AM EST (Per user requirement)
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255, 140, 0, 0.9)'; // Industrial orange digital
        ctx.fillText('07 03 AM EST', compositeW - 220, compositeH - 60);

        // 5. Filename formatting: CheckXXXXMMDDYY
        const lastFour = (checkData as any).lastFour || '4567';
        // Date format MM/DD/YYYY -> MMDDYY
        const dateParts = checkData.date.split('/');
        const mm = dateParts[0].padStart(2, '0');
        const dd = dateParts[1].padStart(2, '0');
        const yy = dateParts[2].slice(-2);
        const filename = `Check${lastFour}${mm}${dd}${yy}.jpg`;

        // 6. Download with 300 DPI multiplier (3x of 72dpi = 216, 4x = 288)
        // Using JPEG with 0.9 quality to stay under 5MB
        const link = document.createElement('a');
        link.download = filename;
        link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
        link.click();
    };

    // Toggle dropdown state
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [zoom, setZoom] = useState(0.85);

    // Apply bank template
    const applyBankTemplate = (bankId: string) => {
        setSelectedBank(bankId);

        // Find template in either bank-specific or premium lists
        const bankTemplate = bankSpecificTemplates[bankId];
        const premiumTemplate = PREMIUM_TEMPLATES.find((p: any) => p.id === bankId);

        const template = bankTemplate || premiumTemplate;

        if (template) {
            // Update bank details from template
            setCheckData(prev => ({
                ...prev,
                bankName: template.name.toUpperCase(),
                bankAddress: (template as any).specs?.address || prev.bankAddress
            }));

            // Set UI defaults based on template specifications
            if (template.specs?.colors?.background === '#f4f8f0' || bankId.includes('TREASURY')) {
                setPaperColor('treasury_green');
            } else if (template.specs?.colors?.background === '#FAEBD7' || bankId === 'PARCHMENT') {
                setPaperColor('antique');
            } else {
                setPaperColor('white');
            }

            // Texture Mapping
            if (bankId.includes('BOFA')) setSelectedTexture('cloud_marble');
            else if (bankId.includes('CHASE')) setSelectedTexture('security');
            else if (bankId.includes('WELLS')) setSelectedTexture('linen');
            else if (bankId.includes('CITI')) setSelectedTexture('geometric_diamond');
            else if (bankId.includes('ALLY') || bankId.includes('CHIME')) setSelectedTexture('digital_hive');
            else setSelectedTexture('linen');

            // Font Mapping
            if (template.specs?.fontFamily?.includes('Courier')) setSelectedFont('courier');
            else if (template.specs?.fontFamily?.includes('Helvetica') || template.specs?.fontFamily?.includes('Arial')) setSelectedFont('arial');
            else setSelectedFont('times');

            // Set specific UI defaults based on template type
            if (bankId === 'us_treasury' || bankId === 'US_TREASURY_OFFICIAL') {
                setSelectedTexture('fiber_optic');
                setCheckStyle('us_treasury');
                setSelectedFont('courier');
                setPaperColor('treasury_green');
                setTextureOpacity(1.0);
                setCheckData(prev => ({
                    ...prev,
                    bankName: "United States Treasury",
                    accountHolderName: "JSEAN BROWN",
                    accountHolderAddress: "7622 RIVER OAKS PL\nREYNOLDSBURG, OH 43068",
                    date: "09 27 22",
                    amount: 8952.36
                }));
            } else if (bankId === 'chime_pro') {
                setSelectedTexture('digital_hive');
                setPaperColor('white');
            } else if (bankId.startsWith('ultra_')) {
                setSelectedTexture('geometric_diamond');
                setPaperColor('white');
                setTextureOpacity(0.85); // High starting visibility
            } else if (bankId === 'classic_elegant' || bankId === 'executive_gold') {
                setSelectedTexture('guilloche_bg');
                setPaperColor('antique');
                setTextureOpacity(0.9);
            } else if (bankId === 'royal_blue') {
                setSelectedTexture('security');
                setPaperColor('light_blue');
                setTextureOpacity(0.8);
            } else if (bankId === 'emerald_prestige') {
                setSelectedTexture('marble');
                setPaperColor('light_green');
                setTextureOpacity(0.8);
            } else if (bankId === 'BOFA_CLASSIC') {
                setSelectedTexture('cloud_marble');
                setCheckStyle('bofa_classic');
                setSelectedFont('courier');
                setPaperColor('light_blue');
                setTextureOpacity(1.0);
                setSecurityFeatures(prev => prev.map(f => {
                    if (['microprint', 'void_pantograph', 'warning_band', 'microprint_sig', 'cpsa_padlock'].includes(f.id)) {
                        return { ...f, enabled: true };
                    }
                    return f;
                }));
            } else if (bankId === 'KAREN_ART_STUDIO_PAYROLL') {
                setCheckStyle('payroll_karen');
                setSelectedTexture('linen');
                setPaperColor('white');
                setTextureOpacity(0.4);
                setCheckData(prev => ({
                    ...prev,
                    accountHolderName: "Karen Art Studio",
                    accountHolderAddress: "1134 Main Street\nLouisville, KY 40211\n(502) 123-1234",
                    bankName: "My Bank",
                    bankAddress: "123 Bank Road",
                    fractionalRouting: "67-76890",
                    payeeName: "John Smith",
                    payeeAddress: "1123 River Road\nLouisville, KY 42011"
                }));
            } else {
                setSelectedTexture('guilloche_bg');
                setTextureOpacity(1.0);
            }
        }
    };

    const handleDownloadPDF = async () => {
        if (!fabricCanvas) return;

        // LICENSE GATE — free users cannot export
        if (!isPaid) {
            alert('\u26a0\ufe0f Upgrade to a paid plan to export clean checks.\n\nGo to Pricing to choose a plan.');
            return;
        }
        if (!canExport) {
            alert(`\u26a0\ufe0f You\'ve reached your ${currentPlan.name} plan limit (${currentPlan.checksPerMonth} exports/month).\n\nUpgrade to export more.`);
            return;
        }
        // Consume one export credit
        if (!useCheckExport()) {
            alert('Export failed. Please check your plan status.');
            return;
        }

        try {
            // 1. Capture Front (High DPI - 300+ DPI effective)
            const frontData = fabricCanvas.toDataURL({ format: 'png', multiplier: 4 });

            // 2. Capture Back
            const backData = checkBackRef.current?.getDataURL();

            if (!frontData || !backData) {
                alert('Error generating check images. Please try again.');
                return;
            }

            // 3. Generate PDF (Strict 8.5" x 3.5" Bank Standard)
            const isPersonal = checkStyle === 'personal';
            const pdfW = isPersonal ? 6.00 : 8.50; // 8.5 inches
            const pdfH = isPersonal ? 2.75 : 3.50; // 3.5 inches

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'in',
                format: [pdfW, pdfH]
            });

            // Page 1: Front
            doc.addImage(frontData, 'PNG', 0, 0, pdfW, pdfH);

            // Page 2: Back
            doc.addPage([pdfW, pdfH], 'landscape');
            doc.addImage(backData, 'PNG', 0, 0, pdfW, pdfH);

            // 4. Save
            doc.save(`Check_${checkData.checkNumber}_${Date.now()}.pdf`);

        } catch (err) {
            console.error('PDF Generation Error:', err);
            alert('Failed to generate PDF. See console for details.');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            if (type === 'logo') setLogoImage(dataUrl);
            else {
                if ((checkData as any).autoCleanSignature) {
                    setRawSignatureImage(dataUrl); // Store source for re-tinting
                    const cleaned = await SignatureExtractorEngine.processSignature(dataUrl, { tintColor: handwritingColor });
                    setSignatureImage(cleaned);
                } else {
                    setSignatureImage(dataUrl);
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = useCallback(async (event?: ClipboardEvent | React.MouseEvent) => {
        let dataUrl: string | null = null;

        // 1. Handle actual Paste Event (Ctrl+V)
        if (event && 'clipboardData' in event) {
            const items = (event as ClipboardEvent).clipboardData?.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const blob = items[i].getAsFile();
                        if (blob) {
                            dataUrl = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onload = (e) => resolve(e.target?.result as string);
                                reader.readAsDataURL(blob);
                            });
                        }
                        break;
                    }
                }
            }
        }
        // 2. Handle Manual Toolbar Click (Navigator API)
        else {
            try {
                const items = await navigator.clipboard.read();
                for (const item of items) {
                    const imageTypes = item.types.filter(type => type.startsWith('image/'));
                    if (imageTypes.length > 0) {
                        const blob = await item.getType(imageTypes[0]);
                        dataUrl = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve(e.target?.result as string);
                            reader.readAsDataURL(blob);
                        });
                        break;
                    }
                }
            } catch (err) {
                // Fallback for text-based data URLs in clipboard
                const text = await navigator.clipboard.readText();
                if (text.startsWith('data:image')) dataUrl = text;
            }
        }

        if (dataUrl) {
            setRawSignatureImage(dataUrl); // Store source for re-tinting
            // Automatically clean and isolate signatures on paste with tinting
            const cleaned = await SignatureExtractorEngine.processSignature(dataUrl, { tintColor: handwritingColor });
            setSignatureImage(cleaned);
        }
    }, [handwritingColor]);

    const toggleSection = (section: string) => {
        setActiveSection(activeSection === section ? null : section);
    };

    // --- EFFECTS ---

    useEffect(() => {
        const onPaste = (e: any) => handlePaste(e);
        window.addEventListener('paste', onPaste as EventListener);
        return () => window.removeEventListener('paste', onPaste as EventListener);
    }, [handlePaste]);

    // Handle Active Re-Tinting when color changes
    useEffect(() => {
        const retint = async () => {
            if (rawSignatureImage) {
                const tinted = await SignatureExtractorEngine.processSignature(rawSignatureImage, { tintColor: handwritingColor });
                setSignatureImage(tinted);
            }
        };
        retint();
    }, [handwritingColor]);

    // Load preset signature for Stephanie Lacey
    useEffect(() => {
        if (signatureStyle === 'stephanie_lacey' || handwritingStyle === 'stephanie_lacey') {
            const signatureUrl = 'file:///C:/Users/User/.gemini/antigravity/brain/5de6d9a4-adde-4ebb-b22c-bd7ec6188b22/uploaded_media_1770398405736.png';
            setSignatureImage(signatureUrl);
        }
    }, [signatureStyle, handwritingStyle]);

    const dynamicCanvasHeight = (checkStyle === 'payroll_karen' || selectedBank === 'KAREN_ART_STUDIO_PAYROLL') ? 900 : checkDimensions.height;

    useEffect(() => {
        if (!canvasRef.current) return;

        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            width: checkDimensions.width,
            height: dynamicCanvasHeight,
            backgroundColor: '#f8f4ec',
            selection: true,
            preserveObjectStacking: true
        });

        setFabricCanvas(fabricCanvas);

        const updatePosition = (obj: any) => {
            // Handle Multi-Selection (ActiveSelection)
            if (obj.type === 'activeSelection' && obj._objects) {
                obj._objects.forEach((child: any) => {
                    if (child.id) {
                        // Calculate absolute coordinates using matrix multiplication
                        const matrix = obj.calcTransformMatrix();
                        const childMatrix = child.calcTransformMatrix();
                        const finalMatrix = fabric.util.multiplyTransformMatrices(matrix, childMatrix);
                        const options = fabric.util.qrDecompose(finalMatrix);

                        const newPos = {
                            left: options.translateX,
                            top: options.translateY,
                            scaleX: options.scaleX,
                            scaleY: options.scaleY,
                            angle: options.angle
                        };

                        objectPositionsRef.current[child.id] = newPos;
                        setObjectPositions(prev => ({
                            ...prev,
                            [child.id]: newPos
                        }));
                    }
                });
                return;
            }

            // Handle Single Object
            if (obj && (obj as any).id) {
                const newPos = {
                    left: obj.left ?? 0,
                    top: obj.top ?? 0,
                    scaleX: obj.scaleX ?? 1,
                    scaleY: obj.scaleY ?? 1,
                    angle: obj.angle ?? 0
                };
                objectPositionsRef.current[(obj as any).id] = newPos;
                setObjectPositions(prev => ({
                    ...prev,
                    [(obj as any).id]: newPos
                }));
            }
        };

        fabricCanvas.on('object:modified', (e) => updatePosition(e.target));
        // Removed continuous listeners to prevent heavy re-renders while dragging

        // KEYBOARD CONTROLS — Delete, Backspace, Ctrl+A, Escape
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!fabricCanvas || (fabricCanvas as any).__isDisposed) return;
            const activeObj = fabricCanvas.getActiveObject();

            // Don't intercept keys when editing IText inline
            if (activeObj && (activeObj as any).isEditing) return;

            // Delete / Backspace — remove selected object(s)
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (activeObj) {
                    e.preventDefault();
                    if ((activeObj as any).type === 'activeSelection') {
                        // Multiple selection
                        (activeObj as any).forEachObject((obj: any) => {
                            if (obj.id) setDeletedIds(prev => [...prev, obj.id]);
                            fabricCanvas.remove(obj);
                        });
                        fabricCanvas.discardActiveObject();
                    } else {
                        if ((activeObj as any).id) setDeletedIds(prev => [...prev, (activeObj as any).id]);
                        fabricCanvas.remove(activeObj);
                    }
                    fabricCanvas.requestRenderAll();
                }
            }

            // Ctrl+A — select all objects
            if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const allObjs = fabricCanvas.getObjects();
                const sel = new fabric.ActiveSelection(allObjs, { canvas: fabricCanvas });
                fabricCanvas.setActiveObject(sel);
                fabricCanvas.requestRenderAll();
            }

            // Escape — deselect
            if (e.key === 'Escape') {
                fabricCanvas.discardActiveObject();
                fabricCanvas.requestRenderAll();
            }

            // Arrow keys — nudge selected object
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && activeObj) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 1;
                if (e.key === 'ArrowUp') activeObj.set('top', (activeObj.top ?? 0) - step);
                if (e.key === 'ArrowDown') activeObj.set('top', (activeObj.top ?? 0) + step);
                if (e.key === 'ArrowLeft') activeObj.set('left', (activeObj.left ?? 0) - step);
                if (e.key === 'ArrowRight') activeObj.set('left', (activeObj.left ?? 0) + step);
                activeObj.setCoords();
                updatePosition(activeObj);
                fabricCanvas.requestRenderAll();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            (fabricCanvas as any).__isDisposed = true;
            fabricCanvas.dispose();
            setFabricCanvas(null);
        };
    }, [dynamicCanvasHeight, checkDimensions.width]); // Re-init on dimension change

    // Global Mouse Listeners for AI Bar Dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingAiBar) {
                setAiBarPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDraggingAiBar(false);
        };

        if (isDraggingAiBar) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingAiBar, dragOffset]);

    useEffect(() => {
        if (fabricCanvas) renderCheck(fabricCanvas);
    }, [fabricCanvas, renderCheck]);
    // ============== RENDER ==============
    return (
        <div style={containerStyle}>
            {/* LEFT SIDEBAR */}
            <div style={sidebarStyle}>
                <div style={headerStyle}>
                    <span style={{ fontSize: 20 }}>🏦</span>
                    <div>
                        <div style={{ fontWeight: '800', fontSize: 15, letterSpacing: '-0.3px' }}>OmniCheck Pro</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px', fontWeight: '500' }}>Design Studio</div>
                    </div>
                </div>

                <div style={{ textAlign: 'right', marginBottom: 8, paddingRight: 6 }}>
                    <span style={{ color: '#1a237e', fontSize: 10, cursor: 'pointer', fontWeight: '600' }}>💎 Marketplace</span>
                    <Link to="/admin" style={{ textDecoration: 'none' }}>
                        <span
                            style={{ color: isEnterprise ? '#10B981' : '#94A3B8', fontSize: 10, marginLeft: 8, cursor: 'pointer', fontWeight: isEnterprise ? '700' : '400' }}
                            title="Go to Admin Portal"
                        >
                            {isEnterprise ? 'Admin Active ✅' : 'Admin'}
                        </span>
                    </Link>
                </div>

                <div style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: 4 }}>

                    {/* BANK TEMPLATES */}
                    <div style={sectionStyle}>
                        <div style={sectionHeaderStyle} onClick={() => toggleSection('bank_style')}>
                            <span>🏢 Bank Styles & Templates</span>
                            <span>{activeSection === 'bank_style' ? '▼' : '▶'}</span>
                        </div>
                        {activeSection === 'bank_style' && (
                            <div style={{ padding: '15px' }}>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Select Template</label>
                                    <select
                                        style={inputStyle}
                                        value={selectedBank}
                                        onChange={(e) => applyBankTemplate(e.target.value)}
                                    >
                                        <option value="">Default Clean Style</option>
                                        {BANK_TEMPLATES.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Check Layout Type</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                        {CHECK_STYLES.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    setCheckStyle(s.id);
                                                    // Removed setObjectPositions({}) to prevent scattering of custom layout
                                                }}
                                                style={{
                                                    ...dropdownItemStyle,
                                                    padding: '6px',
                                                    backgroundColor: checkStyle === s.id ? 'rgba(26,35,126,0.08)' : 'transparent',
                                                    border: checkStyle === s.id ? '1px solid #1a237e' : '1px solid #E2E8F0',
                                                    justifyContent: 'center',
                                                    flexDirection: 'column',
                                                    gap: '3px',
                                                    color: checkStyle === s.id ? '#1a237e' : '#64748B'
                                                }}
                                            >
                                                <span style={{ fontSize: '18px' }}>{s.icon}</span>
                                                <span style={{ fontSize: '10px', textAlign: 'center' }}>{s.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* TEXTURES & COLORS */}
                    <div style={sectionStyle}>
                        <div style={sectionHeaderStyle} onClick={() => toggleSection('paper_texture')}>
                            <span>🎨 Background & Texture Design</span>
                            <span>{activeSection === 'paper_texture' ? '▼' : '▶'}</span>
                        </div>
                        {activeSection === 'paper_texture' && (
                            <div style={{ padding: '15px' }}>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Paper Color</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {PAPER_COLORS.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => setPaperColor(c.id)}
                                                title={c.name}
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    backgroundColor: c.color,
                                                    border: paperColor === c.id ? '2px solid #3498db' : '1px solid #ddd',
                                                    cursor: 'pointer',
                                                    boxShadow: paperColor === c.id ? '0 0 5px rgba(52,152,219,0.5)' : 'none'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Security Texture Pattern</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                        {TEXTURES.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setSelectedTexture(t.id)}
                                                style={{
                                                    ...dropdownItemStyle,
                                                    padding: '6px',
                                                    backgroundColor: selectedTexture === t.id ? 'rgba(26,35,126,0.08)' : 'transparent',
                                                    border: selectedTexture === t.id ? '1px solid #1a237e' : '1px solid #E2E8F0',
                                                    gap: '6px',
                                                    color: selectedTexture === t.id ? '#1a237e' : '#64748B'
                                                }}
                                            >
                                                <span>{t.icon}</span>
                                                <span style={{ fontSize: '11px' }}>{t.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ ...inputGroupStyle, marginTop: '15px' }}>
                                    <label style={labelStyle}>Texture Intensity ({Math.round(textureOpacity * 100)}%)</label>
                                    <input
                                        type="range" min="0" max="1" step="0.01"
                                        value={textureOpacity}
                                        onChange={(e) => setTextureOpacity(parseFloat(e.target.value))}
                                        style={{ width: '100%', accentColor: '#3498db' }}
                                    />
                                    {/* AI UI Moved to Floating Bar */}

                                </div>
                            </div>
                        )}
                    </div>

                    {/* CUSTOM ASSETS */}
                    <div style={sectionStyle}>
                        <div style={sectionHeaderStyle} onClick={() => toggleSection('custom_assets')}>
                            <span>🖼️ Custom Assets (Logos & Signs)</span>
                            <span>{activeSection === 'custom_assets' ? '▼' : '▶'}</span>
                        </div>
                        {activeSection === 'custom_assets' && (
                            <div style={{ padding: '15px' }}>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Bank Logo (Top Left)</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'logo')}
                                            style={{ fontSize: '11px', flex: 1 }}
                                        />
                                        {logoImage && (
                                            <button
                                                onClick={() => setLogoImage(null)}
                                                style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>Tip: Use transparent PNG for best results.</p>
                                </div>

                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Hand-written Signature</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'signature')}
                                            style={{ fontSize: '11px', flex: 1 }}
                                        />
                                        {signatureImage && (
                                            <button
                                                onClick={() => setSignatureImage(null)}
                                                style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #f87171', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                        <input
                                            type="checkbox"
                                            checked={(checkData as any).autoCleanSignature || false}
                                            onChange={(e) => setCheckData({ ...checkData, autoCleanSignature: e.target.checked } as any)}
                                        />
                                        <span style={{ fontSize: '11px', color: '#666' }}>✨ Auto-Clean & Isolate Signature (Removes BG/Lines)</span>
                                    </div>
                                    <p style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>Replaces simulated font signature. Draggable.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* TYPOGRAPHY */}
                    <div style={sectionStyle}>
                        <div style={sectionHeaderStyle} onClick={() => toggleSection('typography')}>
                            <span>🖋️ Handwriting & Typography</span>
                            <span>{activeSection === 'typography' ? '▼' : '▶'}</span>
                        </div>
                        {activeSection === 'typography' && (
                            <div style={{ padding: '15px' }}>

                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Signature Style (Front)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
                                        {HANDWRITING_STYLES.map(h => (
                                            <button
                                                key={h.id}
                                                onClick={() => setSignatureStyle(h.id)}
                                                style={{
                                                    ...dropdownItemStyle,
                                                    padding: '8px',
                                                    backgroundColor: signatureStyle === h.id ? '#eff6ff' : 'transparent',
                                                    border: signatureStyle === h.id ? '1px solid #3b82f6' : '1px solid #e5e5e5',
                                                    gap: '8px'
                                                }}
                                            >
                                                <span>{h.icon}</span>
                                                <span style={{ fontSize: '11px' }}>{h.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>Simulates signer's unique hand.</p>
                                </div>

                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Primary Font Face</label>
                                    <select
                                        style={inputStyle}
                                        value={selectedFont}
                                        onChange={(e) => setSelectedFont(e.target.value)}
                                    >
                                        {FONTS.map((f: any) => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Handwriting Style (Signatures)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                        {HANDWRITING_STYLES.map(h => (
                                            <button
                                                key={h.id}
                                                onClick={() => setHandwritingStyle(h.id)}
                                                style={{
                                                    ...dropdownItemStyle,
                                                    padding: '8px',
                                                    backgroundColor: handwritingStyle === h.id ? '#f0f4f8' : 'transparent',
                                                    border: handwritingStyle === h.id ? '1px solid #3498db' : '1px solid transparent',
                                                    gap: '8px'
                                                }}
                                            >
                                                <span>{h.icon}</span>
                                                <span style={{ fontSize: '11px' }}>{h.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setIsSignatureLabOpen(true)}
                                        style={{
                                            ...actionBtnStyle,
                                            marginTop: '12px',
                                            fontSize: '12px',
                                            padding: '8px',
                                            backgroundColor: '#2ecc71',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        ✍️ Design Custom Signature
                                    </button>
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Ink Color</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[
                                            { name: 'Navy', val: '#003366' },
                                            { name: 'Black', val: '#111111' },
                                            { name: 'Blue', val: '#0000FF' },
                                            { name: 'Red', val: '#8B0000' },
                                            { name: 'Purple', val: '#4B0082' }
                                        ].map(ink => (
                                            <div
                                                key={ink.name}
                                                onClick={() => setHandwritingColor(ink.val)}
                                                style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    backgroundColor: ink.val,
                                                    border: handwritingColor === ink.val ? '2px solid #3498db' : '1px solid #ddd',
                                                    cursor: 'pointer',
                                                    boxShadow: handwritingColor === ink.val ? '0 0 5px rgba(52,152,219,0.5)' : 'none'
                                                }}
                                                title={ink.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Payee Name Size ({checkData.payeeFontSize}px)</label>
                                    <input
                                        type="range" min="12" max="32" step="1"
                                        value={checkData.payeeFontSize}
                                        onChange={(e) => handleInputChange('payeeFontSize', parseInt(e.target.value))}
                                        style={{ width: '100%', accentColor: '#3498db' }}
                                    />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Memo Font Size ({checkData.memoFontSize}px)</label>
                                    <input
                                        type="range" min="8" max="24" step="1"
                                        value={checkData.memoFontSize}
                                        onChange={(e) => handleInputChange('memoFontSize', parseInt(e.target.value))}
                                        style={{ width: '100%', accentColor: '#3498db' }}
                                    />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Handwriting Angle ({handwritingRotation}°)</label>
                                    <input
                                        type="range" min="-5" max="5" step="0.1"
                                        value={handwritingRotation}
                                        onChange={(e) => setHandwritingRotation(parseFloat(e.target.value))}
                                        style={{ width: '100%', accentColor: '#3498db' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={sectionStyle}>
                        <div style={sectionHeaderStyle} onClick={() => toggleSection('check_info')}>
                            <span>📝 Check Information & Bank Details</span>
                            <span>{activeSection === 'check_info' ? '▼' : '▶'}</span>
                        </div>
                        {activeSection === 'check_info' && (
                            <div style={{ padding: '15px' }}>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Bank Name</label>
                                    <input
                                        style={inputStyle}
                                        value={checkData.bankName}
                                        onChange={(e) => setCheckData({ ...checkData, bankName: e.target.value })}
                                    />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Bank Address</label>
                                    <input
                                        style={inputStyle}
                                        value={(checkData as any).bankAddress}
                                        onChange={(e) => setCheckData({ ...checkData, bankAddress: e.target.value } as any)}
                                    />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Watermark Text</label>
                                    <input
                                        style={inputStyle}
                                        value={checkData.watermarkText}
                                        onChange={(e) => handleInputChange('watermarkText', e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Check #</label>
                                        <input
                                            style={inputStyle}
                                            value={checkData.checkNumber}
                                            onChange={(e) => setCheckData({ ...checkData, checkNumber: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Date</label>
                                        <input
                                            style={inputStyle}
                                            value={checkData.date}
                                            onChange={(e) => setCheckData({ ...checkData, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ flex: 2 }}>
                                        <label style={labelStyle}>Routing Number {isValidRouting(checkData.routingNumber) ? '✅' : '⚠️'}</label>
                                        <input
                                            style={{ ...inputStyle, borderColor: isValidRouting(checkData.routingNumber) ? '#ddd' : '#e74c3c' }}
                                            value={checkData.routingNumber}
                                            onChange={(e) => setCheckData({ ...checkData, routingNumber: e.target.value })}
                                        />
                                        {!isValidRouting(checkData.routingNumber) && (
                                            <div style={{ fontSize: '8px', color: '#e74c3c', marginTop: '2px' }}>Invalid Mod-10 Check Digit</div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>EPC</label>
                                        <input
                                            style={inputStyle}
                                            maxLength={1}
                                            placeholder="0-9"
                                            value={(checkData as any).epcDigit || ''}
                                            onChange={(e) => handleInputChange('epcDigit', e.target.value)}
                                        />
                                    </div>
                                    <div style={{ flex: 1.5 }}>
                                        <label style={labelStyle}>Fractional Routing</label>
                                        <input
                                            style={inputStyle}
                                            placeholder="e.g. 12-30/123"
                                            value={checkData.fractionalRouting || ''}
                                            onChange={(e) => setCheckData({ ...checkData, fractionalRouting: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Account #</label>
                                    <input
                                        style={inputStyle}
                                        value={checkData.accountNumber}
                                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                    />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Last 4 of Card (for Filename)</label>
                                    <input
                                        style={inputStyle}
                                        maxLength={4}
                                        placeholder="4567"
                                        value={(checkData as any).lastFour || ''}
                                        onChange={(e) => handleInputChange('lastFour', e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Pay To (Name)</label>
                                    <input
                                        type="text"
                                        value={checkData.payeeName}
                                        onChange={e => handleInputChange('payeeName', e.target.value)}
                                        placeholder="Enter payee name"
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Payee Address</label>
                                    <textarea
                                        value={checkData.payeeAddress || ''}
                                        onChange={e => handleInputChange('payeeAddress', e.target.value)}
                                        placeholder="Line 1&#10;Line 2"
                                        style={{ ...inputStyle, minHeight: '60px', fontFamily: 'monospace' }}
                                    />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Amount ($)</label>
                                    <input
                                        type="number"
                                        value={checkData.amount}
                                        onChange={e => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Check Back Deposit Style</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '5px' }}>
                                        {BACK_SIDE_STYLES.map(style => (
                                            <button
                                                key={style.id}
                                                onClick={() => setBackSideStyle(style.id)}
                                                style={{
                                                    ...dropdownItemStyle,
                                                    padding: '8px',
                                                    fontSize: '11px',
                                                    backgroundColor: backSideStyle === style.id ? '#f0f4f8' : '#fff',
                                                    border: backSideStyle === style.id ? '1px solid #3498db' : '1px solid #eee',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontWeight: backSideStyle === style.id ? 'bold' : 'normal'
                                                }}
                                            >
                                                <span style={{ fontSize: '16px' }}>{style.icon}</span>
                                                <span>{style.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Memo</label>
                                    <input
                                        type="text"
                                        value={checkData.memo}
                                        onChange={e => handleInputChange('memo', e.target.value)}
                                        placeholder="Optional memo"
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Account Holder Name</label>
                                    <input
                                        type="text"
                                        value={checkData.accountHolderName}
                                        onChange={e => handleInputChange('accountHolderName', e.target.value)}
                                        style={inputStyle}
                                    />
                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="checkbox" checked={showMicrGuide} onChange={(e) => setShowMicrGuide(e.target.checked)} />
                                        <span style={{ fontSize: '11px', color: '#666' }}>Show 5/8" MICR Clear Zone Guide</span>
                                    </div>
                                </div>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>Account Holder Address</label>
                                    <input
                                        type="text"
                                        value={checkData.accountHolderAddress}
                                        onChange={e => handleInputChange('accountHolderAddress', e.target.value)}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PAYROLL DETAILS (Contextual) */}
                    {checkStyle === 'payroll' && (
                        <div style={sectionStyle}>
                            <div style={sectionHeaderStyle} onClick={() => toggleSection('payroll_info')}>
                                <span>💼 Payroll & Corporate Details</span>
                                <span>{activeSection === 'payroll_info' ? '▼' : '▶'}</span>
                            </div>
                            {activeSection === 'payroll_info' && (
                                <div style={{ padding: '15px' }}>
                                    <div style={inputGroupStyle}>
                                        <label style={labelStyle}>Company EIN</label>
                                        <input
                                            style={inputStyle}
                                            value={checkData.ein}
                                            onChange={(e) => setCheckData({ ...checkData, ein: e.target.value })}
                                            placeholder="12-3456789"
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div style={inputGroupStyle}>
                                            <label style={labelStyle}>Hours Worked</label>
                                            <input
                                                style={inputStyle}
                                                value={checkData.hoursWorked}
                                                onChange={(e) => setCheckData({ ...checkData, hoursWorked: e.target.value })}
                                                placeholder="40.0"
                                            />
                                        </div>
                                        <div style={inputGroupStyle}>
                                            <label style={labelStyle}>Hourly Rate</label>
                                            <input
                                                style={inputStyle}
                                                value={checkData.payRate}
                                                onChange={(e) => setCheckData({ ...checkData, payRate: e.target.value })}
                                                placeholder="$25.00"
                                            />
                                        </div>
                                    </div>
                                    <div style={inputGroupStyle}>
                                        <label style={labelStyle}>Total Payout (Gross)</label>
                                        <input
                                            style={inputStyle}
                                            value={checkData.payTotal}
                                            onChange={(e) => setCheckData({ ...checkData, payTotal: e.target.value })}
                                            placeholder="1,000.00"
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div style={inputGroupStyle}>
                                            <label style={labelStyle}>YTD Gross</label>
                                            <input
                                                style={inputStyle}
                                                value={checkData.ytdGross}
                                                onChange={(e) => setCheckData({ ...checkData, ytdGross: e.target.value })}
                                                placeholder="10,000.00"
                                            />
                                        </div>
                                        <div style={inputGroupStyle}>
                                            <label style={labelStyle}>YTD Net</label>
                                            <input
                                                style={inputStyle}
                                                value={checkData.ytdNet}
                                                onChange={(e) => setCheckData({ ...checkData, ytdNet: e.target.value })}
                                                placeholder="8,500.00"
                                            />
                                        </div>
                                    </div>
                                    <div style={inputGroupStyle}>
                                        <label style={labelStyle}>Earnings Type</label>
                                        <select
                                            style={inputStyle}
                                            value={checkData.memo}
                                            onChange={(e) => setCheckData({ ...checkData, memo: e.target.value })}
                                        >
                                            <option value="REGULAR">REGULAR</option>
                                            <option value="OVERTIME">OVERTIME</option>
                                            <option value="BONUS">BONUS</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MICR ENGINEERING */}
                    <div style={sectionStyle}>
                        <div style={sectionHeaderStyle} onClick={() => toggleSection('micr_config')}>
                            <span>🔢 MICR Line Engineering</span>
                            <span>{activeSection === 'micr_config' ? '▼' : '▶'}</span>
                        </div>
                        {activeSection === 'micr_config' && (
                            <div style={{ padding: '15px' }}>
                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>MICR Font Standard</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '6px' }}>
                                        {MICR_FONTS.map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => setCheckData(prev => ({ ...prev, micrFont: f.id }))}
                                                style={{
                                                    ...dropdownItemStyle,
                                                    padding: '10px',
                                                    backgroundColor: (checkData as any).micrFont === f.id ? '#f0f4f8' : 'transparent',
                                                    border: (checkData as any).micrFont === f.id ? '1px solid #3498db' : '1px solid #eee',
                                                    justifyContent: 'flex-start',
                                                    fontWeight: (checkData as any).micrFont === f.id ? 'bold' : 'normal'
                                                }}
                                            >
                                                <span style={{ fontSize: '12px' }}>{f.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ ...inputGroupStyle, marginTop: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={labelStyle}>MICR Font Size</label>
                                        <span style={{ fontSize: '11px', color: '#3498db' }}>{(checkData as any).micrFontSize}px</span>
                                    </div>
                                    <input
                                        type="range" min="16" max="32" step="0.5"
                                        value={(checkData as any).micrFontSize}
                                        onChange={(e) => setCheckData(prev => ({ ...prev, micrFontSize: parseFloat(e.target.value) }))}
                                        style={{ width: '100%', accentColor: '#3498db' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#999', marginTop: '4px' }}>
                                        <span>Compact</span>
                                        <span>Oversized</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: '15px' }}>
                                    <label style={checkboxStyle}>
                                        <input
                                            type="checkbox"
                                            checked={showMicrBand}
                                            onChange={(e) => setShowMicrBand(e.target.checked)}
                                        />
                                        Show MICR Clear Band (White Bottom)
                                    </label>
                                    <label style={checkboxStyle}>
                                        <input
                                            type="checkbox"
                                            checked={showAmountBorder}
                                            onChange={(e) => setShowAmountBorder(e.target.checked)}
                                        />
                                        Show Amount Box Border
                                    </label>
                                </div>
                                <div style={{ marginTop: '10px', padding: '10px', background: '#fff9e6', borderRadius: '8px', border: '1px solid #ffeeba', fontSize: '11px', color: '#856404' }}>
                                    <strong>Note:</strong> Standard checks require 22px for OCR compatibility.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECURITY FEATURES SECTION */}
                    <div style={sectionStyle}>
                        <div style={sectionHeaderStyle} onClick={() => toggleSection('security')}>
                            <span>🔒 Security Features</span>
                            <span>{activeSection === 'security' ? '▼' : '▶'}</span>
                        </div>
                        {activeSection === 'security' && (
                            <div style={{ padding: '15px' }}>
                                {securityFeatures.map(feature => (
                                    <label key={feature.id} style={checkboxStyle}>
                                        <input
                                            type="checkbox"
                                            checked={feature.enabled}
                                            onChange={() => toggleSecurityFeature(feature.id)}
                                        />
                                        <span style={{ marginLeft: 8 }}>{feature.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* BORDERS & SECURE FRAMES (Phase 41 Integration) */}
                    <div style={sectionStyle}>
                        <div style={sectionHeaderStyle} onClick={() => toggleSection('borders')}>
                            <span>🖼️ Borders & Secure Frames</span>
                            <span>{activeSection === 'borders' ? '▼' : '▶'}</span>
                        </div>
                        {activeSection === 'borders' && (
                            <div style={{ padding: '15px' }}>
                                <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
                                    Select high-security border patterns for your check.
                                </p>
                                <UltimateCustomizationPanel
                                    checkData={{ ...checkData, borderConfig } as any}
                                    onUpdate={(c) => {
                                        if (c.borderConfig) setBorderConfig(c.borderConfig);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                </div>

                <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px solid #E2E8F0', position: 'relative' }}>

                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        style={{ ...actionBtnStyle, justifyContent: 'space-between', background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', color: '#FFFFFF', border: 'none', boxShadow: '0 2px 8px rgba(26,35,126,0.25)' }}
                    >
                        <span>🚀 Premium Actions / Export</span>
                        <span>{showExportMenu ? '▲' : '▼'}</span>
                    </button>

                    {
                        showExportMenu && (
                            <div style={{
                                position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 12,
                                background: '#FFFFFF', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                borderRadius: '10px', border: '1px solid #E2E8F0', zIndex: 100, padding: '6px'
                            }}>
                                <div style={{ padding: '6px 10px', fontSize: 9, fontWeight: 700, color: '#1a237e', textTransform: 'uppercase', letterSpacing: 1.2 }}>Export Options</div>

                                {/* Mobile Background Selector */}
                                <div style={{ padding: '4px 12px 12px', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>Mobile Shot Surface:</div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {[
                                            { id: 'dark', label: 'Dark', color: '#333' },
                                            { id: 'wood', label: 'Wood', color: '#5D4037' },
                                            { id: 'granite', label: 'Stone', color: '#455A64' },
                                            { id: 'office', label: 'Desk', color: '#ddd' }
                                        ].map(bg => (
                                            <button
                                                key={bg.id}
                                                onClick={() => setMobileBackground(bg.id as any)}
                                                style={{
                                                    flex: 1, padding: '4px', fontSize: '10px', borderRadius: '4px',
                                                    border: mobileBackground === bg.id ? `2px solid ${bg.color}` : '1px solid #ddd',
                                                    backgroundColor: mobileBackground === bg.id ? '#fff' : '#f9f9f9',
                                                    fontWeight: mobileBackground === bg.id ? 'bold' : 'normal',
                                                    color: mobileBackground === bg.id ? '#000' : '#666',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {bg.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={handleDownloadPDF} style={dropdownItemStyle}>📄 Download Secure PDF</button>
                                <button style={dropdownItemStyle}>📧 Email to Payee</button>
                                <button style={dropdownItemStyle}>🖨️ Direct Print (Pro)</button>
                                <button onClick={handleGenerateMobileShot} style={{ ...dropdownItemStyle, color: '#F97316', fontWeight: 600 }}>📸 Mobile Deposit Shot (Final)</button>
                                <div style={{ height: 1, background: '#f0f0f0', margin: '8px 4px' }} />
                                <button style={{ ...dropdownItemStyle, color: '#2c3e50', fontWeight: 600 }}>💾 Save Studio Template</button>
                            </div>
                        )
                    }

                    <button onClick={handleGenerate} style={generateBtnStyle}>
                        GENERATE FINAL CHECK
                    </button>
                </div>
            </div> {/* END LEFT SIDEBAR */}

            {/* RIGHT SIDE - PREVIEW */}
            <div style={previewContainerStyle}>
                <div style={previewHeaderStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#4CAF50', fontSize: '8px' }}>●</span>
                        <span style={{ color: '#64748B', fontSize: '11px', fontWeight: '500' }}>
                            Live Preview
                        </span>
                        <span style={{ color: '#475569', fontSize: '10px', padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {checkDimensions.width / 100}" × {checkDimensions.height / 100}" @ 100 DPI
                        </span>
                    </div>
                </div>

                <div style={toolbarStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>Studio</span>
                        <span style={{ color: '#475569', margin: '0 4px', fontSize: '10px' }}>|</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button style={toolBtnStyle} onClick={() => {
                            const container = document.querySelector('.canvas-wrapper-scroll');
                            if (container) container.scrollTop = 0;
                        }}>↑ Front</button>
                        <button style={toolBtnStyle} onClick={() => {
                            const container = document.querySelector('.canvas-wrapper-scroll');
                            if (container) container.scrollTop = 1000;
                        }}>↓ Back</button>
                        <span style={{ color: '#475569', margin: '0 2px', fontSize: '10px' }}>|</span>
                        <button style={toolBtnStyle} onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}>−</button>
                        <button style={toolBtnStyle} onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>+</button>
                        <select
                            style={zoomSelectStyle}
                            value={Math.round(zoom * 100) + '%'}
                            onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
                        >
                            <option value="50%">50%</option>
                            <option value="75%">75%</option>
                            <option value="85%">85% (Default)</option>
                            <option value="100%">100%</option>
                            <option value="125%">125%</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button style={toolBtnStyle} title="Support/Chat">💬</button>
                        <button style={toolBtnStyle} onClick={() => handlePaste()} title="Paste Signature (Ctrl+V)">📋</button>
                        <button style={toolBtnStyle} onClick={() => setIsSignatureLabOpen(true)} title="Signature Lab">✏️</button>
                        <button style={toolBtnStyle} title="Add Text">T</button>
                        <button style={toolBtnStyle} onClick={async () => {
                            if (signatureImage) {
                                const cleaned = await SignatureExtractorEngine.processSignature(signatureImage, { tintColor: handwritingColor });
                                setSignatureImage(cleaned);
                            }
                        }} title="Auto-Isolate Signature">🖍️</button>
                        <button style={toolBtnStyle} title="Attachments">📎</button>
                        <span style={{ color: '#475569', margin: '0 2px', fontSize: '10px' }}>|</span>
                        <button style={toolBtnStyle} onClick={handleDownloadPDF} title="Print / PDF">🖨️</button>
                    </div>
                </div>

                <div className="canvas-wrapper-scroll" style={{ ...canvasWrapperStyle, overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', paddingBottom: '120px' }}>
                    <div style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '10px',
                        transition: 'transform 0.2s ease-out',
                        padding: '0',
                        margin: '0'
                    }}>
                        {/* FRONT SIDE WITH RULER */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>
                                PAGE 1 — FRONT SIDE
                            </div>
                            {/* Horizontal Ruler */}
                            <div style={{ marginLeft: '20px', marginBottom: '0px' }}>
                                <svg width={checkDimensions.width} height={18} style={{ display: 'block' }}>
                                    <rect x={0} y={0} width={checkDimensions.width} height={18} fill="#2a2d35" rx={2} />
                                    {Array.from({ length: Math.ceil(checkDimensions.width / 100) + 1 }, (_, i) => (
                                        <g key={`h-${i}`}>
                                            <line x1={i * 100} y1={0} x2={i * 100} y2={14} stroke="#94A3B8" strokeWidth={1} />
                                            <text x={i * 100 + 3} y={12} fill="#94A3B8" fontSize={8} fontFamily="Inter, sans-serif">{i}"</text>
                                            {i < Math.ceil(checkDimensions.width / 100) && (
                                                <>
                                                    <line x1={i * 100 + 25} y1={10} x2={i * 100 + 25} y2={18} stroke="#64748B" strokeWidth={0.5} />
                                                    <line x1={i * 100 + 50} y1={6} x2={i * 100 + 50} y2={18} stroke="#64748B" strokeWidth={0.5} />
                                                    <line x1={i * 100 + 75} y1={10} x2={i * 100 + 75} y2={18} stroke="#64748B" strokeWidth={0.5} />
                                                </>
                                            )}
                                        </g>
                                    ))}
                                </svg>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
                                {/* Vertical Ruler */}
                                <div style={{ marginRight: '0px' }}>
                                    <svg width={20} height={checkDimensions.height} style={{ display: 'block' }}>
                                        <rect x={0} y={0} width={20} height={checkDimensions.height} fill="#2a2d35" rx={2} />
                                        {Array.from({ length: Math.ceil(checkDimensions.height / 100) + 1 }, (_, i) => (
                                            <g key={`v-${i}`}>
                                                <line x1={0} y1={i * 100} x2={14} y2={i * 100} stroke="#94A3B8" strokeWidth={1} />
                                                <text x={3} y={i * 100 + 12} fill="#94A3B8" fontSize={7} fontFamily="Inter, sans-serif">{i}</text>
                                                {i < Math.ceil(checkDimensions.height / 100) && (
                                                    <>
                                                        <line x1={12} y1={i * 100 + 25} x2={20} y2={i * 100 + 25} stroke="#64748B" strokeWidth={0.5} />
                                                        <line x1={8} y1={i * 100 + 50} x2={20} y2={i * 100 + 50} stroke="#64748B" strokeWidth={0.5} />
                                                        <line x1={12} y1={i * 100 + 75} x2={20} y2={i * 100 + 75} stroke="#64748B" strokeWidth={0.5} />
                                                    </>
                                                )}
                                            </g>
                                        ))}
                                    </svg>
                                </div>
                                {/* Check Canvas */}
                                <div style={{
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                    borderRadius: '2px',
                                    overflow: 'hidden',
                                    backgroundColor: '#fff',
                                    position: 'relative',
                                    width: checkDimensions.width,
                                    height: checkDimensions.height,
                                    margin: '0',
                                    padding: '0'
                                }}>
                                    <svg width={checkDimensions.width} height={checkDimensions.height} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }}>
                                        <BorderlineEngine
                                            width={checkDimensions.width}
                                            height={checkDimensions.height}
                                            config={{
                                                ...borderConfig,
                                                color: borderConfig?.color || '#000',
                                                secondaryColor: borderConfig?.secondaryColor || '#333'
                                            } as any} />
                                    </svg>
                                    <canvas ref={canvasRef} />
                                </div>
                            </div>
                        </div>

                        {/* BACK SIDE */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0px', marginLeft: '20px' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>
                                PAGE 2 — BACK SIDE
                            </div>
                            <div style={{
                                boxShadow: '0 15px 50px rgba(0,0,0,0.18)',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                backgroundColor: '#fff'
                            }}>
                                <CheckBack
                                    ref={checkBackRef}
                                    securityFeatures={securityFeatures}
                                    paperColor={paperColor}
                                    selectedBank={selectedBank}
                                    width={checkDimensions.width}
                                    height={checkDimensions.height}
                                    checkData={checkData}
                                    handwritingColor={handwritingColor}
                                    signatureStyle={signatureStyle}
                                    backSideStyle={backSideStyle}
                                    signatureImage={signatureImage}
                                    objectPositions={objectPositions}
                                    setObjectPositions={setObjectPositions}
                                    deletedIds={deletedBackIds}
                                    setDeletedIds={setDeletedBackIds}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {/* FLOATING AI COMMAND BAR (Phase 74 - Draggable) */}
                <div
                    onMouseDown={(e) => {
                        // Only start drag if clicking on the container or icon, not inputs
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                            setIsDraggingAiBar(true);
                            setDragOffset({
                                x: e.clientX - aiBarPosition.x,
                                y: e.clientY - aiBarPosition.y
                            });
                        }
                    }}
                    style={{
                        position: 'fixed' as any, // Changed from absolute to fixed for viewport dragging
                        left: aiBarPosition.x,
                        top: aiBarPosition.y,
                        transform: 'none', // Removed centering transform
                        width: '90%', maxWidth: '600px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.1)',
                        padding: '10px 16px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        zIndex: 1000,
                        transition: isDraggingAiBar ? 'none' : 'all 0.3s ease', // Disable transition during drag for smoothness
                        cursor: isDraggingAiBar ? 'grabbing' : 'grab'
                    }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7b1fa2, #4a148c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '16px', flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(123, 31, 162, 0.3)',
                        cursor: 'grab'
                    }}>✨</div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            value={(checkData as any).aiPrompt}
                            onChange={(e) => {
                                setCheckData(prev => ({ ...prev, aiPrompt: e.target.value, isAiActive: true }));
                            }}
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    const p = (checkData as any).aiPrompt;
                                    if (!p) return;

                                    // Call the new AI Engine
                                    const result = await processAiPrompt(p);

                                    // Apply Styles
                                    setCheckStyle(result.styles.checkStyle);
                                    setSelectedTexture(result.styles.texture);
                                    setPaperColor(result.styles.paperColor);
                                    setSelectedFont(result.styles.font);
                                    setTextureOpacity(result.styles.textureOpacity);

                                    // Apply Security Features
                                    if (result.security.features.length > 0) {
                                        setSecurityFeatures(prev => prev.map(f => ({
                                            ...f,
                                            enabled: result.security.features.includes(f.id) || f.enabled
                                        })));
                                    }

                                    // Apply Meta / Bank Data
                                    if (result.meta.bankDetected) {
                                        setCheckData(prev => ({
                                            ...prev,
                                            bankName: result.meta.bankDetected || prev.bankName,
                                            isAiActive: true
                                        }));
                                        setSelectedBank(result.meta.bankDetected);
                                    } else {
                                        setCheckData(prev => ({ ...prev, isAiActive: true }));
                                    }
                                }
                            }}
                            placeholder="Ask AI to design (e.g. 'Blue marble Chase business check')..."
                            style={{
                                width: '100%', border: 'none', outline: 'none', background: 'transparent',
                                fontSize: '14px', color: '#1a237e', fontWeight: 500
                            }}
                        />
                    </div>

                    <div style={{ height: '24px', width: '1px', background: '#e0e0e0' }} />

                    {/* Actions */}
                    <label title="Upload Logo/Reference" style={{ cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3e5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <input type="file" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'logo')} />
                        <span style={{ fontSize: '18px' }}>📂</span>
                    </label>

                    <button
                        title="Clone/Reset Layout"
                        onClick={() => {
                            if (window.confirm('Reset layout positions?')) setObjectPositions({});
                        }}
                        style={{
                            border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px', borderRadius: '8px', fontSize: '18px', transition: 'background 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        🔄
                    </button>

                    <button
                        title="Execute Prompt (God Mode)"
                        onClick={async () => {
                            const p = (checkData as any).aiPrompt;
                            if (!p) return;

                            // Call the new AI Engine
                            const result = await processAiPrompt(p);

                            // Apply Styles
                            setCheckStyle(result.styles.checkStyle);
                            setSelectedTexture(result.styles.texture);
                            setPaperColor(result.styles.paperColor);
                            setSelectedFont(result.styles.font);
                            setTextureOpacity(result.styles.textureOpacity);

                            // Apply Layout (Moves) - Only if engine suggests moves
                            // For now, we trust the engine's style mapping implicitly

                            // Apply Security Features
                            if (result.security.features.length > 0) {
                                setSecurityFeatures(prev => prev.map(f => ({
                                    ...f,
                                    enabled: result.security.features.includes(f.id) || f.enabled
                                })));
                            }

                            // Apply Meta / Bank Data
                            if (result.meta.bankDetected) {
                                // If a bank was detected, we might want to update the bank name too
                                setCheckData(prev => ({
                                    ...prev,
                                    bankName: result.meta.bankDetected || prev.bankName,
                                    isAiActive: true
                                }));
                                setSelectedBank(result.meta.bankDetected); // Helper to trigger bank-specific logic if any left
                            } else {
                                setCheckData(prev => ({ ...prev, isAiActive: true }));
                            }

                            // Show feedback (could use a toast, but for now console/explanation)
                            console.log("AI Design Generated:", result.meta.explanation);
                        }}
                        style={{
                            border: 'none', background: 'linear-gradient(135deg, #7b1fa2, #4a148c)', color: 'white', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(123, 31, 162, 0.4)',
                            minWidth: '60px'
                        }}
                    >
                        ✨ Go
                    </button>
                </div>
            </div>

            {/* Signature Lab Modal */}
            <SignatureLab
                isOpen={isSignatureLabOpen}
                onClose={() => setIsSignatureLabOpen(false)}
                onSave={(dataUrl) => setSignatureImage(dataUrl)}
                initialColor={handwritingColor}
                signatureImage={signatureImage}
                setSignatureImage={setSignatureImage}
                rawSignatureImage={rawSignatureImage}
                setRawSignatureImage={setRawSignatureImage}
            />
        </div >
    );
};

export default CheckBuilder;
