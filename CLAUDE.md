# デンタルNAPマネージャー

歯科医院のNAP情報（Name, Address, Phone）を一元管理し、各種ポータルサイトとの情報統一を支援するWebアプリケーション。

## プロジェクト情報

- **ローカルパス**: `C:\Users\hacha\nap-manager`
- **リポジトリ**: https://github.com/KotaroTao/nap-manager

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS, shadcn/ui
- **データベース**: PostgreSQL + Prisma ORM
- **認証**: NextAuth.js v5

## 主要コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run lint         # ESLint実行
npm run db:migrate   # マイグレーション実行
npm run db:seed      # シードデータ投入
```

## Docker起動

```bash
docker compose up -d
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

## ディレクトリ構成

```
src/
├── app/           # Next.js App Router（ページ・API）
├── components/    # Reactコンポーネント
├── hooks/         # カスタムフック
├── lib/           # ユーティリティ
└── types/         # 型定義
prisma/
├── schema.prisma  # DBスキーマ
├── migrations/    # マイグレーション
└── seed.ts        # シードデータ
```

## 主要機能

- 医院管理（CRUD、旧NAP情報）
- サイト管理（15サイトのマスタデータ）
- NAP統一ワークスペース
- 修正依頼管理
- CSVインポート/エクスポート

## 初期ログイン

- Email: `admin@example.com`
- Password: `password123`
