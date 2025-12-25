/**
 * 認証ページ用レイアウト
 * 
 * ログインページなど認証関連ページの共通レイアウトです。
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
