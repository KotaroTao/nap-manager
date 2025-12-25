/**
 * 認証設定 (NextAuth.js v5)
 * 
 * ログイン・ログアウトの仕組みを定義しています。
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  // セッション設定（ログイン状態の管理方法）
  session: {
    strategy: "jwt", // JWT（トークン）方式を使用
    maxAge: 24 * 60 * 60, // 24時間でログアウト
  },

  // ページ設定
  pages: {
    signIn: "/login", // ログインページのURL
  },

  // 認証プロバイダー（ログイン方法）の設定
  providers: [
    Credentials({
      // メールアドレスとパスワードでログイン
      name: "credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },

      // ログイン処理
      async authorize(credentials) {
        // 入力チェック
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // データベースから管理者を検索
        const admin = await prisma.admin.findUnique({
          where: { email },
        })

        // 管理者が見つからない場合
        if (!admin) {
          return null
        }

        // アカウントロック中かチェック
        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
          throw new Error("アカウントがロックされています。しばらくしてからお試しください。")
        }

        // パスワードの照合
        const isPasswordValid = await compare(password, admin.passwordHash)

        if (!isPasswordValid) {
          // ログイン失敗：失敗回数をカウント
          const newFailedAttempts = admin.failedLoginAttempts + 1
          
          // 5回失敗でロック（30分間）
          const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
            failedLoginAttempts: newFailedAttempts,
          }
          
          if (newFailedAttempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30分後
          }

          await prisma.admin.update({
            where: { id: admin.id },
            data: updateData,
          })

          return null
        }

        // ログイン成功：失敗回数をリセット
        await prisma.admin.update({
          where: { id: admin.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        })

        // ユーザー情報を返す
        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        }
      },
    }),
  ],

  // コールバック（追加処理）
  callbacks: {
    // JWTにユーザー情報を追加
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },

    // セッションにユーザー情報を追加
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
