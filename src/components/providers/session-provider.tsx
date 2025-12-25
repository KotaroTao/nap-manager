/**
 * セッションプロバイダー
 * 
 * アプリ全体でログイン状態を共有するためのコンポーネントです。
 */

"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  )
}
