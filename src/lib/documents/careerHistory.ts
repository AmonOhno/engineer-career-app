/**
 * 職務経歴書の Markdown 生成。
 *
 * 構成は転職市場で一般的な順序に合わせる:
 * 職務要約 → 活かせる経験・知識・技術 → 職務経歴詳細（会社→プロジェクト）
 * → 保有スキル → 資格 → 自己PR。
 */

import type {
  CareerDataset,
  CareerExperience,
  CareerProject,
} from '../../types/career';
import {
  EMPLOYMENT_TYPE_LABEL,
  PROJECT_PHASE_LABEL,
  SKILL_CATEGORY_LABEL,
  SKILL_LEVEL_LABEL,
  formatPeriod,
} from '../format';
import type { DocumentOptions } from './resume';

const findHighlightBody = (
  dataset: CareerDataset,
  kind: 'summary' | 'self_pr' | 'strength' | 'future'
): string => {
  const candidates = dataset.highlights.filter((h) => h.kind === kind);
  const chosen = candidates.find((h) => h.isDefault) ?? candidates[0];
  return chosen?.body ?? '';
};

/** 職歴の新しい順。在職中（endedOn が null）を最上位に置く。 */
export const sortExperiencesDesc = (
  experiences: CareerExperience[]
): CareerExperience[] =>
  [...experiences].sort((a, b) => {
    if (!a.endedOn && b.endedOn) return -1;
    if (a.endedOn && !b.endedOn) return 1;
    return (b.startedOn ?? '').localeCompare(a.startedOn ?? '');
  });

/** プロジェクトは主力を先に、その中で新しい順。 */
export const sortProjectsForDocument = (
  projects: CareerProject[]
): CareerProject[] =>
  [...projects].sort((a, b) => {
    if (a.isHighlighted !== b.isHighlighted) return a.isHighlighted ? -1 : 1;
    return (b.startedOn ?? '').localeCompare(a.startedOn ?? '');
  });

const renderProject = (project: CareerProject, lines: string[]): void => {
  lines.push(
    `#### ${project.name}${project.isHighlighted ? ' ★' : ''}（${formatPeriod(
      project.startedOn,
      project.endedOn
    )}）`
  );
  lines.push('');

  const meta: string[] = [];
  if (project.role) meta.push(`役割: ${project.role}`);
  if (project.teamSize != null) meta.push(`チーム規模: ${project.teamSize} 名`);
  if (project.industry) meta.push(`業界: ${project.industry}`);
  if (project.phases.length > 0) {
    meta.push(
      `担当工程: ${project.phases.map((phase) => PROJECT_PHASE_LABEL[phase]).join(' / ')}`
    );
  }
  if (meta.length > 0) {
    lines.push(meta.map((item) => `- ${item}`).join('\n'));
    lines.push('');
  }

  if (project.techStack.length > 0) {
    lines.push(`**使用技術**: ${project.techStack.join(', ')}`);
    lines.push('');
  }
  if (project.overview) {
    lines.push(`**概要**: ${project.overview}`);
    lines.push('');
  }
  if (project.responsibilities) {
    lines.push(`**担当業務**: ${project.responsibilities}`);
    lines.push('');
  }
  if (project.challenge) {
    lines.push(`**課題**: ${project.challenge}`);
    lines.push('');
  }
  if (project.action) {
    lines.push(`**実施施策**: ${project.action}`);
    lines.push('');
  }
  if (project.result || project.impactMetric) {
    const result = [project.result, project.impactMetric]
      .filter((part) => part.trim().length > 0)
      .join(' / ');
    lines.push(`**成果**: ${result}`);
    lines.push('');
  }
};

/** 職務経歴書の Markdown を生成する。 */
export const buildCareerHistoryMarkdown = (
  dataset: CareerDataset,
  options: DocumentOptions = {}
): string => {
  const asOf = options.asOf ?? new Date();
  const profile = dataset.profile;
  const lines: string[] = [];

  lines.push('# 職務経歴書');
  lines.push('');
  lines.push(
    `${asOf.getFullYear()}年${asOf.getMonth() + 1}月${asOf.getDate()}日 現在`
  );
  lines.push('');
  lines.push(`氏名: ${profile?.fullName ?? ''}`);
  if (profile?.headline) {
    lines.push('');
    lines.push(`> ${profile.headline}`);
  }
  lines.push('');

  lines.push('## 職務要約');
  lines.push('');
  lines.push(findHighlightBody(dataset, 'summary') || '（未入力）');
  lines.push('');

  const strength = findHighlightBody(dataset, 'strength');
  const coreSkills = dataset.skills.filter((skill) => skill.isCore);
  if (strength || coreSkills.length > 0) {
    lines.push('## 活かせる経験・知識・技術');
    lines.push('');
    if (strength) {
      lines.push(strength);
      lines.push('');
    }
    coreSkills.forEach((skill) => {
      const years =
        skill.yearsOfExperience != null ? `（実務 ${skill.yearsOfExperience} 年）` : '';
      lines.push(`- ${skill.name}${years}: ${SKILL_LEVEL_LABEL[skill.level] ?? ''}`);
    });
    if (coreSkills.length > 0) lines.push('');
  }

  lines.push('## 職務経歴');
  lines.push('');

  const experiences = sortExperiencesDesc(dataset.experiences);
  const projectsByExperience = new Map<string, CareerProject[]>();
  const unlinkedProjects: CareerProject[] = [];
  dataset.projects.forEach((project) => {
    if (project.experienceId) {
      const list = projectsByExperience.get(project.experienceId) ?? [];
      list.push(project);
      projectsByExperience.set(project.experienceId, list);
    } else {
      unlinkedProjects.push(project);
    }
  });

  if (experiences.length === 0) {
    lines.push('（未入力）');
    lines.push('');
  }

  experiences.forEach((experience) => {
    lines.push(
      `### ${experience.companyName}（${formatPeriod(
        experience.startedOn,
        experience.endedOn
      )}）`
    );
    lines.push('');

    const meta: string[] = [
      `雇用形態: ${EMPLOYMENT_TYPE_LABEL[experience.employmentType]}`,
    ];
    if (experience.jobTitle) meta.push(`役職: ${experience.jobTitle}`);
    if (experience.department) meta.push(`所属: ${experience.department}`);
    if (experience.industry) meta.push(`業界: ${experience.industry}`);
    if (experience.headcount != null) {
      meta.push(`従業員数: ${experience.headcount} 名`);
    }
    lines.push(meta.map((item) => `- ${item}`).join('\n'));
    lines.push('');

    if (experience.businessDescription) {
      lines.push(`**事業内容**: ${experience.businessDescription}`);
      lines.push('');
    }
    if (experience.achievements) {
      lines.push(`**在籍中の実績**: ${experience.achievements}`);
      lines.push('');
    }

    const projects = sortProjectsForDocument(
      projectsByExperience.get(experience.id) ?? []
    );
    projects.forEach((project) => renderProject(project, lines));
  });

  if (unlinkedProjects.length > 0) {
    lines.push('### その他（個人開発・社外活動）');
    lines.push('');
    sortProjectsForDocument(unlinkedProjects).forEach((project) =>
      renderProject(project, lines)
    );
  }

  if (dataset.skills.length > 0) {
    lines.push('## 保有スキル');
    lines.push('');
    lines.push('| 分類 | 技術 | レベル | 経験年数 |');
    lines.push('| --- | --- | --- | --- |');
    [...dataset.skills]
      .sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return b.level - a.level;
      })
      .forEach((skill) => {
        lines.push(
          `| ${SKILL_CATEGORY_LABEL[skill.category]} | ${skill.name} | ${
            SKILL_LEVEL_LABEL[skill.level] ?? skill.level
          } | ${skill.yearsOfExperience != null ? `${skill.yearsOfExperience} 年` : '—'} |`
        );
      });
    lines.push('');
  }

  if (dataset.certifications.length > 0) {
    lines.push('## 資格');
    lines.push('');
    dataset.certifications.forEach((certification) => {
      const parts = [certification.name, certification.score, certification.issuer]
        .filter((part) => part.trim().length > 0)
        .join(' / ');
      lines.push(`- ${parts}`);
    });
    lines.push('');
  }

  const selfPr = findHighlightBody(dataset, 'self_pr');
  if (selfPr) {
    lines.push('## 自己PR');
    lines.push('');
    lines.push(selfPr);
    lines.push('');
  }

  const future = findHighlightBody(dataset, 'future');
  if (future) {
    lines.push('## 今後のキャリアプラン');
    lines.push('');
    lines.push(future);
    lines.push('');
  }

  lines.push('以上');
  lines.push('');

  return lines.join('\n');
};
