/**
 * CheckRegisterEngine - Check Tracking & Audit Trail v1.0
 * 
 * Features:
 * - Check number sequence management
 * - Issued check register
 * - Gap detection in check numbers
 * - Outstanding check tracking
 * - Audit trail logging
 * - Export to CSV/QuickBooks format
 * - Void check tracking
 */

export interface CheckEntry {
    id: string;
    checkNumber: string;
    date: string;
    payeeName: string;
    amount: number;
    memo?: string;
    status: 'issued' | 'cleared' | 'voided' | 'outstanding' | 'stale';
    clearedDate?: string;
    voidedDate?: string;
    voidReason?: string;
    templateId: string;
    routingNumber: string;
    accountNumber: string;
    generatedAt: Date;
    printedAt?: Date;
    metadata?: Record<string, any>;
}

export interface CheckSequence {
    accountId: string;
    startNumber: number;
    currentNumber: number;
    usedNumbers: number[];
    gaps: number[];
}

export interface AuditEntry {
    id: string;
    timestamp: Date;
    action: 'create' | 'print' | 'void' | 'clear' | 'export' | 'delete';
    checkNumber: string;
    userId?: string;
    details: string;
    ipAddress?: string;
}

export interface RegisterStats {
    totalIssued: number;
    totalAmount: number;
    outstanding: number;
    outstandingAmount: number;
    cleared: number;
    voided: number;
    averageAmount: number;
    oldestOutstanding?: CheckEntry;
}

const STORAGE_KEY = 'check_register_data';
const AUDIT_KEY = 'check_audit_log';

export class CheckRegisterEngine {
    private entries: Map<string, CheckEntry> = new Map();
    private sequences: Map<string, CheckSequence> = new Map();
    private auditLog: AuditEntry[] = [];

    constructor() {
        this.loadFromStorage();
    }

    // ============== STORAGE ==============

    private loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                parsed.entries?.forEach((e: CheckEntry) => this.entries.set(e.id, e));
                parsed.sequences?.forEach((s: CheckSequence) => this.sequences.set(s.accountId, s));
            }
            const auditData = localStorage.getItem(AUDIT_KEY);
            if (auditData) {
                this.auditLog = JSON.parse(auditData);
            }
        } catch (e) {
            console.warn('Failed to load check register');
        }
    }

    private saveToStorage() {
        try {
            const data = {
                entries: Array.from(this.entries.values()),
                sequences: Array.from(this.sequences.values())
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            localStorage.setItem(AUDIT_KEY, JSON.stringify(this.auditLog.slice(-1000))); // Keep last 1000
        } catch (e) {
            console.warn('Failed to save check register');
        }
    }

    // ============== CHECK NUMBER MANAGEMENT ==============

    getNextCheckNumber(accountId: string, startAt: number = 1001): string {
        let sequence = this.sequences.get(accountId);

        if (!sequence) {
            sequence = {
                accountId,
                startNumber: startAt,
                currentNumber: startAt,
                usedNumbers: [],
                gaps: []
            };
            this.sequences.set(accountId, sequence);
        }

        // Check for gaps first (use lowest gap)
        if (sequence.gaps.length > 0) {
            const gapNumber = Math.min(...sequence.gaps);
            sequence.gaps = sequence.gaps.filter(g => g !== gapNumber);
            this.saveToStorage();
            return gapNumber.toString().padStart(4, '0');
        }

        const nextNum = sequence.currentNumber;
        sequence.currentNumber += 1;
        sequence.usedNumbers.push(nextNum);
        this.saveToStorage();

        return nextNum.toString().padStart(4, '0');
    }

    reserveCheckNumber(accountId: string, checkNumber: number): boolean {
        const sequence = this.sequences.get(accountId);
        if (!sequence) return false;

        if (sequence.usedNumbers.includes(checkNumber)) {
            return false; // Already used
        }

        sequence.usedNumbers.push(checkNumber);

        // Detect gaps
        const sorted = [...sequence.usedNumbers].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length - 1; i++) {
            for (let gap = sorted[i] + 1; gap < sorted[i + 1]; gap++) {
                if (!sequence.gaps.includes(gap)) {
                    sequence.gaps.push(gap);
                }
            }
        }

        this.saveToStorage();
        return true;
    }

    // ============== CHECK ENTRIES ==============

    addEntry(entry: Omit<CheckEntry, 'id' | 'generatedAt'>): CheckEntry {
        const fullEntry: CheckEntry = {
            ...entry,
            id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            generatedAt: new Date(),
            status: 'issued'
        };

        this.entries.set(fullEntry.id, fullEntry);
        this.logAudit('create', fullEntry.checkNumber, `Created check for ${fullEntry.payeeName}, $${fullEntry.amount}`);
        this.saveToStorage();

        return fullEntry;
    }

    getEntry(id: string): CheckEntry | undefined {
        return this.entries.get(id);
    }

    getByCheckNumber(checkNumber: string): CheckEntry | undefined {
        return Array.from(this.entries.values()).find(e => e.checkNumber === checkNumber);
    }

    updateStatus(id: string, status: CheckEntry['status'], details?: { clearedDate?: string; voidedDate?: string; voidReason?: string }): boolean {
        const entry = this.entries.get(id);
        if (!entry) return false;

        entry.status = status;
        if (details?.clearedDate) entry.clearedDate = details.clearedDate;
        if (details?.voidedDate) entry.voidedDate = details.voidedDate;
        if (details?.voidReason) entry.voidReason = details.voidReason;

        this.logAudit(status === 'voided' ? 'void' : 'clear', entry.checkNumber, `Status: ${status}`);
        this.saveToStorage();
        return true;
    }

    voidCheck(id: string, reason: string): boolean {
        return this.updateStatus(id, 'voided', {
            voidedDate: new Date().toISOString(),
            voidReason: reason
        });
    }

    clearCheck(id: string, clearedDate: string): boolean {
        return this.updateStatus(id, 'cleared', { clearedDate });
    }

    // ============== QUERIES ==============

    getAllEntries(): CheckEntry[] {
        return Array.from(this.entries.values()).sort((a, b) =>
            new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
        );
    }

    getOutstandingChecks(): CheckEntry[] {
        const staleDate = new Date();
        staleDate.setDate(staleDate.getDate() - 180); // 180 days = stale

        return this.getAllEntries().filter(e => {
            if (e.status === 'issued' || e.status === 'outstanding') {
                const issueDate = new Date(e.date);
                if (issueDate < staleDate) {
                    e.status = 'stale';
                }
                return true;
            }
            return false;
        });
    }

    getStats(): RegisterStats {
        const entries = this.getAllEntries();
        const outstanding = entries.filter(e => e.status === 'outstanding' || e.status === 'issued');

        return {
            totalIssued: entries.length,
            totalAmount: entries.reduce((sum, e) => sum + e.amount, 0),
            outstanding: outstanding.length,
            outstandingAmount: outstanding.reduce((sum, e) => sum + e.amount, 0),
            cleared: entries.filter(e => e.status === 'cleared').length,
            voided: entries.filter(e => e.status === 'voided').length,
            averageAmount: entries.length > 0 ? entries.reduce((sum, e) => sum + e.amount, 0) / entries.length : 0,
            oldestOutstanding: outstanding.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
        };
    }

    // ============== AUDIT LOG ==============

    private logAudit(action: AuditEntry['action'], checkNumber: string, details: string) {
        this.auditLog.push({
            id: `audit_${Date.now()}`,
            timestamp: new Date(),
            action,
            checkNumber,
            details
        });
    }

    getAuditLog(checkNumber?: string): AuditEntry[] {
        if (checkNumber) {
            return this.auditLog.filter(a => a.checkNumber === checkNumber);
        }
        return [...this.auditLog].reverse();
    }

    // ============== EXPORT ==============

    exportToCSV(): string {
        const headers = ['Check Number', 'Date', 'Payee', 'Amount', 'Memo', 'Status', 'Cleared Date'];
        const rows = this.getAllEntries().map(e => [
            e.checkNumber,
            e.date,
            `"${e.payeeName}"`,
            e.amount.toFixed(2),
            `"${e.memo || ''}"`,
            e.status,
            e.clearedDate || ''
        ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    exportToQuickBooks(): string {
        // QBO/IIF format for QuickBooks import
        const lines = ['!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO'];
        lines.push('!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO');
        lines.push('!ENDTRNS');

        this.getAllEntries().filter(e => e.status !== 'voided').forEach(e => {
            lines.push(`TRNS\tCHECK\t${e.date}\tChecking\t${e.payeeName}\t-${e.amount}\t${e.checkNumber}\t${e.memo || ''}`);
            lines.push(`SPL\tCHECK\t${e.date}\tExpenses\t${e.payeeName}\t${e.amount}\t${e.checkNumber}\t${e.memo || ''}`);
            lines.push('ENDTRNS');
        });

        return lines.join('\n');
    }

    // ============== GAP DETECTION ==============

    detectGaps(accountId: string): number[] {
        const sequence = this.sequences.get(accountId);
        if (!sequence) return [];

        const gaps: number[] = [];
        const sorted = [...sequence.usedNumbers].sort((a, b) => a - b);

        for (let i = 0; i < sorted.length - 1; i++) {
            for (let num = sorted[i] + 1; num < sorted[i + 1]; num++) {
                gaps.push(num);
            }
        }

        return gaps;
    }

    // ============== SEARCH ==============

    search(query: string): CheckEntry[] {
        const q = query.toLowerCase();
        return this.getAllEntries().filter(e =>
            e.payeeName.toLowerCase().includes(q) ||
            e.checkNumber.includes(q) ||
            e.memo?.toLowerCase().includes(q) ||
            e.amount.toString().includes(q)
        );
    }

    // ============== DATE RANGE FILTER ==============

    getByDateRange(startDate: string, endDate: string): CheckEntry[] {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return this.getAllEntries().filter(e => {
            const date = new Date(e.date);
            return date >= start && date <= end;
        });
    }

    // ============== CLEAR ALL ==============

    clearAll() {
        this.entries.clear();
        this.sequences.clear();
        this.auditLog = [];
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(AUDIT_KEY);
    }
}
