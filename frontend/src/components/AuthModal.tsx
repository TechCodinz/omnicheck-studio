import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiX, FiShield, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

export const AuthModal: React.FC = () => {
    const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

    const validateEmail = (value: string): string | undefined => {
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return undefined;
    };

    const validatePassword = (value: string): string | undefined => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (value.length > 128) return 'Password must be less than 128 characters';
        return undefined;
    };

    const handleBlur = (field: 'email' | 'password') => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const value = field === 'email' ? email : password;
        const error = field === 'email' ? validateEmail(value) : validatePassword(value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);
        if (emailError || passwordError) {
            setErrors({ email: emailError, password: passwordError });
            setTouched({ email: true, password: true });
            return;
        }
        const res = authModalMode === 'login' ? await login(email, password) : await register(email, password);
        if (!res.success) setErrors({ general: res.error || 'Authentication failed. Please try again.' });
        else { setEmail(''); setPassword(''); setErrors({}); setTouched({}); }
    };

    const handleSwitchMode = useCallback((mode: 'login' | 'register') => {
        setErrors({}); setTouched({}); openAuthModal(mode);
    }, [openAuthModal]);

    const handleClose = useCallback(() => {
        setEmail(''); setPassword(''); setErrors({}); setTouched({}); setShowPassword(false); closeAuthModal();
    }, [closeAuthModal]);

    if (!authModalOpen) return null;
    const isLogin = authModalMode === 'login';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <div className="relative w-full max-w-md bg-gradient-to-br from-surface-800 to-surface-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-slideUp">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                            <FiShield className="text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                            <p className="text-surface-500 text-xs">Secure check & document studio</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="w-8 h-8 rounded-lg bg-surface-700/50 text-surface-400 hover:text-white hover:bg-surface-700 flex items-center justify-center transition-all" aria-label="Close modal">
                        <FiX size={18} />
                    </button>
                </div>

                <div className="flex border-b border-white/[0.08]">
                    <button onClick={() => handleSwitchMode('login')} className={`flex-1 py-3 text-sm font-semibold transition-all relative ${isLogin ? 'text-primary-400' : 'text-surface-500 hover:text-surface-300'}`}>
                        Sign In {isLogin && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
                    </button>
                    <button onClick={() => handleSwitchMode('register')} className={`flex-1 py-3 text-sm font-semibold transition-all relative ${!isLogin ? 'text-primary-400' : 'text-surface-500 hover:text-surface-300'}`}>
                        Get Started {!isLogin && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {errors.general && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm animate-fadeIn">
                            <FiAlertCircle className="flex-shrink-0 mt-0.5" size={16} />
                            <span>{errors.general}</span>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                            <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" size={16} />
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => handleBlur('email')}
                                placeholder="name@business.com"
                                className={`w-full pl-10 pr-4 py-3 bg-surface-950/50 border rounded-xl text-white text-sm placeholder-surface-600 focus:outline-none focus:ring-2 transition-all ${touched.email && errors.email ? 'border-error-500/50 focus:ring-error-500/20 focus:border-error-500' : 'border-white/10 focus:ring-primary-500/20 focus:border-primary-500/50'}`}
                            />
                        </div>
                        {touched.email && errors.email && <p className="text-error-400 text-xs flex items-center gap-1 animate-fadeIn"><FiAlertCircle size={12} />{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-surface-300 uppercase tracking-wider">Password <span className="text-surface-600 font-normal normal-case">(min. 8 characters)</span></label>
                        <div className="relative">
                            <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" size={16} />
                            <input
                                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onBlur={() => handleBlur('password')}
                                placeholder="••••••••"
                                className={`w-full pl-10 pr-12 py-3 bg-surface-950/50 border rounded-xl text-white text-sm placeholder-surface-600 focus:outline-none focus:ring-2 transition-all ${touched.password && errors.password ? 'border-error-500/50 focus:ring-error-500/20 focus:border-error-500' : 'border-white/10 focus:ring-primary-500/20 focus:border-primary-500/50'}`}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        {touched.password && errors.password && <p className="text-error-400 text-xs flex items-center gap-1 animate-fadeIn"><FiAlertCircle size={12} />{errors.password}</p>}
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {isLoading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</> : <><FiCheckCircle size={18} />{isLogin ? 'Sign In Securely' : 'Create Free Account'}</>}
                    </button>

                    <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                        <span className="text-xs text-surface-500">Need a test account?</span>
                        <button type="button" onClick={() => { setEmail('demo@omnicheck.test'); setPassword('OmniCheck2026!'); setErrors({}); }} className="text-xs text-primary-400 hover:text-primary-300 font-medium px-3 py-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 transition-colors">
                            Prefill Demo
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-surface-600">
                        <FiShield size={12} />
                        <span>Secured with httpOnly cookies & bcrypt hashing</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthModal;
