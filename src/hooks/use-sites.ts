/**
 * サイト関連のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Site, SiteFormData, SiteCategory, SiteType1, SiteType2 } from "@/types"

// API レスポンス型
export interface SiteWithStats extends Site {
  clinicCount: number
}

export interface SitesResponse {
  sites: SiteWithStats[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SitesParams {
  search?: string
  siteType?: SiteCategory
  type1?: SiteType1
  type2?: SiteType2
  isActive?: boolean
  page?: number
  limit?: number
}

// クエリキー
export const siteKeys = {
  all: ["sites"] as const,
  lists: () => [...siteKeys.all, "list"] as const,
  list: (params: SitesParams) => [...siteKeys.lists(), params] as const,
  details: () => [...siteKeys.all, "detail"] as const,
  detail: (id: string) => [...siteKeys.details(), id] as const,
}

/**
 * サイト一覧を取得
 */
export function useSites(params: SitesParams = {}) {
  const queryString = new URLSearchParams()
  if (params.search) queryString.set("search", params.search)
  if (params.siteType) queryString.set("siteType", params.siteType)
  if (params.type1) queryString.set("type1", params.type1)
  if (params.type2) queryString.set("type2", params.type2)
  if (params.isActive !== undefined) queryString.set("isActive", String(params.isActive))
  if (params.page) queryString.set("page", String(params.page))
  if (params.limit) queryString.set("limit", String(params.limit))

  const url = `/api/sites${queryString.toString() ? `?${queryString}` : ""}`

  return useQuery({
    queryKey: siteKeys.list(params),
    queryFn: () => api.get<SitesResponse>(url),
  })
}

/**
 * サイト詳細を取得
 */
export function useSite(id: string) {
  return useQuery({
    queryKey: siteKeys.detail(id),
    queryFn: () => api.get<Site>(`/api/sites/${id}`),
    enabled: !!id,
  })
}

/**
 * サイトを作成
 */
export function useCreateSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SiteFormData & { autoLinkAllClinics?: boolean }) =>
      api.post<Site>("/api/sites", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteKeys.lists() })
    },
  })
}

/**
 * サイトを更新
 */
export function useUpdateSite(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<SiteFormData>) =>
      api.put<Site>(`/api/sites/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(id) })
    },
  })
}

/**
 * サイトを削除
 */
export function useDeleteSite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/sites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteKeys.lists() })
    },
  })
}
