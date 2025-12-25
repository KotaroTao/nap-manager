/**
 * サイト一覧ページ
 *
 * 登録されているサイト（ポータルサイト、SNS等）の一覧を表示します。
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, Globe, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SITE_TYPE1_LABELS,
  SITE_TYPE2_LABELS,
  IMPORTANCE_LABELS,
} from "@/types"
import type { SiteType1, SiteType2, Importance } from "@/types"
import { useSites, type SiteWithStats } from "@/hooks/use-sites"
import { useDebounce } from "@/hooks/use-debounce"

const importanceColors: Record<Importance, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-800",
}

interface SiteTableProps {
  data: SiteWithStats[]
  isLoading: boolean
}

function SiteTable({ data, isLoading }: SiteTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>サイト名</TableHead>
          <TableHead>種別</TableHead>
          <TableHead>カテゴリ</TableHead>
          <TableHead>重要度</TableHead>
          <TableHead>紐付け医院</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead className="w-[100px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Globe className="h-8 w-8" />
                <p>サイトが登録されていません</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((site) => (
            <TableRow key={site.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{site.name}</span>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{SITE_TYPE1_LABELS[site.type1 as SiteType1]}</Badge>
              </TableCell>
              <TableCell>{SITE_TYPE2_LABELS[site.type2 as SiteType2]}</TableCell>
              <TableCell>
                <Badge className={importanceColors[site.importance as Importance]}>
                  {IMPORTANCE_LABELS[site.importance as Importance]}
                </Badge>
              </TableCell>
              <TableCell>{site.clinicCount}院</TableCell>
              <TableCell>
                <Badge variant={site.isActive ? "success" : "secondary"}>
                  {site.isActive ? "有効" : "無効"}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/sites/${site.id}`}>
                  <Button variant="ghost" size="sm">
                    詳細
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export default function SitesPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, error } = useSites({
    search: debouncedSearch || undefined,
  })

  const sites = data?.sites ?? []
  const pagination = data?.pagination

  const masterSites = sites.filter((s) => s.siteType === "master")
  const autoSites = sites.filter((s) => s.siteType === "auto")
  const manualSites = sites.filter((s) => s.siteType === "manual")

  const totalSites = pagination?.total ?? 0
  const highImportanceSites = sites.filter((s) => s.importance === "high").length
  const activeSites = sites.filter((s) => s.isActive).length

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">サイト管理</h2>
          <p className="text-gray-500 mt-1">
            NAP情報を確認するサイトの一覧と管理
          </p>
        </div>
        <Link href="/sites/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            サイトを追加
          </Button>
        </Link>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              総サイト数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "-" : totalSites}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              マスタサイト
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "-" : masterSites.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              重要度：高
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? "-" : highImportanceSites}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              有効なサイト
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? "-" : activeSites}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 検索 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="サイト名で検索..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="text-red-500 text-center py-4">
          データの取得に失敗しました
        </div>
      )}

      {/* タブ */}
      <Tabs defaultValue="master">
        <TabsList>
          <TabsTrigger value="master">
            マスタサイト ({isLoading ? "-" : masterSites.length})
          </TabsTrigger>
          <TabsTrigger value="auto">
            自動追加 ({isLoading ? "-" : autoSites.length})
          </TabsTrigger>
          <TabsTrigger value="manual">
            手動追加 ({isLoading ? "-" : manualSites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="master">
          <Card>
            <CardContent className="p-0">
              <SiteTable data={masterSites} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto">
          <Card>
            <CardContent className="p-0">
              <SiteTable data={autoSites} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardContent className="p-0">
              <SiteTable data={manualSites} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
