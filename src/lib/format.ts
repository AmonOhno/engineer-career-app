/** 表示用のフォーマッタ。表示専用でドメインロジックは持たない。 */

import type {
  ApplicationStatus,
  EmploymentType,
  HighlightKind,
  ProjectPhase,
  RemotePreference,
  SkillCategory,
} from '../types/career';

/** 円を「1,050 万円」形式にする。 */
export const formatManYen = (yen: number | null | undefined): string => {
  if (yen == null) return '—';
  const man = yen / 10_000;
  const rounded = Math.round(man * 10) / 10;
  return `${rounded.toLocaleString('ja-JP')} 万円`;
};

export const formatYen = (yen: number | null | undefined): string =>
  yen == null ? '—' : `${yen.toLocaleString('ja-JP')} 円`;

/** YYYY-MM-DD → YYYY年M月。 */
export const formatYearMonth = (date: string | null | undefined): string => {
  if (!date) return '';
  const [y, m] = date.split('-');
  if (!y || !m) return date;
  return `${y}年${Number(m)}月`;
};

/** YYYY-MM-DD → YYYY年M月D日。 */
export const formatJapaneseDate = (date: string | null | undefined): string => {
  if (!date) return '';
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return date;
  return `${y}年${Number(m)}月${Number(d)}日`;
};

/** 在籍期間の表示。終了日が無い場合は「現在」。 */
export const formatPeriod = (
  startedOn: string | null | undefined,
  endedOn: string | null | undefined
): string => {
  const start = formatYearMonth(startedOn);
  const end = endedOn ? formatYearMonth(endedOn) : '現在';
  if (!start) return end === '現在' ? '' : end;
  return `${start} 〜 ${end}`;
};

export const SKILL_CATEGORY_LABEL: Record<SkillCategory, string> = {
  language: '言語',
  framework: 'フレームワーク',
  cloud: 'クラウド',
  database: 'データベース',
  infra: 'インフラ / SRE',
  data: 'データ / ML',
  security: 'セキュリティ',
  tool: 'ツール',
  domain: '業務ドメイン',
  management: 'マネジメント',
};

export const SKILL_LEVEL_LABEL: Record<number, string> = {
  1: '学習中',
  2: '補助ありで実装できる',
  3: '一人で実装できる',
  4: '設計を主導できる',
  5: '他者を指導できる',
};

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: '正社員',
  contract: '契約社員',
  dispatch: '派遣社員',
  freelance: '業務委託 / フリーランス',
  part_time: 'アルバイト',
  internship: 'インターン',
};

export const PROJECT_PHASE_LABEL: Record<ProjectPhase, string> = {
  requirements: '要件定義',
  basic_design: '基本設計',
  detail_design: '詳細設計',
  implementation: '実装',
  test: 'テスト',
  release: 'リリース',
  operation: '運用 / 保守',
  management: 'PM / PL',
};

export const HIGHLIGHT_KIND_LABEL: Record<HighlightKind, string> = {
  summary: '職務要約',
  self_pr: '自己PR',
  motivation: '志望動機',
  strength: '強み / 活かせる経験',
  future: '今後のキャリアプラン',
};

export const REMOTE_PREFERENCE_LABEL: Record<RemotePreference, string> = {
  full_remote: 'フルリモート',
  hybrid: 'ハイブリッド',
  onsite: '出社',
  any: 'こだわらない',
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  wishlist: '気になる',
  applied: '応募済み',
  document_screening: '書類選考中',
  interview_1: '一次面接',
  interview_2: '二次面接',
  interview_final: '最終面接',
  offer: 'オファー',
  accepted: '内定承諾',
  rejected: '見送り',
  declined: '辞退',
};

/** 選考が進行中かどうか。パイプライン集計に使う。 */
export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  'applied',
  'document_screening',
  'interview_1',
  'interview_2',
  'interview_final',
  'offer',
];
