import { Request, Response } from 'express';
import db from '../db/Database';
import { v4 as uuidv4 } from 'uuid';

export class TaxController {

    /**
     * Get all tax templates
     */
    async getTemplates(req: Request, res: Response) {
        try {
            const rows = db.prepare('SELECT * FROM tax_templates').all();
            res.json(rows.map((row: any) => ({
                ...row,
                schema: JSON.parse(row.schema)
            })));
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Save a new tax document
     */
    async saveDocument(req: Request, res: Response) {
        // The owner is the authenticated user — never a client-supplied id.
        const userId = String((req as any).user?.id || '');
        if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
        const { templateId, data, status } = req.body;
        const id = uuidv4();

        try {
            db.prepare(`
                INSERT INTO tax_documents (id, user_id, template_id, data, status, updated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(id, userId, templateId, JSON.stringify(data), status || 'DRAFT');

            res.status(201).json({ success: true, id });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get user's tax documents
     */
    async getDocuments(req: Request, res: Response) {
        // IDOR guard: a user may only list their own documents, whatever
        // userId is put in the URL.
        const userId = String((req as any).user?.id || '');
        if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
        try {
            const rows = db.prepare('SELECT * FROM tax_documents WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
            res.json(rows.map((row: any) => ({
                ...row,
                data: JSON.parse(row.data)
            })));
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update an existing tax document
     */
    async updateDocument(req: Request, res: Response) {
        const { id } = req.params;
        const { data, status } = req.body;

        try {
            const userId = String((req as any).user?.id || '');
            const info: any = db.prepare(`
                UPDATE tax_documents
                SET data = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            `).run(JSON.stringify(data), status, id, userId);

            if (!info || info.changes === 0) {
                return res.status(404).json({ success: false, error: 'Document not found' });
            }
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Seed initial templates if empty
     */
    static seedTemplates() {
        // Check if we need to seed (mock check, in real app would check individually)
        const count = db.prepare('SELECT COUNT(*) as count FROM tax_templates').get() as any;
        if (count.count < 5) { // Simple check to trigger re-seed if we have fewer than expected
            console.log('[TAX] Seeding/Updating tax templates...');

            const w2Schema = {
                type: 'W2',
                fields: [
                    { id: 'employerEIN', label: 'Employer EIN', type: 'ein' },
                    { id: 'employeeSSN', label: 'Employee SSN', type: 'ssn' },
                    { id: 'wages', label: 'Wages', type: 'currency' }
                ]
            };

            const necSchema = {
                type: '1099-NEC',
                fields: [
                    { id: 'payerTIN', label: 'Payer TIN', type: 'ein' },
                    { id: 'recipientTIN', label: 'Recipient TIN', type: 'ssn' },
                    { id: 'compensation', label: 'Nonemployee Compensation', type: 'currency' }
                ]
            };

            const miscSchema = {
                type: '1099-MISC',
                fields: [
                    { id: 'payerTIN', label: 'Payer TIN', type: 'ein' },
                    { id: 'recipientTIN', label: 'Recipient TIN', type: 'ssn' },
                    { id: 'rents', label: 'Rents', type: 'currency' }
                ]
            };

            const intSchema = {
                type: '1099-INT',
                fields: [
                    { id: 'payerName', label: 'Payer Name', type: 'text' },
                    { id: 'interestIncome', label: 'Interest Income', type: 'currency' }
                ]
            };

            const kSchema = {
                type: '1099-K',
                fields: [
                    { id: 'pseName', label: 'PSE Name', type: 'text' },
                    { id: 'grossAmount', label: 'Gross Amount', type: 'currency' }
                ]
            };

            const f1040Schema = {
                type: '1040',
                fields: [
                    { id: 'taxpayerSSN', label: 'Taxpayer SSN', type: 'ssn' },
                    { id: 'agi', label: 'Adjusted Gross Income', type: 'currency' },
                    { id: 'refundOwed', label: 'Refund/Owed', type: 'currency' }
                ]
            };

            const insert = db.prepare(`
                INSERT OR IGNORE INTO tax_templates (id, name, category, schema)
                VALUES (?, ?, ?, ?)
            `);

            insert.run('irs-w2-standard', 'IRS Form W-2 Standard', 'WAGE', JSON.stringify(w2Schema));
            insert.run('irs-1099-nec-standard', 'IRS Form 1099-NEC', 'INCOME', JSON.stringify(necSchema));
            insert.run('irs-1099-misc-standard', 'IRS Form 1099-MISC', 'INCOME', JSON.stringify(miscSchema));
            insert.run('irs-1099-int-standard', 'IRS Form 1099-INT', 'INCOME', JSON.stringify(intSchema));
            insert.run('irs-1099-k-standard', 'IRS Form 1099-K', 'INCOME', JSON.stringify(kSchema));
            insert.run('irs-1040-standard', 'IRS Form 1040 (Page 1)', 'TAX_RETURN', JSON.stringify(f1040Schema));
        }
    }
}
