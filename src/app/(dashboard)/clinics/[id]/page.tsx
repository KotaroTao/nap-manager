/**
 * 医院詳細ページ
 *
 * 医院の詳細情報と関連するサイト情報を表示します。
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Pencil,
  Check,
  X,
  AlertCircle,
  Clock,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

// 仮のデータ
const clinic = {
  id: "1",
  name: "山田歯科クリニック",
  nameKana: "やまだしかくりにっく",
  postalCode: "150-0001",
  prefecture: "東京都",
  city: "渋谷区",
  address: "神宮前1-2-3 ABCビル5F",
  phone: "03-1234-5678",
  fax: "03-1234-5679",
  email: "info@yamada-dental.jp",
  website: "https://yamada-dental.jp",
  businessHours: "平日 9:00-19:00、土曜 9:00-13:00",
  closedDays: "日曜・祝日",
  notes: "",
  isActive: true,
}

const clinicSites = [
  {
    id: "1",
    siteName: "Google ビジネスプロフィール",
    status: "matched",
    pageUrl: "https://maps.google.com/...",
    lastCheckedAt: "2024-12-20",
  },
  {
    id: "2",
    siteName: "EPARK歯科",
    status: "mismatched",
    pageUrl: "https://epark.jp/...",
    lastCheckedAt: "2024-12-18",
  },
  {
    id: "3",
    siteName: "Yahoo!プレイス",
    status: "needsReview",
    pageUrl: "https://place.yahoo.co.jp/...",
    lastCheckedAt: "2024-12-15",
  },
  {
    id: "4",
    siteName: "歯科タウン",
    status: "unregistered",
    pageUrl: null,
    lastCheckedAt: null,
  },
  {
    id: "5",
    siteName: "Facebook",
    status: "unchecked",
    pageUrl: null,
    lastCheckedAt: null,
  },
]

const oldNaps = [
  {
    id: "1",
    oldName: "山田歯科医院",
    oldAddress: null,
    oldPhone: null,
    notes: "2020年に名称変更",
  },
]

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  matched: {
    label: "一致",
    color: "bg-green-100 text-green-800",
    icon: <Check className="h-3 w-3" />,
  },
  needsReview: {
    label: "要確認",
    color: "bg-yellow-100 text-yellow-800",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  mismatched: {
    label: "不一致",
    color: "bg-red-100 text-red-800",
    icon: <X className="h-3 w-3" />,
  },
  unregistered: {
    label: "未登録",
    color: "bg-blue-100 text-blue-800",
    icon: <Clock className="h-3 w-3" />,
  },
  unchecked: {
    label: "未チェック",
    color: "bg-gray-100 text-gray-800",
    icon: <Clock className="h-3 w-3" />,
  },
  inaccessible: {
    label: "アクセス不可",
    color: "bg-gray-800 text-white",
    icon: <Ban className="h-3 w-3" />,
  },
}

export default function ClinicDetailPage() {
  const params = useParams()
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fullAddress = `〒${clinic.postalCode} ${clinic.prefecture}${clinic.city}${clinic.address}`

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success("コピーしました")
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error("コピーに失敗しました")
    }
  }

  const copyAllNap = () => {
    const text = `${clinic.name}\n${fullAddress}\n${clinic.phone}`
    copyToClipboard(text, "all")
  }

  const matchedCount = clinicSites.filter((s) => s.status === "matched").length
  const matchRate = Math.round((matchedCount / clinicSites.length) * 100)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clinics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{clinic.name}</h2>
            <p className="text-gray-500">{clinic.nameKana}</p>
          </div>
          <Badge variant={clinic.isActive ? "success" : "secondary"}>
            {clinic.isActive ? "有効" : "無効"}
          </Badge>
        </div>
        <Link href={`/clinics/${params.id}/edit`}>
          <Button variant="outline">
            <Pencil className="h-4 w-4 mr-2" />
            編集
          </Button>
        </Link>
      </div>

      {/* NAPコピーパレット */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-800">
            NAP情報（クリックでコピー）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-white rounded-md">
            <span className="font-medium">{clinic.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(clinic.name, "name")}
            >
              {copiedField === "name" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded-md">
            <span>{fullAddress}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(fullAddress, "address")}
            >
              {copiedField === "address" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded-md">
            <span>{clinic.phone}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(clinic.phone, "phone")}
            >
              {copiedField === "phone" ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button onClick={copyAllNap} className="w-full" variant="outline">
            {copiedField === "all" ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                コピーしました
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                全NAPをコピー
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* タブ */}
      <Tabs defaultValue="sites">
        <TabsList>
          <TabsTrigger value="sites">サイト状況</TabsTrigger>
          <TabsTrigger value="info">詳細情報</TabsTrigger>
          <TabsTrigger value="oldNaps">旧NAP情報</TabsTrigger>
        </TabsList>

        {/* サイト状況タブ */}
        <TabsContent value="sites" className="space-y-4">
          {/* 統計 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{clinicSites.length}</div>
                <p className="text-sm text-gray-500">登録サイト</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {matchedCount}
                </div>
                <p className="text-sm text-gray-500">一致</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {clinicSites.filter((s) => s.status === "mismatched").length}
                </div>
                <p className="text-sm text-gray-500">不一致</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {matchRate}%
                </div>
                <p className="text-sm text-gray-500">統一率</p>
              </CardContent>
            </Card>
          </div>

          {/* サイト一覧 */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>サイト名</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>最終確認</TableHead>
                    <TableHead className="w-[150px]">アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinicSites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">
                        {site.siteName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${statusConfig[site.status].color} gap-1`}
                        >
                          {statusConfig[site.status].icon}
                          {statusConfig[site.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {site.lastCheckedAt || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {site.pageUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(site.pageUrl!, "_blank")
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Link href={`/workspace?clinic=${clinic.id}&site=${site.id}`}>
                            <Button variant="outline" size="sm">
                              編集
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 詳細情報タブ */}
        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    郵便番号
                  </dt>
                  <dd className="mt-1">{clinic.postalCode}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">住所</dt>
                  <dd className="mt-1">
                    {clinic.prefecture}
                    {clinic.city}
                    {clinic.address}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    電話番号
                  </dt>
                  <dd className="mt-1">{clinic.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    FAX番号
                  </dt>
                  <dd className="mt-1">{clinic.fax || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    メールアドレス
                  </dt>
                  <dd className="mt-1">{clinic.email || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    公式サイト
                  </dt>
                  <dd className="mt-1">
                    {clinic.website ? (
                      <a
                        href={clinic.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {clinic.website}
                      </a>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    診療時間
                  </dt>
                  <dd className="mt-1">{clinic.businessHours || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">休診日</dt>
                  <dd className="mt-1">{clinic.closedDays || "-"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 旧NAP情報タブ */}
        <TabsContent value="oldNaps">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                旧NAP情報（表記ゆれ・過去の情報）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oldNaps.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  旧NAP情報は登録されていません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>旧医院名</TableHead>
                      <TableHead>旧住所</TableHead>
                      <TableHead>旧電話番号</TableHead>
                      <TableHead>備考</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oldNaps.map((nap) => (
                      <TableRow key={nap.id}>
                        <TableCell>{nap.oldName || "-"}</TableCell>
                        <TableCell>{nap.oldAddress || "-"}</TableCell>
                        <TableCell>{nap.oldPhone || "-"}</TableCell>
                        <TableCell>{nap.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Button variant="outline" className="mt-4">
                旧NAP情報を追加
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
