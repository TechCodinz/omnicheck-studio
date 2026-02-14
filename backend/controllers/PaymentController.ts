import { Request, Response } from 'express';
import { ACHProcessor } from '../services/banking/ACHProcessor';

/**
 * PaymentController
 * 
 * Handles Direct Deposit (ACH) requests.
 * Routes payment instructions to the ACHProcessor.
 */
export class PaymentController {
    private achProcessor: ACHProcessor;

    constructor() {
        this.achProcessor = new ACHProcessor();
    }

    /**
     * Submit a Batch of Direct Deposits
     * POST /api/payments/ach
     */
    async submitDirectDeposit(req: Request, res: Response) {
        try {
            const { entries, userId } = req.body;

            if (!entries || !Array.isArray(entries) || entries.length === 0) {
                return res.status(400).json({ error: 'Missing or invalid entries array' });
            }

            // In a real app, userId comes from the authenticated token
            // const userId = req.user.id; 

            const result = await this.achProcessor.processDirectDepositBatch(entries, userId);

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(422).json(result); // Unprocessable Entity (KYC or Gateway Rejection)
            }

        } catch (error) {
            console.error('ACH Payment Error:', error);
            return res.status(500).json({ error: 'Internal Server Error during ACH processing' });
        }
    }
}
