/**
 * 設定関連のカスタムフック
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

// 通知設定の型
export interface NotificationSettings {
  id?: string
  adminId?: string
  newMismatch: boolean
  weeklySummary: boolean
  followUpReminder: boolean
  accessError: boolean
  reminderDays: number
}

// メールテンプレートの型
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

// アカウント情報の型
export interface AccountInfo {
  id: string
  name: string
  email: string
}

export interface AccountUpdateData {
  name?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

// クエリキー
export const settingsKeys = {
  all: ["settings"] as const,
  notifications: () => [...settingsKeys.all, "notifications"] as const,
  emailTemplates: () => [...settingsKeys.all, "email-templates"] as const,
  account: () => [...settingsKeys.all, "account"] as const,
}

/**
 * 通知設定を取得
 */
export function useNotificationSettings() {
  return useQuery({
    queryKey: settingsKeys.notifications(),
    queryFn: () => api.get<NotificationSettings>("/api/settings/notifications"),
  })
}

/**
 * 通知設定を更新
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: NotificationSettings) =>
      api.put<NotificationSettings>("/api/settings/notifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.notifications() })
    },
  })
}

/**
 * メールテンプレートを取得
 */
export function useEmailTemplate() {
  return useQuery({
    queryKey: settingsKeys.emailTemplates(),
    queryFn: () => api.get<EmailTemplate>("/api/settings/email-templates"),
  })
}

/**
 * メールテンプレートを更新
 */
export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { subject: string; body: string }) =>
      api.put<EmailTemplate>("/api/settings/email-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.emailTemplates() })
    },
  })
}

/**
 * アカウント情報を取得
 */
export function useAccountInfo() {
  return useQuery({
    queryKey: settingsKeys.account(),
    queryFn: () => api.get<AccountInfo>("/api/settings/account"),
  })
}

/**
 * アカウント情報を更新
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AccountUpdateData) =>
      api.put<AccountInfo>("/api/settings/account", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.account() })
    },
  })
}
