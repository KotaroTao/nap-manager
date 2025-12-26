/**
 * ダッシュボードページ
 *
 * ログイン後最初に表示される画面です。
 * 全体のサマリーや優先対応事項を表示します。
 */

import Link from "next/link"

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h2>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">管理医院数</p>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">NAP統一率</p>
          <p className="text-3xl font-bold text-gray-900">--%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">要対応</p>
          <p className="text-3xl font-bold text-red-600">0件</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">完了待ち</p>
          <p className="text-3xl font-bold text-yellow-600">0件</p>
        </div>
      </div>

      {/* 優先対応セクション */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          優先対応（上位5件）
        </h3>
        <div className="text-gray-500 text-center py-8">
          対応が必要な項目はありません
        </div>
      </div>

      {/* クイックアクション */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          クイックアクション
        </h3>
        <div className="flex gap-4">
          <Link
            href="/clinics/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            医院を登録
          </Link>
          <Link
            href="/workspace"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            ワークスペースを開く
          </Link>
        </div>
      </div>
    </div>
  )
}
