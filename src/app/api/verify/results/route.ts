/**
 * NAP検証結果API - 一覧取得
 * GET /api/verify/results
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { VerificationStatus } from "@/types"

/**
 * 検証結果一覧を取得
 * GET /api/verify/results
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
    const status = searchParams.get("status") as VerificationStatus | null
    const hasMismatch = searchParams.get("hasMismatch") === "true"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // フィルタ条件の構築
    const where: {
      clinicSite?: {
        clinicId?: string
        siteId?: string
      }
      overallStatus?: VerificationStatus | { in: VerificationStatus[] }
    } = {}

    if (clinicId || siteId) {
      where.clinicSite = {}
      if (clinicId) {
        where.clinicSite.clinicId = clinicId
      }
      if (siteId) {
        where.clinicSite.siteId = siteId
      }
    }

    if (status) {
      where.overallStatus = status
    } else if (hasMismatch) {
      where.overallStatus = { in: ["mismatch", "needsReview"] }
    }

    // 最新の検証結果のみを取得するサブクエリ
    const latestVerifications = await prisma.verificationLog.findMany({
      where,
      orderBy: { verifiedAt: "desc" },
      distinct: ["clinicSiteId"],
      skip,
      take: limit,
      include: {
        clinicSite: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                prefecture: true,
                city: true,
                address: true,
                phone: true,
              },
            },
            site: {
              select: {
                id: true,
                name: true,
                url: true,
                editUrl: true,
                registerUrl: true,
              },
            },
          },
        },
      },
    })

    // 総件数を取得（distinctのカウント）
    const distinctClinicSiteIds = await prisma.verificationLog.groupBy({
      by: ["clinicSiteId"],
      where,
    })
    const total = distinctClinicSiteIds.length

    // 統計情報を取得
    const [
      totalVerified,
      matched,
      mismatched,
      needsReview,
      notFound,
      errors,
    ] = await Promise.all([
      prisma.verificationLog.groupBy({
        by: ["clinicSiteId"],
      }).then((r) => r.length),
      prisma.verificationLog.groupBy({
        by: ["clinicSiteId"],
        where: { overallStatus: "verified" },
      }).then((r) => r.length),
      prisma.verificationLog.groupBy({
        by: ["clinicSiteId"],
        where: { overallStatus: "mismatch" },
      }).then((r) => r.length),
      prisma.verificationLog.groupBy({
        by: ["clinicSiteId"],
        where: { overallStatus: "needsReview" },
      }).then((r) => r.length),
      prisma.verificationLog.groupBy({
        by: ["clinicSiteId"],
        where: { overallStatus: "notFound" },
      }).then((r) => r.length),
      prisma.verificationLog.groupBy({
        by: ["clinicSiteId"],
        where: { overallStatus: "error" },
      }).then((r) => r.length),
    ])

    // レスポンス形式に変換
    const results = latestVerifications.map((log) => {
      const clinic = log.clinicSite.clinic
      const site = log.clinicSite.site
      const fullAddress = `${clinic.prefecture}${clinic.city}${clinic.address}`

      return {
        id: log.id,
        clinic: {
          id: clinic.id,
          name: clinic.name,
          address: fullAddress,
          phone: clinic.phone,
        },
        site: {
          id: site.id,
          name: site.name,
          url: site.url,
          correctionRequestUrl: site.editUrl,
          registrationUrl: site.registerUrl,
        },
        clinicPageUrl: log.foundUrl,
        expectedNap: {
          name: clinic.name,
          address: fullAddress,
          phone: clinic.phone,
        },
        detectedNap: {
          name: log.detectedName,
          address: log.detectedAddress,
          phone: log.detectedPhone,
        },
        matchResult: {
          name: log.nameMatch,
          address: log.addressMatch,
          phone: log.phoneMatch,
          overall: log.overallStatus,
        },
        links: {
          clinicPage: log.foundUrl,
          correctionRequest: site.editUrl,
          registration: site.registerUrl,
          siteSearch: `${site.url}/search?q=${encodeURIComponent(clinic.name)}`,
        },
        verifiedAt: log.verifiedAt.toISOString(),
        confidence: log.confidence,
      }
    })

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalVerified,
        matched,
        mismatched,
        needsReview,
        notFound,
        errors,
      },
    })
  } catch (error) {
    console.error("検証結果取得エラー:", error)
    return NextResponse.json(
      { error: "検証結果の取得に失敗しました" },
      { status: 500 }
    )
  }
}
