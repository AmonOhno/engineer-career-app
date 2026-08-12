/**
 * スキルシートの Markdown 生成。
 * SES / エージェント提出で求められる「技術別レベル + 案件一覧」の形式。
 */

import type { CareerDataset, SkillCategory } from '../../types/career';
import {
  PROJECT_PHASE_LABEL,
  SKILL_CATEGORY_LABEL,
  SKILL_LEVEL_LABEL,
  formatPeriod,
} from '../format';
import { sortProjectsForDocument } from './careerHistory';
import type { DocumentOptions } from './resume';

const CATEGORY_ORDER: SkillCategory[] = [
  'language',
  'framework',
  'database',
  'cloud',
  'infra',
  'data',
  'security',
  'tool',
  'domain',
  'management',
];

export const buildSkillSheetMarkdown = (
  dataset: CareerDataset,
  options: DocumentOptions = {}
): string => {
  const asOf = options.asOf ?? new Date();
  const lines: string[] = [];

  lines.push('# スキルシート');
  lines.push('');
  lines.push(
    `${asOf.getFullYear()}年${asOf.getMonth() + 1}月${asOf.getDate()}日 現在`
  );
  lines.push('');
  lines.push(`氏名: ${dataset.profile?.fullName ?? ''}`);
  if (dataset.profile?.yearsOfExperience != null) {
    lines.push('');
    lines.push(`エンジニア経験年数: ${dataset.profile.yearsOfExperience} 年`);
  }
  lines.push('');

  lines.push('## 技術スキル');
  lines.push('');

  const grouped = new Map<SkillCategory, typeof dataset.skills>();
  dataset.skills.forEach((skill) => {
    const list = grouped.get(skill.category) ?? [];
    list.push(skill);
    grouped.set(skill.category, list);
  });

  if (dataset.skills.length === 0) {
    lines.push('（未入力）');
    lines.push('');
  }

  CATEGORY_ORDER.forEach((category) => {
    const skills = grouped.get(category);
    if (!skills || skills.length === 0) return;

    lines.push(`### ${SKILL_CATEGORY_LABEL[category]}`);
    lines.push('');
    lines.push('| 技術 | レベル | 経験年数 | 最終使用 | 備考 |');
    lines.push('| --- | --- | --- | --- | --- |');
    [...skills]
      .sort((a, b) => b.level - a.level)
      .forEach((skill) => {
        lines.push(
          `| ${skill.name}${skill.isCore ? ' ★' : ''} | ${
            SKILL_LEVEL_LABEL[skill.level] ?? skill.level
          } | ${
            skill.yearsOfExperience != null ? `${skill.yearsOfExperience} 年` : '—'
          } | ${skill.lastUsedOn ?? '—'} | ${skill.note} |`
        );
      });
    lines.push('');
  });

  lines.push('## 担当案件');
  lines.push('');
  if (dataset.projects.length === 0) {
    lines.push('（未入力）');
    lines.push('');
  } else {
    lines.push('| 期間 | 案件名 | 役割 | 規模 | 使用技術 | 担当工程 |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    sortProjectsForDocument(dataset.projects).forEach((project) => {
      lines.push(
        `| ${formatPeriod(project.startedOn, project.endedOn)} | ${project.name} | ${
          project.role
        } | ${project.teamSize != null ? `${project.teamSize} 名` : '—'} | ${project.techStack.join(
          ', '
        )} | ${project.phases.map((phase) => PROJECT_PHASE_LABEL[phase]).join(' / ')} |`
      );
    });
    lines.push('');
  }

  return lines.join('\n');
};
