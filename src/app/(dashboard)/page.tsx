/**
 * ダッシュボードホームページ
 *
 * 全体の統計情報とクイックアクションを表示します。
 */

import Link from "next/link"
import {
  Building2,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileEdit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// 仮の統計データ（後でAPIから取得）
const stats = {
  totalClinics: 15,
  activeClinics: 12,
  totalSites: 45,
  masterSites: 20,
  overallMatchRate: 72,
  mismatchedCount: 23,
  pendingRequests: 8,
  needsFollowUp: 3,
}

const recentMismatches = [
  {
    id: "1",
    clinicName: "山田歯科クリニック",
    siteName: "EPARK歯科",
    issue: "電話番号が異なる",
    daysAgo: 2,
  },
  {
    id: "2",
    clinicName: "鈴木デンタルオフィス",
    siteName: "Google ビジネスプロフィール",
    issue: "住所が古い",
    daysAgo: 3,
  },
  {
    id: "3",
    clinicName: "田中歯科医院",
    siteName: "歯科タウン",
    issue: "医院名の表記揺れ",
    daysAgo: 5,
  },
]

const urgentTasks = [
  {
    id: "1",
    clinicName: "山田歯科クリニック",
    siteName: "Google ビジネスプロフィール",
    priority: "urgent",
    daysElapsed: 14,
  },
  {
    id: "2",
    clinicName: "鈴木デンタルオフィス",
    siteName: "Facebook",
    priority: "high",
    daysElapsed: 10,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <p className="text-gray-500 mt-1">
          NAP統一状況の概要と優先タスクを確認できます
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              登録医院数
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClinics}院</div>
            <p className="text-xs text-gray-500 mt-1">
              有効: {stats.activeClinics}院
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              登録サイト数
            </CardTitle>
            <Globe className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSites}件</div>
            <p className="text-xs text-gray-500 mt-1">
              マスタ: {stats.masterSites}件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              全体統一率
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.overallMatchRate}%
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${stats.overallMatchRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              要対応
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.mismatchedCount}件
            </div>
            <p className="text-xs text-gray-500 mt-1">
              依頼待ち: {stats.pendingRequests}件
            </p>
          </CardContent>
        </Card>
      </div>

      {/* クイックアクション & フォローアップ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 緊急タスク */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              フォローアップ必要
            </CardTitle>
            <CardDescription>
              依頼から7日以上経過しているタスク
            </CardDescription>
          </CardHeader>
          <CardContent>
            {urgentTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-gray-500">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <p>フォローアップ必要なタスクはありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div>
                      <div className="font-medium">{task.clinicName}</div>
                      <div className="text-sm text-gray-500">{task.siteName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          task.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {task.daysElapsed}日経過
                      </Badge>
                      <Link href={`/workspace`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                <Link href="/requests?filter=followup">
                  <Button variant="outline" className="w-full">
                    すべて表示
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近の不一致 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              最近検出された不一致
            </CardTitle>
            <CardDescription>
              直近で見つかったNAP不一致
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentMismatches.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-gray-500">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <p>不一致は検出されていません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMismatches.map((mismatch) => (
                  <div
                    key={mismatch.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                  >
                    <div>
                      <div className="font-medium">{mismatch.clinicName}</div>
                      <div className="text-sm text-gray-500">
                        {mismatch.siteName} - {mismatch.issue}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {mismatch.daysAgo}日前
                      </span>
                      <Link href={`/workspace`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                <Link href="/workspace">
                  <Button variant="outline" className="w-full">
                    ワークスペースで確認
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>よく使う機能へのショートカット</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/workspace">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <FileEdit className="h-6 w-6" />
                <span>ワークスペース</span>
              </Button>
            </Link>
            <Link href="/clinics/new">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Building2 className="h-6 w-6" />
                <span>医院を登録</span>
              </Button>
            </Link>
            <Link href="/sites/new">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Globe className="h-6 w-6" />
                <span>サイトを登録</span>
              </Button>
            </Link>
            <Link href="/requests">
              <Button variant="outline" className="w-full h-24 flex-col gap-2">
                <Clock className="h-6 w-6" />
                <span>修正依頼管理</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
