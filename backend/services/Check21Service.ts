import { ImageQualityService } from './image/ImageQualityService';
import { X937Generator, X937CheckItem } from './banking/X937Generator';
import { RiskSentinel, RiskScore } from './security/RiskSentinel';
import { RDCGatewayConnector } from './banking/RDCGatewayConnector';
import { IdentityVerificationService } from './security/IdentityVerificationService';
import fs from 'fs';
import path from 'path';

/**
 * Check21Service
 * 
 * Orchestrates the "Check 21" Remote Deposit Capture (RDC) workflow.
 * 1. Validates Identity (KYC Gate)
 * 2. Validates Image Quality (IQA)
 * 3. Evaluates Deposit Risk (AI Sentinel)
 * 4. Generates X9.37 ICL File
 * 5. Transmits to Banking Gateway
 */
export class Check21Service {
    private iqaService: ImageQualityService;
    private x937Generator: X937Generator;
    private riskSentinel: RiskSentinel;
    private gatewayConnector: RDCGatewayConnector;
    private identityService: IdentityVerificationService;

    constructor() {
        this.iqaService = new ImageQualityService();
        this.riskSentinel = new RiskSentinel();
        this.gatewayConnector = new RDCGatewayConnector();
        this.identityService = new IdentityVerificationService();
        // Initialize with generic routing numbers for now
        this.x937Generator = new X937Generator('123456780', '087654321');
    }

    /**
     * Process a Mobile Deposit
     */
    async processDeposit(depositData: any, frontImageBuffer: Buffer, backImageBuffer: Buffer, userId: string = 'ANONYMOUS'): Promise<DepositResult> {
        console.log(`--- Processing Check 21 Deposit (User: ${userId}) ---`);

        // 1. Identity Verification Gate (KYC)
        if (!(await this.identityService.isUserVerified(userId))) {
            return {
                success: false,
                reason: 'IDENTITY_VERIFICATION_REQUIRED',
                message: 'Please complete Identity Verification (Plaid, Biometric, or Micro-deposit) before depositing checks.'
            };
        }

        // 2. Image Quality Assurance (IQA)
        console.log('Running IQA analysis...');
        const frontAnalysis = await this.iqaService.analyzeImageQuality(frontImageBuffer);
        const backAnalysis = await this.iqaService.analyzeImageQuality(backImageBuffer);

        if (!frontAnalysis.isValid || !backAnalysis.isValid) {
            return {
                success: false,
                reason: 'IMAGE_QUALITY_FAILURE',
                details: { front: frontAnalysis.defects, back: backAnalysis.defects }
            };
        }

        // 2. Risk Evaluation (AI Sentinel)
        console.log('Evaluating deposit risk...');
        // In a real app, 'userHistory' would be fetched from the database
        const riskReport = await this.riskSentinel.evaluateRisk(depositData, []);

        if (riskReport.action === 'REJECT') {
            return {
                success: false,
                reason: 'FRAUD_RISK_REJECTION',
                details: riskReport.findings
            };
        }

        // 3. Convert Images to TIFF G4 (Compliance)
        const frontTiff = await this.iqaService.convertToTiffG4(frontImageBuffer);
        const backTiff = await this.iqaService.convertToTiffG4(backImageBuffer);

        // 3. Generate X9.37 Image Cash Letter
        console.log('Generating X9.37 ICL file...');
        const checkItem: X937CheckItem = {
            micr: depositData.micr,
            amount: Math.round(depositData.amount * 100), // cents
            checkNumber: depositData.checkNumber,
            routingNumber: depositData.routingNumber,
            accountNumber: depositData.accountNumber,
            frontImage: frontTiff,
            backImage: backTiff
        };

        const iclFileBuffer = this.x937Generator.generateFile([checkItem]);

        // 4. Secure Transmission
        const fileName = `ICL_${Date.now()}.x937`;
        console.log(`Sending ICL to banking network: ${fileName}`);

        const transmissionResult = await this.gatewayConnector.transmitICL(iclFileBuffer, fileName);

        if (!transmissionResult.success) {
            return {
                success: false,
                reason: 'GATEWAY_TRANSMISSION_FAILURE',
                details: transmissionResult.error
            };
        }

        // 5. Audit Logging
        await this.saveAuditRecord(transmissionResult.traceId || `LOCAL-${Date.now()}`, iclFileBuffer);

        return {
            success: true,
            traceId: transmissionResult.traceId,
            clearingDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // T+1
            message: 'Deposit accepted and transmitted to banking network via Check 21.'
        };
    }

    private async saveAuditRecord(traceId: string, fileBuffer: Buffer) {
        const auditDir = path.join(__dirname, '../../audit/icl_transmissions');
        if (!fs.existsSync(auditDir)) {
            fs.mkdirSync(auditDir, { recursive: true });
        }
        const filePath = path.join(auditDir, `${traceId}.x937`);
        fs.writeFileSync(filePath, fileBuffer);
        console.log(`[AUDIT] X9.37 file saved to ${filePath}`);
    }
}

export interface DepositResult {
    success: boolean;
    traceId?: string;
    reason?: string;
    details?: any;
    clearingDate?: string;
    message?: string;
}
