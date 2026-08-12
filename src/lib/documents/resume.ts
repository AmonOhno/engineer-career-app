/**
 * 履歴書（JIS 様式に準じた項目）の Markdown 生成。
 *
 * 純粋関数。入力は登録済みデータのみで、生成時刻などの外部状態は引数で受ける。
 */

import type { CareerApplication, CareerDataset } from '../../types/career';
import {
  REMOTE_PREFERENCE_LABEL,
  formatJapaneseDate,
  formatYearMonth,
} from '../format';
import { buildEducationRows, buildExperienceRows } from './chronology';
import type { ChronologyRow } from './chronology';

export interface DocumentOptions {
  /** 書類作成日。既定は生成日。 */
  asOf?: Date;
  /** 応募先。指定すると志望動機・本人希望記入欄を応募先向けに補正する。 */
  application?: CareerApplication | null;
}

/** 基準日時点の満年齢。 */
export const calculateAge = (
  birthDate: string | null | undefined,
  asOf: Date
): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDiff = asOf.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

const formatDateForHeader = (date: Date): string => {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
  return formatJapaneseDate(iso);
};

const renderChronologyTable = (
  educationRows: ChronologyRow[],
  experienceRows: ChronologyRow[]
): string => {
  const lines = ['| 年 | 月 | 学歴・職歴 |', '| --- | --- | --- |'];

  const push = (rows: ChronologyRow[], heading?: string) => {
    if (rows.length === 0) return;
    if (heading) lines.push(`|  |  | **${heading}** |`);
    rows.forEach((row) => {
      lines.push(`| ${row.year ?? ''} | ${row.month ?? ''} | ${row.text} |`);
    });
  };

  push(educationRows, '学歴');
  push(experienceRows, '職歴');
  lines.push('|  |  | 以上 |');

  return lines.join('\n');
};

/** 本人希望記入欄。希望条件から機械的に文章化する。 */
export const buildWishSection = (dataset: CareerDataset): string => {
  const preference = dataset.preference;
  if (!preference) {
    return '貴社規定に従います。';
  }

  const parts: string[] = [];

  if (preference.desiredJobTitles.length > 0) {
    parts.push(`希望職種: ${preference.desiredJobTitles.join(' / ')}`);
  }
  if (preference.incomeFloor != null || preference.desiredIncomeMin != null) {
    const amount = preference.desiredIncomeMin ?? preference.incomeFloor;
    if (amount != null) {
      parts.push(`希望年収: ${Math.round(amount / 10_000).toLocaleString('ja-JP')} 万円以上`);
    }
  }
  if (preference.desiredLocations.length > 0) {
    parts.push(`希望勤務地: ${preference.desiredLocations.join(' / ')}`);
  }
  if (preference.remotePreference !== 'any') {
    parts.push(`勤務形態: ${REMOTE_PREFERENCE_LABEL[preference.remotePreference]}希望`);
  }
  if (preference.mustHaveConditions.length > 0) {
    parts.push(`その他条件: ${preference.mustHaveConditions.join(' / ')}`);
  }

  if (parts.length === 0) return '貴社規定に従います。';
  parts.push('上記以外は貴社規定に従います。');
  return parts.join('\n');
};

const findHighlight = (
  dataset: CareerDataset,
  kind: 'self_pr' | 'motivation'
): string => {
  const candidates = dataset.highlights.filter((h) => h.kind === kind);
  const chosen = candidates.find((h) => h.isDefault) ?? candidates[0];
  return chosen?.body ?? '';
};

/** 履歴書の Markdown を生成する。 */
export const buildResumeMarkdown = (
  dataset: CareerDataset,
  options: DocumentOptions = {}
): string => {
  const asOf = options.asOf ?? new Date();
  const profile = dataset.profile;
  const age = calculateAge(profile?.birthDate, asOf);

  const lines: string[] = [];
  lines.push('# 履歴書');
  lines.push('');
  lines.push(`作成日: ${formatDateForHeader(asOf)}`);
  if (options.application?.companyName) {
    lines.push('');
    lines.push(`提出先: ${options.application.companyName} 御中`);
  }
  lines.push('');

  lines.push('## 基本情報');
  lines.push('');
  lines.push('| 項目 | 内容 |');
  lines.push('| --- | --- |');
  lines.push(`| ふりがな | ${profile?.fullNameKana ?? ''} |`);
  lines.push(`| 氏名 | ${profile?.fullName ?? ''} |`);
  lines.push(
    `| 生年月日 | ${formatJapaneseDate(profile?.birthDate)}${
      age != null ? `（満 ${age} 歳）` : ''
    } |`
  );
  if (profile?.gender) lines.push(`| 性別 | ${profile.gender} |`);
  lines.push(
    `| 現住所 | ${[profile?.postalCode, profile?.address]
      .filter((part) => (part ?? '').trim().length > 0)
      .join(' ')} |`
  );
  if (profile?.nearestStation) {
    lines.push(`| 最寄駅 | ${profile.nearestStation} |`);
  }
  lines.push(`| 電話番号 | ${profile?.phone ?? ''} |`);
  lines.push(`| メールアドレス | ${profile?.email ?? ''} |`);

  const links = [
    profile?.githubUrl && `GitHub: ${profile.githubUrl}`,
    profile?.portfolioUrl && `ポートフォリオ: ${profile.portfolioUrl}`,
    profile?.blogUrl && `技術ブログ: ${profile.blogUrl}`,
    profile?.linkedinUrl && `LinkedIn: ${profile.linkedinUrl}`,
  ].filter((value): value is string => Boolean(value));
  if (links.length > 0) {
    lines.push(`| 関連リンク | ${links.join('<br>')} |`);
  }
  lines.push('');

  lines.push('## 学歴・職歴');
  lines.push('');
  lines.push(
    renderChronologyTable(
      buildEducationRows(dataset.educations),
      buildExperienceRows(dataset.experiences)
    )
  );
  lines.push('');

  lines.push('## 免許・資格');
  lines.push('');
  if (dataset.certifications.length === 0) {
    lines.push('特になし');
  } else {
    lines.push('| 年月 | 名称 |');
    lines.push('| --- | --- |');
    [...dataset.certifications]
      .sort((a, b) => (a.acquiredOn ?? '').localeCompare(b.acquiredOn ?? ''))
      .forEach((certification) => {
        const name = [certification.name, certification.score]
          .filter((part) => part.trim().length > 0)
          .join(' ');
        lines.push(`| ${formatYearMonth(certification.acquiredOn)} | ${name} |`);
      });
  }
  lines.push('');

  lines.push('## 志望の動機・自己PR');
  lines.push('');
  const motivation = findHighlight(dataset, 'motivation');
  const selfPr = findHighlight(dataset, 'self_pr');
  if (motivation) {
    lines.push(motivation);
    lines.push('');
  }
  if (selfPr) {
    lines.push(selfPr);
    lines.push('');
  }
  if (!motivation && !selfPr) {
    lines.push('（未入力）');
    lines.push('');
  }

  lines.push('## 本人希望記入欄');
  lines.push('');
  lines.push(buildWishSection(dataset));
  lines.push('');

  return lines.join('\n');
};
