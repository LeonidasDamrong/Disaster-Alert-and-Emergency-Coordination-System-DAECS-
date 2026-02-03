import type { User, SOS, Alert, Shelter, Resource, ResourceRequest, AuditLog, SystemSettings, Announcement } from './types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    userId: 'admin001',
    password: 'admin123',
    name: 'Ahmad bin Abdullah',
    role: 'Admin',
    email: 'ahmad@daecs.gov.my',
    phone: '+60123456789',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    userId: 'officer001',
    password: 'officer123',
    name: 'Siti Nurhaliza',
    role: 'Emergency Officer',
    email: 'siti@daecs.gov.my',
    phone: '+60123456790',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: '3',
    userId: 'shelter001',
    password: 'shelter123',
    name: 'Kumar Rajendran',
    role: 'Shelter Manager',
    email: 'kumar@daecs.gov.my',
    phone: '+60123456791',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: '4',
    userId: 'resource001',
    password: 'resource123',
    name: 'Tan Mei Ling',
    role: 'Resource Manager',
    email: 'tan@daecs.gov.my',
    phone: '+60123456792',
    createdAt: '2024-01-15T08:00:00Z'
  }
];

// Mock SOS Requests
export const mockSOSRequests: SOS[] = [
  {
    id: 'SOS001',
    victimName: 'Lee Wei Ming',
    victimPhone: '+60198765432',
    location: 'Kampung Baru, Kuala Lumpur',
    latitude: 3.1642,
    longitude: 101.7041,
    description: 'Trapped in flooded area, water level rising rapidly. Family of 4 including elderly parents.',
    urgency: 'Critical',
    status: 'New',
    createdAt: '2024-12-19T10:30:00Z',
    updatedAt: '2024-12-19T10:30:00Z',
    notes: []
  },
  {
    id: 'SOS002',
    victimName: 'Fatimah binti Hassan',
    victimPhone: '+60187654321',
    location: 'Taman Melati, Selangor',
    latitude: 3.2118,
    longitude: 101.7371,
    description: 'Medical emergency - elderly person needs medication and evacuation',
    urgency: 'High',
    status: 'In Progress',
    assignedOfficer: 'Siti Nurhaliza',
    createdAt: '2024-12-19T09:15:00Z',
    updatedAt: '2024-12-19T10:00:00Z',
    notes: [
      {
        id: 'NOTE001',
        author: 'Siti Nurhaliza',
        timestamp: '2024-12-19T10:00:00Z',
        note: 'Rescue team dispatched. ETA 20 minutes.'
      }
    ]
  },
  {
    id: 'SOS003',
    victimName: 'Wong Ah Kau',
    victimPhone: '+60176543210',
    location: 'Georgetown, Penang',
    latitude: 5.4141,
    longitude: 100.3288,
    description: 'Landslide blocking road access, need evacuation',
    urgency: 'Medium',
    status: 'In Progress',
    assignedOfficer: 'Ahmad bin Abdullah',
    createdAt: '2024-12-19T08:45:00Z',
    updatedAt: '2024-12-19T09:30:00Z',
    notes: [
      {
        id: 'NOTE002',
        author: 'Ahmad bin Abdullah',
        timestamp: '2024-12-19T09:30:00Z',
        note: 'Road clearance team coordinated. Alternative evacuation route identified.'
      }
    ]
  },
  {
    id: 'SOS004',
    victimName: 'Raju a/l Muthu',
    victimPhone: '+60165432109',
    location: 'Johor Bahru',
    latitude: 1.4927,
    longitude: 103.7414,
    description: 'Lost contact with family members during evacuation',
    urgency: 'Low',
    status: 'Completed',
    assignedOfficer: 'Siti Nurhaliza',
    createdAt: '2024-12-18T14:20:00Z',
    updatedAt: '2024-12-19T08:00:00Z',
    notes: [
      {
        id: 'NOTE003',
        author: 'Siti Nurhaliza',
        timestamp: '2024-12-19T08:00:00Z',
        note: 'Family located at Sekolah Kebangsaan Johor Jaya shelter. Case closed.'
      }
    ]
  }
];

// Mock Alerts
export const mockAlerts: Alert[] = [
  {
    id: 'ALERT001',
    title: 'Flash Flood Warning - Kuala Lumpur',
    message: 'Heavy rainfall expected in the next 2 hours. Residents in low-lying areas are advised to move to higher ground immediately.',
    type: 'Warning',
    targetAudience: 'Kuala Lumpur, Selangor',
    status: 'Sent',
    createdBy: 'Ahmad bin Abdullah',
    sentAt: '2024-12-19T10:00:00Z',
    createdAt: '2024-12-19T09:55:00Z'
  },
  {
    id: 'ALERT002',
    title: 'Evacuation Order - Kampung Baru',
    message: 'Mandatory evacuation for Kampung Baru area. Report to nearest designated shelter immediately. Bring essential documents and medications.',
    type: 'Emergency',
    targetAudience: 'Kampung Baru residents',
    status: 'Sent',
    createdBy: 'Ahmad bin Abdullah',
    sentAt: '2024-12-19T10:15:00Z',
    createdAt: '2024-12-19T10:10:00Z'
  },
  {
    id: 'ALERT003',
    title: 'Shelter Opening Notification',
    message: 'Additional shelter facilities now open at Dewan Komuniti Taman Melati. Capacity for 200 evacuees.',
    type: 'Information',
    targetAudience: 'All Districts',
    status: 'Scheduled',
    createdBy: 'Kumar Rajendran',
    scheduledFor: '2024-12-19T14:00:00Z',
    createdAt: '2024-12-19T10:30:00Z'
  },
  {
    id: 'ALERT004',
    title: 'Weather Update',
    message: 'Storm warning canceled. Weather conditions improving.',
    type: 'All Clear',
    targetAudience: 'Penang',
    status: 'Canceled',
    createdBy: 'Ahmad bin Abdullah',
    createdAt: '2024-12-19T09:00:00Z'
  }
];

// Mock Shelters
export const mockShelters: Shelter[] = [
  {
    id: 'SHELTER001',
    name: 'Dewan Orang Ramai Kampung Baru',
    location: 'Jalan Raja Abdullah, Kampung Baru, KL',
    capacity: 300,
    currentOccupancy: 187,
    status: 'Open',
    manager: 'Kumar Rajendran',
    phone: '+60123456791',
    resources: ['Food', 'Medical', 'Blankets', 'Water'],
    evacuees: [
      {
        id: 'EV001',
        name: 'Aminah binti Ismail',
        age: 45,
        gender: 'Female',
        phone: '+60123333444',
        checkinDate: '2024-12-19T08:00:00Z',
        medicalNeeds: 'Diabetes medication'
      },
      {
        id: 'EV002',
        name: 'Ibrahim bin Ahmad',
        age: 67,
        gender: 'Male',
        phone: '+60123333445',
        checkinDate: '2024-12-19T08:30:00Z',
        medicalNeeds: 'High blood pressure'
      }
    ],
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'SHELTER002',
    name: 'Sekolah Kebangsaan Taman Melati',
    location: 'Taman Melati, Selangor',
    capacity: 500,
    currentOccupancy: 456,
    status: 'Open',
    manager: 'Kumar Rajendran',
    phone: '+60123456791',
    resources: ['Food', 'Medical', 'Blankets', 'Water', 'Generators'],
    evacuees: [],
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'SHELTER003',
    name: 'Dewan Komuniti Georgetown',
    location: 'Georgetown, Penang',
    capacity: 250,
    currentOccupancy: 250,
    status: 'Full',
    manager: 'Lee Chong Wei',
    phone: '+60123456793',
    resources: ['Food', 'Water', 'Blankets'],
    evacuees: [],
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'SHELTER004',
    name: 'Pusat Komuniti Johor Jaya',
    location: 'Johor Bahru',
    capacity: 200,
    currentOccupancy: 0,
    status: 'Closed',
    manager: 'Tan Mei Ling',
    phone: '+60123456792',
    resources: [],
    evacuees: [],
    createdAt: '2024-01-15T08:00:00Z'
  }
];

// Mock Resources
export const mockResources: Resource[] = [
  {
    id: 'RES001',
    category: 'Food',
    itemName: 'Rice (bags)',
    quantity: 500,
    unit: 'kg',
    location: 'Central Warehouse KL'
  },
  {
    id: 'RES002',
    category: 'Medical',
    itemName: 'First Aid Kits',
    quantity: 150,
    unit: 'units',
    location: 'Central Warehouse KL'
  },
  {
    id: 'RES003',
    category: 'Shelter Supplies',
    itemName: 'Blankets',
    quantity: 1000,
    unit: 'pieces',
    location: 'Central Warehouse KL'
  },
  {
    id: 'RES004',
    category: 'Equipment',
    itemName: 'Portable Generators',
    quantity: 25,
    unit: 'units',
    location: 'Equipment Depot Selangor'
  },
  {
    id: 'RES005',
    category: 'Food',
    itemName: 'Drinking Water (bottles)',
    quantity: 5000,
    unit: 'liters',
    location: 'Central Warehouse KL'
  }
];

// Mock Resource Requests
export const mockResourceRequests: ResourceRequest[] = [
  {
    id: 'REQ001',
    requestedBy: 'Kumar Rajendran',
    category: 'Food',
    itemName: 'Rice',
    quantity: 100,
    unit: 'kg',
    destination: 'Dewan Orang Ramai Kampung Baru',
    urgency: 'High',
    status: 'Pending',
    requestedAt: '2024-12-19T10:45:00Z'
  },
  {
    id: 'REQ002',
    requestedBy: 'Lee Chong Wei',
    category: 'Medical',
    itemName: 'First Aid Kits',
    quantity: 20,
    unit: 'units',
    destination: 'Dewan Komuniti Georgetown',
    urgency: 'Critical',
    status: 'Approved',
    assignedTeam: 'Team Alpha',
    requestedAt: '2024-12-19T09:30:00Z',
    processedAt: '2024-12-19T09:45:00Z'
  },
  {
    id: 'REQ003',
    requestedBy: 'Tan Mei Ling',
    category: 'Equipment',
    itemName: 'Portable Generators',
    quantity: 3,
    unit: 'units',
    destination: 'Sekolah Kebangsaan Taman Melati',
    urgency: 'Medium',
    status: 'Delivered',
    assignedTeam: 'Team Bravo',
    requestedAt: '2024-12-19T08:00:00Z',
    processedAt: '2024-12-19T10:30:00Z'
  },
  {
    id: 'REQ004',
    requestedBy: 'Kumar Rajendran',
    category: 'Food',
    itemName: 'Canned Food',
    quantity: 500,
    unit: 'cans',
    destination: 'Dewan Orang Ramai Kampung Baru',
    urgency: 'Low',
    status: 'Rejected',
    rejectionNote: 'Insufficient stock. Alternative items will be provided.',
    requestedAt: '2024-12-19T07:00:00Z',
    processedAt: '2024-12-19T08:15:00Z'
  }
];

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'LOG001',
    userId: '1',
    userName: 'Ahmad bin Abdullah',
    action: 'Create User',
    module: 'Admin Management',
    details: 'Created new user: officer002',
    timestamp: '2024-12-19T10:30:00Z'
  },
  {
    id: 'LOG002',
    userId: '2',
    userName: 'Siti Nurhaliza',
    action: 'Update SOS Status',
    module: 'SOS Monitoring',
    details: 'Changed SOS002 status from New to In Progress',
    timestamp: '2024-12-19T10:00:00Z'
  },
  {
    id: 'LOG003',
    userId: '1',
    userName: 'Ahmad bin Abdullah',
    action: 'Send Alert',
    module: 'Alert Broadcasting',
    details: 'Broadcast emergency alert: ALERT002',
    timestamp: '2024-12-19T10:15:00Z'
  },
  {
    id: 'LOG004',
    userId: '3',
    userName: 'Kumar Rajendran',
    action: 'Register Evacuee',
    module: 'Shelter Management',
    details: 'Registered evacuee EV001 at SHELTER001',
    timestamp: '2024-12-19T08:00:00Z'
  },
  {
    id: 'LOG005',
    userId: '4',
    userName: 'Tan Mei Ling',
    action: 'Approve Resource Request',
    module: 'Resource Management',
    details: 'Approved request REQ002 and assigned to Team Alpha',
    timestamp: '2024-12-19T09:45:00Z'
  }
];

// Mock System Settings
export const mockSystemSettings: SystemSettings = {
  systemName: 'DAECS - Disaster Alert and Emergency Coordination System',
  organizationName: 'Malaysian National Disaster Management Agency',
  enableNotifications: true,
  enableSMS: true,
  emergencyContactNumber: '+60-3-8000-8000',
  maintenanceMode: false
};

// Mock Announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: 'ANN001',
    title: 'System Maintenance Scheduled',
    content: 'System will undergo maintenance on 25th December 2024 from 02:00 AM to 04:00 AM.',
    priority: 'Medium',
    active: true,
    createdBy: 'Ahmad bin Abdullah',
    createdAt: '2024-12-15T10:00:00Z',
    expiresAt: '2024-12-26T00:00:00Z'
  },
  {
    id: 'ANN002',
    title: 'New Emergency Protocol',
    content: 'Updated emergency response protocols effective immediately. All officers please review the new guidelines.',
    priority: 'High',
    active: true,
    createdBy: 'Ahmad bin Abdullah',
    createdAt: '2024-12-10T08:00:00Z'
  }
];
