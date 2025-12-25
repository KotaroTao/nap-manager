/**
 * ワークスペースページ
 *
 * NAP統一作業のメイン画面です。
 * 医院を選択し、各サイトのNAP情報を確認・更新します。
 */

"use client"

import { useState } from "react"
import {
  Check,
  X,
  AlertCircle,
  Clock,
  Ban,
  ExternalLink,
  Copy,
  Pencil,
  Plus,
  ChevronDown,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

// 仮のデータ
const clinics = [
  { id: "1", name: "山田歯科クリニック" },
  { id: "2", name: "鈴木デンタルオフィス" },
  { id: "3", name: "田中歯科医院" },
]

const selectedClinic = {
  id: "1",
  name: "山田歯科クリニック",
  postalCode: "150-0001",
  prefecture: "東京都",
  city: "渋谷区",
  address: "神宮前1-2-3 ABCビル5F",
  phone: "03-1234-5678",
}

const clinicSites = [
  {
    id: "1",
    siteName: "Google ビジネスプロフィール",
    siteUrl: "https://business.google.com",
    pageUrl: "https://maps.google.com/...",
    status: "mismatched",
    priority: "urgent",
    priorityScore: 27,
    detectedName: "山田歯科医院",
    detectedAddress: "渋谷区神宮前1-2-3",
    detectedPhone: "03-1234-5678",
    lastCheckedAt: "2024-12-20",
    importance: "high",
    editUrl: "https://business.google.com/edit",
  },
  {
    id: "2",
    siteName: "EPARK歯科",
    siteUrl: "https://epark.jp",
    pageUrl: "https://epark.jp/...",
    status: "needsReview",
    priority: "high",
    priorityScore: 18,
    detectedName: "山田歯科クリニック",
    detectedAddress: "東京都渋谷区神宮前1-2-3",
    detectedPhone: "03-1234-5678",
    lastCheckedAt: "2024-12-18",
    importance: "high",
    editUrl: "https://epark.jp/edit",
  },
  {
    id: "3",
    siteName: "Yahoo!プレイス",
    siteUrl: "https://place.yahoo.co.jp",
    pageUrl: "https://place.yahoo.co.jp/...",
    status: "matched",
    priority: "medium",
    priorityScore: 0,
    detectedName: "山田歯科クリニック",
    detectedAddress: "〒150-0001 東京都渋谷区神宮前1-2-3 ABCビル5F",
    detectedPhone: "03-1234-5678",
    lastCheckedAt: "2024-12-15",
    importance: "high",
    editUrl: null,
  },
  {
    id: "4",
    siteName: "歯科タウン",
    siteUrl: "https://shika-town.com",
    pageUrl: null,
    status: "unregistered",
    priority: "medium",
    priorityScore: 4,
    detectedName: null,
    detectedAddress: null,
    detectedPhone: null,
    lastCheckedAt: null,
    importance: "medium",
    editUrl: null,
    registerUrl: "https://shika-town.com/register",
  },
  {
    id: "5",
    siteName: "Facebook",
    siteUrl: "https://facebook.com",
    pageUrl: null,
    status: "unchecked",
    priority: "low",
    priorityScore: 2,
    detectedName: null,
    detectedAddress: null,
    detectedPhone: null,
    lastCheckedAt: null,
    importance: "medium",
    editUrl: null,
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
    icon: <Plus className="h-3 w-3" />,
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

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: "緊急", color: "text-red-600 font-bold" },
  high: { label: "高", color: "text-orange-600" },
  medium: { label: "中", color: "text-gray-600" },
  low: { label: "低", color: "text-gray-400" },
}

export default function WorkspacePage() {
  const [selectedClinicId, setSelectedClinicId] = useState(selectedClinic.id)
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fullAddress = `〒${selectedClinic.postalCode} ${selectedClinic.prefecture}${selectedClinic.city}${selectedClinic.address}`

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
    const text = `${selectedClinic.name}\n${fullAddress}\n${selectedClinic.phone}`
    copyToClipboard(text, "all")
  }

  const toggleSiteSelection = (siteId: string) => {
    setSelectedSites((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    )
  }

  const toggleAllSites = () => {
    if (selectedSites.length === clinicSites.length) {
      setSelectedSites([])
    } else {
      setSelectedSites(clinicSites.map((s) => s.id))
    }
  }

  const filteredSites =
    statusFilter === "all"
      ? clinicSites
      : clinicSites.filter((s) => s.status === statusFilter)

  const matchedCount = clinicSites.filter((s) => s.status === "matched").length
  const matchRate = Math.round((matchedCount / clinicSites.length) * 100)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ワークスペース</h2>
          <p className="text-gray-500 mt-1">NAP統一作業のメイン画面</p>
        </div>
      </div>

      {/* 医院選択とNAPパレット */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 医院選択 */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">医院を選択</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedClinicId}
              onValueChange={setSelectedClinicId}
            >
              <SelectTrigger>
                <SelectValue placeholder="医院を選択" />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 統一率 */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">NAP統一率</span>
                <span className="font-bold">{matchRate}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${matchRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {matchedCount}/{clinicSites.length} サイト一致
              </p>
            </div>
          </CardContent>
        </Card>

        {/* NAPコピーパレット */}
        <Card className="lg:col-span-2 bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              正式NAP情報（クリックでコピー）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                onClick={() =>
                  copyToClipboard(selectedClinic.name, "name")
                }
                className="flex items-center justify-between p-2 bg-white rounded-md hover:bg-gray-50 transition-colors text-left"
              >
                <span className="font-medium truncate">
                  {selectedClinic.name}
                </span>
                {copiedField === "name" ? (
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              <button
                onClick={() => copyToClipboard(fullAddress, "address")}
                className="flex items-center justify-between p-2 bg-white rounded-md hover:bg-gray-50 transition-colors text-left"
              >
                <span className="truncate">{fullAddress}</span>
                {copiedField === "address" ? (
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              <button
                onClick={() =>
                  copyToClipboard(selectedClinic.phone, "phone")
                }
                className="flex items-center justify-between p-2 bg-white rounded-md hover:bg-gray-50 transition-colors text-left"
              >
                <span>{selectedClinic.phone}</span>
                {copiedField === "phone" ? (
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
            </div>
            <Button
              onClick={copyAllNap}
              variant="outline"
              className="w-full bg-white"
            >
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
      </div>

      {/* フィルタと一括操作 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="mismatched">不一致</SelectItem>
                <SelectItem value="needsReview">要確認</SelectItem>
                <SelectItem value="unregistered">未登録</SelectItem>
                <SelectItem value="unchecked">未チェック</SelectItem>
                <SelectItem value="matched">一致</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="サイト名で検索..." className="w-[200px]" />
        </div>

        {selectedSites.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {selectedSites.length}件選択中
            </span>
            <Select>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="一括ステータス変更" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matched">一致</SelectItem>
                <SelectItem value="needsReview">要確認</SelectItem>
                <SelectItem value="mismatched">不一致</SelectItem>
                <SelectItem value="unchecked">未チェック</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              一括で修正依頼作成
            </Button>
          </div>
        )}
      </div>

      {/* サイト一覧テーブル */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedSites.length === clinicSites.length}
                    onCheckedChange={toggleAllSites}
                  />
                </TableHead>
                <TableHead>サイト名</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>優先度</TableHead>
                <TableHead>最終確認</TableHead>
                <TableHead className="w-[200px]">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedSites.includes(site.id)}
                      onCheckedChange={() => toggleSiteSelection(site.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{site.siteName}</div>
                    {site.detectedName && site.status !== "matched" && (
                      <div className="text-xs text-gray-500 mt-1">
                        検出: {site.detectedName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusConfig[site.status].color} gap-1`}>
                      {statusConfig[site.status].icon}
                      {statusConfig[site.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {site.status !== "matched" && (
                      <span className={priorityConfig[site.priority].color}>
                        {priorityConfig[site.priority].label}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{site.lastCheckedAt || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {site.pageUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(site.pageUrl!, "_blank")}
                          title="サイトを開く"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      {site.status === "unregistered" && site.registerUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            window.open(site.registerUrl, "_blank")
                          }
                          title="新規登録"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                      {site.status !== "matched" &&
                        site.status !== "unregistered" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toast.success("修正依頼文をコピーしました")
                            }
                            title="修正依頼文をコピー"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="詳細編集"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
