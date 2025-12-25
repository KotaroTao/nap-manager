/**
 * データ管理ページ
 *
 * CSV インポート/エクスポート機能を提供します。
 */

"use client"

import { useState, useRef } from "react"
import {
  Upload,
  Download,
  FileText,
  Building2,
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export default function DataPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [autoLinkMasterSites, setAutoLinkMasterSites] = useState(true)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 医院CSVインポート
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("autoLinkMasterSites", String(autoLinkMasterSites))

      const response = await fetch("/api/import/clinics", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "インポートに失敗しました")
      }

      setImportResult(data.results)
      setShowResultDialog(true)
    } catch (error) {
      console.error("インポートエラー:", error)
      setImportResult({
        success: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : "エラーが発生しました"],
      })
      setShowResultDialog(true)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // 医院CSVエクスポート
  const handleExportClinics = async () => {
    setExportStatus("exporting-clinics")
    try {
      const response = await fetch("/api/export/clinics")
      if (!response.ok) {
        throw new Error("エクスポートに失敗しました")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clinics_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("エクスポートエラー:", error)
      toast.error("エクスポートに失敗しました")
    } finally {
      setExportStatus(null)
    }
  }

  // 医院サイト紐付けCSVエクスポート
  const handleExportClinicSites = async (status?: string) => {
    setExportStatus("exporting-clinic-sites")
    try {
      const params = new URLSearchParams()
      if (status && status !== "all") {
        params.append("status", status)
      }

      const response = await fetch(`/api/export/clinic-sites?${params.toString()}`)
      if (!response.ok) {
        throw new Error("エクスポートに失敗しました")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clinic_sites_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("エクスポートエラー:", error)
      toast.error("エクスポートに失敗しました")
    } finally {
      setExportStatus(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">データ管理</h2>
        <p className="text-gray-500 mt-1">
          CSVによるデータのインポート・エクスポート
        </p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            インポート
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            エクスポート
          </TabsTrigger>
        </TabsList>

        {/* インポートタブ */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                医院データのインポート
              </CardTitle>
              <CardDescription>
                CSVファイルから医院データを一括インポートします
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CSVフォーマット説明 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">CSVフォーマット</h4>
                <p className="text-sm text-gray-600 mb-2">
                  以下のカラムを含むCSVファイルをアップロードしてください。
                </p>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium text-red-600">必須カラム：</span>
                    医院名, 郵便番号, 都道府県, 市区町村, 住所, 電話番号
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">オプション：</span>
                    医院名かな, FAX番号, メールアドレス, 公式サイト, 診療時間, 休診日, 備考
                  </p>
                </div>
              </div>

              {/* オプション */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-link">マスタサイトを自動紐付け</Label>
                  <p className="text-sm text-gray-500">
                    インポートした医院に全てのマスタサイトを紐付けます
                  </p>
                </div>
                <Switch
                  id="auto-link"
                  checked={autoLinkMasterSites}
                  onCheckedChange={setAutoLinkMasterSites}
                />
              </div>

              {/* ファイル選択 */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                  disabled={isImporting}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full"
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      インポート中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      CSVファイルを選択
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* エクスポートタブ */}
        <TabsContent value="export" className="space-y-6">
          {/* 医院データエクスポート */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                医院データのエクスポート
              </CardTitle>
              <CardDescription>
                登録されている全ての医院データをCSVでダウンロードします
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleExportClinics}
                disabled={exportStatus !== null}
              >
                {exportStatus === "exporting-clinics" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    エクスポート中...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    医院データをエクスポート
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 医院サイト紐付けエクスポート */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                サイト紐付けデータのエクスポート
              </CardTitle>
              <CardDescription>
                医院とサイトの紐付け情報（NAP情報含む）をCSVでダウンロードします
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="status-filter">ステータスフィルター</Label>
                  <Select
                    defaultValue="all"
                    onValueChange={(value) => handleExportClinicSites(value)}
                    disabled={exportStatus !== null}
                  >
                    <SelectTrigger id="status-filter" className="mt-1">
                      <SelectValue placeholder="全て" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全て</SelectItem>
                      <SelectItem value="mismatched">不一致</SelectItem>
                      <SelectItem value="needsReview">要確認</SelectItem>
                      <SelectItem value="matched">一致</SelectItem>
                      <SelectItem value="unregistered">未登録</SelectItem>
                      <SelectItem value="unchecked">未確認</SelectItem>
                      <SelectItem value="inaccessible">アクセス不可</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => handleExportClinicSites("all")}
                disabled={exportStatus !== null}
              >
                {exportStatus === "exporting-clinic-sites" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    エクスポート中...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    全データをエクスポート
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* インポート結果ダイアログ */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {importResult && importResult.success > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              インポート結果
            </DialogTitle>
            <DialogDescription>
              CSVファイルのインポートが完了しました
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {importResult.success}
                  </p>
                  <p className="text-sm text-green-700">成功</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {importResult.failed}
                  </p>
                  <p className="text-sm text-red-700">失敗</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-2">エラー詳細</p>
                  <ul className="text-sm text-gray-600 space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={() => setShowResultDialog(false)}
                className="w-full"
              >
                閉じる
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
