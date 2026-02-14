// MICRE13B font definition removed as file is missing


export class MICREngine {
    private static readonly ROUTING_SYMBOLS = {
        transit: '⑆',  // Transit symbol
        onus: '⑇',      // On-us symbol
        amount: '⑈',    // Amount symbol
        dash: '⑉',      // Dash symbol
        routingTransit: '⑊' // Routing/Transit Check Digit
    };

    // Generate complete MICR line with exact bank specifications
    static generateFullMICR(
        routingNumber: string,
        accountNumber: string,
        checkNumber: string,
        amount?: number,
        checkType: 'personal' | 'business' | 'cashier' | 'echeck' = 'personal'
    ): {
        line: string;
        positions: number[];
        font: string;
        magneticInkSpec: MagneticInkSpec;
    } {
        // Validate routing number (ABA format)
        this.validateRoutingNumber(routingNumber);

        // Calculate check digits
        const routingCheckDigit = this.calculateCheckDigit(routingNumber);
        const accountCheckDigit = this.calculateCheckDigit(accountNumber);

        // Format based on check type
        let micrLine = '';
        let positions: number[] = [];

        switch (checkType) {
            case 'cashier':
                // Format: [Transit] [Routing] [CheckDigit] [OnUs] [Amount] [CheckNumber]
                micrLine = `${this.ROUTING_SYMBOLS.transit}${routingNumber}${routingCheckDigit}` +
                    `${this.ROUTING_SYMBOLS.onus}${this.ROUTING_SYMBOLS.amount}${amount?.toFixed(2)}` +
                    `${this.ROUTING_SYMBOLS.onus}${checkNumber}`;
                positions = [0, 12, 24, 36, 48];
                break;

            case 'echeck':
                // Format for electronic checks
                micrLine = `${this.ROUTING_SYMBOLS.transit}C${routingNumber}${routingCheckDigit}` +
                    `${this.ROUTING_SYMBOLS.onus}A${accountNumber}${accountCheckDigit}` +
                    `${this.ROUTING_SYMBOLS.onus}${checkNumber}`;
                positions = [0, 15, 30, 45];
                break;

            default:
                // Standard personal/business check format
                micrLine = `${this.ROUTING_SYMBOLS.transit}${routingNumber}${routingCheckDigit}` +
                    `${this.ROUTING_SYMBOLS.onus}${accountNumber}${accountCheckDigit}` +
                    `${this.ROUTING_SYMBOLS.onus}${checkNumber}`;
                positions = [0, 12, 24, 36];
        }

        // Add magnetic ink specifications
        const magneticInkSpec: MagneticInkSpec = {
            inkType: 'magnetic',
            ironOxideContent: 40, // percentage
            particleSize: 0.5, // microns
            remanence: 0.8, // Tesla
            coercivity: 250, // Oersteds
            printHeight: 0.125, // inches
            waveform: this.generateWaveform(micrLine)
        };

        return {
            line: micrLine,
            positions,
            font: 'MICRE13B',
            magneticInkSpec
        };
    }

    // Calculate ABA check digit (Modulus 10)
    static calculateCheckDigit(number: string): number {
        const weights = [3, 7, 1, 3, 7, 1, 3, 7];
        let sum = 0;

        for (let i = 0; i < number.length; i++) {
            const digit = parseInt(number[i]);
            sum += digit * weights[i % weights.length];
        }

        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit;
    }

    // Generate magnetic ink waveform for validation
    static generateWaveform(micrString: string): number[] {
        const waveform: number[] = [];
        const charMap: Record<string, number[]> = {
            '0': [1, 0, 1, 0, 1, 0, 1, 0],
            '1': [1, 0, 1, 0, 1, 0, 1, 1],
            '2': [1, 0, 1, 0, 1, 1, 1, 0],
            '3': [1, 0, 1, 0, 1, 1, 1, 1],
            '4': [1, 0, 1, 1, 1, 0, 1, 0],
            '5': [1, 0, 1, 1, 1, 0, 1, 1],
            '6': [1, 0, 1, 1, 1, 1, 1, 0],
            '7': [1, 0, 1, 1, 1, 1, 1, 1],
            '8': [1, 1, 1, 0, 1, 0, 1, 0],
            '9': [1, 1, 1, 0, 1, 0, 1, 1],
            '⑆': [1, 1, 1, 0, 1, 1, 1, 0], // Transit
            '⑇': [1, 1, 1, 0, 1, 1, 1, 1], // On-us
            '⑈': [1, 1, 1, 1, 1, 0, 1, 0], // Amount
            '⑉': [1, 1, 1, 1, 1, 0, 1, 1], // Dash
        };

        for (const char of micrString) {
            if (charMap[char]) {
                waveform.push(...charMap[char]);
            }
        }

        return waveform;
    }

    // Validate routing number format and checksum
    static validateRoutingNumber(routing: string): boolean {
        if (!/^\d{9}$/.test(routing)) {
            throw new Error('Routing number must be 9 digits');
        }

        const digits = routing.split('').map(Number);
        const sum = (3 * (digits[0] + digits[3] + digits[6])) +
            (7 * (digits[1] + digits[4] + digits[7])) +
            (1 * (digits[2] + digits[5] + digits[8]));

        return sum % 10 === 0;
    }

    // Generate EPC (Expedited Payments Code) for electronic checks
    static generateEPCCode(
        routingNumber: string,
        accountNumber: string,
        transactionType: 'CCD' | 'PPD' | 'WEB' | 'TEL'
    ): string {
        const input = routingNumber + accountNumber + transactionType;
        let h = 0;
        for (let i = 0; i < input.length; i++) {
            h = Math.imul(31, h) + input.charCodeAt(i) | 0;
        }
        const hash = Math.abs(h).toString(16).padEnd(16, '0').toUpperCase();

        return `${transactionType}${hash}`;
    }

}

interface MagneticInkSpec {
    inkType: string;
    ironOxideContent: number;
    particleSize: number;
    remanence: number;
    coercivity: number;
    printHeight: number;
    waveform: number[];
}

// MICR Symbol characters for display
export const MICRSymbol = {
    transit: '⑆',
    onus: '⑇',
    amount: '⑈',
    dash: '⑉'
};

// Convenience function for CheckBuilder
export function generateMICRLine(routing: string, account: string, checkNum: string): string {
    try {
        const result = MICREngine.generateFullMICR(routing, account, checkNum);
        return result.line;
    } catch {
        return `${MICRSymbol.transit}${routing}${MICRSymbol.transit} ${account}${MICRSymbol.onus} ${checkNum}`;
    }
}

// Validate routing number
export function validateRouting(routing: string): boolean {
    try {
        return MICREngine.validateRoutingNumber(routing);
    } catch {
        return false;
    }
}
