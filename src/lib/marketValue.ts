/**
 * 「年収 1000 万円レンジで評価されるか」を軸ごとにスコア化する。
 *
 * 高年収帯の求人で共通して見られている観点を 6 軸に分解し、登録済みの
 * スキル・プロジェクト・プロフィールから機械的に採点する。採点そのものより
 * 「次に何を埋めるべきか」を出すことが目的。
 *
 * 純粋関数のみ。DB / React には依存しない。
 */

import type { CareerDataset, CareerProject, CareerSkill } from '../types/career';

/** 高単価が付きやすい技術ドメイン。スキル名・技術スタックの語で判定する。 */
export const HIGH_VALUE_DOMAINS: {
  id: string;
  label: string;
  keywords: string[];
}[] = [
  {
    id: 'cloud',
    label: 'クラウド基盤',
    keywords: ['aws', 'gcp', 'azure', 'cloud', 'terraform', 'iac', 'クラウド'],
  },
  {
    id: 'sre',
    label: 'SRE / 可用性',
    keywords: [
      'sre',
      'kubernetes',
      'k8s',
      'observability',
      'datadog',
      'prometheus',
      'slo',
      '信頼性',
      '可用性',
    ],
  },
  {
    id: 'architecture',
    label: 'アーキテクチャ設計',
    keywords: [
      'architect',
      'アーキテク',
      'microservice',
      'マイクロサービス',
      'ddd',
      'event driven',
      'システム設計',
    ],
  },
  {
    id: 'data',
    label: 'データ / ML',
    keywords: [
      'bigquery',
      'snowflake',
      'spark',
      'airflow',
      'dbt',
      'machine learning',
      'ml',
      'データ基盤',
      '機械学習',
    ],
  },
  {
    id: 'ai',
    label: 'AI / LLM 応用',
    keywords: ['llm', 'rag', 'openai', 'anthropic', '生成ai', 'genai', 'mlops'],
  },
  {
    id: 'security',
    label: 'セキュリティ',
    keywords: ['security', 'セキュリティ', 'iam', 'zero trust', '脆弱性', 'soc'],
  },
  {
    id: 'scale',
    label: '大規模トラフィック / 性能',
    keywords: [
      '大規模',
      'スケール',
      'scalability',
      'performance',
      '負荷',
      'パフォーマンス',
    ],
  },
];

/** 到達目安。この数のドメインをカバーしていれば満点。 */
const HIGH_VALUE_DOMAIN_TARGET = 3;

/** リード経験と判定する役職・役割の語。 */
const LEADERSHIP_KEYWORDS = [
  'lead',
  'リード',
  'manager',
  'マネージャ',
  'マネジャー',
  'pm',
  'pl',
  '責任者',
  'head',
  'director',
  'cto',
  'vpoe',
  'architect',
  'アーキテクト',
];

export interface ScoreAxis {
  id: string;
  label: string;
  /** 0〜100。 */
  score: number;
  /** 総合スコアへの重み。 */
  weight: number;
  /** 判定根拠の説明。 */
  evidence: string;
  /** 次に取るべき打ち手。score が満点なら空文字。 */
  advice: string;
}

export interface MarketValueResult {
  /** 0〜100 の総合スコア。 */
  totalScore: number;
  axes: ScoreAxis[];
  /** 伸びしろの大きい順に並べた打ち手。 */
  actions: { axis: string; advice: string; impact: number }[];
  /** カバーできている高単価ドメイン。 */
  coveredDomains: string[];
  /** 未カバーの高単価ドメイン。 */
  uncoveredDomains: string[];
}

const normalize = (value: string): string => value.toLowerCase().trim();

const includesAny = (haystack: string, keywords: string[]): boolean =>
  keywords.some((keyword) => haystack.includes(normalize(keyword)));

/** スキル名・プロジェクトの技術スタック・役割をまとめた検索用テキスト。 */
const buildSearchCorpus = (
  skills: CareerSkill[],
  projects: CareerProject[]
): string =>
  [
    ...skills.map((s) => `${s.name} ${s.note}`),
    ...projects.map(
      (p) =>
        `${p.name} ${p.role} ${p.overview} ${p.techStack.join(' ')} ${p.action} ${p.result}`
    ),
  ]
    .map(normalize)
    .join(' | ');

const clamp100 = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

/** 月数の差を返す。 */
const monthsBetween = (from: Date, to: Date): number =>
  (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

const scoreSkillDepth = (skills: CareerSkill[]): ScoreAxis => {
  const deep = skills.filter((s) => s.level >= 4);
  const expert = skills.filter((s) => s.level === 5);
  const maxYears = skills.reduce(
    (max, s) => Math.max(max, s.yearsOfExperience ?? 0),
    0
  );

  // レベル 4 以上が 3 つ、かつ 5 年以上の主力技術があれば満点。
  const depthScore = Math.min(1, deep.length / 3) * 60;
  const expertBonus = Math.min(1, expert.length / 1) * 20;
  const yearsScore = Math.min(1, maxYears / 5) * 20;

  return {
    id: 'skillDepth',
    label: 'コアスキルの深さ',
    weight: 20,
    score: clamp100(depthScore + expertBonus + yearsScore),
    evidence: `レベル4以上 ${deep.length} 件 / レベル5 ${expert.length} 件 / 最長経験 ${maxYears} 年`,
    advice:
      deep.length >= 3 && expert.length >= 1 && maxYears >= 5
        ? ''
        : '主力技術を 3 つに絞り、設計を主導できる（レベル4以上）状態まで引き上げる。1 つは指導できるレベル5を目指す。',
  };
};

const scoreHighValueCoverage = (
  skills: CareerSkill[],
  projects: CareerProject[]
): { axis: ScoreAxis; covered: string[]; uncovered: string[] } => {
  const corpus = buildSearchCorpus(skills, projects);
  const covered: string[] = [];
  const uncovered: string[] = [];

  HIGH_VALUE_DOMAINS.forEach((domain) => {
    if (includesAny(corpus, domain.keywords)) covered.push(domain.label);
    else uncovered.push(domain.label);
  });

  const score = clamp100(
    (Math.min(covered.length, HIGH_VALUE_DOMAIN_TARGET) /
      HIGH_VALUE_DOMAIN_TARGET) *
      100
  );

  return {
    axis: {
      id: 'highValueCoverage',
      label: '高単価ドメインのカバー',
      weight: 20,
      score,
      evidence:
        covered.length > 0
          ? `カバー済み: ${covered.join(' / ')}`
          : '高単価ドメインの経験が未登録',
      advice:
        score === 100
          ? ''
          : `未カバー領域（${uncovered.slice(0, 3).join(' / ')}）のうち 1 つを実務またはサイドプロジェクトで経験し、スキル・プロジェクトに登録する。`,
    },
    covered,
    uncovered,
  };
};

const scoreLeadership = (dataset: CareerDataset): ScoreAxis => {
  const roleCorpus = normalize(
    [
      ...dataset.projects.map((p) => p.role),
      ...dataset.experiences.map((e) => e.jobTitle),
      dataset.profile?.currentJobTitle ?? '',
    ].join(' ')
  );

  const hasLeadTitle = includesAny(roleCorpus, LEADERSHIP_KEYWORDS);
  const hasManagementPhase = dataset.projects.some((p) =>
    p.phases.includes('management')
  );
  const maxTeamSize = dataset.projects.reduce(
    (max, p) => Math.max(max, p.teamSize ?? 0),
    0
  );

  const score = clamp100(
    (hasLeadTitle ? 45 : 0) +
      (hasManagementPhase ? 25 : 0) +
      Math.min(1, maxTeamSize / 8) * 30
  );

  return {
    id: 'leadership',
    label: 'リード / 裁量の実績',
    weight: 15,
    score,
    evidence: `リード相当の役割 ${hasLeadTitle ? 'あり' : 'なし'} / 最大チーム規模 ${maxTeamSize} 名`,
    advice:
      score === 100
        ? ''
        : '技術選定・設計・レビューを主導した範囲を役割欄に明記する。人数規模と「自分が決めたこと」をセットで書くと 1000 万円レンジの評価に乗りやすい。',
  };
};

const scoreQuantifiedImpact = (projects: CareerProject[]): ScoreAxis => {
  if (projects.length === 0) {
    return {
      id: 'quantifiedImpact',
      label: '成果の定量化',
      weight: 20,
      score: 0,
      evidence: 'プロジェクトが未登録',
      advice:
        '主要プロジェクトを 3 件登録し、それぞれに数値で語れる成果（%・時間・金額・件数）を書く。',
    };
  }

  const hasNumber = (text: string) => /\d/.test(text);
  const quantified = projects.filter(
    (p) => p.impactMetric.trim().length > 0 || hasNumber(p.result)
  );
  const ratio = quantified.length / projects.length;

  return {
    id: 'quantifiedImpact',
    label: '成果の定量化',
    weight: 20,
    score: clamp100(ratio * 100),
    evidence: `定量成果あり ${quantified.length} / ${projects.length} 件`,
    advice:
      ratio >= 1
        ? ''
        : '成果欄に数値が入っていないプロジェクトを埋める。「改善した」ではなく「p95 を 1.2s → 180ms」の粒度にする。',
  };
};

const scoreVisibility = (dataset: CareerDataset): ScoreAxis => {
  const profile = dataset.profile;
  const links = [
    profile?.githubUrl,
    profile?.portfolioUrl,
    profile?.blogUrl,
    profile?.linkedinUrl,
  ].filter((url) => (url ?? '').trim().length > 0);

  const score = clamp100(
    links.length * 20 + (dataset.certifications.length > 0 ? 20 : 0)
  );

  return {
    id: 'visibility',
    label: '外部から見える実績',
    weight: 10,
    score,
    evidence: `公開リンク ${links.length} 件 / 資格 ${dataset.certifications.length} 件`,
    advice:
      score === 100
        ? ''
        : 'GitHub・技術ブログ・登壇資料のいずれかを整備してプロフィールに登録する。スカウト経由の提示額に効く。',
  };
};

const scoreRecency = (skills: CareerSkill[], now: Date): ScoreAxis => {
  const targets = skills.filter((s) => s.isCore || s.level >= 4);
  if (targets.length === 0) {
    return {
      id: 'recency',
      label: '主力スキルの鮮度',
      weight: 15,
      score: 0,
      evidence: '主力スキルが未登録',
      advice: '書類で前面に出すスキルを「主力」に設定し、最終使用年月を入れる。',
    };
  }

  const fresh = targets.filter((s) => {
    if (!s.lastUsedOn) return false;
    const used = new Date(s.lastUsedOn);
    if (Number.isNaN(used.getTime())) return false;
    return monthsBetween(used, now) <= 24;
  });

  const ratio = fresh.length / targets.length;
  return {
    id: 'recency',
    label: '主力スキルの鮮度',
    weight: 15,
    score: clamp100(ratio * 100),
    evidence: `直近 2 年以内に使用 ${fresh.length} / ${targets.length} 件`,
    advice:
      ratio >= 1
        ? ''
        : '2 年以上使っていない主力スキルは、現業務で使う機会を作るか、書類での訴求から外す。',
  };
};

/**
 * 6 軸を採点して総合スコアと打ち手を返す。
 *
 * @param now 鮮度判定の基準日。テスト容易性のため引数で受ける。
 */
export const evaluateMarketValue = (
  dataset: CareerDataset,
  now: Date = new Date()
): MarketValueResult => {
  const coverage = scoreHighValueCoverage(dataset.skills, dataset.projects);

  const axes: ScoreAxis[] = [
    scoreSkillDepth(dataset.skills),
    coverage.axis,
    scoreLeadership(dataset),
    scoreQuantifiedImpact(dataset.projects),
    scoreVisibility(dataset),
    scoreRecency(dataset.skills, now),
  ];

  const totalWeight = axes.reduce((sum, axis) => sum + axis.weight, 0);
  const totalScore = Math.round(
    axes.reduce((sum, axis) => sum + axis.score * axis.weight, 0) / totalWeight
  );

  const actions = axes
    .filter((axis) => axis.advice.length > 0)
    .map((axis) => ({
      axis: axis.label,
      advice: axis.advice,
      impact: Math.round(((100 - axis.score) * axis.weight) / 100),
    }))
    .sort((a, b) => b.impact - a.impact);

  return {
    totalScore,
    axes,
    actions,
    coveredDomains: coverage.covered,
    uncoveredDomains: coverage.uncovered,
  };
};
