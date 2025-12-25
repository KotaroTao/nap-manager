/**
 * メールテンプレートAPI
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * デフォルトメールテンプレートを取得
 * GET /api/settings/email-templates
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

    // デフォルトテンプレートを取得
    let template = await prisma.emailTemplate.findFirst({
      where: { isDefault: true },
    })

    // なければデフォルト値を返す
    if (!template) {
      template = {
        id: "",
        name: "デフォルト修正依頼テンプレート",
        subject: "【NAP情報修正依頼】{clinic_name}の情報修正のお願い",
        body: `お世話になっております。
{clinic_name}の情報管理担当です。

貴サイトに掲載されている当院の情報について、
以下の通り修正をお願いいたします。

■ 現在の掲載情報
医院名: {current_name}
住所: {current_address}
電話番号: {current_phone}

■ 正しい情報
医院名: {correct_name}
住所: {correct_address}
電話番号: {correct_phone}

お手数をおかけしますが、
ご対応のほどよろしくお願いいたします。`,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("テンプレート取得エラー:", error)
    return NextResponse.json(
      { error: "テンプレートの取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * デフォルトメールテンプレートを更新
 * PUT /api/settings/email-templates
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject, body: templateBody } = body

    if (!subject || !templateBody) {
      return NextResponse.json(
        { error: "件名と本文は必須です" },
        { status: 400 }
      )
    }

    // 既存のデフォルトテンプレートを探す
    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: { isDefault: true },
    })

    let template
    if (existingTemplate) {
      template = await prisma.emailTemplate.update({
        where: { id: existingTemplate.id },
        data: {
          subject,
          body: templateBody,
        },
      })
    } else {
      template = await prisma.emailTemplate.create({
        data: {
          name: "デフォルト修正依頼テンプレート",
          subject,
          body: templateBody,
          isDefault: true,
        },
      })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error("テンプレート更新エラー:", error)
    return NextResponse.json(
      { error: "テンプレートの更新に失敗しました" },
      { status: 500 }
    )
  }
}
