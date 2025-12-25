/**
 * Prismaクライアント
 * 
 * データベースに接続するための設定です。
 * アプリ全体で1つの接続を使い回すようにしています。
 */

import { PrismaClient } from "@prisma/client"

// グローバル変数の型定義
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 既存の接続があれば使い回す、なければ新規作成
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// 開発環境では接続を使い回す（毎回新規作成しない）
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
