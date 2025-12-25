/**
 * サイト編集ページ
 *
 * 既存のサイト情報を編集するフォームです。
 */

"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useSite, useUpdateSite } from "@/hooks/use-sites"
import {
  SITE_TYPE1_LABELS,
  SITE_TYPE2_LABELS,
  EDIT_METHOD_LABELS,
  IMPORTANCE_LABELS,
  SEO_IMPACT_LABELS,
  SITE_CATEGORY_LABELS,
} from "@/types"
import type { SiteFormData } from "@/types"

export default function EditSitePage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.id as string

  const { data: site, isLoading } = useSite(siteId)
  const updateSite = useUpdateSite(siteId)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SiteFormData>()

  const isActive = watch("isActive")

  // サイトデータをフォームに設定
  useEffect(() => {
    if (site) {
      reset({
        name: site.name,
        url: site.url,
        registerUrl: site.registerUrl || "",
        editUrl: site.editUrl || "",
        type1: site.type1,
        type2: site.type2,
        editMethod: site.editMethod,
        importance: site.importance,
        seoImpact: site.seoImpact,
        siteType: site.siteType,
        template: site.template || "",
        comment: site.comment || "",
        isActive: site.isActive,
      })
    }
  }, [site, reset])

  const onSubmit = (data: SiteFormData) => {
    updateSite.mutate(data, {
      onSuccess: () => {
        toast.success("サイト情報を更新しました")
        router.push(`/sites/${siteId}`)
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

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">サイトが見つかりません</p>
        <Link href="/sites">
          <Button variant="outline">一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href={`/sites/${siteId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">サイトを編集</h2>
          <p className="text-gray-500 mt-1">{site.name}</p>
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
                  無効にすると新規紐付けの対象外になります
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
                disabled={updateSite.isPending}
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
            <div className="space-y-2">
              <Label htmlFor="name">
                サイト名<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name", { required: "サイト名は必須です" })}
                placeholder="例: Google ビジネスプロフィール"
                disabled={updateSite.isPending}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">
                サイトURL<span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                {...register("url", { required: "URLは必須です" })}
                type="url"
                placeholder="例: https://business.google.com"
                disabled={updateSite.isPending}
              />
              {errors.url && (
                <p className="text-sm text-red-500">{errors.url.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registerUrl">新規登録URL</Label>
                <Input
                  id="registerUrl"
                  {...register("registerUrl")}
                  type="url"
                  placeholder="新規登録ページのURL"
                  disabled={updateSite.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUrl">修正依頼URL</Label>
                <Input
                  id="editUrl"
                  {...register("editUrl")}
                  type="url"
                  placeholder="情報修正ページのURL"
                  disabled={updateSite.isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 分類 */}
        <Card>
          <CardHeader>
            <CardTitle>分類</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  サイト種別<span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="siteType"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={updateSite.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SITE_CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  カテゴリ<span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="type2"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={updateSite.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SITE_TYPE2_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  料金種別<span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="type1"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={updateSite.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SITE_TYPE1_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  変更依頼方法<span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="editMethod"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={updateSite.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EDIT_METHOD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 重要度 */}
        <Card>
          <CardHeader>
            <CardTitle>重要度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  重要度<span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="importance"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={updateSite.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(IMPORTANCE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  SEO影響度<span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="seoImpact"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={updateSite.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SEO_IMPACT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
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
              <Label htmlFor="template">カスタム修正依頼テンプレート</Label>
              <Textarea
                id="template"
                {...register("template")}
                placeholder="このサイト専用の修正依頼テンプレートがあれば入力してください"
                rows={5}
                disabled={updateSite.isPending}
              />
              <p className="text-sm text-gray-500">
                空欄の場合はデフォルトテンプレートが使用されます
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">コメント</Label>
              <Textarea
                id="comment"
                {...register("comment")}
                placeholder="注意事項やメモがあれば入力してください"
                rows={3}
                disabled={updateSite.isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-4">
          <Link href={`/sites/${siteId}`}>
            <Button type="button" variant="outline" disabled={updateSite.isPending}>
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={updateSite.isPending}>
            {updateSite.isPending ? (
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
