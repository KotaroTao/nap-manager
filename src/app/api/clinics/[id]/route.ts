/**
 * 医院API - 個別取得・更新・削除
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * 医院詳細を取得
 * GET /api/clinics/[id]
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

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        clinicNaps: {
          orderBy: { createdAt: "desc" },
        },
        clinicSites: {
          include: {
            site: true,
            correctionRequests: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { priorityScore: "desc" },
        },
      },
    })

    if (!clinic) {
      return NextResponse.json(
        { error: "医院が見つかりません" },
        { status: 404 }
      )
    }

    // 統計情報を計算
    const totalSites = clinic.clinicSites.length
    const matchedSites = clinic.clinicSites.filter(
      (cs) => cs.status === "matched"
    ).length
    const mismatchedSites = clinic.clinicSites.filter(
      (cs) => cs.status === "mismatched"
    ).length
    const needsReviewSites = clinic.clinicSites.filter(
      (cs) => cs.status === "needsReview"
    ).length
    const uncheckedSites = clinic.clinicSites.filter(
      (cs) => cs.status === "unchecked"
    ).length
    const matchRate = totalSites > 0 ? Math.round((matchedSites / totalSites) * 100) : 0

    return NextResponse.json({
      ...clinic,
      stats: {
        totalSites,
        matchedSites,
        mismatchedSites,
        needsReviewSites,
        uncheckedSites,
        matchRate,
      },
    })
  } catch (error) {
    console.error("医院詳細取得エラー:", error)
    return NextResponse.json(
      { error: "医院詳細の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 医院を更新
 * PUT /api/clinics/[id]
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
      name,
      nameKana,
      postalCode,
      prefecture,
      city,
      address,
      phone,
      fax,
      email,
      website,
      businessHours,
      closedDays,
      notes,
      isActive,
    } = body

    // 医院の存在確認
    const existingClinic = await prisma.clinic.findUnique({
      where: { id },
    })

    if (!existingClinic) {
      return NextResponse.json(
        { error: "医院が見つかりません" },
        { status: 404 }
      )
    }

    // 更新
    const clinic = await prisma.clinic.update({
      where: { id },
      data: {
        name,
        nameKana,
        postalCode,
        prefecture,
        city,
        address,
        phone,
        fax,
        email,
        website,
        businessHours,
        closedDays,
        notes,
        isActive,
      },
    })

    return NextResponse.json(clinic)
  } catch (error) {
    console.error("医院更新エラー:", error)
    return NextResponse.json(
      { error: "医院の更新に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 医院を削除
 * DELETE /api/clinics/[id]
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

    // 医院の存在確認
    const existingClinic = await prisma.clinic.findUnique({
      where: { id },
    })

    if (!existingClinic) {
      return NextResponse.json(
        { error: "医院が見つかりません" },
        { status: 404 }
      )
    }

    // 削除（関連データはカスケード削除される）
    await prisma.clinic.delete({
      where: { id },
    })

    return NextResponse.json({ message: "医院を削除しました" })
  } catch (error) {
    console.error("医院削除エラー:", error)
    return NextResponse.json(
      { error: "医院の削除に失敗しました" },
      { status: 500 }
    )
  }
}
