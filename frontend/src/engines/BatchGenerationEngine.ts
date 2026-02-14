/**
 * BatchGenerationEngine - Multi-Check Batch Processing v1.0
 * 
 * Features:
 * - Generate multiple checks from CSV/JSON data
 * - Parallel processing with progress tracking
 * - PDF merge for single batch output
 * - Individual check exports
 * - Validation and error reporting
 * - Queue management
 */

import jsPDF from 'jspdf';

export interface CheckData {
    payeeName: string;
    amount: number;
    date: string;
    checkNumber: string;
    memo?: string;
    routingNumber: string;
    accountNumber: string;
}

export interface BatchConfig {
    templateId: string;
    outputFormat: 'individual-pdf' | 'merged-pdf' | 'png-zip';
    dpi: number;
    includeSecurityFeatures: boolean;
    customLogo?: string;
}

export interface BatchProgress {
    total: number;
    completed: number;
    failed: number;
    currentCheck?: string;
    status: 'idle' | 'processing' | 'complete' | 'error';
    errors: Array<{ checkNumber: string; error: string }>;
}

export interface BatchResult {
    success: boolean;
    outputFiles: string[];
    mergedPdf?: Blob;
    errors: Array<{ checkNumber: string; error: string }>;
    processingTime: number;
}

export class BatchGenerationEngine {
    private progress: BatchProgress = {
        total: 0,
        completed: 0,
        failed: 0,
        status: 'idle',
        errors: []
    };

    private onProgressUpdate?: (progress: BatchProgress) => void;

    constructor(onProgress?: (progress: BatchProgress) => void) {
        this.onProgressUpdate = onProgress;
    }

    // Parse CSV data
    static parseCSV(csvContent: string): CheckData[] {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const checks: CheckData[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const check: any = {};

            headers.forEach((header, idx) => {
                const value = values[idx] || '';
                switch (header) {
                    case 'payee':
                    case 'payeename':
                    case 'pay_to':
                        check.payeeName = value;
                        break;
                    case 'amount':
                        check.amount = parseFloat(value) || 0;
                        break;
                    case 'date':
                        check.date = value || new Date().toISOString().split('T')[0];
                        break;
                    case 'checknumber':
                    case 'check_number':
                    case 'check_no':
                        check.checkNumber = value;
                        break;
                    case 'memo':
                    case 'description':
                        check.memo = value;
                        break;
                    case 'routing':
                    case 'routingnumber':
                    case 'routing_number':
                        check.routingNumber = value;
                        break;
                    case 'account':
                    case 'accountnumber':
                    case 'account_number':
                        check.accountNumber = value;
                        break;
                }
            });

            if (check.payeeName && check.amount > 0 && check.checkNumber) {
                checks.push(check as CheckData);
            }
        }

        return checks;
    }

    // Parse JSON data
    static parseJSON(jsonContent: string): CheckData[] {
        try {
            const data = JSON.parse(jsonContent);
            if (Array.isArray(data)) {
                return data.filter(c => c.payeeName && c.amount > 0);
            }
            return [];
        } catch {
            return [];
        }
    }

    // Validate check data
    static validateCheck(check: CheckData): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!check.payeeName || check.payeeName.length < 2) {
            errors.push('Payee name is required');
        }
        if (!check.amount || check.amount <= 0) {
            errors.push('Amount must be greater than 0');
        }
        if (!check.checkNumber) {
            errors.push('Check number is required');
        }
        if (!check.routingNumber || check.routingNumber.length !== 9) {
            errors.push('Routing number must be 9 digits');
        }
        if (!check.accountNumber || check.accountNumber.length < 5) {
            errors.push('Valid account number required');
        }

        return { valid: errors.length === 0, errors };
    }

    // Validate entire batch
    validateBatch(checks: CheckData[]): { valid: boolean; invalidChecks: Array<{ idx: number; errors: string[] }> } {
        const invalidChecks: Array<{ idx: number; errors: string[] }> = [];

        checks.forEach((check, idx) => {
            const validation = BatchGenerationEngine.validateCheck(check);
            if (!validation.valid) {
                invalidChecks.push({ idx, errors: validation.errors });
            }
        });

        return { valid: invalidChecks.length === 0, invalidChecks };
    }

    // Update progress
    private updateProgress(update: Partial<BatchProgress>) {
        this.progress = { ...this.progress, ...update };
        this.onProgressUpdate?.(this.progress);
    }

    // Generate batch - returns image data URLs for further processing
    async generateBatch(
        checks: CheckData[],
        config: BatchConfig,
        renderFunction: (check: CheckData, templateId: string) => Promise<string>
    ): Promise<BatchResult> {
        const startTime = Date.now();
        const outputFiles: string[] = [];

        this.updateProgress({
            total: checks.length,
            completed: 0,
            failed: 0,
            status: 'processing',
            errors: []
        });

        for (let i = 0; i < checks.length; i++) {
            const check = checks[i];
            this.updateProgress({ currentCheck: check.checkNumber });

            try {
                const imageData = await renderFunction(check, config.templateId);
                outputFiles.push(imageData);
                this.updateProgress({ completed: this.progress.completed + 1 });
            } catch (error: any) {
                this.progress.errors.push({
                    checkNumber: check.checkNumber,
                    error: error.message || 'Unknown error'
                });
                this.updateProgress({ failed: this.progress.failed + 1 });
            }
        }

        // Merge PDFs if requested
        let mergedPdf: Blob | undefined;
        if (config.outputFormat === 'merged-pdf' && outputFiles.length > 0) {
            mergedPdf = await this.mergeToPDF(outputFiles, config.dpi);
        }

        this.updateProgress({ status: 'complete' });

        return {
            success: this.progress.failed === 0,
            outputFiles,
            mergedPdf,
            errors: this.progress.errors,
            processingTime: Date.now() - startTime
        };
    }

    // Merge images to PDF
    private async mergeToPDF(imageDataUrls: string[], dpi: number): Promise<Blob> {
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'in',
            format: [3.5, 8.5]
        });

        for (let i = 0; i < imageDataUrls.length; i++) {
            if (i > 0) pdf.addPage();
            pdf.addImage(imageDataUrls[i], 'PNG', 0, 0, 8.5, 3.5);
        }

        return pdf.output('blob');
    }

    // Get progress
    getProgress(): BatchProgress {
        return { ...this.progress };
    }

    // Reset
    reset() {
        this.progress = {
            total: 0,
            completed: 0,
            failed: 0,
            status: 'idle',
            errors: []
        };
    }

    // Generate sample CSV template
    static getSampleCSV(): string {
        return `payeeName,amount,date,checkNumber,memo,routingNumber,accountNumber
John Smith,1500.00,2026-02-01,1001,Consulting Services,021000021,123456789
Jane Doe,2750.50,2026-02-01,1002,Product Payment,021000021,123456789
Acme Corp,5000.00,2026-02-02,1003,Invoice #12345,021000021,123456789`;
    }

    // Generate sample JSON template
    static getSampleJSON(): string {
        return JSON.stringify([
            {
                payeeName: "John Smith",
                amount: 1500.00,
                date: "2026-02-01",
                checkNumber: "1001",
                memo: "Consulting Services",
                routingNumber: "021000021",
                accountNumber: "123456789"
            }
        ], null, 2);
    }
}
