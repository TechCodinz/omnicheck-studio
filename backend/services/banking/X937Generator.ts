import { Buffer } from 'buffer';

/**
 * X937Generator - Image Cash Letter (ICL) Generator
 * 
 * Constructs an ANSI X9.37-2003 compliant file for electronic check exchange.
 * 
 * File Structure:
 * - 01 File Header
 * - 10 Cash Letter Header
 * - 20 Bundle Header
 * - 25 Check Detail
 * - 50 Image View Detail (Front)
 * - 52 Image View Data (Front)
 * - 50 Image View Detail (Back)
 * - 52 Image View Data (Back)
 * - 70 Bundle Control
 * - 90 Cash Letter Control
 * - 99 File Control
 */

export interface X937CheckItem {
    micr: string;
    amount: number; // in cents
    checkNumber: string;
    routingNumber: string;
    accountNumber: string;
    frontImage: Buffer; // TIFF G4
    backImage: Buffer; // TIFF G4
}

export class X937Generator {
    private buffers: Buffer[] = [];
    private itemCount: number = 0;
    private totalAmount: number = 0;

    constructor(
        private senderRoutingNumber: string,
        private receiverRoutingNumber: string
    ) { }

    /**
     * Generate the full X9.37 file buffer
     */
    generateFile(checks: X937CheckItem[]): Buffer {
        this.buffers = [];
        this.itemCount = 0;
        this.totalAmount = 0;

        // 1. File Header (01)
        this.addRecord01();

        // 2. Cash Letter Header (10)
        this.addRecord10();

        // 3. Bundle Header (20)
        this.addRecord20();

        // 4. Check Items
        for (const check of checks) {
            this.addCheckItem(check);
        }

        // 5. Bundle Control (70)
        this.addRecord70(checks);

        // 6. Cash Letter Control (90)
        this.addRecord90(checks);

        // 7. File Control (99)
        this.addRecord99(checks);

        return Buffer.concat(this.buffers);
    }

    private addRecord01() {
        // Record 01: File Header (80 bytes)
        const record = Buffer.alloc(80, ' ');
        const now = new Date();
        const dateStr = now.toISOString().replace(/[-:T]/g, '').substring(0, 8); // YYYYMMDD
        const timeStr = now.toISOString().replace(/[-:T]/g, '').substring(8, 12); // HHMM

        record.write('01', 0); // Type
        record.write('03', 2); // Standard Level
        record.write('T', 4); // Test File Indicator (T=Test, P=Production)
        record.write(this.pad(this.receiverRoutingNumber, 9, '0'), 5); // Immediate Destination
        record.write(this.pad(this.senderRoutingNumber, 9, '0'), 14); // Immediate Origin
        record.write(dateStr, 23); // File Creation Date
        record.write(timeStr, 31); // File Creation Time
        record.write(' ', 35); // Resend Indicator
        record.write('CHECK_GEN_01', 36); // Immediate Destination Name
        record.write('SENDER_PRO_01', 54); // Immediate Origin Name
        this.buffers.push(record);
    }

    private addRecord10() {
        // Record 10: Cash Letter Header (80 bytes)
        const record = Buffer.alloc(80, ' ');
        const now = new Date();
        const dateStr = now.toISOString().replace(/[-:T]/g, '').substring(0, 8); // YYYYMMDD

        record.write('10', 0);
        record.write('01', 2); // Collection Type (01=Forward Presentment)
        record.write(this.pad(this.receiverRoutingNumber, 9, '0'), 4);
        record.write(this.pad(this.senderRoutingNumber, 9, '0'), 13);
        record.write(dateStr, 22);
        record.write('0001', 30); // Cash Letter ID
        record.write('1', 34); // Record Type Indicator
        this.buffers.push(record);
    }

    private addRecord20() {
        // Record 20: Bundle Header (80 bytes)
        const record = Buffer.alloc(80, ' ');
        record.write('20', 0);
        record.write('01', 2); // Collection Type Indicator
        record.write(this.pad(this.receiverRoutingNumber, 9, '0'), 4);
        record.write(this.pad(this.senderRoutingNumber, 9, '0'), 13);
        record.write('0001', 22); // Bundle ID
        this.buffers.push(record);
    }

    private addCheckItem(check: X937CheckItem) {
        // Record 25: Check Detail
        const record25 = Buffer.alloc(80, ' ');
        record25.write('25', 0);
        record25.write(this.pad(check.routingNumber, 9, '0'), 2);
        record25.write(this.pad(check.accountNumber, 17, ' '), 11);
        record25.write(this.pad(check.amount.toString(), 10, '0'), 28);
        record25.write(this.pad(check.checkNumber, 10, '0'), 38);
        record25.write('1', 48); // External Processing Code
        record25.write(' ', 49); // Doc Type Indicator
        this.buffers.push(record25);

        // Record 50: Image View Detail (Front)
        this.addImageRecords(check.frontImage, 0); // 0=Front

        // Record 50: Image View Detail (Back)
        this.addImageRecords(check.backImage, 1); // 1=Back

        this.itemCount++;
        this.totalAmount += check.amount;
    }

    private addImageRecords(imageDetails: Buffer, side: number) {
        // Record 50: Image View Detail (80 bytes)
        const record50 = Buffer.alloc(80, ' ');
        record50.write('50', 0);
        record50.write('1', 2); // Image Indicator
        record50.write(side.toString(), 3); // 0=Front, 1=Back
        record50.write('00', 4); // View Descriptor
        record50.write('01', 6); // Digital Signature Indicator
        record50.write(this.pad(imageDetails.length.toString(), 7, '0'), 16); // Image Length
        this.buffers.push(record50);

        // Record 52: Image View Data
        // X9.37 Specification: Record 52 has a 32-bit BIG ENDIAN length prefix of the IMAGE DATA only
        const typeBuffer = Buffer.from('52');
        const lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32BE(imageDetails.length + 2, 0); // +2 for the '52' characters if standards vary, traditionally just the data

        this.buffers.push(typeBuffer);
        this.buffers.push(imageDetails);
    }

    private addRecord70(checks: X937CheckItem[]) {
        // Record 70: Bundle Control (80 bytes)
        const record = Buffer.alloc(80, ' ');
        record.write('70', 0);
        record.write(this.pad(checks.length.toString(), 4, '0'), 2);
        record.write(this.pad(this.calculateTotal(checks).toString(), 12, '0'), 6);
        this.buffers.push(record);
    }

    private addRecord90(checks: X937CheckItem[]) {
        // Record 90: Cash Letter Control (80 bytes)
        const record = Buffer.alloc(80, ' ');
        record.write('90', 0);
        record.write(this.pad('1', 6, '0'), 2); // Bundle Count
        record.write(this.pad(checks.length.toString(), 8, '0'), 8);
        record.write(this.pad(this.calculateTotal(checks).toString(), 14, '0'), 16);
        this.buffers.push(record);
    }

    private addRecord99(checks: X937CheckItem[]) {
        // Record 99: File Control (80 bytes)
        const record = Buffer.alloc(80, ' ');
        record.write('99', 0);
        record.write(this.pad('1', 6, '0'), 2); // Cash Letter Count
        record.write(this.pad(checks.length.toString(), 8, '0'), 8);
        record.write(this.pad(this.calculateTotal(checks).toString(), 14, '0'), 16);
        this.buffers.push(record);
    }

    private pad(str: string, length: number, char: string = ' '): string {
        if (str.length >= length) return str.substring(0, length);
        if (char === '0') return str.padStart(length, '0');
        return str.padEnd(length, ' ');
    }

    private calculateTotal(checks: X937CheckItem[]): number {
        return checks.reduce((sum, item) => sum + item.amount, 0);
    }
}
