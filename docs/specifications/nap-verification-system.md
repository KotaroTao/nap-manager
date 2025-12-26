# NAP検証システム 仕様書

## 1. 概要

### 1.1 目的
デンタルNAPマネージャーに登録された医院の正式NAP情報を基準として、各ポータルサイトに掲載されている医院情報をWeb検索で自動取得・照合し、情報の不一致を検出するシステム。

### 1.2 主要機能
1. **Web検索によるNAP情報取得**: 登録済みサイトから医院のNAP情報を自動検索
2. **NAP情報の照合・比較**: 正式情報との差分を検出
3. **不一致時の修正依頼リンク表示**: ワンクリックで修正依頼ページへ遷移
4. **医院情報ページリンクの表示**: 各サイトの医院掲載ページへの直接リンク

---

## 2. システム構成

### 2.1 アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                      フロントエンド                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  検証ダッシュ     │  │  検証結果一覧    │  │  医院別検証詳細  │ │
│  │  ボード          │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ POST            │  │ GET             │  │ GET             │ │
│  │ /api/verify     │  │ /api/verify/    │  │ /api/verify/    │ │
│  │ /nap            │  │ results         │  │ [clinicId]      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    検証エンジン                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Web検索        │  │  情報抽出       │  │  照合エンジン    │ │
│  │  サービス       │  │  パーサー       │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      データベース                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Clinic         │  │  ClinicSite     │  │VerificationLog  │ │
│  │  ClinicNap      │  │  Site           │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. データベース設計

### 3.1 新規テーブル

#### VerificationLog（検証ログ）
検索・照合の実行履歴を記録。

```prisma
model VerificationLog {
  id              String   @id @default(uuid())
  clinicSiteId    String
  clinicSite      ClinicSite @relation(fields: [clinicSiteId], references: [id], onDelete: Cascade)

  // 検索結果
  searchQuery     String              // 実行した検索クエリ
  foundUrl        String?             // 発見された医院ページURL

  // 検出されたNAP情報
  detectedName    String?             // 検出された医院名
  detectedAddress String?             // 検出された住所
  detectedPhone   String?             // 検出された電話番号

  // 照合結果
  nameMatch       MatchStatus         // 医院名の一致状態
  addressMatch    MatchStatus         // 住所の一致状態
  phoneMatch      MatchStatus         // 電話番号の一致状態
  overallStatus   VerificationStatus  // 総合ステータス

  // メタ情報
  confidence      Float               // 検索結果の信頼度 (0.0-1.0)
  rawResponse     String?             // 検索レスポンスの生データ（デバッグ用）
  errorMessage    String?             // エラーメッセージ

  verifiedAt      DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([clinicSiteId])
  @@index([verifiedAt])
  @@index([overallStatus])
}

enum MatchStatus {
  match           // 完全一致
  partialMatch    // 部分一致
  mismatch        // 不一致
  notFound        // 情報未検出
  error           // 検索エラー
}

enum VerificationStatus {
  verified        // 検証済み（一致）
  mismatch        // 不一致あり
  needsReview     // 要確認（部分一致含む）
  notFound        // サイト上で未発見
  error           // エラー発生
  pending         // 検証待ち
}
```

### 3.2 既存テーブルの拡張

#### ClinicSite への追加フィールド
```prisma
model ClinicSite {
  // ... 既存フィールド ...

  // 新規追加
  clinicPageUrl       String?          // サイト上の医院ページURL
  lastVerifiedAt      DateTime?        // 最終検証日時
  verificationCount   Int @default(0)  // 検証実行回数

  verificationLogs    VerificationLog[]
}
```

#### Site への追加フィールド
```prisma
model Site {
  // ... 既存フィールド ...

  // 新規追加
  searchUrlTemplate   String?          // 検索URL テンプレート（例: "https://example.com/search?q={query}"）
  clinicPagePattern   String?          // 医院ページURLパターン（正規表現）
  napSelectors        Json?            // NAP情報抽出用CSSセレクタ
}
```

---

## 4. API設計

### 4.1 検証実行API

#### POST /api/verify/nap

**リクエスト**
```typescript
interface VerifyNapRequest {
  clinicId: string;           // 検証対象の医院ID
  siteIds?: string[];         // 対象サイトID（省略時は全マスタサイト）
  forceRefresh?: boolean;     // キャッシュ無視で再検索
}
```

**レスポンス**
```typescript
interface VerifyNapResponse {
  success: boolean;
  jobId: string;              // 非同期ジョブID
  message: string;
  estimatedTime: number;      // 推定所要時間（秒）
}
```

#### GET /api/verify/nap/status/:jobId

**レスポンス**
```typescript
interface VerificationJobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;           // 0-100
  completedSites: number;
  totalSites: number;
  results?: VerificationResult[];
}
```

### 4.2 検証結果取得API

#### GET /api/verify/results

**クエリパラメータ**
- `clinicId`: 医院ID（フィルタ）
- `siteId`: サイトID（フィルタ）
- `status`: 検証ステータス（フィルタ）
- `hasMismatch`: 不一致のみ（boolean）
- `page`, `limit`: ページネーション

**レスポンス**
```typescript
interface VerificationResultsResponse {
  results: VerificationResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalVerified: number;
    matched: number;
    mismatched: number;
    needsReview: number;
    notFound: number;
    errors: number;
  };
}

interface VerificationResult {
  id: string;
  clinic: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  site: {
    id: string;
    name: string;
    url: string;
    correctionRequestUrl: string | null;
  };
  clinicPageUrl: string | null;      // 医院情報ページURL

  // 正式NAP情報
  expectedNap: {
    name: string;
    address: string;
    phone: string;
  };

  // 検出されたNAP情報
  detectedNap: {
    name: string | null;
    address: string | null;
    phone: string | null;
  };

  // 照合結果
  matchResult: {
    name: MatchStatus;
    address: MatchStatus;
    phone: MatchStatus;
    overall: VerificationStatus;
  };

  // リンク情報
  links: {
    clinicPage: string | null;       // 医院情報ページ
    correctionRequest: string | null; // 修正依頼ページ
    siteSearch: string | null;        // サイト内検索ページ
  };

  verifiedAt: string;
  confidence: number;
}
```

### 4.3 医院別検証詳細API

#### GET /api/verify/clinics/:clinicId

**レスポンス**
```typescript
interface ClinicVerificationDetail {
  clinic: Clinic;
  napHistory: ClinicNap[];          // 旧NAP情報履歴
  siteResults: SiteVerificationResult[];
  summary: {
    totalSites: number;
    verified: number;
    matched: number;
    mismatched: number;
    needsReview: number;
    notFound: number;
    lastVerifiedAt: string | null;
  };
}

interface SiteVerificationResult {
  site: Site;
  clinicSite: ClinicSite;
  latestVerification: VerificationLog | null;
  links: {
    clinicPage: string | null;
    correctionRequest: string | null;
  };
  status: VerificationStatus;
  mismatchDetails: MismatchDetail[];
}

interface MismatchDetail {
  field: 'name' | 'address' | 'phone';
  expected: string;
  detected: string | null;
  matchStatus: MatchStatus;
  // 旧NAP情報との一致チェック
  matchesOldNap: boolean;
  matchedOldNapId: string | null;
}
```

---

## 5. Web検索・情報抽出

### 5.1 検索戦略

#### 検索クエリ生成
```typescript
interface SearchQueryGenerator {
  // サイト別の検索クエリを生成
  generateQuery(clinic: Clinic, site: Site): string;
}

// 例: Google ビジネスプロフィール
// "医院名 site:google.com/maps"

// 例: EPARK歯科
// "医院名 site:epark.jp"

// 例: デンターネット
// "医院名 site:denternet.jp"
```

#### サイト別検索テンプレート
```typescript
const searchTemplates: Record<string, string> = {
  'google-business': '{clinicName} site:google.com/maps',
  'yahoo-place': '{clinicName} site:loco.yahoo.co.jp',
  'epark-dental': '{clinicName} site:epark.jp/dental',
  'denternet': '{clinicName} site:denternet.jp',
  'shika-town': '{clinicName} site:shika-town.com',
  // ... 他サイト
};
```

### 5.2 情報抽出パーサー

#### NAP情報抽出インターフェース
```typescript
interface NapExtractor {
  // ページからNAP情報を抽出
  extract(html: string, site: Site): ExtractedNap;
}

interface ExtractedNap {
  name: string | null;
  address: string | null;
  phone: string | null;
  confidence: number;       // 抽出の信頼度
  rawData: Record<string, string>;  // 生データ
}
```

#### サイト別セレクタ設定
```typescript
const siteSelectors: Record<string, NapSelectors> = {
  'google-business': {
    name: '[data-attrid="title"] span',
    address: '[data-attrid="address"] span',
    phone: '[data-attrid="phone"] span',
  },
  'epark-dental': {
    name: '.clinic-name h1',
    address: '.clinic-address',
    phone: '.clinic-phone a',
  },
  // ... 他サイト
};
```

### 5.3 照合エンジン

#### 文字列照合ロジック
```typescript
interface NapMatcher {
  // NAP情報の照合
  match(expected: Nap, detected: ExtractedNap, oldNaps: ClinicNap[]): MatchResult;
}

interface MatchResult {
  name: {
    status: MatchStatus;
    similarity: number;           // 類似度 (0.0-1.0)
    matchedOldNap: ClinicNap | null;
  };
  address: {
    status: MatchStatus;
    similarity: number;
    normalizedExpected: string;   // 正規化後の期待値
    normalizedDetected: string;   // 正規化後の検出値
    matchedOldNap: ClinicNap | null;
  };
  phone: {
    status: MatchStatus;
    similarity: number;
    matchedOldNap: ClinicNap | null;
  };
  overall: VerificationStatus;
}
```

#### 住所正規化
```typescript
// 住所の表記揺れを吸収
function normalizeAddress(address: string): string {
  return address
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))  // 全角→半角
    .replace(/－/g, '-')
    .replace(/ー/g, '-')
    .replace(/丁目/g, '-')
    .replace(/番地?/g, '-')
    .replace(/号/g, '')
    .replace(/\s+/g, '')
    .trim();
}
```

#### 電話番号正規化
```typescript
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');  // 数字のみ抽出
}
```

---

## 6. フロントエンド設計

### 6.1 ページ構成

```
src/app/(dashboard)/
├── verification/                    # NAP検証
│   ├── page.tsx                     # 検証ダッシュボード
│   ├── results/
│   │   └── page.tsx                 # 検証結果一覧
│   └── clinics/
│       └── [id]/
│           └── page.tsx             # 医院別検証詳細
```

### 6.2 検証ダッシュボード

#### UI構成
```
┌────────────────────────────────────────────────────────────────┐
│  NAP検証ダッシュボード                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐ │
│  │ 検証済み      │ │ 一致         │ │ 不一致       │ │ 要確認  │ │
│  │    150       │ │    120       │ │     20       │ │   10   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘ │
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ 一括検証                                                    ││
│  │ ┌─────────────────────────────────┐                        ││
│  │ │ 医院を選択... ▼                   │  [全医院検証] [実行]   ││
│  │ └─────────────────────────────────┘                        ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ 最近の不一致                                                ││
│  │ ┌─────────────────────────────────────────────────────────┐││
│  │ │ 医院A | Googleビジネス | 電話番号不一致 | [詳細] [修正依頼]│││
│  │ │ 医院B | EPARK歯科     | 住所不一致     | [詳細] [修正依頼]│││
│  │ │ 医院C | デンターネット | 医院名部分一致  | [詳細] [修正依頼]│││
│  │ └─────────────────────────────────────────────────────────┘││
│  └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

### 6.3 検証結果一覧

#### UI構成
```
┌────────────────────────────────────────────────────────────────┐
│  検証結果一覧                              [フィルタ] [エクスポート] │
├────────────────────────────────────────────────────────────────┤
│ [全て] [一致] [不一致] [要確認] [未発見] [エラー]                  │
├────────────────────────────────────────────────────────────────┤
│ 医院名        │ サイト名       │ ステータス │ 操作               │
├───────────────┼───────────────┼───────────┼───────────────────┤
│ ○○歯科医院   │ Google        │ ✓ 一致    │ [医院ページ]       │
│               │ ビジネス       │           │                   │
├───────────────┼───────────────┼───────────┼───────────────────┤
│ ○○歯科医院   │ EPARK歯科     │ ✗ 不一致  │ [医院ページ]       │
│               │               │           │ [修正依頼]         │
├───────────────┼───────────────┼───────────┼───────────────────┤
│ △△デンタル   │ Yahoo!プレイス │ ⚠ 要確認  │ [医院ページ]       │
│ クリニック    │               │           │ [修正依頼]         │
├───────────────┼───────────────┼───────────┼───────────────────┤
│ □□歯科      │ デンターネット  │ ? 未発見  │ [サイト内検索]     │
│               │               │           │ [新規登録依頼]     │
└───────────────┴───────────────┴───────────┴───────────────────┘
```

### 6.4 医院別検証詳細

#### UI構成
```
┌────────────────────────────────────────────────────────────────┐
│  ○○歯科医院 - NAP検証詳細                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  【正式NAP情報】                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 医院名: ○○歯科医院                                       │  │
│  │ 住所: 東京都渋谷区○○1-2-3 △△ビル2F                      │  │
│  │ 電話: 03-1234-5678                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  【旧NAP情報】(クリックで展開)                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ▶ 2023/01: 旧医院名「○○歯科」、旧住所「渋谷区...」        │  │
│  │ ▶ 2022/06: 旧電話「03-9999-8888」                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  【サイト別検証結果】                    最終検証: 2024/01/15    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Google ビジネスプロフィール                    ✓ 一致     │  │
│  │ ├─ 医院名: ○○歯科医院                        ✓          │  │
│  │ ├─ 住所: 東京都渋谷区○○1-2-3 △△ビル2F       ✓          │  │
│  │ └─ 電話: 03-1234-5678                         ✓          │  │
│  │                                                          │  │
│  │ [医院ページを開く]                                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ EPARK歯科                                      ✗ 不一致  │  │
│  │ ├─ 医院名: ○○歯科医院                        ✓          │  │
│  │ ├─ 住所: 東京都渋谷区○○1-2-3                  ⚠ 部分一致 │  │
│  │ │       (ビル名が欠落)                                   │  │
│  │ └─ 電話: 03-9999-8888                         ✗ 旧情報   │  │
│  │         → 旧NAP(2022/06)と一致                            │  │
│  │                                                          │  │
│  │ [医院ページを開く] [修正依頼ページを開く]                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ デンターネット                                  ? 未発見  │  │
│  │ このサイトで医院情報が見つかりませんでした                  │  │
│  │                                                          │  │
│  │ [サイト内検索] [新規登録依頼]                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. コンポーネント設計

### 7.1 新規コンポーネント

```
src/components/
├── verification/
│   ├── verification-dashboard.tsx      # 検証ダッシュボード
│   ├── verification-stats.tsx          # 統計カード
│   ├── verification-trigger.tsx        # 検証実行ボタン
│   ├── verification-progress.tsx       # 検証進捗表示
│   ├── verification-results-table.tsx  # 結果一覧テーブル
│   ├── verification-result-card.tsx    # 結果カード
│   ├── nap-comparison.tsx              # NAP比較表示
│   ├── mismatch-detail.tsx             # 不一致詳細
│   ├── site-link-buttons.tsx           # サイトリンクボタン群
│   └── old-nap-accordion.tsx           # 旧NAP情報アコーディオン
```

### 7.2 サイトリンクボタン

```typescript
interface SiteLinkButtonsProps {
  clinicPageUrl: string | null;
  correctionRequestUrl: string | null;
  siteSearchUrl: string | null;
  status: VerificationStatus;
}

// 表示ロジック
// - status === 'verified' | 'match': [医院ページ]のみ
// - status === 'mismatch' | 'needsReview': [医院ページ] + [修正依頼]
// - status === 'notFound': [サイト内検索] + [新規登録]
// - status === 'error': [再検証]
```

---

## 8. カスタムフック

### 8.1 新規フック

```typescript
// src/hooks/use-verification.ts

// 検証実行
export function useVerifyNap() {
  return useMutation({
    mutationFn: (params: VerifyNapRequest) => api.post('/verify/nap', params),
    // ...
  });
}

// 検証ステータス監視
export function useVerificationStatus(jobId: string) {
  return useQuery({
    queryKey: ['verification', 'status', jobId],
    queryFn: () => api.get(`/verify/nap/status/${jobId}`),
    refetchInterval: (data) => data?.status === 'completed' ? false : 2000,
  });
}

// 検証結果一覧
export function useVerificationResults(params: VerificationResultsParams) {
  return useQuery({
    queryKey: ['verification', 'results', params],
    queryFn: () => api.get('/verify/results', { params }),
  });
}

// 医院別検証詳細
export function useClinicVerification(clinicId: string) {
  return useQuery({
    queryKey: ['verification', 'clinic', clinicId],
    queryFn: () => api.get(`/verify/clinics/${clinicId}`),
  });
}
```

---

## 9. 実装優先度

### Phase 1: 基盤構築（必須）
1. データベーススキーマ拡張
2. 検証結果取得API
3. 医院別検証詳細API
4. 基本的なUI（結果一覧、詳細表示）

### Phase 2: 検索・照合エンジン
1. Web検索サービス統合
2. サイト別パーサー実装
3. 照合エンジン実装
4. 旧NAP情報との照合

### Phase 3: UI/UX強化
1. 検証ダッシュボード
2. 進捗表示
3. 一括検証機能
4. フィルタ・ソート機能

### Phase 4: 自動化・最適化
1. 定期自動検証（Cron）
2. 検証結果キャッシュ
3. 検証優先度スコアリング
4. 通知機能連携

---

## 10. 技術的考慮事項

### 10.1 Web検索の制限
- Google Custom Search APIの利用制限（100クエリ/日 無料枠）
- レート制限対応（リクエスト間隔調整）
- キャッシュ戦略（同一クエリの重複排除）

### 10.2 スクレイピングの注意点
- robots.txtの確認
- 適切なUser-Agent設定
- リクエスト間隔の調整（Polite crawling）
- サイトの利用規約確認

### 10.3 パフォーマンス
- 非同期処理（バックグラウンドジョブ）
- 並列処理（複数サイト同時検証）
- 結果のキャッシュ（有効期限付き）

### 10.4 エラーハンドリング
- ネットワークエラーのリトライ
- パース失敗時のフォールバック
- 部分的な成功の処理

---

## 11. セキュリティ考慮事項

### 11.1 API保護
- 認証必須
- レート制限（ユーザー単位）
- 入力バリデーション

### 11.2 データ保護
- 検索ログの定期削除
- 個人情報の適切な取り扱い
- 外部サービスへの情報送信の最小化

---

## 12. 今後の拡張可能性

### 12.1 AI/ML統合
- 自然言語処理による住所正規化
- 機械学習による類似度判定
- OCR による画像からの情報抽出

### 12.2 通知・レポート
- 不一致検出時のSlack/メール通知
- 週次/月次レポート自動生成
- ダッシュボードウィジェット

### 12.3 外部連携
- Google My Business API連携
- 各ポータルサイトAPI連携（利用可能な場合）

---

## 付録

### A. サポート対象サイト（初期）

| サイト名 | 検索対応 | パーサー | 修正依頼対応 |
|---------|---------|---------|-------------|
| Google ビジネスプロフィール | ✓ | ✓ | ✓ |
| Yahoo! プレイス | ✓ | ✓ | ✓ |
| EPARK歯科 | ✓ | ✓ | ✓ |
| デンターネット | ✓ | ✓ | ✓ |
| 歯科タウン | ✓ | ✓ | ✓ |
| デンタルブック | ✓ | ✓ | ✓ |
| Facebook | △ | △ | ✓ |
| Instagram | △ | △ | ✓ |

### B. ステータス遷移図

```
                    ┌─────────────┐
                    │   pending   │
                    └──────┬──────┘
                           │ 検証実行
                           ▼
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ verified │    │ mismatch │    │ notFound │
    │  (一致)   │    │  (不一致) │    │  (未発見) │
    └──────────┘    └────┬─────┘    └──────────┘
                         │
                         │ 修正依頼作成
                         ▼
                  ┌──────────────┐
                  │ CorrectionRequest │
                  │   (修正依頼)       │
                  └──────────────┘
```

---

**作成日**: 2024年1月
**バージョン**: 1.0
**作成者**: Claude Code
