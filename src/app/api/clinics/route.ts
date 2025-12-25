/**
 * 医院API - 一覧取得・新規作成
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * 医院一覧を取得
 * GET /api/clinics
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
    const search = searchParams.get("search") || ""
    const isActive = searchParams.get("isActive")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // フィルタ条件の構築
    const where: {
      isActive?: boolean
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; prefecture?: { contains: string; mode: "insensitive" }; city?: { contains: string; mode: "insensitive" } }>
    } = {}

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { prefecture: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ]
    }

    // 医院一覧を取得
    const [clinics, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          clinicSites: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      prisma.clinic.count({ where }),
    ])

    // 統一率を計算して追加
    const clinicsWithStats = clinics.map((clinic) => {
      const totalSites = clinic.clinicSites.length
      const matchedSites = clinic.clinicSites.filter(
        (cs) => cs.status === "matched"
      ).length
      const matchRate = totalSites > 0 ? Math.round((matchedSites / totalSites) * 100) : 0

      return {
        ...clinic,
        totalSites,
        matchedSites,
        matchRate,
      }
    })

    return NextResponse.json({
      clinics: clinicsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("医院一覧取得エラー:", error)
    return NextResponse.json(
      { error: "医院一覧の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 医院を新規作成
 * POST /api/clinics
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
      autoLinkMasterSites,
    } = body

    // 必須フィールドのバリデーション
    if (!name || !postalCode || !prefecture || !city || !address || !phone) {
      return NextResponse.json(
        { error: "必須項目が入力されていません" },
        { status: 400 }
      )
    }

    // トランザクションで医院作成とマスタサイト紐付けを行う
    const clinic = await prisma.$transaction(async (tx) => {
      // 医院を作成
      const newClinic = await tx.clinic.create({
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
        },
      })

      // マスタサイトを自動紐付け
      if (autoLinkMasterSites) {
        const masterSites = await tx.site.findMany({
          where: {
            siteType: "master",
            isActive: true,
          },
        })

        if (masterSites.length > 0) {
          await tx.clinicSite.createMany({
            data: masterSites.map((site) => ({
              clinicId: newClinic.id,
              siteId: site.id,
              status: "unchecked",
              priority: "medium",
            })),
          })
        }
      }

      return newClinic
    })

    return NextResponse.json(clinic, { status: 201 })
  } catch (error) {
    console.error("医院作成エラー:", error)
    return NextResponse.json(
      { error: "医院の作成に失敗しました" },
      { status: 500 }
    )
  }
}
