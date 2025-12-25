/**
 * 修正依頼API - 個別取得・更新・削除
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { CorrectionRequestStatus, RequestMethod } from "@/types/prisma"

/**
 * 修正依頼詳細を取得
 * GET /api/correction-requests/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params

    const correctionRequest = await prisma.correctionRequest.findUnique({
      where: { id },
      include: {
        clinicSite: {
          include: {
            clinic: true,
            site: true,
          },
        },
        requestHistories: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!correctionRequest) {
      return NextResponse.json(
        { error: "修正依頼が見つかりません" },
        { status: 404 }
      )
    }

    // 経過日数を計算
    let daysElapsed: number | null = null
    if (correctionRequest.requestedAt) {
      const now = new Date()
      const requestedAt = new Date(correctionRequest.requestedAt)
      daysElapsed = Math.floor(
        (now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    }

    return NextResponse.json({
      ...correctionRequest,
      daysElapsed,
    })
  } catch (error) {
    console.error("修正依頼詳細取得エラー:", error)
    return NextResponse.json(
      { error: "修正依頼詳細の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 修正依頼を更新
 * PUT /api/correction-requests/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      status,
      requestMethod,
      templateText,
      reminderAt,
      notes,
    } = body

    // 修正依頼の存在確認
    const existingRequest = await prisma.correctionRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: "修正依頼が見つかりません" },
        { status: 404 }
      )
    }

    // ステータス変更時の処理
    const updateData: {
      status?: CorrectionRequestStatus
      requestMethod?: RequestMethod
      templateText?: string
      reminderAt?: Date | null
      notes?: string
      requestedAt?: Date
    } = {}

    if (status) {
      updateData.status = status as CorrectionRequestStatus

      // 「依頼済み」に変更された場合、依頼日時を記録
      if (status === "requested" && !existingRequest.requestedAt) {
        updateData.requestedAt = new Date()
      }
    }

    if (requestMethod !== undefined) {
      updateData.requestMethod = requestMethod as RequestMethod
    }

    if (templateText !== undefined) {
      updateData.templateText = templateText
    }

    if (reminderAt !== undefined) {
      updateData.reminderAt = reminderAt ? new Date(reminderAt) : null
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    // トランザクションで更新と履歴作成を行う
    const correctionRequest = await prisma.$transaction(async (tx) => {
      // 更新
      const updated = await tx.correctionRequest.update({
        where: { id },
        data: updateData,
        include: {
          clinicSite: {
            include: {
              clinic: true,
              site: true,
            },
          },
        },
      })

      // ステータスが変更された場合、履歴を作成
      if (status && status !== existingRequest.status) {
        await tx.requestHistory.create({
          data: {
            correctionRequestId: id,
            action: `ステータスを「${getStatusLabel(existingRequest.status)}」から「${getStatusLabel(status)}」に変更`,
            notes: notes || undefined,
          },
        })
      }

      return updated
    })

    return NextResponse.json(correctionRequest)
  } catch (error) {
    console.error("修正依頼更新エラー:", error)
    return NextResponse.json(
      { error: "修正依頼の更新に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 修正依頼を削除
 * DELETE /api/correction-requests/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params

    // 修正依頼の存在確認
    const existingRequest = await prisma.correctionRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: "修正依頼が見つかりません" },
        { status: 404 }
      )
    }

    // 削除（関連データはカスケード削除される）
    await prisma.correctionRequest.delete({
      where: { id },
    })

    return NextResponse.json({ message: "修正依頼を削除しました" })
  } catch (error) {
    console.error("修正依頼削除エラー:", error)
    return NextResponse.json(
      { error: "修正依頼の削除に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 履歴を追加
 * POST /api/correction-requests/[id]/history
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action, notes, attachmentUrl } = body

    // 修正依頼の存在確認
    const existingRequest = await prisma.correctionRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: "修正依頼が見つかりません" },
        { status: 404 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: "アクション内容は必須です" },
        { status: 400 }
      )
    }

    // 履歴を作成
    const history = await prisma.requestHistory.create({
      data: {
        correctionRequestId: id,
        action,
        notes,
        attachmentUrl,
      },
    })

    return NextResponse.json(history, { status: 201 })
  } catch (error) {
    console.error("履歴追加エラー:", error)
    return NextResponse.json(
      { error: "履歴の追加に失敗しました" },
      { status: 500 }
    )
  }
}

// ステータスのラベルを取得
function getStatusLabel(status: CorrectionRequestStatus): string {
  const labels: Record<CorrectionRequestStatus, string> = {
    pending: "未対応",
    requested: "依頼済み",
    inProgress: "対応中",
    completed: "完了",
    impossible: "対応不可",
    onHold: "保留",
  }
  return labels[status] || status
}
