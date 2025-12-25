/**
 * サイト登録ページ
 *
 * 新しいサイトを登録するフォームです。
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useCreateSite } from "@/hooks/use-sites"
import {
  SITE_TYPE1_LABELS,
  SITE_TYPE2_LABELS,
  EDIT_METHOD_LABELS,
  IMPORTANCE_LABELS,
  SEO_IMPACT_LABELS,
  SITE_CATEGORY_LABELS,
} from "@/types"
import type { SiteType1, SiteType2, EditMethod, Importance, SeoImpact, SiteCategory } from "@/types"

export default function NewSitePage() {
  const router = useRouter()
  const [autoLinkAllClinics, setAutoLinkAllClinics] = useState(false)
  const createSite = useCreateSite()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      url: formData.get("url") as string,
      registerUrl: (formData.get("registerUrl") as string) || undefined,
      editUrl: (formData.get("editUrl") as string) || undefined,
      type1: formData.get("type1") as SiteType1,
      type2: formData.get("type2") as SiteType2,
      editMethod: formData.get("editMethod") as EditMethod,
      importance: formData.get("importance") as Importance,
      seoImpact: formData.get("seoImpact") as SeoImpact,
      siteType: formData.get("siteType") as SiteCategory,
      template: (formData.get("template") as string) || undefined,
      comment: (formData.get("comment") as string) || undefined,
      isActive: true,
      autoLinkAllClinics,
    }

    createSite.mutate(data, {
      onSuccess: () => {
        toast.success("サイトを登録しました")
        router.push("/sites")
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
        <Link href="/sites">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">サイトを追加</h2>
          <p className="text-gray-500 mt-1">
            新しいサイトの情報を入力してください
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
            <div className="space-y-2">
              <Label htmlFor="name">
                サイト名<span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="例: Google ビジネスプロフィール"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">
                サイトURL<span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="例: https://business.google.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registerUrl">新規登録URL</Label>
                <Input
                  id="registerUrl"
                  name="registerUrl"
                  type="url"
                  placeholder="新規登録ページのURL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUrl">修正依頼URL</Label>
                <Input
                  id="editUrl"
                  name="editUrl"
                  type="url"
                  placeholder="情報修正ページのURL"
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
                <Select name="siteType" defaultValue="manual" required>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SITE_CATEGORY_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  カテゴリ<span className="text-red-500">*</span>
                </Label>
                <Select name="type2" required>
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  料金種別<span className="text-red-500">*</span>
                </Label>
                <Select name="type1" required>
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
              </div>
              <div className="space-y-2">
                <Label>
                  変更依頼方法<span className="text-red-500">*</span>
                </Label>
                <Select name="editMethod" required>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EDIT_METHOD_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
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
                <Select name="importance" defaultValue="medium" required>
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
              </div>
              <div className="space-y-2">
                <Label>
                  SEO影響度<span className="text-red-500">*</span>
                </Label>
                <Select name="seoImpact" defaultValue="medium" required>
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
                name="template"
                placeholder="このサイト専用の修正依頼テンプレートがあれば入力してください"
                rows={5}
              />
              <p className="text-sm text-gray-500">
                空欄の場合はデフォルトテンプレートが使用されます
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">コメント</Label>
              <Textarea
                id="comment"
                name="comment"
                placeholder="注意事項やメモがあれば入力してください"
                rows={3}
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
                id="autoLinkAllClinics"
                checked={autoLinkAllClinics}
                onCheckedChange={(checked) =>
                  setAutoLinkAllClinics(checked as boolean)
                }
                disabled={createSite.isPending}
              />
              <Label
                htmlFor="autoLinkAllClinics"
                className="text-sm font-normal cursor-pointer"
              >
                全ての医院に自動で紐付ける（マスタサイトの場合に推奨）
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-4">
          <Link href="/sites">
            <Button type="button" variant="outline" disabled={createSite.isPending}>
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={createSite.isPending}>
            {createSite.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登録中...
              </>
            ) : (
              "サイトを登録"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
