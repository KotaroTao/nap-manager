"use client"

/**
 * NAP検証ダッシュボード
 *
 * 検証結果のサマリーと最近の不一致情報を表示
 */

import Link from "next/link"
import { useVerificationResults, useVerifyNap } from "@/hooks/use-verification"
import { useClinics } from "@/hooks/use-clinics"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_STATUS_COLORS,
  MATCH_STATUS_LABELS,
} from "@/types"
import { useState } from "react"
import { toast } from "sonner"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  FileEdit,
} from "lucide-react"

export default function VerificationDashboardPage() {
  const [selectedClinicId, setSelectedClinicId] = useState<string>("")
  const { data: resultsData, isLoading: resultsLoading } = useVerificationResults({
    hasMismatch: true,
    limit: 10,
  })
  const { data: clinicsData } = useClinics({ limit: 100 })
  const verifyMutation = useVerifyNap()

  const handleVerify = async () => {
    if (!selectedClinicId) {
      toast.error("医院を選択してください")
      return
    }

    try {
      const result = await verifyMutation.mutateAsync({
        clinicId: selectedClinicId,
        forceRefresh: true,
      })
      toast.success(result.message)
    } catch {
      toast.error("検証に失敗しました")
    }
  }

  const handleVerifyAll = async () => {
    if (!clinicsData?.clinics?.length) {
      toast.error("検証対象の医院がありません")
      return
    }

    toast.info("全医院の検証を開始します...")
    let successCount = 0
    let errorCount = 0

    for (const clinic of clinicsData.clinics) {
      try {
        await verifyMutation.mutateAsync({
          clinicId: clinic.id,
          forceRefresh: true,
        })
        successCount++
      } catch {
        errorCount++
      }
    }

    toast.success(
      `検証完了: 成功 ${successCount}件, エラー ${errorCount}件`
    )
  }

  const summary = resultsData?.summary || {
    totalVerified: 0,
    matched: 0,
    mismatched: 0,
    needsReview: 0,
    notFound: 0,
    errors: 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">NAP検証ダッシュボード</h2>
        <Link href="/verification/clinics">
          <Button variant="outline">検証結果一覧</Button>
        </Link>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">検証済み</p>
                <p className="text-3xl font-bold text-gray-900">
                  {summary.totalVerified}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">一致</p>
                <p className="text-3xl font-bold text-green-600">
                  {summary.matched}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">不一致</p>
                <p className="text-3xl font-bold text-red-600">
                  {summary.mismatched}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">要確認</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {summary.needsReview}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">未登録</p>
                <p className="text-3xl font-bold text-blue-600">
                  {summary.notFound}
                </p>
              </div>
              <HelpCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 一括検証 */}
      <Card>
        <CardHeader>
          <CardTitle>一括検証</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={selectedClinicId}
              onValueChange={setSelectedClinicId}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="医院を選択..." />
              </SelectTrigger>
              <SelectContent>
                {clinicsData?.clinics?.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleVerify}
              disabled={verifyMutation.isPending || !selectedClinicId}
            >
              {verifyMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              実行
            </Button>

            <Button
              variant="outline"
              onClick={handleVerifyAll}
              disabled={verifyMutation.isPending}
            >
              全医院検証
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 最近の不一致 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の不一致・要確認</CardTitle>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : resultsData?.results?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              不一致・要確認の項目はありません
            </div>
          ) : (
            <div className="space-y-4">
              {resultsData?.results?.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.clinic.name}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">{result.site.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      {result.matchResult.name !== "match" && (
                        <span>
                          医院名: {MATCH_STATUS_LABELS[result.matchResult.name as keyof typeof MATCH_STATUS_LABELS]}
                        </span>
                      )}
                      {result.matchResult.address !== "match" && (
                        <span>
                          住所: {MATCH_STATUS_LABELS[result.matchResult.address as keyof typeof MATCH_STATUS_LABELS]}
                        </span>
                      )}
                      {result.matchResult.phone !== "match" && (
                        <span>
                          電話: {MATCH_STATUS_LABELS[result.matchResult.phone as keyof typeof MATCH_STATUS_LABELS]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        VERIFICATION_STATUS_COLORS[
                          result.matchResult.overall as keyof typeof VERIFICATION_STATUS_COLORS
                        ]
                      }
                    >
                      {
                        VERIFICATION_STATUS_LABELS[
                          result.matchResult.overall as keyof typeof VERIFICATION_STATUS_LABELS
                        ]
                      }
                    </Badge>

                    <div className="flex items-center gap-1">
                      <Link href={`/verification/clinics/${result.clinic.id}`}>
                        <Button variant="ghost" size="sm">
                          詳細
                        </Button>
                      </Link>

                      {result.links.clinicPage && (
                        <a
                          href={result.links.clinicPage}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}

                      {result.links.correctionRequest && (
                        <a
                          href={result.links.correctionRequest}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <FileEdit className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
