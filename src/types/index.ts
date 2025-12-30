// Re-export Prisma types (OSS version - no billing models)
export type {
  User,
  Website,
  Stat,
  Event,
  Page,
  Setting,
  Language,
  StatType,
  UserRole,
  License,
  LicenseType,
  LicenseStatus,
} from "@prisma/client";

// Analytics types
export interface AnalyticsData {
  visitors: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  visitorsChange: number;
  pageviewsChange: number;
}

export interface StatItem {
  value: string;
  count: number;
  percentage?: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ChartDataPoint {
  date: string;
  visitors: number;
  pageviews: number;
}

// Tracking types
export interface TrackingEvent {
  page: string;
  referrer?: string;
  screen_resolution?: string;
  event?: string;
}

// Plan features
export interface PlanFeatures {
  websites?: number;
  pageviews?: number;
  dataRetention?: number; // days
  api?: boolean;
  emailReports?: boolean;
  exportCsv?: boolean;
  customEvents?: boolean;
  realtime?: boolean;
}

// Billing types
export interface BillingInformation {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  vatNumber?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface WebsiteFormData {
  url: string;
  privacy: number;
  password?: string;
  email?: number;
  excludeBots: boolean;
  excludeIps?: string;
  excludeParams?: string;
}

// Settings
export interface AppSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  captchaEnabled: boolean;
  maintenanceMode: boolean;
  // Payment settings
  paymentEnabled: boolean;
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  mollieEnabled: boolean;
  paddleEnabled: boolean;
  razorpayEnabled: boolean;
  paystackEnabled: boolean;
  coinbaseEnabled: boolean;
  cryptocomEnabled: boolean;
  bankEnabled: boolean;
  // Email settings
  emailDriver: string;
  emailFromAddress: string;
  emailFromName: string;
}

// Navigation
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

// Dashboard stats card
export interface StatsCardData {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}
