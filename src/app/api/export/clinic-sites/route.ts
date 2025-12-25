/**
 * 医院サイト紐付けエクスポートAPI
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CLINIC_SITE_STATUS_LABELS } from "@/types"
import type { ClinicSiteStatus } from "@/types"

/**
 * 医院サイト紐付け一覧をCSVエクスポート
 * GET /api/export/clinic-sites
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as ClinicSiteStatus | null
    const clinicId = searchParams.get("clinicId")

    // フィルタ条件
    const where: { status?: ClinicSiteStatus; clinicId?: string } = {}
    if (status) where.status = status
    if (clinicId) where.clinicId = clinicId

    const clinicSites = await prisma.clinicSite.findMany({
      where,
      include: {
        clinic: {
          select: {
            name: true,
            phone: true,
            prefecture: true,
            city: true,
            address: true,
          },
        },
        site: {
          select: {
            name: true,
            url: true,
          },
        },
      },
      orderBy: [{ clinic: { name: "asc" } }, { site: { name: "asc" } }],
    })

    // CSVヘッダー
    const headers = [
      "ID",
      "医院名",
      "サイト名",
      "サイトURL",
      "掲載ページURL",
      "ステータス",
      "検出名",
      "検出住所",
      "検出電話番号",
      "正式名",
      "正式住所",
      "正式電話番号",
      "最終確認日",
      "備考",
    ]

    // CSV行を生成
    const rows = clinicSites.map((cs) => [
      cs.id,
      cs.clinic.name,
      cs.site.name,
      cs.site.url,
      cs.pageUrl || "",
      CLINIC_SITE_STATUS_LABELS[cs.status],
      cs.detectedName || "",
      cs.detectedAddress || "",
      cs.detectedPhone || "",
      cs.clinic.name,
      `${cs.clinic.prefecture}${cs.clinic.city}${cs.clinic.address}`,
      cs.clinic.phone,
      cs.lastCheckedAt?.toISOString().split("T")[0] || "",
      cs.notes || "",
    ])

    // CSV文字列を生成
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    // BOMを付けてUTF-8として返す
    const bom = "\uFEFF"
    const csvWithBom = bom + csvContent

    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="clinic_sites_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("紐付けエクスポートエラー:", error)
    return NextResponse.json(
      { error: "エクスポートに失敗しました" },
      { status: 500 }
    )
  }
}
