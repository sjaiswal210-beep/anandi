export const APP_NAME = 'RealtyOS AI';
export const APP_VERSION = '1.0.0';

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BUILDER: 'BUILDER',
  AGENCY_OWNER: 'AGENCY_OWNER',
  SALES_MANAGER: 'SALES_MANAGER',
  SALES_EXECUTIVE: 'SALES_EXECUTIVE',
  MARKETING_EXECUTIVE: 'MARKETING_EXECUTIVE',
  FINANCE_EXECUTIVE: 'FINANCE_EXECUTIVE',
  CUSTOMER: 'CUSTOMER',
  GUEST: 'GUEST',
} as const;

export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  BUILDER: 90,
  AGENCY_OWNER: 80,
  SALES_MANAGER: 70,
  SALES_EXECUTIVE: 60,
  MARKETING_EXECUTIVE: 60,
  FINANCE_EXECUTIVE: 60,
  CUSTOMER: 20,
  GUEST: 10,
};

export const PERMISSIONS = {
  // Workspace
  WORKSPACE_MANAGE: 'workspace:manage',
  WORKSPACE_VIEW: 'workspace:view',
  WORKSPACE_BILLING: 'workspace:billing',

  // Users
  USERS_MANAGE: 'users:manage',
  USERS_VIEW: 'users:view',
  USERS_INVITE: 'users:invite',

  // Leads
  LEADS_CREATE: 'leads:create',
  LEADS_VIEW: 'leads:view',
  LEADS_VIEW_ALL: 'leads:view_all',
  LEADS_EDIT: 'leads:edit',
  LEADS_DELETE: 'leads:delete',
  LEADS_ASSIGN: 'leads:assign',
  LEADS_IMPORT: 'leads:import',
  LEADS_EXPORT: 'leads:export',

  // Properties
  PROPERTIES_CREATE: 'properties:create',
  PROPERTIES_VIEW: 'properties:view',
  PROPERTIES_EDIT: 'properties:edit',
  PROPERTIES_DELETE: 'properties:delete',

  // Bookings
  BOOKINGS_CREATE: 'bookings:create',
  BOOKINGS_VIEW: 'bookings:view',
  BOOKINGS_EDIT: 'bookings:edit',
  BOOKINGS_CANCEL: 'bookings:cancel',

  // Finance
  FINANCE_VIEW: 'finance:view',
  FINANCE_MANAGE: 'finance:manage',
  FINANCE_REPORTS: 'finance:reports',

  // Documents
  DOCUMENTS_UPLOAD: 'documents:upload',
  DOCUMENTS_VIEW: 'documents:view',
  DOCUMENTS_DELETE: 'documents:delete',

  // AI Agents
  AI_AGENTS_MANAGE: 'ai_agents:manage',
  AI_AGENTS_VIEW: 'ai_agents:view',
  AI_AGENTS_EXECUTE: 'ai_agents:execute',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Settings
  SETTINGS_MANAGE: 'settings:manage',
  SETTINGS_VIEW: 'settings:view',

  // Marketing
  MARKETING_MANAGE: 'marketing:manage',
  MARKETING_VIEW: 'marketing:view',

  // Site Visits
  VISITS_CREATE: 'visits:create',
  VISITS_VIEW: 'visits:view',
  VISITS_MANAGE: 'visits:manage',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  BUILDER: Object.values(PERMISSIONS),
  AGENCY_OWNER: Object.values(PERMISSIONS).filter(
    (p) => !p.startsWith('workspace:billing'),
  ),
  SALES_MANAGER: [
    PERMISSIONS.LEADS_CREATE, PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN, PERMISSIONS.LEADS_IMPORT,
    PERMISSIONS.LEADS_EXPORT, PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.BOOKINGS_CREATE, PERMISSIONS.BOOKINGS_VIEW, PERMISSIONS.BOOKINGS_EDIT,
    PERMISSIONS.VISITS_CREATE, PERMISSIONS.VISITS_VIEW, PERMISSIONS.VISITS_MANAGE,
    PERMISSIONS.DOCUMENTS_UPLOAD, PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.USERS_VIEW,
    PERMISSIONS.FINANCE_VIEW, PERMISSIONS.AI_AGENTS_VIEW, PERMISSIONS.AI_AGENTS_EXECUTE,
  ],
  SALES_EXECUTIVE: [
    PERMISSIONS.LEADS_CREATE, PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_EDIT,
    PERMISSIONS.PROPERTIES_VIEW, PERMISSIONS.BOOKINGS_CREATE, PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.VISITS_CREATE, PERMISSIONS.VISITS_VIEW,
    PERMISSIONS.DOCUMENTS_UPLOAD, PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.AI_AGENTS_VIEW, PERMISSIONS.AI_AGENTS_EXECUTE,
  ],
  MARKETING_EXECUTIVE: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.MARKETING_MANAGE, PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.AI_AGENTS_VIEW, PERMISSIONS.AI_AGENTS_EXECUTE,
  ],
  FINANCE_EXECUTIVE: [
    PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.FINANCE_REPORTS,
    PERMISSIONS.BOOKINGS_VIEW, PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DOCUMENTS_VIEW,
  ],
  CUSTOMER: [
    PERMISSIONS.PROPERTIES_VIEW, PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
  ],
  GUEST: [PERMISSIONS.PROPERTIES_VIEW],
};

export const SUBSCRIPTION_LIMITS: Record<string, Record<string, number>> = {
  FREE: {
    leads: 50,
    properties: 10,
    users: 2,
    storage: 100, // MB
    aiCredits: 50,
    whatsappMessages: 100,
  },
  STARTER: {
    leads: 500,
    properties: 50,
    users: 5,
    storage: 1024,
    aiCredits: 500,
    whatsappMessages: 1000,
  },
  PROFESSIONAL: {
    leads: 5000,
    properties: 500,
    users: 25,
    storage: 10240,
    aiCredits: 5000,
    whatsappMessages: 10000,
  },
  ENTERPRISE: {
    leads: -1, // unlimited
    properties: -1,
    users: -1,
    storage: -1,
    aiCredits: -1,
    whatsappMessages: -1,
  },
};

export const LEAD_STATUSES = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST', 'JUNK',
] as const;

export const PROPERTY_TYPES = [
  'PLOT', 'FLAT', 'VILLA', 'COMMERCIAL', 'FARM_LAND', 'STORE', 'PENTHOUSE', 'DUPLEX', 'ROW_HOUSE',
] as const;

export const BOOKING_STATUSES = [
  'INITIATED', 'AGREEMENT', 'LOAN_APPLIED', 'LOAN_APPROVED', 'REGISTERED', 'POSSESSION', 'COMPLETED', 'CANCELLED',
] as const;
