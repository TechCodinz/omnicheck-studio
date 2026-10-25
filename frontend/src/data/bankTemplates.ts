/**
 * Ultra-Advanced Bank Templates Library v2.0
 * 
 * 40+ Premium Templates including:
 * - Major US Banks (BOFA, Chase, Wells, Citi, etc.)
 * - Regional Banks (Regions, Truist, BMO, Fifth Third, etc.)
 * - Credit Unions (Navy FCU, PenFed, BECU, etc.)
 * - Specialty Checks (Cashier's, Payroll, eCheck, Money Order, etc.)
 * - International (Canadian, UK style)
 */

export interface BankTemplate {
    name: string;
    specs: {
        dimensions: { width: number; height: number; unit: string };
        margins: { top: number; bottom: number; left: number; right: number };
        micrPosition: { fromBottom: number; fromLeft: number };
        fontFamily: string;
        colors: {
            primary: string;
            secondary: string;
            accent?: string;
            background: string;
        };
        securityFeatures: string[];
    };
    fields?: Array<{
        name: string;
        x: number;
        y: number;
        width: number;
        fontSize?: number;
        bold?: boolean;
    }>;
}

export const bankSpecificTemplates: Record<string, BankTemplate> = {

    // ============== MAJOR US BANKS ==============

    BOFA: {
        name: 'Bank of America Premium Business',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.25, fromLeft: 0.625 },
            fontFamily: 'Helvetica Neue',
            colors: {
                primary: '#012169',
                secondary: '#D52B1E',
                background: '#FFFFFF'
            },
            securityFeatures: ['color-shifting-ink', 'holographic-thread', 'microprinting', 'uv-fibers', 'thermochromic-ink', 'tactile-printing']
        },
        fields: [
            { name: 'payee', x: 0.75, y: 2.0, width: 4.0 },
            { name: 'amount_numbers', x: 5.5, y: 2.0, width: 1.5 },
            { name: 'amount_words', x: 0.75, y: 2.5, width: 6.25 },
            { name: 'date', x: 5.5, y: 0.75, width: 1.5 },
            { name: 'check_number', x: 6.75, y: 0.75, width: 0.75 },
            { name: 'memo', x: 0.75, y: 3.0, width: 2.5 },
            { name: 'signature', x: 4.5, y: 3.25, width: 2.5 },
            { name: 'bank_name', x: 0.75, y: 0.5, width: 3.0, fontSize: 14, bold: true },
            { name: 'bank_address', x: 0.75, y: 0.75, width: 3.0, fontSize: 9 },
            { name: 'account_holder', x: 0.75, y: 1.25, width: 3.0, fontSize: 11 },
            { name: 'account_address', x: 0.75, y: 1.5, width: 3.0, fontSize: 9 }
        ]
    },

    BOFA_CLASSIC: {
        name: 'Bank of America Classic Marble',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.2, bottom: 0.2, left: 0.2, right: 0.2 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Courier New',
            colors: {
                primary: '#012169',
                secondary: '#004A99',
                accent: '#E5E4E2',
                background: '#F0F4F8'
            },
            securityFeatures: ['vertical-security-bar', 'marble-cloud-texture', 'microprint-signature', 'secure-padlock', 'rainbow-border']
        }
    },

    BOFA_BUSINESS_V2: {
        name: 'Bank of America Business (v2)',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.2, bottom: 0.2, left: 0.2, right: 0.2 },
            micrPosition: { fromBottom: 0.25, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#012169', // Institutional Blue
                secondary: '#da291c', // BofA Red
                accent: '#666666',
                background: '#FFFFFF'
            },
            securityFeatures: ['vertical-bofa-security-strip', 'square-hologram', 'watermark-seal', 'microprint-border']
        }
    },

    US_TREASURY_OFFICIAL: {
        name: 'United States Treasury (Standard)',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 },
            micrPosition: { fromBottom: 0.4, fromLeft: 1.2 },
            fontFamily: 'Courier New',
            colors: {
                primary: '#1e3932',
                secondary: '#212121',
                accent: '#d4af37',
                background: '#f4f8f0'
            },
            securityFeatures: ['statue-of-liberty', 'treasury-seal', 'shaded-signature-box', 'iris-printing', 'bleeding-ink-micr']
        }
    },

    CHASE: {
        name: 'Chase Business Elite',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.1875, bottom: 0.1875, left: 0.1875, right: 0.1875 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.5 },
            fontFamily: 'Gotham',
            colors: {
                primary: '#117ACA',
                secondary: '#1D428A',
                accent: '#FFC72C',
                background: '#FFFFFF'
            },
            securityFeatures: ['blue-fluorescent-fibers', 'void-pantograph', 'micro-perforations', 'chemical-sensitive-paper', 'dual-hologram', 'iris-printing']
        }
    },
    CHASE_PRIVATE: {
        name: 'Chase Private Client (Heritage)',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.2, bottom: 0.2, left: 0.2, right: 0.2 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Gotham',
            colors: {
                primary: '#117ACA',
                secondary: '#B8860B', // Gold accent
                accent: '#F5F5F5',
                background: '#FFFFFF'
            },
            securityFeatures: ['embossed-seal', 'micro-perforations', 'dual-hologram', 'iris-printing', 'thermal-ink']
        }
    },

    WELLS: {
        name: 'Wells Fargo Executive',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.375, fromLeft: 0.75 },
            fontFamily: 'Whitney',
            colors: {
                primary: '#F26D21',
                secondary: '#231F20',
                background: '#FFFFFF'
            },
            securityFeatures: ['anti-stockton', 'copy-detection-pattern', 'rainbow-printing', 'security-screentone', 'latent-image', 'react-to-bleach']
        }
    },

    CITI: {
        name: 'CitiBusiness Professional',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Futura',
            colors: {
                primary: '#003B70',
                secondary: '#EF3E42',
                accent: '#00B3B0',
                background: '#FFFFFF'
            },
            securityFeatures: ['planchettes', 'security-thread', 'optic-variable-ink', 'guilloche-pattern', 'moire-pattern', 'digital-watermark']
        }
    },

    USAA: {
        name: 'USAA Premium Personal',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.25, fromLeft: 0.5 },
            fontFamily: 'Trade Gothic',
            colors: {
                primary: '#005B8C',
                secondary: '#7AB2DD',
                background: '#FFFFFF'
            },
            securityFeatures: ['magnetic-ink-micr', 'fluorescent-fibers', 'chemical-reactive-paper', 'tamper-evident-seal', 'sequential-numbering', 'uv-reactive-ink']
        }
    },

    PNC: {
        name: 'PNC Business Elite',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Helvetica',
            colors: {
                primary: '#FF6600',
                secondary: '#1D242D',
                accent: '#FFFFFF',
                background: '#FFFFFF'
            },
            securityFeatures: ['color-shifting-ink', 'security-thread', 'microprinting', 'void-pantograph', 'chemical-sensitive']
        }
    },

    TD: {
        name: 'TD Bank Professional',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.5 },
            fontFamily: 'Arial',
            colors: {
                primary: '#34A853',
                secondary: '#00563F',
                background: '#FFFFFF'
            },
            securityFeatures: ['holographic-foil', 'guilloche-pattern', 'microprinting', 'uv-dull-paper', 'react-to-bleach']
        }
    },

    CAPITAL_ONE: {
        name: 'Capital One Premium',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.25, fromLeft: 0.625 },
            fontFamily: 'Proxima Nova',
            colors: {
                primary: '#D03027',
                secondary: '#004879',
                accent: '#FFFFFF',
                background: '#FFFFFF'
            },
            securityFeatures: ['dual-image-technology', 'thermochromic-ink', 'security-screentone', 'fiber-optic-thread', 'latent-image']
        }
    },

    US_BANK: {
        name: 'US Bank Commercial',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Avenir',
            colors: {
                primary: '#0C2340',
                secondary: '#D71920',
                background: '#FFFFFF'
            },
            securityFeatures: ['holographic-strip', 'microprint-border', 'void-pantograph', 'uv-fibers']
        }
    },

    HUNTINGTON: {
        name: 'Huntington Business',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Georgia',
            colors: {
                primary: '#006747',
                secondary: '#A5A5A5',
                background: '#FFFFFF'
            },
            securityFeatures: ['security-thread', 'microprinting', 'chemical-reactive']
        }
    },

    FIFTH_THIRD: {
        name: 'Fifth Third Bank',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#0C1F40',
                secondary: '#ED1C24',
                background: '#FFFFFF'
            },
            securityFeatures: ['void-pantograph', 'microprinting', 'security-fibers']
        }
    },

    KEYBANK: {
        name: 'KeyBank Business',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Verdana',
            colors: {
                primary: '#005DAA',
                secondary: '#78BE14',
                background: '#FFFFFF'
            },
            securityFeatures: ['guilloche-pattern', 'microprint-border', 'uv-reactive']
        }
    },

    CITIZENS: {
        name: 'Citizens Bank',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#006341',
                secondary: '#FFFFFF',
                background: '#FFFFFF'
            },
            securityFeatures: ['holographic-foil', 'void-pantograph', 'chemical-sensitive']
        }
    },

    ALLY: {
        name: 'Ally Bank Digital',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Roboto',
            colors: {
                primary: '#643090',
                secondary: '#00A19A',
                background: '#FFFFFF'
            },
            securityFeatures: ['digital-signature', 'qr-verification', 'microprinting']
        }
    },

    DISCOVER: {
        name: 'Discover Bank',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#FF6600',
                secondary: '#003A5D',
                background: '#FFFFFF'
            },
            securityFeatures: ['color-shifting-ink', 'security-thread', 'microprinting']
        }
    },

    // ============== REGIONAL BANKS ==============

    REGIONS: {
        name: 'Regions Bank',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Garamond',
            colors: {
                primary: '#78BE20',
                secondary: '#000000',
                background: '#FFFFFF'
            },
            securityFeatures: ['thermal-ink', 'micro-text', 'void-pantograph']
        }
    },

    TRUIST: {
        name: 'Truist (SunTrust/BB&T)',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Lato',
            colors: {
                primary: '#2E1A47',
                secondary: '#CE0058',
                background: '#FFFFFF'
            },
            securityFeatures: ['hologram-logo', 'uv-fibers', 'guilloche-pattern']
        }
    },

    BMO: {
        name: 'BMO Harris',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#0079C1',
                secondary: '#D52B1E',
                background: '#FFFFFF'
            },
            securityFeatures: ['watermark-lion', 'microprint-border', 'security-thread']
        }
    },

    ZIONS: {
        name: 'Zions Bank',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Tahoma',
            colors: {
                primary: '#003366',
                secondary: '#CC0000',
                background: '#FFFFFF'
            },
            securityFeatures: ['microprinting', 'void-pantograph', 'security-fibers']
        }
    },

    COMERICA: {
        name: 'Comerica Bank',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#007749',
                secondary: '#000000',
                background: '#FFFFFF'
            },
            securityFeatures: ['holographic-strip', 'microprinting', 'chemical-reactive']
        }
    },

    FIRST_HORIZON: {
        name: 'First Horizon',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Georgia',
            colors: {
                primary: '#003C71',
                secondary: '#C8102E',
                background: '#FFFFFF'
            },
            securityFeatures: ['void-pantograph', 'microprinting', 'uv-reactive']
        }
    },

    M_AND_T: {
        name: 'M&T Bank',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Times New Roman',
            colors: {
                primary: '#EE3124',
                secondary: '#231F20',
                background: '#FFFFFF'
            },
            securityFeatures: ['security-thread', 'microprinting', 'void-pantograph']
        }
    },

    // ============== CREDIT UNIONS ==============

    NAVY_FCU: {
        name: 'Navy Federal Credit Union',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#003B5C',
                secondary: '#B31B1B',
                accent: '#C4A000',
                background: '#FFFFFF'
            },
            securityFeatures: ['holographic-eagle', 'microprinting', 'void-pantograph', 'uv-fibers', 'security-thread']
        }
    },

    PENFED: {
        name: 'Pentagon FCU',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#003366',
                secondary: '#B8860B',
                background: '#FFFFFF'
            },
            securityFeatures: ['security-thread', 'microprinting', 'void-pantograph']
        }
    },

    BECU: {
        name: 'BECU',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Verdana',
            colors: {
                primary: '#00529B',
                secondary: '#6CC24A',
                background: '#FFFFFF'
            },
            securityFeatures: ['microprinting', 'void-pantograph', 'uv-reactive']
        }
    },

    ALLIANT: {
        name: 'Alliant Credit Union',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#004B87',
                secondary: '#00A651',
                background: '#FFFFFF'
            },
            securityFeatures: ['microprinting', 'void-pantograph', 'security-fibers']
        }
    },

    GOLDEN1: {
        name: 'Golden 1 Credit Union',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#FFB81C',
                secondary: '#003366',
                background: '#FFFFFF'
            },
            securityFeatures: ['microprinting', 'void-pantograph', 'chemical-reactive']
        }
    },

    // ============== SPECIALTY CHECK TYPES ==============

    CASHIER: {
        name: "Cashier's Check (Certified)",
        specs: {
            dimensions: { width: 3.75, height: 8.75, unit: 'inches' },
            margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Georgia',
            colors: {
                primary: '#1A4D1A',
                secondary: '#FFD700',
                background: '#F0FFF0'
            },
            securityFeatures: ['watermark-eagle', 'holographic-band', 'thermochromic-ink', 'security-thread', 'guilloche-ultra', 'uv-reactive', 'chemical-sensitive']
        }
    },

    PAYROLL: {
        name: 'ADP/Paychex Style Payroll',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Courier New',
            colors: {
                primary: '#333333',
                secondary: '#666666',
                background: '#FFFFFF'
            },
            securityFeatures: ['void-pantograph-heavy', 'microprint-lines', 'sequential-numbering', 'check-stock-watermark']
        }
    },

    ECHECK: {
        name: 'Digital eCheck (Email-a-Check)',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 },
            micrPosition: { fromBottom: 0.3, fromLeft: 0.6 },
            fontFamily: 'Arial',
            colors: {
                primary: '#000000',
                secondary: '#0066CC',
                background: '#FFFFFF'
            },
            securityFeatures: ['digital-signature-hash', 'qr-code-verification', 'timestamp-encryption', 'blockchain-hash']
        }
    },

    MONEY_ORDER: {
        name: 'Money Order Style',
        specs: {
            dimensions: { width: 3.0, height: 7.0, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.25, fromLeft: 0.5 },
            fontFamily: 'Arial Black',
            colors: {
                primary: '#003366',
                secondary: '#FFD700',
                background: '#FFFACD'
            },
            securityFeatures: ['watermark-liberty', 'security-thread', 'color-shifting-ink', 'sequential-numbering']
        }
    },

    TRAVELERS_CHECK: {
        name: "Traveler's Check",
        specs: {
            dimensions: { width: 3.0, height: 6.0, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.25, fromLeft: 0.5 },
            fontFamily: 'Times New Roman',
            colors: {
                primary: '#00008B',
                secondary: '#006400',
                background: '#F5F5DC'
            },
            securityFeatures: ['dual-signature', 'holographic-strip', 'watermark', 'security-thread', 'uv-reactive']
        }
    },

    COUNTER_CHECK: {
        name: 'Counter Check (Temporary)',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#666666',
                secondary: '#999999',
                background: '#FFFFFF'
            },
            securityFeatures: ['basic-microprinting', 'void-pantograph']
        }
    },

    CERTIFIED: {
        name: 'Certified Bank Check',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Times New Roman',
            colors: {
                primary: '#2F4F4F',
                secondary: '#DAA520',
                background: '#FAFAD2'
            },
            securityFeatures: ['watermark-seal', 'holographic-stamp', 'guilloche-ultra', 'embossed-seal', 'uv-reactive', 'security-thread']
        }
    },

    CONTRACTOR: {
        name: 'Contractor/Invoice Check',
        specs: {
            dimensions: { width: 3.5, height: 11.0, unit: 'inches' },
            margins: { top: 0.5, bottom: 3.5, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#333333',
                secondary: '#666666',
                background: '#FFFFFF'
            },
            securityFeatures: ['void-pantograph', 'microprinting', 'stub-perforations']
        }
    },

    VOUCHER: {
        name: 'Voucher Check (3-Part)',
        specs: {
            dimensions: { width: 3.5, height: 11.0, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Courier New',
            colors: {
                primary: '#000000',
                secondary: '#333333',
                background: '#FFFFFF'
            },
            securityFeatures: ['void-pantograph', 'microprinting', 'perforation-lines']
        }
    },

    INDUSTRIAL_PAYROLL: {
        name: 'Industrial Heavy Business',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Helvetica',
            colors: {
                primary: '#333333',
                secondary: '#FF6600',
                background: '#F0F0F0'
            },
            securityFeatures: ['void-pantograph-heavy', 'microprint-lines', 'toner-adhesion', 'security-weave']
        }
    },
    AMEX_CENTURION: {
        name: 'Centurion High-Prestige',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.5 },
            fontFamily: 'Copperplate',
            colors: {
                primary: '#000000',
                secondary: '#444444',
                accent: '#E5E4E2', // Platinum
                background: '#FFFFFF'
            },
            securityFeatures: ['guilloche-ultra', 'intaglio-printing', 'holographic-foil', 'dna-ink']
        }
    },

    // ============== CLASSIC / GENERIC ==============

    GENERIC: {
        name: 'Classic Premium',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#2C3E50',
                secondary: '#3498DB',
                accent: '#E74C3C',
                background: '#FFFFFF'
            },
            securityFeatures: ['microprinting', 'void-pantograph', 'guilloche-pattern', 'chemical-sensitive-paper']
        }
    },

    CLASSIC_BLUE: {
        name: 'Classic Blue',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Times New Roman',
            colors: {
                primary: '#1E3A5F',
                secondary: '#4A90D9',
                background: '#F0F8FF'
            },
            securityFeatures: ['microprinting', 'void-pantograph', 'security-border']
        }
    },

    CLASSIC_GREEN: {
        name: 'Classic Green',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Times New Roman',
            colors: {
                primary: '#1A4D1A',
                secondary: '#2E8B57',
                background: '#F0FFF0'
            },
            securityFeatures: ['microprinting', 'void-pantograph', 'security-border']
        }
    },

    CLASSIC_MAROON: {
        name: 'Executive Maroon',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Georgia',
            colors: {
                primary: '#800000',
                secondary: '#B22222',
                background: '#FFF5F5'
            },
            securityFeatures: ['microprinting', 'void-pantograph', 'guilloche-pattern']
        }
    },

    PARCHMENT: {
        name: 'Parchment Style',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Palatino Linotype',
            colors: {
                primary: '#5C4033',
                secondary: '#8B7355',
                background: '#FAEBD7'
            },
            securityFeatures: ['parchment-texture', 'microprinting', 'void-pantograph']
        }
    },

    MARBLE: {
        name: 'Marble Texture',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Georgia',
            colors: {
                primary: '#4A4A4A',
                secondary: '#808080',
                background: '#F5F5F5'
            },
            securityFeatures: ['marble-texture', 'microprinting', 'guilloche-pattern']
        }
    },

    // ============== INTERNATIONAL STYLES ==============

    CANADIAN: {
        name: 'Canadian Bank Style',
        specs: {
            dimensions: { width: 3.5, height: 8.5, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Arial',
            colors: {
                primary: '#C41E3A',
                secondary: '#003366',
                background: '#FFFFFF'
            },
            securityFeatures: ['maple-leaf-watermark', 'bilingual-text', 'microprinting', 'security-thread']
        }
    },

    UK_STYLE: {
        name: 'UK Cheque Style',
        specs: {
            dimensions: { width: 3.37, height: 6.29, unit: 'inches' },
            margins: { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
            micrPosition: { fromBottom: 0.3125, fromLeft: 0.625 },
            fontFamily: 'Times New Roman',
            colors: {
                primary: '#002366',
                secondary: '#8B0000',
                background: '#FFFFF0'
            },
            securityFeatures: ['crown-watermark', 'sterling-symbol', 'microprinting', 'guilloche-pattern']
        }
    },

    KAREN_ART_STUDIO_PAYROLL: {
        name: 'Karen Art Studio (Classic 3-Part)',
        specs: {
            dimensions: { width: 11.0, height: 8.5, unit: 'inches' }, // 3-part layout
            margins: { top: 0.2, bottom: 0.2, left: 0.2, right: 0.2 },
            micrPosition: { fromBottom: 0.4, fromLeft: 1.25 },
            fontFamily: 'Arial',
            colors: {
                primary: '#0055a4',
                secondary: '#333333',
                background: '#dae9f7'
            },
            securityFeatures: ['blue-safety-band', 'microprint-border', 'lock-icon-security', 'dual-stub-layout']
        },
        fields: [
            { name: 'company_header', x: 0.5, y: 0.4, width: 3.0, fontSize: 11, bold: true },
            { name: 'bank_header', x: 5.5, y: 0.4, width: 3.0, fontSize: 11, bold: true },
            { name: 'check_number_top', x: 7.8, y: 0.3, width: 0.5, fontSize: 13, bold: true },
            { name: 'date', x: 7.5, y: 0.8, width: 1.0, fontSize: 12 },
            { name: 'payee_name', x: 1.5, y: 1.3, width: 4.0, fontSize: 12 },
            { name: 'amount_numeric', x: 7.8, y: 1.3, width: 1.0, fontSize: 12, bold: true },
            { name: 'amount_words', x: 0.5, y: 1.6, width: 7.0, fontSize: 11 },
            { name: 'payee_address_block', x: 1.2, y: 2.0, width: 3.0, fontSize: 10 },
            { name: 'memo', x: 1.0, y: 3.0, width: 2.0, fontSize: 10 },
            { name: 'signature', x: 6.5, y: 2.8, width: 2.0 }
        ]
    }
};

// Template categories for UI organization
export const templateCategories = {
    major: ['BOFA', 'CHASE', 'CHASE_PRIVATE', 'WELLS', 'CITI', 'USAA', 'PNC', 'TD', 'CAPITAL_ONE', 'US_BANK', 'AMEX_CENTURION'],
    regional: ['REGIONS', 'TRUIST', 'BMO', 'HUNTINGTON', 'FIFTH_THIRD', 'KEYBANK', 'CITIZENS', 'ZIONS', 'COMERICA', 'FIRST_HORIZON', 'M_AND_T'],
    creditUnion: ['NAVY_FCU', 'PENFED', 'BECU', 'ALLIANT', 'GOLDEN1'],
    specialty: ['CASHIER', 'PAYROLL', 'INDUSTRIAL_PAYROLL', 'ECHECK', 'MONEY_ORDER', 'TRAVELERS_CHECK', 'COUNTER_CHECK', 'CERTIFIED', 'CONTRACTOR', 'VOUCHER', 'KAREN_ART_STUDIO_PAYROLL'],
    classic: ['GENERIC', 'CLASSIC_BLUE', 'CLASSIC_GREEN', 'CLASSIC_MAROON', 'PARCHMENT', 'MARBLE'],
    international: ['CANADIAN', 'UK_STYLE'],
    digital: ['ALLY', 'DISCOVER', 'ECHECK']
};

// Get all template IDs
export const getAllTemplateIds = (): string[] => Object.keys(bankSpecificTemplates);

// Get template by category
export const getTemplatesByCategory = (category: keyof typeof templateCategories): BankTemplate[] =>
    templateCategories[category].map(id => bankSpecificTemplates[id]).filter(Boolean);
