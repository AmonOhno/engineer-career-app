# Career Compass

エンジニア転職で **年収 1000 万円** に到達するための、現在地・希望条件・応募状況の管理と
応募書類の自動生成を行う Web アプリ。

「情報を貯めるだけ」で終わらせず、目標年収との差をどう埋めるかまで踏み込むことを狙いにしている。

## できること

| 画面 | 内容 |
|------|------|
| ダッシュボード | 年収ギャップ、1000 万円レンジ到達力スコア（6 軸）、応募パイプライン、書類の充足度、年収交渉の下書き |
| プロフィール | 氏名・生年月日・連絡先などの履歴書項目、現年収 / 目標年収、GitHub 等の公開リンク |
| スキル | 分類・レベル（1〜5）・実務年数・最終使用年月・主力フラグ |
| 職歴・案件 | 会社単位の職歴（在籍期間・役職・年収）と、プロジェクト（課題 → 施策 → 成果 + 定量成果） |
| 学歴・資格 | 履歴書の年表欄・免許資格欄に転記される情報 |
| 自己PR | 職務要約 / 自己PR / 志望動機 / 強み / キャリアプラン。登録データから下書きを自動生成できる |
| 希望条件 | 業務内容（職種・業界・技術・工程）と業務内容以外（年収・勤務地・リモート・休日）を分けて管理。福利厚生とみなし残業はマスタから選んで登録する |
| 応募管理 | 選考ステータス、提示レンジ、オファー年収、希望条件とのマッチ度と未充足条件の警告 |
| 書類生成 | 履歴書 / 職務経歴書 / スキルシートを自動生成し、Markdown・HTML・印刷（PDF 保存）で出力 |

### 目標達成のための計算

- **年収ギャップ** — 目標との差額・到達率・必要な上げ幅に加え、1 回 +15% / +30% の
  上げ幅で到達するのに必要な転職回数を算出する
- **1000 万円レンジ到達力** — スキル深度 / 高単価ドメインのカバー / リード実績 /
  成果の定量化 / 外部可視性 / スキル鮮度の 6 軸を採点し、伸びしろの大きい打ち手を提示する
- **マッチ度** — 応募先と希望条件を突き合わせ、最低ライン割れ・避けたい技術・
  絶対条件の欠落を警告する。福利厚生はマスタのコードで突き合わせ、みなし残業は
  時間数が許容上限を超えていないかまで見る

## セットアップ

### 1. 依存インストール

```bash
npm install
```

### 2. Supabase の準備

Supabase プロジェクトを用意し、`supabase/migrations/` のマイグレーションを適用する。

```bash
# Supabase CLI を使う場合
supabase link --project-ref <your-project-ref>
supabase db push
```

CLI を使わない場合は、`supabase/migrations/` の SQL をファイル名の順に
Supabase ダッシュボードの SQL Editor で実行する。

認証は Supabase Auth を使う（メール / Google / GitHub）。使うプロバイダは
Supabase 側の Authentication 設定で有効にしておく。

### 3. 環境変数

`.env.example` をコピーして `.env` を作り、接続情報を入れる。

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

`.env` は `.gitignore` 済み。anon key は公開前提のキーだが、リポジトリには入れない。

### 4. 起動

```bash
npm run dev      # http://localhost:3100
```

## 開発

**このリポジトリの修正はすべて GitHub issue 起点で行い、Pull Request 経由でのみ main に入れる。**
手順は [CONTRIBUTING.md](CONTRIBUTING.md) を参照。


```bash
npm run typecheck   # 型検査
npm test            # ドメインロジック・ストアの単体テスト（103 件）
npm run build       # 型検査 + 本番ビルド
npm run preview     # ビルド結果の確認
```

この 3 つは PR と main への push で GitHub Actions（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）
でも実行される。落ちている PR はマージしない。

## デプロイ

main にマージすると GitHub Actions がビルドし、**Cloudflare Pages** へ配信する
（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)）。
ビルドは Actions 側で行い、成果物だけを Direct Upload するため Cloudflare 側のビルドは使わない。

サーバーサイドの処理を持たない静的 SPA なので、**Cloudflare の無料プランの範囲で運用できる**。

初回に必要な設定（Pages プロジェクト、API トークン、GitHub の Secrets / Variables、
Supabase のリダイレクト URL）と無料枠の考え方は
[docs/deployment.md](docs/deployment.md) にまとめてある。

## 構成

```
.
├── CONTRIBUTING.md          # 開発規約（issue 駆動 → PR → マージ）
├── CLAUDE.md                # AI エージェント向けの前提と規約
├── .github/
│   ├── workflows/ci.yml     # typecheck / test / build
│   ├── workflows/deploy.yml # Cloudflare Pages へのデプロイ
│   └── ...                  # issue / PR テンプレート
├── index.html
├── vite.config.ts
├── public/_redirects        # SPA 用のフォールバック（Cloudflare Pages）
├── src/
│   ├── App.tsx              # タブ切り替え + 認証ゲート + 初回ロード
│   ├── types/career.ts      # 型定義のみ
│   ├── lib/                 # 純粋関数（テスト対象）
│   │   ├── compensation.ts  # 年収ギャップ・必要な転職回数・パイプライン集計
│   │   ├── marketValue.ts   # 1000 万円レンジ到達力の 6 軸スコアリング
│   │   ├── matching.ts      # 応募先 × 希望条件のマッチ度
│   │   ├── completeness.ts  # 書類ごとの必須項目チェック
│   │   ├── drafts.ts        # 自己PR・志望動機・年収交渉の下書き生成
│   │   ├── documents/       # 履歴書・職務経歴書・スキルシートの生成
│   │   ├── masters/         # 福利厚生マスタ・みなし残業の定義と採点
│   │   ├── supabase.ts      # Supabase クライアント + 認証ストア
│   │   ├── caseConvert.ts   # snake_case ↔ camelCase
│   │   ├── supabaseError.ts # エラーコード → 原因説明
│   │   └── download.ts      # ダウンロード・印刷・クリップボード（副作用の集約）
│   ├── stores/
│   │   ├── careerStore.ts   # Supabase 直接アクセス（Zustand）
│   │   └── draftStore.ts    # 入力途中データの保持（タブ切り替え対策）
│   └── components/          # 画面
├── supabase/migrations/     # career_* テーブル定義（RLS 込み）
└── docs/
    ├── specification.md     # 詳細仕様
    └── deployment.md        # Cloudflare Pages へのデプロイ手順
```

## 設計上の約束

- **`lib/` は純粋関数**。DB・React・`new Date()` に依存させない（基準日は引数で受ける）。
  これによりスコアリングと書類生成をテストで固定できる。
- **フォームの state は `useDraftState`（`stores/draftStore.ts`）に置く**。
  タブを切り替えるとパネルはアンマウントされるため、`useState` では入力途中の内容が消える。
- **DB アクセスはストア経由のみ**。ミューテーション後は変更したリソースの `fetchXxx` だけを呼ぶ。
  全件再取得の関数は持たない。
- **ケース変換**は DB 境界で必ず `toCamelCase` / `toSnakeCase` を通す。
- **ID はクライアント側で発行**する（`prof_` / `skill_` / `exp_` / `proj_` / `edu_` /
  `cert_` / `pr_` / `pref_` / `app_` / `doc_`）。
- スコアリングの重み・閾値は `lib/marketValue.ts` の定数に集約する。
- **福利厚生・みなし残業は `lib/masters/` のマスタを正とする**。自由記述はマスタに
  無い項目の補助として残し、比較時はマスタコードへ正規化する。
- 全テーブルで RLS を有効化し、`auth.uid() = user_id` の行だけを参照・更新する。

## セキュリティ

- 接続情報を `console.log` にそのまま出さない（設定済みか否かのみをログに出す）。
- 生成書類の HTML 変換では入力を必ずエスケープし、`<br>` と `**強調**` のみを復元する。

## 技術スタック

React 18 / TypeScript / Vite / Zustand / Supabase（PostgreSQL + Auth + RLS）/ Jest

詳細な仕様は [docs/specification.md](docs/specification.md)、
デプロイ手順は [docs/deployment.md](docs/deployment.md) を参照。
