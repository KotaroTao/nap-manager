/**
 * 設定ページ
 *
 * 通知設定、メールテンプレート、アカウント設定を管理します。
 */

"use client"

import { useState } from "react"
import { Bell, Mail, User, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)

  // 通知設定
  const [notificationSettings, setNotificationSettings] = useState({
    newMismatch: true,
    weeklySummary: true,
    followUpReminder: true,
    accessError: false,
    reminderDays: 7,
  })

  // メールテンプレート
  const [emailTemplate, setEmailTemplate] = useState({
    subject: "【NAP情報修正依頼】{clinic_name}の情報修正のお願い",
    body: `お世話になっております。
{clinic_name}の情報管理担当です。

貴サイトに掲載されている当院の情報について、
以下の通り修正をお願いいたします。

■ 現在の掲載情報
医院名: {current_name}
住所: {current_address}
電話番号: {current_phone}

■ 正しい情報
医院名: {correct_name}
住所: {correct_address}
電話番号: {correct_phone}

お手数をおかけしますが、
ご対応のほどよろしくお願いいたします。`,
  })

  // アカウント設定
  const [accountSettings, setAccountSettings] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    try {
      // TODO: APIに送信
      console.log("Saving notification settings:", notificationSettings)
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success("通知設定を保存しました")
    } catch (error) {
      console.error(error)
      toast.error("保存に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    setIsLoading(true)
    try {
      // TODO: APIに送信
      console.log("Saving email template:", emailTemplate)
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success("メールテンプレートを保存しました")
    } catch (error) {
      console.error(error)
      toast.error("保存に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAccount = async () => {
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      toast.error("新しいパスワードが一致しません")
      return
    }

    setIsLoading(true)
    try {
      // TODO: APIに送信
      console.log("Saving account settings:", accountSettings)
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success("アカウント設定を保存しました")
      setAccountSettings((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (error) {
      console.error(error)
      toast.error("保存に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">設定</h2>
        <p className="text-gray-500 mt-1">
          通知設定やテンプレートを管理します
        </p>
      </div>

      {/* タブ */}
      <Tabs defaultValue="notifications">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            通知設定
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            メールテンプレート
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" />
            アカウント
          </TabsTrigger>
        </TabsList>

        {/* 通知設定 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>
                メール通知の受信設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newMismatch"
                    checked={notificationSettings.newMismatch}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        newMismatch: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="newMismatch" className="font-normal cursor-pointer">
                    新しい不一致が検出された時に通知する
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weeklySummary"
                    checked={notificationSettings.weeklySummary}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        weeklySummary: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="weeklySummary" className="font-normal cursor-pointer">
                    週次サマリーメールを受信する
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="followUpReminder"
                    checked={notificationSettings.followUpReminder}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        followUpReminder: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="followUpReminder" className="font-normal cursor-pointer">
                    フォローアップリマインダーを受信する
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accessError"
                    checked={notificationSettings.accessError}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        accessError: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="accessError" className="font-normal cursor-pointer">
                    サイトにアクセスできない場合に通知する
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderDays">
                  リマインダー日数（依頼後何日で通知するか）
                </Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min={1}
                  max={30}
                  value={notificationSettings.reminderDays}
                  onChange={(e) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      reminderDays: parseInt(e.target.value) || 7,
                    }))
                  }
                  className="w-24"
                />
              </div>

              <Button onClick={handleSaveNotifications} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "保存中..." : "保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* メールテンプレート */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>メールテンプレート</CardTitle>
              <CardDescription>
                修正依頼メールのテンプレートを設定します。
                変数（{"{clinic_name}"}など）は自動で置換されます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="emailSubject">件名</Label>
                <Input
                  id="emailSubject"
                  value={emailTemplate.subject}
                  onChange={(e) =>
                    setEmailTemplate((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailBody">本文</Label>
                <Textarea
                  id="emailBody"
                  value={emailTemplate.body}
                  onChange={(e) =>
                    setEmailTemplate((prev) => ({
                      ...prev,
                      body: e.target.value,
                    }))
                  }
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">利用可能な変数</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <code className="bg-gray-200 px-1 rounded">
                      {"{clinic_name}"}
                    </code>{" "}
                    - 医院名
                  </div>
                  <div>
                    <code className="bg-gray-200 px-1 rounded">
                      {"{current_name}"}
                    </code>{" "}
                    - 現在掲載されている医院名
                  </div>
                  <div>
                    <code className="bg-gray-200 px-1 rounded">
                      {"{current_address}"}
                    </code>{" "}
                    - 現在掲載されている住所
                  </div>
                  <div>
                    <code className="bg-gray-200 px-1 rounded">
                      {"{current_phone}"}
                    </code>{" "}
                    - 現在掲載されている電話番号
                  </div>
                  <div>
                    <code className="bg-gray-200 px-1 rounded">
                      {"{correct_name}"}
                    </code>{" "}
                    - 正しい医院名
                  </div>
                  <div>
                    <code className="bg-gray-200 px-1 rounded">
                      {"{correct_address}"}
                    </code>{" "}
                    - 正しい住所
                  </div>
                  <div>
                    <code className="bg-gray-200 px-1 rounded">
                      {"{correct_phone}"}
                    </code>{" "}
                    - 正しい電話番号
                  </div>
                  <div>
                    <code className="bg-gray-200 px-1 rounded">
                      {"{site_name}"}
                    </code>{" "}
                    - サイト名
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveTemplate} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "保存中..." : "保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* アカウント設定 */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>アカウント設定</CardTitle>
              <CardDescription>
                プロフィールとパスワードを変更します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">名前</Label>
                  <Input
                    id="accountName"
                    value={accountSettings.name}
                    onChange={(e) =>
                      setAccountSettings((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="管理者"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountEmail">メールアドレス</Label>
                  <Input
                    id="accountEmail"
                    type="email"
                    value={accountSettings.email}
                    onChange={(e) =>
                      setAccountSettings((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <hr className="my-6" />

              <div className="space-y-4">
                <h4 className="font-medium">パスワード変更</h4>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">現在のパスワード</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={accountSettings.currentPassword}
                    onChange={(e) =>
                      setAccountSettings((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">新しいパスワード</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={accountSettings.newPassword}
                    onChange={(e) =>
                      setAccountSettings((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={accountSettings.confirmPassword}
                    onChange={(e) =>
                      setAccountSettings((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSaveAccount} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "保存中..." : "保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
