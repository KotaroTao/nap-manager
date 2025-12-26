/**
 * NAP検証実行API
 * POST /api/verify/nap
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { MatchStatus, VerificationStatus } from "@prisma/client"

/**
 * 住所を正規化
 */
function normalizeAddress(address: string): string {
  return address
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)) // 全角→半角
    .replace(/－/g, "-")
    .replace(/ー/g, "-")
    .replace(/丁目/g, "-")
    .replace(/番地?/g, "-")
    .replace(/号/g, "")
    .replace(/\s+/g, "")
    .trim()
}

/**
 * 電話番号を正規化
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "") // 数字のみ抽出
}

/**
 * 文字列の類似度を計算（レーベンシュタイン距離ベース）
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  if (str1 === str2) return 1

  const len1 = str1.length
  const len2 = str2.length

  // レーベンシュタイン距離を計算
  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0))

  for (let i = 0; i <= len1; i++) dp[i][0] = i
  for (let j = 0; j <= len2; j++) dp[0][j] = j

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }

  const distance = dp[len1][len2]
  const maxLen = Math.max(len1, len2)
  return 1 - distance / maxLen
}

/**
 * NAP項目の一致状態を判定
 */
function determineMatchStatus(
  expected: string,
  detected: string | null,
  normalize: (s: string) => string = (s) => s
): { status: MatchStatus; similarity: number } {
  if (!detected) {
    return { status: "notFound", similarity: 0 }
  }

  const normalizedExpected = normalize(expected)
  const normalizedDetected = normalize(detected)

  if (normalizedExpected === normalizedDetected) {
    return { status: "match", similarity: 1 }
  }

  const similarity = calculateSimilarity(normalizedExpected, normalizedDetected)

  if (similarity >= 0.9) {
    return { status: "match", similarity }
  } else if (similarity >= 0.7) {
    return { status: "partialMatch", similarity }
  } else {
    return { status: "mismatch", similarity }
  }
}

/**
 * 総合ステータスを判定
 */
function determineOverallStatus(
  nameMatch: MatchStatus,
  addressMatch: MatchStatus,
  phoneMatch: MatchStatus
): VerificationStatus {
  // すべて一致
  if (
    nameMatch === "match" &&
    addressMatch === "match" &&
    phoneMatch === "match"
  ) {
    return "verified"
  }

  // いずれかが未検出
  if (
    nameMatch === "notFound" &&
    addressMatch === "notFound" &&
    phoneMatch === "notFound"
  ) {
    return "notFound"
  }

  // エラー
  if (
    nameMatch === "error" ||
    addressMatch === "error" ||
    phoneMatch === "error"
  ) {
    return "error"
  }

  // 不一致あり
  if (
    nameMatch === "mismatch" ||
    addressMatch === "mismatch" ||
    phoneMatch === "mismatch"
  ) {
    return "mismatch"
  }

  // 部分一致あり（要確認）
  return "needsReview"
}

/**
 * 検証を実行
 * POST /api/verify/nap
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const body = await request.json()
    const { clinicId, siteIds, forceRefresh } = body

    if (!clinicId) {
      return NextResponse.json(
        { error: "医院IDが必要です" },
        { status: 400 }
      )
    }

    // 医院情報を取得
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        clinicNaps: true,
        clinicSites: {
          include: {
            site: true,
          },
          where: siteIds ? { siteId: { in: siteIds } } : undefined,
        },
      },
    })

    if (!clinic) {
      return NextResponse.json(
        { error: "医院が見つかりません" },
        { status: 404 }
      )
    }

    // 検証対象のサイトがない場合
    if (clinic.clinicSites.length === 0) {
      return NextResponse.json(
        { error: "検証対象のサイトがありません" },
        { status: 400 }
      )
    }

    const fullAddress = `${clinic.prefecture}${clinic.city}${clinic.address}`
    const results: {
      clinicSiteId: string
      siteName: string
      status: VerificationStatus
      message: string
    }[] = []

    // 各サイトに対して検証を実行
    for (const clinicSite of clinic.clinicSites) {
      const site = clinicSite.site

      // キャッシュチェック（forceRefreshでない場合、24時間以内の結果があればスキップ）
      if (!forceRefresh && clinicSite.lastVerifiedAt) {
        const hoursSinceLastVerification =
          (Date.now() - clinicSite.lastVerifiedAt.getTime()) / (1000 * 60 * 60)
        if (hoursSinceLastVerification < 24) {
          results.push({
            clinicSiteId: clinicSite.id,
            siteName: site.name,
            status: "pending",
            message: "24時間以内に検証済みのためスキップしました",
          })
          continue
        }
      }

      try {
        // 検索クエリを生成
        const searchQuery = `${clinic.name} site:${new URL(site.url).hostname}`

        // ここでは実際のWeb検索は行わず、モックデータを使用
        // Phase 2で実際のWeb検索サービスを統合
        const mockDetectedData = {
          foundUrl: clinicSite.pageUrl || null,
          detectedName: clinicSite.detectedName || null,
          detectedAddress: clinicSite.detectedAddress || null,
          detectedPhone: clinicSite.detectedPhone || null,
        }

        // NAP照合
        const nameResult = determineMatchStatus(
          clinic.name,
          mockDetectedData.detectedName
        )
        const addressResult = determineMatchStatus(
          fullAddress,
          mockDetectedData.detectedAddress,
          normalizeAddress
        )
        const phoneResult = determineMatchStatus(
          clinic.phone,
          mockDetectedData.detectedPhone,
          normalizePhone
        )

        const overallStatus = determineOverallStatus(
          nameResult.status,
          addressResult.status,
          phoneResult.status
        )

        // 平均信頼度を計算
        const confidence =
          (nameResult.similarity +
            addressResult.similarity +
            phoneResult.similarity) /
          3

        // 検証ログを作成
        await prisma.verificationLog.create({
          data: {
            clinicSiteId: clinicSite.id,
            searchQuery,
            foundUrl: mockDetectedData.foundUrl,
            detectedName: mockDetectedData.detectedName,
            detectedAddress: mockDetectedData.detectedAddress,
            detectedPhone: mockDetectedData.detectedPhone,
            nameMatch: nameResult.status,
            addressMatch: addressResult.status,
            phoneMatch: phoneResult.status,
            overallStatus,
            confidence,
          },
        })

        // ClinicSiteを更新
        await prisma.clinicSite.update({
          where: { id: clinicSite.id },
          data: {
            lastVerifiedAt: new Date(),
            verificationCount: { increment: 1 },
            // ステータスを検証結果に基づいて更新
            status:
              overallStatus === "verified"
                ? "matched"
                : overallStatus === "mismatch"
                  ? "mismatched"
                  : overallStatus === "needsReview"
                    ? "needsReview"
                    : overallStatus === "notFound"
                      ? "unregistered"
                      : "unchecked",
            detectedName: mockDetectedData.detectedName,
            detectedAddress: mockDetectedData.detectedAddress,
            detectedPhone: mockDetectedData.detectedPhone,
            pageUrl: mockDetectedData.foundUrl || clinicSite.pageUrl,
            lastCheckedAt: new Date(),
          },
        })

        results.push({
          clinicSiteId: clinicSite.id,
          siteName: site.name,
          status: overallStatus,
          message: "検証が完了しました",
        })
      } catch (siteError) {
        console.error(`サイト ${site.name} の検証エラー:`, siteError)

        // エラーログを作成
        await prisma.verificationLog.create({
          data: {
            clinicSiteId: clinicSite.id,
            searchQuery: `${clinic.name} site:${new URL(site.url).hostname}`,
            nameMatch: "error",
            addressMatch: "error",
            phoneMatch: "error",
            overallStatus: "error",
            confidence: 0,
            errorMessage:
              siteError instanceof Error
                ? siteError.message
                : "不明なエラー",
          },
        })

        results.push({
          clinicSiteId: clinicSite.id,
          siteName: site.name,
          status: "error",
          message: "検証中にエラーが発生しました",
        })
      }
    }

    // 成功/失敗の集計
    const successCount = results.filter(
      (r) => r.status !== "error" && r.status !== "pending"
    ).length
    const errorCount = results.filter((r) => r.status === "error").length
    const skippedCount = results.filter((r) => r.status === "pending").length

    return NextResponse.json({
      success: true,
      message: `検証が完了しました。成功: ${successCount}, エラー: ${errorCount}, スキップ: ${skippedCount}`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        error: errorCount,
        skipped: skippedCount,
      },
    })
  } catch (error) {
    console.error("検証実行エラー:", error)
    return NextResponse.json(
      { error: "検証の実行に失敗しました" },
      { status: 500 }
    )
  }
}
