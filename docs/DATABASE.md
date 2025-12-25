# デンタルNAPマネージャー データベース設計書

## 1. 概要

本ドキュメントはデンタルNAPマネージャーのデータベース設計を定義する。

### 1.1 使用データベース
- **メインDB**: PostgreSQL 15+
- **キャッシュ**: Redis 7+

### 1.2 設計方針
- 論理削除（soft delete）を採用
- タイムスタンプは全テーブルで必須
- UUIDを主キーとして使用
- 正規化を基本としつつ、パフォーマンスを考慮

---

## 2. ER図

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │────<│   user_clinics  │>────│    clinics      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               │
        v                                               │
┌─────────────────┐                                     │
│  subscriptions  │                                     │
└─────────────────┘                                     │
                                                        │
        ┌───────────────────────────────────────────────┤
        │                       │                       │
        v                       v                       v
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  clinic_naps    │     │ clinic_alt_naps │     │  clinic_sites   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        │
┌─────────────────┐                                     │
│  master_sites   │─────────────────────────────────────┤
└─────────────────┘                                     │
                                                        v
                                                ┌─────────────────┐
                                                │  site_checks    │
                                                └─────────────────┘
                                                        │
                                                        v
                                                ┌─────────────────┐
                                                │correction_requests│
                                                └─────────────────┘
```

---

## 3. テーブル定義

### 3.1 users（ユーザー）

ユーザーアカウント情報を管理。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| email | VARCHAR(255) | NO | - | メールアドレス（ユニーク） |
| password_hash | VARCHAR(255) | NO | - | パスワードハッシュ（bcrypt） |
| name | VARCHAR(100) | NO | - | 氏名 |
| phone | VARCHAR(20) | YES | NULL | 電話番号 |
| role | VARCHAR(20) | NO | 'client' | 権限（admin/client） |
| email_verified_at | TIMESTAMP | YES | NULL | メール認証日時 |
| failed_login_attempts | INTEGER | NO | 0 | ログイン失敗回数 |
| locked_until | TIMESTAMP | YES | NULL | アカウントロック解除日時 |
| last_login_at | TIMESTAMP | YES | NULL | 最終ログイン日時 |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |
| deleted_at | TIMESTAMP | YES | NULL | 削除日時（論理削除） |

**インデックス**
- `users_email_idx` UNIQUE ON (email) WHERE deleted_at IS NULL
- `users_role_idx` ON (role)

---

### 3.2 clinics（医院）

医院の基本情報を管理。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| name | VARCHAR(200) | NO | - | 医院名（表示用） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |
| deleted_at | TIMESTAMP | YES | NULL | 削除日時 |

---

### 3.3 user_clinics（ユーザー・医院関連）

ユーザーと医院の多対多関係を管理。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | ユーザーID（FK） |
| clinic_id | UUID | NO | - | 医院ID（FK） |
| role | VARCHAR(20) | NO | 'owner' | 役割（owner/member） |
| created_at | TIMESTAMP | NO | now() | 作成日時 |

**インデックス**
- `user_clinics_user_id_idx` ON (user_id)
- `user_clinics_clinic_id_idx` ON (clinic_id)
- `user_clinics_unique_idx` UNIQUE ON (user_id, clinic_id)

---

### 3.4 clinic_naps（正式NAP）

医院の正式NAP情報。各医院につき1レコード。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| clinic_id | UUID | NO | - | 医院ID（FK、ユニーク） |
| name | VARCHAR(200) | NO | - | 正式医院名 |
| postal_code | VARCHAR(10) | NO | - | 郵便番号 |
| prefecture | VARCHAR(10) | NO | - | 都道府県 |
| city | VARCHAR(50) | NO | - | 市区町村 |
| address | VARCHAR(200) | NO | - | 番地 |
| building | VARCHAR(200) | YES | NULL | 建物名・階 |
| phone | VARCHAR(20) | NO | - | 電話番号 |
| fax | VARCHAR(20) | YES | NULL | FAX番号 |
| email | VARCHAR(255) | YES | NULL | 公開メールアドレス |
| website_url | VARCHAR(500) | YES | NULL | 公式サイトURL |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

**インデックス**
- `clinic_naps_clinic_id_idx` UNIQUE ON (clinic_id)

---

### 3.5 clinic_alt_naps（代替NAP/旧名称）

医院の旧名称や許容される表記揺れを管理。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| clinic_id | UUID | NO | - | 医院ID（FK） |
| name | VARCHAR(200) | YES | NULL | 代替医院名 |
| address | VARCHAR(500) | YES | NULL | 代替住所表記 |
| phone | VARCHAR(20) | YES | NULL | 代替電話番号 |
| treat_as_match | BOOLEAN | NO | true | 一致として扱うか |
| note | TEXT | YES | NULL | メモ |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

**インデックス**
- `clinic_alt_naps_clinic_id_idx` ON (clinic_id)

---

### 3.6 master_sites（マスタサイト）

管理者が登録する共通監視対象サイト。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| name | VARCHAR(100) | NO | - | サイト名 |
| category | VARCHAR(50) | NO | - | カテゴリ |
| base_url | VARCHAR(500) | NO | - | 基本URL |
| search_url_pattern | VARCHAR(1000) | YES | NULL | 検索URLパターン |
| scraping_config | JSONB | YES | NULL | スクレイピング設定 |
| priority | VARCHAR(10) | NO | 'medium' | 優先度（high/medium/low） |
| check_frequency | VARCHAR(10) | NO | 'weekly' | チェック頻度 |
| is_active | BOOLEAN | NO | true | 有効フラグ |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

**カテゴリ値**
- `map_service`: 地図サービス
- `review_site`: 口コミサイト
- `medical_portal`: 医療情報サイト
- `other`: その他

**インデックス**
- `master_sites_category_idx` ON (category)
- `master_sites_is_active_idx` ON (is_active)

---

### 3.7 clinic_sites（医院サイト）

各医院の監視対象サイト（マスタ、自動追加、手動追加）。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| clinic_id | UUID | NO | - | 医院ID（FK） |
| master_site_id | UUID | YES | NULL | マスタサイトID（FK、NULLの場合は手動/自動） |
| source_type | VARCHAR(20) | NO | - | 種別（master/auto/manual） |
| name | VARCHAR(100) | NO | - | サイト名 |
| url | VARCHAR(1000) | NO | - | 掲載ページURL |
| status | VARCHAR(20) | NO | 'unchecked' | チェックステータス |
| auto_status | VARCHAR(20) | YES | NULL | 自動追加時のステータス |
| note | TEXT | YES | NULL | メモ |
| last_checked_at | TIMESTAMP | YES | NULL | 最終チェック日時 |
| next_check_at | TIMESTAMP | YES | NULL | 次回チェック予定日時 |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |
| deleted_at | TIMESTAMP | YES | NULL | 削除日時 |

**source_type値**
- `master`: マスタサイトから生成
- `auto`: 自動発見
- `manual`: 手動追加

**status値**
- `match`: 一致
- `needs_review`: 要確認
- `mismatch`: 不一致
- `unchecked`: 未チェック
- `inaccessible`: アクセス不可

**auto_status値**
- `unconfirmed`: 未確認
- `confirmed`: 確認済み
- `excluded`: 除外

**インデックス**
- `clinic_sites_clinic_id_idx` ON (clinic_id)
- `clinic_sites_master_site_id_idx` ON (master_site_id)
- `clinic_sites_status_idx` ON (status)
- `clinic_sites_source_type_idx` ON (source_type)

---

### 3.8 site_checks（サイトチェック履歴）

各サイトのNAPチェック結果を履歴として保存。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| clinic_site_id | UUID | NO | - | 医院サイトID（FK） |
| status | VARCHAR(20) | NO | - | チェック結果ステータス |
| detected_name | VARCHAR(200) | YES | NULL | 検出された医院名 |
| detected_address | VARCHAR(500) | YES | NULL | 検出された住所 |
| detected_phone | VARCHAR(50) | YES | NULL | 検出された電話番号 |
| raw_html | TEXT | YES | NULL | 取得したHTML（デバッグ用） |
| error_message | TEXT | YES | NULL | エラーメッセージ |
| checked_at | TIMESTAMP | NO | now() | チェック実行日時 |

**インデックス**
- `site_checks_clinic_site_id_idx` ON (clinic_site_id)
- `site_checks_checked_at_idx` ON (checked_at)

---

### 3.9 correction_requests（修正依頼）

サイトへの修正依頼の記録。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| clinic_site_id | UUID | NO | - | 医院サイトID（FK） |
| site_check_id | UUID | YES | NULL | チェック履歴ID（FK） |
| status | VARCHAR(20) | NO | 'pending' | 対応ステータス |
| template_content | TEXT | YES | NULL | 生成されたテンプレート |
| sent_at | TIMESTAMP | YES | NULL | 送信日時 |
| response_at | TIMESTAMP | YES | NULL | 返答受領日時 |
| completed_at | TIMESTAMP | YES | NULL | 対応完了日時 |
| note | TEXT | YES | NULL | メモ |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

**status値**
- `pending`: 未対応
- `sent`: 依頼中
- `in_progress`: 対応中
- `completed`: 完了
- `rejected`: 対応不可

**インデックス**
- `correction_requests_clinic_site_id_idx` ON (clinic_site_id)
- `correction_requests_status_idx` ON (status)

---

### 3.10 subscriptions（サブスクリプション）

Stripe連携によるサブスクリプション管理。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | ユーザーID（FK） |
| stripe_customer_id | VARCHAR(100) | NO | - | Stripe顧客ID |
| stripe_subscription_id | VARCHAR(100) | YES | NULL | StripeサブスクリプションID |
| plan | VARCHAR(20) | NO | 'trial' | プラン名 |
| status | VARCHAR(20) | NO | 'active' | ステータス |
| trial_ends_at | TIMESTAMP | YES | NULL | トライアル終了日時 |
| current_period_start | TIMESTAMP | YES | NULL | 現在の請求期間開始 |
| current_period_end | TIMESTAMP | YES | NULL | 現在の請求期間終了 |
| canceled_at | TIMESTAMP | YES | NULL | キャンセル日時 |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

**plan値**
- `trial`: トライアル
- `light`: ライトプラン
- `standard`: スタンダードプラン
- `enterprise`: エンタープライズプラン

**status値**
- `trialing`: トライアル中
- `active`: 有効
- `past_due`: 支払い遅延
- `canceled`: キャンセル済み
- `paused`: 一時停止

**インデックス**
- `subscriptions_user_id_idx` ON (user_id)
- `subscriptions_stripe_customer_id_idx` ON (stripe_customer_id)
- `subscriptions_status_idx` ON (status)

---

### 3.11 notification_settings（通知設定）

ユーザーごとの通知設定。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | ユーザーID（FK） |
| instant_alert | BOOLEAN | NO | true | 即時通知 |
| weekly_summary | BOOLEAN | NO | true | 週次サマリー |
| monthly_report | BOOLEAN | NO | true | 月次レポート |
| additional_emails | JSONB | YES | '[]' | 追加通知先メールアドレス |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

**インデックス**
- `notification_settings_user_id_idx` UNIQUE ON (user_id)

---

### 3.12 email_verification_tokens（メール認証トークン）

メール認証用のワンタイムトークン。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | ユーザーID（FK） |
| token | VARCHAR(100) | NO | - | トークン |
| expires_at | TIMESTAMP | NO | - | 有効期限 |
| used_at | TIMESTAMP | YES | NULL | 使用日時 |
| created_at | TIMESTAMP | NO | now() | 作成日時 |

**インデックス**
- `email_verification_tokens_token_idx` UNIQUE ON (token)
- `email_verification_tokens_user_id_idx` ON (user_id)

---

### 3.13 password_reset_tokens（パスワードリセットトークン）

パスワードリセット用のワンタイムトークン。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| user_id | UUID | NO | - | ユーザーID（FK） |
| token | VARCHAR(100) | NO | - | トークン |
| expires_at | TIMESTAMP | NO | - | 有効期限 |
| used_at | TIMESTAMP | YES | NULL | 使用日時 |
| created_at | TIMESTAMP | NO | now() | 作成日時 |

**インデックス**
- `password_reset_tokens_token_idx` UNIQUE ON (token)
- `password_reset_tokens_user_id_idx` ON (user_id)

---

## 4. Prismaスキーマ

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                  String    @id @default(uuid()) @db.Uuid
  email               String    @unique @db.VarChar(255)
  passwordHash        String    @map("password_hash") @db.VarChar(255)
  name                String    @db.VarChar(100)
  phone               String?   @db.VarChar(20)
  role                String    @default("client") @db.VarChar(20)
  emailVerifiedAt     DateTime? @map("email_verified_at")
  failedLoginAttempts Int       @default(0) @map("failed_login_attempts")
  lockedUntil         DateTime? @map("locked_until")
  lastLoginAt         DateTime? @map("last_login_at")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  deletedAt           DateTime? @map("deleted_at")

  userClinics             UserClinic[]
  subscription            Subscription?
  notificationSetting     NotificationSetting?
  emailVerificationTokens EmailVerificationToken[]
  passwordResetTokens     PasswordResetToken[]

  @@map("users")
}

model Clinic {
  id        String    @id @default(uuid()) @db.Uuid
  name      String    @db.VarChar(200)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  userClinics   UserClinic[]
  clinicNap     ClinicNap?
  clinicAltNaps ClinicAltNap[]
  clinicSites   ClinicSite[]

  @@map("clinics")
}

model UserClinic {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  clinicId  String   @map("clinic_id") @db.Uuid
  role      String   @default("owner") @db.VarChar(20)
  createdAt DateTime @default(now()) @map("created_at")

  user   User   @relation(fields: [userId], references: [id])
  clinic Clinic @relation(fields: [clinicId], references: [id])

  @@unique([userId, clinicId])
  @@map("user_clinics")
}

model ClinicNap {
  id         String   @id @default(uuid()) @db.Uuid
  clinicId   String   @unique @map("clinic_id") @db.Uuid
  name       String   @db.VarChar(200)
  postalCode String   @map("postal_code") @db.VarChar(10)
  prefecture String   @db.VarChar(10)
  city       String   @db.VarChar(50)
  address    String   @db.VarChar(200)
  building   String?  @db.VarChar(200)
  phone      String   @db.VarChar(20)
  fax        String?  @db.VarChar(20)
  email      String?  @db.VarChar(255)
  websiteUrl String?  @map("website_url") @db.VarChar(500)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  clinic Clinic @relation(fields: [clinicId], references: [id])

  @@map("clinic_naps")
}

model ClinicAltNap {
  id           String   @id @default(uuid()) @db.Uuid
  clinicId     String   @map("clinic_id") @db.Uuid
  name         String?  @db.VarChar(200)
  address      String?  @db.VarChar(500)
  phone        String?  @db.VarChar(20)
  treatAsMatch Boolean  @default(true) @map("treat_as_match")
  note         String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  clinic Clinic @relation(fields: [clinicId], references: [id])

  @@map("clinic_alt_naps")
}

model MasterSite {
  id               String   @id @default(uuid()) @db.Uuid
  name             String   @db.VarChar(100)
  category         String   @db.VarChar(50)
  baseUrl          String   @map("base_url") @db.VarChar(500)
  searchUrlPattern String?  @map("search_url_pattern") @db.VarChar(1000)
  scrapingConfig   Json?    @map("scraping_config")
  priority         String   @default("medium") @db.VarChar(10)
  checkFrequency   String   @default("weekly") @map("check_frequency") @db.VarChar(10)
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  clinicSites ClinicSite[]

  @@map("master_sites")
}

model ClinicSite {
  id            String    @id @default(uuid()) @db.Uuid
  clinicId      String    @map("clinic_id") @db.Uuid
  masterSiteId  String?   @map("master_site_id") @db.Uuid
  sourceType    String    @map("source_type") @db.VarChar(20)
  name          String    @db.VarChar(100)
  url           String    @db.VarChar(1000)
  status        String    @default("unchecked") @db.VarChar(20)
  autoStatus    String?   @map("auto_status") @db.VarChar(20)
  note          String?
  lastCheckedAt DateTime? @map("last_checked_at")
  nextCheckAt   DateTime? @map("next_check_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  clinic             Clinic              @relation(fields: [clinicId], references: [id])
  masterSite         MasterSite?         @relation(fields: [masterSiteId], references: [id])
  siteChecks         SiteCheck[]
  correctionRequests CorrectionRequest[]

  @@map("clinic_sites")
}

model SiteCheck {
  id              String   @id @default(uuid()) @db.Uuid
  clinicSiteId    String   @map("clinic_site_id") @db.Uuid
  status          String   @db.VarChar(20)
  detectedName    String?  @map("detected_name") @db.VarChar(200)
  detectedAddress String?  @map("detected_address") @db.VarChar(500)
  detectedPhone   String?  @map("detected_phone") @db.VarChar(50)
  rawHtml         String?  @map("raw_html")
  errorMessage    String?  @map("error_message")
  checkedAt       DateTime @default(now()) @map("checked_at")

  clinicSite         ClinicSite          @relation(fields: [clinicSiteId], references: [id])
  correctionRequests CorrectionRequest[]

  @@map("site_checks")
}

model CorrectionRequest {
  id              String    @id @default(uuid()) @db.Uuid
  clinicSiteId    String    @map("clinic_site_id") @db.Uuid
  siteCheckId     String?   @map("site_check_id") @db.Uuid
  status          String    @default("pending") @db.VarChar(20)
  templateContent String?   @map("template_content")
  sentAt          DateTime? @map("sent_at")
  responseAt      DateTime? @map("response_at")
  completedAt     DateTime? @map("completed_at")
  note            String?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  clinicSite ClinicSite @relation(fields: [clinicSiteId], references: [id])
  siteCheck  SiteCheck? @relation(fields: [siteCheckId], references: [id])

  @@map("correction_requests")
}

model Subscription {
  id                   String    @id @default(uuid()) @db.Uuid
  userId               String    @unique @map("user_id") @db.Uuid
  stripeCustomerId     String    @map("stripe_customer_id") @db.VarChar(100)
  stripeSubscriptionId String?   @map("stripe_subscription_id") @db.VarChar(100)
  plan                 String    @default("trial") @db.VarChar(20)
  status               String    @default("active") @db.VarChar(20)
  trialEndsAt          DateTime? @map("trial_ends_at")
  currentPeriodStart   DateTime? @map("current_period_start")
  currentPeriodEnd     DateTime? @map("current_period_end")
  canceledAt           DateTime? @map("canceled_at")
  createdAt            DateTime  @default(now()) @map("created_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@map("subscriptions")
}

model NotificationSetting {
  id               String   @id @default(uuid()) @db.Uuid
  userId           String   @unique @map("user_id") @db.Uuid
  instantAlert     Boolean  @default(true) @map("instant_alert")
  weeklySummary    Boolean  @default(true) @map("weekly_summary")
  monthlyReport    Boolean  @default(true) @map("monthly_report")
  additionalEmails Json     @default("[]") @map("additional_emails")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id])

  @@map("notification_settings")
}

model EmailVerificationToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  token     String    @unique @db.VarChar(100)
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("email_verification_tokens")
}

model PasswordResetToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  token     String    @unique @db.VarChar(100)
  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@map("password_reset_tokens")
}
```

---

## 5. マイグレーション

初期マイグレーションコマンド:

```bash
# Prisma初期化
npx prisma init

# マイグレーション作成
npx prisma migrate dev --name init

# 本番環境適用
npx prisma migrate deploy
```

---

## 6. シード データ

初期マスタサイトデータ例:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // マスタサイト初期データ
  const masterSites = [
    {
      name: 'Googleビジネスプロフィール',
      category: 'map_service',
      baseUrl: 'https://www.google.com/maps',
      priority: 'high',
      checkFrequency: 'daily',
    },
    {
      name: 'Yahoo!ロコ',
      category: 'map_service',
      baseUrl: 'https://loco.yahoo.co.jp',
      priority: 'high',
      checkFrequency: 'daily',
    },
    {
      name: 'エキテン',
      category: 'review_site',
      baseUrl: 'https://www.ekiten.jp',
      priority: 'high',
      checkFrequency: 'weekly',
    },
    {
      name: 'EPARK歯科',
      category: 'medical_portal',
      baseUrl: 'https://haisha-yoyaku.jp',
      priority: 'high',
      checkFrequency: 'weekly',
    },
    {
      name: 'デンターネット',
      category: 'medical_portal',
      baseUrl: 'https://www.denternet.jp',
      priority: 'medium',
      checkFrequency: 'weekly',
    },
    {
      name: '歯科タウン',
      category: 'medical_portal',
      baseUrl: 'https://www.shika-town.com',
      priority: 'medium',
      checkFrequency: 'weekly',
    },
    {
      name: 'Caloo',
      category: 'review_site',
      baseUrl: 'https://caloo.jp',
      priority: 'medium',
      checkFrequency: 'weekly',
    },
    {
      name: '病院なび',
      category: 'medical_portal',
      baseUrl: 'https://byoinnavi.jp',
      priority: 'medium',
      checkFrequency: 'weekly',
    },
  ];

  for (const site of masterSites) {
    await prisma.masterSite.upsert({
      where: { id: site.name }, // 実際はユニーク制約が必要
      update: site,
      create: site,
    });
  }

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```
