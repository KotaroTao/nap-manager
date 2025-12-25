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

管理者が登録する共通確認対象サイト。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| name | VARCHAR(100) | NO | - | サイト名 |
| site_url | VARCHAR(500) | NO | - | サイトURL |
| registration_url | VARCHAR(500) | YES | NULL | 新規登録URL |
| correction_url | VARCHAR(500) | YES | NULL | 修正依頼URL |
| pricing_type | VARCHAR(20) | NO | 'free' | 種別①（料金体系） |
| site_type | VARCHAR(20) | NO | 'portal' | 種別②（サイト分類） |
| contact_method | VARCHAR(20) | NO | 'form' | 変更依頼方法 |
| comment | TEXT | YES | NULL | コメント |
| priority | VARCHAR(10) | NO | 'medium' | 優先度（high/medium/low） |
| check_frequency | VARCHAR(10) | NO | 'monthly' | 確認推奨頻度 |
| is_active | BOOLEAN | NO | true | 有効フラグ |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |

**pricing_type値（種別①）**
- `free`: 無料
- `paid`: 有料
- `approval`: 承認制

**site_type値（種別②）**
- `sns`: SNS
- `portal`: ポータルサイト
- `job`: 求人サイト
- `other`: その他

**contact_method値（変更依頼方法）**
- `form`: WEBフォーム
- `email`: メール
- `phone`: 電話
- `other`: その他

**インデックス**
- `master_sites_pricing_type_idx` ON (pricing_type)
- `master_sites_site_type_idx` ON (site_type)
- `master_sites_is_active_idx` ON (is_active)

---

### 3.7 clinic_sites（医院サイト）

各医院の確認対象サイト（マスタまたは手動追加）。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| clinic_id | UUID | NO | - | 医院ID（FK） |
| master_site_id | UUID | YES | NULL | マスタサイトID（FK、NULLの場合は手動追加） |
| source_type | VARCHAR(20) | NO | - | 種別（master/manual） |
| name | VARCHAR(100) | NO | - | サイト名 |
| url | VARCHAR(1000) | YES | NULL | 医院ページURL（特定できる場合） |
| status | VARCHAR(20) | NO | 'unchecked' | 確認ステータス |
| note | TEXT | YES | NULL | メモ |
| last_checked_at | TIMESTAMP | YES | NULL | 最終確認日時 |
| next_check_at | TIMESTAMP | YES | NULL | 次回確認推奨日時 |
| created_at | TIMESTAMP | NO | now() | 作成日時 |
| updated_at | TIMESTAMP | NO | now() | 更新日時 |
| deleted_at | TIMESTAMP | YES | NULL | 削除日時 |

**source_type値**
- `master`: マスタサイトから生成
- `manual`: 手動追加

**status値**
- `match`: 一致
- `mismatch`: 不一致
- `not_listed`: 未掲載
- `unchecked`: 未確認

**インデックス**
- `clinic_sites_clinic_id_idx` ON (clinic_id)
- `clinic_sites_master_site_id_idx` ON (master_site_id)
- `clinic_sites_status_idx` ON (status)
- `clinic_sites_source_type_idx` ON (source_type)

---

### 3.8 site_checks（確認履歴）

各サイトのNAP確認結果を履歴として保存（ユーザーが手動で入力）。

| カラム名 | 型 | NULL | デフォルト | 説明 |
|----------|------|------|------------|------|
| id | UUID | NO | gen_random_uuid() | 主キー |
| clinic_site_id | UUID | NO | - | 医院サイトID（FK） |
| checked_by | UUID | NO | - | 確認者（ユーザーID、FK） |
| status | VARCHAR(20) | NO | - | 確認結果ステータス |
| confirmed_name | VARCHAR(200) | YES | NULL | 確認した医院名 |
| confirmed_address | VARCHAR(500) | YES | NULL | 確認した住所 |
| confirmed_phone | VARCHAR(50) | YES | NULL | 確認した電話番号 |
| note | TEXT | YES | NULL | メモ |
| checked_at | TIMESTAMP | NO | now() | 確認実行日時 |

**インデックス**
- `site_checks_clinic_site_id_idx` ON (clinic_site_id)
- `site_checks_checked_by_idx` ON (checked_by)
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
  id              String    @id @default(uuid()) @db.Uuid
  email           String    @unique @db.VarChar(255)
  passwordHash    String    @map("password_hash") @db.VarChar(255)
  name            String    @db.VarChar(100)
  phone           String?   @db.VarChar(20)
  role            String    @default("client") @db.VarChar(20)
  emailVerifiedAt DateTime? @map("email_verified_at")
  lastLoginAt     DateTime? @map("last_login_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  userClinics             UserClinic[]
  subscription            Subscription?
  notificationSetting     NotificationSetting?
  emailVerificationTokens EmailVerificationToken[]
  passwordResetTokens     PasswordResetToken[]
  siteChecks              SiteCheck[]

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
  id              String   @id @default(uuid()) @db.Uuid
  name            String   @db.VarChar(100)
  siteUrl         String   @map("site_url") @db.VarChar(500)
  registrationUrl String?  @map("registration_url") @db.VarChar(500)
  correctionUrl   String?  @map("correction_url") @db.VarChar(500)
  pricingType     String   @default("free") @map("pricing_type") @db.VarChar(20)
  siteType        String   @default("portal") @map("site_type") @db.VarChar(20)
  contactMethod   String   @default("form") @map("contact_method") @db.VarChar(20)
  comment         String?
  priority        String   @default("medium") @db.VarChar(10)
  checkFrequency  String   @default("monthly") @map("check_frequency") @db.VarChar(10)
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  clinicSites ClinicSite[]

  @@map("master_sites")
}

model ClinicSite {
  id            String    @id @default(uuid()) @db.Uuid
  clinicId      String    @map("clinic_id") @db.Uuid
  masterSiteId  String?   @map("master_site_id") @db.Uuid
  sourceType    String    @map("source_type") @db.VarChar(20)
  name          String    @db.VarChar(100)
  url           String?   @db.VarChar(1000)
  status        String    @default("unchecked") @db.VarChar(20)
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
  id               String   @id @default(uuid()) @db.Uuid
  clinicSiteId     String   @map("clinic_site_id") @db.Uuid
  checkedBy        String   @map("checked_by") @db.Uuid
  status           String   @db.VarChar(20)
  confirmedName    String?  @map("confirmed_name") @db.VarChar(200)
  confirmedAddress String?  @map("confirmed_address") @db.VarChar(500)
  confirmedPhone   String?  @map("confirmed_phone") @db.VarChar(50)
  note             String?
  checkedAt        DateTime @default(now()) @map("checked_at")

  clinicSite         ClinicSite          @relation(fields: [clinicSiteId], references: [id])
  checkedByUser      User                @relation(fields: [checkedBy], references: [id])
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
      siteUrl: 'https://www.google.com/maps',
      registrationUrl: 'https://business.google.com/',
      correctionUrl: 'https://support.google.com/business/',
      pricingType: 'free',
      siteType: 'portal',
      contactMethod: 'form',
      comment: 'オーナー確認が必要',
      priority: 'high',
      checkFrequency: 'daily',
    },
    {
      name: 'Yahoo!ロコ',
      siteUrl: 'https://loco.yahoo.co.jp',
      registrationUrl: 'https://loco.yahoo.co.jp/business/',
      correctionUrl: 'https://loco.yahoo.co.jp/contact/',
      pricingType: 'free',
      siteType: 'portal',
      contactMethod: 'form',
      priority: 'high',
      checkFrequency: 'daily',
    },
    {
      name: 'エキテン',
      siteUrl: 'https://www.ekiten.jp',
      registrationUrl: 'https://www.ekiten.jp/owner/',
      correctionUrl: 'https://www.ekiten.jp/contact/',
      pricingType: 'free',
      siteType: 'portal',
      contactMethod: 'form',
      comment: '無料・有料プランあり',
      priority: 'high',
      checkFrequency: 'weekly',
    },
    {
      name: 'EPARK歯科',
      siteUrl: 'https://haisha-yoyaku.jp',
      registrationUrl: 'https://haisha-yoyaku.jp/owner/',
      correctionUrl: 'https://haisha-yoyaku.jp/contact/',
      pricingType: 'paid',
      siteType: 'portal',
      contactMethod: 'form',
      priority: 'high',
      checkFrequency: 'weekly',
    },
    {
      name: 'Instagram',
      siteUrl: 'https://www.instagram.com',
      registrationUrl: 'https://www.instagram.com/accounts/emailsignup/',
      pricingType: 'free',
      siteType: 'sns',
      contactMethod: 'other',
      comment: 'プロフィール欄で直接編集',
      priority: 'high',
      checkFrequency: 'weekly',
    },
    {
      name: 'Indeed',
      siteUrl: 'https://jp.indeed.com',
      registrationUrl: 'https://employers.indeed.com/',
      correctionUrl: 'https://indeed.force.com/employerSupport/',
      pricingType: 'paid',
      siteType: 'job',
      contactMethod: 'form',
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
