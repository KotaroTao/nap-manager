/**
 * 医院一覧ページ
 *
 * 登録されている医院の一覧を表示します。
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, Building2, Loader2 } from "lucide-react"
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
import { useClinics } from "@/hooks/use-clinics"
import { useDebounce } from "@/hooks/use-debounce"

export default function ClinicsPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, error } = useClinics({
    search: debouncedSearch || undefined,
  })

  const clinics = data?.clinics ?? []
  const pagination = data?.pagination

  // 統計計算
  const totalClinics = pagination?.total ?? 0
  const activeClinics = clinics.filter((c) => c.isActive).length
  const averageMatchRate =
    clinics.length > 0
      ? Math.round(clinics.reduce((sum, c) => sum + c.matchRate, 0) / clinics.length)
      : 0

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">医院管理</h2>
          <p className="text-gray-500 mt-1">
            登録されている医院の一覧と管理
          </p>
        </div>
        <Link href="/clinics/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            医院を登録
          </Button>
        </Link>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              登録医院数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "-" : `${totalClinics}院`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              有効な医院
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? "-" : `${activeClinics}院`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              平均統一率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? "-" : `${averageMatchRate}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 検索 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="医院名で検索..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* テーブル */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-red-500">
              データの取得に失敗しました
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>医院名</TableHead>
                  <TableHead>所在地</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>統一率</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Building2 className="h-8 w-8" />
                        <p>医院が登録されていません</p>
                        <Link href="/clinics/new">
                          <Button variant="outline" size="sm">
                            最初の医院を登録
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  clinics.map((clinic) => (
                    <TableRow key={clinic.id}>
                      <TableCell className="font-medium">{clinic.name}</TableCell>
                      <TableCell>
                        {clinic.prefecture}
                        {clinic.city}
                      </TableCell>
                      <TableCell>{clinic.phone}</TableCell>
                      <TableCell>
                        <Badge variant={clinic.isActive ? "success" : "secondary"}>
                          {clinic.isActive ? "有効" : "無効"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${clinic.matchRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{clinic.matchRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/clinics/${clinic.id}`}>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
