/**
 * MICRComplianceEngine - ANSI X9.100-160 Standard Compliance v1.0
 * 
 * Features:
 * - E-13B MICR font rendering (official banking standard)
 * - Magnetic ink density simulation
 * - Character positioning per ABA standards
 * - Check stock compliance validation
 * - Mobile deposit image quality optimization
 * - Routing number ABA validation with checksum
 * - MICR clear band specifications
 */

// MICR E-13B Character Set (ANSI X9.27 standard)
const MICR_E13B_CHARS = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    'transit': '⑆',   // Transit/ABA symbol (Unicode \u2446 / ASCII 'A')
    'amount': '⑈',    // Amount symbol (Unicode \u2448 / ASCII 'B')
    'onUs': '⑇',      // On-Us symbol (Unicode \u2447 / ASCII 'C')
    'dash': '⑉'       // Dash symbol (Unicode \u2449 / ASCII 'D')
};

// MICR Clear Band Specifications (per ANSI X9.100-160)
const MICR_SPECS = {
    clearBand: {
        fromBottom: 0.25,     // inches from bottom edge
        height: 0.625,        // 5/8 inch clear band
        leftMargin: 0.43,     // minimum left margin
        rightMargin: 0.43     // minimum right margin
    },
    characterSpacing: {
        width: 0.117,         // character width in inches
        height: 0.117,        // character height in inches
        pitch: 8.0            // characters per inch
    },
    fields: {
        routing: { start: 0.43, length: 9 },
        account: { start: 1.75, maxLength: 17 },
        checkNumber: { start: 6.5, maxLength: 10 },
        amount: { start: 7.8, length: 10 }
    },
    inkDensity: {
        minimum: 0.82,        // minimum signal level
        maximum: 1.65,        // maximum signal level
        target: 1.2           // ideal signal level
    }
};

// Federal Reserve Routing Number Ranges
const FED_ROUTING_RANGES: Record<string, string> = {
    '01': 'Boston', '02': 'New York', '03': 'Philadelphia',
    '04': 'Cleveland', '05': 'Richmond', '06': 'Atlanta',
    '07': 'Chicago', '08': 'St. Louis', '09': 'Minneapolis',
    '10': 'Kansas City', '11': 'Dallas', '12': 'San Francisco',
    '21': 'Traveler\'s Checks', '22': 'Thrift', '23': 'Thrift',
    '24': 'Thrift', '25': 'Thrift', '26': 'Electronic',
    '27': 'Electronic', '28': 'Electronic', '29': 'Electronic',
    '30': 'Electronic', '31': 'Electronic', '32': 'Electronic'
};

export interface MICRData {
    routingNumber: string;
    accountNumber: string;
    checkNumber: string;
    amount?: number;
    auxiliaryOnUs?: string;
}

export interface MICRValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    details: {
        routingValid: boolean;
        routingChecksum: boolean;
        fedDistrict?: string;
        accountFormatValid: boolean;
        checkNumberValid: boolean;
    };
}

export interface CheckStockCompliance {
    paperSize: boolean;
    micrClearBand: boolean;
    marginCompliance: boolean;
    perforations: boolean;
    securityFeatures: string[];
    mobileDepositReady: boolean;
}

export class MICRComplianceEngine {

    // ============== ROUTING NUMBER VALIDATION ==============

    /**
     * Validates ABA routing number with checksum verification
     * Uses the formula: 3(d1+d4+d7) + 7(d2+d5+d8) + (d3+d6+d9) mod 10 = 0
     */
    static validateRoutingNumber(routing: string): { valid: boolean; error?: string; district?: string } {
        // Remove any formatting
        const clean = routing.replace(/[^0-9]/g, '');

        if (clean.length !== 9) {
            return { valid: false, error: 'Routing number must be exactly 9 digits' };
        }

        // Check Federal Reserve district
        const prefix = clean.substring(0, 2);
        const district = FED_ROUTING_RANGES[prefix];
        if (!district) {
            return { valid: false, error: `Invalid Federal Reserve district prefix: ${prefix}` };
        }

        // ABA Checksum validation
        const digits = clean.split('').map(Number);
        const checksum =
            3 * (digits[0] + digits[3] + digits[6]) +
            7 * (digits[1] + digits[4] + digits[7]) +
            1 * (digits[2] + digits[5] + digits[8]);

        if (checksum % 10 !== 0) {
            return {
                valid: false,
                error: 'Invalid routing number checksum',
                district
            };
        }

        return { valid: true, district };
    }

    // ============== ACCOUNT NUMBER VALIDATION ==============

    static validateAccountNumber(account: string): { valid: boolean; error?: string } {
        const clean = account.replace(/[^0-9]/g, '');

        if (clean.length < 4) {
            return { valid: false, error: 'Account number too short (minimum 4 digits)' };
        }
        if (clean.length > 17) {
            return { valid: false, error: 'Account number too long (maximum 17 digits)' };
        }

        // Check for all zeros or obvious test patterns
        if (/^0+$/.test(clean)) {
            return { valid: false, error: 'Account number cannot be all zeros' };
        }
        if (/^1234567/.test(clean)) {
            return { valid: false, error: 'Account number appears to be a test pattern' };
        }

        return { valid: true };
    }

    // ============== CHECK NUMBER VALIDATION ==============

    static validateCheckNumber(checkNum: string): { valid: boolean; error?: string } {
        const clean = checkNum.replace(/[^0-9]/g, '');

        if (clean.length < 1) {
            return { valid: false, error: 'Check number is required' };
        }
        if (clean.length > 10) {
            return { valid: false, error: 'Check number too long (maximum 10 digits)' };
        }
        if (parseInt(clean) === 0) {
            return { valid: false, error: 'Check number cannot be zero' };
        }

        return { valid: true };
    }

    // ============== FULL MICR VALIDATION ==============

    static validateMICR(data: MICRData): MICRValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        const routingResult = this.validateRoutingNumber(data.routingNumber);
        const accountResult = this.validateAccountNumber(data.accountNumber);
        const checkResult = this.validateCheckNumber(data.checkNumber);

        if (!routingResult.valid) errors.push(routingResult.error!);
        if (!accountResult.valid) errors.push(accountResult.error!);
        if (!checkResult.valid) errors.push(checkResult.error!);

        // Warnings for potential issues
        if (data.accountNumber.length < 6) {
            warnings.push('Account number is unusually short');
        }
        if (parseInt(data.checkNumber) > 99999) {
            warnings.push('Check number is unusually high');
        }
        if (data.amount && data.amount > 100000) {
            warnings.push('Amount exceeds typical check limits');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            details: {
                routingValid: routingResult.valid,
                routingChecksum: routingResult.valid,
                fedDistrict: routingResult.district,
                accountFormatValid: accountResult.valid,
                checkNumberValid: checkResult.valid
            }
        };
    }

    // ============== MICR LINE GENERATION ==============

    /**
     * Generates properly formatted MICR line per ANSI standards
     */
    static generateMICRLine(data: MICRData, includeAmount: boolean = false): string {
        const transit = MICR_E13B_CHARS.transit;
        const onUs = MICR_E13B_CHARS.onUs;
        const amount = MICR_E13B_CHARS.amount;

        let micr = '';

        // Auxiliary On-Us (optional, leftmost)
        if (data.auxiliaryOnUs) {
            micr += `${onUs}${data.auxiliaryOnUs}${onUs} `;
        }

        // Routing/Transit field
        micr += `${transit}${data.routingNumber}${transit}`;

        // On-Us field (account and check number)
        micr += ` ${onUs}${data.accountNumber}${onUs}`;

        // Check number (some banks include in On-Us, some separate)
        micr += ` ${data.checkNumber}`;

        // Amount field (optional, used for returns)
        if (includeAmount && data.amount !== undefined) {
            const amtStr = Math.round(data.amount * 100).toString().padStart(10, '0');
            micr += ` ${amount}${amtStr}${amount}`;
        }

        return micr;
    }

    /**
     * Generate MICR line with proper E-13B encoding for font rendering
     */
    static generateMICRForRendering(data: MICRData): {
        text: string;
        segments: Array<{ type: string; value: string; position: number }>;
    } {
        const segments: Array<{ type: string; value: string; position: number }> = [];
        let position = 0;

        // Transit symbol
        segments.push({ type: 'transit', value: '⑆', position: position++ });

        // Routing number
        for (const char of data.routingNumber) {
            segments.push({ type: 'digit', value: char, position: position++ });
        }

        // Transit symbol
        segments.push({ type: 'transit', value: '⑆', position: position++ });

        // Space
        segments.push({ type: 'space', value: ' ', position: position++ });

        // On-Us symbol (delimit account)
        segments.push({ type: 'onUs', value: '⑇', position: position++ });

        // Account number
        for (const char of data.accountNumber) {
            segments.push({ type: 'digit', value: char, position: position++ });
        }

        // On-Us symbol
        segments.push({ type: 'onUs', value: '⑇', position: position++ });

        // Space
        segments.push({ type: 'space', value: ' ', position: position++ });

        // Check number
        for (const char of data.checkNumber) {
            segments.push({ type: 'digit', value: char, position: position++ });
        }

        const text = segments.map(s => s.value).join('');
        return { text, segments };
    }

    /**
     * Comprehensive Zero-Decline Bank Acceptance Evaluation
     * Evaluates all Federal Reserve, Check 21, and UCC § 3-114 criteria
     */
    /**
     * Derives the ABA fractional routing form from a 9-digit routing number.
     * Fraction = institution identifier (digits 5-8) / Federal Reserve routing
     * symbol (digits 1-4), leading zeros suppressed as printed on real checks.
     * The legacy city/state prefix (before the dash) is bank-specific and is
     * not derivable from the routing number, so it is not fabricated here.
     */
    static deriveFractionalRouting(routing: string): string {
        const clean = String(routing || '').replace(/\D/g, '');
        if (clean.length !== 9) return '';
        const institution = String(parseInt(clean.slice(4, 8), 10));
        const symbol = String(parseInt(clean.slice(0, 4), 10));
        return `${institution}/${symbol}`;
    }

    static evaluateZeroDeclineCompliance(checkData: {
        routingNumber?: string;
        accountNumber?: string;
        checkNumber?: string;
        amount?: number | string;
        payeeName?: string;
        date?: string;
        amountWords?: string;
        hasSignature?: boolean;
        fractionalRouting?: string;
        micrInBand?: boolean;
    }): {
        score: number;
        is100PercentCompliant: boolean;
        checks: Array<{ id: string; label: string; passed: boolean; message: string }>;
    } {
        const checks: Array<{ id: string; label: string; passed: boolean; message: string }> = [];

        // 1. Routing Number & Mod-10 Checksum
        const routing = String(checkData.routingNumber || '').replace(/\D/g, '');
        const routingRes = this.validateRoutingNumber(routing);
        checks.push({
            id: 'routing',
            label: 'Federal Reserve Routing & Mod-10 Checksum',
            passed: routingRes.valid,
            message: routingRes.valid ? `Valid (${routingRes.district || 'Fed District'})` : (routingRes.error || 'Invalid 9-digit ABA routing')
        });

        // 2. Account Number Format
        const account = String(checkData.accountNumber || '').replace(/\D/g, '');
        const accountRes = this.validateAccountNumber(account);
        checks.push({
            id: 'account',
            label: 'On-Us Account Number Specification',
            passed: accountRes.valid,
            message: accountRes.valid ? `${account.length} digits (standard range 4-17)` : (accountRes.error || 'Invalid account length')
        });

        // 3. Check Number Serial
        const checkNum = String(checkData.checkNumber || '').replace(/\D/g, '');
        const checkNumRes = this.validateCheckNumber(checkNum);
        checks.push({
            id: 'checkNumber',
            label: 'Check Serial Number',
            passed: checkNumRes.valid,
            message: checkNumRes.valid ? `#${checkNum}` : (checkNumRes.error || 'Missing check number')
        });

        // 4. Positive Legal Amount
        const amountNum = typeof checkData.amount === 'number' ? checkData.amount : parseFloat(String(checkData.amount).replace(/[^0-9.]/g, '')) || 0;
        const amountValid = amountNum > 0 && !isNaN(amountNum);
        checks.push({
            id: 'amount',
            label: 'Negotiable Dollar Amount',
            passed: amountValid,
            message: amountValid ? `$${amountNum.toFixed(2)}` : 'Amount must be greater than $0.00'
        });

        // 5. Payee Order
        const payeeValid = Boolean(checkData.payeeName && checkData.payeeName.trim().length >= 2);
        checks.push({
            id: 'payee',
            label: 'Pay to the Order of (Payee)',
            passed: payeeValid,
            message: payeeValid ? checkData.payeeName!.trim() : 'Payee name is required'
        });

        // 6. Check Date (Stale-date check: not >180 days in past, not >30 days post-dated)
        let dateValid = false;
        let dateMsg = 'Date is required';
        if (checkData.date) {
            const checkDate = new Date(checkData.date);
            if (!isNaN(checkDate.getTime())) {
                const now = new Date();
                const diffDays = Math.round((now.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > 180) {
                    dateMsg = 'Date is stale (> 180 days past)';
                } else if (diffDays < -30) {
                    dateMsg = 'Check is post-dated beyond 30 days';
                } else {
                    dateValid = true;
                    dateMsg = `Valid negotiable date (${checkData.date})`;
                }
            }
        }
        checks.push({
            id: 'date',
            label: 'Negotiable Date Validity',
            passed: dateValid,
            message: dateMsg
        });

        // 7. MICR Clear Band placement (measured from the live canvas by the caller)
        checks.push({
            id: 'clearBand',
            label: 'ANSI X9.27 0.625" MICR Clear Band',
            passed: checkData.micrInBand === true,
            message: checkData.micrInBand === true
                ? 'MICR line sits inside the bottom clear band'
                : (checkData.micrInBand === false
                    ? 'MICR line is outside the clear band - it must sit in the bottom strip'
                    : 'MICR placement not verified yet')
        });

        // 8. Fractional routing consistency (the printed fraction must derive from the routing number)
        const derivedFractional = this.deriveFractionalRouting(routing);
        const printedFractional = String(checkData.fractionalRouting || '').trim();
        const normalizeFraction = (s: string) => {
            const core = s.includes('-') ? s.slice(s.lastIndexOf('-') + 1) : s;
            const parts = core.replace(/[^0-9/]/g, '').split('/');
            if (parts.length !== 2) return '';
            return parts.map(p => String(parseInt(p || '0', 10))).join('/');
        };
        const fractionalOk = Boolean(derivedFractional) && normalizeFraction(printedFractional) === normalizeFraction(derivedFractional);
        checks.push({
            id: 'fractional',
            label: 'Fractional Routing Consistency',
            passed: fractionalOk,
            message: !derivedFractional
                ? 'Enter a valid 9-digit routing number to derive the fraction'
                : (fractionalOk
                    ? `Printed ${printedFractional} matches the routing number`
                    : `Printed "${printedFractional || '(blank)'}" does not match routing-derived "${derivedFractional}"`)
        });

        // 9. Signature present (unsigned checks are returned unpaid)
        checks.push({
            id: 'signature',
            label: 'Authorized Signature Present',
            passed: checkData.hasSignature === true,
            message: checkData.hasSignature ? 'Signature is on the signature line' : 'No signature on the check'
        });

        // 10. Legal amount in words (UCC 3-114: words control over figures)
        const words = String(checkData.amountWords || '').trim();
        checks.push({
            id: 'amountWords',
            label: 'Legal Amount in Words',
            passed: amountValid && words.length > 3,
            message: amountValid && words.length > 3 ? words : 'Written (legal) amount is missing'
        });

        const passedCount = checks.filter(c => c.passed).length;
        const score = Math.round((passedCount / checks.length) * 100);

        return {
            score,
            is100PercentCompliant: score === 100,
            checks
        };
    }

    // ============== CHECK STOCK COMPLIANCE ==============

    static validateCheckStock(dimensions: { width: number; height: number }, hasFeatures: string[]): CheckStockCompliance {
        // Standard check size: 6" x 2.75" to 8.75" x 3.75"
        const paperSize =
            dimensions.width >= 6 && dimensions.width <= 8.75 &&
            dimensions.height >= 2.75 && dimensions.height <= 3.75;

        return {
            paperSize,
            micrClearBand: hasFeatures.includes('micr-clear-band'),
            marginCompliance: hasFeatures.includes('proper-margins'),
            perforations: hasFeatures.includes('perforations'),
            securityFeatures: hasFeatures.filter(f =>
                f.includes('security') || f.includes('watermark') ||
                f.includes('void') || f.includes('uv')
            ),
            mobileDepositReady: paperSize && hasFeatures.includes('high-contrast')
        };
    }

    // ============== MOBILE DEPOSIT OPTIMIZATION ==============

    static getMobileDepositRequirements(): {
        imageQuality: { minDPI: number; format: string; contrast: number };
        endorsement: { required: boolean; position: string; text: string };
        restrictions: string[];
    } {
        return {
            imageQuality: {
                minDPI: 200,
                format: 'JPEG or PNG',
                contrast: 0.7 // minimum contrast ratio
            },
            endorsement: {
                required: true,
                position: 'back-top',
                text: 'For Mobile Deposit Only'
            },
            restrictions: [
                'No folded or torn checks',
                'All four corners visible',
                'Routing/account numbers clearly visible',
                'Amount must match numeric and written',
                'Signature required',
                'Date within 180 days'
            ]
        };
    }

    // ============== MICR POSITIONING CALCULATOR ==============

    static calculateMICRPosition(checkWidth: number, checkHeight: number, dpi: number): {
        x: number;
        y: number;
        fontSize: number;
        clearBandTop: number;
        clearBandBottom: number;
    } {
        const scale = dpi / 72;

        return {
            x: MICR_SPECS.clearBand.leftMargin * dpi,
            y: checkHeight - (MICR_SPECS.clearBand.fromBottom * dpi) - (14 * scale),
            fontSize: 14 * scale, // E-13B is approximately 14pt
            clearBandTop: checkHeight - (MICR_SPECS.clearBand.fromBottom + MICR_SPECS.clearBand.height) * dpi,
            clearBandBottom: checkHeight - MICR_SPECS.clearBand.fromBottom * dpi
        };
    }

    // ============== INK DENSITY SIMULATION ==============

    static getInkDensityStyle(): {
        fill: string;
        fontWeight: string;
        letterSpacing: string;
    } {
        return {
            fill: '#1a1a1a', // Rich black for MICR
            fontWeight: 'normal',
            letterSpacing: '0.05em' // Proper E-13B spacing
        };
    }

    // ============== KNOWN ROUTING NUMBERS (Sample) ==============

    static readonly KNOWN_BANKS: Record<string, string> = {
        '021000021': 'JPMorgan Chase',
        '021000089': 'Citibank',
        '026009593': 'Bank of America',
        '011000138': 'Bank of America (East)',
        '121000358': 'Bank of America (West)',
        '071000013': 'JPMorgan Chase (IL)',
        '091000019': 'Wells Fargo',
        '121042882': 'Wells Fargo (CA)',
        '031100209': 'PNC Bank',
        '021200339': 'TD Bank',
        '031101279': 'Capital One',
        '314074269': 'USAA',
        '256074974': 'Navy Federal'
    };

    static lookupBank(routing: string): string | null {
        return this.KNOWN_BANKS[routing] || null;
    }
}
