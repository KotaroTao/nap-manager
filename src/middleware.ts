/**
 * ミドルウェア（認証チェック）
 * 
 * 管理画面にアクセスする前にログイン状態をチェックします。
 * ログインしていなければログインページにリダイレクトします。
 */

import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard") ||
                        req.nextUrl.pathname.startsWith("/workspace") ||
                        req.nextUrl.pathname.startsWith("/clinics") ||
                        req.nextUrl.pathname.startsWith("/sites") ||
                        req.nextUrl.pathname.startsWith("/requests") ||
                        req.nextUrl.pathname.startsWith("/settings")

  // ダッシュボード系ページで未ログインならログインページへ
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // ログイン済みでログインページにアクセスしたらダッシュボードへ
  if (req.nextUrl.pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

// ミドルウェアを適用するパス
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workspace/:path*",
    "/clinics/:path*",
    "/sites/:path*",
    "/requests/:path*",
    "/settings/:path*",
    "/login",
  ],
}
