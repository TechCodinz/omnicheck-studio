// import { FABRIC_COLORS } from '../utils/colors'; // Removed: File does not exist

// =============================================================================
// AI DESIGN ENGINE (GOD MODE)
// =============================================================================

export interface AiDesignResult {
    styles: {
        checkStyle: string;
        texture: string;
        paperColor: string;
        font: string;
        borderStyle: string;
        borderColor: string;
        textureOpacity: number;
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
    };
    layout: {
        moveMap: Record<string, { left?: number; top?: number; scale?: number }>; // Partial updates to layout
        resetToDefault?: boolean; // If true, reset positions first
    };
    security: {
        features: string[]; // IDs of features to enable
    };
    meta: {
        explanation: string;
        bankDetected?: string;
        confidence: number;
    };
}

// 1. BANK KNOWLEDGE BASE (Simulated Web Search / Database)
const BANK_KNOWLEDGE_BASE: Record<string, any> = {
    'chase': {
        name: 'Chase Bank',
        colors: { primary: '#117aca', secondary: '#444444', paper: '#e3f2fd' },
        texture: 'security',
        style: 'business',
        font: 'arial',
        border: 'simple'
    },
    'bofa': {
        name: 'Bank of America',
        colors: { primary: '#d4001a', secondary: '#012169', paper: '#fae6e6' },
        texture: 'cloud_marble',
        style: 'bofa_v2', // Special style
        font: 'courier',
        border: 'braided'
    },
    'wells': {
        name: 'Wells Fargo',
        colors: { primary: '#cd2027', secondary: '#ffce00', paper: '#fff8e1' }, // Red/Gold
        texture: 'linen',
        style: 'classic',
        font: 'times',
        border: 'decorative'
    },
    'citi': {
        name: 'Citibank',
        colors: { primary: '#003b70', secondary: '#00a9e0', paper: '#f0f8ff' }, // Blue arc
        texture: 'geometric_diamond',
        style: 'modern',
        font: 'arial',
        border: 'modern'
    },
    'navy': {
        name: 'Navy Federal',
        colors: { primary: '#0f3c65', secondary: '#eeb211', paper: '#e8eaf6' }, // Navy/Gold
        texture: 'waves',
        style: 'classic',
        font: 'times',
        border: 'rope'
    },
    'usaa': {
        name: 'USAA',
        colors: { primary: '#1e2d3e', secondary: '#8d734a', paper: '#eceff1' }, // Dark Blue/Gold
        texture: 'eagle_shield', // Maps to security or similar
        style: 'business',
        font: 'arial',
        border: 'simple'
    },
    'pnc': {
        name: 'PNC Bank',
        colors: { primary: '#f47820', secondary: '#0069aa', paper: '#fff3e0' }, // Orange/Blue
        texture: 'fiber_optic',
        style: 'business',
        font: 'arial',
        border: 'modern'
    },
    'treasury': {
        name: 'US Treasury',
        colors: { primary: '#3c5a3c', secondary: '#000000', paper: 'treasury_green' },
        texture: 'us_treasury',
        style: 'us_treasury',
        font: 'courier',
        border: 'ornate'
    },
    'regions': {
        name: 'Regions Bank',
        colors: { primary: '#7cc242', secondary: '#005d2e', paper: '#f1f8e9' }, // LifeGreen
        texture: 'organic',
        style: 'personal',
        font: 'times',
        border: 'leaf'
    },
    'hsbc': {
        name: 'HSBC',
        colors: { primary: '#db0011', secondary: '#000000', paper: '#ffffff' },
        texture: 'geometric',
        style: 'business',
        font: 'arial',
        border: 'simple'
    }
};

// 2. TEXTURE MAPPING (NLP to Internal IDs)
const TEXTURE_MAP: Record<string, string> = {
    'marble': 'marble',
    'stone': 'marble',
    'wave': 'blue_wave',
    'sea': 'blue_wave',
    'ocean': 'blue_wave',
    'linen': 'linen',
    'cloth': 'linen',
    'fabric': 'linen',
    'geometric': 'geometric_diamond',
    'diamond': 'geometric_diamond',
    'grid': 'geometric_diamond',
    'tech': 'circuit_board',
    'circuit': 'circuit_board',
    'cyber': 'circuit_board',
    'digital': 'digital_hive',
    'hive': 'digital_hive',
    'hex': 'digital_hive',
    'guilloche': 'guilloche_bg',
    'spirograph': 'guilloche_bg',
    'complex': 'guilloche_bg',
    'security': 'security',
    'particles': 'particles',
    'dust': 'particles',
    'gold': 'particles', // often used for gold dust
    'void': 'void_pantograph', // Feature, not just texture, but useful mapping
    'fiber': 'fiber_optic',
    'optic': 'fiber_optic',
    'wood': 'wood_grain', // If exists
    'prism': 'prismatic',
    'rainbow': 'prismatic'
};

// 3. COLOR PARSING (NLP to Hex)
// Basic map, but "God Mode" would ideally use a library like `color-name` or `g-color-name` if available, 
// but we'll build a robust simulate list.
const COLOR_MAP: Record<string, string> = {
    'navy': '#000080',
    'blue': '#0000ff',
    'sky': '#87ceeb',
    'cyan': '#00ffff',
    'teal': '#008080',
    'emerald': '#50c878',
    'green': '#008000',
    'lime': '#00ff00',
    'olive': '#808000',
    'yellow': '#ffff00',
    'gold': '#ffd700',
    'orange': '#ffa500',
    'red': '#ff0000',
    'maroon': '#800000',
    'pink': '#ffc0cb',
    'magenta': '#ff00ff',
    'purple': '#800080',
    'violet': '#ee82ee',
    'indigo': '#4b0082',
    'black': '#000000',
    'grey': '#808080',
    'gray': '#808080',
    'silver': '#c0c0c0',
    'white': '#ffffff',
    'cream': '#fffdd0',
    'beige': '#f5f5dc',
    'brown': '#a52a2a',
    'tan': '#d2b48c'
};

export const processAiPrompt = async (prompt: string): Promise<AiDesignResult> => {
    const p = prompt.toLowerCase();

    // Default Result
    const result: AiDesignResult = {
        styles: {
            checkStyle: 'personal',
            texture: 'linen',
            paperColor: '#f8f4ec', // Antique white default
            font: 'times',
            borderStyle: 'braided',
            borderColor: '#003366',
            textureOpacity: 0.6,
            primaryColor: '#003366',
            secondaryColor: '#666666',
            accentColor: '#d4a574'
        },
        layout: { moveMap: {} },
        security: { features: [] },
        meta: { explanation: "Generated standard design.", confidence: 0.5 }
    };

    let explanationPoints: string[] = [];

    // --- A. BANK RECOGNITION (The "Smart" Layer) ---
    // Check for known banks first, as they dictate base styles
    let bankFound = false;
    for (const [key, bank] of Object.entries(BANK_KNOWLEDGE_BASE)) {
        if (p.includes(key)) {
            result.styles.primaryColor = bank.colors.primary;
            result.styles.secondaryColor = bank.colors.secondary;
            result.styles.borderColor = bank.colors.primary;
            result.styles.paperColor = bank.colors.paper;
            result.styles.texture = bank.texture === 'us_treasury' ? 'guilloche_bg' : bank.texture; // Map special ones
            result.styles.checkStyle = bank.style || 'personal';
            result.styles.font = bank.font;

            // Special overrides
            if (bank.style === 'bofa_v2') {
                result.security.features.push('hologram');
            }
            if (key === 'treasury') {
                result.styles.checkStyle = 'us_treasury';
                result.styles.borderStyle = 'none';
            }

            explanationPoints.push(`Identified **${bank.name}** branding.`);
            bankFound = true;
            result.meta.bankDetected = bank.name;
            result.meta.confidence = 0.95;
            break; // Stop after first match (or priority match)
        }
    }

    // --- B. INTENT EXTRACTION (Overrides & Enhancements) ---

    // 1. STYLE Override
    if (p.includes('business') || p.includes('corp') || p.includes('llc')) {
        result.styles.checkStyle = 'business';
        explanationPoints.push("Applied Business layout.");
    } else if (p.includes('payroll') || p.includes('check stub') || p.includes('earnings')) {
        result.styles.checkStyle = 'payroll';
        explanationPoints.push("Applied Payroll layout.");
    } else if (p.includes('personal')) {
        result.styles.checkStyle = 'personal';
    }

    // 2. TEXTURE Override (if explicitly asked, override bank default)
    for (const [key, id] of Object.entries(TEXTURE_MAP)) {
        if (p.includes(key)) {
            result.styles.texture = id;
            explanationPoints.push(`Selected **${key}** texture.`);
            break;
        }
    }

    // 3. COLOR Override (Explicit request beats bank default usually, or modifies it)
    // "Blue marble chase check" -> Chase is blue anyway, but "Red Chase Check" should be Red.
    for (const [name, hex] of Object.entries(COLOR_MAP)) {
        if (p.includes(name)) {
            // If paper color requested (light colors)
            if (['white', 'cream', 'beige', 'grey', 'silver'].includes(name)) {
                result.styles.paperColor = hex;
            } else if (['sky', 'pink', 'yellow', 'mint'].includes(name) || name.includes('light')) {
                result.styles.paperColor = hex + '20'; // Tint
            } else {
                // Strong colors = Branding/Border
                result.styles.primaryColor = hex;
                result.styles.borderColor = hex;
                // Auto-adjust paper to match tint
                result.styles.paperColor = hex + '15'; // Very light tint of primary
            }
            explanationPoints.push(`Applied **${name}** color theme.`);
            // Don't break immediately, might be multi-color "Red and Gold"
        }
    }

    // 4. BORDER STYLES
    if (p.includes('borderless') || p.includes('no border')) result.styles.borderStyle = 'NONE';
    else if (p.includes('classic border')) result.styles.borderStyle = 'CLASSIC';
    else if (p.includes('modern border')) result.styles.borderStyle = 'MODERN';
    else if (p.includes('braid') || p.includes('rope')) result.styles.borderStyle = 'BRAIDED';
    else if (p.includes('tech border')) result.styles.borderStyle = 'TECH';

    // 5. SECURITY FEATURES
    if (p.includes('void')) result.security.features.push('void_pantograph');
    if (p.includes('micro') || p.includes('fine')) result.security.features.push('microprint');
    if (p.includes('holo')) result.security.features.push('hologram');
    if (p.includes('watermark')) result.security.features.push('watermark');

    // --- C. LAYOUT INTELLIGENCE (God Mode Positioning) ---
    // Adjust layout based on "vibe"
    if (p.includes('minimal') || p.includes('clean') || p.includes('modern')) {
        // Minimalist: Move address to bottom, simple fonts
        result.styles.font = 'arial'; // Cleaner
        // We can hint layout changes here, passed to `moveMap`
        // Example: Move the bank logo/address to a specific spot
        // result.layout.moveMap['bankDetails'] = { left: 40, top: 40 }; 
        explanationPoints.push("Optimized for Minimalist layout.");
    }

    result.meta.explanation = explanationPoints.length > 0 ? explanationPoints.join(" ") : "Generated custom design based on prompt.";
    return result;
};
