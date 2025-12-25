/**
 * 医院サイト紐付けAPI - 個別取得・更新・削除
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { ClinicSiteStatus, Priority } from "@/types/prisma"

/**
 * 優先度スコアを計算する
 */
function calculatePriorityScore(
  status: ClinicSiteStatus,
  priority: Priority,
  seoImpact: string,
  daysElapsed: number | null
): number {
  let score = 0

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

  if (daysElapsed && daysElapsed >= 7) {
    score += 20
  }

  return score
}

/**
 * 医院サイト紐付け詳細を取得
 * GET /api/clinic-sites/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params

    const clinicSite = await prisma.clinicSite.findUnique({
      where: { id },
      include: {
        clinic: true,
        site: true,
        correctionRequests: {
          include: {
            requestHistories: {
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!clinicSite) {
      return NextResponse.json(
        { error: "医院サイト紐付けが見つかりません" },
        { status: 404 }
      )
    }

    return NextResponse.json(clinicSite)
  } catch (error) {
    console.error("医院サイト紐付け詳細取得エラー:", error)
    return NextResponse.json(
      { error: "医院サイト紐付け詳細の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 医院サイト紐付けを更新
 * PUT /api/clinic-sites/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      pageUrl,
      status,
      priority,
      detectedName,
      detectedAddress,
      detectedPhone,
      notes,
    } = body

    // 紐付けの存在確認
    const existingClinicSite = await prisma.clinicSite.findUnique({
      where: { id },
      include: {
        site: true,
        correctionRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    if (!existingClinicSite) {
      return NextResponse.json(
        { error: "医院サイト紐付けが見つかりません" },
        { status: 404 }
      )
    }

    // 経過日数を計算
    let daysElapsed: number | null = null
    const latestRequest = existingClinicSite.correctionRequests[0]
    if (latestRequest?.requestedAt) {
      const now = new Date()
      const requestedAt = new Date(latestRequest.requestedAt)
      daysElapsed = Math.floor(
        (now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    }

    // 優先度スコアを再計算
    const newStatus = (status as ClinicSiteStatus) || existingClinicSite.status
    const newPriority = (priority as Priority) || existingClinicSite.priority
    const priorityScore = calculatePriorityScore(
      newStatus,
      newPriority,
      existingClinicSite.site.seoImpact,
      daysElapsed
    )

    // 更新
    const clinicSite = await prisma.clinicSite.update({
      where: { id },
      data: {
        pageUrl,
        status: newStatus,
        priority: newPriority,
        priorityScore,
        detectedName,
        detectedAddress,
        detectedPhone,
        lastCheckedAt: new Date(),
        notes,
      },
      include: {
        clinic: true,
        site: true,
      },
    })

    return NextResponse.json(clinicSite)
  } catch (error) {
    console.error("医院サイト紐付け更新エラー:", error)
    return NextResponse.json(
      { error: "医院サイト紐付けの更新に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 医院サイト紐付けを削除
 * DELETE /api/clinic-sites/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params

    // 紐付けの存在確認
    const existingClinicSite = await prisma.clinicSite.findUnique({
      where: { id },
    })

    if (!existingClinicSite) {
      return NextResponse.json(
        { error: "医院サイト紐付けが見つかりません" },
        { status: 404 }
      )
    }

    // 削除（関連データはカスケード削除される）
    await prisma.clinicSite.delete({
      where: { id },
    })

    return NextResponse.json({ message: "医院サイト紐付けを削除しました" })
  } catch (error) {
    console.error("医院サイト紐付け削除エラー:", error)
    return NextResponse.json(
      { error: "医院サイト紐付けの削除に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 一括ステータス更新
 * PATCH /api/clinic-sites/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: "ステータスの指定が必要です" },
        { status: 400 }
      )
    }

    // 紐付けの存在確認
    const existingClinicSite = await prisma.clinicSite.findUnique({
      where: { id },
      include: { site: true },
    })

    if (!existingClinicSite) {
      return NextResponse.json(
        { error: "医院サイト紐付けが見つかりません" },
        { status: 404 }
      )
    }

    // 優先度スコアを再計算
    const priorityScore = calculatePriorityScore(
      status as ClinicSiteStatus,
      existingClinicSite.priority,
      existingClinicSite.site.seoImpact,
      null
    )

    // ステータスのみ更新
    const clinicSite = await prisma.clinicSite.update({
      where: { id },
      data: {
        status: status as ClinicSiteStatus,
        priorityScore,
        lastCheckedAt: new Date(),
      },
    })

    return NextResponse.json(clinicSite)
  } catch (error) {
    console.error("医院サイト紐付けステータス更新エラー:", error)
    return NextResponse.json(
      { error: "ステータスの更新に失敗しました" },
      { status: 500 }
    )
  }
}
