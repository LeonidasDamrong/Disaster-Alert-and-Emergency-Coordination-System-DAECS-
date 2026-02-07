// User and Authentication Types
export type UserRole = 'Admin' | 'Emergency Officer' | 'Shelter Manager' | 'Resource Manager' | 'Disaster Manager';

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
  assignedOfficer?: string;
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
  capacity: number;
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
}

// Resource Types
export type ResourceStatus = 'Pending' | 'Approved' | 'Rejected' | 'Delivered';
export type ResourceCategory = 'Food' | 'Medical' | 'Shelter Supplies' | 'Equipment' | 'Transport';

export interface Resource {
  id: string;
  category: ResourceCategory;
  itemName: string;
  quantity: number;
  unit: string;
  location: string;
}

export interface ResourceRequest {
  id: string;
  requestedBy: string;
  category: ResourceCategory;
  itemName: string;
  quantity: number;
  unit: string;
  destination: string;
  urgency: UrgencyLevel;
  status: ResourceStatus;
  rejectionNote?: string;
  assignedTeam?: string;
  requestedAt: string;
  processedAt?: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

// System Settings Types
export interface SystemSettings {
  systemName: string;
  organizationName: string;
  enableNotifications: boolean;
  enableSMS: boolean;
  emergencyContactNumber: string;
  maintenanceMode: boolean;
}

// Announcement Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High';
  active: boolean;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}
