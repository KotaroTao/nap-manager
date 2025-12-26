"use client"

/**
 * 医院別NAP検証詳細ページ
 *
 * 特定の医院のNAP検証結果を詳細表示
 */

import { use } from "react"
import Link from "next/link"
import { useClinicVerification, useVerifyNap } from "@/hooks/use-verification"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_STATUS_COLORS,
  MATCH_STATUS_LABELS,
  MATCH_STATUS_COLORS,
} from "@/types"
import { toast } from "sonner"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  FileEdit,
  Plus,
  RefreshCw,
  Search,
  Clock,
} from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ClinicVerificationDetailPage({ params }: PageProps) {
  const { id: clinicId } = use(params)
  const { data, isLoading, error } = useClinicVerification(clinicId)
  const verifyMutation = useVerifyNap()

  const handleVerify = async () => {
    try {
      const result = await verifyMutation.mutateAsync({
        clinicId,
        forceRefresh: true,
      })
      toast.success(result.message)
    } catch {
      toast.error("検証に失敗しました")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">データの取得に失敗しました</div>
      </div>
    )
  }

  const { clinic, napHistory, siteResults, summary } = data
  const fullAddress = `${clinic.prefecture}${clinic.city}${clinic.address}`

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "mismatch":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "needsReview":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "notFound":
        return <HelpCircle className="h-5 w-5 text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/verification">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            {clinic.name} - NAP検証詳細
          </h2>
        </div>
        <Button
          onClick={handleVerify}
          disabled={verifyMutation.isPending}
        >
          {verifyMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          再検証
        </Button>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-gray-500">サイト数</p>
            <p className="text-2xl font-bold">{summary.totalSites}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-gray-500">検証済み</p>
            <p className="text-2xl font-bold">{summary.verified}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-gray-500">一致</p>
            <p className="text-2xl font-bold text-green-600">{summary.matched}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-gray-500">不一致</p>
            <p className="text-2xl font-bold text-red-600">{summary.mismatched}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-gray-500">要確認</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.needsReview}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-sm text-gray-500">未発見</p>
            <p className="text-2xl font-bold text-blue-600">{summary.notFound}</p>
          </CardContent>
        </Card>
      </div>

      {/* 正式NAP情報 */}
      <Card>
        <CardHeader>
          <CardTitle>正式NAP情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">医院名</p>
              <p className="font-medium">{clinic.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">住所</p>
              <p className="font-medium">
                〒{clinic.postalCode} {fullAddress}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">電話番号</p>
              <p className="font-medium">{clinic.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 旧NAP情報 */}
      {napHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>旧NAP情報（履歴）</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {napHistory.map((nap, index) => (
                <AccordionItem key={nap.id} value={nap.id}>
                  <AccordionTrigger>
                    <span className="text-sm">
                      {new Date(nap.createdAt).toLocaleDateString("ja-JP")}:
                      {nap.oldName && ` 医院名「${nap.oldName}」`}
                      {nap.oldAddress && ` 住所「${nap.oldAddress.substring(0, 20)}...」`}
                      {nap.oldPhone && ` 電話「${nap.oldPhone}」`}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
                      {nap.oldName && (
                        <div>
                          <p className="text-sm text-gray-500">旧医院名</p>
                          <p>{nap.oldName}</p>
                        </div>
                      )}
                      {nap.oldAddress && (
                        <div>
                          <p className="text-sm text-gray-500">旧住所</p>
                          <p>{nap.oldAddress}</p>
                        </div>
                      )}
                      {nap.oldPhone && (
                        <div>
                          <p className="text-sm text-gray-500">旧電話番号</p>
                          <p>{nap.oldPhone}</p>
                        </div>
                      )}
                      {nap.notes && (
                        <div className="md:col-span-3">
                          <p className="text-sm text-gray-500">備考</p>
                          <p>{nap.notes}</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* サイト別検証結果 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>サイト別検証結果</CardTitle>
          {summary.lastVerifiedAt && (
            <span className="text-sm text-gray-500">
              最終検証: {new Date(summary.lastVerifiedAt).toLocaleString("ja-JP")}
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {siteResults.map((result) => (
              <div
                key={result.clinicSite.id}
                className="border rounded-lg p-4"
              >
                {/* サイトヘッダー */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.site.name}</span>
                    <Badge
                      className={
                        VERIFICATION_STATUS_COLORS[
                          result.status as keyof typeof VERIFICATION_STATUS_COLORS
                        ] || "bg-gray-100"
                      }
                    >
                      {VERIFICATION_STATUS_LABELS[
                        result.status as keyof typeof VERIFICATION_STATUS_LABELS
                      ] || "未検証"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.links.clinicPage && (
                      <a
                        href={result.links.clinicPage}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          医院ページ
                        </Button>
                      </a>
                    )}
                    {result.status === "mismatch" ||
                    result.status === "needsReview" ? (
                      result.links.correctionRequest && (
                        <a
                          href={result.links.correctionRequest}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <FileEdit className="h-4 w-4 mr-1" />
                            修正依頼
                          </Button>
                        </a>
                      )
                    ) : result.status === "notFound" ? (
                      <>
                        <a
                          href={`${result.site.url}/search?q=${encodeURIComponent(clinic.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <Search className="h-4 w-4 mr-1" />
                            サイト内検索
                          </Button>
                        </a>
                        {result.links.registration && (
                          <a
                            href={result.links.registration}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-1" />
                              新規登録
                            </Button>
                          </a>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>

                {/* 検証結果詳細 */}
                {result.latestVerification && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {/* 医院名 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">医院名:</span>
                        <Badge
                          variant="outline"
                          className={
                            MATCH_STATUS_COLORS[
                              result.latestVerification.nameMatch as keyof typeof MATCH_STATUS_COLORS
                            ]
                          }
                        >
                          {MATCH_STATUS_LABELS[
                            result.latestVerification.nameMatch as keyof typeof MATCH_STATUS_LABELS
                          ]}
                        </Badge>
                      </div>
                      <p className="text-gray-600">
                        検出: {result.latestVerification.detectedName || "（未検出）"}
                      </p>
                    </div>

                    {/* 住所 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">住所:</span>
                        <Badge
                          variant="outline"
                          className={
                            MATCH_STATUS_COLORS[
                              result.latestVerification.addressMatch as keyof typeof MATCH_STATUS_COLORS
                            ]
                          }
                        >
                          {MATCH_STATUS_LABELS[
                            result.latestVerification.addressMatch as keyof typeof MATCH_STATUS_LABELS
                          ]}
                        </Badge>
                      </div>
                      <p className="text-gray-600">
                        検出: {result.latestVerification.detectedAddress || "（未検出）"}
                      </p>
                    </div>

                    {/* 電話番号 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">電話番号:</span>
                        <Badge
                          variant="outline"
                          className={
                            MATCH_STATUS_COLORS[
                              result.latestVerification.phoneMatch as keyof typeof MATCH_STATUS_COLORS
                            ]
                          }
                        >
                          {MATCH_STATUS_LABELS[
                            result.latestVerification.phoneMatch as keyof typeof MATCH_STATUS_LABELS
                          ]}
                        </Badge>
                      </div>
                      <p className="text-gray-600">
                        検出: {result.latestVerification.detectedPhone || "（未検出）"}
                      </p>
                    </div>
                  </div>
                )}

                {/* 旧NAP一致警告 */}
                {result.mismatchDetails.some((d) => d.matchesOldNap) && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    検出された情報が旧NAP情報と一致しています。更新が必要な可能性があります。
                  </div>
                )}

                {/* 未検証 */}
                {!result.latestVerification && (
                  <div className="text-center py-4 text-gray-500">
                    このサイトはまだ検証されていません
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
