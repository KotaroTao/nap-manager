/**
 * ダッシュボード関連のカスタムフック
 */

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface DashboardStats {
  totalClinics: number
  activeClinics: number
  totalSites: number
  masterSites: number
  overallMatchRate: number
  matchedCount: number
  mismatchedCount: number
  needsReviewCount: number
  uncheckedCount: number
  unregisteredCount: number
  inaccessibleCount: number
  pendingRequests: number
  needsFollowUp: number
}

export interface UrgentTask {
  id: string
  clinicId: string
  clinicName: string
  siteId: string
  siteName: string
  priority: "urgent" | "high"
  daysElapsed: number
}

export interface RecentMismatch {
  id: string
  clinicId: string
  clinicName: string
  siteId: string
  siteName: string
  issue: string
  daysAgo: number
}

export interface DashboardResponse {
  stats: DashboardStats
  urgentTasks: UrgentTask[]
  recentMismatches: RecentMismatch[]
}

// クエリキー
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
}

/**
 * ダッシュボード統計情報を取得
 */
export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => api.get<DashboardResponse>("/api/dashboard"),
    refetchInterval: 60000, // 1分ごとに自動更新
    staleTime: 30000, // 30秒間はキャッシュを使用
  })
}
