/**
 * Prismaクライアント
 *
 * データベースに接続するための設定です。
 * アプリ全体で1つの接続を使い回すようにしています。
 *
 * 注意: `npx prisma generate` を実行してPrismaクライアントを生成してから使用してください。
 * Prismaクライアントが生成されていない場合は、開発用のモッククライアントが使用されます。
 */

// Prismaクライアントの型定義（開発用モック）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientType = any

let PrismaClient: new () => PrismaClientType

try {
  // Prismaクライアントが生成されている場合は使用
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  PrismaClient = require("@prisma/client").PrismaClient
} catch {
  // Prismaクライアントが生成されていない場合はモッククライアントを使用
  console.warn("Prisma Client not generated. Using mock client for development.")
  PrismaClient = class MockPrismaClient {
    // モッククライアントの実装
    clinic = createMockModel()
    site = createMockModel()
    clinicSite = createMockModel()
    clinicNap = createMockModel()
    correctionRequest = createMockModel()
    requestHistory = createMockModel()
    admin = createMockModel()
    notificationSettings = createMockModel()
    emailTemplate = createMockModel()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction = async (fn: (tx: any) => Promise<any>) => fn(this)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

// モックモデルを作成
function createMockModel() {
  return {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async () => ({}),
    createMany: async () => ({ count: 0 }),
    update: async () => ({}),
    delete: async () => ({}),
    count: async () => 0,
  }
}

// グローバル変数の型定義
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined
}

// 既存の接続があれば使い回す、なければ新規作成
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// 開発環境では接続を使い回す（毎回新規作成しない）
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
