# 開発規約

本リポジトリの変更は **すべて GitHub issue 起点で行い、Pull Request 経由でのみ main に入れる**。
「小さい修正だから直接 main へ」は認めない。変更の理由が追えなくなるため。

## 1. 基本フロー

```
issue を立てる → ブランチを切る → 実装 → PR を作る → レビュー → マージ → issue クローズ
```

| 手順 | 内容 |
|------|------|
| 1. issue | 直す対象・理由・完了条件を書く。テンプレート（バグ報告 / 機能要望）を使う |
| 2. ブランチ | main から切る。命名規則は下記 |
| 3. 実装 | 1 issue = 1 つの関心事。関係ない修正を混ぜない |
| 4. PR | `Closes #<issue番号>` で issue を紐づける。テンプレートを埋める |
| 5. チェック | `npm run typecheck` / `npm test` / `npm run build` がすべて通ること |
| 6. マージ | PR 経由のみ。マージすると issue は自動でクローズされる |

### 例外

無い。ドキュメントの誤字修正であっても issue と PR を作る。
緊急のホットフィックスも同じで、事後ではなく着手前に issue を立てる。

## 2. issue の書き方

- **タイトル**は「何をどうするか」を動詞で終える（例: 「タブ切り替えで入力内容が消えないようにする」）
- **本文**には最低限、次を書く
  - 背景 / 現状の問題（バグなら再現手順と期待する挙動）
  - やること（チェックリスト）
  - 完了条件
- ラベルで種別を示す（`bug` / `enhancement` / `documentation` / `refactor`）

## 3. ブランチ命名規則

```
<種別>/<issue番号>-<英小文字の要約>
```

| 種別 | 用途 |
|------|------|
| `feat` | 機能追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみ |
| `refactor` | 挙動を変えない内部改善 |
| `chore` | 依存更新・設定変更 |

例: `fix/12-keep-form-input-across-tabs`

## 4. コミットメッセージ

Conventional Commits に従い、本文末尾に issue 番号を書く。

```
fix: タブ切り替え後も入力中のフォームを保持する

タブごとにパネルがアンマウントされ、ローカル state が破棄されていた。
下書きストア経由で保持するように変更した。

Refs #12
```

- 1 行目は 72 文字以内、日本語で可
- `feat` / `fix` / `docs` / `refactor` / `test` / `chore` を使う

## 5. Pull Request

- タイトルはコミットメッセージ 1 行目と同じ粒度で書く
- 本文は `.github/pull_request_template.md` の項目を埋める
- **必ず `Closes #<issue番号>` を含める**（複数 issue なら行を分けて書く）
- 差分が大きくなったら issue から分割する。目安は 400 行
- レビュー指摘は PR 上で解決し、`git push --force` での履歴改変は原則行わない

### マージ前チェック

```bash
npm run typecheck   # 型検査
npm test            # ドメインロジックの単体テスト
npm run build       # 型検査 + 本番ビルド
```

いずれも PR を出した時点で GitHub Actions（`.github/workflows/ci.yml`）が自動で実行する。
**いずれかが落ちている PR はマージしない。**

main へマージされると `.github/workflows/deploy.yml` が Cloudflare Pages へ配信する。
デプロイ周りの設定は [docs/deployment.md](docs/deployment.md) を参照。

## 6. 実装上の約束

コードの設計方針は [README.md の「設計上の約束」](README.md#設計上の約束) と
[docs/specification.md](docs/specification.md) に従う。要点のみ再掲する。

- `src/lib/` は純粋関数。DB・React・`new Date()` に依存させない
- DB アクセスはストア（`src/stores/`）経由のみ
- DB 境界では必ず `toCamelCase` / `toSnakeCase` を通す
- ID はクライアント側で `<prefix>_<uuid>` 形式を発行する
- テーブル定義の変更は `supabase/migrations/` にマイグレーションを追加する
  （既存ファイルは書き換えない）
- ドメインロジックを追加・変更したら `src/lib/__tests__/` にテストを足す
