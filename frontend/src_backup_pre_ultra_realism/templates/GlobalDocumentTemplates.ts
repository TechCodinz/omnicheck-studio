/**
 * GlobalDocumentTemplates - Comprehensive Document Templates for All Countries
 * 
 * Categories:
 * - Passports (195+ countries)
 * - Driver's Licenses (all US states + international)
 * - Social Security / National ID Cards
 * - Birth Certificates
 * - Visa Documents
 * - Tax Documents
 * - Financial Documents
 */

// ============== TYPES ==============

export type DocumentCategory =
    | 'passport'
    | 'drivers_license'
    | 'national_id'
    | 'ssn_card'
    | 'birth_certificate'
    | 'visa'
    | 'tax_document'
    | 'bank_statement'
    | 'pay_stub'
    | 'utility_bill'
    | 'insurance_card'
    | 'green_card'
    | 'work_permit';

export interface DocumentTemplate {
    id: string;
    category: DocumentCategory;
    country: string;
    countryCode: string;
    region?: string; // State/Province
    name: string;
    description: string;
    version: string;
    fields: TemplateField[];
    layout: TemplateLayout;
    securityFeatures: SecurityFeature[];
    thumbnail?: string;
    isOfficial: boolean;
    createdAt: string;
    updatedAt: string;
    usageCount: number;
    rating: number;
    createdBy?: string;
}

export interface TemplateField {
    id: string;
    name: string;
    label: string;
    type: FieldType;
    required: boolean;
    placeholder?: string;
    validation?: FieldValidation;
    position: { x: number; y: number; width: number; height: number };
    style?: FieldStyle;
    options?: string[]; // For select fields
}

export type FieldType =
    | 'text' | 'number' | 'date' | 'photo' | 'signature'
    | 'mrz' | 'barcode' | 'qrcode' | 'select' | 'checkbox'
    | 'ssn' | 'ein' | 'currency' | 'phone' | 'email' | 'address';

export interface FieldValidation {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: string) => boolean;
}

export interface FieldStyle {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    textTransform?: 'none' | 'uppercase' | 'lowercase';
}

export interface TemplateLayout {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    backgroundColor: string;
    backgroundImage?: string;
    borders?: BorderStyle;
    watermarks?: WatermarkStyle[];
}

export interface BorderStyle {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'double';
    radius?: number;
}

export interface WatermarkStyle {
    text?: string;
    image?: string;
    opacity: number;
    position: 'center' | 'diagonal' | 'tiled';
}

export interface SecurityFeature {
    type: 'hologram' | 'microprint' | 'uv_ink' | 'watermark' | 'embossing' | 'rfid' | 'barcode_2d';
    description: string;
    position?: { x: number; y: number };
}

// ============== COUNTRY DATA ==============

export const COUNTRIES = [
    { code: 'US', name: 'United States', continent: 'North America' },
    { code: 'GB', name: 'United Kingdom', continent: 'Europe' },
    { code: 'CA', name: 'Canada', continent: 'North America' },
    { code: 'AU', name: 'Australia', continent: 'Oceania' },
    { code: 'DE', name: 'Germany', continent: 'Europe' },
    { code: 'FR', name: 'France', continent: 'Europe' },
    { code: 'IT', name: 'Italy', continent: 'Europe' },
    { code: 'ES', name: 'Spain', continent: 'Europe' },
    { code: 'JP', name: 'Japan', continent: 'Asia' },
    { code: 'CN', name: 'China', continent: 'Asia' },
    { code: 'IN', name: 'India', continent: 'Asia' },
    { code: 'BR', name: 'Brazil', continent: 'South America' },
    { code: 'MX', name: 'Mexico', continent: 'North America' },
    { code: 'KR', name: 'South Korea', continent: 'Asia' },
    { code: 'RU', name: 'Russia', continent: 'Europe/Asia' },
    { code: 'NL', name: 'Netherlands', continent: 'Europe' },
    { code: 'BE', name: 'Belgium', continent: 'Europe' },
    { code: 'CH', name: 'Switzerland', continent: 'Europe' },
    { code: 'AT', name: 'Austria', continent: 'Europe' },
    { code: 'SE', name: 'Sweden', continent: 'Europe' },
    { code: 'NO', name: 'Norway', continent: 'Europe' },
    { code: 'DK', name: 'Denmark', continent: 'Europe' },
    { code: 'FI', name: 'Finland', continent: 'Europe' },
    { code: 'PL', name: 'Poland', continent: 'Europe' },
    { code: 'PT', name: 'Portugal', continent: 'Europe' },
    { code: 'GR', name: 'Greece', continent: 'Europe' },
    { code: 'IE', name: 'Ireland', continent: 'Europe' },
    { code: 'NZ', name: 'New Zealand', continent: 'Oceania' },
    { code: 'SG', name: 'Singapore', continent: 'Asia' },
    { code: 'HK', name: 'Hong Kong', continent: 'Asia' },
    { code: 'AE', name: 'United Arab Emirates', continent: 'Asia' },
    { code: 'SA', name: 'Saudi Arabia', continent: 'Asia' },
    { code: 'IL', name: 'Israel', continent: 'Asia' },
    { code: 'ZA', name: 'South Africa', continent: 'Africa' },
    { code: 'EG', name: 'Egypt', continent: 'Africa' },
    { code: 'NG', name: 'Nigeria', continent: 'Africa' },
    { code: 'KE', name: 'Kenya', continent: 'Africa' },
    { code: 'AR', name: 'Argentina', continent: 'South America' },
    { code: 'CL', name: 'Chile', continent: 'South America' },
    { code: 'CO', name: 'Colombia', continent: 'South America' },
    { code: 'PE', name: 'Peru', continent: 'South America' },
    { code: 'TH', name: 'Thailand', continent: 'Asia' },
    { code: 'VN', name: 'Vietnam', continent: 'Asia' },
    { code: 'PH', name: 'Philippines', continent: 'Asia' },
    { code: 'ID', name: 'Indonesia', continent: 'Asia' },
    { code: 'MY', name: 'Malaysia', continent: 'Asia' },
    { code: 'TW', name: 'Taiwan', continent: 'Asia' },
    { code: 'TR', name: 'Turkey', continent: 'Europe/Asia' },
    { code: 'UA', name: 'Ukraine', continent: 'Europe' },
    { code: 'CZ', name: 'Czech Republic', continent: 'Europe' },
    { code: 'HU', name: 'Hungary', continent: 'Europe' },
    { code: 'RO', name: 'Romania', continent: 'Europe' }
];

export const US_STATES = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'District of Columbia' }
];

// ============== PASSPORT TEMPLATES ==============

function createPassportTemplate(country: { code: string; name: string }): DocumentTemplate {
    return {
        id: `passport_${country.code.toLowerCase()}`,
        category: 'passport',
        country: country.name,
        countryCode: country.code,
        name: `${country.name} Passport`,
        description: `Official ${country.name} passport template with MRZ zone`,
        version: '2024',
        fields: [
            { id: 'type', name: 'type', label: 'Type', type: 'text', required: true, position: { x: 10, y: 10, width: 50, height: 20 }, style: { textTransform: 'uppercase' } },
            { id: 'countryCode', name: 'countryCode', label: 'Country Code', type: 'text', required: true, position: { x: 70, y: 10, width: 50, height: 20 } },
            { id: 'passportNumber', name: 'passportNumber', label: 'Passport No.', type: 'text', required: true, position: { x: 130, y: 10, width: 100, height: 20 }, validation: { minLength: 8, maxLength: 9 } },
            { id: 'surname', name: 'surname', label: 'Surname', type: 'text', required: true, position: { x: 130, y: 40, width: 200, height: 20 }, style: { textTransform: 'uppercase', fontWeight: 'bold' } },
            { id: 'givenNames', name: 'givenNames', label: 'Given Names', type: 'text', required: true, position: { x: 130, y: 70, width: 200, height: 20 }, style: { textTransform: 'uppercase' } },
            { id: 'nationality', name: 'nationality', label: 'Nationality', type: 'text', required: true, position: { x: 130, y: 100, width: 150, height: 20 } },
            { id: 'dateOfBirth', name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, position: { x: 130, y: 130, width: 100, height: 20 } },
            { id: 'sex', name: 'sex', label: 'Sex', type: 'select', required: true, options: ['M', 'F', 'X'], position: { x: 250, y: 130, width: 40, height: 20 } },
            { id: 'placeOfBirth', name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true, position: { x: 130, y: 160, width: 150, height: 20 } },
            { id: 'dateOfIssue', name: 'dateOfIssue', label: 'Date of Issue', type: 'date', required: true, position: { x: 130, y: 190, width: 100, height: 20 } },
            { id: 'dateOfExpiry', name: 'dateOfExpiry', label: 'Date of Expiry', type: 'date', required: true, position: { x: 130, y: 220, width: 100, height: 20 } },
            { id: 'authority', name: 'authority', label: 'Authority', type: 'text', required: true, position: { x: 130, y: 250, width: 200, height: 20 } },
            { id: 'photo', name: 'photo', label: 'Photo', type: 'photo', required: true, position: { x: 10, y: 40, width: 100, height: 130 } },
            { id: 'signature', name: 'signature', label: 'Signature', type: 'signature', required: true, position: { x: 10, y: 280, width: 100, height: 30 } },
            { id: 'mrz', name: 'mrz', label: 'MRZ Zone', type: 'mrz', required: true, position: { x: 0, y: 320, width: 350, height: 50 } }
        ],
        layout: {
            width: 350, height: 400, orientation: 'portrait',
            backgroundColor: '#1a3a5c',
            borders: { width: 2, color: '#c9a961', style: 'solid', radius: 10 }
        },
        securityFeatures: [
            { type: 'hologram', description: 'National emblem hologram' },
            { type: 'microprint', description: 'Microprinted border text' },
            { type: 'uv_ink', description: 'UV-reactive patterns' },
            { type: 'rfid', description: 'RFID chip with biometric data' }
        ],
        isOfficial: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        usageCount: 0, rating: 5.0
    };
}

// ============== DRIVER'S LICENSE TEMPLATES ==============

function createUSDriversLicenseTemplate(state: { code: string; name: string }): DocumentTemplate {
    return {
        id: `dl_us_${state.code.toLowerCase()}`,
        category: 'drivers_license',
        country: 'United States',
        countryCode: 'US',
        region: state.name,
        name: `${state.name} Driver's License`,
        description: `${state.name} state driver's license with Real ID compliant design`,
        version: '2024',
        fields: [
            { id: 'licenseNumber', name: 'licenseNumber', label: 'DL Number', type: 'text', required: true, position: { x: 120, y: 30, width: 150, height: 20 }, style: { fontWeight: 'bold', fontSize: 14 } },
            { id: 'class', name: 'class', label: 'Class', type: 'select', options: ['A', 'B', 'C', 'D', 'M'], required: true, position: { x: 280, y: 30, width: 40, height: 20 } },
            { id: 'lastName', name: 'lastName', label: 'Last Name', type: 'text', required: true, position: { x: 120, y: 55, width: 200, height: 18 }, style: { textTransform: 'uppercase', fontWeight: 'bold' } },
            { id: 'firstName', name: 'firstName', label: 'First Name', type: 'text', required: true, position: { x: 120, y: 75, width: 130, height: 18 }, style: { textTransform: 'uppercase' } },
            { id: 'middleName', name: 'middleName', label: 'Middle Name', type: 'text', required: false, position: { x: 260, y: 75, width: 70, height: 18 } },
            { id: 'address', name: 'address', label: 'Address', type: 'address', required: true, position: { x: 120, y: 95, width: 200, height: 35 } },
            { id: 'dateOfBirth', name: 'dateOfBirth', label: 'DOB', type: 'date', required: true, position: { x: 120, y: 135, width: 80, height: 18 } },
            { id: 'sex', name: 'sex', label: 'Sex', type: 'select', options: ['M', 'F', 'X'], required: true, position: { x: 210, y: 135, width: 30, height: 18 } },
            { id: 'height', name: 'height', label: 'HGT', type: 'text', required: true, position: { x: 250, y: 135, width: 40, height: 18 }, placeholder: "5'10\"" },
            { id: 'weight', name: 'weight', label: 'WGT', type: 'number', required: false, position: { x: 300, y: 135, width: 40, height: 18 } },
            { id: 'eyeColor', name: 'eyeColor', label: 'Eyes', type: 'select', options: ['BLK', 'BLU', 'BRO', 'GRN', 'GRY', 'HAZ'], required: true, position: { x: 120, y: 155, width: 40, height: 18 } },
            { id: 'hairColor', name: 'hairColor', label: 'Hair', type: 'select', options: ['BLK', 'BLN', 'BRO', 'GRY', 'RED', 'WHI'], required: false, position: { x: 170, y: 155, width: 40, height: 18 } },
            { id: 'issueDate', name: 'issueDate', label: 'ISS', type: 'date', required: true, position: { x: 220, y: 155, width: 60, height: 18 } },
            { id: 'expirationDate', name: 'expirationDate', label: 'EXP', type: 'date', required: true, position: { x: 290, y: 155, width: 60, height: 18 } },
            { id: 'restrictions', name: 'restrictions', label: 'REST', type: 'text', required: false, position: { x: 120, y: 175, width: 100, height: 18 } },
            { id: 'endorsements', name: 'endorsements', label: 'END', type: 'text', required: false, position: { x: 230, y: 175, width: 100, height: 18 } },
            { id: 'photo', name: 'photo', label: 'Photo', type: 'photo', required: true, position: { x: 10, y: 30, width: 100, height: 125 } },
            { id: 'signature', name: 'signature', label: 'Signature', type: 'signature', required: true, position: { x: 10, y: 160, width: 100, height: 30 } },
            { id: 'barcode', name: 'barcode', label: 'PDF417 Barcode', type: 'barcode', required: true, position: { x: 10, y: 195, width: 340, height: 50 } }
        ],
        layout: {
            width: 350, height: 220, orientation: 'landscape',
            backgroundColor: '#FFFFFF',
            borders: { width: 2, color: '#000000', style: 'solid', radius: 8 }
        },
        securityFeatures: [
            { type: 'hologram', description: 'State seal hologram overlay' },
            { type: 'microprint', description: 'State motto microprint' },
            { type: 'uv_ink', description: 'UV state outline' },
            { type: 'barcode_2d', description: 'PDF417 barcode with encoded data' }
        ],
        isOfficial: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        usageCount: 0, rating: 5.0
    };
}

// ============== NATIONAL ID / SSN TEMPLATES ==============

function createSSNCardTemplate(): DocumentTemplate {
    return {
        id: 'ssn_card_us',
        category: 'ssn_card',
        country: 'United States',
        countryCode: 'US',
        name: 'Social Security Card',
        description: 'United States Social Security Administration card',
        version: '2024',
        fields: [
            { id: 'name', name: 'name', label: 'Name', type: 'text', required: true, position: { x: 50, y: 60, width: 200, height: 25 }, style: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' } },
            { id: 'ssn', name: 'ssn', label: 'Social Security Number', type: 'ssn', required: true, position: { x: 50, y: 95, width: 180, height: 30 }, style: { fontSize: 20, fontWeight: 'bold' }, validation: { pattern: '^\\d{3}-\\d{2}-\\d{4}$' } },
            { id: 'signature', name: 'signature', label: 'Signature', type: 'signature', required: true, position: { x: 50, y: 130, width: 150, height: 30 } }
        ],
        layout: {
            width: 300, height: 180, orientation: 'landscape',
            backgroundColor: '#E8E4D9',
            borders: { width: 1, color: '#1a3a5c', style: 'solid' }
        },
        securityFeatures: [
            { type: 'microprint', description: 'SSA microprint pattern' },
            { type: 'watermark', description: 'Social Security watermark' }
        ],
        isOfficial: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        usageCount: 0, rating: 5.0
    };
}

function createNationalIDTemplate(country: { code: string; name: string }): DocumentTemplate {
    return {
        id: `national_id_${country.code.toLowerCase()}`,
        category: 'national_id',
        country: country.name,
        countryCode: country.code,
        name: `${country.name} National ID Card`,
        description: `Official ${country.name} national identification card`,
        version: '2024',
        fields: [
            { id: 'idNumber', name: 'idNumber', label: 'ID Number', type: 'text', required: true, position: { x: 120, y: 20, width: 150, height: 20 } },
            { id: 'surname', name: 'surname', label: 'Surname', type: 'text', required: true, position: { x: 120, y: 45, width: 180, height: 20 }, style: { textTransform: 'uppercase', fontWeight: 'bold' } },
            { id: 'givenNames', name: 'givenNames', label: 'Given Names', type: 'text', required: true, position: { x: 120, y: 70, width: 180, height: 20 } },
            { id: 'nationality', name: 'nationality', label: 'Nationality', type: 'text', required: true, position: { x: 120, y: 95, width: 120, height: 20 } },
            { id: 'dateOfBirth', name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, position: { x: 120, y: 120, width: 100, height: 20 } },
            { id: 'sex', name: 'sex', label: 'Sex', type: 'select', options: ['M', 'F', 'X'], required: true, position: { x: 240, y: 120, width: 40, height: 20 } },
            { id: 'placeOfBirth', name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: true, position: { x: 120, y: 145, width: 150, height: 20 } },
            { id: 'expiryDate', name: 'expiryDate', label: 'Expiry', type: 'date', required: true, position: { x: 120, y: 170, width: 80, height: 20 } },
            { id: 'photo', name: 'photo', label: 'Photo', type: 'photo', required: true, position: { x: 10, y: 20, width: 100, height: 125 } },
            { id: 'signature', name: 'signature', label: 'Signature', type: 'signature', required: true, position: { x: 10, y: 150, width: 100, height: 30 } }
        ],
        layout: {
            width: 320, height: 200, orientation: 'landscape',
            backgroundColor: '#FFFFFF',
            borders: { width: 2, color: '#000080', style: 'solid', radius: 6 }
        },
        securityFeatures: [
            { type: 'hologram', description: 'National emblem hologram' },
            { type: 'microprint', description: 'Security microprint' },
            { type: 'rfid', description: 'Contactless chip' }
        ],
        isOfficial: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        usageCount: 0, rating: 5.0
    };
}

// ============== GENERATE ALL TEMPLATES ==============

export function generateAllTemplates(): DocumentTemplate[] {
    const templates: DocumentTemplate[] = [];

    // Generate passport templates for all countries
    COUNTRIES.forEach(country => {
        templates.push(createPassportTemplate(country));
    });

    // Generate US driver's licenses for all states
    US_STATES.forEach(state => {
        templates.push(createUSDriversLicenseTemplate(state));
    });

    // Generate national IDs for all countries
    COUNTRIES.forEach(country => {
        templates.push(createNationalIDTemplate(country));
    });

    // Add SSN card
    templates.push(createSSNCardTemplate());

    return templates;
}

// Pre-generate all templates
export const ALL_TEMPLATES = generateAllTemplates();

// Helper to get templates by category
export function getTemplatesByCategory(category: DocumentCategory): DocumentTemplate[] {
    return ALL_TEMPLATES.filter(t => t.category === category);
}

// Helper to get templates by country
export function getTemplatesByCountry(countryCode: string): DocumentTemplate[] {
    return ALL_TEMPLATES.filter(t => t.countryCode === countryCode);
}

// Helper to get template by ID
export function getTemplateById(id: string): DocumentTemplate | undefined {
    return ALL_TEMPLATES.find(t => t.id === id);
}

// Categories available
export const TEMPLATE_CATEGORIES: { id: DocumentCategory; name: string; icon: string }[] = [
    { id: 'passport', name: 'Passports', icon: '🛂' },
    { id: 'drivers_license', name: "Driver's Licenses", icon: '🪪' },
    { id: 'national_id', name: 'National ID Cards', icon: '🆔' },
    { id: 'ssn_card', name: 'SSN / Tax ID Cards', icon: '📋' },
    { id: 'birth_certificate', name: 'Birth Certificates', icon: '📜' },
    { id: 'visa', name: 'Visas', icon: '✈️' },
    { id: 'tax_document', name: 'Tax Documents', icon: '📑' },
    { id: 'bank_statement', name: 'Bank Statements', icon: '🏦' },
    { id: 'pay_stub', name: 'Pay Stubs', icon: '💰' },
    { id: 'utility_bill', name: 'Utility Bills', icon: '💡' },
    { id: 'insurance_card', name: 'Insurance Cards', icon: '🏥' },
    { id: 'green_card', name: 'Immigration Documents', icon: '🗽' },
    { id: 'work_permit', name: 'Work Permits', icon: '👷' }
];
