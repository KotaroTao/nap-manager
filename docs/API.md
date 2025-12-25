# デンタルNAPマネージャー API設計書

## 1. 概要

### 1.1 基本情報
- **ベースURL**: `https://api.dental-nap.jp/v1`
- **プロトコル**: HTTPS必須
- **認証**: Bearer Token（JWT）
- **コンテンツタイプ**: `application/json`

### 1.2 レスポンス形式

**成功レスポンス**
```json
{
  "success": true,
  "data": { ... }
}
```

**エラーレスポンス**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### 1.3 HTTPステータスコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエスト不正 |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソースが見つからない |
| 422 | バリデーションエラー |
| 429 | レートリミット超過 |
| 500 | サーバーエラー |

### 1.4 レートリミット
- 認証済みユーザー: 100リクエスト/分
- 未認証: 20リクエスト/分
- レスポンスヘッダー:
  - `X-RateLimit-Limit`: 制限値
  - `X-RateLimit-Remaining`: 残りリクエスト数
  - `X-RateLimit-Reset`: リセット時刻（Unix timestamp）

---

## 2. 認証 API

### 2.1 ユーザー登録

**POST** `/auth/register`

新規ユーザーを登録し、確認メールを送信。

**リクエスト**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "山田 太郎",
  "clinicName": "さくら歯科クリニック",
  "phone": "03-1234-5678"
}
```

**レスポンス（201）**
```json
{
  "success": true,
  "data": {
    "message": "確認メールを送信しました。メールのリンクをクリックして登録を完了してください。"
  }
}
```

**エラーコード**
- `EMAIL_ALREADY_EXISTS`: メールアドレスが既に登録されている
- `INVALID_PASSWORD`: パスワード要件を満たしていない

---

### 2.2 メール認証

**POST** `/auth/verify-email`

メール認証トークンを検証し、アカウントを有効化。

**リクエスト**
```json
{
  "token": "verification_token_here"
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "message": "メール認証が完了しました。",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "山田 太郎",
      "role": "client"
    }
  }
}
```

---

### 2.3 ログイン

**POST** `/auth/login`

**リクエスト**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "rememberMe": false
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 86400,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "山田 太郎",
      "role": "client"
    }
  }
}
```

**エラーコード**
- `INVALID_CREDENTIALS`: メールアドレスまたはパスワードが間違っている
- `EMAIL_NOT_VERIFIED`: メール認証が完了していない
- `ACCOUNT_LOCKED`: アカウントがロックされている

---

### 2.4 トークンリフレッシュ

**POST** `/auth/refresh`

**リクエスト**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 86400
  }
}
```

---

### 2.5 パスワードリセット申請

**POST** `/auth/forgot-password`

**リクエスト**
```json
{
  "email": "user@example.com"
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "message": "パスワードリセット用のメールを送信しました。"
  }
}
```

---

### 2.6 パスワードリセット実行

**POST** `/auth/reset-password`

**リクエスト**
```json
{
  "token": "reset_token_here",
  "password": "newSecurePassword123"
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "message": "パスワードを変更しました。"
  }
}
```

---

### 2.7 ログアウト

**POST** `/auth/logout`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました。"
  }
}
```

---

## 3. ユーザー API

### 3.1 現在のユーザー情報取得

**GET** `/users/me`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "山田 太郎",
    "phone": "03-1234-5678",
    "role": "client",
    "emailVerifiedAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "subscription": {
      "plan": "standard",
      "status": "active",
      "currentPeriodEnd": "2024-02-01T00:00:00Z"
    }
  }
}
```

---

### 3.2 ユーザー情報更新

**PATCH** `/users/me`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**リクエスト**
```json
{
  "name": "山田 太郎（更新）",
  "phone": "03-9999-8888"
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "山田 太郎（更新）",
    "phone": "03-9999-8888",
    ...
  }
}
```

---

### 3.3 パスワード変更

**POST** `/users/me/change-password`

**リクエスト**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "message": "パスワードを変更しました。"
  }
}
```

---

## 4. 医院 API

### 4.1 医院一覧取得

**GET** `/clinics`

**ヘッダー**: `Authorization: Bearer {accessToken}`

**クエリパラメータ**
- `page`: ページ番号（デフォルト: 1）
- `limit`: 取得件数（デフォルト: 20、最大: 100）

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "clinics": [
      {
        "id": "uuid",
        "name": "さくら歯科クリニック",
        "nap": {
          "name": "さくら歯科クリニック",
          "postalCode": "123-4567",
          "prefecture": "東京都",
          "city": "渋谷区",
          "address": "1-2-3",
          "building": "ABCビル 3F",
          "phone": "03-1234-5678"
        },
        "stats": {
          "totalSites": 15,
          "matchCount": 10,
          "mismatchCount": 3,
          "needsReviewCount": 1,
          "uncheckedCount": 1
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

---

### 4.2 医院作成

**POST** `/clinics`

**リクエスト**
```json
{
  "name": "さくら歯科クリニック",
  "nap": {
    "name": "さくら歯科クリニック",
    "postalCode": "123-4567",
    "prefecture": "東京都",
    "city": "渋谷区",
    "address": "1-2-3",
    "building": "ABCビル 3F",
    "phone": "03-1234-5678",
    "fax": "03-1234-5679",
    "email": "info@sakura-dental.jp",
    "websiteUrl": "https://sakura-dental.jp"
  }
}
```

**レスポンス（201）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "さくら歯科クリニック",
    ...
  }
}
```

**エラーコード**
- `CLINIC_LIMIT_EXCEEDED`: プランの医院数上限を超えている

---

### 4.3 医院詳細取得

**GET** `/clinics/{clinicId}`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "さくら歯科クリニック",
    "nap": {
      "name": "さくら歯科クリニック",
      "postalCode": "123-4567",
      "prefecture": "東京都",
      "city": "渋谷区",
      "address": "1-2-3",
      "building": "ABCビル 3F",
      "phone": "03-1234-5678",
      "fax": "03-1234-5679",
      "email": "info@sakura-dental.jp",
      "websiteUrl": "https://sakura-dental.jp"
    },
    "altNaps": [
      {
        "id": "uuid",
        "name": "さくらデンタルクリニック",
        "treatAsMatch": true
      }
    ],
    "stats": {
      "totalSites": 15,
      "matchCount": 10,
      "mismatchCount": 3,
      "needsReviewCount": 1,
      "uncheckedCount": 1
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

---

### 4.4 医院更新

**PATCH** `/clinics/{clinicId}`

**リクエスト**
```json
{
  "name": "さくら歯科クリニック（更新）",
  "nap": {
    "phone": "03-9999-8888"
  }
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "さくら歯科クリニック（更新）",
    ...
  }
}
```

---

### 4.5 医院削除

**DELETE** `/clinics/{clinicId}`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "message": "医院を削除しました。"
  }
}
```

---

### 4.6 代替NAP追加

**POST** `/clinics/{clinicId}/alt-naps`

**リクエスト**
```json
{
  "name": "桜歯科",
  "address": "東京都渋谷区1丁目2番地3号",
  "treatAsMatch": true,
  "note": "旧名称"
}
```

**レスポンス（201）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "桜歯科",
    "address": "東京都渋谷区1丁目2番地3号",
    "treatAsMatch": true,
    "note": "旧名称"
  }
}
```

---

### 4.7 代替NAP削除

**DELETE** `/clinics/{clinicId}/alt-naps/{altNapId}`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "message": "代替NAPを削除しました。"
  }
}
```

---

## 5. サイト API

### 5.1 医院のサイト一覧取得

**GET** `/clinics/{clinicId}/sites`

**クエリパラメータ**
- `page`: ページ番号
- `limit`: 取得件数
- `sourceType`: フィルタ（master/auto/manual）
- `status`: ステータスフィルタ（match/mismatch/needs_review/unchecked/inaccessible）

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "sites": [
      {
        "id": "uuid",
        "sourceType": "master",
        "name": "Googleビジネスプロフィール",
        "url": "https://www.google.com/maps/place/...",
        "status": "match",
        "autoStatus": null,
        "lastCheckedAt": "2024-01-15T10:00:00Z",
        "nextCheckAt": "2024-01-16T10:00:00Z",
        "latestCheck": {
          "detectedName": "さくら歯科クリニック",
          "detectedAddress": "東京都渋谷区1-2-3 ABCビル3F",
          "detectedPhone": "03-1234-5678"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

---

### 5.2 手動サイト追加

**POST** `/clinics/{clinicId}/sites`

**リクエスト**
```json
{
  "name": "地域情報サイト",
  "url": "https://example.com/dental/sakura-clinic",
  "note": "地域ポータルサイト"
}
```

**レスポンス（201）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sourceType": "manual",
    "name": "地域情報サイト",
    "url": "https://example.com/dental/sakura-clinic",
    "status": "unchecked",
    "note": "地域ポータルサイト"
  }
}
```

---

### 5.3 サイト更新

**PATCH** `/clinics/{clinicId}/sites/{siteId}`

**リクエスト**
```json
{
  "name": "地域情報サイト（更新）",
  "url": "https://example.com/dental/sakura-clinic-new",
  "note": "URLが変更されました"
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

---

### 5.4 サイト削除

**DELETE** `/clinics/{clinicId}/sites/{siteId}`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "message": "サイトを削除しました。"
  }
}
```

---

### 5.5 自動追加サイトのステータス更新

**PATCH** `/clinics/{clinicId}/sites/{siteId}/auto-status`

**リクエスト**
```json
{
  "autoStatus": "confirmed"
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "autoStatus": "confirmed"
  }
}
```

---

### 5.6 サイトの即時チェック実行

**POST** `/clinics/{clinicId}/sites/{siteId}/check`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "checkId": "uuid",
    "status": "match",
    "detectedName": "さくら歯科クリニック",
    "detectedAddress": "東京都渋谷区1-2-3 ABCビル3F",
    "detectedPhone": "03-1234-5678",
    "checkedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 5.7 サイトのチェック履歴取得

**GET** `/clinics/{clinicId}/sites/{siteId}/checks`

**クエリパラメータ**
- `page`: ページ番号
- `limit`: 取得件数

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "checks": [
      {
        "id": "uuid",
        "status": "match",
        "detectedName": "さくら歯科クリニック",
        "detectedAddress": "東京都渋谷区1-2-3 ABCビル3F",
        "detectedPhone": "03-1234-5678",
        "checkedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "totalPages": 2
    }
  }
}
```

---

## 6. 修正依頼 API

### 6.1 修正依頼テンプレート生成

**POST** `/clinics/{clinicId}/sites/{siteId}/correction-template`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "subject": "【修正依頼】さくら歯科クリニック 掲載情報の訂正のお願い",
    "body": "○○サイト ご担当者様\n\nお世話になっております。..."
  }
}
```

---

### 6.2 修正依頼作成

**POST** `/clinics/{clinicId}/sites/{siteId}/correction-requests`

**リクエスト**
```json
{
  "templateContent": "修正依頼の本文...",
  "note": "メモ"
}
```

**レスポンス（201）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    "templateContent": "修正依頼の本文...",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 6.3 修正依頼一覧取得

**GET** `/clinics/{clinicId}/correction-requests`

**クエリパラメータ**
- `status`: ステータスフィルタ

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid",
        "site": {
          "id": "uuid",
          "name": "エキテン"
        },
        "status": "sent",
        "sentAt": "2024-01-10T10:00:00Z",
        "createdAt": "2024-01-10T09:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 6.4 修正依頼ステータス更新

**PATCH** `/clinics/{clinicId}/correction-requests/{requestId}`

**リクエスト**
```json
{
  "status": "sent",
  "sentAt": "2024-01-15T10:00:00Z",
  "note": "メールで送信済み"
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "sent",
    "sentAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## 7. マスタサイト API（管理者専用）

### 7.1 マスタサイト一覧取得

**GET** `/admin/master-sites`

**ヘッダー**: `Authorization: Bearer {accessToken}` （role: admin）

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "sites": [
      {
        "id": "uuid",
        "name": "Googleビジネスプロフィール",
        "category": "map_service",
        "baseUrl": "https://www.google.com/maps",
        "priority": "high",
        "checkFrequency": "daily",
        "isActive": true
      }
    ]
  }
}
```

---

### 7.2 マスタサイト作成

**POST** `/admin/master-sites`

**リクエスト**
```json
{
  "name": "新しいサイト",
  "category": "review_site",
  "baseUrl": "https://example.com",
  "searchUrlPattern": "https://example.com/search?q={clinic_name}",
  "priority": "medium",
  "checkFrequency": "weekly"
}
```

**レスポンス（201）**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

---

### 7.3 マスタサイト更新

**PATCH** `/admin/master-sites/{siteId}`

### 7.4 マスタサイト削除

**DELETE** `/admin/master-sites/{siteId}`

---

## 8. ダッシュボード API

### 8.1 ダッシュボードサマリー取得

**GET** `/dashboard`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalClinics": 3,
      "totalSites": 45,
      "matchCount": 35,
      "mismatchCount": 5,
      "needsReviewCount": 3,
      "uncheckedCount": 2,
      "inaccessibleCount": 0
    },
    "recentAlerts": [
      {
        "id": "uuid",
        "clinicId": "uuid",
        "clinicName": "さくら歯科クリニック",
        "siteId": "uuid",
        "siteName": "エキテン",
        "status": "mismatch",
        "detectedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pendingCorrectionRequests": 2
  }
}
```

---

### 8.2 医院別ダッシュボード取得

**GET** `/clinics/{clinicId}/dashboard`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "clinic": {
      "id": "uuid",
      "name": "さくら歯科クリニック"
    },
    "summary": {
      "totalSites": 15,
      "matchCount": 10,
      "mismatchCount": 3,
      "needsReviewCount": 1,
      "uncheckedCount": 1
    },
    "statusBySourceType": {
      "master": { "match": 8, "mismatch": 2, ... },
      "auto": { "match": 1, "mismatch": 1, ... },
      "manual": { "match": 1, ... }
    },
    "recentChecks": [ ... ]
  }
}
```

---

## 9. 通知設定 API

### 9.1 通知設定取得

**GET** `/users/me/notification-settings`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "instantAlert": true,
    "weeklySummary": true,
    "monthlyReport": true,
    "additionalEmails": ["sub@example.com"]
  }
}
```

---

### 9.2 通知設定更新

**PATCH** `/users/me/notification-settings`

**リクエスト**
```json
{
  "instantAlert": false,
  "weeklySummary": true,
  "additionalEmails": ["sub@example.com", "another@example.com"]
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "instantAlert": false,
    "weeklySummary": true,
    "monthlyReport": true,
    "additionalEmails": ["sub@example.com", "another@example.com"]
  }
}
```

---

## 10. 課金 API

### 10.1 サブスクリプション情報取得

**GET** `/billing/subscription`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "plan": "standard",
    "status": "active",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

---

### 10.2 Checkout セッション作成

**POST** `/billing/checkout`

**リクエスト**
```json
{
  "plan": "standard"
}
```

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

---

### 10.3 Customer Portal セッション作成

**POST** `/billing/portal`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "portalUrl": "https://billing.stripe.com/..."
  }
}
```

---

### 10.4 請求履歴取得

**GET** `/billing/invoices`

**レスポンス（200）**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "inv_xxx",
        "amount": 5980,
        "currency": "jpy",
        "status": "paid",
        "invoiceUrl": "https://pay.stripe.com/...",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

## 11. Webhook

### 11.1 Stripe Webhook

**POST** `/webhooks/stripe`

**Stripe-Signature** ヘッダーで署名検証

**対応イベント**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## 12. エラーコード一覧

| コード | 説明 |
|--------|------|
| `VALIDATION_ERROR` | 入力値が不正 |
| `UNAUTHORIZED` | 認証が必要 |
| `FORBIDDEN` | 権限がない |
| `NOT_FOUND` | リソースが見つからない |
| `EMAIL_ALREADY_EXISTS` | メールアドレスが既に存在 |
| `INVALID_CREDENTIALS` | 認証情報が不正 |
| `ACCOUNT_LOCKED` | アカウントがロック中 |
| `EMAIL_NOT_VERIFIED` | メール未認証 |
| `TOKEN_EXPIRED` | トークンの有効期限切れ |
| `INVALID_TOKEN` | トークンが不正 |
| `CLINIC_LIMIT_EXCEEDED` | 医院数上限超過 |
| `SITE_LIMIT_EXCEEDED` | サイト数上限超過 |
| `SUBSCRIPTION_REQUIRED` | 有料プランが必要 |
| `RATE_LIMIT_EXCEEDED` | レートリミット超過 |
| `INTERNAL_ERROR` | サーバー内部エラー |
