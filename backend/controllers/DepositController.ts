import { Request, Response } from 'express';
import { Check21Service } from '../services/Check21Service';

/**
 * DepositController
 * 
 * Handles incoming mobile deposit requests.
 * Routes raw image data to the Check 21 processing pipeline.
 */
export class DepositController {
    private check21Service: Check21Service;

    constructor() {
        this.check21Service = new Check21Service();
    }

    /**
     * Submit a Check for Deposit
     * POST /api/deposits
     */
    async submitDeposit(req: Request, res: Response) {
        try {
            // Expect multipart/form-data or JSON with base64 images
            const { amount, micr, checkNumber, routingNumber, accountNumber, userId } = req.body;
            console.log(`Received deposit request for $${amount} from user ${userId || 'ANONYMOUS'}`);

            // Cast to any to access multer files property
            const files = (req as any).files;
            const frontImage = files?.['frontImage']?.[0];
            const backImage = files?.['backImage']?.[0];

            if (!frontImage || !backImage) {
                return res.status(400).json({ error: 'Missing check images' });
            }

            // Convert Express/Multer file to Buffer
            const frontBuffer = frontImage.data || frontImage.buffer; // Handle different multer configs
            const backBuffer = backImage.data || backImage.buffer;

            const result = await this.check21Service.processDeposit(
                { amount, micr, checkNumber, routingNumber, accountNumber },
                frontBuffer,
                backBuffer,
                userId
            );

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(422).json(result); // Unprocessable Entity (IQA failure)
            }

        } catch (error) {
            console.error('Deposit Error:', error);
            return res.status(500).json({ error: 'Internal Server Error during deposit processing' });
        }
    }

    /**
     * Start Identity Verification
     * POST /api/verify/start
     */
    async startVerification(req: Request, res: Response) {
        try {
            const { userId, method } = req.body;
            const result = await (this.check21Service as any).identityService.startVerification(userId, method);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Submit Biometric Data
     * POST /api/verify/biometrics
     */
    async submitBiometrics(req: Request, res: Response) {
        try {
            const { userId } = req.body;
            const files = (req as any).files;
            const idImage = files?.['idImage']?.[0];
            const selfieImage = files?.['selfieImage']?.[0];

            if (!idImage || !selfieImage) {
                return res.status(400).json({ error: 'Missing identity images' });
            }

            const idBuffer = idImage.data || idImage.buffer;
            const selfieBuffer = selfieImage.data || selfieImage.buffer;

            const result = await (this.check21Service as any).identityService.submitBiometrics(userId, idBuffer, selfieBuffer);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
