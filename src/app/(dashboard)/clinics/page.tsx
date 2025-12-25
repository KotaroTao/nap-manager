/**
 * 医院一覧ページ
 *
 * 登録されている医院の一覧を表示します。
 */

import Link from "next/link"
import { Plus, Search, Building2 } from "lucide-react"
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

// 仮のデータ（後でAPIから取得）
const clinics = [
  {
    id: "1",
    name: "山田歯科クリニック",
    prefecture: "東京都",
    city: "渋谷区",
    phone: "03-1234-5678",
    isActive: true,
    matchRate: 85,
  },
  {
    id: "2",
    name: "鈴木デンタルオフィス",
    prefecture: "神奈川県",
    city: "横浜市",
    phone: "045-123-4567",
    isActive: true,
    matchRate: 70,
  },
  {
    id: "3",
    name: "田中歯科医院",
    prefecture: "大阪府",
    city: "大阪市",
    phone: "06-1234-5678",
    isActive: false,
    matchRate: 60,
  },
]

export default function ClinicsPage() {
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
            <div className="text-2xl font-bold">{clinics.length}院</div>
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
              {clinics.filter((c) => c.isActive).length}院
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
              {Math.round(
                clinics.reduce((sum, c) => sum + c.matchRate, 0) / clinics.length
              )}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 検索 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="医院名で検索..." className="pl-10" />
        </div>
      </div>

      {/* テーブル */}
      <Card>
        <CardContent className="p-0">
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
        </CardContent>
      </Card>
    </div>
  )
}
