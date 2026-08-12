/**
 * 書類生成に必要な項目が揃っているかの判定。
 * 「生成ボタンを押す前に何が足りないか」を UI に出すために使う。
 *
 * 純粋関数のみ。
 */

import type { CareerDataset, DocumentKind } from '../types/career';

export interface CompletenessItem {
  label: string;
  filled: boolean;
  /** 必須項目。未入力だと書類として成立しない。 */
  required: boolean;
  /** 未入力時に飛ばす先のタブ ID。 */
  section: string;
}

export interface CompletenessResult {
  /** 0〜100。必須項目のみで算出する。 */
  score: number;
  items: CompletenessItem[];
  missingRequired: CompletenessItem[];
  /** 必須項目がすべて埋まっているか。 */
  ready: boolean;
}

const notEmpty = (value: string | null | undefined): boolean =>
  (value ?? '').trim().length > 0;

const RESUME_SECTION = 'profile';

/** 書類種別ごとの必要項目を組み立てる。 */
const buildItems = (
  dataset: CareerDataset,
  kind: DocumentKind
): CompletenessItem[] => {
  const profile = dataset.profile;
  const common: CompletenessItem[] = [
    {
      label: '氏名',
      filled: notEmpty(profile?.fullName),
      required: true,
      section: RESUME_SECTION,
    },
    {
      label: 'フリガナ',
      filled: notEmpty(profile?.fullNameKana),
      required: kind === 'resume',
      section: RESUME_SECTION,
    },
    {
      label: '連絡先（メール）',
      filled: notEmpty(profile?.email),
      required: true,
      section: RESUME_SECTION,
    },
  ];

  if (kind === 'resume') {
    return [
      ...common,
      {
        label: '生年月日',
        filled: notEmpty(profile?.birthDate),
        required: true,
        section: RESUME_SECTION,
      },
      {
        label: '住所',
        filled: notEmpty(profile?.address),
        required: true,
        section: RESUME_SECTION,
      },
      {
        label: '電話番号',
        filled: notEmpty(profile?.phone),
        required: false,
        section: RESUME_SECTION,
      },
      {
        label: '学歴',
        filled: dataset.educations.length > 0,
        required: true,
        section: 'education',
      },
      {
        label: '職歴',
        filled: dataset.experiences.length > 0,
        required: true,
        section: 'experience',
      },
      {
        label: '免許・資格',
        filled: dataset.certifications.length > 0,
        required: false,
        section: 'education',
      },
      {
        label: '志望動機・自己PR',
        filled: dataset.highlights.some(
          (h) => h.kind === 'self_pr' || h.kind === 'motivation'
        ),
        required: true,
        section: 'highlights',
      },
      {
        label: '本人希望記入欄（希望条件）',
        filled: dataset.preference != null,
        required: false,
        section: 'preferences',
      },
    ];
  }

  if (kind === 'career_history') {
    return [
      ...common,
      {
        label: '職務要約',
        filled: dataset.highlights.some((h) => h.kind === 'summary'),
        required: true,
        section: 'highlights',
      },
      {
        label: '職歴（1 社以上）',
        filled: dataset.experiences.length > 0,
        required: true,
        section: 'experience',
      },
      {
        label: 'プロジェクト（3 件以上推奨）',
        filled: dataset.projects.length >= 3,
        required: false,
        section: 'experience',
      },
      {
        label: 'プロジェクトの成果記載',
        filled: dataset.projects.some((p) => notEmpty(p.result)),
        required: true,
        section: 'experience',
      },
      {
        label: '活かせる経験・知識・技術',
        filled: dataset.highlights.some((h) => h.kind === 'strength'),
        required: false,
        section: 'highlights',
      },
      {
        label: '自己PR',
        filled: dataset.highlights.some((h) => h.kind === 'self_pr'),
        required: true,
        section: 'highlights',
      },
      {
        label: 'スキル（5 件以上推奨）',
        filled: dataset.skills.length >= 5,
        required: false,
        section: 'skills',
      },
    ];
  }

  // skill_sheet
  return [
    ...common,
    {
      label: 'スキル（5 件以上）',
      filled: dataset.skills.length >= 5,
      required: true,
      section: 'skills',
    },
    {
      label: 'スキルのレベル設定',
      filled: dataset.skills.every((s) => s.level >= 1),
      required: true,
      section: 'skills',
    },
    {
      label: 'プロジェクト（技術スタック付き）',
      filled: dataset.projects.some((p) => p.techStack.length > 0),
      required: true,
      section: 'experience',
    },
  ];
};

export const evaluateCompleteness = (
  dataset: CareerDataset,
  kind: DocumentKind
): CompletenessResult => {
  const items = buildItems(dataset, kind);
  const required = items.filter((item) => item.required);
  const filledRequired = required.filter((item) => item.filled);
  const missingRequired = required.filter((item) => !item.filled);

  return {
    score:
      required.length === 0
        ? 100
        : Math.round((filledRequired.length / required.length) * 100),
    items,
    missingRequired,
    ready: missingRequired.length === 0,
  };
};

/** 全書類をまたいだ充足度（ダッシュボード表示用）。 */
export const evaluateOverallCompleteness = (
  dataset: CareerDataset
): CompletenessResult => {
  const kinds: DocumentKind[] = ['resume', 'career_history', 'skill_sheet'];
  const results = kinds.map((kind) => evaluateCompleteness(dataset, kind));
  const items = results.flatMap((result) => result.items);
  const missingRequired = results.flatMap((result) => result.missingRequired);

  // 同じ項目が複数書類で重複するため、ラベルで一意化する
  const uniqueMissing = missingRequired.filter(
    (item, index, all) => all.findIndex((x) => x.label === item.label) === index
  );

  const requiredCount = results.reduce(
    (sum, result) => sum + result.items.filter((i) => i.required).length,
    0
  );
  const filledCount = results.reduce(
    (sum, result) =>
      sum + result.items.filter((i) => i.required && i.filled).length,
    0
  );

  return {
    score: requiredCount === 0 ? 100 : Math.round((filledCount / requiredCount) * 100),
    items,
    missingRequired: uniqueMissing,
    ready: uniqueMissing.length === 0,
  };
};
