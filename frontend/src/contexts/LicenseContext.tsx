/**
 * LicenseContext — OmniCheck Pro Licensing & Subscription System
 * Client-side plan management with localStorage persistence.
 * Upgrade to server-side auth when scaling.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============== PLAN DEFINITIONS ==============
export interface PlanDef {
    id: string;
    name: string;
    price: number;           // monthly USD
    checksPerMonth: number;  // -1 = unlimited
    features: string[];
    badge: string;
    color: string;
}

export const PLANS: PlanDef[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        checksPerMonth: 0, // can design but not export
        features: [
            'Unlimited check design & preview',
            'Basic templates (3)',
            'Watermarked preview only',
            'No export / download'
        ],
        badge: 'FREE',
        color: '#6B7280'
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 19.99,
        checksPerMonth: 25,
        features: [
            'Everything in Free',
            '25 clean exports / month',
            '5 premium templates',
            'MICR line engineering',
            'Email support'
        ],
        badge: 'STARTER',
        color: '#3B82F6'
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 49.99,
        checksPerMonth: 100,
        features: [
            'Everything in Starter',
            '100 exports / month',
            'All templates & bank styles',
            'Security features (void pantograph, microprint)',
            'Signature Lab',
            'Priority support'
        ],
        badge: 'PRO',
        color: '#F97316'
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 149.99,
        checksPerMonth: -1, // unlimited
        features: [
            'Everything in Professional',
            'Unlimited exports',
            'Check cloning engine',
            'Custom branding & logos',
            'Document editor suite',
            'Tax document generator',
            'API access',
            'Dedicated support'
        ],
        badge: 'ENTERPRISE',
        color: '#10B981'
    }
];

// ============== LICENSE STATE ==============
export interface LicenseState {
    planId: string;
    activatedAt: string | null;
    expiresAt: string | null;
    checksUsedThisMonth: number;
    monthResetDate: string;
    paymentTxId: string | null;
}

const DEFAULT_LICENSE: LicenseState = {
    planId: 'free',
    activatedAt: null,
    expiresAt: null,
    checksUsedThisMonth: 0,
    monthResetDate: new Date().toISOString(),
    paymentTxId: null
};

// ============== CONTEXT ==============
interface LicenseContextType {
    license: LicenseState;
    currentPlan: PlanDef;
    isPaid: boolean;
    isProOrAbove: boolean;
    isEnterprise: boolean;
    checksRemaining: number;
    canExport: boolean;
    activatePlan: (planId: string, txId?: string) => void;
    useCheckExport: () => boolean; // returns true if allowed, decrements count
    resetToFree: () => void;
    validateAdminPassword: (password: string) => boolean;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

export const useLicense = (): LicenseContextType => {
    const ctx = useContext(LicenseContext);
    if (!ctx) throw new Error('useLicense must be used within LicenseProvider');
    return ctx;
};

// ============== PROVIDER ==============
const STORAGE_KEY = 'omnicheck_license';

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [license, setLicense] = useState<LicenseState>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as LicenseState;
                // Check if month needs reset
                const resetDate = new Date(parsed.monthResetDate);
                const now = new Date();
                if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
                    return { ...parsed, checksUsedThisMonth: 0, monthResetDate: now.toISOString() };
                }
                // Check expiry
                if (parsed.expiresAt && new Date(parsed.expiresAt) < now) {
                    return { ...DEFAULT_LICENSE };
                }
                return parsed;
            }
        } catch { /* ignore corrupt storage */ }
        return { ...DEFAULT_LICENSE };
    });

    // Persist to localStorage on any change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
    }, [license]);

    const currentPlan = PLANS.find(p => p.id === license.planId) || PLANS[0];
    const isPaid = license.planId !== 'free';
    const isProOrAbove = ['professional', 'enterprise'].includes(license.planId);
    const isEnterprise = license.planId === 'enterprise';

    const checksRemaining = currentPlan.checksPerMonth === -1
        ? Infinity
        : Math.max(0, currentPlan.checksPerMonth - license.checksUsedThisMonth);

    const canExport = isPaid && checksRemaining > 0;

    const activatePlan = useCallback((planId: string, txId?: string) => {
        const now = new Date();
        const expires = new Date();
        expires.setDate(expires.getDate() + 30); // 30-day billing cycle
        setLicense({
            planId,
            activatedAt: now.toISOString(),
            expiresAt: expires.toISOString(),
            checksUsedThisMonth: 0,
            monthResetDate: now.toISOString(),
            paymentTxId: txId || null
        });
    }, []);

    const useCheckExport = useCallback((): boolean => {
        if (!isPaid) return false;
        if (currentPlan.checksPerMonth !== -1 && checksRemaining <= 0) return false;
        setLicense(prev => ({
            ...prev,
            checksUsedThisMonth: prev.checksUsedThisMonth + 1
        }));
        return true;
    }, [isPaid, checksRemaining, currentPlan.checksPerMonth]);

    const resetToFree = useCallback(() => {
        setLicense({ ...DEFAULT_LICENSE });
    }, []);

    const validateAdminPassword = useCallback((password: string): boolean => {
        // Simple secure check - in production use bcrypt/argon2
        // Default password for owner: "admin_secret_88"
        return password === 'admin_secret_88';
    }, []);

    return (
        <LicenseContext.Provider value={{
            license,
            currentPlan,
            isPaid,
            isProOrAbove,
            isEnterprise,
            checksRemaining,
            canExport,
            activatePlan,
            useCheckExport,
            resetToFree,
            validateAdminPassword
        }}>
            {children}
        </LicenseContext.Provider>
    );
};

export default LicenseContext;
