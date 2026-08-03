export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | string[] | undefined;
}

export interface DashboardMetrics {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  leads: {
    total: number;
    new: number;
    converted: number;
    conversionRate: number;
  };
  bookings: {
    total: number;
    thisMonth: number;
    pendingPayments: number;
  };
  properties: {
    total: number;
    available: number;
    sold: number;
    reserved: number;
  };
  visits: {
    today: number;
    scheduled: number;
    completed: number;
  };
  agents: {
    topPerformer: string;
    totalCommissions: number;
  };
}

export interface AIAgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[];
  triggers: string[];
  schedule?: string;
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
}

export interface WebsiteConfig {
  theme: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo: string;
  favicon: string;
  socialLinks: Record<string, string>;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
}
