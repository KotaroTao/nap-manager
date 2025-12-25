/**
 * 医院登録ページ
 *
 * 新しい医院を登録するフォームです。
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useCreateClinic } from "@/hooks/use-clinics"

// 都道府県リスト
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
]

export default function NewClinicPage() {
  const router = useRouter()
  const [autoLinkMasterSites, setAutoLinkMasterSites] = useState(true)
  const createClinic = useCreateClinic()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      nameKana: (formData.get("nameKana") as string) || undefined,
      postalCode: formData.get("postalCode") as string,
      prefecture: formData.get("prefecture") as string,
      city: formData.get("city") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      fax: (formData.get("fax") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      website: (formData.get("website") as string) || undefined,
      businessHours: (formData.get("businessHours") as string) || undefined,
      closedDays: (formData.get("closedDays") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
      isActive: true,
      autoLinkMasterSites,
    }

    createClinic.mutate(data, {
      onSuccess: () => {
        toast.success("医院を登録しました")
        router.push("/clinics")
      },
      onError: (error) => {
        console.error(error)
        toast.error(error.message || "登録に失敗しました")
      },
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/clinics">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">医院を登録</h2>
          <p className="text-gray-500 mt-1">
            新しい医院の情報を入力してください
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  医院名（正式名称）<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="例: 山田歯科クリニック"
                  required
                  disabled={createClinic.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameKana">医院名（かな）</Label>
                <Input
                  id="nameKana"
                  name="nameKana"
                  placeholder="例: やまだしかくりにっく"
                  disabled={createClinic.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                電話番号<span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="例: 03-1234-5678"
                required
                disabled={createClinic.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fax">FAX番号</Label>
              <Input
                id="fax"
                name="fax"
                type="tel"
                placeholder="例: 03-1234-5679"
                disabled={createClinic.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* 住所 */}
        <Card>
          <CardHeader>
            <CardTitle>住所</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">
                  郵便番号<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="例: 150-0001"
                  required
                  disabled={createClinic.isPending}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="prefecture">
                  都道府県<span className="text-red-500">*</span>
                </Label>
                <select
                  id="prefecture"
                  name="prefecture"
                  className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  disabled={createClinic.isPending}
                >
                  <option value="">選択してください</option>
                  {PREFECTURES.map((pref) => (
                    <option key={pref} value={pref}>
                      {pref}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">
                市区町村<span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                name="city"
                placeholder="例: 渋谷区"
                required
                disabled={createClinic.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                番地・建物名<span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                placeholder="例: 神宮前1-2-3 ABCビル5F"
                required
                disabled={createClinic.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* その他 */}
        <Card>
          <CardHeader>
            <CardTitle>その他</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="例: info@yamada-dental.jp"
                disabled={createClinic.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">公式サイトURL</Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="例: https://yamada-dental.jp"
                disabled={createClinic.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessHours">診療時間</Label>
              <Textarea
                id="businessHours"
                name="businessHours"
                placeholder="例: 平日 9:00-19:00、土曜 9:00-13:00"
                rows={2}
                disabled={createClinic.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closedDays">休診日</Label>
              <Input
                id="closedDays"
                name="closedDays"
                placeholder="例: 日曜・祝日"
                disabled={createClinic.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="その他メモがあれば入力してください"
                rows={3}
                disabled={createClinic.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* オプション */}
        <Card>
          <CardHeader>
            <CardTitle>オプション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoLinkMasterSites"
                checked={autoLinkMasterSites}
                onCheckedChange={(checked) =>
                  setAutoLinkMasterSites(checked as boolean)
                }
                disabled={createClinic.isPending}
              />
              <Label
                htmlFor="autoLinkMasterSites"
                className="text-sm font-normal cursor-pointer"
              >
                マスタサイトを自動で紐付ける（登録後、各サイトのNAPチェックが必要になります）
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-4">
          <Link href="/clinics">
            <Button type="button" variant="outline" disabled={createClinic.isPending}>
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={createClinic.isPending}>
            {createClinic.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登録中...
              </>
            ) : (
              "医院を登録"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
