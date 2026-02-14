export interface CheckField {
    name: string;
    type: 'text' | 'date' | 'amount' | 'signature' | 'micr';
    x: number;
    y: number;
    width: number;
    height?: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    align: 'left' | 'center' | 'right';
    defaultValue?: string;
    required: boolean;
    validation?: RegExp;
    placeholder?: string;
}

export interface SecurityFeature {
    type: 'watermark' | 'microprint' | 'pattern' | 'hologram';
    intensity: number; // 0-1
    position: string;
    content?: string;
}

export interface CheckTemplate {
    id: string;
    name: string;
    category: 'personal' | 'business' | 'premium' | 'security';
    description: string;
    thumbnail: string;
    background: string;
    size: {
        width: number; // in inches
        height: number;
        dpi: number;
    };
    fields: CheckField[];
    security: {
        features: SecurityFeature[];
        watermarkText?: string;
        patternType?: string;
        micrFont: boolean;
    };
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        creatorId?: string;
        isPublic: boolean;
        usageCount: number;
    };
    price?: number; // for premium templates
}

export interface CheckData {
    payeeName: string;
    amount: number;
    amountWords: string;
    date: Date;
    checkNumber: string;
    memo?: string;
    signature: string;
    bankName: string;
    bankAddress: string;
    accountNumber: string;
    routingNumber: string;
    additionalNotes?: string;
}

export interface GenerationOptions {
    quality: 'low' | 'medium' | 'high' | 'print';
    encryption?: {
        enabled: boolean;
        password?: string;
    };
    watermark?: {
        text: string;
        opacity: number;
    };
    sampleMode: boolean; // Adds "VOID" watermark
    includeInstructions: boolean;
}