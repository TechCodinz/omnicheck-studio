import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const AuthModal: React.FC = () => {
    const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!authModalOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        const res = authModalMode === 'login'
            ? await login(email, password)
            : await register(email, password);

        if (!res.success) {
            setError(res.error || 'Authentication failed. Please try again.');
        } else {
            setEmail('');
            setPassword('');
        }
    };

    const handleSwitchMode = (mode: 'login' | 'register') => {
        setError(null);
        openAuthModal(mode);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
        }} onClick={(e) => {
            if (e.target === e.currentTarget) closeAuthModal();
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #1f2937 0%, #111827 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                overflow: 'hidden',
                color: '#fff',
                fontFamily: 'Inter, system-ui, sans-serif'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 24px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #F97316, #FB923C)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                        }}>💰</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '17px', color: '#fff' }}>
                                {authModalMode === 'login' ? 'Sign In to OmniCheck' : 'Create Account'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                                Secure authenticated check & document vault
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={closeAuthModal}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9CA3AF',
                            cursor: 'pointer',
                            fontSize: '20px',
                            padding: '4px',
                            lineHeight: 1
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <button
                        onClick={() => handleSwitchMode('login')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: authModalMode === 'login' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                            border: 'none',
                            borderBottom: authModalMode === 'login' ? '2px solid #F97316' : '2px solid transparent',
                            color: authModalMode === 'login' ? '#F97316' : '#9CA3AF',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => handleSwitchMode('register')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: authModalMode === 'register' ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                            border: 'none',
                            borderBottom: authModalMode === 'register' ? '2px solid #F97316' : '2px solid transparent',
                            color: authModalMode === 'register' ? '#F97316' : '#9CA3AF',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        Register
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#FCA5A5',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            marginBottom: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#D1D5DB', marginBottom: '6px' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="name@business.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: '#111827',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#D1D5DB', marginBottom: '6px' }}>
                            Password <span style={{ color: '#6B7280', fontWeight: 400 }}>(min. 8 characters)</span>
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: '#111827',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '15px',
                            cursor: isLoading ? 'wait' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {isLoading ? 'Processing...' : (authModalMode === 'login' ? 'Sign In' : 'Create Free Account')}
                    </button>

                    {/* Quick Demo Fill */}
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Need a test account?</div>
                        <button
                            type="button"
                            onClick={() => {
                                setEmail('demo@omnicheck.test');
                                setPassword('OmniCheck2026!');
                            }}
                            style={{
                                background: 'transparent',
                                border: '1px solid #4B5563',
                                borderRadius: '4px',
                                color: '#F97316',
                                fontSize: '11px',
                                padding: '4px 8px',
                                cursor: 'pointer'
                            }}
                        >
                            Prefill Demo User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default AuthModal;
