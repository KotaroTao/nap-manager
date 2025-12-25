/**
 * 医院編集ページ
 *
 * 既存の医院情報を編集するフォームです。
 */

"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useClinic, useUpdateClinic } from "@/hooks/use-clinics"
import type { ClinicFormData } from "@/types"

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

export default function EditClinicPage() {
  const params = useParams()
  const router = useRouter()
  const clinicId = params.id as string

  const { data: clinic, isLoading } = useClinic(clinicId)
  const updateClinic = useUpdateClinic(clinicId)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClinicFormData>()

  const isActive = watch("isActive")

  // 医院データをフォームに設定
  useEffect(() => {
    if (clinic) {
      reset({
        name: clinic.name,
        nameKana: clinic.nameKana || "",
        postalCode: clinic.postalCode,
        prefecture: clinic.prefecture,
        city: clinic.city,
        address: clinic.address,
        phone: clinic.phone,
        fax: clinic.fax || "",
        email: clinic.email || "",
        website: clinic.website || "",
        businessHours: clinic.businessHours || "",
        closedDays: clinic.closedDays || "",
        notes: clinic.notes || "",
        isActive: clinic.isActive,
      })
    }
  }, [clinic, reset])

  const onSubmit = (data: ClinicFormData) => {
    updateClinic.mutate(data, {
      onSuccess: () => {
        toast.success("医院情報を更新しました")
        router.push(`/clinics/${clinicId}`)
      },
      onError: (error) => {
        toast.error(error.message || "更新に失敗しました")
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

  if (!clinic) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">医院が見つかりません</p>
        <Link href="/clinics">
          <Button variant="outline">一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href={`/clinics/${clinicId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">医院を編集</h2>
          <p className="text-gray-500 mt-1">{clinic.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ステータス */}
        <Card>
          <CardHeader>
            <CardTitle>ステータス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">有効/無効</Label>
                <p className="text-sm text-gray-500">
                  無効にすると一覧に表示されなくなります
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
                disabled={updateClinic.isPending}
              />
            </div>
          </CardContent>
        </Card>

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
                  {...register("name", { required: "医院名は必須です" })}
                  placeholder="例: 山田歯科クリニック"
                  disabled={updateClinic.isPending}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameKana">医院名（かな）</Label>
                <Input
                  id="nameKana"
                  {...register("nameKana")}
                  placeholder="例: やまだしかくりにっく"
                  disabled={updateClinic.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                電話番号<span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                {...register("phone", { required: "電話番号は必須です" })}
                type="tel"
                placeholder="例: 03-1234-5678"
                disabled={updateClinic.isPending}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fax">FAX番号</Label>
              <Input
                id="fax"
                {...register("fax")}
                type="tel"
                placeholder="例: 03-1234-5679"
                disabled={updateClinic.isPending}
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
                  {...register("postalCode", { required: "郵便番号は必須です" })}
                  placeholder="例: 150-0001"
                  disabled={updateClinic.isPending}
                />
                {errors.postalCode && (
                  <p className="text-sm text-red-500">{errors.postalCode.message}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="prefecture">
                  都道府県<span className="text-red-500">*</span>
                </Label>
                <select
                  id="prefecture"
                  {...register("prefecture", { required: "都道府県は必須です" })}
                  className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={updateClinic.isPending}
                >
                  <option value="">選択してください</option>
                  {PREFECTURES.map((pref) => (
                    <option key={pref} value={pref}>
                      {pref}
                    </option>
                  ))}
                </select>
                {errors.prefecture && (
                  <p className="text-sm text-red-500">{errors.prefecture.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">
                市区町村<span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                {...register("city", { required: "市区町村は必須です" })}
                placeholder="例: 渋谷区"
                disabled={updateClinic.isPending}
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                番地・建物名<span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                {...register("address", { required: "番地・建物名は必須です" })}
                placeholder="例: 神宮前1-2-3 ABCビル5F"
                disabled={updateClinic.isPending}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
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
                {...register("email")}
                type="email"
                placeholder="例: info@yamada-dental.jp"
                disabled={updateClinic.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">公式サイトURL</Label>
              <Input
                id="website"
                {...register("website")}
                type="url"
                placeholder="例: https://yamada-dental.jp"
                disabled={updateClinic.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessHours">診療時間</Label>
              <Textarea
                id="businessHours"
                {...register("businessHours")}
                placeholder="例: 平日 9:00-19:00、土曜 9:00-13:00"
                rows={2}
                disabled={updateClinic.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closedDays">休診日</Label>
              <Input
                id="closedDays"
                {...register("closedDays")}
                placeholder="例: 日曜・祝日"
                disabled={updateClinic.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="その他メモがあれば入力してください"
                rows={3}
                disabled={updateClinic.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-4">
          <Link href={`/clinics/${clinicId}`}>
            <Button type="button" variant="outline" disabled={updateClinic.isPending}>
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={updateClinic.isPending}>
            {updateClinic.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                更新中...
              </>
            ) : (
              "変更を保存"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
