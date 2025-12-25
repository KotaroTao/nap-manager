/**
 * パスワードリセット実行API
 *
 * トークンを検証し、パスワードを更新します。
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

/**
 * トークンの有効性を確認
 * GET /api/auth/reset-password?token=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "トークンが必要です" },
        { status: 400 }
      )
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "無効なトークンです" },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "このトークンは既に使用されています" },
        { status: 400 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "トークンの有効期限が切れています" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.email,
    })
  } catch (error) {
    console.error("トークン検証エラー:", error)
    return NextResponse.json(
      { error: "トークンの検証に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * パスワードをリセット
 * POST /api/auth/reset-password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: "トークンと新しいパスワードが必要です" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で入力してください" },
        { status: 400 }
      )
    }

    // トークンを検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "無効なトークンです" },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "このトークンは既に使用されています" },
        { status: 400 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "トークンの有効期限が切れています" },
        { status: 400 }
      )
    }

    // 管理者を取得
    const admin = await prisma.admin.findUnique({
      where: { email: resetToken.email },
    })

    if (!admin) {
      return NextResponse.json(
        { error: "アカウントが見つかりません" },
        { status: 400 }
      )
    }

    // トランザクションでパスワード更新とトークン使用済みマーク
    await prisma.$transaction([
      prisma.admin.update({
        where: { id: admin.id },
        data: {
          passwordHash: await hash(password, 12),
          failedLoginAttempts: 0, // ログイン失敗回数をリセット
          lockedUntil: null, // ロックを解除
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({
      message: "パスワードが正常に更新されました",
    })
  } catch (error) {
    console.error("パスワードリセットエラー:", error)
    return NextResponse.json(
      { error: "パスワードのリセットに失敗しました" },
      { status: 500 }
    )
  }
}
