/**
 * プライオリティスコア計算ロジック
 *
 * 優先度スコア = サイト重要度 × SEO影響度 × ステータス緊急度
 */

import type { Importance, SeoImpact, ClinicSiteStatus, Priority } from "@/types"

// 重要度のスコア
const IMPORTANCE_SCORE: Record<Importance, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

// SEO影響度のスコア
const SEO_IMPACT_SCORE: Record<SeoImpact, number> = {
  large: 3,
  medium: 2,
  small: 1,
  none: 0,
}

// ステータス緊急度のスコア
const STATUS_URGENCY_SCORE: Record<ClinicSiteStatus, number> = {
  mismatched: 5,
  needsReview: 4,
  unregistered: 3,
  unchecked: 2,
  matched: 0,
  inaccessible: 1,
}

/**
 * プライオリティスコアを計算
 */
export function calculatePriorityScore(
  importance: Importance,
  seoImpact: SeoImpact,
  status: ClinicSiteStatus
): number {
  const importanceScore = IMPORTANCE_SCORE[importance]
  const seoScore = SEO_IMPACT_SCORE[seoImpact]
  const statusScore = STATUS_URGENCY_SCORE[status]

  return importanceScore * seoScore * statusScore
}

/**
 * スコアからプライオリティを決定
 */
export function getPriorityFromScore(score: number): Priority {
  if (score >= 30) return "urgent"
  if (score >= 15) return "high"
  if (score >= 5) return "medium"
  return "low"
}

/**
 * 完全なプライオリティ計算
 */
export function calculatePriority(
  importance: Importance,
  seoImpact: SeoImpact,
  status: ClinicSiteStatus
): { score: number; priority: Priority } {
  const score = calculatePriorityScore(importance, seoImpact, status)
  const priority = getPriorityFromScore(score)
  return { score, priority }
}
