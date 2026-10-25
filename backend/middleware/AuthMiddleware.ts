import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.includes('change-in-production') || JWT_SECRET.includes('your-')) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters');
}
const TOTP_SECRET_PREFIX = process.env.TOTP_SECRET_PREFIX || 'check_gen_2fa_';

export interface AuthRequest extends Request {
    user?: any;
    session?: SessionData;
}

interface SessionData {
    id: string;
    userId: string;
    deviceId: string;
    ip: string;
    createdAt: number;
    lastActivity: number;
    twoFactorVerified: boolean;
}

interface LoginAttempt {
    ip: string;
    timestamp: number;
    success: boolean;
}

const sessions: Map<string, SessionData> = new Map();
const loginAttempts: Map<string, LoginAttempt[]> = new Map();
const suspiciousIPs: Set<string> = new Set();

const extractToken = (req: AuthRequest): string | null => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];
    if (req.cookies && req.cookies.auth_token) return req.cookies.auth_token;
    if (req.query && req.query.token) return String(req.query.token);
    return null;
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    const sessionId = req.headers['x-session-id'] as string;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        if (sessionId) {
            const session = sessions.get(sessionId);
            if (!session || session.userId !== user.id) return res.status(403).json({ error: 'Invalid session' });
            session.lastActivity = Date.now();
            req.session = session;
        }
        req.user = user;
        next();
    });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

export const generateToken = (user: any, expiresIn: string = '24h') => {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn } as any);
};

export const createSession = (userId: string, ip: string, deviceId: string): SessionData => {
    const session: SessionData = { id: crypto.randomBytes(32).toString('hex'), userId, deviceId, ip, createdAt: Date.now(), lastActivity: Date.now(), twoFactorVerified: false };
    sessions.set(session.id, session);
    return session;
};

export const trackLoginAttempt = (ip: string, success: boolean): void => {
    const attempts = loginAttempts.get(ip) || [];
    attempts.push({ ip, timestamp: Date.now(), success });
    const oneHourAgo = Date.now() - 3600000;
    const recentAttempts = attempts.filter(a => a.timestamp > oneHourAgo);
    loginAttempts.set(ip, recentAttempts);
    if (recentAttempts.filter(a => !a.success).length >= 5) suspiciousIPs.add(ip);
};

export const isSuspiciousIP = (ip: string): boolean => suspiciousIPs.has(ip);

export const rateLimitAuth = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (isSuspiciousIP(ip)) return res.status(429).json({ error: 'Too many failed attempts. Please try again later.', retryAfter: 3600 });
    const attempts = loginAttempts.get(ip) || [];
    const recentAttempts = attempts.filter(a => a.timestamp > Date.now() - 60000);
    if (recentAttempts.length >= 10) return res.status(429).json({ error: 'Rate limit exceeded', retryAfter: 60 });
    next();
};

export const destroySession = (sessionId: string): boolean => sessions.delete(sessionId);

export const cleanupSessions = (): number => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let removed = 0;
    for (const [id, session] of sessions) { if (session.lastActivity < cutoff) { sessions.delete(id); removed++; } }
    return removed;
};

setInterval(cleanupSessions, 3600000);
