import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import AdvancedPDFGenerator from './services/AdvancedPDFGenerator';
import { AdvancedFraudDetection } from './services/FraudDetectionService';
import { AdvancedDocumentAnalytics } from './analytics/DocumentAnalytics';
import multer from 'multer';
import { DepositController } from './controllers/DepositController';
import { PaymentController } from './controllers/PaymentController';
import { AdminController } from './controllers/AdminController';
import { TaxController } from './controllers/TaxController';
import { authenticateToken, generateToken, requireAdmin, rateLimitAuth } from './middleware/AuthMiddleware';
import bcrypt from 'bcrypt';

// Uploads stay in memory, so cap them hard: an unbounded memory upload is a
// one-request denial of service.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 4 }
});

// Only the configured frontend origin may call the API. A wildcard origin on
// an authenticated, document-generating API is not acceptable in production.
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const depositController = new DepositController();
const paymentController = new PaymentController();
const adminController = new AdminController();
const taxController = new TaxController();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3001;

// Initialize Generators & Analytics
const pdfGenerator = new AdvancedPDFGenerator();
const fraudDetector = new AdvancedFraudDetection();
const analytics = new AdvancedDocumentAnalytics();

import { initDatabase } from './db/Database';

// Initialize Database
try {
    initDatabase();
} catch (err) {
    console.error('Failed to initialize database:', err);
}


// Security middleware
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check (no auth, no data)
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// Template Management
import db from './db/Database';

// Routes
app.get('/api/templates', (req, res) => {
    try {
        // Fetch templates from DB (or use fallback if empty for demo)
        const rows = db.prepare('SELECT * FROM templates').all();
        let templatesList = rows.map((row: any) => ({
            id: row.id,
            ...JSON.parse(row.data)
        }));

        if (templatesList.length === 0) {
            // Fallback for demo if DB is empty
            templatesList = [
                {
                    id: 'premium-1',
                    name: 'Premium Corporate',
                    thumbnail: '/thumbnails/premium-1.jpg',
                    premium: true
                }
            ];
        }

        res.json({
            success: true,
            templates: templatesList
        });
    } catch (error) {
        console.error('Template Fetch Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch templates' });
    }
});


app.get('/api/template/:id', (req, res) => {
    const templateId = req.params.id;
    try {
        const row: any = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);

        if (row) {
            res.json({
                success: true,
                template: { id: row.id, ...JSON.parse(row.data) }
            });
        } else {
            // Fallback for demo premium-1 if not in DB
            if (templateId === 'premium-1') {
                res.json({
                    success: true,
                    template: {
                        name: 'Premium Corporate',
                        bankCode: 'CHASE',
                        background: '/templates/premium-1.jpg',
                        fields: [
                            { name: 'payee', x: 70, y: 120, width: 300, fontSize: 14 },
                            { name: 'amount_numbers', x: 600, y: 120, width: 100, fontSize: 14 },
                            { name: 'amount_words', x: 70, y: 150, width: 400, fontSize: 12 },
                            { name: 'date', x: 500, y: 80, width: 100, fontSize: 12 },
                            { name: 'check_number', x: 650, y: 80, width: 80, fontSize: 12 },
                            { name: 'memo', x: 70, y: 180, width: 200, fontSize: 12 },
                            { name: 'signature', x: 450, y: 220, width: 200, fontSize: 12 }
                        ],
                        security: {
                            watermark: true,
                            micrFont: true,
                            microprint: true,
                            pattern: 'geometric'
                        }
                    }
                });
                return;
            }
            res.status(404).json({ success: false, error: 'Template not found' });
        }
    } catch (error) {
        console.error('Template Fetch Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch template' });
    }
});


app.post('/api/generate-pdf', authenticateToken, async (req: any, res) => {
    try {
        const {
            templateId,
            checkData,
            options = {}
        } = req.body;

        // Validate request
        if (!templateId || !checkData) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        // Validate the fields the PDF/MICR generator actually dereferences.
        // Without this, a malformed body crashed deep in the generator as an
        // opaque 500 (e.g. reading .length of an undefined routing number).
        const missing: string[] = [];
        if (!checkData.checkNumber) missing.push('checkData.checkNumber');
        if (!checkData.payeeName) missing.push('checkData.payeeName');
        if (checkData.amount === undefined || Number.isNaN(Number(checkData.amount)) || Number(checkData.amount) <= 0) missing.push('checkData.amount (positive number)');
        if (!/^\d{9}$/.test(String(checkData.routingNumber || ''))) missing.push('checkData.routingNumber (9 digits)');
        if (!/^\d{4,17}$/.test(String(checkData.accountNumber || ''))) missing.push('checkData.accountNumber (4-17 digits)');
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Invalid or missing fields: ${missing.join(', ')}`
            });
        }

        // Fetch template from DB
        let template;
        const row: any = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId);

        if (row) {
            template = { id: row.id, ...JSON.parse(row.data) };
        } else if (templateId === 'premium-1') {
            // Fallback
            template = {
                name: 'Premium Corporate',
                bankCode: 'CHASE',
                background: '/templates/premium-1.jpg',
                fields: [
                    { name: 'payee', x: 70, y: 120, width: 300, fontSize: 14 },
                    { name: 'amount_numbers', x: 600, y: 120, width: 100, fontSize: 14 },
                    { name: 'amount_words', x: 70, y: 150, width: 400, fontSize: 12 },
                    { name: 'date', x: 500, y: 80, width: 100, fontSize: 12 },
                    { name: 'check_number', x: 650, y: 80, width: 80, fontSize: 12 },
                    { name: 'memo', x: 70, y: 180, width: 200, fontSize: 12 },
                    { name: 'signature', x: 450, y: 220, width: 200, fontSize: 12 }
                ],
                security: {
                    watermark: true,
                    micrFont: true,
                    microprint: true,
                    pattern: 'geometric'
                }
            };
        } else {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        // Create PDF using Advanced Generator
        const pdfBuffer = await pdfGenerator.generateBankGradePDF(checkData, template, options);

        // Track generation event (background)
        analytics.trackDocumentAnalytics(
            { id: templateId, type: template.type },
            { type: 'check_generated', checkNumber: checkData.checkNumber, amount: checkData.amount }
        ).catch(err => console.error('Analytics tracking failed:', err));

        // Save generation for fraud auditing
        try {
            const report = await fraudDetector.detectFraud({
                ...checkData,
                id: `gen_${Date.now()}`,
                userId: String(req.user?.id || 'unknown'),
                metadata: { ipAddress: req.ip || '0.0.0.0' }
            });
            console.log('Fraud Detection Report:', report);
        } catch (err) {
            console.error('Fraud detection failed:', err);
        }


        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="check_${checkData.checkNumber}_${Date.now()}.pdf"`
        );

        // Send PDF (Buffer)
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate PDF'
        });
    }
});

app.post('/api/save-template', authenticateToken, (req: any, res) => {
    const { templateData } = req.body || {};
    if (!templateData || typeof templateData !== 'object') {
        return res.status(400).json({ success: false, error: 'templateData is required' });
    }
    const userId = req.user?.id;

    // Validate and save custom template
    const templateId = `custom_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    try {
        db.prepare('INSERT INTO templates (id, name, data, user_id) VALUES (?, ?, ?, ?)').run(
            templateId,
            templateData.name || 'Untitled Template',
            JSON.stringify(templateData),
            userId
        );

        res.json({
            success: true,
            templateId,
            message: 'Template saved successfully'
        });
    } catch (error) {
        console.error('Template Save Error:', error);
        res.status(500).json({ success: false, error: 'Failed to save template' });
    }
});



import { VerificationController } from './controllers/VerificationController';
import { SecurityController } from './controllers/SecurityController';
import { AnalyticsController } from './controllers/AnalyticsController';

// ... (existing helper function app.get etc)


// Auth Routes
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

app.post('/api/auth/register', rateLimitAuth, async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
            return res.status(400).json({ success: false, error: 'A valid email is required' });
        }
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        }
        const existing: any = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ success: false, error: 'An account with this email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // Admin bootstrap: the single email named by the ADMIN_EMAIL env var
        // registers with the admin role. There is no admin password and no
        // default credential anywhere in the system - admin is a role on a
        // normal account, checked server-side by requireAdmin.
        const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
        const role = adminEmail && email.toLowerCase() === adminEmail ? 'admin' : 'user';
        const info = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(email, hashedPassword, role);
        const user = { id: info.lastInsertRowid, email, role };
        const token = generateToken(user);

        res.json({ success: true, token, user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

app.post('/api/auth/login', rateLimitAuth, async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }
        const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (user && await bcrypt.compare(password, user.password_hash)) {
            const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
            if (adminEmail && user.email.toLowerCase() === adminEmail && user.role !== 'admin') {
                db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', user.id);
                user.role = 'admin';
            }
            const token = generateToken({ id: user.id, email: user.email, role: user.role });
            res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});


// Enterprise Routes (Protected)
app.post('/api/verify', authenticateToken, VerificationController.verify);
app.post('/api/secure', authenticateToken, SecurityController.secure);
app.post('/api/analytics/track', authenticateToken, AnalyticsController.trackEvent);
app.get('/api/analytics/dashboard', authenticateToken, AnalyticsController.getDashboard);

// Mobile Deposit Route
app.post('/api/deposits', authenticateToken, upload.fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), (req, res) => depositController.submitDeposit(req, res));

// Identity Verification Routes
app.post('/api/verify/start', authenticateToken, (req, res) => depositController.startVerification(req, res));
app.post('/api/verify/biometrics', authenticateToken, upload.fields([
    { name: 'idImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 }
]), (req, res) => depositController.submitBiometrics(req, res));

// ACH Direct Deposit Route (Phase 33)
app.post('/api/payments/ach', authenticateToken, (req, res) => paymentController.submitDirectDeposit(req, res));

// Seed data
TaxController.seedTemplates();

// Admin Dashboard Routes (Phase 34)
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => adminController.getSystemStats(req, res));
app.get('/api/admin/verifications', authenticateToken, requireAdmin, (req, res) => adminController.getVerifications(req, res));
app.get('/api/admin/ach-batches', authenticateToken, requireAdmin, (req, res) => adminController.getACHBatches(req, res));

// Tax Routes
app.get('/api/tax/templates', authenticateToken, (req, res) => taxController.getTemplates(req, res));
app.get('/api/tax/documents/:userId', authenticateToken, (req, res) => taxController.getDocuments(req, res));
app.post('/api/tax/documents', authenticateToken, (req, res) => taxController.saveDocument(req, res));
app.put('/api/tax/documents/:id', authenticateToken, (req, res) => taxController.updateDocument(req, res));

// ==================== INVOICING & MERCHANT PAYMENT PROCESSING ENGINE ====================

// 1. List Merchant Invoices
app.get('/api/invoices', authenticateToken, (req: any, res) => {
    try {
        const rows = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all();
        const invoices = rows.map((r: any) => ({
            ...r,
            items: JSON.parse(r.items || '[]'),
            payout_details: JSON.parse(r.payout_details || '{}'),
            trial_deposits: JSON.parse(r.trial_deposits || '{}')
        }));
        res.json({ success: true, invoices });
    } catch (err: any) {
        console.error('Fetch Invoices Error:', err);
        res.status(500).json({ success: false, error: 'Failed to retrieve invoices' });
    }
});

// 2. Create Invoice
app.post('/api/invoices', authenticateToken, (req: any, res) => {
    try {
        const {
            clientName,
            clientEmail,
            amount,
            currency = 'USD',
            items = [],
            payoutDestination = 'RECEIVER_BANK',
            payoutDetails = {},
            notes = ''
        } = req.body;

        if (!clientName || !clientEmail || !amount || Number(amount) <= 0) {
            return res.status(400).json({ success: false, error: 'Client name, client email, and positive amount are required' });
        }

        const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
        db.prepare(`
            INSERT INTO invoices (id, merchant_id, client_name, client_email, amount, currency, status, items, payout_destination, payout_details, notes)
            VALUES (?, ?, ?, ?, ?, ?, 'SENT', ?, ?, ?, ?)
        `).run(
            invoiceId,
            String(req.user?.id || 'MERCHANT-1'),
            clientName,
            clientEmail,
            Number(amount),
            currency,
            JSON.stringify(items),
            payoutDestination,
            JSON.stringify(payoutDetails),
            notes
        );

        res.json({
            success: true,
            invoice: {
                id: invoiceId,
                clientName,
                clientEmail,
                amount: Number(amount),
                currency,
                status: 'SENT',
                payoutDestination
            }
        });
    } catch (err: any) {
        console.error('Create Invoice Error:', err);
        res.status(500).json({ success: false, error: 'Failed to create invoice' });
    }
});

// 3. Get Invoice Details (Public / Payer portal)
app.get('/api/invoices/:id', (req, res) => {
    try {
        const row: any = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
        if (!row) return res.status(404).json({ success: false, error: 'Invoice not found' });

        res.json({
            success: true,
            invoice: {
                ...row,
                items: JSON.parse(row.items || '[]'),
                payout_details: JSON.parse(row.payout_details || '{}'),
                trial_deposits: JSON.parse(row.trial_deposits || '{}')
            }
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch invoice details' });
    }
});

// 4. Pay Invoice (Multi-Rail: Card, Plaid, Manual ACH with Trial Deposits, SWIFT, Digital Tags)
app.post('/api/invoices/:id/pay', (req, res) => {
    try {
        const invoiceId = req.params.id;
        const row: any = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
        if (!row) return res.status(404).json({ success: false, error: 'Invoice not found' });

        const { paymentMethod, paymentData } = req.body;

        // --- OPTION A: CREDIT / DEBIT CARD ---
        if (paymentMethod === 'CARD') {
            const { cardNumber, expMonth, expYear, cvc } = paymentData || {};
            const cleanCard = String(cardNumber || '').replace(/\D/g, '');
            if (cleanCard.length < 13 || cleanCard.length > 19) {
                return res.status(400).json({ success: false, error: 'Invalid card number' });
            }

            db.prepare('UPDATE invoices SET status = ?, payment_method = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run('PAID', 'CARD', invoiceId);

            return res.json({
                success: true,
                status: 'PAID',
                transactionId: `TXN-CARD-${Date.now()}`,
                message: 'Payment successfully processed via Card gateway'
            });
        }

        // --- OPTION B: BANK TRANSFER VIA PLAID (INSTANT LINK) ---
        if (paymentMethod === 'PLAID') {
            const { publicToken, accountId, institutionName } = paymentData || {};
            db.prepare('UPDATE invoices SET status = ?, payment_method = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run('PAID', 'PLAID', invoiceId);

            return res.json({
                success: true,
                status: 'PAID',
                transactionId: `TXN-PLAID-${Date.now()}`,
                institution: institutionName || 'Plaid Linked Bank',
                message: 'Bank account verified instantly via Plaid. ACH debit initiated.'
            });
        }

        // --- OPTION C: MANUAL ACH BANK (ROUTING + ACCOUNT WITH TRIAL MICRO-DEPOSITS) ---
        if (paymentMethod === 'MANUAL_ACH') {
            const { routingNumber, accountNumber, accountHolderName } = paymentData || {};
            const cleanRouting = String(routingNumber || '').replace(/\D/g, '');
            const cleanAccount = String(accountNumber || '').replace(/\D/g, '');

            if (cleanRouting.length !== 9) {
                return res.status(400).json({ success: false, error: 'Routing number must be exactly 9 digits' });
            }

            // ABA Mod-10 Checksum
            const d = cleanRouting.split('').map(Number);
            const checksum = (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + 1 * (d[2] + d[5] + d[8])) % 10;
            if (checksum !== 0) {
                return res.status(400).json({ success: false, error: 'Invalid ABA routing number checksum' });
            }

            if (cleanAccount.length < 4 || cleanAccount.length > 17) {
                return res.status(400).json({ success: false, error: 'Account number must be between 4 and 17 digits' });
            }

            // Generate two micro-deposit amounts between $0.10 and $0.99
            const dep1 = (Math.floor(Math.random() * 80 + 10) / 100);
            const dep2 = (Math.floor(Math.random() * 80 + 10) / 100);

            const trialData = {
                routingNumber: cleanRouting,
                accountNumberMasked: `******${cleanAccount.slice(-4)}`,
                accountHolderName: accountHolderName || 'Authorized Signer',
                deposit1: dep1,
                deposit2: dep2,
                verified: false,
                sentAt: new Date().toISOString()
            };

            db.prepare('UPDATE invoices SET status = ?, payment_method = ?, trial_deposits = ? WHERE id = ?')
                .run('TRIAL_PENDING', 'MANUAL_ACH', JSON.stringify(trialData), invoiceId);

            return res.json({
                success: true,
                status: 'TRIAL_PENDING',
                message: `Two micro-deposits have been dispatched to your bank account ending in ${cleanAccount.slice(-4)}. Enter the two exact amounts in the verification prompt to complete payment.`,
                trialInfo: {
                    deposit1Hint: dep1, // Provided for easy demo verification in UI
                    deposit2Hint: dep2,
                    accountEnding: cleanAccount.slice(-4)
                }
            });
        }

        // --- OPTION C-2: VERIFY TRIAL DEPOSITS ---
        if (paymentMethod === 'VERIFY_TRIAL_DEPOSITS') {
            const { deposit1, deposit2 } = paymentData || {};
            const existingTrials = JSON.parse(row.trial_deposits || '{}');

            if (!existingTrials.deposit1 || !existingTrials.deposit2) {
                return res.status(400).json({ success: false, error: 'No pending trial deposits found for this invoice' });
            }

            const match1 = Math.abs(Number(deposit1) - Number(existingTrials.deposit1)) < 0.001;
            const match2 = Math.abs(Number(deposit2) - Number(existingTrials.deposit2)) < 0.001;

            if (!match1 || !match2) {
                return res.status(400).json({
                    success: false,
                    error: 'Trial deposit amounts do not match bank records. Please check your bank statement and re-enter.'
                });
            }

            existingTrials.verified = true;
            existingTrials.verifiedAt = new Date().toISOString();

            db.prepare('UPDATE invoices SET status = ?, paid_at = CURRENT_TIMESTAMP, trial_deposits = ? WHERE id = ?')
                .run('PAID', JSON.stringify(existingTrials), invoiceId);

            return res.json({
                success: true,
                status: 'PAID',
                message: 'Bank account verified successfully. Invoice settled via ACH Direct Debit.'
            });
        }

        // --- OPTION D: SWIFT INTERNATIONAL WIRE ---
        if (paymentMethod === 'SWIFT') {
            const { swiftBic, iban, beneficiaryBank } = paymentData || {};
            const cleanBic = String(swiftBic || '').trim().toUpperCase();

            if (cleanBic.length !== 8 && cleanBic.length !== 11) {
                return res.status(400).json({ success: false, error: 'SWIFT/BIC code must be 8 or 11 characters' });
            }

            db.prepare('UPDATE invoices SET status = ?, payment_method = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run('PAID', 'SWIFT', invoiceId);

            return res.json({
                success: true,
                status: 'PAID',
                transactionId: `SWIFT-${cleanBic}-${Date.now()}`,
                message: `International SWIFT wire instruction accepted for ${beneficiaryBank || 'Beneficiary Bank'}.`
            });
        }

        // --- OPTION E: UNIVERSAL DIGITAL TAGS (PAYPAL, ZELLE, CASHAPP, VENMO) ---
        if (paymentMethod === 'DIGITAL_TAGS') {
            const { tagPlatform, senderHandle, referenceCode } = paymentData || {};
            db.prepare('UPDATE invoices SET status = ?, payment_method = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run('PAID', `${tagPlatform || 'TAG'}_TAG`, invoiceId);

            return res.json({
                success: true,
                status: 'PAID',
                transactionId: `TAG-${tagPlatform}-${Date.now()}`,
                message: `Payment confirmed via ${tagPlatform} (${senderHandle || referenceCode || 'Tag Transfer'}).`
            });
        }

        return res.status(400).json({ success: false, error: `Unsupported payment method: ${paymentMethod}` });
    } catch (err: any) {
        console.error('Invoice Payment Error:', err);
        res.status(500).json({ success: false, error: 'Payment processing encountered an error' });
    }
});



// WebSocket Handling
// In production a socket must present a valid JWT, otherwise anyone could
// join any document room and receive other users' field updates.
if (process.env.NODE_ENV === 'production') {
    const jwt = require('jsonwebtoken');
    io.use((socket: Socket, next: (err?: Error) => void) => {
        const token = (socket.handshake.auth as any)?.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            (socket as any).user = jwt.verify(token, process.env.JWT_SECRET as string);
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });
}

io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('fieldUpdate', (data: { documentId: string; fieldId: string; value: string }) => {
        socket.to(data.documentId).emit('fieldUpdate', data);
    });

    socket.on('cursorMove', (data: { documentId: string; x: number; y: number }) => {
        socket.to(data.documentId).emit('cursorMove', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});


export default app;
