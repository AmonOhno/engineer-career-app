/**
 * 年収ギャップの計算。目標年収（既定 1000 万円）への到達度と、
 * 転職 1 回あたりの現実的な上げ幅から必要な転職回数を見積もる。
 *
 * ここは純粋関数のみ。DB / React には依存しない。
 */

import type { CareerApplication } from '../types/career';
import { ACTIVE_APPLICATION_STATUSES } from './format';

/** 転職 1 回あたりの年収上昇率の目安。控えめ〜強気の 2 通りを持つ。 */
export const RAISE_RATE = {
  conservative: 0.15,
  aggressive: 0.3,
} as const;

export interface IncomeGap {
  currentIncome: number | null;
  targetIncome: number;
  /** 目標までの差額（円）。目標到達済みなら 0。 */
  gapYen: number;
  /** 到達率（0〜1）。現年収未入力なら null。 */
  achievementRate: number | null;
  /** 目標に必要な上げ幅（0.25 なら +25%）。現年収未入力なら null。 */
  requiredRaiseRate: number | null;
  /** 控えめな上げ幅（+15%/回）で到達するのに必要な転職回数。 */
  jobChangesConservative: number | null;
  /** 強気な上げ幅（+30%/回）で到達するのに必要な転職回数。 */
  jobChangesAggressive: number | null;
  achieved: boolean;
}

/**
 * 上げ幅 `rate` の転職を何回繰り返せば目標に届くかを返す。
 * current <= 0 の場合は算出不能として null。
 */
export const countJobChangesToTarget = (
  current: number,
  target: number,
  rate: number
): number | null => {
  if (current <= 0 || rate <= 0) return null;
  if (current >= target) return 0;
  // current * (1 + rate)^n >= target を満たす最小の整数 n
  const n = Math.log(target / current) / Math.log(1 + rate);
  return Math.ceil(n - 1e-9);
};

export const computeIncomeGap = (
  currentIncome: number | null | undefined,
  targetIncome: number
): IncomeGap => {
  const current = currentIncome ?? null;
  if (current == null || current <= 0) {
    return {
      currentIncome: current,
      targetIncome,
      gapYen: targetIncome,
      achievementRate: null,
      requiredRaiseRate: null,
      jobChangesConservative: null,
      jobChangesAggressive: null,
      achieved: false,
    };
  }

  const gapYen = Math.max(0, targetIncome - current);
  return {
    currentIncome: current,
    targetIncome,
    gapYen,
    achievementRate: current / targetIncome,
    requiredRaiseRate: gapYen === 0 ? 0 : gapYen / current,
    jobChangesConservative: countJobChangesToTarget(
      current,
      targetIncome,
      RAISE_RATE.conservative
    ),
    jobChangesAggressive: countJobChangesToTarget(
      current,
      targetIncome,
      RAISE_RATE.aggressive
    ),
    achieved: current >= targetIncome,
  };
};

export interface PipelineSummary {
  /** 選考が動いている件数。 */
  activeCount: number;
  /** オファー獲得済みの件数。 */
  offerCount: number;
  /** 提示レンジ上限が目標年収以上の応募件数。 */
  reachingTargetCount: number;
  /** 実オファーの最高額（円）。 */
  bestOfferedIncome: number | null;
  /** 進行中案件の提示レンジ上限の最高額（円）。 */
  bestPotentialIncome: number | null;
  /** 進行中案件の提示レンジ上限の中央値（円）。 */
  medianPotentialIncome: number | null;
}

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * 応募パイプラインの集計。目標年収に届く求人がどれだけ動いているかを見る。
 */
export const summarizePipeline = (
  applications: CareerApplication[],
  targetIncome: number
): PipelineSummary => {
  const active = applications.filter((a) =>
    ACTIVE_APPLICATION_STATUSES.includes(a.status)
  );

  const offered = applications
    .map((a) => a.offeredIncome)
    .filter((v): v is number => v != null && v > 0);

  const potentials = active
    .map((a) => a.incomeRangeMax ?? a.incomeRangeMin)
    .filter((v): v is number => v != null && v > 0);

  return {
    activeCount: active.length,
    offerCount: applications.filter(
      (a) => a.status === 'offer' || a.status === 'accepted'
    ).length,
    reachingTargetCount: active.filter(
      (a) => (a.incomeRangeMax ?? 0) >= targetIncome
    ).length,
    bestOfferedIncome: offered.length ? Math.max(...offered) : null,
    bestPotentialIncome: potentials.length ? Math.max(...potentials) : null,
    medianPotentialIncome: median(potentials),
  };
};
