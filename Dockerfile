# ベースイメージ
FROM node:20-alpine AS base

# 依存関係インストール用ステージ
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package.json package-lock.json* ./

# Prismaスキーマをコピー（postinstallでprisma generateが必要）
COPY prisma ./prisma

# 依存関係をインストール
RUN npm ci

# ビルド用ステージ
FROM base AS builder
WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prismaクライアントを生成
RUN npx prisma generate

# 環境変数を設定（ビルド時にダミー値を使用）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.jsをビルド
RUN npm run build

# 本番用ステージ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# OpenSSLをインストール（Prismaエンジン用）
RUN apk add --no-cache openssl

# セキュリティ: 非rootユーザーで実行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Prisma CLIとtsxをコピー（マイグレーション・シード用、nextjsユーザーに所有権を付与）
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@esbuild ./node_modules/@esbuild
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps

# Next.js standalone出力を使用
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# アプリケーション起動
CMD ["node", "server.js"]
