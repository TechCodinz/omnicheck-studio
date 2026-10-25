import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiUrl } from '../config';

export interface User {
    id: number | string;
    email: string;
    role: 'user' | 'admin';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    authModalOpen: boolean;
    authModalMode: 'login' | 'register';
    openAuthModal: (mode?: 'login' | 'register') => void;
    closeAuthModal: () => void;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';
const USER_KEY = 'user_data';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem(USER_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return null;
            }
        }
        return null;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

    const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
        setAuthModalMode(mode);
        setAuthModalOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setAuthModalOpen(false);
    }, []);

    const handleAuthSuccess = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        closeAuthModal();
    };

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            const response = await fetch(apiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                return { success: false, error: data.error || 'Login failed. Please check your credentials.' };
            }

            handleAuthSuccess(data.token, data.user);
            return { success: true };
        } catch (err: any) {
            console.error('Login request error:', err);
            return { success: false, error: err.message || 'Network error connecting to auth server.' };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            const response = await fetch(apiUrl('/api/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                return { success: false, error: data.error || 'Registration failed.' };
            }

            handleAuthSuccess(data.token, data.user);
            return { success: true };
        } catch (err: any) {
            console.error('Registration request error:', err);
            return { success: false, error: err.message || 'Network error connecting to auth server.' };
        } finally {
            setIsLoading(false);
        }
    };

    const isAuthenticated = Boolean(token && user);
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            isAdmin,
            isLoading,
            authModalOpen,
            authModalMode,
            openAuthModal,
            closeAuthModal,
            login,
            register,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
