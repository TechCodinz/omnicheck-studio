import { Request, Response } from 'express';
import { AdvancedDocumentAnalytics } from '../analytics/DocumentAnalytics';

const analyticsEngine = new AdvancedDocumentAnalytics();

export class AnalyticsController {
    static async trackEvent(req: Request, res: Response) {
        try {
            const { documentId, eventType, data } = req.body;

            const result = await analyticsEngine.trackDocumentAnalytics(
                { id: documentId, type: 'check' },
                { type: eventType, ...data }
            );

            res.json(result);
        } catch (error) {
            console.error('Analytics Error:', error);
            res.status(500).json({ success: false, error: 'Tracking failed' });
        }
    }

    static async getDashboard(req: Request, res: Response) {
        try {
            const report = await analyticsEngine.generateBusinessIntelligenceReport(
                { start: new Date(Date.now() - 86400000).toISOString(), end: new Date().toISOString() },
                {}
            );
            res.json({ success: true, report });
        } catch (error) {
            console.error('Dashboard Error:', error);
            res.status(500).json({ success: false, error: 'Failed to generate report' });
        }
    }
}
