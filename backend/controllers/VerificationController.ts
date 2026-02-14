import { Request, Response } from 'express';
import { DocumentVerificationAI } from '../ai/DocumentVerificationAI';

const verificationEngine = new DocumentVerificationAI();

export class VerificationController {
    static async verify(req: Request, res: Response) {
        try {
            const { documentData } = req.body;
            if (!documentData) {
                return res.status(400).json({ success: false, error: 'No document data provided' });
            }

            // In a real scenario, we might need to reconstruct the ClonedDocument object
            // For now, we pass the data payload
            const result: any = await verificationEngine.verifyDocumentAuthenticity(documentData);

            res.json({
                success: true,
                verificationId: result.verificationId || 'mock_id',
                score: result.score,
                isAuthentic: result.isAuthentic,
                report: result
            });

        } catch (error) {
            console.error('Verification Error:', error);
            res.status(500).json({ success: false, error: 'Verification failed' });
        }
    }
}
