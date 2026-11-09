import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["BUILDER", "AGENCY_OWNER", "SALES_EXECUTIVE", "CUSTOMER"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    phone?: string | undefined;
    role?: "BUILDER" | "AGENCY_OWNER" | "SALES_EXECUTIVE" | "CUSTOMER" | undefined;
}, {
    name: string;
    email: string;
    password: string;
    phone?: string | undefined;
    role?: "BUILDER" | "AGENCY_OWNER" | "SALES_EXECUTIVE" | "CUSTOMER" | undefined;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const createLeadSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    alternatePhone: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodEnum<["WEBSITE", "WHATSAPP", "FACEBOOK", "INSTAGRAM", "GOOGLE_ADS", "REFERRAL", "WALK_IN", "COLD_CALL", "EMAIL", "OTHER"]>>;
    budget: z.ZodOptional<z.ZodNumber>;
    preferredLocation: z.ZodOptional<z.ZodString>;
    preferredPropertyType: z.ZodOptional<z.ZodEnum<["PLOT", "FLAT", "VILLA", "COMMERCIAL", "FARM_LAND", "STORE", "PENTHOUSE", "DUPLEX", "ROW_HOUSE"]>>;
    timeline: z.ZodOptional<z.ZodString>;
    loanRequired: z.ZodOptional<z.ZodBoolean>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    assignedToId: z.ZodOptional<z.ZodString>;
    customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    email?: string | undefined;
    tags?: string[] | undefined;
    alternatePhone?: string | undefined;
    source?: "WEBSITE" | "WHATSAPP" | "FACEBOOK" | "INSTAGRAM" | "GOOGLE_ADS" | "REFERRAL" | "WALK_IN" | "COLD_CALL" | "EMAIL" | "OTHER" | undefined;
    budget?: number | undefined;
    preferredLocation?: string | undefined;
    preferredPropertyType?: "PLOT" | "FLAT" | "VILLA" | "COMMERCIAL" | "FARM_LAND" | "STORE" | "PENTHOUSE" | "DUPLEX" | "ROW_HOUSE" | undefined;
    timeline?: string | undefined;
    loanRequired?: boolean | undefined;
    assignedToId?: string | undefined;
    customFields?: Record<string, unknown> | undefined;
}, {
    name: string;
    phone: string;
    email?: string | undefined;
    tags?: string[] | undefined;
    alternatePhone?: string | undefined;
    source?: "WEBSITE" | "WHATSAPP" | "FACEBOOK" | "INSTAGRAM" | "GOOGLE_ADS" | "REFERRAL" | "WALK_IN" | "COLD_CALL" | "EMAIL" | "OTHER" | undefined;
    budget?: number | undefined;
    preferredLocation?: string | undefined;
    preferredPropertyType?: "PLOT" | "FLAT" | "VILLA" | "COMMERCIAL" | "FARM_LAND" | "STORE" | "PENTHOUSE" | "DUPLEX" | "ROW_HOUSE" | undefined;
    timeline?: string | undefined;
    loanRequired?: boolean | undefined;
    assignedToId?: string | undefined;
    customFields?: Record<string, unknown> | undefined;
}>;
export declare const updateLeadSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    alternatePhone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodOptional<z.ZodEnum<["WEBSITE", "WHATSAPP", "FACEBOOK", "INSTAGRAM", "GOOGLE_ADS", "REFERRAL", "WALK_IN", "COLD_CALL", "EMAIL", "OTHER"]>>>;
    budget: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    preferredLocation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    preferredPropertyType: z.ZodOptional<z.ZodOptional<z.ZodEnum<["PLOT", "FLAT", "VILLA", "COMMERCIAL", "FARM_LAND", "STORE", "PENTHOUSE", "DUPLEX", "ROW_HOUSE"]>>>;
    timeline: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    loanRequired: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    assignedToId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    customFields: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "WON", "LOST", "JUNK"]>>;
    score: z.ZodOptional<z.ZodNumber>;
    nextFollowUpAt: z.ZodOptional<z.ZodString>;
    lostReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    tags?: string[] | undefined;
    status?: "NEW" | "CONTACTED" | "QUALIFIED" | "NEGOTIATION" | "WON" | "LOST" | "JUNK" | undefined;
    alternatePhone?: string | undefined;
    source?: "WEBSITE" | "WHATSAPP" | "FACEBOOK" | "INSTAGRAM" | "GOOGLE_ADS" | "REFERRAL" | "WALK_IN" | "COLD_CALL" | "EMAIL" | "OTHER" | undefined;
    budget?: number | undefined;
    preferredLocation?: string | undefined;
    preferredPropertyType?: "PLOT" | "FLAT" | "VILLA" | "COMMERCIAL" | "FARM_LAND" | "STORE" | "PENTHOUSE" | "DUPLEX" | "ROW_HOUSE" | undefined;
    timeline?: string | undefined;
    loanRequired?: boolean | undefined;
    assignedToId?: string | undefined;
    customFields?: Record<string, unknown> | undefined;
    score?: number | undefined;
    nextFollowUpAt?: string | undefined;
    lostReason?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    tags?: string[] | undefined;
    status?: "NEW" | "CONTACTED" | "QUALIFIED" | "NEGOTIATION" | "WON" | "LOST" | "JUNK" | undefined;
    alternatePhone?: string | undefined;
    source?: "WEBSITE" | "WHATSAPP" | "FACEBOOK" | "INSTAGRAM" | "GOOGLE_ADS" | "REFERRAL" | "WALK_IN" | "COLD_CALL" | "EMAIL" | "OTHER" | undefined;
    budget?: number | undefined;
    preferredLocation?: string | undefined;
    preferredPropertyType?: "PLOT" | "FLAT" | "VILLA" | "COMMERCIAL" | "FARM_LAND" | "STORE" | "PENTHOUSE" | "DUPLEX" | "ROW_HOUSE" | undefined;
    timeline?: string | undefined;
    loanRequired?: boolean | undefined;
    assignedToId?: string | undefined;
    customFields?: Record<string, unknown> | undefined;
    score?: number | undefined;
    nextFollowUpAt?: string | undefined;
    lostReason?: string | undefined;
}>;
export declare const createPropertySchema: z.ZodObject<{
    title: z.ZodString;
    projectId: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["PLOT", "FLAT", "VILLA", "COMMERCIAL", "FARM_LAND", "STORE", "PENTHOUSE", "DUPLEX", "ROW_HOUSE"]>;
    price: z.ZodNumber;
    area: z.ZodOptional<z.ZodNumber>;
    carpetArea: z.ZodOptional<z.ZodNumber>;
    builtUpArea: z.ZodOptional<z.ZodNumber>;
    bedrooms: z.ZodOptional<z.ZodNumber>;
    bathrooms: z.ZodOptional<z.ZodNumber>;
    balconies: z.ZodOptional<z.ZodNumber>;
    parking: z.ZodOptional<z.ZodNumber>;
    floor: z.ZodOptional<z.ZodNumber>;
    totalFloors: z.ZodOptional<z.ZodNumber>;
    facing: z.ZodOptional<z.ZodString>;
    furnishing: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodString>;
    amenities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "PLOT" | "FLAT" | "VILLA" | "COMMERCIAL" | "FARM_LAND" | "STORE" | "PENTHOUSE" | "DUPLEX" | "ROW_HOUSE";
    title: string;
    price: number;
    description?: string | undefined;
    features?: string[] | undefined;
    projectId?: string | undefined;
    area?: number | undefined;
    carpetArea?: number | undefined;
    builtUpArea?: number | undefined;
    bedrooms?: number | undefined;
    bathrooms?: number | undefined;
    balconies?: number | undefined;
    parking?: number | undefined;
    floor?: number | undefined;
    totalFloors?: number | undefined;
    facing?: string | undefined;
    furnishing?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    pincode?: string | undefined;
    amenities?: string[] | undefined;
}, {
    type: "PLOT" | "FLAT" | "VILLA" | "COMMERCIAL" | "FARM_LAND" | "STORE" | "PENTHOUSE" | "DUPLEX" | "ROW_HOUSE";
    title: string;
    price: number;
    description?: string | undefined;
    features?: string[] | undefined;
    projectId?: string | undefined;
    area?: number | undefined;
    carpetArea?: number | undefined;
    builtUpArea?: number | undefined;
    bedrooms?: number | undefined;
    bathrooms?: number | undefined;
    balconies?: number | undefined;
    parking?: number | undefined;
    floor?: number | undefined;
    totalFloors?: number | undefined;
    facing?: string | undefined;
    furnishing?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    pincode?: string | undefined;
    amenities?: string[] | undefined;
}>;
export declare const createBookingSchema: z.ZodObject<{
    leadId: z.ZodOptional<z.ZodString>;
    customerId: z.ZodString;
    propertyId: z.ZodString;
    bookingAmount: z.ZodNumber;
    totalAmount: z.ZodNumber;
    loanRequired: z.ZodOptional<z.ZodBoolean>;
    loanAmount: z.ZodOptional<z.ZodNumber>;
    loanBank: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    propertyId: string;
    bookingAmount: number;
    totalAmount: number;
    notes?: string | undefined;
    loanRequired?: boolean | undefined;
    leadId?: string | undefined;
    loanAmount?: number | undefined;
    loanBank?: string | undefined;
}, {
    customerId: string;
    propertyId: string;
    bookingAmount: number;
    totalAmount: number;
    notes?: string | undefined;
    loanRequired?: boolean | undefined;
    leadId?: string | undefined;
    loanAmount?: number | undefined;
    loanBank?: string | undefined;
}>;
export declare const createVisitSchema: z.ZodObject<{
    leadId: z.ZodString;
    propertyId: z.ZodOptional<z.ZodString>;
    agentId: z.ZodString;
    scheduledAt: z.ZodString;
    driverName: z.ZodOptional<z.ZodString>;
    driverPhone: z.ZodOptional<z.ZodString>;
    pickupAddress: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    leadId: string;
    agentId: string;
    scheduledAt: string;
    notes?: string | undefined;
    propertyId?: string | undefined;
    driverName?: string | undefined;
    driverPhone?: string | undefined;
    pickupAddress?: string | undefined;
}, {
    leadId: string;
    agentId: string;
    scheduledAt: string;
    notes?: string | undefined;
    propertyId?: string | undefined;
    driverName?: string | undefined;
    driverPhone?: string | undefined;
    pickupAddress?: string | undefined;
}>;
export declare const createWorkspaceSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    description?: string | undefined;
}, {
    name: string;
    slug: string;
    description?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    sortBy?: string | undefined;
}, {
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
