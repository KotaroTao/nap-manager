/**
 * 医院サイト紐付け関連のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { ClinicSite, ClinicSiteStatus, Priority, Clinic, Site, CorrectionRequest } from "@/types"

// API レスポンス型
export interface ClinicSiteWithDetails {
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
  clinic: Pick<Clinic, "id" | "name" | "phone" | "prefecture" | "city" | "address">
  site: Pick<Site, "id" | "name" | "url" | "editUrl" | "editMethod" | "importance" | "seoImpact" | "registerUrl">
  correctionRequests: CorrectionRequest[]
}

export interface ClinicSitesResponse {
  clinicSites: ClinicSiteWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ClinicSitesParams {
  clinicId?: string
  siteId?: string
  status?: ClinicSiteStatus
  priority?: Priority
  page?: number
  limit?: number
}

// クエリキー
export const clinicSiteKeys = {
  all: ["clinicSites"] as const,
  lists: () => [...clinicSiteKeys.all, "list"] as const,
  list: (params: ClinicSitesParams) => [...clinicSiteKeys.lists(), params] as const,
  details: () => [...clinicSiteKeys.all, "detail"] as const,
  detail: (id: string) => [...clinicSiteKeys.details(), id] as const,
}

/**
 * 医院サイト紐付け一覧を取得
 */
export function useClinicSites(params: ClinicSitesParams = {}) {
  const queryString = new URLSearchParams()
  if (params.clinicId) queryString.set("clinicId", params.clinicId)
  if (params.siteId) queryString.set("siteId", params.siteId)
  if (params.status) queryString.set("status", params.status)
  if (params.priority) queryString.set("priority", params.priority)
  if (params.page) queryString.set("page", String(params.page))
  if (params.limit) queryString.set("limit", String(params.limit))

  const url = `/api/clinic-sites${queryString.toString() ? `?${queryString}` : ""}`

  return useQuery({
    queryKey: clinicSiteKeys.list(params),
    queryFn: () => api.get<ClinicSitesResponse>(url),
    enabled: !!params.clinicId,
  })
}

/**
 * 医院サイト紐付け詳細を取得
 */
export function useClinicSite(id: string) {
  return useQuery({
    queryKey: clinicSiteKeys.detail(id),
    queryFn: () => api.get<ClinicSiteWithDetails>(`/api/clinic-sites/${id}`),
    enabled: !!id,
  })
}

/**
 * 医院サイト紐付けを作成
 */
export function useCreateClinicSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      clinicId: string
      siteId: string
      pageUrl?: string
      status?: ClinicSiteStatus
      priority?: Priority
      detectedName?: string
      detectedAddress?: string
      detectedPhone?: string
      notes?: string
    }) => api.post<ClinicSite>("/api/clinic-sites", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicSiteKeys.lists() })
    },
  })
}

/**
 * 医院サイト紐付けを更新
 */
export function useUpdateClinicSite(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      pageUrl?: string
      status?: ClinicSiteStatus
      priority?: Priority
      detectedName?: string
      detectedAddress?: string
      detectedPhone?: string
      notes?: string
    }) => api.put<ClinicSite>(`/api/clinic-sites/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicSiteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clinicSiteKeys.detail(id) })
    },
  })
}

/**
 * 医院サイト紐付けのステータスを更新（PATCH）
 */
export function useUpdateClinicSiteStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClinicSiteStatus }) =>
      api.patch<ClinicSite>(`/api/clinic-sites/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicSiteKeys.lists() })
    },
  })
}

/**
 * 医院サイト紐付けを削除
 */
export function useDeleteClinicSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/clinic-sites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicSiteKeys.lists() })
    },
  })
}
