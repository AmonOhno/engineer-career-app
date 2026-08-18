import { evaluateMatch, scoreIncome } from '../matching';
import { makeApplication, makePreference } from './fixtures';

describe('scoreIncome', () => {
  it('理想額以上なら 100', () => {
    expect(scoreIncome(10_000_000, 8_000_000, 10_000_000)).toBe(100);
    expect(scoreIncome(12_000_000, 8_000_000, 10_000_000)).toBe(100);
  });

  it('最低ラインちょうどで 60', () => {
    expect(scoreIncome(8_000_000, 8_000_000, 10_000_000)).toBe(60);
  });

  it('最低ラインと理想の中間は 80 前後', () => {
    expect(scoreIncome(9_000_000, 8_000_000, 10_000_000)).toBe(80);
  });

  it('最低ラインを下回ると 60 未満に落ちる', () => {
    expect(scoreIncome(6_000_000, 8_000_000, 10_000_000)).toBeLessThan(60);
  });

  it('提示額不明なら判定しない', () => {
    expect(scoreIncome(null, 8_000_000, 10_000_000)).toBeNull();
  });
});

describe('evaluateMatch', () => {
  it('希望条件が未登録ならスコアを出さない', () => {
    const result = evaluateMatch(null, makeApplication());
    expect(result.score).toBeNull();
    expect(result.factors).toHaveLength(0);
  });

  it('希望に沿った求人は高スコアになる', () => {
    const result = evaluateMatch(makePreference(), makeApplication());
    expect(result.score).not.toBeNull();
    expect(result.score!).toBeGreaterThanOrEqual(90);
    expect(result.unmetMustHaves).toHaveLength(0);
  });

  it('年収が最低ラインを下回ると警告に出る', () => {
    const result = evaluateMatch(
      makePreference(),
      makeApplication({ incomeRangeMax: 7_000_000, incomeRangeMin: 6_000_000 })
    );
    expect(result.unmetMustHaves.join()).toContain('最低ライン');
  });

  it('避けたい技術を含む求人は警告に出る', () => {
    const result = evaluateMatch(
      makePreference({ avoidTechStack: ['COBOL'] }),
      makeApplication({ techStack: ['TypeScript', 'COBOL'] })
    );
    expect(result.unmetMustHaves.join()).toContain('COBOL');
  });

  it('絶対条件の語が求人情報に無ければ未充足として返す', () => {
    const result = evaluateMatch(
      makePreference({ mustHaveConditions: ['フルフレックス'] }),
      makeApplication()
    );
    expect(result.unmetMustHaves).toContain('フルフレックス');
  });

  it('フルリモート希望に出社提示だとスコアが下がる', () => {
    const remote = evaluateMatch(makePreference(), makeApplication());
    const onsite = evaluateMatch(
      makePreference(),
      makeApplication({ remotePolicy: 'onsite' })
    );
    expect(onsite.score!).toBeLessThan(remote.score!);
  });

  it('判定材料が無い項目はスコア計算から除外される', () => {
    const result = evaluateMatch(
      makePreference({ desiredBenefitCodes: [], desiredBenefits: [] }),
      makeApplication({ benefitCodes: [], benefits: [] })
    );
    const benefit = result.factors.find((factor) => factor.label === '福利厚生')!;
    expect(benefit.score).toBeNull();
  });

  it('福利厚生は表記ゆれの自由記述でもマスタ経由で一致する', () => {
    const result = evaluateMatch(
      makePreference({
        desiredBenefitCodes: ['housing_allowance'],
        desiredBenefits: [],
      }),
      makeApplication({ benefitCodes: [], benefits: ['家賃補助'] })
    );
    const benefit = result.factors.find((factor) => factor.label === '福利厚生')!;
    expect(benefit.score).toBe(100);
  });

  it('みなし残業が未確認ならスコア計算から除外される', () => {
    const result = evaluateMatch(
      makePreference(),
      makeApplication({ fixedOvertimeType: 'unknown' })
    );
    const factor = result.factors.find((f) => f.label === 'みなし残業')!;
    expect(factor.score).toBeNull();
  });

  it('みなし残業が許容上限を超えると未充足条件になる', () => {
    const result = evaluateMatch(
      makePreference({ maxFixedOvertimeHours: 20 }),
      makeApplication({ fixedOvertimeType: 'included', fixedOvertimeHours: 45 })
    );
    expect(
      result.unmetMustHaves.some((item) => item.includes('みなし残業 45 時間'))
    ).toBe(true);
  });

  it('みなし残業なし希望に「あり」の求人は未充足条件になり、スコアも下がる', () => {
    const allowed = evaluateMatch(
      makePreference({ allowFixedOvertime: true }),
      makeApplication({ fixedOvertimeType: 'included', fixedOvertimeHours: 10 })
    );
    const rejected = evaluateMatch(
      makePreference({ allowFixedOvertime: false }),
      makeApplication({ fixedOvertimeType: 'included', fixedOvertimeHours: 10 })
    );
    expect(rejected.unmetMustHaves).toContain('みなし残業なしの希望に反する');
    expect(rejected.score!).toBeLessThan(allowed.score!);
  });

  it('超過分の別途支給が必須なのに未確認だと未充足条件になる', () => {
    const result = evaluateMatch(
      makePreference({ requireOvertimePayBeyondFixed: true }),
      makeApplication({
        fixedOvertimeType: 'included',
        fixedOvertimeHours: 10,
        overtimePayBeyondFixed: false,
      })
    );
    expect(result.unmetMustHaves).toContain(
      'みなし残業の超過分が別途支給されるか未確認'
    );
  });

  it('マスタ選択した福利厚生は絶対条件の判定にも使われる', () => {
    const result = evaluateMatch(
      makePreference({ mustHaveConditions: ['住宅手当'] }),
      makeApplication({ benefitCodes: ['housing_allowance'], benefits: [] })
    );
    expect(result.unmetMustHaves).not.toContain('住宅手当');
  });
});
