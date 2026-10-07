/** Domain + API types shared across features. Mirrors the backend's JSON contract. */

export type Role = "admin" | "marketer";
export type CustomerStatus = "lead" | "active" | "vip" | "inactive" | "churned";
export type Channel = "email" | "sms" | "push" | "whatsapp";
export type Tone =
  | "professional"
  | "friendly"
  | "urgent"
  | "playful"
  | "luxury"
  | "empathetic";
export type CampaignStatus =
  | "draft"
  | "approved"
  | "scheduled"
  | "sent"
  | "archived";
export type BadgeTone = "slate" | "green" | "violet" | "amber" | "red" | "blue";

// ---------- API envelope ----------
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { field?: string; message: string }[];
  };
}

// ---------- auth ----------
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
}
export interface Session {
  accessToken: string;
  tokenType?: "Bearer";
  expiresIn: number;
  user: User;
}
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface RegisterPayload extends LoginCredentials {
  name: string;
}

// ---------- customers ----------
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  status: CustomerStatus;
  totalSpent: number;
  orderCount: number;
  lastPurchaseAt: string | null;
  marketingOptIn: boolean;
  createdAt: string;
}
export type CustomerSortKey =
  | "createdAt"
  | "lastName"
  | "totalSpent"
  | "orderCount"
  | "lastPurchaseAt";
export interface CustomerQuery {
  page: number;
  limit: number;
  search: string;
  status: CustomerStatus | "";
  sortBy: CustomerSortKey;
  order: "asc" | "desc";
}
export interface Kpis {
  totalCustomers: number;
  activeCustomers: number;
  totalTransactionValue: number;
  avgCustomerValue: number;
}

// ---------- segments ----------
export interface SegmentCriteria {
  statuses?: CustomerStatus[];
  countries?: string[];
  minTotalSpent?: number;
  maxTotalSpent?: number;
  minOrderCount?: number;
  maxOrderCount?: number;
  purchasedWithinDays?: number;
  inactiveForDays?: number;
}
export interface Segment {
  id: string;
  name: string;
  description: string | null;
  criteria: SegmentCriteria;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface SegmentWithCount extends Segment {
  memberCount: number;
}
export interface CreateSegmentPayload {
  name: string;
  description?: string;
  criteria: SegmentCriteria;
}
export interface SegmentPreview {
  count: number;
  sample: Customer[];
}

// ---------- campaigns ----------
export interface Campaign {
  id: string;
  name: string;
  objective: string;
  channel: Channel;
  tone: Tone;
  status: CampaignStatus;
  subject: string | null;
  preheader: string | null;
  content: string;
  callToAction: string | null;
  rationale: string | null;
  scheduledAt: string | null;
  segmentId: string | null;
  segment?: { id: string; name: string } | null;
  creator?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}
export interface GenerateCampaignPayload {
  objective: string;
  channel: Channel;
  tone: Tone;
  segmentId?: string;
  name?: string;
  productOrOffer?: string;
  additionalInstructions?: string;
  save?: boolean;
}
export type CampaignEdit = Partial<
  Pick<Campaign, "subject" | "preheader" | "content" | "callToAction">
>;
export interface CampaignStatusPayload {
  status: CampaignStatus;
  scheduledAt?: string;
}
