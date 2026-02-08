// API Configuration
const API_BASE_URL = import.meta.env.MODE === 'production'
    ? '' // Production: same origin
    : 'http://localhost:5191'; // Development: ASP.NET Core dev server

import type { UserRole, SystemSettings, Announcement, Shelter, ShelterApi, Evacuee, EvacueeApi, ShelterResourceApi, ShelterReportApi, ShelterRegistrationRequestApi } from './types';

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
        resources: s.shelterResources ? s.shelterResources.map(r => `${r.resourceType}: ${r.quantity}`) : resources,
        evacuees: s.evacuees ? s.evacuees.map(mapEvacueeApiToEvacuee) : evacuees,
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

// Resource Management API
export const resourceApi = {
    getWarehouses: () => apiClient.get<Array<{ warehouseId: string; name: string; address: string; managedBy?: string | null }>>('/api/resources/warehouses'),

    getMyWarehouse: () => apiClient.get<{ warehouseId: string; name: string; address: string; managedBy?: string | null }>('/api/resources/warehouses/my-warehouse'),

    updateWarehouse: (warehouseId: string, data: { name?: string; address?: string; managedBy?: string | null }) =>
        apiClient.put(`/api/resources/warehouses/${encodeURIComponent(warehouseId)}`, data),

    getResources: (warehouseId?: string, status?: string) => {
        const params = new URLSearchParams();
        if (warehouseId) params.set('warehouseId', warehouseId);
        if (status) params.set('status', status);
        return apiClient.get<Array<{
            resourceItemId: string;
            warehouseId: string;
            warehouseName: string;
            name: string;
            type: string;
            unit: string;
            quantity: number;
            status: string;
            createdAt: string;
            updatedAt: string;
        }>>(`/api/resources?${params.toString()}`);
    },

    getOverallQuantity: () => apiClient.get<{
        byItem: Array<{ name: string; type: string; unit: string; totalQuantity: number; byWarehouse: Array<{ warehouseId: string; warehouseName: string; totalQuantity: number }> }>;
        byWarehouse: unknown;
    }>('/api/resources/overall-quantity'),

    getResource: (resourceItemId: string) =>
        apiClient.get<{
            resourceItemId: string;
            warehouseId: string;
            warehouseName: string;
            name: string;
            type: string;
            unit: string;
            quantity: number;
            status: string;
            createdAt: string;
            updatedAt: string;
        }>(`/api/resources/${encodeURIComponent(resourceItemId)}`),

    createResource: (data: { warehouseId: string; name: string; type: string; unit?: string; quantity: number; status?: string }) =>
        apiClient.post('/api/resources', data),

    updateResource: (resourceItemId: string, data: { name?: string; type?: string; unit?: string; quantity?: number; status?: string; warehouseId?: string }) =>
        apiClient.put(`/api/resources/${encodeURIComponent(resourceItemId)}`, data),

    deleteResource: (resourceItemId: string) =>
        apiClient.delete(`/api/resources/${encodeURIComponent(resourceItemId)}`),

    stockIn: (resourceItemId: string, data: { quantityAdded: number; source: string }) =>
        apiClient.post(`/api/resources/${encodeURIComponent(resourceItemId)}/stock-in`, data),

    getStockLogs: (resourceItemId: string) =>
        apiClient.get<Array<{ resourceStockLogId: string; quantityAdded: number; source: string; loggedBy: string; loggedAt: string }>>(
            `/api/resources/${encodeURIComponent(resourceItemId)}/stock-logs`
        ),

    getResourceRequests: (status?: string, myOnly?: boolean) => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (myOnly !== undefined) params.set('myOnly', String(myOnly));
        return apiClient.get<Array<{
            resourceRequestId: string;
            resourceItemId: string;
            warehouseId: string;
            warehouseName: string;
            requestedBy: string;
            itemName: string;
            type: string;
            quantity: number;
            unit: string;
            destination: string;
            urgency: string;
            status: string;
            rejectionReason?: string;
            assignedDriverId?: string;
            driverName?: string;
            processedBy?: string;
            requestedAt: string;
            processedAt?: string;
            updatedAt: string;
        }>>(`/api/resources/requests?${params.toString()}`);
    },

    createResourceRequest: (data: { resourceItemId: string; quantity: number; destination?: string; urgency?: string }) =>
        apiClient.post('/api/resources/requests', data),

    approveResourceRequest: (requestId: string) =>
        apiClient.post(`/api/resources/requests/${encodeURIComponent(requestId)}/approve`),

    rejectResourceRequest: (requestId: string, rejectionReason: string) =>
        apiClient.post(`/api/resources/requests/${encodeURIComponent(requestId)}/reject`, { rejectionReason }),

    assignDriver: (requestId: string, driverId: string) =>
        apiClient.post(`/api/resources/requests/${encodeURIComponent(requestId)}/assign-driver`, { driverId }),

    markDelivered: (requestId: string) =>
        apiClient.post(`/api/resources/requests/${encodeURIComponent(requestId)}/mark-delivered`),

    getDrivers: () =>
        apiClient.get<Array<{ driverId: string; name: string; phone: string; vehicleInfo: string; status: string }>>('/api/resources/drivers'),

    getUsageReport: () =>
        apiClient.get<Array<{
            reportId: string;
            warehouseId: string;
            warehouseName: string;
            resourceItemId: string;
            itemName: string;
            type: string;
            quantity: number;
            unit: string;
            status: string;
            requestsCount: number;
            deliveredCount: number;
            generatedAt: string;
        }>>('/api/resources/usage-report'),
};

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

    getRegistrationRequests: (myOnly = false) =>
        apiClient.get<ShelterRegistrationRequestApi[]>(`/api/shelters/registration-requests?myOnly=${myOnly}`),

    createRegistrationRequest: (data: { shelterName: string; address: string; totalCapacity: number }) =>
        apiClient.post<ShelterRegistrationRequestApi>('/api/shelters/registration-requests', {
            requestId: '',
            requestedBy: '',
            shelterName: data.shelterName,
            address: data.address,
            totalCapacity: data.totalCapacity,
            status: 'Pending',
            requestedAt: new Date().toISOString(),
        }),

    approveRegistrationRequest: (requestId: string) =>
        apiClient.post<Shelter>(`/api/shelters/registration-requests/${encodeURIComponent(requestId)}/approve`),

    rejectRegistrationRequest: (requestId: string, rejectionReason?: string) =>
        apiClient.post<void>(`/api/shelters/registration-requests/${encodeURIComponent(requestId)}/reject`, { rejectionReason: rejectionReason ?? null }),
};
