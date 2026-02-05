// API Configuration
const API_BASE_URL = import.meta.env.MODE === 'production'
    ? '' // Production: same origin
    : 'http://localhost:5000'; // Development: ASP.NET Core dev server

// API Client with JWT token support
class ApiClient {
    private getAuthHeader(): HeadersInit {
        const token = localStorage.getItem('authToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Network error occurred');
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }
}

export const apiClient = new ApiClient();

// API Endpoints
export const authApi = {
    login: (userId: string, password: string) =>
        apiClient.post<{
            token: string;
            userId: string;
            name: string;
            email: string;
            role: string;
            phone: string;
        }>('/api/account/login', { userId, password }),

    register: (data: {
        userId: string;
        password: string;
        name: string;
        email: string;
        phone: string;
        role: string;
    }) => apiClient.post<{ message: string }>('/api/account/register', data),

    getCurrentUser: () =>
        apiClient.get<{
            userId: string;
            name: string;
            email: string;
            role: string;
            phone: string;
        }>('/api/account/me'),

    logout: () => apiClient.post<{ message: string }>('/api/account/logout'),
};
