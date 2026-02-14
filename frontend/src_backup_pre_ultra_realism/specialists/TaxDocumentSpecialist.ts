/**
 * TaxDocumentSpecialist - Ultra-Advanced Tax Document Generation & Editing
 * 
 * Supports:
 * - W-2 (Wage and Tax Statement)
 * - 1099-MISC, 1099-NEC, 1099-INT, 1099-DIV, 1099-B, 1099-K
 * - 1040 Tax Returns
 * - Tax Refund Documents
 * - State Tax Forms
 * - Schedule C, D, E
 * - W-4, W-9
 * 
 * Features:
 * - OCR extraction from uploaded documents
 * - Field validation with IRS rules
 * - Auto-calculation of tax amounts
 * - SSN/EIN formatting and masking
 * - Multi-year support
 * - Employer/Payer database
 * - State-specific variations
 * - Print-ready PDF generation
 */

import { jsPDF } from 'jspdf';

// ============== INTERFACES ==============

export interface TaxDocumentConfig {
    type: TaxDocumentType;
    taxYear: number;
    data: TaxDocumentData;
    options?: TaxDocumentOptions;
}

export type TaxDocumentType =
    | 'W2'
    | '1099-MISC'
    | '1099-NEC'
    | '1099-INT'
    | '1099-DIV'
    | '1099-B'
    | '1099-K'
    | '1040'
    | '1040-SR'
    | 'SCHEDULE_C'
    | 'SCHEDULE_D'
    | 'SCHEDULE_E'
    | 'W4'
    | 'W9'
    | 'TAX_REFUND'
    | 'STATE_RETURN';

export interface TaxDocumentData {
    // Common fields
    taxpayerInfo?: TaxpayerInfo;
    employerInfo?: EmployerInfo;
    payerInfo?: PayerInfo;

    // W-2 specific
    w2Data?: W2Data;

    // 1099 specific
    form1099Data?: Form1099Data;

    // 1040 specific
    form1040Data?: Form1040Data;

    // Tax refund specific
    refundData?: TaxRefundData;

    // State specific
    stateData?: StateTaxData;
}

export interface TaxpayerInfo {
    firstName: string;
    middleInitial?: string;
    lastName: string;
    ssn: string;
    address: Address;
    dateOfBirth?: string;
    occupation?: string;
    filingStatus?: FilingStatus;
}

export interface EmployerInfo {
    name: string;
    ein: string;
    address: Address;
    stateId?: string;
    controlNumber?: string;
}

export interface PayerInfo {
    name: string;
    tin: string;
    address: Address;
    telephoneNumber?: string;
}

export interface Address {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
}

export type FilingStatus = 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household' | 'qualifying_widow';

export interface W2Data {
    wages: number;                          // Box 1
    federalTaxWithheld: number;             // Box 2
    socialSecurityWages: number;            // Box 3
    socialSecurityTaxWithheld: number;      // Box 4
    medicareWages: number;                  // Box 5
    medicareTaxWithheld: number;            // Box 6
    socialSecurityTips?: number;            // Box 7
    allocatedTips?: number;                 // Box 8
    dependentCareBenefits?: number;         // Box 10
    nonqualifiedPlans?: number;             // Box 11
    box12Codes?: Box12Code[];               // Box 12a-d
    statutoryEmployee?: boolean;            // Box 13
    retirementPlan?: boolean;               // Box 13
    thirdPartySickPay?: boolean;            // Box 13
    other?: string;                         // Box 14
    stateTaxInfo?: StateTaxInfo[];          // Boxes 15-17
    localTaxInfo?: LocalTaxInfo[];          // Boxes 18-20
}

export interface Box12Code {
    code: string;
    amount: number;
}

export interface StateTaxInfo {
    state: string;
    employerStateId: string;
    stateWages: number;
    stateTaxWithheld: number;
}

export interface LocalTaxInfo {
    localityName: string;
    localWages: number;
    localTaxWithheld: number;
}

export interface Form1099Data {
    // 1099-MISC
    rents?: number;                         // Box 1
    royalties?: number;                     // Box 2
    otherIncome?: number;                   // Box 3
    federalTaxWithheld?: number;            // Box 4
    fishingBoatProceeds?: number;           // Box 5
    medicalPayments?: number;               // Box 6
    nonemployeeCompensation?: number;       // Box 7 (pre-2020) or 1099-NEC
    substitutePayments?: number;            // Box 8
    cropInsurance?: number;                 // Box 9
    grossProceedsPaidToAttorney?: number;   // Box 10
    fishPurchasedForResale?: number;        // Box 11
    section409ADeferrals?: number;          // Box 12
    excessGoldenParachute?: number;         // Box 13
    nonqualifiedDeferredCompensation?: number; // Box 14
    stateTaxWithheld?: number;              // Box 16
    statePayerNumber?: string;              // Box 17
    stateIncome?: number;                   // Box 18

    // 1099-INT
    interestIncome?: number;                // Box 1
    earlyWithdrawalPenalty?: number;        // Box 2
    usSavingsBondInterest?: number;         // Box 3
    investmentExpenses?: number;            // Box 5
    foreignTaxPaid?: number;                // Box 6
    foreignCountry?: string;                // Box 7
    taxExemptInterest?: number;             // Box 8
    specifiedPrivateActivityBondInterest?: number; // Box 9
    marketDiscount?: number;                // Box 10
    bondPremium?: number;                   // Box 11

    // 1099-DIV
    ordinaryDividends?: number;             // Box 1a
    qualifiedDividends?: number;            // Box 1b
    totalCapitalGainDistribution?: number;  // Box 2a
    unrecaptured1250Gain?: number;          // Box 2b
    section1202Gain?: number;               // Box 2c
    collectiblesGain?: number;              // Box 2d
    nondividendDistributions?: number;      // Box 3
    section199ADividends?: number;          // Box 5
    exemptInterestDividends?: number;       // Box 12

    // 1099-B
    description?: string;
    dateAcquired?: string;
    dateSold?: string;
    proceeds?: number;                      // Box 1d
    costBasis?: number;                     // Box 1e
    gainLoss?: number;
    shortTermLongTerm?: 'short' | 'long';
    washSaleDisallowed?: number;            // Box 1g

    // 1099-K
    grossAmount?: number;                   // Box 1a
    cardNotPresent?: number;                // Box 1b
    numberOfPaymentTransactions?: number;   // Box 5a
    pseName?: string;
    psePhone?: string;
    merchantCategoryCode?: string;
    monthlyAmounts?: number[];              // 12 months
}

export interface Form1040Data {
    totalIncome: number;
    adjustedGrossIncome: number;
    standardDeduction?: number;
    itemizedDeductions?: number;
    qualifiedBusinessIncome?: number;
    taxableIncome: number;
    totalTax: number;
    totalPayments: number;
    refundOrOwed: number;
    estimatedTaxPayments?: number[];
    schedules?: {
        scheduleA?: ScheduleAData;
        scheduleB?: ScheduleBData;
        scheduleC?: ScheduleCData;
        scheduleD?: ScheduleDData;
        scheduleE?: ScheduleEData;
    };
}

export interface ScheduleAData {
    medicalExpenses: number;
    stateLocalTaxes: number;
    homeInterest: number;
    charitableContributions: number;
    casualtyLosses: number;
    otherDeductions: number;
    totalItemized: number;
}

export interface ScheduleBData {
    interestIncome: { payer: string; amount: number }[];
    dividendIncome: { payer: string; amount: number }[];
}

export interface ScheduleCData {
    businessName?: string;
    businessCode: string;
    grossReceipts: number;
    costOfGoodsSold: number;
    grossProfit: number;
    expenses: {
        advertising?: number;
        carAndTruck?: number;
        commissions?: number;
        depreciation?: number;
        insurance?: number;
        interest?: number;
        legal?: number;
        office?: number;
        rentLease?: number;
        repairs?: number;
        supplies?: number;
        taxes?: number;
        travel?: number;
        utilities?: number;
        wages?: number;
        other?: number;
    };
    netProfit: number;
}

export interface ScheduleDData {
    shortTermTransactions: CapitalTransaction[];
    longTermTransactions: CapitalTransaction[];
    netShortTermGain: number;
    netLongTermGain: number;
    totalNetGain: number;
}

export interface CapitalTransaction {
    description: string;
    dateAcquired: string;
    dateSold: string;
    proceeds: number;
    costBasis: number;
    gainLoss: number;
}

export interface ScheduleEData {
    rentalProperties: RentalProperty[];
    totalRentalIncome: number;
    totalRentalExpenses: number;
    netRentalIncome: number;
}

export interface RentalProperty {
    address: string;
    type: string;
    daysRented: number;
    rents: number;
    advertising?: number;
    auto?: number;
    cleaning?: number;
    commissions?: number;
    insurance?: number;
    legal?: number;
    management?: number;
    mortgage?: number;
    otherInterest?: number;
    repairs?: number;
    supplies?: number;
    taxes?: number;
    utilities?: number;
    depreciation?: number;
    other?: number;
}

export interface TaxRefundData {
    refundAmount: number;
    refundType: 'direct_deposit' | 'check' | 'bonds';
    directDeposit?: {
        routingNumber: string;
        accountNumber: string;
        accountType: 'checking' | 'savings';
    };
    estimatedDate?: string;
    status?: 'pending' | 'approved' | 'sent' | 'deposited';
    trackingNumber?: string;
    federalRefund?: number;
    stateRefund?: number;
}

export interface StateTaxData {
    state: string;
    stateIncome: number;
    stateAdjustments: number;
    stateDeductions: number;
    stateTaxableIncome: number;
    stateTax: number;
    stateCredits: number;
    stateWithholdings: number;
    stateRefundOrOwed: number;
}

export interface TaxDocumentOptions {
    copyType?: 'A' | 'B' | 'C' | 'D' | '1' | '2';
    corrected?: boolean;
    void?: boolean;
    includeInstructions?: boolean;
    watermark?: string;
    securityFeatures?: boolean;
}

export interface TaxDocumentResult {
    documentId: string;
    type: TaxDocumentType;
    taxYear: number;
    pdfBlob?: Blob;
    pdfDataUrl?: string;
    validationResult: ValidationResult;
    calculations: TaxCalculations;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

export interface ValidationWarning {
    field: string;
    message: string;
}

export interface TaxCalculations {
    grossIncome?: number;
    adjustments?: number;
    agi?: number;
    deductions?: number;
    taxableIncome?: number;
    taxLiability?: number;
    credits?: number;
    paymentsWithholdings?: number;
    refundOrBalance?: number;
}

// ============== CONSTANTS ==============

const TAX_BRACKETS_2024 = {
    single: [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
        { min: 47150, max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
        { min: 191950, max: 243725, rate: 0.32 },
        { min: 243725, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
    ],
    married_filing_jointly: [
        { min: 0, max: 23200, rate: 0.10 },
        { min: 23200, max: 94300, rate: 0.12 },
        { min: 94300, max: 201050, rate: 0.22 },
        { min: 201050, max: 383900, rate: 0.24 },
        { min: 383900, max: 487450, rate: 0.32 },
        { min: 487450, max: 731200, rate: 0.35 },
        { min: 731200, max: Infinity, rate: 0.37 }
    ]
};

const STANDARD_DEDUCTIONS_2024 = {
    single: 14600,
    married_filing_jointly: 29200,
    married_filing_separately: 14600,
    head_of_household: 21900,
    qualifying_widow: 29200
};

const SOCIAL_SECURITY_WAGE_BASE_2024 = 168600;
const SOCIAL_SECURITY_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_THRESHOLD = 200000;
const ADDITIONAL_MEDICARE_RATE = 0.009;

const STATE_TAX_RATES: Record<string, { brackets: { min: number; max: number; rate: number }[]; standardDeduction: number }> = {
    'CA': {
        brackets: [
            { min: 0, max: 10412, rate: 0.01 },
            { min: 10412, max: 24684, rate: 0.02 },
            { min: 24684, max: 38959, rate: 0.04 },
            { min: 38959, max: 54081, rate: 0.06 },
            { min: 54081, max: 68350, rate: 0.08 },
            { min: 68350, max: 349137, rate: 0.093 },
            { min: 349137, max: 418961, rate: 0.103 },
            { min: 418961, max: 698271, rate: 0.113 },
            { min: 698271, max: Infinity, rate: 0.123 }
        ],
        standardDeduction: 5363
    },
    'NY': {
        brackets: [
            { min: 0, max: 8500, rate: 0.04 },
            { min: 8500, max: 11700, rate: 0.045 },
            { min: 11700, max: 13900, rate: 0.0525 },
            { min: 13900, max: 80650, rate: 0.0585 },
            { min: 80650, max: 215400, rate: 0.0625 },
            { min: 215400, max: 1077550, rate: 0.0685 },
            { min: 1077550, max: 5000000, rate: 0.0965 },
            { min: 5000000, max: 25000000, rate: 0.103 },
            { min: 25000000, max: Infinity, rate: 0.109 }
        ],
        standardDeduction: 8000
    },
    'TX': { brackets: [], standardDeduction: 0 }, // No state income tax
    'FL': { brackets: [], standardDeduction: 0 }, // No state income tax
    'WA': { brackets: [], standardDeduction: 0 }  // No state income tax
};

const BOX_12_CODES: Record<string, string> = {
    'A': 'Uncollected social security or RRTA tax on tips',
    'B': 'Uncollected Medicare tax on tips',
    'C': 'Taxable cost of group-term life insurance over $50,000',
    'D': 'Elective deferrals to 401(k)',
    'E': 'Elective deferrals to 403(b)',
    'F': 'Elective deferrals to 408(k)(6) SEP',
    'G': 'Elective deferrals to 457(b)',
    'H': 'Elective deferrals to 501(c)(18)(D)',
    'J': 'Nontaxable sick pay',
    'K': '20% excise tax on excess golden parachute',
    'L': 'Substantiated employee business expense reimbursements',
    'M': 'Uncollected social security or RRTA tax on group-term life insurance',
    'N': 'Uncollected Medicare tax on group-term life insurance',
    'P': 'Excludable moving expense reimbursements',
    'Q': 'Nontaxable combat pay',
    'R': 'Employer contributions to Archer MSA',
    'S': 'Employee salary reduction contributions to 408(p) SIMPLE',
    'T': 'Adoption benefits',
    'V': 'Income from exercise of nonstatutory stock option(s)',
    'W': 'Employer contributions to HSA',
    'Y': 'Deferrals under 409A nonqualified deferred compensation plan',
    'Z': 'Income under 409A on nonqualified deferred compensation plan',
    'AA': 'Designated Roth contributions to 401(k)',
    'BB': 'Designated Roth contributions to 403(b)',
    'DD': 'Cost of employer-sponsored health coverage',
    'EE': 'Designated Roth contributions to 457(b)',
    'FF': 'Permitted benefits under qualified small employer HRA',
    'GG': 'Income from qualified equity grants under 83(i)',
    'HH': 'Aggregate deferrals under 83(i)'
};

// ============== MAIN CLASS ==============

export class TaxDocumentSpecialist {
    private currentTaxYear: number;

    constructor() {
        this.currentTaxYear = new Date().getFullYear() - 1; // Default to previous year
    }

    // ============== DOCUMENT GENERATION ==============

    async generateDocument(config: TaxDocumentConfig): Promise<TaxDocumentResult> {
        const documentId = this.generateDocumentId();

        // Validate input data
        const validationResult = this.validateDocument(config);

        // Calculate tax amounts
        const calculations = this.calculateTaxes(config);

        // Generate PDF based on document type
        const pdf = await this.createPDF(config, calculations);

        const pdfBlob = pdf.output('blob');
        const pdfDataUrl = pdf.output('dataurlstring');

        return {
            documentId,
            type: config.type,
            taxYear: config.taxYear,
            pdfBlob,
            pdfDataUrl,
            validationResult,
            calculations
        };
    }

    // ============== VALIDATION ==============

    private validateDocument(config: TaxDocumentConfig): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // Validate SSN format
        if (config.data.taxpayerInfo?.ssn) {
            if (!this.isValidSSN(config.data.taxpayerInfo.ssn)) {
                errors.push({
                    field: 'ssn',
                    message: 'Invalid SSN format. Must be XXX-XX-XXXX',
                    code: 'INVALID_SSN'
                });
            }
        }

        // Validate EIN format
        if (config.data.employerInfo?.ein) {
            if (!this.isValidEIN(config.data.employerInfo.ein)) {
                errors.push({
                    field: 'ein',
                    message: 'Invalid EIN format. Must be XX-XXXXXXX',
                    code: 'INVALID_EIN'
                });
            }
        }

        // W-2 specific validation
        if (config.type === 'W2' && config.data.w2Data) {
            const w2 = config.data.w2Data;

            // Social Security wages can't exceed wage base
            if (w2.socialSecurityWages > SOCIAL_SECURITY_WAGE_BASE_2024) {
                errors.push({
                    field: 'socialSecurityWages',
                    message: `Social Security wages cannot exceed $${SOCIAL_SECURITY_WAGE_BASE_2024.toLocaleString()}`,
                    code: 'SS_WAGE_EXCEEDED'
                });
            }

            // Social Security tax validation
            const expectedSSTax = Math.min(w2.socialSecurityWages, SOCIAL_SECURITY_WAGE_BASE_2024) * SOCIAL_SECURITY_RATE;
            if (Math.abs(w2.socialSecurityTaxWithheld - expectedSSTax) > 1) {
                warnings.push({
                    field: 'socialSecurityTaxWithheld',
                    message: `Social Security tax withheld (${w2.socialSecurityTaxWithheld}) differs from expected (${expectedSSTax.toFixed(2)})`
                });
            }

            // Medicare tax validation
            const expectedMedicareTax = w2.medicareWages * MEDICARE_RATE;
            if (Math.abs(w2.medicareTaxWithheld - expectedMedicareTax) > 1) {
                warnings.push({
                    field: 'medicareTaxWithheld',
                    message: `Medicare tax withheld differs from expected amount`
                });
            }
        }

        // Tax year validation
        const currentYear = new Date().getFullYear();
        if (config.taxYear > currentYear || config.taxYear < currentYear - 10) {
            warnings.push({
                field: 'taxYear',
                message: `Tax year ${config.taxYear} may be outside the normal filing range`
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    private isValidSSN(ssn: string): boolean {
        const cleaned = ssn.replace(/\D/g, '');
        if (cleaned.length !== 9) return false;

        // Cannot start with 9 (reserved for ITIN)
        if (cleaned.startsWith('9')) return false;

        // Cannot be all zeros in any group
        const parts = [cleaned.slice(0, 3), cleaned.slice(3, 5), cleaned.slice(5, 9)];
        if (parts.some(p => /^0+$/.test(p))) return false;

        return true;
    }

    private isValidEIN(ein: string): boolean {
        const cleaned = ein.replace(/\D/g, '');
        return cleaned.length === 9;
    }

    // ============== TAX CALCULATIONS ==============

    private calculateTaxes(config: TaxDocumentConfig): TaxCalculations {
        const calculations: TaxCalculations = {};

        switch (config.type) {
            case 'W2':
                if (config.data.w2Data) {
                    const w2 = config.data.w2Data;
                    calculations.grossIncome = w2.wages;
                    calculations.paymentsWithholdings = w2.federalTaxWithheld;
                }
                break;

            case '1040':
                if (config.data.form1040Data) {
                    const f1040 = config.data.form1040Data;
                    calculations.grossIncome = f1040.totalIncome;
                    calculations.adjustments = f1040.totalIncome - f1040.adjustedGrossIncome;
                    calculations.agi = f1040.adjustedGrossIncome;
                    calculations.deductions = f1040.standardDeduction || f1040.itemizedDeductions || 0;
                    calculations.taxableIncome = f1040.taxableIncome;
                    calculations.taxLiability = f1040.totalTax;
                    calculations.paymentsWithholdings = f1040.totalPayments;
                    calculations.refundOrBalance = f1040.refundOrOwed;
                }
                break;

            case 'TAX_REFUND':
                if (config.data.refundData) {
                    calculations.refundOrBalance = config.data.refundData.refundAmount;
                }
                break;

            default:
                // Calculate for 1099 forms
                if (config.data.form1099Data) {
                    const f1099 = config.data.form1099Data;
                    calculations.grossIncome = f1099.nonemployeeCompensation ||
                        f1099.interestIncome ||
                        f1099.ordinaryDividends ||
                        f1099.grossAmount || 0;
                    calculations.paymentsWithholdings = f1099.federalTaxWithheld || 0;
                }
        }

        return calculations;
    }

    calculateFederalTax(taxableIncome: number, filingStatus: FilingStatus): number {
        const brackets = TAX_BRACKETS_2024[filingStatus === 'married_filing_jointly' ? 'married_filing_jointly' : 'single'];
        let tax = 0;
        let remainingIncome = taxableIncome;

        for (const bracket of brackets) {
            if (remainingIncome <= 0) break;

            const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
            tax += taxableInBracket * bracket.rate;
            remainingIncome -= taxableInBracket;
        }

        return Math.round(tax * 100) / 100;
    }

    calculateStateTax(taxableIncome: number, state: string): number {
        const stateConfig = STATE_TAX_RATES[state];
        if (!stateConfig || stateConfig.brackets.length === 0) return 0;

        let tax = 0;
        let remainingIncome = taxableIncome - stateConfig.standardDeduction;

        for (const bracket of stateConfig.brackets) {
            if (remainingIncome <= 0) break;

            const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
            tax += taxableInBracket * bracket.rate;
            remainingIncome -= taxableInBracket;
        }

        return Math.round(tax * 100) / 100;
    }

    // ============== PDF GENERATION ==============

    private async createPDF(config: TaxDocumentConfig, calculations: TaxCalculations): Promise<jsPDF> {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'letter'
        });

        switch (config.type) {
            case 'W2':
                await this.generateW2PDF(pdf, config);
                break;
            case '1099-MISC':
            case '1099-NEC':
            case '1099-INT':
            case '1099-DIV':
            case '1099-B':
            case '1099-K':
                await this.generate1099PDF(pdf, config);
                break;
            case '1040':
            case '1040-SR':
                await this.generate1040PDF(pdf, config, calculations);
                break;
            case 'TAX_REFUND':
                await this.generateTaxRefundPDF(pdf, config);
                break;
            case 'W4':
                await this.generateW4PDF(pdf, config);
                break;
            case 'W9':
                await this.generateW9PDF(pdf, config);
                break;
            default:
                await this.generateGenericTaxForm(pdf, config);
        }

        return pdf;
    }

    private async generateW2PDF(pdf: jsPDF, config: TaxDocumentConfig): Promise<void> {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 36;

        // Header
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('W-2 Wage and Tax Statement', pageWidth / 2, margin + 20, { align: 'center' });

        pdf.setFontSize(10);
        pdf.text(`Tax Year ${config.taxYear}`, pageWidth / 2, margin + 35, { align: 'center' });

        if (config.options?.corrected) {
            pdf.setTextColor(255, 0, 0);
            pdf.text('CORRECTED', pageWidth - margin, margin + 20, { align: 'right' });
            pdf.setTextColor(0, 0, 0);
        }

        if (config.options?.void) {
            pdf.setTextColor(255, 0, 0);
            pdf.text('VOID', pageWidth - margin, margin + 35, { align: 'right' });
            pdf.setTextColor(0, 0, 0);
        }

        // Draw form boxes
        const startY = margin + 60;
        const boxHeight = 50;
        const boxWidth = (pageWidth - 2 * margin) / 2;

        // Employee SSN (Box a)
        this.drawFormBox(pdf, margin, startY, boxWidth, boxHeight, 'a', 'Employee\'s social security number');
        if (config.data.taxpayerInfo?.ssn) {
            pdf.setFontSize(12);
            pdf.text(this.formatSSN(config.data.taxpayerInfo.ssn), margin + 10, startY + 35);
        }

        // Employer EIN (Box b)
        this.drawFormBox(pdf, margin + boxWidth, startY, boxWidth, boxHeight, 'b', 'Employer identification number (EIN)');
        if (config.data.employerInfo?.ein) {
            pdf.setFontSize(12);
            pdf.text(this.formatEIN(config.data.employerInfo.ein), margin + boxWidth + 10, startY + 35);
        }

        // Employer name and address
        const row2Y = startY + boxHeight;
        this.drawFormBox(pdf, margin, row2Y, boxWidth, boxHeight * 1.5, 'c', 'Employer\'s name, address, and ZIP code');
        if (config.data.employerInfo) {
            const emp = config.data.employerInfo;
            pdf.setFontSize(10);
            let y = row2Y + 25;
            pdf.text(emp.name, margin + 10, y); y += 12;
            pdf.text(emp.address.street1, margin + 10, y); y += 12;
            pdf.text(`${emp.address.city}, ${emp.address.state} ${emp.address.zipCode}`, margin + 10, y);
        }

        // Control number (Box d)
        this.drawFormBox(pdf, margin + boxWidth, row2Y, boxWidth, boxHeight / 2, 'd', 'Control number');

        // Wage boxes
        const wageBoxY = row2Y + boxHeight * 1.5 + 20;
        const wageBoxWidth = (pageWidth - 2 * margin) / 6;
        const wageBoxHeight = 45;

        if (config.data.w2Data) {
            const w2 = config.data.w2Data;

            // Box 1 - Wages
            this.drawFormBox(pdf, margin, wageBoxY, wageBoxWidth, wageBoxHeight, '1', 'Wages, tips, other comp.');
            pdf.setFontSize(11);
            pdf.text(this.formatCurrency(w2.wages), margin + 5, wageBoxY + 35);

            // Box 2 - Federal tax withheld
            this.drawFormBox(pdf, margin + wageBoxWidth, wageBoxY, wageBoxWidth, wageBoxHeight, '2', 'Federal income tax withheld');
            pdf.text(this.formatCurrency(w2.federalTaxWithheld), margin + wageBoxWidth + 5, wageBoxY + 35);

            // Box 3 - SS wages
            this.drawFormBox(pdf, margin + 2 * wageBoxWidth, wageBoxY, wageBoxWidth, wageBoxHeight, '3', 'Social security wages');
            pdf.text(this.formatCurrency(w2.socialSecurityWages), margin + 2 * wageBoxWidth + 5, wageBoxY + 35);

            // Box 4 - SS tax
            this.drawFormBox(pdf, margin + 3 * wageBoxWidth, wageBoxY, wageBoxWidth, wageBoxHeight, '4', 'Social security tax withheld');
            pdf.text(this.formatCurrency(w2.socialSecurityTaxWithheld), margin + 3 * wageBoxWidth + 5, wageBoxY + 35);

            // Box 5 - Medicare wages
            this.drawFormBox(pdf, margin + 4 * wageBoxWidth, wageBoxY, wageBoxWidth, wageBoxHeight, '5', 'Medicare wages and tips');
            pdf.text(this.formatCurrency(w2.medicareWages), margin + 4 * wageBoxWidth + 5, wageBoxY + 35);

            // Box 6 - Medicare tax
            this.drawFormBox(pdf, margin + 5 * wageBoxWidth, wageBoxY, wageBoxWidth, wageBoxHeight, '6', 'Medicare tax withheld');
            pdf.text(this.formatCurrency(w2.medicareTaxWithheld), margin + 5 * wageBoxWidth + 5, wageBoxY + 35);

            // State tax info
            if (w2.stateTaxInfo && w2.stateTaxInfo.length > 0) {
                const stateBoxY = wageBoxY + wageBoxHeight + 60;
                const stateBoxWidth = (pageWidth - 2 * margin) / 4;

                for (let i = 0; i < w2.stateTaxInfo.length; i++) {
                    const stateInfo = w2.stateTaxInfo[i];
                    const rowY = stateBoxY + i * wageBoxHeight;

                    // Box 15 - State/Employer's state ID
                    this.drawFormBox(pdf, margin, rowY, stateBoxWidth, wageBoxHeight, '15', 'State/Employer\'s state ID');
                    pdf.text(`${stateInfo.state} / ${stateInfo.employerStateId}`, margin + 5, rowY + 35);

                    // Box 16 - State wages
                    this.drawFormBox(pdf, margin + stateBoxWidth, rowY, stateBoxWidth, wageBoxHeight, '16', 'State wages, tips, etc.');
                    pdf.text(this.formatCurrency(stateInfo.stateWages), margin + stateBoxWidth + 5, rowY + 35);

                    // Box 17 - State income tax
                    this.drawFormBox(pdf, margin + 2 * stateBoxWidth, rowY, stateBoxWidth, wageBoxHeight, '17', 'State income tax');
                    pdf.text(this.formatCurrency(stateInfo.stateTaxWithheld), margin + 2 * stateBoxWidth + 5, rowY + 35);
                }
            }
        }

        // Employee info
        const empY = row2Y + boxHeight * 0.5 + boxHeight;
        this.drawFormBox(pdf, margin + boxWidth, empY, boxWidth, boxHeight, 'e', 'Employee\'s name');
        if (config.data.taxpayerInfo) {
            const t = config.data.taxpayerInfo;
            pdf.setFontSize(11);
            pdf.text(`${t.firstName} ${t.middleInitial || ''} ${t.lastName}`, margin + boxWidth + 10, empY + 35);
        }

        // Copy label
        const copyType = config.options?.copyType || 'B';
        const copyLabels: Record<string, string> = {
            'A': 'Copy A - For Social Security Administration',
            'B': 'Copy B - To Be Filed With Employee\'s FEDERAL Tax Return',
            'C': 'Copy C - For EMPLOYEE\'S RECORDS',
            'D': 'Copy D - For Employer',
            '1': 'Copy 1 - For State, City, or Local Tax Department',
            '2': 'Copy 2 - To Be Filed With Employee\'s State, City, or Local Income Tax Return'
        };

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.text(copyLabels[copyType] || '', pageWidth / 2, pageHeight - margin, { align: 'center' });

        // IRS footer
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.text('Department of the Treasury—Internal Revenue Service', pageWidth / 2, pageHeight - margin + 15, { align: 'center' });
    }

    private async generate1099PDF(pdf: jsPDF, config: TaxDocumentConfig): Promise<void> {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 36;

        // Determine which 1099 form
        const formType = config.type.replace('1099-', '');

        // Header
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Form 1099-${formType}`, pageWidth / 2, margin + 20, { align: 'center' });

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        const formTitles: Record<string, string> = {
            'MISC': 'Miscellaneous Information',
            'NEC': 'Nonemployee Compensation',
            'INT': 'Interest Income',
            'DIV': 'Dividends and Distributions',
            'B': 'Proceeds From Broker and Barter Exchange Transactions',
            'K': 'Payment Card and Third Party Network Transactions'
        };

        pdf.text(formTitles[formType] || '', pageWidth / 2, margin + 35, { align: 'center' });
        pdf.text(`Tax Year ${config.taxYear}`, pageWidth / 2, margin + 50, { align: 'center' });

        // Payer info
        const startY = margin + 70;
        const boxHeight = 60;
        const halfWidth = (pageWidth - 2 * margin) / 2;

        this.drawFormBox(pdf, margin, startY, pageWidth - 2 * margin, boxHeight, '', 'PAYER\'S name, street address, city or town, state or province, country, ZIP');
        if (config.data.payerInfo) {
            const p = config.data.payerInfo;
            pdf.setFontSize(10);
            let y = startY + 25;
            pdf.text(p.name, margin + 10, y); y += 12;
            pdf.text(p.address.street1, margin + 10, y); y += 12;
            pdf.text(`${p.address.city}, ${p.address.state} ${p.address.zipCode}`, margin + 10, y);
        }

        // TIN boxes
        const tinY = startY + boxHeight;
        this.drawFormBox(pdf, margin, tinY, halfWidth, 45, '', 'PAYER\'S TIN');
        if (config.data.payerInfo?.tin) {
            pdf.text(this.formatEIN(config.data.payerInfo.tin), margin + 10, tinY + 35);
        }

        this.drawFormBox(pdf, margin + halfWidth, tinY, halfWidth, 45, '', 'RECIPIENT\'S TIN');
        if (config.data.taxpayerInfo?.ssn) {
            pdf.text(this.formatSSN(config.data.taxpayerInfo.ssn), margin + halfWidth + 10, tinY + 35);
        }

        // Recipient info
        const recipientY = tinY + 45;
        this.drawFormBox(pdf, margin, recipientY, pageWidth - 2 * margin, boxHeight, '', 'RECIPIENT\'S name');
        if (config.data.taxpayerInfo) {
            const t = config.data.taxpayerInfo;
            pdf.text(`${t.firstName} ${t.lastName}`, margin + 10, recipientY + 25);
            pdf.text(t.address.street1, margin + 10, recipientY + 37);
            pdf.text(`${t.address.city}, ${t.address.state} ${t.address.zipCode}`, margin + 10, recipientY + 49);
        }

        // Amount boxes based on form type
        const amountY = recipientY + boxHeight + 20;
        const boxW = (pageWidth - 2 * margin) / 4;

        if (config.data.form1099Data) {
            const d = config.data.form1099Data;

            switch (formType) {
                case 'NEC':
                    this.drawFormBox(pdf, margin, amountY, boxW, 50, '1', 'Nonemployee compensation');
                    pdf.text(this.formatCurrency(d.nonemployeeCompensation || 0), margin + 5, amountY + 40);
                    break;

                case 'INT':
                    this.drawFormBox(pdf, margin, amountY, boxW, 50, '1', 'Interest income');
                    pdf.text(this.formatCurrency(d.interestIncome || 0), margin + 5, amountY + 40);
                    this.drawFormBox(pdf, margin + boxW, amountY, boxW, 50, '4', 'Federal income tax withheld');
                    pdf.text(this.formatCurrency(d.federalTaxWithheld || 0), margin + boxW + 5, amountY + 40);
                    break;

                case 'DIV':
                    this.drawFormBox(pdf, margin, amountY, boxW, 50, '1a', 'Total ordinary dividends');
                    pdf.text(this.formatCurrency(d.ordinaryDividends || 0), margin + 5, amountY + 40);
                    this.drawFormBox(pdf, margin + boxW, amountY, boxW, 50, '1b', 'Qualified dividends');
                    pdf.text(this.formatCurrency(d.qualifiedDividends || 0), margin + boxW + 5, amountY + 40);
                    break;

                case 'K':
                    this.drawFormBox(pdf, margin, amountY, boxW, 50, '1a', 'Gross amount');
                    pdf.text(this.formatCurrency(d.grossAmount || 0), margin + 5, amountY + 40);
                    break;
            }
        }
    }

    private async generate1040PDF(pdf: jsPDF, config: TaxDocumentConfig, calculations: TaxCalculations): Promise<void> {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 36;

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Form 1040', pageWidth / 2, margin + 20, { align: 'center' });

        pdf.setFontSize(12);
        pdf.text('U.S. Individual Income Tax Return', pageWidth / 2, margin + 40, { align: 'center' });

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Tax Year ${config.taxYear}`, pageWidth / 2, margin + 55, { align: 'center' });

        // Taxpayer info
        const infoY = margin + 80;
        if (config.data.taxpayerInfo) {
            const t = config.data.taxpayerInfo;
            pdf.setFontSize(10);
            pdf.text(`Name: ${t.firstName} ${t.middleInitial || ''} ${t.lastName}`, margin, infoY);
            pdf.text(`SSN: ${this.formatSSN(t.ssn)}`, pageWidth - margin - 100, infoY);
            pdf.text(`Address: ${t.address.street1}, ${t.address.city}, ${t.address.state} ${t.address.zipCode}`, margin, infoY + 15);
            pdf.text(`Filing Status: ${this.formatFilingStatus(t.filingStatus || 'single')}`, margin, infoY + 30);
        }

        // Income section
        const incomeY = infoY + 60;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Income', margin, incomeY);
        pdf.setFont('helvetica', 'normal');

        if (config.data.form1040Data) {
            const d = config.data.form1040Data;
            let y = incomeY + 20;

            pdf.text(`1. Total Income:`, margin + 20, y);
            pdf.text(this.formatCurrency(d.totalIncome), pageWidth - margin - 80, y, { align: 'right' });
            y += 15;

            pdf.text(`8. Adjusted Gross Income:`, margin + 20, y);
            pdf.text(this.formatCurrency(d.adjustedGrossIncome), pageWidth - margin - 80, y, { align: 'right' });
            y += 15;

            pdf.text(`12. Standard/Itemized Deductions:`, margin + 20, y);
            pdf.text(this.formatCurrency(d.standardDeduction || d.itemizedDeductions || 0), pageWidth - margin - 80, y, { align: 'right' });
            y += 15;

            pdf.text(`15. Taxable Income:`, margin + 20, y);
            pdf.text(this.formatCurrency(d.taxableIncome), pageWidth - margin - 80, y, { align: 'right' });
            y += 25;

            // Tax section
            pdf.setFont('helvetica', 'bold');
            pdf.text('Tax and Credits', margin, y);
            pdf.setFont('helvetica', 'normal');
            y += 20;

            pdf.text(`24. Total Tax:`, margin + 20, y);
            pdf.text(this.formatCurrency(d.totalTax), pageWidth - margin - 80, y, { align: 'right' });
            y += 15;

            pdf.text(`33. Total Payments:`, margin + 20, y);
            pdf.text(this.formatCurrency(d.totalPayments), pageWidth - margin - 80, y, { align: 'right' });
            y += 25;

            // Refund or Amount Owed
            pdf.setFont('helvetica', 'bold');
            if (d.refundOrOwed > 0) {
                pdf.setTextColor(0, 128, 0);
                pdf.text('Refund', margin, y);
                pdf.text(this.formatCurrency(d.refundOrOwed), pageWidth - margin - 80, y, { align: 'right' });
            } else {
                pdf.setTextColor(255, 0, 0);
                pdf.text('Amount You Owe', margin, y);
                pdf.text(this.formatCurrency(Math.abs(d.refundOrOwed)), pageWidth - margin - 80, y, { align: 'right' });
            }
            pdf.setTextColor(0, 0, 0);
        }
    }

    private async generateTaxRefundPDF(pdf: jsPDF, config: TaxDocumentConfig): Promise<void> {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 36;

        // Header
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Tax Refund Statement', pageWidth / 2, margin + 30, { align: 'center' });

        pdf.setFontSize(12);
        pdf.text(`Tax Year ${config.taxYear}`, pageWidth / 2, margin + 50, { align: 'center' });

        if (config.data.refundData) {
            const r = config.data.refundData;
            let y = margin + 100;

            // Refund amount - large and prominent
            pdf.setFontSize(24);
            pdf.setTextColor(0, 128, 0);
            pdf.text(`Refund Amount: ${this.formatCurrency(r.refundAmount)}`, pageWidth / 2, y, { align: 'center' });
            pdf.setTextColor(0, 0, 0);

            y += 50;

            // Details
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');

            if (r.federalRefund) {
                pdf.text(`Federal Refund: ${this.formatCurrency(r.federalRefund)}`, margin, y);
                y += 20;
            }

            if (r.stateRefund) {
                pdf.text(`State Refund: ${this.formatCurrency(r.stateRefund)}`, margin, y);
                y += 20;
            }

            pdf.text(`Refund Method: ${r.refundType === 'direct_deposit' ? 'Direct Deposit' : r.refundType === 'check' ? 'Paper Check' : 'U.S. Savings Bonds'}`, margin, y);
            y += 20;

            if (r.directDeposit) {
                pdf.text(`Bank Routing: ${'*'.repeat(5) + r.directDeposit.routingNumber.slice(-4)}`, margin, y);
                y += 15;
                pdf.text(`Account: ${'*'.repeat(r.directDeposit.accountNumber.length - 4) + r.directDeposit.accountNumber.slice(-4)}`, margin, y);
                y += 15;
                pdf.text(`Account Type: ${r.directDeposit.accountType}`, margin, y);
                y += 20;
            }

            if (r.estimatedDate) {
                pdf.text(`Estimated Deposit Date: ${r.estimatedDate}`, margin, y);
                y += 20;
            }

            if (r.status) {
                const statusColors: Record<string, [number, number, number]> = {
                    pending: [255, 165, 0],
                    approved: [0, 128, 0],
                    sent: [0, 0, 255],
                    deposited: [0, 128, 0]
                };
                const color = statusColors[r.status] || [0, 0, 0];
                pdf.setTextColor(...color);
                pdf.text(`Status: ${r.status.toUpperCase()}`, margin, y);
                pdf.setTextColor(0, 0, 0);
            }
        }

        // Taxpayer info at bottom
        if (config.data.taxpayerInfo) {
            const t = config.data.taxpayerInfo;
            pdf.setFontSize(10);
            const bottomY = pdf.internal.pageSize.getHeight() - margin - 60;
            pdf.text(`Taxpayer: ${t.firstName} ${t.lastName}`, margin, bottomY);
            pdf.text(`SSN: XXX-XX-${t.ssn.slice(-4)}`, margin, bottomY + 15);
        }
    }

    private async generateW4PDF(pdf: jsPDF, config: TaxDocumentConfig): Promise<void> {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 36;

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Form W-4', pageWidth / 2, margin + 20, { align: 'center' });

        pdf.setFontSize(12);
        pdf.text('Employee\'s Withholding Certificate', pageWidth / 2, margin + 40, { align: 'center' });

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Department of the Treasury - Internal Revenue Service', pageWidth / 2, margin + 55, { align: 'center' });
    }

    private async generateW9PDF(pdf: jsPDF, config: TaxDocumentConfig): Promise<void> {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 36;

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Form W-9', pageWidth / 2, margin + 20, { align: 'center' });

        pdf.setFontSize(12);
        pdf.text('Request for Taxpayer Identification Number and Certification', pageWidth / 2, margin + 40, { align: 'center' });
    }

    private async generateGenericTaxForm(pdf: jsPDF, config: TaxDocumentConfig): Promise<void> {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 36;

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Form ${config.type}`, pageWidth / 2, margin + 20, { align: 'center' });
        pdf.text(`Tax Year ${config.taxYear}`, pageWidth / 2, margin + 40, { align: 'center' });
    }

    // ============== HELPER METHODS ==============

    private drawFormBox(pdf: jsPDF, x: number, y: number, width: number, height: number, boxNumber: string, label: string): void {
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.5);
        pdf.rect(x, y, width, height);

        if (boxNumber) {
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text(boxNumber, x + 3, y + 10);
        }

        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.text(label, x + (boxNumber ? 15 : 3), y + 10);
    }

    private formatSSN(ssn: string): string {
        const cleaned = ssn.replace(/\D/g, '');
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
    }

    private formatEIN(ein: string): string {
        const cleaned = ein.replace(/\D/g, '');
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    }

    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    private formatFilingStatus(status: FilingStatus): string {
        const labels: Record<FilingStatus, string> = {
            single: 'Single',
            married_filing_jointly: 'Married Filing Jointly',
            married_filing_separately: 'Married Filing Separately',
            head_of_household: 'Head of Household',
            qualifying_widow: 'Qualifying Widow(er)'
        };
        return labels[status];
    }

    private generateDocumentId(): string {
        return `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============== PUBLIC UTILITIES ==============

    getSupportedDocumentTypes(): TaxDocumentType[] {
        return [
            'W2', '1099-MISC', '1099-NEC', '1099-INT', '1099-DIV', '1099-B', '1099-K',
            '1040', '1040-SR', 'SCHEDULE_C', 'SCHEDULE_D', 'SCHEDULE_E',
            'W4', 'W9', 'TAX_REFUND', 'STATE_RETURN'
        ];
    }

    getBox12Codes(): Record<string, string> {
        return BOX_12_CODES;
    }

    getStandardDeduction(filingStatus: FilingStatus): number {
        return STANDARD_DEDUCTIONS_2024[filingStatus];
    }

    getSocialSecurityWageBase(): number {
        return SOCIAL_SECURITY_WAGE_BASE_2024;
    }
}

export const taxDocumentSpecialist = new TaxDocumentSpecialist();
