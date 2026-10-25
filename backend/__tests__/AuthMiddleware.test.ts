import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireAdmin, generateToken, createSession, destroySession, rateLimitAuth, trackLoginAttempt, isSuspiciousIP } from '../middleware/AuthMiddleware';
import jwt from 'jsonwebtoken';

// JWT secret is provided by jest.setup.js before modules load.

describe('Auth Middleware', () => {
    let mockReq: Partial<Request> & { user?: any };
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = { headers: {}, cookies: {}, query: {}, ip: '127.0.0.1', connection: { remoteAddress: '127.0.0.1' } as any };
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), cookie: jest.fn().mockReturnThis(), clearCookie: jest.fn().mockReturnThis() };
        mockNext = jest.fn();
    });

    afterEach(() => { jest.clearAllMocks(); });

    it('generates a valid JWT token', () => {
        const user = { id: 1, email: 'test@example.com', role: 'user' };
        const token = generateToken(user);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        expect(decoded.id).toBe(user.id);
        expect(decoded.email).toBe(user.email);
    });

    it('authenticates with valid Bearer token', () => {
        const user = { id: 1, email: 'test@example.com', role: 'user' };
        const token = generateToken(user);
        mockReq.headers = { authorization: `Bearer ${token}` };
        authenticateToken(mockReq as any, mockRes as any, mockNext);
        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user).toBeDefined();
    });

    it('authenticates with httpOnly cookie token', () => {
        const user = { id: 1, email: 'test@example.com', role: 'user' };
        const token = generateToken(user);
        mockReq.cookies = { auth_token: token };
        authenticateToken(mockReq as any, mockRes as any, mockNext);
        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user).toBeDefined();
    });

    it('rejects request without token', () => {
        authenticateToken(mockReq as any, mockRes as any, mockNext);
        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('allows admin users', () => {
        mockReq.user = { id: 1, email: 'admin@example.com', role: 'admin' };
        requireAdmin(mockReq as any, mockRes as any, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });

    it('rejects non-admin users', () => {
        mockReq.user = { id: 1, email: 'user@example.com', role: 'user' };
        requireAdmin(mockReq as any, mockRes as any, mockNext);
        expect(mockNext).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('creates and destroys sessions', () => {
        const session = createSession('user123', '127.0.0.1', 'device1');
        expect(session.userId).toBe('user123');
        expect(destroySession(session.id)).toBe(true);
    });

    it('flags IP after multiple failed attempts', () => {
        for (let i = 0; i < 6; i++) trackLoginAttempt('192.168.1.2', false);
        expect(isSuspiciousIP('192.168.1.2')).toBe(true);
    });
});
