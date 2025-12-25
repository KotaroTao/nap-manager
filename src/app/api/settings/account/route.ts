/**
 * アカウント設定API
 */

import { NextRequest, NextResponse } from "next/server"
import { compare, hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * アカウント情報を取得
 * GET /api/settings/account
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
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!admin) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      )
    }

    return NextResponse.json(admin)
  } catch (error) {
    console.error("アカウント情報取得エラー:", error)
    return NextResponse.json(
      { error: "アカウント情報の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * アカウント情報を更新
 * PUT /api/settings/account
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
    const { name, email, currentPassword, newPassword } = body

    // 更新データ
    const updateData: { name?: string; email?: string; passwordHash?: string } = {}

    // 名前の更新
    if (name && name !== admin.name) {
      updateData.name = name
    }

    // メールアドレスの更新
    if (email && email !== admin.email) {
      // 重複チェック
      const existingAdmin = await prisma.admin.findUnique({
        where: { email },
      })
      if (existingAdmin) {
        return NextResponse.json(
          { error: "このメールアドレスは既に使用されています" },
          { status: 400 }
        )
      }
      updateData.email = email
    }

    // パスワードの更新
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "現在のパスワードを入力してください" },
          { status: 400 }
        )
      }

      // 現在のパスワードを確認
      const isPasswordValid = await compare(currentPassword, admin.passwordHash)
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "現在のパスワードが正しくありません" },
          { status: 400 }
        )
      }

      // パスワードの最小長チェック
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "パスワードは8文字以上で設定してください" },
          { status: 400 }
        )
      }

      // 新しいパスワードをハッシュ化
      updateData.passwordHash = await hash(newPassword, 12)
    }

    // 更新するものがなければ
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(admin)
    }

    // 更新実行
    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json(updatedAdmin)
  } catch (error) {
    console.error("アカウント更新エラー:", error)
    return NextResponse.json(
      { error: "アカウント情報の更新に失敗しました" },
      { status: 500 }
    )
  }
}
