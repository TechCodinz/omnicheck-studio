import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_demo_only_replace_in_prod';
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

// Session store (use Redis in production)
const sessions: Map<string, SessionData> = new Map();
const loginAttempts: Map<string, LoginAttempt[]> = new Map();
const suspiciousIPs: Set<string> = new Set();

/**
 * Main authentication middleware with 2FA support
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const sessionId = req.headers['x-session-id'] as string;

    if (!token) return res.status(401).json({ error: 'No token provided' });

    // Verify JWT
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });

        // Check session if provided
        if (sessionId) {
            const session = sessions.get(sessionId);
            if (!session || session.userId !== user.id) {
                return res.status(403).json({ error: 'Invalid session' });
            }
            session.lastActivity = Date.now();
            req.session = session;
        }

        req.user = user;
        next();
    });
};

/**
 * Middleware requiring 2FA verification
 */
export const require2FA = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.session?.twoFactorVerified) {
        return res.status(403).json({
            error: '2FA verification required',
            code: 'REQUIRE_2FA'
        });
    }
    next();
};

/**
 * Generate JWT token
 */
export const generateToken = (user: any, expiresIn: string = '24h') => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn } as any
    );
};

/**
 * Generate TOTP secret for user
 */
export const generateTOTPSecret = (userId: string): string => {
    const secret = crypto.randomBytes(20).toString('hex');
    return `${TOTP_SECRET_PREFIX}${userId}_${secret}`;
};

/**
 * Verify TOTP code
 */
export const verifyTOTP = (secret: string, code: string): boolean => {
    // In production, use a library like 'otplib' or 'speakeasy'
    // This is a simplified placeholder
    const timeStep = Math.floor(Date.now() / 30000);
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(Buffer.from(timeStep.toString()));
    const hash = hmac.digest('hex');
    const expectedCode = parseInt(hash.slice(-6), 16).toString().padStart(6, '0').slice(-6);
    return code === expectedCode;
};

/**
 * Create session after successful authentication
 */
export const createSession = (userId: string, ip: string, deviceId: string): SessionData => {
    const session: SessionData = {
        id: crypto.randomBytes(32).toString('hex'),
        userId,
        deviceId,
        ip,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        twoFactorVerified: false
    };
    sessions.set(session.id, session);
    return session;
};

/**
 * Mark session as 2FA verified
 */
export const mark2FAVerified = (sessionId: string): boolean => {
    const session = sessions.get(sessionId);
    if (session) {
        session.twoFactorVerified = true;
        return true;
    }
    return false;
};

/**
 * Track login attempt for rate limiting
 */
export const trackLoginAttempt = (ip: string, success: boolean): void => {
    const attempts = loginAttempts.get(ip) || [];
    attempts.push({ ip, timestamp: Date.now(), success });

    // Keep only last hour
    const oneHourAgo = Date.now() - 3600000;
    const recentAttempts = attempts.filter(a => a.timestamp > oneHourAgo);
    loginAttempts.set(ip, recentAttempts);

    // Check for suspicious activity
    const failedAttempts = recentAttempts.filter(a => !a.success).length;
    if (failedAttempts >= 5) {
        suspiciousIPs.add(ip);
    }
};

/**
 * Check if IP is suspicious
 */
export const isSuspiciousIP = (ip: string): boolean => {
    return suspiciousIPs.has(ip);
};

/**
 * Rate limiting middleware
 */
export const rateLimitAuth = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    if (isSuspiciousIP(ip)) {
        return res.status(429).json({
            error: 'Too many failed attempts. Please try again later.',
            retryAfter: 3600
        });
    }

    const attempts = loginAttempts.get(ip) || [];
    const recentAttempts = attempts.filter(a => a.timestamp > Date.now() - 60000);

    if (recentAttempts.length >= 10) {
        return res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: 60
        });
    }

    next();
};

/**
 * Destroy session
 */
export const destroySession = (sessionId: string): boolean => {
    return sessions.delete(sessionId);
};

/**
 * Get active sessions for user
 */
export const getUserSessions = (userId: string): SessionData[] => {
    return Array.from(sessions.values()).filter(s => s.userId === userId);
};

/**
 * Clean up expired sessions (call periodically)
 */
export const cleanupSessions = (): number => {
    const expiryTime = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = Date.now() - expiryTime;
    let removed = 0;

    for (const [id, session] of sessions) {
        if (session.lastActivity < cutoff) {
            sessions.delete(id);
            removed++;
        }
    }
    return removed;
};

// Cleanup interval
setInterval(cleanupSessions, 3600000); // Every hour
