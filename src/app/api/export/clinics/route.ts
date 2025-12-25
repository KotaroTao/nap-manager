/**
 * 医院エクスポートAPI
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * 医院一覧をCSVエクスポート
 * GET /api/export/clinics
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const clinics = await prisma.clinic.findMany({
      orderBy: { createdAt: "desc" },
    })

    // CSVヘッダー
    const headers = [
      "ID",
      "医院名",
      "医院名かな",
      "郵便番号",
      "都道府県",
      "市区町村",
      "住所",
      "電話番号",
      "FAX番号",
      "メールアドレス",
      "公式サイト",
      "診療時間",
      "休診日",
      "備考",
      "有効",
      "登録日",
      "更新日",
    ]

    // CSV行を生成
    const rows = clinics.map((clinic) => [
      clinic.id,
      clinic.name,
      clinic.nameKana || "",
      clinic.postalCode,
      clinic.prefecture,
      clinic.city,
      clinic.address,
      clinic.phone,
      clinic.fax || "",
      clinic.email || "",
      clinic.website || "",
      clinic.businessHours || "",
      clinic.closedDays || "",
      clinic.notes || "",
      clinic.isActive ? "有効" : "無効",
      clinic.createdAt.toISOString().split("T")[0],
      clinic.updatedAt.toISOString().split("T")[0],
    ])

    // CSV文字列を生成
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    // BOMを付けてUTF-8として返す（Excelで文字化けしないように）
    const bom = "\uFEFF"
    const csvWithBom = bom + csvContent

    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="clinics_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("医院エクスポートエラー:", error)
    return NextResponse.json(
      { error: "エクスポートに失敗しました" },
      { status: 500 }
    )
  }
}
