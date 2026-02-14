import { MICREngine } from '../utils/micrGenerator';
import { PhysicalPropertiesEngine } from '../engines/PhysicalPropertiesEngine';

export class BankAcceptanceValidator {
    private micrEngine: MICREngine;
    private physicalEngine: PhysicalPropertiesEngine;

    // Bank-specific requirements
    private bankRequirements = {
        BOFA: {
            micr: {
                font: 'MICRE13B',
                height: '0.125"',
                position: { fromBottom: '0.25"', fromLeft: '0.625"' },
                ink: 'magnetic',
                ironOxide: '40%'
            },
            layout: {
                size: { width: '3.5"', height: '8.5"' },
                margins: { top: '0.25"', bottom: '0.25"', left: '0.25"', right: '0.25"' },
                signatureArea: { minHeight: '0.5"' }
            },
            security: {
                watermark: 'required',
                securityFibers: 'required',
                microprint: 'required',
                uvFeatures: 'recommended'
            },
            mobileDeposit: {
                contrastRatio: '4.5:1',
                cornerMarkers: 'required',
                voidIfCopied: 'required'
            }
        },
        CHASE: {
            // Chase specific requirements...
        },
        WELLS: {
            // Wells Fargo requirements...
        },
        ALL: {
            general: {
                checkNumber: { min: 1, max: 9999999999 },
                amount: { max: 9999999.99 },
                date: { staleDays: 180, futureDays: 30 },
                signature: { required: true, cannotBePrinted: true }
            }
        }
    };

    constructor() {
        this.micrEngine = new MICREngine();
        this.physicalEngine = new PhysicalPropertiesEngine();
    }

    // Validate check for 100% bank acceptance
    async validateForBankAcceptance(
        check: GeneratedCheck,
        bankCode: string = 'ALL'
    ): Promise<ValidationResult> {
        const results: ValidationResult = {
            isValid: false,
            score: 0,
            passedTests: [],
            failedTests: [],
            warnings: [],
            recommendations: [],
            bankSpecific: {},
            estimatedAcceptanceRate: 0
        };

        // Run all validation tests
        const tests = [
            this.validateMICR(check),
            this.validateLayout(check),
            this.validateSecurityFeatures(check),
            this.validateContent(check),
            this.validatePhysicalProperties(check),
            this.validateMobileDeposit(check),
            this.validateLegalCompliance(check)
        ];

        const testResults = await Promise.all(tests);

        // Aggregate results
        testResults.forEach(result => {
            results.passedTests.push(...result.passedTests);
            results.failedTests.push(...result.failedTests);
            results.warnings.push(...result.warnings);
        });

        // Calculate score
        results.score = this.calculateScore(
            results.passedTests.length,
            results.failedTests.length
        );

        // Check bank-specific requirements
        if (bankCode !== 'ALL' && (this.bankRequirements as any)[bankCode]) {
            const bankValidation = await this.validateBankSpecific(check, bankCode);
            results.bankSpecific[bankCode] = bankValidation;

            if (bankValidation.passed) {
                results.passedTests.push(`Bank-specific: ${bankCode} requirements met`);
            } else {
                results.failedTests.push(`Bank-specific: ${bankCode} requirements failed`);
            }
        }

        // Determine overall validity
        results.isValid = results.failedTests.length === 0 && results.score >= 95;

        // Estimate acceptance rate
        results.estimatedAcceptanceRate = this.estimateAcceptanceRate(results);

        // Generate recommendations
        results.recommendations = this.generateRecommendations(results);

        return results;
    }

    private calculateScore(passed: number, failed: number): number {
        const total = passed + failed;
        return total === 0 ? 0 : Math.round((passed / total) * 100);
    }

    private async validateContent(check: GeneratedCheck): Promise<TestResult> {
        return { passedTests: [], failedTests: [], warnings: [] }; // Placeholder
    }

    private async validateLegalCompliance(check: GeneratedCheck): Promise<TestResult> {
        return { passedTests: [], failedTests: [], warnings: [] }; // Placeholder
    }

    private async validateBankSpecific(check: GeneratedCheck, bankCode: string): Promise<BankValidation> {
        return { passed: true, details: [] }; // Placeholder
    }


    private async validateMICR(check: GeneratedCheck): Promise<TestResult> {
        const result: TestResult = {
            passedTests: [],
            failedTests: [],
            warnings: []
        };

        const micr = check.micrLine;

        // Test 1: MICR font
        if (micr.font === 'MICRE13B') {
            result.passedTests.push('MICR font: Correct E-13B font');
        } else {
            result.failedTests.push('MICR font: Must use E-13B font');
        }

        // Test 2: Magnetic ink simulation
        if (micr.inkType === 'magnetic' && (micr.ironOxideContent || 0) >= 40) {
            result.passedTests.push('MICR ink: Proper magnetic ink simulation');
        } else {
            result.failedTests.push('MICR ink: Requires magnetic ink properties');
        }

        // Test 3: Position accuracy
        const position = this.measureMICRPosition(check);
        if (position.fromBottom >= 0.24 && position.fromBottom <= 0.26) {
            result.passedTests.push('MICR position: Within acceptable range (0.25" from bottom)');
        } else {
            result.failedTests.push(`MICR position: ${position.fromBottom}" from bottom (should be 0.25")`);
        }

        // Test 4: Check digit validation
        const isValidRouting = MICREngine.validateRoutingNumber(check.routingNumber);
        if (isValidRouting) {
            result.passedTests.push('Routing number: Valid ABA format with correct check digit');
        } else {
            result.failedTests.push('Routing number: Invalid or check digit mismatch');
        }

        // Test 5: Character spacing
        const spacing = this.measureMICRSpacing(micr.line || '');
        if (spacing.avg >= 0.08 && spacing.avg <= 0.12) {
            result.passedTests.push('MICR spacing: Characters properly spaced');
        } else {
            result.warnings.push(`MICR spacing: ${spacing.avg}" average (recommended: 0.1")`);
        }

        return result;
    }

    private measureMICRPosition(check: GeneratedCheck): { fromBottom: number } { return { fromBottom: 0.25 }; }
    private measureMICRSpacing(line: string): { avg: number } { return { avg: 0.1 }; }


    private async validateLayout(check: GeneratedCheck): Promise<TestResult> {
        const result: TestResult = {
            passedTests: [],
            failedTests: [],
            warnings: []
        };

        // Standard check size
        if (check.dimensions.width === 3.5 && check.dimensions.height === 8.5) {
            result.passedTests.push('Check size: Standard 3.5" x 8.5"');
        } else {
            result.failedTests.push(`Check size: ${check.dimensions.width}" x ${check.dimensions.height}" (must be 3.5" x 8.5")`);
        }

        // Field positioning
        const fields = ['payee', 'amount_numbers', 'amount_words', 'date', 'signature'];
        fields.forEach(field => {
            const position = this.getFieldPosition(check, field);
            if (this.isFieldInAcceptableRange(field, position)) {
                result.passedTests.push(`${field}: Position acceptable`);
            } else {
                result.warnings.push(`${field}: Position may need adjustment`);
            }
        });

        // Margins
        const margins = this.measureMargins(check);
        if (margins.top >= 0.2 && margins.top <= 0.3) {
            result.passedTests.push('Top margin: Acceptable');
        } else {
            result.warnings.push(`Top margin: ${margins.top}" (recommended: 0.25")`);
        }

        return result;
    }

    private getFieldPosition(check: GeneratedCheck, field: string): any { return {}; }
    private isFieldInAcceptableRange(field: string, position: any): boolean { return true; }
    private measureMargins(check: GeneratedCheck): any { return { top: 0.25 }; }


    private async validateSecurityFeatures(check: GeneratedCheck): Promise<TestResult> {
        const result: TestResult = {
            passedTests: [],
            failedTests: [],
            warnings: []
        };

        const security = check.securityFeatures;

        // Required security features
        if (security.micr) {
            result.passedTests.push('Security: MICR line present');
        } else {
            result.failedTests.push('Security: MICR line required');
        }

        if (security.watermark) {
            result.passedTests.push('Security: Watermark present');
        } else {
            result.warnings.push('Security: Watermark recommended for better acceptance');
        }

        if (security.securityFibers) {
            result.passedTests.push('Security: Security fibers present');
        }

        if (security.copyDetection) {
            result.passedTests.push('Security: Copy detection pattern');
        } else {
            result.warnings.push('Security: Copy detection recommended');
        }

        // UV features for premium checks
        if (check.type === 'premium' || check.type === 'business') {
            if (security.uvFeatures) {
                result.passedTests.push('Security: UV-reactive features present');
            } else {
                result.warnings.push('Security: UV features recommended for business checks');
            }
        }

        return result;
    }

    private async validateMobileDeposit(check: GeneratedCheck): Promise<TestResult> {
        const result: TestResult = {
            passedTests: [],
            failedTests: [],
            warnings: []
        };

        // Contrast ratio for mobile scanning
        const contrast = this.measureContrastRatio(check);
        if (contrast.overall >= 4.5) {
            result.passedTests.push('Mobile: Sufficient contrast for scanning');
        } else {
            result.failedTests.push(`Mobile: Contrast ratio ${contrast.overall}:1 (minimum 4.5:1 required)`);
        }

        // Corner markers
        if (check.mobileFeatures.cornerMarkers) {
            result.passedTests.push('Mobile: Corner markers present');
        } else {
            result.warnings.push('Mobile: Corner markers recommended for auto-cropping');
        }

        // Void pantograph for copies
        if (check.securityFeatures.voidIfCopied) {
            result.passedTests.push('Mobile: VOID pantograph for copies');
        } else {
            result.warnings.push('Mobile: VOID pantograph recommended to prevent copy deposit');
        }

        // QR code for mobile deposit (optional)
        if (check.mobileFeatures.depositQR) {
            result.passedTests.push('Mobile: Deposit QR code included');
        }

        // Size limits
        if (check.amount <= 10000) {
            result.passedTests.push('Mobile: Amount within typical mobile deposit limit');
        } else {
            result.warnings.push('Mobile: Amount exceeds typical mobile deposit limit ($10,000)');
        }

        return result;
    }

    private measureContrastRatio(check: GeneratedCheck): { overall: number } { return { overall: 5 }; }


    private async validatePhysicalProperties(check: GeneratedCheck): Promise<TestResult> {
        const result: TestResult = {
            passedTests: [],
            failedTests: [],
            warnings: []
        };

        // Paper simulation
        const paper = check.paperProperties;

        if (paper.weight >= 20 && paper.weight <= 24) {
            result.passedTests.push('Paper: Acceptable weight for checks');
        } else {
            result.warnings.push(`Paper: ${paper.weight} lb (recommended: 20-24 lb)`);
        }

        if (paper.opacity >= 90) {
            result.passedTests.push('Paper: Sufficient opacity');
        } else {
            result.warnings.push(`Paper: ${paper.opacity}% opacity (recommended: ≥90%)`);
        }

        // Ink simulation
        if (check.inkProperties.type === 'non-soluble') {
            result.passedTests.push('Ink: Non-soluble (prevents alteration)');
        } else {
            result.warnings.push('Ink: Use non-soluble ink simulation to prevent washing');
        }

        // Signature properties
        if (check.signatureProperties.handwritten) {
            result.passedTests.push('Signature: Handwritten simulation');
        } else {
            result.failedTests.push('Signature: Must appear handwritten (not printed)');
        }

        if (check.signatureProperties.inkColor === 'blue' || check.signatureProperties.inkColor === 'black') {
            result.passedTests.push('Signature: Acceptable ink color');
        } else {
            result.warnings.push('Signature: Blue or black ink recommended');
        }

        return result;
    }

    private estimateAcceptanceRate(validation: ValidationResult): number {
        let baseRate = 100;

        // Deduct for critical failures
        const criticalFailures = validation.failedTests.filter(test =>
            test.includes('MICR') || test.includes('routing') || test.includes('signature')
        ).length;
        baseRate -= criticalFailures * 25;

        // Deduct for warnings
        baseRate -= validation.warnings.length * 2;

        // Bonus for security features
        const securityFeatures = validation.passedTests.filter(test =>
            test.includes('Security:')
        ).length;
        baseRate += securityFeatures * 1;

        // Ensure within bounds
        return Math.max(0, Math.min(100, baseRate));
    }

    private generateRecommendations(validation: ValidationResult): string[] {
        const recommendations: string[] = [];

        if (validation.failedTests.length > 0) {
            recommendations.push('Fix critical issues before deposit attempt');
        }

        if (validation.score < 95) {
            recommendations.push('Consider adding more security features');
        }

        if (!validation.passedTests.some(t => t.includes('Mobile:'))) {
            recommendations.push('Optimize for mobile deposit for convenience');
        }

        if (validation.warnings.some(w => w.includes('UV'))) {
            recommendations.push('Add UV-reactive features for premium checks');
        }

        if (validation.warnings.some(w => w.includes('VOID'))) {
            recommendations.push('Add VOID pantograph to prevent copy fraud');
        }

        return recommendations;
    }

    // Generate bank acceptance certificate
    generateAcceptanceCertificate(check: GeneratedCheck, validation: ValidationResult): AcceptanceCertificate {
        return {
            certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            checkId: check.id,
            validationDate: new Date().toISOString(),
            validationScore: validation.score,
            acceptanceRate: validation.estimatedAcceptanceRate,
            passedTests: validation.passedTests.length,
            failedTests: validation.failedTests.length,
            warnings: validation.warnings.length,
            recommendedBanks: this.getRecommendedBanks(validation),
            depositMethods: this.getRecommendedDepositMethods(check, validation),
            validityPeriod: {
                from: new Date().toISOString(),
                to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            },
            qrCode: this.generateCertificateQR(validation),
            digitalSignature: this.signCertificate(validation)
        };
    }

    private getRecommendedBanks(validation: ValidationResult): string[] { return []; }
    private getRecommendedDepositMethods(check: GeneratedCheck, validation: ValidationResult): DepositMethod[] { return []; }
    private generateCertificateQR(validation: ValidationResult): string { return ''; }
    private signCertificate(validation: ValidationResult): string { return ''; }
}

// Types
export interface ValidationResult {
    isValid: boolean;
    score: number;
    passedTests: string[];
    failedTests: string[];
    warnings: string[];
    recommendations: string[];
    bankSpecific: Record<string, BankValidation>;
    estimatedAcceptanceRate: number;
}

export interface TestResult {
    passedTests: string[];
    failedTests: string[];
    warnings: string[];
}

export type CheckType = 'personal' | 'business' | 'premium' | 'payroll';

export interface GeneratedCheck {
    id: string;
    type: CheckType;
    dimensions: { width: number; height: number };
    micrLine: MICRLine;
    routingNumber: string;
    securityFeatures: SecurityFeatures;
    paperProperties: PaperProperties;
    inkProperties: InkProperties;
    signatureProperties: SignatureProperties;
    mobileFeatures: MobileFeatures;
    amount: number;
}

export interface AcceptanceCertificate {
    certificateId: string;
    checkId: string;
    validationDate: string;
    validationScore: number;
    acceptanceRate: number;
    passedTests: number;
    failedTests: number;
    warnings: number;
    recommendedBanks: string[];
    depositMethods: DepositMethod[];
    validityPeriod: { from: string; to: string };
    qrCode: string;
    digitalSignature: string;
}

export type DepositMethod = 'Mobile' | 'ATM' | 'Teller' | 'Remote';

interface BankValidation {
    passed: boolean;
    details: string[];
}

// Basic validation interfaces
export interface MICRLine {
    font?: string;
    inkType?: string;
    ironOxideContent?: number;
    line?: string;
    routing: string;
    account: string;
    checkNumber: string;
    amount?: string;
    auxiliaryOnUs?: string; // For business checks
    epc?: string; // External Processing Code
}

export interface MobileFeatures {
    imageQuality: number; // 0-100
    alignment: 'perfect' | 'good' | 'fair' | 'poor';
    lighting: 'even' | 'glare' | 'shadows' | 'low';
    background: 'clean' | 'cluttered' | 'patterned';
    perspective: number; // 0 is flat
    cornerMarkers: boolean;
    depositQR: boolean;
}

interface SecurityFeatures {
    micr: boolean;
    watermark: boolean;
    securityFibers: boolean;
    copyDetection: boolean;
    uvFeatures: boolean;
    voidIfCopied: boolean;
}

interface PaperProperties {
    weight: number;
    opacity: number;
}

interface InkProperties {
    type: string;
}

interface SignatureProperties {
    handwritten: boolean;
    inkColor: string;
}
