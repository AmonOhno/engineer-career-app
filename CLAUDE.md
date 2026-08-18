# CLAUDE.md

Claude Code / AI エージェントがこのリポジトリで作業するときの前提。人間の開発者にも同じ規約が適用される。

## 最優先の規約

**すべての修正は GitHub issue 駆動で行い、Pull Request 経由でのみ main に入れる。**

1. 作業前に issue を立てる（ドキュメントの誤字修正であっても例外なし）
2. main から `<種別>/<issue番号>-<要約>` のブランチを切る
3. 実装し、`npm run typecheck` / `npm test` / `npm run build` を通す
4. `Closes #<issue番号>` を含む PR を作る
5. マージは PR 経由のみ。main への直接 push はしない

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を読むこと。

## プロジェクト概要

Career Compass — エンジニア転職で年収 1000 万円到達を目指すための、現在地・希望条件・応募状況の管理と
応募書類の自動生成を行う Web アプリ。React 18 / TypeScript / Vite / Zustand / Supabase / Jest。

## よく使うコマンド

```bash
npm install
npm run dev         # http://localhost:3100
npm run typecheck   # 型検査
npm test            # ドメインロジックの単体テスト
npm run build       # 型検査 + 本番ビルド
```

## 設計上の約束

- `src/lib/` は純粋関数。DB・React・`new Date()` に依存させない（基準日は引数で受ける）
- DB アクセスは `src/stores/` のストア経由のみ。ミューテーション後は該当リソースの `fetchXxx` だけを呼ぶ
- DB 境界では必ず `toCamelCase` / `toSnakeCase` を通す（DB は snake_case、フロントは camelCase）
- ID はクライアント側で `<prefix>_<uuid>` 形式を発行する（`src/lib/ids.ts`）
- スコアリングの重み・閾値は `src/lib/marketValue.ts` の定数に集約する
- テーブル定義の変更は `supabase/migrations/` に**新しいファイルを追加**する。既存マイグレーションは書き換えない
- 全テーブルで RLS を有効化し、`auth.uid() = user_id` の行だけを参照・更新する
- ドメインロジックを足したら `src/lib/__tests__/` にテストを足す

## 触るときに注意する場所

| 対象 | 注意点 |
|------|--------|
| `src/types/career.ts` | 型定義のみ。ロジックは置かない |
| `src/stores/careerStore.ts` | 全件再取得の関数は作らない |
| `src/lib/documents/` | HTML 変換では入力を必ずエスケープする |
| `src/lib/supabase.ts` | 接続情報を `console.log` に出さない（設定済みか否かのみ） |
