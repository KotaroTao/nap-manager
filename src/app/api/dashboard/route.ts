/**
 * ダッシュボードAPI - 統計情報取得
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * ダッシュボード統計情報を取得
 * GET /api/dashboard
 */
export async function GET() {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    // 並行してデータを取得
    const [
      totalClinics,
      activeClinics,
      totalSites,
      masterSites,
      clinicSiteStats,
      pendingRequests,
      followUpRequests,
      recentMismatches,
    ] = await Promise.all([
      // 医院数
      prisma.clinic.count(),
      prisma.clinic.count({ where: { isActive: true } }),

      // サイト数
      prisma.site.count(),
      prisma.site.count({ where: { siteType: "master" } }),

      // 医院別サイトのステータス集計
      prisma.clinicSite.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // 未対応の修正依頼
      prisma.correctionRequest.count({
        where: { status: "pending" },
      }),

      // フォローアップが必要な依頼（依頼済みで7日以上経過）
      prisma.correctionRequest.findMany({
        where: {
          status: "requested",
          requestedAt: {
            lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          clinicSite: {
            include: {
              clinic: { select: { id: true, name: true } },
              site: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { requestedAt: "asc" },
        take: 5,
      }),

      // 最近の不一致（直近7日以内に検出）
      prisma.clinicSite.findMany({
        where: {
          status: { in: ["mismatched", "needsReview"] },
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          clinic: { select: { id: true, name: true } },
          site: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ])

    // ステータス別集計を整理
    const statusCounts: Record<string, number> = {}
    clinicSiteStats.forEach((stat) => {
      statusCounts[stat.status] = stat._count.status
    })

    const matchedCount = statusCounts["matched"] || 0
    const mismatchedCount = statusCounts["mismatched"] || 0
    const needsReviewCount = statusCounts["needsReview"] || 0
    const uncheckedCount = statusCounts["unchecked"] || 0
    const unregisteredCount = statusCounts["unregistered"] || 0
    const inaccessibleCount = statusCounts["inaccessible"] || 0

    const totalClinicSites = Object.values(statusCounts).reduce((a, b) => a + b, 0)
    const checkedCount = totalClinicSites - uncheckedCount
    const overallMatchRate = checkedCount > 0
      ? Math.round((matchedCount / checkedCount) * 100)
      : 0

    // フォローアップタスクを整形
    const urgentTasks = followUpRequests.map((req) => {
      const daysElapsed = req.requestedAt
        ? Math.floor((Date.now() - req.requestedAt.getTime()) / (24 * 60 * 60 * 1000))
        : 0
      return {
        id: req.id,
        clinicId: req.clinicSite.clinic.id,
        clinicName: req.clinicSite.clinic.name,
        siteId: req.clinicSite.site.id,
        siteName: req.clinicSite.site.name,
        priority: daysElapsed >= 14 ? "urgent" : "high",
        daysElapsed,
      }
    })

    // 最近の不一致を整形
    const recentMismatchList = recentMismatches.map((cs) => {
      const daysAgo = Math.floor(
        (Date.now() - cs.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
      )

      // 不一致の内容を判定
      let issue = "情報の確認が必要"
      if (cs.status === "mismatched") {
        if (cs.detectedName && cs.detectedName !== cs.clinic.name) {
          issue = "医院名が異なる"
        } else if (cs.detectedPhone) {
          issue = "電話番号が異なる"
        } else if (cs.detectedAddress) {
          issue = "住所が異なる"
        }
      } else if (cs.status === "needsReview") {
        issue = "確認が必要"
      }

      return {
        id: cs.id,
        clinicId: cs.clinic.id,
        clinicName: cs.clinic.name,
        siteId: cs.site.id,
        siteName: cs.site.name,
        issue,
        daysAgo,
      }
    })

    return NextResponse.json({
      stats: {
        totalClinics,
        activeClinics,
        totalSites,
        masterSites,
        overallMatchRate,
        matchedCount,
        mismatchedCount,
        needsReviewCount,
        uncheckedCount,
        unregisteredCount,
        inaccessibleCount,
        pendingRequests,
        needsFollowUp: urgentTasks.length,
      },
      urgentTasks,
      recentMismatches: recentMismatchList,
    })
  } catch (error) {
    console.error("ダッシュボード取得エラー:", error)
    return NextResponse.json(
      { error: "ダッシュボード情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}
