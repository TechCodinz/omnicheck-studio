import apiClient, { createAuthHeaders, getAuthToken } from '../services/apiClient';

global.fetch = jest.fn();

describe('API Client', () => {
    beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

    it('returns token from localStorage', () => {
        localStorage.setItem('token', 'test_token_123');
        expect(getAuthToken()).toBe('test_token_123');
    });

    it('includes Authorization header when token exists', () => {
        localStorage.setItem('token', 'test_token');
        const headers = createAuthHeaders();
        expect(headers['Authorization']).toBe('Bearer test_token');
    });

    it('includes credentials for cookie support on GET', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [] }) });
        await apiClient.get('/api/test');
        expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ credentials: 'include', method: 'GET' }));
    });

    it('handles network errors', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
        const result = await apiClient.get('/api/test');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
    });

    it('downloads PDF successfully', async () => {
        const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true, blob: async () => mockBlob,
            headers: { get: (name: string) => name === 'Content-Disposition' ? 'filename="test.pdf"' : null }
        });
        const result = await apiClient.downloadPdf({ checkNumber: '001', amount: 100 }, 'premium-1');
        expect(result.success).toBe(true);
        expect(result.blob).toBeDefined();
    });
});
