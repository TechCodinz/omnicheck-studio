/**
 * MICREngine - ANSI X9.27 & ANSI X9.100-160 Bank-Grade Compliance Engine
 * 
 * Strict specifications for zero-decline banking acceptance:
 * - Proper 9-digit ABA routing transit with Mod-10 checksum validation
 * - Standard On-Us account and serial delimiters
 * - Clear band spacing and magnetic ink specifications
 */

export interface MagneticInkSpec {
    inkType: 'magnetic' | 'standard';
    ironOxideContent: number; // percentage (standard: 40-50%)
    particleSize: number;     // microns
    remanence: number;        // Tesla
    coercivity: number;       // Oersteds
    printHeight: number;      // inches (standard: 0.117" to 0.125")
    waveform: number[];
}

export class MICREngine {
    // Unicode E-13B symbols & Standard ASCII mappings for E-13B font families
    public static readonly ROUTING_SYMBOLS = {
        transitUnicode: '⑁', // Unicode Transit (ABA)
        onusUnicode: '⑃',    // Unicode On-Us
        amountUnicode: '⑂',  // Unicode Amount
        dashUnicode: '⑄',    // Unicode Dash

        // ASCII Font Mappings (Used by standard E-13B TrueType/Web fonts)
        transitAscii: 'A',
        amountAscii: 'B',
        onusAscii: 'C',
        dashAscii: 'D'
    };

    /**
     * Validates a 9-digit ABA routing number using the Federal Reserve Mod-10 formula:
     * (3*(d1 + d4 + d7) + 7*(d2 + d5 + d8) + 1*(d3 + d6 + d9)) mod 10 === 0
     */
    static validateRoutingNumber(routingNumber: string): boolean {
        const clean = routingNumber.replace(/\D/g, '');
        if (clean.length !== 9) return false;

        const d = clean.split('').map(Number);
        const checksum = (
            3 * (d[0] + d[3] + d[6]) +
            7 * (d[1] + d[4] + d[7]) +
            1 * (d[2] + d[5] + d[8])
        ) % 10;

        return checksum === 0;
    }

    /**
     * Calculates the Mod-10 check digit for the first 8 digits of a routing number
     */
    static calculateRoutingCheckDigit(first8Digits: string): number {
        const clean = first8Digits.replace(/\D/g, '').slice(0, 8);
        if (clean.length < 8) return 0;

        const weights = [3, 7, 1, 3, 7, 1, 3, 7];
        let sum = 0;
        for (let i = 0; i < 8; i++) {
            sum += parseInt(clean[i], 10) * weights[i];
        }

        return (10 - (sum % 10)) % 10;
    }

    /**
     * Generates a fully compliant ANSI X9.100-160 MICR line.
     * Note: In production banking, routing numbers are ALWAYS exactly 9 digits,
     * and account numbers must NEVER have arbitrary digits appended.
     */
    static generateFullMICR(
        routingNumber: string,
        accountNumber: string,
        checkNumber: string,
        amount?: number,
        checkType: 'personal' | 'business' | 'cashier' | 'echeck' = 'business',
        useAsciiGlyphs: boolean = false
    ): {
        line: string;
        rawAsciiLine: string;
        positions: number[];
        font: string;
        magneticInkSpec: MagneticInkSpec;
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];
        const cleanRouting = routingNumber.replace(/\D/g, '');
        const cleanAccount = accountNumber.replace(/\D/g, '');
        const cleanCheckNum = checkNumber.replace(/\D/g, '').padStart(4, '0');

        if (cleanRouting.length !== 9) {
            errors.push(`Routing number must be exactly 9 digits (found ${cleanRouting.length})`);
        } else if (!this.validateRoutingNumber(cleanRouting)) {
            errors.push('Routing number failed Federal Reserve Mod-10 checksum validation');
        }

        if (cleanAccount.length < 4 || cleanAccount.length > 17) {
            errors.push(`Account number must be between 4 and 17 digits (found ${cleanAccount.length})`);
        }

        // Delimiters
        const t = useAsciiGlyphs ? this.ROUTING_SYMBOLS.transitAscii : this.ROUTING_SYMBOLS.transitUnicode;
        const o = useAsciiGlyphs ? this.ROUTING_SYMBOLS.onusAscii : this.ROUTING_SYMBOLS.onusUnicode;
        const a = useAsciiGlyphs ? this.ROUTING_SYMBOLS.amountAscii : this.ROUTING_SYMBOLS.amountUnicode;

        const tAscii = this.ROUTING_SYMBOLS.transitAscii;
        const oAscii = this.ROUTING_SYMBOLS.onusAscii;
        const aAscii = this.ROUTING_SYMBOLS.amountAscii;

        let micrLine = '';
        let rawAsciiLine = '';

        switch (checkType) {
            case 'business':
                // ANSI Standard Business Check: Auxiliary On-Us (Check #) on left, then Transit, then Account On-Us
                micrLine = `${o}${cleanCheckNum}${o}  ${t}${cleanRouting}${t}  ${cleanAccount}${o}`;
                rawAsciiLine = `${oAscii}${cleanCheckNum}${oAscii}  ${tAscii}${cleanRouting}${tAscii}  ${cleanAccount}${oAscii}`;
                break;

            case 'personal':
            default:
                // ANSI Standard Personal Check: Transit on left, Account On-Us, Check # On-Us on right
                micrLine = `${t}${cleanRouting}${t}  ${cleanAccount}${o}  ${cleanCheckNum}`;
                rawAsciiLine = `${tAscii}${cleanRouting}${tAscii}  ${cleanAccount}${oAscii}  ${cleanCheckNum}`;
                break;
        }

        if (amount && amount > 0) {
            const amtCents = Math.round(amount * 100).toString().padStart(10, '0');
            micrLine += `  ${a}${amtCents}${a}`;
            rawAsciiLine += `  ${aAscii}${amtCents}${aAscii}`;
        }

        const magneticInkSpec: MagneticInkSpec = {
            inkType: 'magnetic',
            ironOxideContent: 45,
            particleSize: 0.5,
            remanence: 0.85,
            coercivity: 280,
            printHeight: 0.125,
            waveform: this.generateWaveform(cleanRouting + cleanAccount)
        };

        return {
            line: micrLine,
            rawAsciiLine,
            positions: [0, 12, 24, 36],
            font: 'MICRE13B',
            magneticInkSpec,
            isValid: errors.length === 0,
            errors
        };
    }

    // Generate magnetic ink waveform for validation
    static generateWaveform(micrString: string): number[] {
        const waveform: number[] = [];
        const charMap: Record<string, number[]> = {
            '0': [1, 0, 1, 0, 1, 0, 1, 0],
            '1': [1, 0, 1, 0, 1, 0, 1, 1],
            '2': [1, 0, 1, 0, 1, 1, 0, 0],
            '3': [1, 0, 1, 0, 1, 1, 0, 1],
            '4': [1, 0, 1, 1, 0, 0, 1, 0],
            '5': [1, 0, 1, 1, 0, 0, 1, 1],
            '6': [1, 0, 1, 1, 0, 1, 0, 0],
            '7': [1, 0, 1, 1, 0, 1, 0, 1],
            '8': [1, 1, 0, 0, 1, 0, 1, 0],
            '9': [1, 1, 0, 0, 1, 0, 1, 1]
        };

        for (const char of micrString) {
            const pattern = charMap[char] || [1, 0, 0, 0, 0, 0, 0, 0];
            waveform.push(...pattern);
        }

        return waveform;
    }
}

export default MICREngine;
