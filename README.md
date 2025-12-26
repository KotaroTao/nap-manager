# デンタルNAPマネージャー

歯科医院のNAP情報（Name, Address, Phone）を一元管理し、各種ポータルサイトとの情報統一を支援するWebアプリケーションです。

## 機能概要

- **医院管理**: 正式なNAP情報の登録・管理
- **サイト管理**: 監視対象サイト（Googleビジネスプロフィール、EPARK歯科など）の管理
- **NAP統一作業**: 各サイトのNAP情報との差分確認・修正依頼
- **修正依頼管理**: 依頼履歴・ステータス管理
- **CSVインポート/エクスポート**: 一括データ管理

## 技術スタック

- **フロントエンド**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Next.js API Routes, Prisma ORM
- **データベース**: PostgreSQL
- **認証**: NextAuth.js v5

---

## クイックスタート（Docker）

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd nap-manager
```

### 2. 環境変数を設定

```bash
cp .env.example .env
```

`.env`ファイルを編集して、以下の必須項目を設定:

```bash
# 認証シークレット（必須: ランダムな文字列を生成）
AUTH_SECRET="$(openssl rand -base64 32)"

# データベースパスワード（任意: デフォルトはpostgres）
DB_PASSWORD="your-secure-password"

# アプリケーションURL（本番環境では実際のドメインに変更）
NEXTAUTH_URL="https://your-domain.com"
```

### 3. Docker Composeで起動

```bash
docker compose up -d
```

### 4. データベースマイグレーション

```bash
docker compose exec app npx prisma migrate deploy
```

### 5. 初期データ投入（任意）

```bash
docker compose exec app npx prisma db seed
```

### 6. アプリケーションにアクセス

http://localhost:3000

---

## 開発環境セットアップ

### 前提条件

- Node.js 20以上
- PostgreSQL 14以上

### 1. 依存関係をインストール

```bash
npm install
```

### 2. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local`を編集:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/nap_manager"
AUTH_SECRET="development-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. データベースをセットアップ

```bash
# マイグレーション実行
npx prisma migrate dev

# 初期データ投入
npm run db:seed
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

---

## 本番環境デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)でプロジェクトを作成
2. 環境変数を設定:
   - `DATABASE_URL`: PostgreSQL接続URL
   - `AUTH_SECRET`: 認証シークレット
   - `NEXTAUTH_URL`: 本番URL

3. デプロイ実行

### VPS/クラウドへのデプロイ

1. Docker Composeを使用（推奨）:

```bash
# 本番用環境変数を設定
export AUTH_SECRET="$(openssl rand -base64 32)"
export DB_PASSWORD="secure-password"
export NEXTAUTH_URL="https://your-domain.com"

# 起動
docker compose up -d

# マイグレーション
docker compose exec app npx prisma migrate deploy
```

2. リバースプロキシ（nginx/Caddy）でHTTPS化

---

## 初期管理者アカウント

シードデータ投入後、以下のアカウントでログイン可能:

- **Email**: admin@example.com
- **Password**: password123

**※本番環境では必ずパスワードを変更してください**

---

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm start` | 本番サーバー起動 |
| `npm run lint` | ESLint実行 |
| `npm run db:seed` | シードデータ投入 |
| `npm run db:reset` | データベースリセット |

---

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   ├── (dashboard)/       # ダッシュボード関連ページ
│   └── api/               # APIルート
├── components/            # Reactコンポーネント
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ
└── types/                 # 型定義
prisma/
├── schema.prisma          # データベーススキーマ
└── seed.ts               # シードデータ
```

---

## ライセンス

MIT License
