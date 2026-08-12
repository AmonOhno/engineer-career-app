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
      makePreference({ desiredBenefits: [] }),
      makeApplication({ benefits: [] })
    );
    const benefit = result.factors.find((factor) => factor.label === '福利厚生')!;
    expect(benefit.score).toBeNull();
  });
});
