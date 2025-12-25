/**
 * 修正依頼詳細ページ
 *
 * 修正依頼の詳細情報とステータス更新を行います。
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Clock,
  FileEdit,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  useCorrectionRequest,
  useUpdateCorrectionRequest,
  useDeleteCorrectionRequest,
  useAddRequestHistory,
} from "@/hooks/use-correction-requests"
import { EDIT_METHOD_LABELS } from "@/types"
import type { CorrectionRequestStatus, RequestMethod } from "@/types"

const statusConfig: Record<
  CorrectionRequestStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "未対応",
    color: "bg-gray-100 text-gray-800",
    icon: <Clock className="h-3 w-3" />,
  },
  requested: {
    label: "依頼済み",
    color: "bg-blue-100 text-blue-800",
    icon: <FileEdit className="h-3 w-3" />,
  },
  inProgress: {
    label: "対応中",
    color: "bg-yellow-100 text-yellow-800",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  completed: {
    label: "完了",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  impossible: {
    label: "対応不可",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
  onHold: {
    label: "保留",
    color: "bg-gray-200 text-gray-700",
    icon: <Pause className="h-3 w-3" />,
  },
}

const methodLabels: Record<RequestMethod, string> = {
  form: "フォーム",
  email: "メール",
  phone: "電話",
  other: "その他",
}

export default function RequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [historyAction, setHistoryAction] = useState("")
  const [historyNotes, setHistoryNotes] = useState("")

  const { data: request, isLoading, error } = useCorrectionRequest(requestId)
  const updateRequest = useUpdateCorrectionRequest(requestId)
  const deleteRequest = useDeleteCorrectionRequest()
  const addHistory = useAddRequestHistory(requestId)

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

  const handleStatusChange = async (status: CorrectionRequestStatus) => {
    try {
      await updateRequest.mutateAsync({ status })
      toast.success("ステータスを更新しました")
    } catch {
      toast.error("ステータスの更新に失敗しました")
    }
  }

  const handleMethodChange = async (requestMethod: RequestMethod) => {
    try {
      await updateRequest.mutateAsync({ requestMethod })
      toast.success("依頼方法を更新しました")
    } catch {
      toast.error("依頼方法の更新に失敗しました")
    }
  }

  const handleAddHistory = async () => {
    if (!historyAction.trim()) {
      toast.error("アクション内容を入力してください")
      return
    }

    try {
      await addHistory.mutateAsync({
        action: historyAction,
        notes: historyNotes || undefined,
      })
      toast.success("履歴を追加しました")
      setHistoryAction("")
      setHistoryNotes("")
      setIsHistoryDialogOpen(false)
    } catch {
      toast.error("履歴の追加に失敗しました")
    }
  }

  const handleDelete = () => {
    deleteRequest.mutate(requestId, {
      onSuccess: () => {
        toast.success("修正依頼を削除しました")
        router.push("/requests")
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

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">修正依頼が見つかりません</p>
        <Link href="/requests">
          <Button variant="outline">一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  const clinic = request.clinicSite?.clinic
  const site = request.clinicSite?.site
  const histories = request.requestHistories || []

  const fullAddress = clinic
    ? `${clinic.prefecture}${clinic.city}${clinic.address}`
    : ""

  // 修正依頼文テンプレート
  const correctionTemplate = `【NAP情報修正依頼】

■ 対象サイト: ${site?.name || ""}
■ 対象ページ: ${request.clinicSite?.pageUrl || "（未設定）"}

■ 正しい情報:
医院名: ${clinic?.name || ""}
住所: ${fullAddress}
電話番号: ${clinic?.phone || ""}

■ 現在の登録情報:
医院名: ${request.clinicSite?.detectedName || "（未確認）"}
住所: ${request.clinicSite?.detectedAddress || "（未確認）"}
電話番号: ${request.clinicSite?.detectedPhone || "（未確認）"}

上記の通り修正をお願いいたします。`

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">修正依頼詳細</h2>
            <p className="text-gray-500 mt-1">
              {clinic?.name} × {site?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>修正依頼を削除しますか？</DialogTitle>
                <DialogDescription>
                  この操作は取り消せません。修正依頼と関連する履歴がすべて削除されます。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" type="button">
                  キャンセル
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteRequest.isPending}
                >
                  {deleteRequest.isPending ? "削除中..." : "削除する"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ステータスと依頼方法 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ステータス管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ステータス</Label>
                  <Select
                    value={request.status}
                    onValueChange={(value) => handleStatusChange(value as CorrectionRequestStatus)}
                    disabled={updateRequest.isPending}
                  >
                    <SelectTrigger>
                      <Badge className={`${statusConfig[request.status].color} gap-1`}>
                        {statusConfig[request.status].icon}
                        {statusConfig[request.status].label}
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
                </div>
                <div className="space-y-2">
                  <Label>依頼方法</Label>
                  <Select
                    value={request.requestMethod || ""}
                    onValueChange={(value) => handleMethodChange(value as RequestMethod)}
                    disabled={updateRequest.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(methodLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">依頼日</Label>
                  <p className="mt-1">
                    {request.requestedAt
                      ? new Date(request.requestedAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "未依頼"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">経過日数</Label>
                  <p className="mt-1">
                    {request.daysElapsed !== null && request.daysElapsed !== undefined ? (
                      <span className={request.daysElapsed >= 7 ? "text-red-600 font-bold" : ""}>
                        {request.daysElapsed}日
                      </span>
                    ) : (
                      "-"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 修正依頼文 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">修正依頼文</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  copyToClipboard(correctionTemplate, "template")
                  toast.success("修正依頼文をコピーしました")
                }}
              >
                {copiedField === "template" ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    コピー
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm">
                {correctionTemplate}
              </pre>
            </CardContent>
          </Card>

          {/* 対応履歴 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">対応履歴</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                履歴を追加
              </Button>
            </CardHeader>
            <CardContent>
              {histories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  対応履歴がありません
                </p>
              ) : (
                <div className="space-y-4">
                  {histories.map((history) => (
                    <div
                      key={history.id}
                      className="border-l-2 border-gray-200 pl-4 py-2"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{history.action}</p>
                        <span className="text-sm text-gray-500">
                          {new Date(history.createdAt).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {history.notes && (
                        <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 医院情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">医院情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-gray-500">医院名</Label>
                <p className="font-medium">{clinic?.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">住所</Label>
                <p>{fullAddress}</p>
              </div>
              <div>
                <Label className="text-gray-500">電話番号</Label>
                <p>{clinic?.phone}</p>
              </div>
              <Link href={`/clinics/${clinic?.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  医院詳細を見る
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* サイト情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">サイト情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-gray-500">サイト名</Label>
                <p className="font-medium">{site?.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">変更依頼方法</Label>
                <p>{site?.editMethod ? EDIT_METHOD_LABELS[site.editMethod] : "-"}</p>
              </div>
              <div className="space-y-2">
                {site?.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(site.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    サイトを開く
                  </Button>
                )}
                {site?.editUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(site.editUrl!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    修正ページを開く
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 備考 */}
          {request.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">備考</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{request.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 履歴追加ダイアログ */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>対応履歴を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="action">
                アクション内容<span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="action"
                value={historyAction}
                onChange={(e) => setHistoryAction(e.target.value)}
                placeholder="例: メールで修正依頼を送信"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">備考（任意）</Label>
              <Textarea
                id="notes"
                value={historyNotes}
                onChange={(e) => setHistoryNotes(e.target.value)}
                placeholder="詳細情報があれば入力..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddHistory} disabled={addHistory.isPending}>
              {addHistory.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  追加中...
                </>
              ) : (
                "追加する"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
