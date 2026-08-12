/**
 * Supabase（PostgREST / PostgreSQL）から返るエラーを、利用者向けの原因説明に変換する。
 *
 * 「保存に失敗しました」だけでは、マイグレーション未適用なのか権限不足なのか制約違反なのかを
 * 切り分けられない。エラーコードごとに原因を 1 文で言い当てるための共通処理。
 */

/** Supabase のエラーオブジェクト（`PostgrestError`）と、素の `Error` の共通部分 */
interface SupabaseErrorLike {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/** fetch 自体が失敗したときに supabase-js が詰めるメッセージ（ブラウザごとに文言が異なる） */
const NETWORK_MESSAGE_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /network request failed/i,
  /load failed/i,
];

const NETWORK_CAUSE = '通信に失敗しました。通信環境を確認してもう一度お試しください。';

/**
 * スキーマがリモート DB へ未適用のときに返るコード。
 * PGRST202/PGRST205/PGRST200 は PostgREST のスキーマキャッシュ由来、
 * 42883/42P01 は Postgres 本体由来。
 */
const MIGRATION_CAUSE =
  'サーバー側にテーブルまたは関数がありません。DB のマイグレーションが未適用の可能性があります。';

/** エラーコードごとの利用者向け説明。ここに無いコードはサーバーのメッセージをそのまま見せる */
const CAUSE_BY_CODE: Record<string, string> = {
  PGRST202: MIGRATION_CAUSE, // RPC 関数がスキーマキャッシュに無い
  PGRST205: MIGRATION_CAUSE, // テーブルがスキーマキャッシュに無い
  PGRST200: MIGRATION_CAUSE, // 埋め込み取得の関連（外部キー）が見つからない
  '42883': MIGRATION_CAUSE, // undefined_function
  '42P01': MIGRATION_CAUSE, // undefined_table
  PGRST301: '認証の有効期限が切れています。再ログインしてください。',
  '42501': 'この操作を行う権限がありません。再ログインしてください。',
  '23503': '紐づけ先（職歴・応募先）が見つかりません。画面を再読み込みしてから設定し直してください。',
  '23505': '同じ内容が既に登録されています。',
  '23514': '入力値がサーバー側の制約を満たしていません。',
};

const toErrorLike = (error: unknown): SupabaseErrorLike => {
  if (typeof error === 'object' && error !== null) return error as SupabaseErrorLike;
  return { message: String(error ?? '') };
};

/** fetch 到達前・通信断によるエラーか */
export const isNetworkError = (error: unknown): boolean => {
  const message = toErrorLike(error).message ?? '';
  return NETWORK_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
};

/**
 * エラーの原因を 1 文で説明する。UI では「〜に失敗しました。」に続けて表示する想定。
 * 既知のコードは日本語の説明に、未知のコードはサーバーのメッセージにコードを添えて返す。
 */
export const describeSupabaseError = (error: unknown): string => {
  if (isNetworkError(error)) return NETWORK_CAUSE;

  const { code, message } = toErrorLike(error);
  const known = code ? CAUSE_BY_CODE[code] : undefined;
  if (known) return `${known}（${code}）`;
  if (message) return code ? `${message}（${code}）` : message;
  return '原因不明のエラーが発生しました。時間をおいて再度お試しください。';
};
