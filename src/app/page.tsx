/**
 * トップページ
 * 
 * ルート（/）にアクセスしたときに表示されるページです。
 * ログイン状態に応じてリダイレクトします。
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()

  // ログイン済みならダッシュボードへ
  if (session) {
    redirect("/dashboard")
  }

  // 未ログインならログインページへ
  redirect("/login")
}
