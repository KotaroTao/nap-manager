/**
 * 修正依頼関連のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { CorrectionRequest, CorrectionRequestStatus, RequestMethod, ClinicSite, Clinic, Site } from "@/types"
import { clinicSiteKeys } from "./use-clinic-sites"

// API レスポンス型
export interface RequestHistory {
  id: string
  correctionRequestId: string
  action: string
  notes?: string | null
  attachmentUrl?: string | null
  createdAt: Date
}

export interface CorrectionRequestWithDetails extends CorrectionRequest {
  clinicSite: ClinicSite & {
    clinic: Pick<Clinic, "id" | "name" | "phone" | "prefecture" | "city" | "address">
    site: Pick<Site, "id" | "name" | "url" | "editUrl" | "editMethod">
  }
  requestHistories: RequestHistory[]
  daysElapsed?: number | null
}

export interface CorrectionRequestsResponse {
  requests: CorrectionRequestWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CorrectionRequestsParams {
  clinicSiteId?: string
  clinicId?: string
  status?: CorrectionRequestStatus
  needsFollowUp?: boolean
  page?: number
  limit?: number
}

// クエリキー
export const correctionRequestKeys = {
  all: ["correctionRequests"] as const,
  lists: () => [...correctionRequestKeys.all, "list"] as const,
  list: (params: CorrectionRequestsParams) => [...correctionRequestKeys.lists(), params] as const,
  details: () => [...correctionRequestKeys.all, "detail"] as const,
  detail: (id: string) => [...correctionRequestKeys.details(), id] as const,
}

/**
 * 修正依頼一覧を取得
 */
export function useCorrectionRequests(params: CorrectionRequestsParams = {}) {
  const queryString = new URLSearchParams()
  if (params.clinicSiteId) queryString.set("clinicSiteId", params.clinicSiteId)
  if (params.clinicId) queryString.set("clinicId", params.clinicId)
  if (params.status) queryString.set("status", params.status)
  if (params.needsFollowUp) queryString.set("needsFollowUp", "true")
  if (params.page) queryString.set("page", String(params.page))
  if (params.limit) queryString.set("limit", String(params.limit))

  const url = `/api/correction-requests${queryString.toString() ? `?${queryString}` : ""}`

  return useQuery({
    queryKey: correctionRequestKeys.list(params),
    queryFn: () => api.get<CorrectionRequestsResponse>(url),
  })
}

/**
 * 修正依頼詳細を取得
 */
export function useCorrectionRequest(id: string) {
  return useQuery({
    queryKey: correctionRequestKeys.detail(id),
    queryFn: () => api.get<CorrectionRequestWithDetails>(`/api/correction-requests/${id}`),
    enabled: !!id,
  })
}

/**
 * 修正依頼を作成
 */
export function useCreateCorrectionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      clinicSiteId: string
      requestMethod?: RequestMethod
      templateText?: string
      notes?: string
    }) => api.post<CorrectionRequest>("/api/correction-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: correctionRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clinicSiteKeys.lists() })
    },
  })
}

/**
 * 修正依頼を更新
 */
export function useUpdateCorrectionRequest(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      status?: CorrectionRequestStatus
      requestMethod?: RequestMethod
      templateText?: string
      reminderAt?: string | null
      notes?: string
    }) => api.put<CorrectionRequest>(`/api/correction-requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: correctionRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: correctionRequestKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: clinicSiteKeys.lists() })
    },
  })
}

/**
 * 修正依頼を削除
 */
export function useDeleteCorrectionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/correction-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: correctionRequestKeys.lists() })
    },
  })
}

/**
 * 修正依頼に履歴を追加
 */
export function useAddRequestHistory(requestId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      action: string
      notes?: string
      attachmentUrl?: string
    }) => api.post<RequestHistory>(`/api/correction-requests/${requestId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: correctionRequestKeys.detail(requestId) })
    },
  })
}
