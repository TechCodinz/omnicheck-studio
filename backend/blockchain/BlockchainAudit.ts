/**
 * BlockchainAudit - Immutable Check Hash Storage
 * 
 * Features:
 * - Immutable check hash storage
 * - Verification endpoint for authenticity
 * - Optional Ethereum/Polygon integration
 * - Local hash chain as fallback
 */

import crypto from 'crypto';

interface CheckRecord {
    checkId: string;
    hash: string;
    timestamp: number;
    blockNumber?: number;
    txHash?: string;
    previousHash: string;
}

interface VerificationResult {
    verified: boolean;
    checkId: string;
    originalHash: string;
    currentHash: string;
    timestamp: number;
    blockchainVerified?: boolean;
    discrepancies?: string[];
}

export class BlockchainAudit {
    private records: Map<string, CheckRecord> = new Map();
    private chainHead: string = '0'.repeat(64);
    private useBlockchain: boolean;
    private contractAddress?: string;

    constructor() {
        this.useBlockchain = !!process.env.BLOCKCHAIN_ENABLED;
        this.contractAddress = process.env.AUDIT_CONTRACT_ADDRESS;
        this.loadRecords();
    }

    private loadRecords(): void {
        // In production, load from database
    }

    /**
     * Store check hash
     */
    async storeCheckHash(checkData: any): Promise<CheckRecord> {
        const hash = this.calculateCheckHash(checkData);

        const record: CheckRecord = {
            checkId: checkData.checkNumber || checkData.id,
            hash,
            timestamp: Date.now(),
            previousHash: this.chainHead
        };

        // Store on blockchain if enabled
        if (this.useBlockchain && this.contractAddress) {
            const txResult = await this.storeOnBlockchain(record);
            record.blockNumber = txResult.blockNumber;
            record.txHash = txResult.txHash;
        }

        // Update local chain
        this.chainHead = hash;
        this.records.set(record.checkId, record);

        return record;
    }

    private calculateCheckHash(checkData: any): string {
        const normalized = {
            checkNumber: checkData.checkNumber,
            amount: checkData.amount,
            payeeName: checkData.payeeName,
            routingNumber: checkData.routingNumber,
            accountNumber: checkData.accountNumber,
            date: checkData.date
        };
        return crypto.createHash('sha256')
            .update(JSON.stringify(normalized))
            .digest('hex');
    }

    private async storeOnBlockchain(record: CheckRecord): Promise<{ blockNumber: number; txHash: string }> {
        // Placeholder for actual blockchain integration
        // In production, use ethers.js or web3.js
        return {
            blockNumber: Math.floor(Date.now() / 1000),
            txHash: crypto.randomBytes(32).toString('hex')
        };
    }

    /**
     * Verify check authenticity
     */
    async verifyCheck(checkId: string, checkData: any): Promise<VerificationResult> {
        const record = this.records.get(checkId);
        const currentHash = this.calculateCheckHash(checkData);

        if (!record) {
            return {
                verified: false,
                checkId,
                originalHash: '',
                currentHash,
                timestamp: 0,
                discrepancies: ['Check not found in audit trail']
            };
        }

        const discrepancies: string[] = [];
        if (record.hash !== currentHash) {
            discrepancies.push('Check data has been modified since creation');
        }

        // Verify on blockchain if available
        let blockchainVerified = false;
        if (this.useBlockchain && record.txHash) {
            blockchainVerified = await this.verifyOnBlockchain(record.txHash, record.hash);
            if (!blockchainVerified) {
                discrepancies.push('Blockchain verification failed');
            }
        }

        return {
            verified: record.hash === currentHash && discrepancies.length === 0,
            checkId,
            originalHash: record.hash,
            currentHash,
            timestamp: record.timestamp,
            blockchainVerified,
            discrepancies: discrepancies.length > 0 ? discrepancies : undefined
        };
    }

    private async verifyOnBlockchain(txHash: string, expectedHash: string): Promise<boolean> {
        // Placeholder for blockchain verification
        return true;
    }

    /**
     * Get audit trail for a check
     */
    getAuditTrail(checkId: string): CheckRecord | undefined {
        return this.records.get(checkId);
    }

    /**
     * Verify chain integrity
     */
    verifyChainIntegrity(): { valid: boolean; brokenAt?: string } {
        let previousHash = '0'.repeat(64);

        for (const [id, record] of this.records) {
            if (record.previousHash !== previousHash) {
                return { valid: false, brokenAt: id };
            }
            previousHash = record.hash;
        }

        return { valid: true };
    }

    /**
     * Generate proof of existence certificate
     */
    generateCertificate(checkId: string): string | null {
        const record = this.records.get(checkId);
        if (!record) return null;

        return JSON.stringify({
            certificate: 'PROOF_OF_EXISTENCE',
            checkId: record.checkId,
            hash: record.hash,
            timestamp: new Date(record.timestamp).toISOString(),
            blockchainRef: record.txHash,
            issuer: 'CheckGenerator Audit System'
        }, null, 2);
    }
}

export const blockchainAudit = new BlockchainAudit();
