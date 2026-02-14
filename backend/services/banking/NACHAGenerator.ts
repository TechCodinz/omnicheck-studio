/**
 * NACHAGenerator
 * 
 * Generates standard NACHA (.ach) files for US Direct Deposit.
 * Supports PPD (Prearranged Payment and Deposit) and CCD (Corporate Credit/Debit).
 * 
 * File Structure:
 * 1. File Header (Type 1)
 * 2. Batch Header (Type 5)
 * 3. Entry Detail (Type 6) [Repeated]
 * 4. Batch Control (Type 8)
 * 5. File Control (Type 9)
 */
export class NACHAGenerator {
    private immediateOrigin: string; // Your Company Tax ID / FEIN
    private immediateDest: string;   // Bank Routing Number (ODFI)
    private companyName: string;

    constructor(origin: string, dest: string, companyName: string) {
        this.immediateOrigin = this.pad(origin, 10, ' ', 'left');
        this.immediateDest = this.pad(dest, 10, ' ', 'left');
        this.companyName = this.pad(companyName.toUpperCase().substring(0, 23), 23, ' ');
    }

    /**
     * Generate a complete NACHA file string from a list of entries
     */
    generateFile(entries: ACHEntry[], effectiveDate: Date = new Date()): string {
        const batchId = 1; // Simplified: Single batch per file
        const serviceClassCode = '200'; // Mixed Debits and Credits
        const standardEntryClass = 'PPD';

        const lines: string[] = [];

        // 1. File Header
        lines.push(this.generateFileHeader());

        // 2. Batch Header
        lines.push(this.generateBatchHeader(batchId, serviceClassCode, standardEntryClass, effectiveDate));

        // 3. Entry Details
        let totalDebit = 0;
        let totalCredit = 0;
        let entryHash = 0;

        entries.forEach((entry, index) => {
            lines.push(this.generateEntryDetail(entry, index + 1));

            if (entry.transactionCode === 27 || entry.transactionCode === 37) {
                totalDebit += entry.amount;
            } else {
                totalCredit += entry.amount;
            }

            // Entry Hash: Sum of first 8 digits of routing numbers
            entryHash += parseInt(entry.receivingDFI.substring(0, 8));
        });

        // 4. Batch Control
        lines.push(this.generateBatchControl(
            batchId,
            entries.length,
            entryHash,
            totalDebit,
            totalCredit,
            serviceClassCode,
            this.immediateOrigin, // Company ID
            this.immediateDest.substring(0, 8) // ODFI ID
        ));

        // 5. File Control
        lines.push(this.generateFileControl(
            1, // Batch count
            Math.ceil(lines.length / 10), // Block count (10 lines per block approx, simplistic)
            entries.length,
            entryHash,
            totalDebit,
            totalCredit
        ));

        // 6. Blocking Factor (Fill with 9s to multiple of 10 lines)
        while (lines.length % 10 !== 0) {
            lines.push('9'.repeat(94));
        }

        return lines.join('\n');
    }

    private generateFileHeader(): string {
        const date = this.formatDate(new Date(), 'YYMMDD');
        const time = this.formatDate(new Date(), 'HHmm');
        return `101 ${this.immediateDest}${this.immediateOrigin}${date}${time}A094101${this.pad('OmniCheck', 23, ' ')}${this.pad('', 8, ' ')}`;
    }

    private generateBatchHeader(batchNum: number, serviceClass: string, sec: string, date: Date): string {
        const effDate = this.formatDate(date, 'YYMMDD');
        return `5${serviceClass}${this.companyName}${this.pad('DISCRETIONARY', 20, ' ')}${this.immediateOrigin}${sec}THE PAYROLL   ${effDate}${effDate}   1${this.pad(this.immediateDest.substring(0, 8), 8, ' ')}${this.pad(batchNum.toString(), 7, '0')}`;
    }

    private generateEntryDetail(entry: ACHEntry, traceSeq: number): string {
        // 6 + TC (2) + Routing (8) + CheckDigit (1) + Account (17) + Amount (10) + ID (15) + Name (22) + Discretionary (2) + Addenda (1) + Trace (15)
        return `6${entry.transactionCode}${entry.receivingDFI}${this.pad(entry.accountNumber, 17, ' ', 'right')}${this.pad(Math.round(entry.amount * 100).toString(), 10, '0')}${this.pad(entry.id, 15, ' ')}${this.pad(entry.name, 22, ' ')}  0${this.immediateDest.substring(0, 8)}${this.pad(traceSeq.toString(), 7, '0')}`;
    }

    private generateBatchControl(batchNum: number, count: number, hash: number, debit: number, credit: number, serviceClass: string, companyId: string, odfiId: string): string {
        return `8${serviceClass}${this.pad(count.toString(), 6, '0')}${this.pad(hash.toString().substring(hash.toString().length - 10), 10, '0')}${this.pad(Math.round(debit * 100).toString(), 12, '0')}${this.pad(Math.round(credit * 100).toString(), 12, '0')}${companyId}${this.pad('', 19, ' ')}${this.pad('', 6, ' ')}${odfiId}${this.pad(batchNum.toString(), 7, '0')}`;
    }

    private generateFileControl(batchCount: number, blockCount: number, entryCount: number, hash: number, debit: number, credit: number): string {
        return `9${this.pad(batchCount.toString(), 6, '0')}${this.pad(blockCount.toString(), 6, '0')}${this.pad(entryCount.toString(), 8, '0')}${this.pad(hash.toString().substring(hash.toString().length - 10), 10, '0')}${this.pad(Math.round(debit * 100).toString(), 12, '0')}${this.pad(Math.round(credit * 100).toString(), 12, '0')}${this.pad('', 39, ' ')}`;
    }

    private pad(str: string, length: number, char: string, direction: 'left' | 'right' = 'right'): string {
        if (direction === 'left') {
            return str.padStart(length, char).substring(0, length); // Truncate if too long
        }
        return str.padEnd(length, char).substring(0, length);
    }

    private formatDate(date: Date, format: 'YYMMDD' | 'HHmm'): string {
        if (format === 'YYMMDD') {
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}${month}${day}`;
        } else {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}${minutes}`;
        }
    }
}

export interface ACHEntry {
    transactionCode: 22 | 27 | 32 | 37; // 22=Credit Checking, 27=Debit Checking
    receivingDFI: string; // Routing Number
    accountNumber: string;
    amount: number; // Dollars
    id: string; // Individual ID
    name: string; // Individual Name
}
