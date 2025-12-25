/**
 * パスワードリセット要求API
 *
 * パスワードリセットトークンを生成し、メールを送信します。
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

/**
 * パスワードリセットを要求
 * POST /api/auth/forgot-password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスを入力してください" },
        { status: 400 }
      )
    }

    // 管理者を検索
    const admin = await prisma.admin.findUnique({
      where: { email },
    })

    // セキュリティのため、存在しなくても成功レスポンスを返す
    if (!admin) {
      return NextResponse.json({
        message: "パスワードリセットのメールを送信しました（登録されている場合）",
      })
    }

    // 既存の未使用トークンを無効化
    await prisma.passwordResetToken.updateMany({
      where: {
        email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        expiresAt: new Date(), // 有効期限を過去に設定して無効化
      },
    })

    // 新しいトークンを生成（32バイト = 64文字の16進数）
    const token = randomBytes(32).toString("hex")

    // トークンを保存（1時間有効）
    await prisma.passwordResetToken.create({
      data: {
        token,
        email,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1時間後
      },
    })

    // TODO: 実際のメール送信処理を実装
    // 開発環境ではコンソールにリセットURLを出力
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`
    console.log("=== パスワードリセットURL ===")
    console.log(resetUrl)
    console.log("============================")

    return NextResponse.json({
      message: "パスワードリセットのメールを送信しました（登録されている場合）",
      // 開発環境用: 本番では削除
      ...(process.env.NODE_ENV === "development" && { resetUrl }),
    })
  } catch (error) {
    console.error("パスワードリセット要求エラー:", error)
    return NextResponse.json(
      { error: "パスワードリセットの処理に失敗しました" },
      { status: 500 }
    )
  }
}
