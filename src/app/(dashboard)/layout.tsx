/**
 * ダッシュボード用レイアウト
 * 
 * ログイン後の管理画面の共通レイアウトです。
 * サイドバーやヘッダーなどを配置します。
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // 未ログインの場合はログインページへ
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            デンタルNAPマネージャー
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session.user?.name || session.user?.email}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
