/**
 * サイトAPI - 一覧取得・新規作成
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { SiteCategory, SiteType1, SiteType2, EditMethod, Importance, SeoImpact } from "@/types/prisma"

/**
 * サイト一覧を取得
 * GET /api/sites
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
    const siteType = searchParams.get("siteType") as SiteCategory | null
    const type1 = searchParams.get("type1") as SiteType1 | null
    const type2 = searchParams.get("type2") as SiteType2 | null
    const isActive = searchParams.get("isActive")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // フィルタ条件の構築
    const where: {
      isActive?: boolean
      siteType?: SiteCategory
      type1?: SiteType1
      type2?: SiteType2
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; url?: { contains: string; mode: "insensitive" } }>
    } = {}

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true"
    }

    if (siteType) {
      where.siteType = siteType
    }

    if (type1) {
      where.type1 = type1
    }

    if (type2) {
      where.type2 = type2
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
      ]
    }

    // サイト一覧を取得
    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { siteType: "asc" },
          { importance: "asc" },
          { updatedAt: "desc" },
        ],
        include: {
          _count: {
            select: { clinicSites: true },
          },
        },
      }),
      prisma.site.count({ where }),
    ])

    // 紐付け医院数を追加
    const sitesWithStats = sites.map((site) => ({
      ...site,
      clinicCount: site._count.clinicSites,
    }))

    return NextResponse.json({
      sites: sitesWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("サイト一覧取得エラー:", error)
    return NextResponse.json(
      { error: "サイト一覧の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * サイトを新規作成
 * POST /api/sites
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
      url,
      registerUrl,
      editUrl,
      type1,
      type2,
      editMethod,
      importance,
      seoImpact,
      template,
      comment,
      siteType,
      autoLinkAllClinics,
    } = body

    // 必須フィールドのバリデーション
    if (!name || !url || !type1 || !type2 || !editMethod || !importance || !seoImpact) {
      return NextResponse.json(
        { error: "必須項目が入力されていません" },
        { status: 400 }
      )
    }

    // URLの重複チェック
    const existingSite = await prisma.site.findFirst({
      where: { url },
    })

    if (existingSite) {
      return NextResponse.json(
        { error: "このURLは既に登録されています" },
        { status: 400 }
      )
    }

    // トランザクションでサイト作成と医院紐付けを行う
    const site = await prisma.$transaction(async (tx) => {
      // サイトを作成
      const newSite = await tx.site.create({
        data: {
          name,
          url,
          registerUrl,
          editUrl,
          type1: type1 as SiteType1,
          type2: type2 as SiteType2,
          editMethod: editMethod as EditMethod,
          importance: importance as Importance,
          seoImpact: seoImpact as SeoImpact,
          template,
          comment,
          siteType: (siteType as SiteCategory) || "manual",
        },
      })

      // マスタサイトの場合、全医院に自動紐付け
      if (siteType === "master" && autoLinkAllClinics) {
        const allClinics = await tx.clinic.findMany({
          where: { isActive: true },
          select: { id: true },
        })

        if (allClinics.length > 0) {
          await tx.clinicSite.createMany({
            data: allClinics.map((clinic) => ({
              clinicId: clinic.id,
              siteId: newSite.id,
              status: "unchecked",
              priority: "medium",
            })),
          })
        }
      }

      return newSite
    })

    return NextResponse.json(site, { status: 201 })
  } catch (error) {
    console.error("サイト作成エラー:", error)
    return NextResponse.json(
      { error: "サイトの作成に失敗しました" },
      { status: 500 }
    )
  }
}
