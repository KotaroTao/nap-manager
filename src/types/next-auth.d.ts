/**
 * NextAuth.js の型拡張
 * 
 * セッション情報にカスタムのユーザー情報を追加するための型定義です。
 */

import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}
