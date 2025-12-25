/**
 * Prisma型定義
 *
 * Prismaクライアントが生成されるまでの暫定的な型定義です。
 * `npx prisma generate` を実行すると、@prisma/client から正式な型が使用できるようになります。
 */

// ==========================================
// Enum定義
// ==========================================

export type SiteType1 = "paid" | "free" | "approval"
export type SiteType2 = "sns" | "portal" | "job" | "other"
export type EditMethod = "form" | "email" | "phone" | "other"
export type Importance = "high" | "medium" | "low"
export type SeoImpact = "large" | "medium" | "small" | "none"
export type SiteCategory = "master" | "auto" | "manual"
export type ClinicSiteStatus = "matched" | "needsReview" | "mismatched" | "unregistered" | "unchecked" | "inaccessible"
export type Priority = "urgent" | "high" | "medium" | "low"
export type CorrectionRequestStatus = "pending" | "requested" | "inProgress" | "completed" | "impossible" | "onHold"
export type RequestMethod = "form" | "email" | "phone" | "other"

// ==========================================
// モデル型定義
// ==========================================

export interface Admin {
  id: string
  email: string
  passwordHash: string
  name: string
  failedLoginAttempts: number
  lockedUntil: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Clinic {
  id: string
  name: string
  nameKana: string | null
  postalCode: string
  prefecture: string
  city: string
  address: string
  phone: string
  fax: string | null
  email: string | null
  website: string | null
  businessHours: string | null
  closedDays: string | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ClinicNap {
  id: string
  clinicId: string
  oldName: string | null
  oldAddress: string | null
  oldPhone: string | null
  notes: string | null
  createdAt: Date
}

export interface Site {
  id: string
  name: string
  url: string
  registerUrl: string | null
  editUrl: string | null
  type1: SiteType1
  type2: SiteType2
  editMethod: EditMethod
  importance: Importance
  seoImpact: SeoImpact
  template: string | null
  comment: string | null
  siteType: SiteCategory
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ClinicSite {
  id: string
  clinicId: string
  siteId: string
  pageUrl: string | null
  status: ClinicSiteStatus
  priority: Priority
  priorityScore: number
  detectedName: string | null
  detectedAddress: string | null
  detectedPhone: string | null
  lastCheckedAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CorrectionRequest {
  id: string
  clinicSiteId: string
  status: CorrectionRequestStatus
  requestMethod: RequestMethod | null
  templateText: string | null
  requestedAt: Date | null
  reminderAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RequestHistory {
  id: string
  correctionRequestId: string
  action: string
  notes: string | null
  attachmentUrl: string | null
  createdAt: Date
}

export interface NotificationSettings {
  id: string
  adminId: string
  newMismatch: boolean
  weeklySummary: boolean
  followUpReminder: boolean
  accessError: boolean
  reminderDays: number
  createdAt: Date
  updatedAt: Date
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}
