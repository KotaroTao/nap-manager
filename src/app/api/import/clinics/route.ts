/**
 * 医院インポートAPI
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface ImportClinicRow {
  name: string
  nameKana?: string
  postalCode: string
  prefecture: string
  city: string
  address: string
  phone: string
  fax?: string
  email?: string
  website?: string
  businessHours?: string
  closedDays?: string
  notes?: string
}

/**
 * CSVから医院を一括インポート
 * POST /api/import/clinics
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const autoLinkMasterSites = formData.get("autoLinkMasterSites") === "true"

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      )
    }

    // CSVファイルを読み込み
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "データ行がありません" },
        { status: 400 }
      )
    }

    // ヘッダー行を解析
    const headers = parseCSVLine(lines[0])
    const headerMap = new Map<string, number>()
    headers.forEach((header, index) => {
      headerMap.set(header.trim(), index)
    })

    // 必須カラムのチェック
    const requiredColumns = ["医院名", "郵便番号", "都道府県", "市区町村", "住所", "電話番号"]
    const missingColumns = requiredColumns.filter((col) => !headerMap.has(col))

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `必須カラムがありません: ${missingColumns.join(", ")}` },
        { status: 400 }
      )
    }

    // マスタサイト取得（自動紐付け用）
    const masterSites = autoLinkMasterSites
      ? await prisma.site.findMany({
          where: { siteType: "master", isActive: true },
          select: { id: true },
        })
      : []

    // データ行を処理
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])

      try {
        const row: ImportClinicRow = {
          name: getValue(values, headerMap, "医院名"),
          nameKana: getValue(values, headerMap, "医院名かな") || undefined,
          postalCode: getValue(values, headerMap, "郵便番号"),
          prefecture: getValue(values, headerMap, "都道府県"),
          city: getValue(values, headerMap, "市区町村"),
          address: getValue(values, headerMap, "住所"),
          phone: getValue(values, headerMap, "電話番号"),
          fax: getValue(values, headerMap, "FAX番号") || undefined,
          email: getValue(values, headerMap, "メールアドレス") || undefined,
          website: getValue(values, headerMap, "公式サイト") || undefined,
          businessHours: getValue(values, headerMap, "診療時間") || undefined,
          closedDays: getValue(values, headerMap, "休診日") || undefined,
          notes: getValue(values, headerMap, "備考") || undefined,
        }

        // バリデーション
        if (!row.name || !row.postalCode || !row.prefecture || !row.city || !row.address || !row.phone) {
          results.failed++
          results.errors.push(`行${i + 1}: 必須項目が空です`)
          continue
        }

        // 医院を作成
        await prisma.$transaction(async (tx) => {
          const clinic = await tx.clinic.create({
            data: row,
          })

          // マスタサイトを自動紐付け
          if (autoLinkMasterSites && masterSites.length > 0) {
            await tx.clinicSite.createMany({
              data: masterSites.map((site) => ({
                clinicId: clinic.id,
                siteId: site.id,
                status: "unchecked",
                priority: "medium",
              })),
            })
          }
        })

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`行${i + 1}: ${error instanceof Error ? error.message : "処理エラー"}`)
      }
    }

    return NextResponse.json({
      message: "インポートが完了しました",
      results,
    })
  } catch (error) {
    console.error("インポートエラー:", error)
    return NextResponse.json(
      { error: "インポートに失敗しました" },
      { status: 500 }
    )
  }
}

// CSVの1行をパース（ダブルクォート対応）
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// ヘッダーマップから値を取得
function getValue(
  values: string[],
  headerMap: Map<string, number>,
  key: string
): string {
  const index = headerMap.get(key)
  if (index === undefined) return ""
  return values[index]?.replace(/^"|"$/g, "") || ""
}
