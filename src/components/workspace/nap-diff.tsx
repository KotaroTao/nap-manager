/**
 * NAP差分表示コンポーネント
 *
 * 正式NAP情報と検出されたNAP情報の差分をハイライト表示します。
 */

"use client"

import { useMemo } from "react"
import { Check, X, AlertTriangle, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface NapDiffProps {
  correct: {
    name: string
    address: string
    phone: string
  }
  detected: {
    name?: string | null
    address?: string | null
    phone?: string | null
  }
  className?: string
}

interface FieldDiffProps {
  label: string
  correct: string
  detected: string | null | undefined
}

/**
 * 文字列を正規化（比較用）
 */
function normalizeString(str: string): string {
  return str
    .replace(/[\s\u3000]+/g, "") // 空白を除去
    .replace(/[ー−–—]/g, "-") // ハイフン統一
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角数字を半角に
    .toLowerCase()
}

/**
 * 2つの文字列を比較し、一致率を計算
 */
function calculateMatchRate(str1: string, str2: string): number {
  const s1 = normalizeString(str1)
  const s2 = normalizeString(str2)

  if (s1 === s2) return 100
  if (!s1 || !s2) return 0

  // レーベンシュタイン距離を計算
  const m = s1.length
  const n = s2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1
      }
    }
  }

  const maxLen = Math.max(m, n)
  return Math.round(((maxLen - dp[m][n]) / maxLen) * 100)
}

/**
 * 差分をハイライトした文字列を生成
 */
function highlightDiff(correct: string, detected: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  const c = correct
  const d = detected

  // 単純なワードベースの差分
  const correctWords = c.split(/(\s+)/)
  const detectedWords = d.split(/(\s+)/)

  let ci = 0
  let di = 0

  while (di < detectedWords.length) {
    const dWord = detectedWords[di]

    if (ci < correctWords.length && normalizeString(correctWords[ci]) === normalizeString(dWord)) {
      // 一致
      result.push(
        <span key={`match-${di}`} className="text-green-700">
          {dWord}
        </span>
      )
      ci++
      di++
    } else {
      // 不一致
      result.push(
        <span key={`diff-${di}`} className="bg-red-100 text-red-700 px-0.5 rounded">
          {dWord}
        </span>
      )
      di++
    }
  }

  return result
}

/**
 * フィールド単位の差分表示
 */
function FieldDiff({ label, correct, detected }: FieldDiffProps) {
  const { status, matchRate } = useMemo(() => {
    if (!detected) {
      return { status: "unknown" as const, matchRate: 0 }
    }
    const rate = calculateMatchRate(correct, detected)
    if (rate === 100) {
      return { status: "match" as const, matchRate: 100 }
    }
    if (rate >= 80) {
      return { status: "partial" as const, matchRate: rate }
    }
    return { status: "mismatch" as const, matchRate: rate }
  }, [correct, detected])

  const statusConfig = {
    match: {
      icon: <Check className="h-4 w-4 text-green-600" />,
      bgColor: "bg-green-50 border-green-200",
      textColor: "text-green-800",
    },
    partial: {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
      bgColor: "bg-yellow-50 border-yellow-200",
      textColor: "text-yellow-800",
    },
    mismatch: {
      icon: <X className="h-4 w-4 text-red-600" />,
      bgColor: "bg-red-50 border-red-200",
      textColor: "text-red-800",
    },
    unknown: {
      icon: <Minus className="h-4 w-4 text-gray-400" />,
      bgColor: "bg-gray-50 border-gray-200",
      textColor: "text-gray-500",
    },
  }

  const config = statusConfig[status]

  return (
    <div className={cn("p-3 rounded-lg border", config.bgColor)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className="flex items-center gap-1">
          {config.icon}
          {detected && (
            <span className={cn("text-xs font-medium", config.textColor)}>
              {matchRate}%
            </span>
          )}
        </div>
      </div>

      {/* 正式情報 */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400">正式:</div>
        <div className="text-sm font-medium text-gray-900">{correct}</div>
      </div>

      {/* 検出情報 */}
      <div className="mt-2 space-y-1">
        <div className="text-xs text-gray-400">検出:</div>
        {detected ? (
          <div className={cn("text-sm", config.textColor)}>
            {status === "match" ? (
              detected
            ) : (
              highlightDiff(correct, detected)
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">未確認</div>
        )}
      </div>
    </div>
  )
}

/**
 * NAP差分表示コンポーネント
 */
export function NapDiff({ correct, detected, className }: NapDiffProps) {
  const overallMatch = useMemo(() => {
    const nameMatch = detected.name ? calculateMatchRate(correct.name, detected.name) : 0
    const addressMatch = detected.address ? calculateMatchRate(correct.address, detected.address) : 0
    const phoneMatch = detected.phone ? calculateMatchRate(correct.phone, detected.phone) : 0

    const count = [detected.name, detected.address, detected.phone].filter(Boolean).length
    if (count === 0) return 0

    return Math.round((nameMatch + addressMatch + phoneMatch) / count)
  }, [correct, detected])

  return (
    <div className={cn("space-y-3", className)}>
      {/* 全体の一致率 */}
      <div className="flex items-center justify-between pb-2 border-b">
        <span className="text-sm font-medium text-gray-700">NAP一致率</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                overallMatch >= 80 ? "bg-green-500" :
                overallMatch >= 50 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${overallMatch}%` }}
            />
          </div>
          <span className="text-sm font-bold">{overallMatch}%</span>
        </div>
      </div>

      {/* フィールドごとの差分 */}
      <div className="grid gap-3">
        <FieldDiff
          label="医院名"
          correct={correct.name}
          detected={detected.name}
        />
        <FieldDiff
          label="住所"
          correct={correct.address}
          detected={detected.address}
        />
        <FieldDiff
          label="電話番号"
          correct={correct.phone}
          detected={detected.phone}
        />
      </div>
    </div>
  )
}
