import { evaluateMarketValue } from '../marketValue';
import { makeDataset, makeProject, makeProfile, makeSkill } from './fixtures';

const NOW = new Date('2026-08-12T00:00:00Z');

describe('evaluateMarketValue', () => {
  it('未登録なら総合スコアは 0 で、打ち手が並ぶ', () => {
    const result = evaluateMarketValue(
      makeDataset({
        profile: null,
        skills: [],
        projects: [],
        experiences: [],
        certifications: [],
      }),
      NOW
    );

    expect(result.totalScore).toBe(0);
    expect(result.actions.length).toBeGreaterThan(0);
    // 伸びしろの大きい順に並ぶ
    expect(result.actions[0].impact).toBeGreaterThanOrEqual(
      result.actions[result.actions.length - 1].impact
    );
  });

  it('高単価ドメインをスキル・技術スタックの語から検出する', () => {
    const result = evaluateMarketValue(makeDataset(), NOW);
    expect(result.coveredDomains).toEqual(
      expect.arrayContaining(['クラウド基盤', 'SRE / 可用性'])
    );
  });

  it('定量成果が無いプロジェクトはスコアを下げる', () => {
    const withMetric = evaluateMarketValue(makeDataset(), NOW);
    const withoutMetric = evaluateMarketValue(
      makeDataset({
        projects: [makeProject({ impactMetric: '', result: '改善した' })],
      }),
      NOW
    );

    const pick = (axes: { id: string; score: number }[]) =>
      axes.find((axis) => axis.id === 'quantifiedImpact')!.score;

    expect(pick(withMetric.axes)).toBe(100);
    expect(pick(withoutMetric.axes)).toBe(0);
  });

  it('2 年以上使っていない主力スキルは鮮度スコアが下がる', () => {
    const stale = evaluateMarketValue(
      makeDataset({ skills: [makeSkill({ lastUsedOn: '2020-01-01' })] }),
      NOW
    );
    expect(stale.axes.find((axis) => axis.id === 'recency')!.score).toBe(0);

    const fresh = evaluateMarketValue(
      makeDataset({ skills: [makeSkill({ lastUsedOn: '2026-01-01' })] }),
      NOW
    );
    expect(fresh.axes.find((axis) => axis.id === 'recency')!.score).toBe(100);
  });

  it('リード経験と公開リンクがスコアに反映される', () => {
    const result = evaluateMarketValue(makeDataset(), NOW);
    const leadership = result.axes.find((axis) => axis.id === 'leadership')!;
    expect(leadership.score).toBe(100);

    const noLinks = evaluateMarketValue(
      makeDataset({
        profile: makeProfile({ githubUrl: '' }),
        certifications: [],
      }),
      NOW
    );
    expect(noLinks.axes.find((axis) => axis.id === 'visibility')!.score).toBe(0);
  });

  it('総合スコアは 0〜100 に収まる', () => {
    const result = evaluateMarketValue(makeDataset(), NOW);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });
});
