/**
 * NAP検証用カスタムフック
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { VerificationStatus } from "@/types"

// ==========================================
// 型定義
// ==========================================

interface VerificationResult {
  id: string
  clinic: {
    id: string
    name: string
    address: string
    phone: string
  }
  site: {
    id: string
    name: string
    url: string
    correctionRequestUrl: string | null
    registrationUrl: string | null
  }
  clinicPageUrl: string | null
  expectedNap: {
    name: string
    address: string
    phone: string
  }
  detectedNap: {
    name: string | null
    address: string | null
    phone: string | null
  }
  matchResult: {
    name: string
    address: string
    phone: string
    overall: VerificationStatus
  }
  links: {
    clinicPage: string | null
    correctionRequest: string | null
    registration: string | null
    siteSearch: string | null
  }
  verifiedAt: string
  confidence: number
}

interface VerificationResultsResponse {
  results: VerificationResult[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalVerified: number
    matched: number
    mismatched: number
    needsReview: number
    notFound: number
    errors: number
  }
}

interface VerificationResultsParams {
  clinicId?: string
  siteId?: string
  status?: VerificationStatus
  hasMismatch?: boolean
  page?: number
  limit?: number
}

interface ClinicVerificationDetail {
  clinic: {
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
    isActive: boolean
  }
  napHistory: {
    id: string
    oldName: string | null
    oldAddress: string | null
    oldPhone: string | null
    notes: string | null
    createdAt: string
  }[]
  siteResults: {
    site: {
      id: string
      name: string
      url: string
      editUrl: string | null
      registerUrl: string | null
      importance: string
      seoImpact: string
    }
    clinicSite: {
      id: string
      pageUrl: string | null
      status: string
      lastVerifiedAt: string | null
      verificationCount: number
    }
    latestVerification: {
      id: string
      searchQuery: string
      foundUrl: string | null
      detectedName: string | null
      detectedAddress: string | null
      detectedPhone: string | null
      nameMatch: string
      addressMatch: string
      phoneMatch: string
      overallStatus: VerificationStatus
      confidence: number
      verifiedAt: string
    } | null
    links: {
      clinicPage: string | null
      correctionRequest: string | null
      registration: string | null
    }
    status: VerificationStatus
    mismatchDetails: {
      field: "name" | "address" | "phone"
      expected: string
      detected: string | null
      matchStatus: string
      matchesOldNap: boolean
      matchedOldNapId: string | null
    }[]
  }[]
  summary: {
    totalSites: number
    verified: number
    matched: number
    mismatched: number
    needsReview: number
    notFound: number
    lastVerifiedAt: string | null
  }
}

interface VerifyNapRequest {
  clinicId: string
  siteIds?: string[]
  forceRefresh?: boolean
}

interface VerifyNapResponse {
  success: boolean
  message: string
  results: {
    clinicSiteId: string
    siteName: string
    status: VerificationStatus
    message: string
  }[]
  summary: {
    total: number
    success: number
    error: number
    skipped: number
  }
}

// ==========================================
// フック
// ==========================================

/**
 * 検証結果一覧を取得
 */
export function useVerificationResults(params: VerificationResultsParams = {}) {
  const queryString = new URLSearchParams()
  if (params.clinicId) queryString.set("clinicId", params.clinicId)
  if (params.siteId) queryString.set("siteId", params.siteId)
  if (params.status) queryString.set("status", params.status)
  if (params.hasMismatch) queryString.set("hasMismatch", "true")
  if (params.page) queryString.set("page", params.page.toString())
  if (params.limit) queryString.set("limit", params.limit.toString())

  return useQuery<VerificationResultsResponse>({
    queryKey: ["verification", "results", params],
    queryFn: () => api.get(`/verify/results?${queryString.toString()}`),
  })
}

/**
 * 医院別検証詳細を取得
 */
export function useClinicVerification(clinicId: string) {
  return useQuery<ClinicVerificationDetail>({
    queryKey: ["verification", "clinic", clinicId],
    queryFn: () => api.get(`/verify/clinics/${clinicId}`),
    enabled: !!clinicId,
  })
}

/**
 * NAP検証を実行
 */
export function useVerifyNap() {
  const queryClient = useQueryClient()

  return useMutation<VerifyNapResponse, Error, VerifyNapRequest>({
    mutationFn: (params) => api.post("/verify/nap", params),
    onSuccess: (_, variables) => {
      // 関連するキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ["verification"] })
      queryClient.invalidateQueries({
        queryKey: ["clinic", variables.clinicId],
      })
      queryClient.invalidateQueries({ queryKey: ["clinicSites"] })
    },
  })
}

/**
 * 検証サマリー統計を取得
 */
export function useVerificationSummary() {
  return useQuery<{
    totalVerified: number
    matched: number
    mismatched: number
    needsReview: number
    notFound: number
    errors: number
  }>({
    queryKey: ["verification", "summary"],
    queryFn: async () => {
      const response = await api.get<VerificationResultsResponse>(
        "/verify/results?limit=1"
      )
      return response.summary
    },
  })
}
