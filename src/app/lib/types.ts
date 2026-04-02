// User and Authentication Types
export type UserRole = 'System Admin' | 'Admin' | 'First Responder' | 'Shelter Manager' | 'Resource Manager' | 'Disaster Manager';

export interface User {
  id: string;
  userId: string;
  password?: string; // Optional - not returned from API for security
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  createdAt: string;
}

// SOS Types
export type SOSStatus = 'New' | 'In Progress' | 'Completed';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface SOS {
  id: string;
  victimName: string;
  victimPhone: string;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  urgency: UrgencyLevel;
  status: SOSStatus;
  assignedResponder?: string;
  completionProofImageUrl?: string | null;
  completionProofUploadedAt?: string | null;
  completionProofUploadedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  notes: CaseNote[];
}

export interface CaseNote {
  id: string;
  author: string;
  timestamp: string;
  note: string;
}

// Alert Types
export type AlertType = 'Emergency' | 'Warning' | 'Information' | 'All Clear';
export type AlertStatus = 'Sent' | 'Scheduled' | 'Canceled';

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  targetAudience: string;
  status: AlertStatus;
  createdBy: string;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
}

// Shelter Types
export type ShelterStatus = 'Open' | 'Full' | 'Closed';

export interface Shelter {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  TotalCapacity: number;
  currentOccupancy: number;
  status: ShelterStatus;
  manager: string;
  phone: string;
  resources: string[];
  evacuees: Evacuee[];
  createdAt: string;
}

export interface Evacuee {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  checkinDate: string;
  medicalNeeds?: string;
  idNumber?: string;
}

// Backend API shapes for shelter module
export interface ShelterApi {
  shelterId: string;
  shelterName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  totalCapacity: number;
  availableCapacity: number;
  status: string;
  managedBy?: string | null;
  registeredAt: string;
  lastModifiedAt: string;
  shelterResources?: { resourceType: string; quantity: number }[];
  evacuees?: EvacueeApi[];
}

export interface EvacueeApi {
  evacueeId: string;
  shelterId: string;
  evacueeName: string;
  evacueeIdNumber?: string | null;
  evacueeGender: string;
  evacueeAge: number;
  evacueePhone?: string | null;
  evacueeMedicalNeeds?: string | null;
  evacueeCheckInDate: string;
  evacueeCheckOutDate?: string | null;
}

export interface ShelterResourceApi {
  shelterResourceId: string;
  shelterId: string;
  resourceItemId?: string | null;
  resourceType: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShelterReportApi {
  shelterReportId: string;
  shelterId: string;
  name: string;
  location: string;
  totalCapacity: number;
  availableCapacity: number;
  status: string;
  resourceSummary: string;
  generatedAt: string;
}

export interface ShelterRegistrationRequestApi {
  requestId: string;
  requestedBy: string;
  shelterName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  totalCapacity: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  processedAt?: string | null;
  processedBy?: string | null;
  rejectionReason?: string | null;
}

// Resource Types
export type ResourceStatus = 'Pending' | 'Approved' | 'Rejected' | 'Delivered';
export type ResourceCategory = 'Food' | 'Medical' | 'Shelter Supplies' | 'Equipment' | 'Transport' | 'Water' | 'Supplies' | 'Shelter';

export interface Resource {
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
}

export interface ResourceRequest {
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
  urgency: UrgencyLevel;
  status: ResourceStatus;
  rejectionReason?: string;
  assignedDriverId?: string;
  driverName?: string;
  processedBy?: string;
  requestedAt: string;
  processedAt?: string;
  updatedAt: string;
}

export interface Warehouse {
  warehouseId: string;
  name: string;
  address: string;
  managedBy?: string | null;
}

export interface Driver {
  driverId: string;
  name: string;
  phone: string;
  vehicleInfo: string;
  status: string;
}

export interface ResourceUsageReport {
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
}

// Audit Log Types
export interface AuditLog {
  id: string;
  username: string;
  name: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

// System Settings Types
export interface SystemSettings {
  id?: number;
  systemName: string;
  organizationName: string;
  enableNotifications: boolean;
  emergencyContactNumber: string;
  updatedAt?: string;
  // properties not yet in backend
  enableSMS?: boolean;
  maintenanceMode?: boolean;
}

// Announcement Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}
