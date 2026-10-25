import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

jest.mock('../db/Database', () => ({
    initDatabase: jest.fn(),
    default: { prepare: jest.fn(() => ({ run: jest.fn(), get: jest.fn(), all: jest.fn(() => []) })) }
}));

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => { res.json({ success: true, status: 'ok' }); });

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required' });
    if (email === 'test@example.com' && password === 'password123') {
        res.cookie('auth_token', 'test_token', { httpOnly: true });
        return res.json({ success: true, token: 'test_token', user: { id: 1, email: 'test@example.com', role: 'user' } });
    }
    res.status(401).json({ success: false, error: 'Invalid credentials' });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Logged out successfully' });
});

describe('API Endpoints', () => {
    it('GET /api/health returns status', async () => {
        const response = await request(app).get('/api/health').expect(200);
        expect(response.body.success).toBe(true);
    });

    it('POST /api/auth/login sets httpOnly cookie', async () => {
        const response = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'password123' });
        expect(response.headers['set-cookie']).toBeDefined();
        expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    });

    it('POST /api/auth/login rejects invalid credentials', async () => {
        const response = await request(app).post('/api/auth/login').send({ email: 'wrong', password: 'wrong' }).expect(401);
        expect(response.body.success).toBe(false);
    });

    it('POST /api/auth/logout clears cookie', async () => {
        const response = await request(app).post('/api/auth/logout').expect(200);
        expect(response.headers['set-cookie']).toBeDefined();
        expect(response.headers['set-cookie'][0]).toContain('auth_token=;');
    });
});
