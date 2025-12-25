/**
 * 通知設定API
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * 通知設定を取得
 * GET /api/settings/notifications
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
      include: { notificationSettings: true },
    })

    if (!admin) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      )
    }

    // 設定がなければデフォルト値を返す
    const settings = admin.notificationSettings || {
      newMismatch: true,
      weeklySummary: true,
      followUpReminder: true,
      accessError: false,
      reminderDays: 7,
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("通知設定取得エラー:", error)
    return NextResponse.json(
      { error: "通知設定の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * 通知設定を更新
 * PUT /api/settings/notifications
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    })

    if (!admin) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { newMismatch, weeklySummary, followUpReminder, accessError, reminderDays } = body

    // upsertで設定を作成または更新
    const settings = await prisma.notificationSettings.upsert({
      where: { adminId: admin.id },
      update: {
        newMismatch,
        weeklySummary,
        followUpReminder,
        accessError,
        reminderDays,
      },
      create: {
        adminId: admin.id,
        newMismatch,
        weeklySummary,
        followUpReminder,
        accessError,
        reminderDays,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("通知設定更新エラー:", error)
    return NextResponse.json(
      { error: "通知設定の更新に失敗しました" },
      { status: 500 }
    )
  }
}
