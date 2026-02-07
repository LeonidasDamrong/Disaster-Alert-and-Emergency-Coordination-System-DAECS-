// API Configuration
const API_BASE_URL = import.meta.env.MODE === 'production'
    ? '' // Production: same origin
    : 'http://localhost:5191'; // Development: ASP.NET Core dev server

import type { UserRole, SystemSettings, Announcement } from './types';

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

            if (response.status === 204) {
                return {} as T;
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

    async put<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
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

    getAllUsers: () =>
        apiClient.get<Array<{
            id: string;
            userId: string;
            name: string;
            email: string;
            phone: string;
            role: UserRole;
            createdAt: string;
        }>>('/api/account/users'),

    getRoles: () =>
        apiClient.get<string[]>('/api/account/roles'),

    getNextUserId: (role: string) =>
        apiClient.get<{ nextUserId: string }>(`/api/account/next-user-id?role=${encodeURIComponent(role)}`),

    updateUser: (userId: string, data: { name: string; email: string; phone: string }) =>
        apiClient.put<{ message: string }>(`/api/account/users/${encodeURIComponent(userId)}`, data),

    deleteUser: (userId: string) =>
        apiClient.delete<{ message: string }>(`/api/account/users/${encodeURIComponent(userId)}`),

    logout: () => apiClient.post<{ message: string }>('/api/account/logout'),
};

export const auditLogApi = {
    getAuditLogs: () =>
        apiClient.get<Array<{
            id: string;
            username: string;
            name: string;
            action: string;
            module: string;
            details: string;
            timestamp: string;
        }>>('/api/auditlog'),
};

export const systemSettingsApi = {
    getSettings: () => apiClient.get<SystemSettings>('/api/system-settings'),
    updateSettings: (settings: SystemSettings) => apiClient.put<void>('/api/system-settings', settings),
};

export const announcementApi = {
    getAll: () => apiClient.get<Announcement[]>('/api/announcements'),
    create: (announcement: Partial<Announcement>) => apiClient.post<Announcement>('/api/announcements', announcement),
    update: (id: string, announcement: Partial<Announcement>) => apiClient.put<void>(`/api/announcements/${id}`, announcement),
    delete: (id: string) => apiClient.delete<void>(`/api/announcements/${id}`)
};
