/**
 * 医院詳細ページ
 *
 * 医院の詳細情報と関連するサイト情報を表示します。
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
  Loader2,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useClinic, useDeleteClinic } from "@/hooks/use-clinics"
import type { ClinicSiteStatus } from "@/types"

const statusConfig: Record<
  ClinicSiteStatus,
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
  const router = useRouter()
  const clinicId = params.id as string
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { data: clinic, isLoading, error } = useClinic(clinicId)
  const deleteClinic = useDeleteClinic()

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

  const handleDelete = () => {
    deleteClinic.mutate(clinicId, {
      onSuccess: () => {
        toast.success("医院を削除しました")
        router.push("/clinics")
      },
      onError: (error) => {
        toast.error(error.message || "削除に失敗しました")
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !clinic) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">医院が見つかりません</p>
        <Link href="/clinics">
          <Button variant="outline">一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  const fullAddress = `〒${clinic.postalCode} ${clinic.prefecture}${clinic.city}${clinic.address}`

  const copyAllNap = () => {
    const text = `${clinic.name}\n${fullAddress}\n${clinic.phone}`
    copyToClipboard(text, "all")
  }

  const clinicSites = clinic.clinicSites || []
  const clinicNaps = clinic.clinicNaps || []
  const stats = clinic.stats || {
    totalSites: 0,
    matchedSites: 0,
    mismatchedSites: 0,
    needsReviewSites: 0,
    uncheckedSites: 0,
    matchRate: 0,
  }

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
        <div className="flex gap-2">
          <Link href={`/clinics/${clinicId}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              編集
            </Button>
          </Link>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>医院を削除しますか？</DialogTitle>
                <DialogDescription>
                  この操作は取り消せません。医院「{clinic.name}」と関連するすべてのデータが削除されます。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" type="button">
                  キャンセル
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteClinic.isPending}
                >
                  {deleteClinic.isPending ? "削除中..." : "削除する"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
                <div className="text-2xl font-bold">{stats.totalSites}</div>
                <p className="text-sm text-gray-500">登録サイト</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {stats.matchedSites}
                </div>
                <p className="text-sm text-gray-500">一致</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {stats.mismatchedSites}
                </div>
                <p className="text-sm text-gray-500">不一致</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.matchRate}%
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
                  {clinicSites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                        サイトが紐付けられていません
                      </TableCell>
                    </TableRow>
                  ) : (
                    clinicSites.map((cs) => (
                      <TableRow key={cs.id}>
                        <TableCell className="font-medium">
                          {cs.site?.name || "不明"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${statusConfig[cs.status].color} gap-1`}
                          >
                            {statusConfig[cs.status].icon}
                            {statusConfig[cs.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cs.lastCheckedAt
                            ? new Date(cs.lastCheckedAt).toLocaleDateString("ja-JP")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {cs.pageUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(cs.pageUrl!, "_blank")
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Link href={`/workspace?clinic=${clinicId}&site=${cs.siteId}`}>
                              <Button variant="outline" size="sm">
                                編集
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
              {clinicNaps.length === 0 ? (
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
                    {clinicNaps.map((nap) => (
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
