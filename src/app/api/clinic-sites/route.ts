/**
 * 医院サイト紐付けAPI - 一覧取得・新規作成
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { ClinicSiteStatus, Priority } from "@/types/prisma"

/**
 * 優先度スコアを計算する
 * 仕様書に基づく計算式:
 * - ステータス: 不一致(50) > 要確認(40) > 未チェック(20) > その他(0)
 * - 重要度: 緊急(100) > 高(50) > 中(20) > 低(10)
 * - SEO影響度: 大(30) > 中(15) > 小(5) > なし(0)
 * - 経過日数: 依頼から7日以上(20) > それ以外(0)
 */
function calculatePriorityScore(
  status: ClinicSiteStatus,
  priority: Priority,
  seoImpact: string,
  daysElapsed: number | null
): number {
  let score = 0

  // ステータスによるスコア
  switch (status) {
    case "mismatched":
      score += 50
      break
    case "needsReview":
      score += 40
      break
    case "unchecked":
      score += 20
      break
    default:
      score += 0
  }

  // 優先度によるスコア
  switch (priority) {
    case "urgent":
      score += 100
      break
    case "high":
      score += 50
      break
    case "medium":
      score += 20
      break
    case "low":
      score += 10
      break
  }

  // SEO影響度によるスコア
  switch (seoImpact) {
    case "large":
      score += 30
      break
    case "medium":
      score += 15
      break
    case "small":
      score += 5
      break
    default:
      score += 0
  }

  // 経過日数によるスコア
  if (daysElapsed && daysElapsed >= 7) {
    score += 20
  }

  return score
}

/**
 * 医院サイト紐付け一覧を取得
 * GET /api/clinic-sites
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get("clinicId")
    const siteId = searchParams.get("siteId")
    const status = searchParams.get("status") as ClinicSiteStatus | null
    const priority = searchParams.get("priority") as Priority | null
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // フィルタ条件の構築
    const where: {
      clinicId?: string
      siteId?: string
      status?: ClinicSiteStatus
      priority?: Priority
    } = {}

    if (clinicId) {
      where.clinicId = clinicId
    }

    if (siteId) {
      where.siteId = siteId
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    // 医院サイト紐付け一覧を取得
    const [clinicSites, total] = await Promise.all([
      prisma.clinicSite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { priorityScore: "desc" },
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              phone: true,
              prefecture: true,
              city: true,
              address: true,
            },
          },
          site: {
            select: {
              id: true,
              name: true,
              url: true,
              editUrl: true,
              editMethod: true,
              importance: true,
              seoImpact: true,
            },
          },
          correctionRequests: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.clinicSite.count({ where }),
    ])

    return NextResponse.json({
      clinicSites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("医院サイト紐付け一覧取得エラー:", error)
    return NextResponse.json(
      { error: "医院サイト紐付け一覧の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 医院サイト紐付けを新規作成
 * POST /api/clinic-sites
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      clinicId,
      siteId,
      pageUrl,
      status,
      priority,
      detectedName,
      detectedAddress,
      detectedPhone,
      notes,
    } = body

    // 必須フィールドのバリデーション
    if (!clinicId || !siteId) {
      return NextResponse.json(
        { error: "医院とサイトの指定が必要です" },
        { status: 400 }
      )
    }

    // 既存の紐付けチェック
    const existingClinicSite = await prisma.clinicSite.findUnique({
      where: {
        clinicId_siteId: {
          clinicId,
          siteId,
        },
      },
    })

    if (existingClinicSite) {
      return NextResponse.json(
        { error: "この医院とサイトは既に紐付けられています" },
        { status: 400 }
      )
    }

    // サイト情報を取得してスコア計算
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    })

    if (!site) {
      return NextResponse.json(
        { error: "サイトが見つかりません" },
        { status: 404 }
      )
    }

    const clinicSiteStatus = (status as ClinicSiteStatus) || "unchecked"
    const clinicSitePriority = (priority as Priority) || "medium"
    const priorityScore = calculatePriorityScore(
      clinicSiteStatus,
      clinicSitePriority,
      site.seoImpact,
      null
    )

    // 紐付けを作成
    const clinicSite = await prisma.clinicSite.create({
      data: {
        clinicId,
        siteId,
        pageUrl,
        status: clinicSiteStatus,
        priority: clinicSitePriority,
        priorityScore,
        detectedName,
        detectedAddress,
        detectedPhone,
        notes,
      },
      include: {
        clinic: true,
        site: true,
      },
    })

    return NextResponse.json(clinicSite, { status: 201 })
  } catch (error) {
    console.error("医院サイト紐付け作成エラー:", error)
    return NextResponse.json(
      { error: "医院サイト紐付けの作成に失敗しました" },
      { status: 500 }
    )
  }
}
