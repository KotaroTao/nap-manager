/**
 * ダッシュボード用レイアウト
 *
 * ログイン後の管理画面の共通レイアウトです。
 * サイドバーとメインコンテンツエリアを配置します。
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/sonner"

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
    <div className="flex h-screen bg-gray-100">
      {/* サイドバー */}
      <Sidebar />

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session.user?.name || session.user?.email}
            </span>
          </div>
        </header>

        {/* コンテンツエリア */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* トースト通知 */}
      <Toaster position="top-right" />
    </div>
  )
}
