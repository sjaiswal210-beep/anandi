"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOKING_STATUSES = exports.PROPERTY_TYPES = exports.LEAD_STATUSES = exports.SUBSCRIPTION_LIMITS = exports.ROLE_PERMISSIONS = exports.PERMISSIONS = exports.ROLE_HIERARCHY = exports.USER_ROLES = exports.APP_VERSION = exports.APP_NAME = void 0;
exports.APP_NAME = 'RealtyOS AI';
exports.APP_VERSION = '1.0.0';
exports.USER_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    BUILDER: 'BUILDER',
    AGENCY_OWNER: 'AGENCY_OWNER',
    SALES_MANAGER: 'SALES_MANAGER',
    SALES_EXECUTIVE: 'SALES_EXECUTIVE',
    MARKETING_EXECUTIVE: 'MARKETING_EXECUTIVE',
    FINANCE_EXECUTIVE: 'FINANCE_EXECUTIVE',
    CUSTOMER: 'CUSTOMER',
    GUEST: 'GUEST',
};
exports.ROLE_HIERARCHY = {
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
exports.PERMISSIONS = {
    WORKSPACE_MANAGE: 'workspace:manage',
    WORKSPACE_VIEW: 'workspace:view',
    WORKSPACE_BILLING: 'workspace:billing',
    USERS_MANAGE: 'users:manage',
    USERS_VIEW: 'users:view',
    USERS_INVITE: 'users:invite',
    LEADS_CREATE: 'leads:create',
    LEADS_VIEW: 'leads:view',
    LEADS_VIEW_ALL: 'leads:view_all',
    LEADS_EDIT: 'leads:edit',
    LEADS_DELETE: 'leads:delete',
    LEADS_ASSIGN: 'leads:assign',
    LEADS_IMPORT: 'leads:import',
    LEADS_EXPORT: 'leads:export',
    PROPERTIES_CREATE: 'properties:create',
    PROPERTIES_VIEW: 'properties:view',
    PROPERTIES_EDIT: 'properties:edit',
    PROPERTIES_DELETE: 'properties:delete',
    BOOKINGS_CREATE: 'bookings:create',
    BOOKINGS_VIEW: 'bookings:view',
    BOOKINGS_EDIT: 'bookings:edit',
    BOOKINGS_CANCEL: 'bookings:cancel',
    FINANCE_VIEW: 'finance:view',
    FINANCE_MANAGE: 'finance:manage',
    FINANCE_REPORTS: 'finance:reports',
    DOCUMENTS_UPLOAD: 'documents:upload',
    DOCUMENTS_VIEW: 'documents:view',
    DOCUMENTS_DELETE: 'documents:delete',
    AI_AGENTS_MANAGE: 'ai_agents:manage',
    AI_AGENTS_VIEW: 'ai_agents:view',
    AI_AGENTS_EXECUTE: 'ai_agents:execute',
    REPORTS_VIEW: 'reports:view',
    REPORTS_EXPORT: 'reports:export',
    SETTINGS_MANAGE: 'settings:manage',
    SETTINGS_VIEW: 'settings:view',
    MARKETING_MANAGE: 'marketing:manage',
    MARKETING_VIEW: 'marketing:view',
    VISITS_CREATE: 'visits:create',
    VISITS_VIEW: 'visits:view',
    VISITS_MANAGE: 'visits:manage',
};
exports.ROLE_PERMISSIONS = {
    SUPER_ADMIN: Object.values(exports.PERMISSIONS),
    BUILDER: Object.values(exports.PERMISSIONS),
    AGENCY_OWNER: Object.values(exports.PERMISSIONS).filter((p) => !p.startsWith('workspace:billing')),
    SALES_MANAGER: [
        exports.PERMISSIONS.LEADS_CREATE, exports.PERMISSIONS.LEADS_VIEW, exports.PERMISSIONS.LEADS_VIEW_ALL,
        exports.PERMISSIONS.LEADS_EDIT, exports.PERMISSIONS.LEADS_ASSIGN, exports.PERMISSIONS.LEADS_IMPORT,
        exports.PERMISSIONS.LEADS_EXPORT, exports.PERMISSIONS.PROPERTIES_VIEW,
        exports.PERMISSIONS.BOOKINGS_CREATE, exports.PERMISSIONS.BOOKINGS_VIEW, exports.PERMISSIONS.BOOKINGS_EDIT,
        exports.PERMISSIONS.VISITS_CREATE, exports.PERMISSIONS.VISITS_VIEW, exports.PERMISSIONS.VISITS_MANAGE,
        exports.PERMISSIONS.DOCUMENTS_UPLOAD, exports.PERMISSIONS.DOCUMENTS_VIEW,
        exports.PERMISSIONS.REPORTS_VIEW, exports.PERMISSIONS.USERS_VIEW,
        exports.PERMISSIONS.FINANCE_VIEW, exports.PERMISSIONS.AI_AGENTS_VIEW, exports.PERMISSIONS.AI_AGENTS_EXECUTE,
    ],
    SALES_EXECUTIVE: [
        exports.PERMISSIONS.LEADS_CREATE, exports.PERMISSIONS.LEADS_VIEW, exports.PERMISSIONS.LEADS_EDIT,
        exports.PERMISSIONS.PROPERTIES_VIEW, exports.PERMISSIONS.BOOKINGS_CREATE, exports.PERMISSIONS.BOOKINGS_VIEW,
        exports.PERMISSIONS.VISITS_CREATE, exports.PERMISSIONS.VISITS_VIEW,
        exports.PERMISSIONS.DOCUMENTS_UPLOAD, exports.PERMISSIONS.DOCUMENTS_VIEW,
        exports.PERMISSIONS.AI_AGENTS_VIEW, exports.PERMISSIONS.AI_AGENTS_EXECUTE,
    ],
    MARKETING_EXECUTIVE: [
        exports.PERMISSIONS.LEADS_VIEW, exports.PERMISSIONS.PROPERTIES_VIEW,
        exports.PERMISSIONS.MARKETING_MANAGE, exports.PERMISSIONS.MARKETING_VIEW,
        exports.PERMISSIONS.REPORTS_VIEW, exports.PERMISSIONS.AI_AGENTS_VIEW, exports.PERMISSIONS.AI_AGENTS_EXECUTE,
    ],
    FINANCE_EXECUTIVE: [
        exports.PERMISSIONS.FINANCE_VIEW, exports.PERMISSIONS.FINANCE_MANAGE, exports.PERMISSIONS.FINANCE_REPORTS,
        exports.PERMISSIONS.BOOKINGS_VIEW, exports.PERMISSIONS.REPORTS_VIEW, exports.PERMISSIONS.REPORTS_EXPORT,
        exports.PERMISSIONS.DOCUMENTS_VIEW,
    ],
    CUSTOMER: [
        exports.PERMISSIONS.PROPERTIES_VIEW, exports.PERMISSIONS.BOOKINGS_VIEW,
        exports.PERMISSIONS.DOCUMENTS_VIEW,
    ],
    GUEST: [exports.PERMISSIONS.PROPERTIES_VIEW],
};
exports.SUBSCRIPTION_LIMITS = {
    FREE: {
        leads: 50,
        properties: 10,
        users: 2,
        storage: 100,
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
        leads: -1,
        properties: -1,
        users: -1,
        storage: -1,
        aiCredits: -1,
        whatsappMessages: -1,
    },
};
exports.LEAD_STATUSES = [
    'NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST', 'JUNK',
];
exports.PROPERTY_TYPES = [
    'PLOT', 'FLAT', 'VILLA', 'COMMERCIAL', 'FARM_LAND', 'STORE', 'PENTHOUSE', 'DUPLEX', 'ROW_HOUSE',
];
exports.BOOKING_STATUSES = [
    'INITIATED', 'AGREEMENT', 'LOAN_APPLIED', 'LOAN_APPROVED', 'REGISTERED', 'POSSESSION', 'COMPLETED', 'CANCELLED',
];
//# sourceMappingURL=index.js.map