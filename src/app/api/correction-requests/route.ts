/**
 * 修正依頼API - 一覧取得・新規作成
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { CorrectionRequestStatus, RequestMethod } from "@/types/prisma"

/**
 * 修正依頼一覧を取得
 * GET /api/correction-requests
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
    const clinicSiteId = searchParams.get("clinicSiteId")
    const clinicId = searchParams.get("clinicId")
    const status = searchParams.get("status") as CorrectionRequestStatus | null
    const needsFollowUp = searchParams.get("needsFollowUp") === "true"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // フィルタ条件の構築
    const where: {
      clinicSiteId?: string
      clinicSite?: { clinicId: string }
      status?: CorrectionRequestStatus
      AND?: Array<{
        status: CorrectionRequestStatus
        requestedAt: { lte: Date }
      }>
    } = {}

    if (clinicSiteId) {
      where.clinicSiteId = clinicSiteId
    }

    if (clinicId) {
      where.clinicSite = { clinicId }
    }

    if (status) {
      where.status = status
    }

    // フォローアップが必要なもの（依頼済みで7日以上経過）
    if (needsFollowUp) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      where.AND = [
        {
          status: "requested",
          requestedAt: { lte: sevenDaysAgo },
        },
      ]
    }

    // 修正依頼一覧を取得
    const [requests, total] = await Promise.all([
      prisma.correctionRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          clinicSite: {
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
                },
              },
            },
          },
          requestHistories: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      }),
      prisma.correctionRequest.count({ where }),
    ])

    // 経過日数を計算して追加
    const requestsWithDays = requests.map((req) => {
      let daysElapsed: number | null = null
      if (req.requestedAt) {
        const now = new Date()
        const requestedAt = new Date(req.requestedAt)
        daysElapsed = Math.floor(
          (now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      }
      return {
        ...req,
        daysElapsed,
      }
    })

    return NextResponse.json({
      requests: requestsWithDays,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("修正依頼一覧取得エラー:", error)
    return NextResponse.json(
      { error: "修正依頼一覧の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 修正依頼を新規作成
 * POST /api/correction-requests
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
      clinicSiteId,
      requestMethod,
      templateText,
      notes,
    } = body

    // 必須フィールドのバリデーション
    if (!clinicSiteId) {
      return NextResponse.json(
        { error: "医院サイト紐付けの指定が必要です" },
        { status: 400 }
      )
    }

    // 医院サイト紐付けの存在確認
    const clinicSite = await prisma.clinicSite.findUnique({
      where: { id: clinicSiteId },
    })

    if (!clinicSite) {
      return NextResponse.json(
        { error: "医院サイト紐付けが見つかりません" },
        { status: 404 }
      )
    }

    // 修正依頼を作成
    const correctionRequest = await prisma.correctionRequest.create({
      data: {
        clinicSiteId,
        status: "pending",
        requestMethod: requestMethod as RequestMethod | undefined,
        templateText,
        notes,
      },
      include: {
        clinicSite: {
          include: {
            clinic: true,
            site: true,
          },
        },
      },
    })

    return NextResponse.json(correctionRequest, { status: 201 })
  } catch (error) {
    console.error("修正依頼作成エラー:", error)
    return NextResponse.json(
      { error: "修正依頼の作成に失敗しました" },
      { status: 500 }
    )
  }
}
