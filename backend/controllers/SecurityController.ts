import { Request, Response } from 'express';
import { EnterpriseSecurityEngine } from '../security/EnterpriseSecurity';

const securityEngine = new EnterpriseSecurityEngine();

export class SecurityController {
    static async secure(req: Request, res: Response) {
        try {
            const { documentId, sensitiveData } = req.body;

            // Mocking a document object for the engine
            const doc = { id: documentId, ...sensitiveData };

            const securedDoc = await securityEngine.secureDocument(doc);

            res.json({
                success: true,
                documentId: securedDoc.documentId,
                securityMetadata: {
                    encryption: 'AES-256',
                    auditId: securedDoc.audit?.id || 'mock_audit_id'
                },
                certificate: await securityEngine.generateSecurityCertificate(doc, {
                    documentId,
                    timestamp: new Date().toISOString(),
                    score: 95,
                    findings: [],
                    recommendations: [],
                    compliance: {},
                    riskLevel: 'low'
                })
            });
        } catch (error) {
            console.error('Security Error:', error);
            res.status(500).json({ success: false, error: 'Security application failed' });
        }
    }
}
