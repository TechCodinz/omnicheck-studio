/**
 * ComplianceEngine - NACHA/ACH Compliance & AML Integration
 * 
 * Features:
 * - NACHA formatting validation
 * - AML/KYC integration hooks
 * - Automated regulatory reporting
 * - Check field compliance verification
 */

interface NACHAValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fieldResults: Record<string, { valid: boolean; message?: string }>;
}

interface AMLCheck {
    checkId: string;
    result: 'clear' | 'review' | 'block';
    matchedLists: string[];
    riskScore: number;
    requiresManualReview: boolean;
}

interface ComplianceReport {
    id: string;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    generatedAt: Date;
    period: { start: Date; end: Date };
    summary: {
        totalChecks: number;
        totalAmount: number;
        flaggedTransactions: number;
        blockedTransactions: number;
        amlHits: number;
    };
    details: any[];
}

interface KYCVerification {
    userId: string;
    status: 'pending' | 'verified' | 'rejected' | 'expired';
    verificationLevel: 'basic' | 'enhanced' | 'full';
    documents: { type: string; verified: boolean; expiresAt?: Date }[];
    lastVerified?: Date;
}

export class ComplianceEngine {
    private amlLists: Set<string> = new Set();
    private complianceRules: Map<string, (data: any) => boolean> = new Map();

    constructor() {
        this.initializeRules();
        this.loadAMLLists();
    }

    private initializeRules(): void {
        // NACHA field length rules
        this.complianceRules.set('routingNumber', (val: string) => /^\d{9}$/.test(val));
        this.complianceRules.set('accountNumber', (val: string) => /^\d{4,17}$/.test(val));
        this.complianceRules.set('amount', (val: number) => val > 0 && val <= 99999999.99);
        this.complianceRules.set('checkNumber', (val: string) => /^\d{1,15}$/.test(val));
        this.complianceRules.set('payeeName', (val: string) => val.length >= 1 && val.length <= 22);
    }

    private async loadAMLLists(): Promise<void> {
        // In production, load from OFAC, EU sanctions lists, etc.
        // This is a placeholder for demo
        this.amlLists.add('blocked_entity_1');
        this.amlLists.add('blocked_entity_2');
    }

    /**
     * Validate check against NACHA standards
     */
    validateNACHA(checkData: any): NACHAValidation {
        const errors: string[] = [];
        const warnings: string[] = [];
        const fieldResults: Record<string, { valid: boolean; message?: string }> = {};

        // Routing number validation (ABA format)
        if (!this.validateRoutingNumber(checkData.routingNumber)) {
            errors.push('Invalid routing number format or checksum');
            fieldResults.routingNumber = { valid: false, message: 'Invalid ABA routing number' };
        } else {
            fieldResults.routingNumber = { valid: true };
        }

        // Account number
        const accountRule = this.complianceRules.get('accountNumber');
        if (accountRule && !accountRule(checkData.accountNumber)) {
            errors.push('Account number must be 4-17 digits');
            fieldResults.accountNumber = { valid: false, message: 'Invalid length' };
        } else {
            fieldResults.accountNumber = { valid: true };
        }

        // Amount validation
        const amount = parseFloat(checkData.amount);
        if (isNaN(amount) || amount <= 0) {
            errors.push('Amount must be a positive number');
            fieldResults.amount = { valid: false, message: 'Invalid amount' };
        } else if (amount > 99999999.99) {
            errors.push('Amount exceeds NACHA maximum ($99,999,999.99)');
            fieldResults.amount = { valid: false, message: 'Exceeds maximum' };
        } else {
            fieldResults.amount = { valid: true };
            if (amount > 10000) {
                warnings.push('Amount over $10,000 may trigger CTR reporting requirements');
            }
        }

        // Check number
        const checkNumRule = this.complianceRules.get('checkNumber');
        if (checkNumRule && !checkNumRule(checkData.checkNumber)) {
            errors.push('Check number must be 1-15 digits');
            fieldResults.checkNumber = { valid: false, message: 'Invalid format' };
        } else {
            fieldResults.checkNumber = { valid: true };
        }

        // Payee name
        if (!checkData.payeeName || checkData.payeeName.trim().length === 0) {
            errors.push('Payee name is required');
            fieldResults.payeeName = { valid: false, message: 'Required' };
        } else if (checkData.payeeName.length > 22) {
            warnings.push('Payee name exceeds 22 characters, may be truncated');
            fieldResults.payeeName = { valid: true, message: 'May be truncated' };
        } else {
            fieldResults.payeeName = { valid: true };
        }

        // Date validation
        const checkDate = new Date(checkData.date);
        const now = new Date();
        const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
        const sixMonthsAhead = new Date(now.setMonth(now.getMonth() + 12));

        if (checkDate < sixMonthsAgo) {
            errors.push('Check date is stale (more than 6 months old)');
            fieldResults.date = { valid: false, message: 'Stale dated' };
        } else if (checkDate > sixMonthsAhead) {
            warnings.push('Post-dated check may not be accepted');
            fieldResults.date = { valid: true, message: 'Post-dated' };
        } else {
            fieldResults.date = { valid: true };
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            fieldResults
        };
    }

    private validateRoutingNumber(routing: string): boolean {
        if (!/^\d{9}$/.test(routing)) return false;

        // ABA checksum validation
        const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1];
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(routing[i]) * weights[i];
        }
        return sum % 10 === 0;
    }

    /**
     * Check entity against AML/sanctions lists
     */
    async checkAML(checkData: any): Promise<AMLCheck> {
        const payee = (checkData.payeeName || '').toLowerCase();
        const matchedLists: string[] = [];
        let riskScore = 0;

        // Check against local lists
        for (const blocked of this.amlLists) {
            if (payee.includes(blocked.toLowerCase())) {
                matchedLists.push('OFAC-SDN');
                riskScore += 100;
            }
        }

        // Amount-based risk
        const amount = parseFloat(checkData.amount) || 0;
        if (amount >= 10000) riskScore += 30; // CTR threshold
        if (amount >= 3000) riskScore += 10; // Structuring threshold

        // Pattern-based risk
        if (/^round(ed)?(\s+)?(number|amount)?$/i.test(payee)) {
            riskScore += 20;
        }

        return {
            checkId: checkData.id || checkData.checkNumber,
            result: matchedLists.length > 0 ? 'block' : riskScore > 50 ? 'review' : 'clear',
            matchedLists,
            riskScore: Math.min(100, riskScore),
            requiresManualReview: riskScore > 50 && matchedLists.length === 0
        };
    }

    /**
     * Generate compliance report
     */
    async generateReport(type: ComplianceReport['type'], checks: any[]): Promise<ComplianceReport> {
        const now = new Date();
        let periodStart: Date;

        switch (type) {
            case 'daily':
                periodStart = new Date(now.setDate(now.getDate() - 1));
                break;
            case 'weekly':
                periodStart = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'monthly':
                periodStart = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'quarterly':
                periodStart = new Date(now.setMonth(now.getMonth() - 3));
                break;
        }

        let totalAmount = 0;
        let flaggedTransactions = 0;
        let blockedTransactions = 0;
        let amlHits = 0;

        for (const check of checks) {
            totalAmount += parseFloat(check.amount) || 0;
            const amlResult = await this.checkAML(check);
            if (amlResult.result === 'block') {
                blockedTransactions++;
                amlHits++;
            } else if (amlResult.result === 'review') {
                flaggedTransactions++;
            }
        }

        return {
            id: `report_${Date.now()}`,
            type,
            generatedAt: new Date(),
            period: { start: periodStart, end: new Date() },
            summary: {
                totalChecks: checks.length,
                totalAmount,
                flaggedTransactions,
                blockedTransactions,
                amlHits
            },
            details: checks.map(c => ({
                checkNumber: c.checkNumber,
                amount: c.amount,
                payee: c.payeeName,
                status: 'processed'
            }))
        };
    }

    /**
     * Currency Transaction Report (CTR) threshold check
     */
    checkCTRThreshold(amount: number): { requiresCTR: boolean; threshold: number } {
        const threshold = 10000;
        return {
            requiresCTR: amount >= threshold,
            threshold
        };
    }

    /**
     * Suspicious Activity Report (SAR) check
     */
    checkSARIndicators(checkData: any): { requiresSAR: boolean; indicators: string[] } {
        const indicators: string[] = [];

        // Structuring detection
        const amount = parseFloat(checkData.amount) || 0;
        if (amount >= 9000 && amount < 10000) {
            indicators.push('Possible structuring (amount just below CTR threshold)');
        }

        // Round amount patterns
        if (amount > 1000 && amount % 1000 === 0) {
            indicators.push('Round amount pattern');
        }

        return {
            requiresSAR: indicators.length >= 2,
            indicators
        };
    }
}

export const complianceEngine = new ComplianceEngine();
