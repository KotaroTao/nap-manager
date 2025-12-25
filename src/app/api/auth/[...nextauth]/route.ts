/**
 * 認証APIエンドポイント
 * 
 * ログイン・ログアウトのリクエストを処理します。
 * [...nextauth] は「動的ルート」と呼ばれ、
 * /api/auth/signin, /api/auth/signout など複数のURLを1つのファイルで処理します。
 */

import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
