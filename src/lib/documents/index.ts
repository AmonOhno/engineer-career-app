/** 書類生成のエントリーポイント。 */

import type { CareerDataset, DocumentKind } from '../../types/career';
import { buildCareerHistoryMarkdown } from './careerHistory';
import { buildResumeMarkdown } from './resume';
import type { DocumentOptions } from './resume';
import { buildSkillSheetMarkdown } from './skillSheet';

export { buildResumeMarkdown, calculateAge, buildWishSection } from './resume';
export type { DocumentOptions } from './resume';
export { buildCareerHistoryMarkdown } from './careerHistory';
export { buildSkillSheetMarkdown } from './skillSheet';
export { markdownToHtml, buildPrintableHtml } from './html';

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  resume: '履歴書',
  career_history: '職務経歴書',
  skill_sheet: 'スキルシート',
};

export interface GeneratedDocument {
  kind: DocumentKind;
  title: string;
  markdown: string;
}

/** 種別に応じた書類の Markdown を生成する。 */
export const generateDocument = (
  kind: DocumentKind,
  dataset: CareerDataset,
  options: DocumentOptions = {}
): GeneratedDocument => {
  const name = dataset.profile?.fullName ?? '';
  const company = options.application?.companyName ?? '';
  const title = [DOCUMENT_KIND_LABEL[kind], name, company]
    .filter((part) => part.length > 0)
    .join('_');

  const markdown =
    kind === 'resume'
      ? buildResumeMarkdown(dataset, options)
      : kind === 'career_history'
        ? buildCareerHistoryMarkdown(dataset, options)
        : buildSkillSheetMarkdown(dataset, options);

  return { kind, title, markdown };
};
