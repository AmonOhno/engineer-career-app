/**
 * 応募先と希望条件のマッチ度算出。
 *
 * 業務内容（職種・業界・技術スタック）と、業務内容以外（年収・勤務地・
 * リモート・福利厚生）を別々に採点し、合成する。絶対条件（must have）を
 * 満たさない場合は個別に警告として返す。
 *
 * 純粋関数のみ。
 */

import type { CareerApplication, CareerPreference } from '../types/career';

export interface MatchFactor {
  label: string;
  /** 0〜100。判定材料が無い場合は null。 */
  score: number | null;
  weight: number;
  detail: string;
}

export interface MatchResult {
  /** 0〜100。判定材料が 1 つも無ければ null。 */
  score: number | null;
  factors: MatchFactor[];
  /** 満たしていない絶対条件。 */
  unmetMustHaves: string[];
}

const normalize = (value: string): string => value.toLowerCase().trim();

/** 2 つの文字列配列の重なりを 0〜1 で返す。希望側が空なら null（判定不能）。 */
const overlapRatio = (desired: string[], actual: string[]): number | null => {
  if (desired.length === 0) return null;
  const actualSet = new Set(actual.map(normalize));
  const matched = desired.filter((item) => actualSet.has(normalize(item)));
  return matched.length / desired.length;
};

/** 年収の充足度。理想額で 100、最低ラインで 60、下回ると 0 に近づける。 */
export const scoreIncome = (
  offered: number | null,
  floor: number | null,
  ideal: number
): number | null => {
  if (offered == null || offered <= 0) return null;
  if (offered >= ideal) return 100;

  const base = floor != null && floor > 0 ? floor : ideal * 0.7;
  if (offered <= base) {
    // 最低ラインを下回る分だけ 0 に向けて減衰させる
    return Math.max(0, Math.round((offered / base) * 60));
  }
  const span = ideal - base;
  if (span <= 0) return 100;
  return Math.round(60 + ((offered - base) / span) * 40);
};

const scoreRemote = (
  preference: CareerPreference,
  application: CareerApplication
): number | null => {
  if (!application.remotePolicy) return null;
  if (preference.remotePreference === 'any') return 100;
  if (preference.remotePreference === application.remotePolicy) return 100;
  // フルリモート希望にハイブリッド提示など、近い場合は部分点
  const near =
    (preference.remotePreference === 'full_remote' &&
      application.remotePolicy === 'hybrid') ||
    (preference.remotePreference === 'hybrid' &&
      (application.remotePolicy === 'full_remote' ||
        application.remotePolicy === 'onsite'));
  return near ? 60 : 20;
};

const scoreLocation = (
  preference: CareerPreference,
  application: CareerApplication
): number | null => {
  if (preference.desiredLocations.length === 0) return null;
  if (!application.location.trim()) return null;
  const location = normalize(application.location);
  const hit = preference.desiredLocations.some((desired) =>
    location.includes(normalize(desired))
  );
  if (hit) return 100;
  // フルリモート提示なら勤務地の不一致は実質問題にならない
  return application.remotePolicy === 'full_remote' ? 80 : 0;
};

/**
 * 応募先 1 件のマッチ度を返す。
 * 提示年収は実オファーがあればそれを、無ければレンジ上限を使う。
 */
export const evaluateMatch = (
  preference: CareerPreference | null,
  application: CareerApplication
): MatchResult => {
  if (!preference) {
    return { score: null, factors: [], unmetMustHaves: [] };
  }

  const offered =
    application.offeredIncome ??
    application.incomeRangeMax ??
    application.incomeRangeMin;

  const industryRatio = overlapRatio(preference.desiredIndustries, [
    application.industry,
  ]);
  const titleRatio = overlapRatio(preference.desiredJobTitles, [
    application.jobTitle,
  ]);
  const techRatio = overlapRatio(
    preference.desiredTechStack,
    application.techStack
  );
  const benefitRatio = overlapRatio(
    preference.desiredBenefits,
    application.benefits
  );
  const avoidHits = preference.avoidTechStack.filter((avoid) =>
    application.techStack.some((tech) => normalize(tech) === normalize(avoid))
  );

  const factors: MatchFactor[] = [
    {
      label: '年収',
      score: scoreIncome(
        offered,
        preference.incomeFloor,
        preference.desiredIncomeIdeal
      ),
      weight: 35,
      detail:
        offered == null
          ? '提示額が未登録'
          : `提示 ${Math.round(offered / 10_000)} 万円 / 理想 ${Math.round(
              preference.desiredIncomeIdeal / 10_000
            )} 万円`,
    },
    {
      label: '技術スタック',
      score: techRatio == null ? null : Math.round(techRatio * 100),
      weight: 20,
      detail:
        techRatio == null
          ? '希望技術が未登録'
          : `希望技術の ${Math.round(techRatio * 100)}% が一致${
              avoidHits.length ? ` / 避けたい技術: ${avoidHits.join(', ')}` : ''
            }`,
    },
    {
      label: '職種',
      score: titleRatio == null ? null : Math.round(titleRatio * 100) > 0 ? 100 : 30,
      weight: 15,
      detail: titleRatio == null ? '希望職種が未登録' : application.jobTitle || '—',
    },
    {
      label: '業界',
      score:
        industryRatio == null ? null : Math.round(industryRatio * 100) > 0 ? 100 : 40,
      weight: 10,
      detail: industryRatio == null ? '希望業界が未登録' : application.industry || '—',
    },
    {
      label: '働き方（リモート）',
      score: scoreRemote(preference, application),
      weight: 12,
      detail: application.remotePolicy || '提示情報なし',
    },
    {
      label: '勤務地',
      score: scoreLocation(preference, application),
      weight: 8,
      detail: application.location || '提示情報なし',
    },
    {
      label: '福利厚生',
      score: benefitRatio == null ? null : Math.round(benefitRatio * 100),
      weight: 10,
      detail:
        benefitRatio == null
          ? '希望福利厚生が未登録'
          : `希望の ${Math.round(benefitRatio * 100)}% が一致`,
    },
  ];

  const scored = factors.filter(
    (factor): factor is MatchFactor & { score: number } => factor.score != null
  );
  const totalWeight = scored.reduce((sum, factor) => sum + factor.weight, 0);
  const score =
    totalWeight === 0
      ? null
      : Math.round(
          scored.reduce((sum, factor) => sum + factor.score * factor.weight, 0) /
            totalWeight
        );

  // 絶対条件は求人側の情報（社名・職種・勤務地・技術・福利厚生・メモ）に
  // 語が含まれているかで判定する
  const applicationCorpus = normalize(
    [
      application.companyName,
      application.jobTitle,
      application.location,
      application.industry,
      application.memo,
      ...application.techStack,
      ...application.benefits,
    ].join(' ')
  );

  const unmetMustHaves = preference.mustHaveConditions.filter(
    (condition) => !applicationCorpus.includes(normalize(condition))
  );

  if (offered != null && preference.incomeFloor != null && offered < preference.incomeFloor) {
    unmetMustHaves.push(
      `年収の最低ライン（${Math.round(preference.incomeFloor / 10_000)} 万円）を下回る`
    );
  }
  avoidHits.forEach((tech) => unmetMustHaves.push(`避けたい技術を含む: ${tech}`));

  return { score, factors, unmetMustHaves };
};
