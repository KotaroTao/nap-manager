/**
 * 型定義
 * 
 * アプリケーション全体で使用する型を定義します。
 */

// ==========================================
// Enum型（Prismaスキーマと同期）
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
// 表示用ラベル
// ==========================================

export const SITE_TYPE1_LABELS: Record<SiteType1, string> = {
  paid: "有料",
  free: "無料",
  approval: "承認制",
}

export const SITE_TYPE2_LABELS: Record<SiteType2, string> = {
  sns: "SNS",
  portal: "ポータルサイト",
  job: "求人サイト",
  other: "その他",
}

export const EDIT_METHOD_LABELS: Record<EditMethod, string> = {
  form: "フォーム",
  email: "メール",
  phone: "電話",
  other: "その他",
}

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  high: "高",
  medium: "中",
  low: "低",
}

export const SEO_IMPACT_LABELS: Record<SeoImpact, string> = {
  large: "大",
  medium: "中",
  small: "小",
  none: "なし",
}

export const SITE_CATEGORY_LABELS: Record<SiteCategory, string> = {
  master: "マスタサイト",
  auto: "自動追加",
  manual: "手動追加",
}

export const CLINIC_SITE_STATUS_LABELS: Record<ClinicSiteStatus, string> = {
  matched: "一致",
  needsReview: "要確認",
  mismatched: "不一致",
  unregistered: "未登録",
  unchecked: "未チェック",
  inaccessible: "アクセス不可",
}

export const CLINIC_SITE_STATUS_COLORS: Record<ClinicSiteStatus, string> = {
  matched: "bg-green-100 text-green-800",
  needsReview: "bg-yellow-100 text-yellow-800",
  mismatched: "bg-red-100 text-red-800",
  unregistered: "bg-blue-100 text-blue-800",
  unchecked: "bg-gray-100 text-gray-800",
  inaccessible: "bg-gray-800 text-white",
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "緊急",
  high: "高",
  medium: "中",
  low: "低",
}

export const CORRECTION_REQUEST_STATUS_LABELS: Record<CorrectionRequestStatus, string> = {
  pending: "未対応",
  requested: "依頼済み",
  inProgress: "対応中",
  completed: "完了",
  impossible: "対応不可",
  onHold: "保留",
}

// ==========================================
// エンティティ型
// ==========================================

export interface Clinic {
  id: string
  name: string
  nameKana?: string | null
  postalCode: string
  prefecture: string
  city: string
  address: string
  phone: string
  fax?: string | null
  email?: string | null
  website?: string | null
  businessHours?: string | null
  closedDays?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ClinicNap {
  id: string
  clinicId: string
  oldName?: string | null
  oldAddress?: string | null
  oldPhone?: string | null
  notes?: string | null
  createdAt: Date
}

export interface Site {
  id: string
  name: string
  url: string
  registerUrl?: string | null
  editUrl?: string | null
  type1: SiteType1
  type2: SiteType2
  editMethod: EditMethod
  importance: Importance
  seoImpact: SeoImpact
  template?: string | null
  comment?: string | null
  siteType: SiteCategory
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ClinicSite {
  id: string
  clinicId: string
  siteId: string
  pageUrl?: string | null
  status: ClinicSiteStatus
  priority: Priority
  priorityScore: number
  detectedName?: string | null
  detectedAddress?: string | null
  detectedPhone?: string | null
  lastCheckedAt?: Date | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  clinic?: Clinic
  site?: Site
}

export interface CorrectionRequest {
  id: string
  clinicSiteId: string
  status: CorrectionRequestStatus
  requestMethod?: RequestMethod | null
  templateText?: string | null
  requestedAt?: Date | null
  reminderAt?: Date | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  clinicSite?: ClinicSite
}

// ==========================================
// フォーム用型
// ==========================================

export interface ClinicFormData {
  name: string
  nameKana?: string
  postalCode: string
  prefecture: string
  city: string
  address: string
  phone: string
  fax?: string
  email?: string
  website?: string
  businessHours?: string
  closedDays?: string
  notes?: string
  isActive: boolean
}

export interface SiteFormData {
  name: string
  url: string
  registerUrl?: string
  editUrl?: string
  type1: SiteType1
  type2: SiteType2
  editMethod: EditMethod
  importance: Importance
  seoImpact: SeoImpact
  template?: string
  comment?: string
  siteType: SiteCategory
  isActive: boolean
}
