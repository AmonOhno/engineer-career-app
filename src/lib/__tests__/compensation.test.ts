import {
  RAISE_RATE,
  computeIncomeGap,
  countJobChangesToTarget,
  summarizePipeline,
} from '../compensation';
import { makeApplication } from './fixtures';

describe('countJobChangesToTarget', () => {
  it('目標に達していれば 0 回', () => {
    expect(countJobChangesToTarget(10_000_000, 10_000_000, 0.15)).toBe(0);
    expect(countJobChangesToTarget(12_000_000, 10_000_000, 0.15)).toBe(0);
  });

  it('700 万から 1000 万は +15%/回なら 3 回', () => {
    // 700 * 1.15^2 = 925.75 万で未達、1.15^3 = 1064.6 万で到達
    expect(countJobChangesToTarget(7_000_000, 10_000_000, RAISE_RATE.conservative)).toBe(3);
  });

  it('700 万から 1000 万は +30%/回なら 2 回', () => {
    expect(countJobChangesToTarget(7_000_000, 10_000_000, RAISE_RATE.aggressive)).toBe(2);
  });

  it('ちょうど到達する場合に余分な 1 回を数えない', () => {
    // 800 万 * 1.25 = 1000 万
    expect(countJobChangesToTarget(8_000_000, 10_000_000, 0.25)).toBe(1);
  });

  it('現年収が 0 以下なら算出不能', () => {
    expect(countJobChangesToTarget(0, 10_000_000, 0.15)).toBeNull();
  });
});

describe('computeIncomeGap', () => {
  it('現年収未登録ならギャップは目標額そのもので、率は算出しない', () => {
    const gap = computeIncomeGap(null, 10_000_000);
    expect(gap.gapYen).toBe(10_000_000);
    expect(gap.achievementRate).toBeNull();
    expect(gap.requiredRaiseRate).toBeNull();
    expect(gap.achieved).toBe(false);
  });

  it('差額と必要な上げ幅を返す', () => {
    const gap = computeIncomeGap(8_000_000, 10_000_000);
    expect(gap.gapYen).toBe(2_000_000);
    expect(gap.achievementRate).toBeCloseTo(0.8);
    expect(gap.requiredRaiseRate).toBeCloseTo(0.25);
    expect(gap.achieved).toBe(false);
  });

  it('目標到達済みなら差額 0 で achieved', () => {
    const gap = computeIncomeGap(11_000_000, 10_000_000);
    expect(gap.gapYen).toBe(0);
    expect(gap.requiredRaiseRate).toBe(0);
    expect(gap.achieved).toBe(true);
    expect(gap.jobChangesConservative).toBe(0);
  });
});

describe('summarizePipeline', () => {
  it('進行中の案件だけを対象に集計する', () => {
    const applications = [
      makeApplication({ id: 'app_1', status: 'interview_1', incomeRangeMax: 12_000_000 }),
      makeApplication({ id: 'app_2', status: 'rejected', incomeRangeMax: 15_000_000 }),
      makeApplication({ id: 'app_3', status: 'applied', incomeRangeMax: 8_000_000 }),
    ];

    const summary = summarizePipeline(applications, 10_000_000);
    expect(summary.activeCount).toBe(2);
    expect(summary.reachingTargetCount).toBe(1);
    expect(summary.bestPotentialIncome).toBe(12_000_000);
    expect(summary.medianPotentialIncome).toBe(10_000_000);
  });

  it('オファー額は選考ステータスに関係なく最高額を拾う', () => {
    const applications = [
      makeApplication({ id: 'app_1', status: 'offer', offeredIncome: 10_500_000 }),
      makeApplication({ id: 'app_2', status: 'declined', offeredIncome: 9_000_000 }),
    ];

    const summary = summarizePipeline(applications, 10_000_000);
    expect(summary.bestOfferedIncome).toBe(10_500_000);
    expect(summary.offerCount).toBe(1);
  });

  it('応募が無ければ集計値は null', () => {
    const summary = summarizePipeline([], 10_000_000);
    expect(summary.bestOfferedIncome).toBeNull();
    expect(summary.bestPotentialIncome).toBeNull();
    expect(summary.medianPotentialIncome).toBeNull();
  });
});
