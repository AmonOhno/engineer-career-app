# デプロイ手順（Cloudflare Pages）

Career Compass は Supabase をバックエンドに使う純粋な静的 SPA なので、
配信は **Cloudflare Pages の無料プラン**だけで完結する。サーバーサイドの処理は持たない。

ビルドは GitHub Actions で行い、成果物（`dist/`）だけを Cloudflare へ
**Direct Upload** する。Cloudflare 側にリポジトリを接続してビルドさせる方式は使わない。

```
main へマージ
  └─ .github/workflows/ci.yml      typecheck / test / build（PR でも実行）
  └─ .github/workflows/deploy.yml  build → wrangler pages deploy dist
                                     └─ Cloudflare Pages（本番）
```

## 1. Cloudflare 側の準備

### 1-1. Pages プロジェクトを作る

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログインする（無料アカウントで可）
2. **Workers & Pages → Create → Pages → Upload assets** を選ぶ
   （Git 連携は選ばない。ビルドは GitHub Actions 側で行うため）
3. プロジェクト名を決める（例: `career-compass`）。この名前が
   `https://<プロジェクト名>.pages.dev` になる
4. 空のままで良いので一度作成する。以降のアップロードは Actions が行う

作成後、**Settings → Builds & deployments → Production branch** が `main` に
なっていることを確認する。ここが `main` でないと、Actions からのデプロイが
プレビュー扱いになり本番 URL に反映されない。

### 1-2. Account ID を控える

Workers & Pages の画面右側、または URL の
`https://dash.cloudflare.com/<Account ID>/...` の部分が Account ID。

### 1-3. API トークンを作る

**My Profile → API Tokens → Create Token → Create Custom Token** で作る。

| 項目 | 設定値 |
|------|--------|
| Permissions | `Account` / `Cloudflare Pages` / **Edit** |
| Account Resources | 対象のアカウントのみ |
| TTL | 任意（無期限で運用するなら未設定） |

**"Edit Cloudflare Workers" テンプレートは使わない**。必要以上に広い権限が付く。
生成されたトークンは再表示できないので、その場で次の手順に進む。

## 2. GitHub 側の設定

リポジトリの **Settings → Secrets and variables → Actions** で登録する。

### Secrets（値が秘匿されるもの）

| 名前 | 内容 | 取得元 |
|------|------|--------|
| `CLOUDFLARE_API_TOKEN` | 1-3 で作ったトークン | Cloudflare |
| `CLOUDFLARE_ACCOUNT_ID` | 1-2 の Account ID | Cloudflare |
| `VITE_SUPABASE_URL` | Supabase の Project URL | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase の anon key | Supabase → Settings → API |

### Variables（秘匿不要なもの）

| 名前 | 内容 |
|------|------|
| `CF_PAGES_PROJECT_NAME` | 1-1 で決めた Pages プロジェクト名（例: `career-compass`） |

いずれかが未設定の場合、`deploy.yml` は**ビルド前に**エラーで止まる。
接続情報が欠けたバンドル（開いた瞬間に落ちる）を本番へ上げないための作りにしてある。

> `VITE_` 付きの値はビルド時にバンドルへ埋め込まれるため、配信物からは読み取れる。
> anon key はもともと公開前提のキーなので問題ないが、**service role key は絶対に置かない**。
> データの保護は Supabase 側の RLS（`auth.uid() = user_id`）で担保している。

## 3. Supabase 側の設定

Cloudflare のドメインから認証できるように、Supabase の
**Authentication → URL Configuration** に本番 URL を登録する。

- **Site URL**: `https://<プロジェクト名>.pages.dev`
- **Redirect URLs**: `https://<プロジェクト名>.pages.dev/**`

ここを設定しないと、メールリンクや OAuth のコールバックが `localhost` に戻ってしまう。

## 4. デプロイする

`main` に PR をマージすると自動でデプロイされる。手動で流したい場合は
**Actions → Deploy to Cloudflare Pages → Run workflow**。

デプロイ先の URL は、ジョブの Summary に出力される。

### デプロイが走る条件

配信物に影響する変更（`src/`・`public/`・`index.html`・ビルド設定・依存）が
`main` に入ったときだけ実行する。README だけの修正ではデプロイしない
（無料枠のデプロイ回数を消費しないため）。

## 5. 無料枠について

この構成は、以下の無料枠の中に収まるように組んである。

| サービス | 無料枠 | この構成での使い方 |
|----------|--------|--------------------|
| Cloudflare Pages | 帯域・リクエスト無制限 / **500 デプロイ・月** / 1 サイト 20,000 ファイル・1 ファイル 25 MiB | main へのマージ時のみデプロイ。ビルド成果物は 4 ファイル・最大 0.5 MB 程度 |
| Cloudflare Pages Functions | — | **使っていない**（純粋な静的配信のみ。課金対象の Workers リクエストが発生しない） |
| GitHub Actions | public リポジトリは無制限 / private は 2,000 分・月 | 1 回 2〜3 分程度。同一 ref の古い実行は自動キャンセル |
| Supabase | Free プラン | 従来どおり（この変更では触れていない） |

無料枠を保つための約束事:

- **Cloudflare 側のビルド（Git 連携）を有効にしない**。有効にすると Actions と
  二重にデプロイが走り、500 回/月を倍の速さで消費する
- PR ごとのプレビューデプロイは**あえて入れていない**。欲しくなった場合は
  `deploy.yml` を複製し、`--branch=${{ github.head_ref }}` を渡す形にすると
  プレビュー扱いになる（そのぶんデプロイ回数を消費する点に注意）
- Pages Functions（`functions/` ディレクトリ）や KV / D1 を足すと課金対象の
  リソースに触れる。追加するときは各サービスの無料枠を確認する

## 6. 運用メモ

### wrangler のバージョンを上げる

`deploy.yml` の `wranglerVersion` でメジャーバージョンを固定している。
上げるときは値を変更した PR を出し、CI が通ることと実際のデプロイが成功することを確認する。

### ロールバックする

Cloudflare ダッシュボードの **Workers & Pages → 対象プロジェクト → Deployments** から
過去のデプロイを選び **Rollback** する。コード側を直す場合は通常どおり
issue → PR の流れで修正し、main へマージし直す。

### よくある失敗

| 症状 | 原因と対処 |
|------|-----------|
| デプロイは成功するが画面が真っ白 | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` の設定漏れ。設定後に再デプロイする（ビルド時に埋め込まれるため、Secrets を直しただけでは反映されない） |
| ログインリンクが `localhost` に飛ぶ | 手順 3 の Site URL / Redirect URLs が未設定 |
| `Project not found` | `CF_PAGES_PROJECT_NAME` の綴り違い、またはトークンのアカウントが違う |
| 本番 URL に反映されない | Pages プロジェクトの Production branch が `main` になっていない |
