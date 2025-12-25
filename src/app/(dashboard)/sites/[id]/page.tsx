/**
 * サイト詳細ページ
 *
 * サイトの詳細情報と関連する医院情報を表示します。
 */

"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Check,
  X,
  AlertCircle,
  Clock,
  Ban,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import { useSite, useDeleteSite, type SiteClinicSite } from "@/hooks/use-sites"
import {
  SITE_TYPE1_LABELS,
  SITE_TYPE2_LABELS,
  EDIT_METHOD_LABELS,
  IMPORTANCE_LABELS,
  SEO_IMPACT_LABELS,
  SITE_CATEGORY_LABELS,
} from "@/types"
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

export default function SiteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.id as string

  const { data: site, isLoading, error } = useSite(siteId)
  const deleteSite = useDeleteSite()

  const handleDelete = () => {
    deleteSite.mutate(siteId, {
      onSuccess: () => {
        toast.success("サイトを削除しました")
        router.push("/sites")
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

  if (error || !site) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">サイトが見つかりません</p>
        <Link href="/sites">
          <Button variant="outline">一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  const clinicSites = site.clinicSites || []
  const stats = site.stats || {
    totalClinics: 0,
    matchedClinics: 0,
    mismatchedClinics: 0,
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sites">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{site.name}</h2>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
            >
              {site.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Badge variant={site.isActive ? "success" : "secondary"}>
            {site.isActive ? "有効" : "無効"}
          </Badge>
          <Badge variant="outline">
            {SITE_CATEGORY_LABELS[site.siteType]}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link href={`/sites/${siteId}/edit`}>
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
                <DialogTitle>サイトを削除しますか？</DialogTitle>
                <DialogDescription>
                  この操作は取り消せません。サイト「{site.name}」と関連するすべての紐付けデータが削除されます。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" type="button">
                  キャンセル
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteSite.isPending}
                >
                  {deleteSite.isPending ? "削除中..." : "削除する"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* タブ */}
      <Tabs defaultValue="clinics">
        <TabsList>
          <TabsTrigger value="clinics">紐付け医院</TabsTrigger>
          <TabsTrigger value="info">サイト情報</TabsTrigger>
        </TabsList>

        {/* 紐付け医院タブ */}
        <TabsContent value="clinics" className="space-y-4">
          {/* 統計 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalClinics}</div>
                <p className="text-sm text-gray-500">紐付け医院数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {stats.matchedClinics}
                </div>
                <p className="text-sm text-gray-500">一致</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {stats.mismatchedClinics}
                </div>
                <p className="text-sm text-gray-500">不一致</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalClinics > 0
                    ? Math.round((stats.matchedClinics / stats.totalClinics) * 100)
                    : 0}
                  %
                </div>
                <p className="text-sm text-gray-500">統一率</p>
              </CardContent>
            </Card>
          </div>

          {/* 医院一覧 */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>医院名</TableHead>
                    <TableHead>所在地</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>最終確認</TableHead>
                    <TableHead className="w-[100px]">アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinicSites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                        紐付けられている医院がありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    clinicSites.map((cs: SiteClinicSite) => (
                      <TableRow key={cs.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/clinics/${cs.clinic?.id}`}
                            className="hover:underline"
                          >
                            {cs.clinic?.name || "不明"}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {cs.clinic?.prefecture}
                          {cs.clinic?.city}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig[cs.status as ClinicSiteStatus].color} gap-1`}>
                            {statusConfig[cs.status as ClinicSiteStatus].icon}
                            {statusConfig[cs.status as ClinicSiteStatus].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cs.updatedAt
                            ? new Date(cs.updatedAt).toLocaleDateString("ja-JP")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Link href={`/workspace?clinic=${cs.clinic?.id}`}>
                            <Button variant="outline" size="sm">
                              編集
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
        </TabsContent>

        {/* サイト情報タブ */}
        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">サイト種別</dt>
                  <dd className="mt-1">{SITE_CATEGORY_LABELS[site.siteType]}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">カテゴリ</dt>
                  <dd className="mt-1">{SITE_TYPE2_LABELS[site.type2]}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">料金種別</dt>
                  <dd className="mt-1">{SITE_TYPE1_LABELS[site.type1]}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">変更依頼方法</dt>
                  <dd className="mt-1">{EDIT_METHOD_LABELS[site.editMethod]}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">重要度</dt>
                  <dd className="mt-1">{IMPORTANCE_LABELS[site.importance]}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">SEO影響度</dt>
                  <dd className="mt-1">{SEO_IMPACT_LABELS[site.seoImpact]}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">新規登録URL</dt>
                  <dd className="mt-1">
                    {site.registerUrl ? (
                      <a
                        href={site.registerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {site.registerUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">修正依頼URL</dt>
                  <dd className="mt-1">
                    {site.editUrl ? (
                      <a
                        href={site.editUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {site.editUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">コメント</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{site.comment || "-"}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">修正依頼テンプレート</dt>
                  <dd className="mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded-md text-sm">
                    {site.template || "（デフォルトテンプレートを使用）"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
