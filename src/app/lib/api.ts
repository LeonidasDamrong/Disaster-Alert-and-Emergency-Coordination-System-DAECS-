// API Configuration
const API_BASE_URL = import.meta.env.MODE === 'production'
    ? '' // Production: same origin
    : 'http://localhost:5191'; // Development: ASP.NET Core dev server

import type { UserRole, SystemSettings, Announcement, Shelter, ShelterApi, Evacuee, EvacueeApi, ShelterResourceApi, ShelterReportApi } from './types';

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

// Map backend shelter to UI Shelter (without evacuees/resources - load separately)
function mapShelterApiToShelter(s: ShelterApi, evacuees: Evacuee[] = [], resources: string[] = []): Shelter {
    return {
        id: s.shelterId,
        name: s.shelterName,
        location: s.address,
        TotalCapacity: s.totalCapacity,
        currentOccupancy: s.totalCapacity - s.availableCapacity,
        status: (s.status as Shelter['status']) || 'Open',
        manager: s.managedBy ?? '',
        phone: '',
        resources,
        evacuees,
        createdAt: s.registeredAt
    };
}

function mapEvacueeApiToEvacuee(e: EvacueeApi): Evacuee {
    return {
        id: e.evacueeId,
        name: e.evacueeName,
        age: e.evacueeAge,
        gender: e.evacueeGender,
        phone: e.evacueePhone ?? '',
        checkinDate: e.evacueeCheckInDate,
        medicalNeeds: e.evacueeMedicalNeeds ?? undefined,
        idNumber: e.evacueeIdNumber ?? undefined
    };
}

export const shelterApi = {
    getAll: async (): Promise<Shelter[]> => {
        const list = await apiClient.get<ShelterApi[]>('/api/shelters');
        return list.map(s => mapShelterApiToShelter(s));
    },

    /** Returns the shelter assigned to the current user (Shelter Manager), or null if none. */
    getMyShelter: async (): Promise<Shelter | null> => {
        try {
            const raw = await apiClient.get<ShelterApi>('/api/shelters/my-shelter');
            return mapShelterApiToShelter(raw);
        } catch {
            return null;
        }
    },

    getById: (shelterId: string) =>
        apiClient.get<ShelterApi>(`/api/shelters/${encodeURIComponent(shelterId)}`),

    getWithDetails: async (shelterId: string): Promise<{ shelter: Shelter; evacuees: Evacuee[]; resources: ShelterResourceApi[] }> => {
        const raw = await apiClient.get<{ shelter: ShelterApi; evacuees: EvacueeApi[]; resources: ShelterResourceApi[] }>(
            `/api/shelters/${encodeURIComponent(shelterId)}/full`
        );
        const evacuees = raw.evacuees.map(mapEvacueeApiToEvacuee);
        const resources = raw.resources.map(r => `${r.resourceType}: ${r.quantity}`);
        return {
            shelter: mapShelterApiToShelter(raw.shelter, evacuees, resources),
            evacuees,
            resources: raw.resources
        };
    },

    create: (data: { shelterName: string; address: string; totalCapacity: number; status?: string; managedBy?: string | null }) =>
        apiClient.post<ShelterApi>('/api/shelters', {
            shelterName: data.shelterName,
            address: data.address,
            totalCapacity: data.totalCapacity,
            availableCapacity: data.totalCapacity,
            status: data.status ?? 'Open',
            managedBy: data.managedBy ?? null
        }),

    update: (shelterId: string, data: Partial<ShelterApi>) =>
        apiClient.put<void>(`/api/shelters/${encodeURIComponent(shelterId)}`, data),

    delete: (shelterId: string) =>
        apiClient.delete<void>(`/api/shelters/${encodeURIComponent(shelterId)}`),

    getEvacuees: async (shelterId: string, activeOnly = true): Promise<Evacuee[]> => {
        const list = await apiClient.get<EvacueeApi[]>(
            `/api/shelters/${encodeURIComponent(shelterId)}/evacuees?activeOnly=${activeOnly}`
        );
        return list.map(mapEvacueeApiToEvacuee);
    },

    registerEvacuee: (shelterId: string, data: { evacueeName: string; evacueeGender: string; evacueeAge: number; evacueePhone?: string; evacueeIdNumber?: string; evacueeMedicalNeeds?: string }) =>
        apiClient.post<EvacueeApi>(`/api/shelters/${encodeURIComponent(shelterId)}/evacuees`, {
            evacueeId: '',
            shelterId,
            evacueeName: data.evacueeName,
            evacueeIdNumber: data.evacueeIdNumber ?? null,
            evacueeGender: data.evacueeGender,
            evacueeAge: data.evacueeAge,
            evacueePhone: data.evacueePhone ?? null,
            evacueeMedicalNeeds: data.evacueeMedicalNeeds ?? null,
            evacueeCheckInDate: new Date().toISOString(),
            evacueeCheckOutDate: null
        }),

    checkoutEvacuee: (shelterId: string, evacueeId: string) =>
        apiClient.post<void>(`/api/shelters/${encodeURIComponent(shelterId)}/evacuees/${encodeURIComponent(evacueeId)}/checkout`),

    getResources: (shelterId: string) =>
        apiClient.get<ShelterResourceApi[]>(`/api/shelters/${encodeURIComponent(shelterId)}/resources`),

    addResource: (shelterId: string, data: { resourceType: string; quantity: number; resourceItemId?: string }) =>
        apiClient.post<ShelterResourceApi>(`/api/shelters/${encodeURIComponent(shelterId)}/resources`, {
            shelterId,
            resourceType: data.resourceType,
            quantity: data.quantity,
            resourceItemId: data.resourceItemId ?? null
        }),

    updateResource: (shelterId: string, resourceId: string, data: { resourceType: string; quantity: number }) =>
        apiClient.put<void>(`/api/shelters/${encodeURIComponent(shelterId)}/resources/${encodeURIComponent(resourceId)}`, {
            shelterResourceId: resourceId,
            shelterId,
            resourceType: data.resourceType,
            quantity: data.quantity
        }),

    deleteResource: (shelterId: string, resourceId: string) =>
        apiClient.delete<void>(`/api/shelters/${encodeURIComponent(shelterId)}/resources/${encodeURIComponent(resourceId)}`),

    getReports: (shelterId: string) =>
        apiClient.get<ShelterReportApi[]>(`/api/shelters/${encodeURIComponent(shelterId)}/reports`),

    generateReport: (shelterId: string) =>
        (apiClient.post)<ShelterReportApi>(`/api/shelters/${encodeURIComponent(shelterId)}/reports`),
};
