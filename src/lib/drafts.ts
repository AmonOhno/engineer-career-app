/**
 * 登録済みデータから自己PR・職務要約・志望動機の下書きを組み立てる。
 *
 * あくまで叩き台。生成した文章はユーザーが編集して保存する前提。
 * 純粋関数のみ。
 */

import type { CareerApplication, CareerDataset } from '../types/career';
import { formatManYen } from './format';

const topProjects = (dataset: CareerDataset, count: number) =>
  [...dataset.projects]
    .sort((a, b) => {
      if (a.isHighlighted !== b.isHighlighted) return a.isHighlighted ? -1 : 1;
      return (b.startedOn ?? '').localeCompare(a.startedOn ?? '');
    })
    .slice(0, count);

const coreSkillNames = (dataset: CareerDataset, count: number): string[] => {
  const core = dataset.skills.filter((skill) => skill.isCore);
  const source = core.length > 0 ? core : dataset.skills;
  return [...source]
    .sort((a, b) => b.level - a.level)
    .slice(0, count)
    .map((skill) => skill.name);
};

/** 職務要約の下書き。経験年数・主力技術・直近の役割で組み立てる。 */
export const buildSummaryDraft = (dataset: CareerDataset): string => {
  const profile = dataset.profile;
  const years = profile?.yearsOfExperience;
  const skills = coreSkillNames(dataset, 3);
  const latest = topProjects(dataset, 1)[0];

  const sentences: string[] = [];

  sentences.push(
    `${years != null ? `${years}年間` : 'これまで'}、${
      skills.length > 0 ? skills.join(' / ') : 'ソフトウェア開発'
    }を中心にシステムの設計・開発に従事してきました。`
  );

  if (latest) {
    const role = latest.role || 'エンジニア';
    const scale =
      latest.teamSize != null ? `${latest.teamSize}名規模のチームで` : '';
    sentences.push(
      `直近では「${latest.name}」において${scale}${role}として、${
        latest.responsibilities || latest.overview || '設計から運用までを担当'
      }しました。`
    );
    if (latest.impactMetric) {
      sentences.push(`結果として${latest.impactMetric}を達成しています。`);
    }
  }

  const leadProjects = dataset.projects.filter((project) =>
    project.phases.includes('management')
  );
  if (leadProjects.length > 0) {
    sentences.push(
      `技術選定やアーキテクチャ設計、メンバーのレビューといったリードの役割も担っています。`
    );
  }

  return sentences.join('');
};

/** 自己PR の下書き。強み → 根拠（プロジェクト）→ 再現性、の順で構成する。 */
export const buildSelfPrDraft = (dataset: CareerDataset): string => {
  const projects = topProjects(dataset, 2);
  const skills = coreSkillNames(dataset, 3);
  const blocks: string[] = [];

  blocks.push(
    `【強み】${
      skills.length > 0 ? skills.join(' / ') : '担当領域'
    }を軸に、課題の特定から実装・運用までを一貫して進められることが強みです。`
  );

  projects.forEach((project) => {
    const parts = [
      project.challenge && `${project.name}では、${project.challenge}という課題がありました。`,
      project.action && `これに対し${project.action}を実施しました。`,
      (project.impactMetric || project.result) &&
        `その結果、${project.impactMetric || project.result}という成果につながりました。`,
    ].filter((part): part is string => Boolean(part));
    if (parts.length > 0) blocks.push(`【実績】${parts.join('')}`);
  });

  blocks.push(
    '【再現性】いずれも「計測できる形に課題を落とし込み、優先度をつけて改善する」という進め方で成果を出しており、環境が変わっても同じ動き方で貢献できると考えています。'
  );

  return blocks.join('\n\n');
};

/** 志望動機の下書き。応募先が指定されていればその条件を織り込む。 */
export const buildMotivationDraft = (
  dataset: CareerDataset,
  application?: CareerApplication | null
): string => {
  const preference = dataset.preference;
  const company = application?.companyName ?? '貴社';
  const skills = coreSkillNames(dataset, 2);
  const sentences: string[] = [];

  const domain =
    application?.industry ||
    preference?.desiredIndustries[0] ||
    '事業ドメイン';
  sentences.push(`${company}の${domain}領域における事業展開に関心を持ち、応募いたしました。`);

  if (skills.length > 0) {
    sentences.push(
      `これまで培ってきた${skills.join(' / ')}の経験は、${
        application?.jobTitle || preference?.desiredJobTitles[0] || '募集職種'
      }として即戦力で活かせると考えています。`
    );
  }

  if (preference?.jobChangeReason) {
    sentences.push(`現職では${preference.jobChangeReason}という点から、環境を変えて挑戦したいと考えています。`);
  }

  const future = dataset.highlights.find((h) => h.kind === 'future');
  if (future?.body) {
    sentences.push(future.body);
  } else {
    sentences.push(
      '中長期では技術的な意思決定を担える立場で、事業の成長に直接貢献したいと考えています。'
    );
  }

  return sentences.join('');
};

/**
 * 年収交渉用のトークスクリプト下書き。
 * 目標年収の根拠を「実績 + 市場水準」で並べる。
 */
export const buildNegotiationDraft = (
  dataset: CareerDataset,
  targetIncome: number
): string => {
  const current = dataset.profile?.currentAnnualIncome;
  const projects = topProjects(dataset, 2).filter(
    (project) => project.impactMetric || project.result
  );

  const lines: string[] = [];
  lines.push(
    `希望年収は ${formatManYen(targetIncome)} です。${
      current != null ? `現年収は ${formatManYen(current)} です。` : ''
    }`
  );
  lines.push('根拠として、直近で以下の成果を出しています。');
  if (projects.length === 0) {
    lines.push('- （プロジェクトの定量成果を登録すると、ここに自動で並びます）');
  } else {
    projects.forEach((project) => {
      lines.push(
        `- ${project.name}: ${project.impactMetric || project.result}`
      );
    });
  }
  lines.push(
    'この成果は担当範囲を広げた結果であり、同じ進め方で貴社でも再現できると考えています。'
  );
  lines.push(
    '評価いただける範囲で構いませんので、想定レンジと、その水準に必要な期待値を教えてください。'
  );

  return lines.join('\n');
};
