/**
 * 医院関連のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Clinic, ClinicFormData, ClinicNap, ClinicSite, Site, CorrectionRequest } from "@/types"

// API レスポンス型
export interface ClinicWithStats extends Clinic {
  totalSites: number
  matchedSites: number
  matchRate: number
}

export interface ClinicSiteWithDetails extends ClinicSite {
  site: Site
  correctionRequests: CorrectionRequest[]
}

export interface ClinicDetailResponse extends Clinic {
  clinicNaps: ClinicNap[]
  clinicSites: ClinicSiteWithDetails[]
  stats: {
    totalSites: number
    matchedSites: number
    mismatchedSites: number
    needsReviewSites: number
    uncheckedSites: number
    matchRate: number
  }
}

export interface ClinicsResponse {
  clinics: ClinicWithStats[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ClinicsParams {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

// クエリキー
export const clinicKeys = {
  all: ["clinics"] as const,
  lists: () => [...clinicKeys.all, "list"] as const,
  list: (params: ClinicsParams) => [...clinicKeys.lists(), params] as const,
  details: () => [...clinicKeys.all, "detail"] as const,
  detail: (id: string) => [...clinicKeys.details(), id] as const,
}

/**
 * 医院一覧を取得
 */
export function useClinics(params: ClinicsParams = {}) {
  const queryString = new URLSearchParams()
  if (params.search) queryString.set("search", params.search)
  if (params.isActive !== undefined) queryString.set("isActive", String(params.isActive))
  if (params.page) queryString.set("page", String(params.page))
  if (params.limit) queryString.set("limit", String(params.limit))

  const url = `/api/clinics${queryString.toString() ? `?${queryString}` : ""}`

  return useQuery({
    queryKey: clinicKeys.list(params),
    queryFn: () => api.get<ClinicsResponse>(url),
  })
}

/**
 * 医院詳細を取得
 */
export function useClinic(id: string) {
  return useQuery({
    queryKey: clinicKeys.detail(id),
    queryFn: () => api.get<ClinicDetailResponse>(`/api/clinics/${id}`),
    enabled: !!id,
  })
}

/**
 * 医院を作成
 */
export function useCreateClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClinicFormData & { autoLinkMasterSites?: boolean }) =>
      api.post<Clinic>("/api/clinics", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicKeys.lists() })
    },
  })
}

/**
 * 医院を更新
 */
export function useUpdateClinic(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<ClinicFormData>) =>
      api.put<Clinic>(`/api/clinics/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clinicKeys.detail(id) })
    },
  })
}

/**
 * 医院を削除
 */
export function useDeleteClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/clinics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicKeys.lists() })
    },
  })
}
