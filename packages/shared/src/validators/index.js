"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.createWorkspaceSchema = exports.createVisitSchema = exports.createBookingSchema = exports.createPropertySchema = exports.updateLeadSchema = exports.createLeadSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['BUILDER', 'AGENCY_OWNER', 'SALES_EXECUTIVE', 'CUSTOMER']).optional(),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
});
exports.createLeadSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name is required'),
    phone: zod_1.z.string().min(10, 'Valid phone number is required'),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    alternatePhone: zod_1.z.string().optional(),
    source: zod_1.z.enum(['WEBSITE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE_ADS', 'REFERRAL', 'WALK_IN', 'COLD_CALL', 'EMAIL', 'OTHER']).optional(),
    budget: zod_1.z.number().positive().optional(),
    preferredLocation: zod_1.z.string().optional(),
    preferredPropertyType: zod_1.z.enum(['PLOT', 'FLAT', 'VILLA', 'COMMERCIAL', 'FARM_LAND', 'STORE', 'PENTHOUSE', 'DUPLEX', 'ROW_HOUSE']).optional(),
    timeline: zod_1.z.string().optional(),
    loanRequired: zod_1.z.boolean().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    assignedToId: zod_1.z.string().optional(),
    customFields: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.updateLeadSchema = exports.createLeadSchema.partial().extend({
    status: zod_1.z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST', 'JUNK']).optional(),
    score: zod_1.z.number().min(0).max(100).optional(),
    nextFollowUpAt: zod_1.z.string().datetime().optional(),
    lostReason: zod_1.z.string().optional(),
});
exports.createPropertySchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title is required'),
    projectId: zod_1.z.string().optional(),
    type: zod_1.z.enum(['PLOT', 'FLAT', 'VILLA', 'COMMERCIAL', 'FARM_LAND', 'STORE', 'PENTHOUSE', 'DUPLEX', 'ROW_HOUSE']),
    price: zod_1.z.number().positive('Price must be positive'),
    area: zod_1.z.number().positive().optional(),
    carpetArea: zod_1.z.number().positive().optional(),
    builtUpArea: zod_1.z.number().positive().optional(),
    bedrooms: zod_1.z.number().int().min(0).optional(),
    bathrooms: zod_1.z.number().int().min(0).optional(),
    balconies: zod_1.z.number().int().min(0).optional(),
    parking: zod_1.z.number().int().min(0).optional(),
    floor: zod_1.z.number().int().optional(),
    totalFloors: zod_1.z.number().int().optional(),
    facing: zod_1.z.string().optional(),
    furnishing: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    pincode: zod_1.z.string().optional(),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
    features: zod_1.z.array(zod_1.z.string()).optional(),
    description: zod_1.z.string().optional(),
});
exports.createBookingSchema = zod_1.z.object({
    leadId: zod_1.z.string().optional(),
    customerId: zod_1.z.string(),
    propertyId: zod_1.z.string(),
    bookingAmount: zod_1.z.number().positive(),
    totalAmount: zod_1.z.number().positive(),
    loanRequired: zod_1.z.boolean().optional(),
    loanAmount: zod_1.z.number().positive().optional(),
    loanBank: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.createVisitSchema = zod_1.z.object({
    leadId: zod_1.z.string(),
    propertyId: zod_1.z.string().optional(),
    agentId: zod_1.z.string(),
    scheduledAt: zod_1.z.string().datetime(),
    driverName: zod_1.z.string().optional(),
    driverPhone: zod_1.z.string().optional(),
    pickupAddress: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.createWorkspaceSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Workspace name is required'),
    slug: zod_1.z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    description: zod_1.z.string().optional(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    search: zod_1.z.string().optional(),
});
//# sourceMappingURL=index.js.map