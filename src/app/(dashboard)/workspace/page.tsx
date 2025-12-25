/**
 * ワークスペースページ
 *
 * NAP統一作業のメイン画面です。
 * 医院を選択し、各サイトのNAP情報を確認・更新します。
 */

"use client"

import { useState, useMemo } from "react"
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
  Filter,
  Loader2,
  RefreshCw,
  Eye,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useClinics, useClinic } from "@/hooks/use-clinics"
import { useClinicSites, useUpdateClinicSiteStatus } from "@/hooks/use-clinic-sites"
import { useCreateCorrectionRequest } from "@/hooks/use-correction-requests"
import { NapDiff } from "@/components/workspace/nap-diff"
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

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: "緊急", color: "text-red-600 font-bold" },
  high: { label: "高", color: "text-orange-600" },
  medium: { label: "中", color: "text-gray-600" },
  low: { label: "低", color: "text-gray-400" },
}

export default function WorkspacePage() {
  const [selectedClinicId, setSelectedClinicId] = useState<string>("")
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [requestNotes, setRequestNotes] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [diffDialogSite, setDiffDialogSite] = useState<any | null>(null)

  // 医院一覧を取得
  const { data: clinicsData, isLoading: isLoadingClinics } = useClinics({ isActive: true, limit: 100 })

  // 選択中の医院の詳細を取得
  const { data: clinicDetail, isLoading: isLoadingClinic } = useClinic(selectedClinicId)

  // 選択中の医院のサイト紐付けを取得
  const { data: clinicSitesData, isLoading: isLoadingSites, refetch: refetchSites } = useClinicSites({
    clinicId: selectedClinicId,
    limit: 100,
  })

  // ステータス更新ミューテーション
  const updateStatusMutation = useUpdateClinicSiteStatus()

  // 修正依頼作成ミューテーション
  const createRequestMutation = useCreateCorrectionRequest()

  const clinics = clinicsData?.clinics || []
  const clinicSites = clinicSitesData?.clinicSites || []
  const selectedClinic = clinicDetail

  // NAP情報
  const fullAddress = selectedClinic
    ? `〒${selectedClinic.postalCode} ${selectedClinic.prefecture}${selectedClinic.city}${selectedClinic.address}`
    : ""

  // フィルタリング
  const filteredSites = useMemo(() => {
    let filtered = clinicSites
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((s) => s.site.name.toLowerCase().includes(query))
    }
    return filtered
  }, [clinicSites, statusFilter, searchQuery])

  // 統計
  const matchedCount = clinicSites.filter((s) => s.status === "matched").length
  const matchRate = clinicSites.length > 0 ? Math.round((matchedCount / clinicSites.length) * 100) : 0

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
    if (!selectedClinic) return
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
    if (selectedSites.length === filteredSites.length) {
      setSelectedSites([])
    } else {
      setSelectedSites(filteredSites.map((s) => s.id))
    }
  }

  const handleStatusChange = async (id: string, status: ClinicSiteStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status })
      toast.success("ステータスを更新しました")
    } catch {
      toast.error("ステータスの更新に失敗しました")
    }
  }

  const handleBulkStatusChange = async (status: ClinicSiteStatus) => {
    try {
      await Promise.all(
        selectedSites.map((id) => updateStatusMutation.mutateAsync({ id, status }))
      )
      toast.success(`${selectedSites.length}件のステータスを更新しました`)
      setSelectedSites([])
    } catch {
      toast.error("ステータスの更新に失敗しました")
    }
  }

  const handleCreateRequests = async () => {
    try {
      await Promise.all(
        selectedSites.map((clinicSiteId) =>
          createRequestMutation.mutateAsync({
            clinicSiteId,
            notes: requestNotes || undefined,
          })
        )
      )
      toast.success(`${selectedSites.length}件の修正依頼を作成しました`)
      setSelectedSites([])
      setRequestNotes("")
      setIsRequestDialogOpen(false)
    } catch {
      toast.error("修正依頼の作成に失敗しました")
    }
  }

  const generateCorrectionTemplate = (site: typeof filteredSites[0]) => {
    if (!selectedClinic) return ""
    return `【NAP情報修正依頼】

■ 対象サイト: ${site.site.name}
■ 対象ページ: ${site.pageUrl || "（未設定）"}

■ 正しい情報:
医院名: ${selectedClinic.name}
住所: ${fullAddress}
電話番号: ${selectedClinic.phone}

■ 現在の登録情報:
医院名: ${site.detectedName || "（未確認）"}
住所: ${site.detectedAddress || "（未確認）"}
電話番号: ${site.detectedPhone || "（未確認）"}

上記の通り修正をお願いいたします。`
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ワークスペース</h2>
          <p className="text-gray-500 mt-1">NAP統一作業のメイン画面</p>
        </div>
        {selectedClinicId && (
          <Button variant="outline" onClick={() => refetchSites()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        )}
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
              onValueChange={(value) => {
                setSelectedClinicId(value)
                setSelectedSites([])
              }}
              disabled={isLoadingClinics}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingClinics ? "読み込み中..." : "医院を選択"} />
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
            {selectedClinicId && (
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
            )}
          </CardContent>
        </Card>

        {/* NAPコピーパレット */}
        <Card className={`lg:col-span-2 ${selectedClinic ? "bg-blue-50 border-blue-200" : "bg-gray-50"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${selectedClinic ? "text-blue-800" : "text-gray-500"}`}>
              {selectedClinic ? "正式NAP情報（クリックでコピー）" : "医院を選択してください"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingClinic ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : selectedClinic ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    onClick={() => copyToClipboard(selectedClinic.name, "name")}
                    className="flex items-center justify-between p-2 bg-white rounded-md hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="font-medium truncate">{selectedClinic.name}</span>
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
                    onClick={() => copyToClipboard(selectedClinic.phone, "phone")}
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
                <Button onClick={copyAllNap} variant="outline" className="w-full bg-white">
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
              </>
            ) : (
              <div className="text-center py-4 text-gray-400">
                医院を選択するとNAP情報が表示されます
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* コンテンツエリア */}
      {!selectedClinicId ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            医院を選択してNAP統一作業を開始してください
          </CardContent>
        </Card>
      ) : isLoadingSites ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </CardContent>
        </Card>
      ) : clinicSites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            この医院に紐付けられたサイトがありません
          </CardContent>
        </Card>
      ) : (
        <>
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
              <Input
                placeholder="サイト名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px]"
              />
            </div>

            {selectedSites.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{selectedSites.length}件選択中</span>
                <Select onValueChange={(value) => handleBulkStatusChange(value as ClinicSiteStatus)}>
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
                <Button variant="outline" size="sm" onClick={() => setIsRequestDialogOpen(true)}>
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
                        checked={selectedSites.length === filteredSites.length && filteredSites.length > 0}
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
                        <div className="font-medium">{site.site.name}</div>
                        {site.detectedName && site.status !== "matched" && (
                          <div className="text-xs text-gray-500 mt-1">
                            検出: {site.detectedName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={site.status}
                          onValueChange={(value) => handleStatusChange(site.id, value as ClinicSiteStatus)}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <Badge className={`${statusConfig[site.status].color} gap-1`}>
                              {statusConfig[site.status].icon}
                              {statusConfig[site.status].label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <Badge className={`${config.color} gap-1`}>
                                  {config.icon}
                                  {config.label}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {site.status !== "matched" && (
                          <span className={priorityConfig[site.priority]?.color}>
                            {priorityConfig[site.priority]?.label || site.priority}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {site.lastCheckedAt
                          ? new Date(site.lastCheckedAt).toLocaleDateString("ja-JP")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {/* 差分表示ボタン */}
                          {(site.detectedName || site.detectedAddress || site.detectedPhone) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDiffDialogSite(site)}
                              title="差分を表示"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
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
                          {site.status === "unregistered" && site.site.registerUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(site.site.registerUrl!, "_blank")}
                              title="新規登録"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {site.status !== "matched" && site.status !== "unregistered" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                copyToClipboard(generateCorrectionTemplate(site), `template-${site.id}`)
                                toast.success("修正依頼文をコピーしました")
                              }}
                              title="修正依頼文をコピー"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                          {site.site.editUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(site.site.editUrl!, "_blank")}
                              title="編集ページを開く"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* 修正依頼作成ダイアログ */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>一括修正依頼作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              {selectedSites.length}件の修正依頼を作成します。
            </p>
            <div className="space-y-2">
              <Label htmlFor="notes">備考（任意）</Label>
              <Textarea
                id="notes"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="修正依頼に関する備考を入力..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreateRequests}
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                "作成する"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NAP差分表示ダイアログ */}
      <Dialog open={diffDialogSite !== null} onOpenChange={(open) => !open && setDiffDialogSite(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              NAP情報の比較
            </DialogTitle>
          </DialogHeader>
          {diffDialogSite && selectedClinic && (
            <div className="space-y-4 py-2">
              {/* サイト情報 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{diffDialogSite.site.name}</p>
                  {diffDialogSite.pageUrl && (
                    <a
                      href={diffDialogSite.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      掲載ページを開く
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Badge className={statusConfig[diffDialogSite.status as ClinicSiteStatus].color}>
                  {statusConfig[diffDialogSite.status as ClinicSiteStatus].icon}
                  <span className="ml-1">{statusConfig[diffDialogSite.status as ClinicSiteStatus].label}</span>
                </Badge>
              </div>

              {/* 差分表示 */}
              <NapDiff
                correct={{
                  name: selectedClinic.name,
                  address: fullAddress,
                  phone: selectedClinic.phone,
                }}
                detected={{
                  name: diffDialogSite.detectedName,
                  address: diffDialogSite.detectedAddress,
                  phone: diffDialogSite.detectedPhone,
                }}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiffDialogSite(null)}>
              閉じる
            </Button>
            {diffDialogSite && diffDialogSite.status !== "matched" && (
              <Button
                onClick={() => {
                  copyToClipboard(generateCorrectionTemplate(diffDialogSite), `template-dialog-${diffDialogSite.id}`)
                  toast.success("修正依頼文をコピーしました")
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                修正依頼文をコピー
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
