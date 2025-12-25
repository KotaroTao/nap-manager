# デンタルNAPマネージャー

歯科医院のNAP（Name, Address, Phone）情報をWEB上で統一管理し、各種サイトでの表記揺れを検出・是正することで、MEO効果を最大化するWEBツールです。

## 概要

- 主要サイト（Googleマップ、Yahoo!ロコ、エキテン等）のNAP情報を自動監視
- 表記揺れ・不一致を検出してアラート通知
- 修正依頼テンプレートを自動生成
- Stripe課金による3プラン構成（ライト/スタンダード/エンタープライズ）

## 仕様書

| ドキュメント | 説明 |
|-------------|------|
| [メイン仕様書](./docs/SPECIFICATION.md) | 機能要件、ユーザー種別、非機能要件 |
| [データベース設計書](./docs/DATABASE.md) | テーブル定義、ER図、Prismaスキーマ |
| [API設計書](./docs/API.md) | RESTful API エンドポイント定義 |
| [画面設計書](./docs/SCREENS.md) | 画面一覧、ワイヤーフレーム、コンポーネント |

## 技術スタック（予定）

- **フロントエンド**: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- **バックエンド**: Next.js API Routes, Prisma
- **データベース**: PostgreSQL, Redis
- **認証**: NextAuth.js
- **決済**: Stripe
- **メール**: Resend / SendGrid

## 開発状況

- [x] 仕様書作成
- [ ] 環境構築
- [ ] 認証システム実装
- [ ] 医院情報管理実装
- [ ] サイトリスト管理実装
- [ ] NAP一致チェック実装
- [ ] Stripe課金統合
- [ ] 本番デプロイ

## ライセンス

Private
