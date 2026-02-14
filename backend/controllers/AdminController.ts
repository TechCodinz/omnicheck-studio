import { Request, Response } from 'express';
import { DB } from '../db/Database';

/**
 * AdminController
 * 
 * Provides read-only access to system data for the Admin Dashboard.
 * - KYC Verifications
 * - ACH Batches
 * - Check Deposits
 */
export class AdminController {

    /**
     * Get all KYC verifications (Recent first)
     */
    async getVerifications(req: Request, res: Response) {
        try {
            const limit = req.query.limit || 50;
            const rows = DB.query(`
                SELECT * FROM kyc_verifications 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [limit]);
            res.json(rows);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get all ACH Batches
     */
    async getACHBatches(req: Request, res: Response) {
        try {
            const limit = req.query.limit || 50;
            const rows = DB.query(`
                SELECT * FROM ach_batches 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [limit]);
            res.json(rows);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get system stats
     */
    async getSystemStats(req: Request, res: Response) {
        try {
            const kycCount = DB.get(`SELECT COUNT(*) as count FROM kyc_verifications`) as { count: number };
            const achVolume = DB.get(`SELECT SUM(total_amount) as volume FROM ach_batches WHERE status = 'PROCESSED'`) as { volume: number };

            res.json({
                kyc_total: kycCount?.count || 0,
                ach_volume_total: achVolume?.volume || 0,
                server_time: new Date().toISOString()
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
