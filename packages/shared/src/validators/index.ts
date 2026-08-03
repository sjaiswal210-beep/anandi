import { z } from 'zod';

// Auth Validators
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  phone: z.string().optional(),
  role: z.enum(['BUILDER', 'AGENCY_OWNER', 'SALES_EXECUTIVE', 'CUSTOMER']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Lead Validators
export const createLeadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  alternatePhone: z.string().optional(),
  source: z.enum(['WEBSITE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'GOOGLE_ADS', 'REFERRAL', 'WALK_IN', 'COLD_CALL', 'EMAIL', 'OTHER']).optional(),
  budget: z.number().positive().optional(),
  preferredLocation: z.string().optional(),
  preferredPropertyType: z.enum(['PLOT', 'FLAT', 'VILLA', 'COMMERCIAL', 'FARM_LAND', 'STORE', 'PENTHOUSE', 'DUPLEX', 'ROW_HOUSE']).optional(),
  timeline: z.string().optional(),
  loanRequired: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  assignedToId: z.string().optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST', 'JUNK']).optional(),
  score: z.number().min(0).max(100).optional(),
  nextFollowUpAt: z.string().datetime().optional(),
  lostReason: z.string().optional(),
});

// Property Validators
export const createPropertySchema = z.object({
  title: z.string().min(3, 'Title is required'),
  projectId: z.string().optional(),
  type: z.enum(['PLOT', 'FLAT', 'VILLA', 'COMMERCIAL', 'FARM_LAND', 'STORE', 'PENTHOUSE', 'DUPLEX', 'ROW_HOUSE']),
  price: z.number().positive('Price must be positive'),
  area: z.number().positive().optional(),
  carpetArea: z.number().positive().optional(),
  builtUpArea: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  balconies: z.number().int().min(0).optional(),
  parking: z.number().int().min(0).optional(),
  floor: z.number().int().optional(),
  totalFloors: z.number().int().optional(),
  facing: z.string().optional(),
  furnishing: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  description: z.string().optional(),
});

// Booking Validators
export const createBookingSchema = z.object({
  leadId: z.string().optional(),
  customerId: z.string(),
  propertyId: z.string(),
  bookingAmount: z.number().positive(),
  totalAmount: z.number().positive(),
  loanRequired: z.boolean().optional(),
  loanAmount: z.number().positive().optional(),
  loanBank: z.string().optional(),
  notes: z.string().optional(),
});

// Site Visit Validators
export const createVisitSchema = z.object({
  leadId: z.string(),
  propertyId: z.string().optional(),
  agentId: z.string(),
  scheduledAt: z.string().datetime(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  pickupAddress: z.string().optional(),
  notes: z.string().optional(),
});

// Workspace Validators
export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
});

// Pagination Validator
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
