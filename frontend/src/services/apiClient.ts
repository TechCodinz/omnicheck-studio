import { apiUrl } from '../config';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
};

export const createAuthHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...additionalHeaders
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const apiClient = {
    async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(apiUrl(endpoint), {
                method: 'GET',
                headers: createAuthHeaders()
            });

            const data = await response.json();
            if (!response.ok) {
                return { success: false, error: data.error || `HTTP ${response.status}: ${response.statusText}` };
            }
            return { success: true, data };
        } catch (err: any) {
            return { success: false, error: err.message || 'Network request failed' };
        }
    },

    async post<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(apiUrl(endpoint), {
                method: 'POST',
                headers: createAuthHeaders(),
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) {
                return { success: false, error: data.error || `HTTP ${response.status}: ${response.statusText}` };
            }
            return { success: true, data };
        } catch (err: any) {
            return { success: false, error: err.message || 'Network request failed' };
        }
    },

    async downloadPdf(checkData: any, templateId: string = 'premium-1', options: any = {}): Promise<{ success: boolean; blob?: Blob; filename?: string; error?: string }> {
        try {
            const token = getAuthToken();
            if (!token) {
                return { success: false, error: 'Authentication required. Please sign in to generate bank-grade PDFs.' };
            }

            const response = await fetch(apiUrl('/api/generate-pdf'), {
                method: 'POST',
                headers: createAuthHeaders(),
                body: JSON.stringify({
                    templateId,
                    checkData,
                    options
                })
            });

            if (!response.ok) {
                let errorMsg = `Server error ${response.status}`;
                try {
                    const errJson = await response.json();
                    if (errJson.error) errorMsg = errJson.error;
                } catch {
                    // Not json
                }
                return { success: false, error: errorMsg };
            }

            const blob = await response.blob();
            const disposition = response.headers.get('Content-Disposition') || '';
            const match = disposition.match(/filename="?([^";]+)"?/);
            const filename = match ? match[1] : `check_${checkData.checkNumber || 'export'}.pdf`;

            return { success: true, blob, filename };
        } catch (err: any) {
            return { success: false, error: err.message || 'Failed to download PDF.' };
        }
    },

    // Invoicing & Merchant Payments
    async listInvoices() {
        return this.get('/api/invoices');
    },

    async createInvoice(data: any) {
        return this.post('/api/invoices', data);
    },

    async getInvoice(id: string) {
        try {
            const res = await fetch(apiUrl(`/api/invoices/${id}`));
            return await res.json();
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    async payInvoice(id: string, paymentMethod: string, paymentData: any) {
        try {
            const res = await fetch(apiUrl(`/api/invoices/${id}/pay`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethod, paymentData })
            });
            return await res.json();
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }
};

export default apiClient;
