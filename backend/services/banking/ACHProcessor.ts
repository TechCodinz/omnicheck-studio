import { NACHAGenerator, ACHEntry } from './NACHAGenerator';
import { ACHGatewayConnector } from './ACHGatewayConnector';
import { IdentityVerificationService } from '../security/IdentityVerificationService';
import { DB } from '../../db/Database';

/**
 * ACHProcessor
 * 
 * High-level orchestration for Direct Deposit (ACH).
 * 1. Checks KYC status (IdentityVerificationService).
 * 2. Generates NACHA .ach file (NACHAGenerator).
 * 3. Transmits to ODFI (ACHGatewayConnector).
 * 4. Logs Results to SQLite (`ach_batches`).
 */
export class ACHProcessor {
    private nachaGenerator: NACHAGenerator;
    private gateway: ACHGatewayConnector;
    private identityService: IdentityVerificationService;

    constructor() {
        // Initialize with your company details
        this.nachaGenerator = new NACHAGenerator(
            '123456789', // Your Tax ID
            '091000019', // ODFI Routing (Real Wells Fargo Routing for demo)
            'OMNICHECK INC'
        );
        this.gateway = new ACHGatewayConnector();
        this.identityService = new IdentityVerificationService();
    }

    /**
     * Process a batch of Direct Deposits
     */
    async processDirectDepositBatch(entries: ACHEntry[], userId: string): Promise<ACHBatchResult> {
        console.log(`[ACH PROCESSOR] Starting Batch for User: ${userId}`);

        // 1. KYC Gate
        if (!(await this.identityService.isUserVerified(userId))) {
            return {
                success: false,
                status: 'REJECTED',
                error: 'IDENTITY_VERIFICATION_REQUIRED',
                message: 'User must be verified (Plaid/Biometric/Micro) before sending ACH.'
            };
        }

        try {
            // 2. Generate NACHA File
            console.log(`[ACH PROCESSOR] Generating NACHA file for ${entries.length} entries...`);
            const achFileContent = this.nachaGenerator.generateFile(entries);
            const fileName = `ACH_BATCH_${Date.now()}.ach`;

            // 3. Transmit to Gateway
            const transmission = await this.gateway.transmitFile(achFileContent, fileName);
            const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

            // 4. Persist Batch Log
            const status = transmission.success ? 'PROCESSED' : 'FAILED';
            await DB.run(`
                INSERT INTO ach_batches (batch_id, status, entry_count, total_amount, transmission_log)
                VALUES (?, ?, ?, ?, ?)
            `, [
                transmission.traceId || `ERR-${Date.now()}`,
                status,
                entries.length,
                totalAmount,
                JSON.stringify(transmission)
            ]);

            if (transmission.success) {
                return {
                    success: true,
                    status: 'PROCESSED',
                    batchId: transmission.traceId,
                    entryCount: entries.length,
                    totalAmount,
                    message: 'Direct Deposit batch successfully transmitted to banking network.'
                };
            } else {
                return {
                    success: false,
                    status: 'FAILED',
                    error: transmission.error || 'Gateway Rejected File'
                };
            }

        } catch (error: any) {
            console.error('[ACH PROCESSOR] Error:', error);
            // Log critical failure
            await DB.run(`
                INSERT INTO ach_batches (batch_id, status, transmission_log)
                VALUES (?, 'CRITICAL_ERROR', ?)
            `, [`ERR-${Date.now()}`, JSON.stringify({ error: error.message })]);

            return {
                success: false,
                status: 'ERROR',
                error: error.message
            };
        }
    }
}

export interface ACHBatchResult {
    success: boolean;
    status: 'PROCESSED' | 'REJECTED' | 'FAILED' | 'ERROR';
    batchId?: string;
    entryCount?: number;
    totalAmount?: number;
    error?: string;
    message?: string;
}
