import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import React from 'react';

global.fetch = jest.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
    beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

    it('initializes with unauthenticated state', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('opens auth modal in login mode', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        act(() => { result.current.openAuthModal('login'); });
        expect(result.current.authModalOpen).toBe(true);
        expect(result.current.authModalMode).toBe('login');
    });

    it('logs in successfully', async () => {
        const mockUser = { id: 1, email: 'test@example.com', role: 'user' as const };
        (global.fetch as jest.Mock)
            // AuthProvider probes /api/auth/me on mount (cookie session check)
            .mockResolvedValueOnce({ ok: false, json: async () => ({ success: false }) })
            .mockResolvedValueOnce({
                ok: true, json: async () => ({ success: true, token: 'mock_token', user: mockUser })
            });
        const { result } = renderHook(() => useAuth(), { wrapper });
        let loginResult;
        await act(async () => { loginResult = await result.current.login('test@example.com', 'password123'); });
        expect(loginResult).toEqual({ success: true });
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles login failure', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false, json: async () => ({ success: false, error: 'Invalid credentials' })
        });
        const { result } = renderHook(() => useAuth(), { wrapper });
        let loginResult;
        await act(async () => { loginResult = await result.current.login('wrong@example.com', 'wrong'); });
        expect(loginResult.success).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('sends credentials with login request', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true, json: async () => ({ success: true, token: 'mock_token', user: { id: 1, email: 'test@example.com', role: 'user' } })
        });
        const { result } = renderHook(() => useAuth(), { wrapper });
        await act(async () => { await result.current.login('test@example.com', 'password123'); });
        expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ credentials: 'include', method: 'POST' }));
    });

    it('logs out and clears state', async () => {
        const mockUser = { id: 1, email: 'test@example.com', role: 'user' as const };
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, token: 'mock_token', user: mockUser }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
        const { result } = renderHook(() => useAuth(), { wrapper });
        await act(async () => { await result.current.login('test@example.com', 'password123'); });
        await act(async () => { await result.current.logout(); });
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });
});
