/**
 * 医院別NAP検証詳細API
 * GET /api/verify/clinics/[id]
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * 医院別検証詳細を取得
 * GET /api/verify/clinics/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id: clinicId } = await params

    // 医院情報を取得
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        clinicNaps: {
          orderBy: { createdAt: "desc" },
        },
        clinicSites: {
          include: {
            site: true,
            verificationLogs: {
              orderBy: { verifiedAt: "desc" },
              take: 1,
            },
          },
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
    const stats = {
      verified: 0,
      matched: 0,
      mismatched: 0,
      needsReview: 0,
      notFound: 0,
      lastVerifiedAt: null as Date | null,
    }

    // サイト別検証結果を整形
    const siteResults = clinic.clinicSites.map((clinicSite) => {
      const latestLog = clinicSite.verificationLogs[0] || null
      const site = clinicSite.site
      const fullAddress = `${clinic.prefecture}${clinic.city}${clinic.address}`

      if (latestLog) {
        stats.verified++
        switch (latestLog.overallStatus) {
          case "verified":
            stats.matched++
            break
          case "mismatch":
            stats.mismatched++
            break
          case "needsReview":
            stats.needsReview++
            break
          case "notFound":
            stats.notFound++
            break
        }
        if (!stats.lastVerifiedAt || latestLog.verifiedAt > stats.lastVerifiedAt) {
          stats.lastVerifiedAt = latestLog.verifiedAt
        }
      }

      // 不一致詳細を生成
      const mismatchDetails: {
        field: "name" | "address" | "phone"
        expected: string
        detected: string | null
        matchStatus: string
        matchesOldNap: boolean
        matchedOldNapId: string | null
      }[] = []

      if (latestLog) {
        // 医院名の不一致チェック
        if (latestLog.nameMatch !== "match") {
          const matchingOldNap = clinic.clinicNaps.find(
            (nap) => nap.oldName === latestLog.detectedName
          )
          mismatchDetails.push({
            field: "name",
            expected: clinic.name,
            detected: latestLog.detectedName,
            matchStatus: latestLog.nameMatch,
            matchesOldNap: !!matchingOldNap,
            matchedOldNapId: matchingOldNap?.id || null,
          })
        }

        // 住所の不一致チェック
        if (latestLog.addressMatch !== "match") {
          const matchingOldNap = clinic.clinicNaps.find(
            (nap) => nap.oldAddress === latestLog.detectedAddress
          )
          mismatchDetails.push({
            field: "address",
            expected: fullAddress,
            detected: latestLog.detectedAddress,
            matchStatus: latestLog.addressMatch,
            matchesOldNap: !!matchingOldNap,
            matchedOldNapId: matchingOldNap?.id || null,
          })
        }

        // 電話番号の不一致チェック
        if (latestLog.phoneMatch !== "match") {
          const matchingOldNap = clinic.clinicNaps.find(
            (nap) => nap.oldPhone === latestLog.detectedPhone
          )
          mismatchDetails.push({
            field: "phone",
            expected: clinic.phone,
            detected: latestLog.detectedPhone,
            matchStatus: latestLog.phoneMatch,
            matchesOldNap: !!matchingOldNap,
            matchedOldNapId: matchingOldNap?.id || null,
          })
        }
      }

      return {
        site: {
          id: site.id,
          name: site.name,
          url: site.url,
          editUrl: site.editUrl,
          registerUrl: site.registerUrl,
          importance: site.importance,
          seoImpact: site.seoImpact,
        },
        clinicSite: {
          id: clinicSite.id,
          pageUrl: clinicSite.pageUrl,
          status: clinicSite.status,
          lastVerifiedAt: clinicSite.lastVerifiedAt,
          verificationCount: clinicSite.verificationCount,
        },
        latestVerification: latestLog
          ? {
              id: latestLog.id,
              searchQuery: latestLog.searchQuery,
              foundUrl: latestLog.foundUrl,
              detectedName: latestLog.detectedName,
              detectedAddress: latestLog.detectedAddress,
              detectedPhone: latestLog.detectedPhone,
              nameMatch: latestLog.nameMatch,
              addressMatch: latestLog.addressMatch,
              phoneMatch: latestLog.phoneMatch,
              overallStatus: latestLog.overallStatus,
              confidence: latestLog.confidence,
              verifiedAt: latestLog.verifiedAt.toISOString(),
            }
          : null,
        links: {
          clinicPage: latestLog?.foundUrl || clinicSite.pageUrl,
          correctionRequest: site.editUrl,
          registration: site.registerUrl,
        },
        status: latestLog?.overallStatus || "pending",
        mismatchDetails,
      }
    })

    // 旧NAP情報を整形
    const napHistory = clinic.clinicNaps.map((nap) => ({
      id: nap.id,
      oldName: nap.oldName,
      oldAddress: nap.oldAddress,
      oldPhone: nap.oldPhone,
      notes: nap.notes,
      createdAt: nap.createdAt.toISOString(),
    }))

    // レスポンスを返す
    return NextResponse.json({
      clinic: {
        id: clinic.id,
        name: clinic.name,
        nameKana: clinic.nameKana,
        postalCode: clinic.postalCode,
        prefecture: clinic.prefecture,
        city: clinic.city,
        address: clinic.address,
        phone: clinic.phone,
        fax: clinic.fax,
        email: clinic.email,
        website: clinic.website,
        isActive: clinic.isActive,
      },
      napHistory,
      siteResults,
      summary: {
        totalSites: clinic.clinicSites.length,
        verified: stats.verified,
        matched: stats.matched,
        mismatched: stats.mismatched,
        needsReview: stats.needsReview,
        notFound: stats.notFound,
        lastVerifiedAt: stats.lastVerifiedAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error("医院別検証詳細取得エラー:", error)
    return NextResponse.json(
      { error: "医院別検証詳細の取得に失敗しました" },
      { status: 500 }
    )
  }
}
