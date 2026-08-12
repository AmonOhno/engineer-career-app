import {
  evaluateCompleteness,
  evaluateOverallCompleteness,
} from '../completeness';
import { makeDataset, makeHighlight, makeProfile } from './fixtures';

describe('evaluateCompleteness', () => {
  it('履歴書の必須項目が揃っていれば ready', () => {
    const dataset = makeDataset({
      highlights: [makeHighlight({ kind: 'self_pr' })],
    });
    const result = evaluateCompleteness(dataset, 'resume');
    expect(result.ready).toBe(true);
    expect(result.score).toBe(100);
  });

  it('氏名が未入力なら未充足として挙がる', () => {
    const dataset = makeDataset({
      profile: makeProfile({ fullName: '  ' }),
      highlights: [makeHighlight({ kind: 'self_pr' })],
    });
    const result = evaluateCompleteness(dataset, 'resume');
    expect(result.ready).toBe(false);
    expect(result.missingRequired.map((item) => item.label)).toContain('氏名');
  });

  it('職務経歴書は職務要約と自己PRの両方を要求する', () => {
    const dataset = makeDataset({
      highlights: [makeHighlight({ kind: 'summary' })],
    });
    const result = evaluateCompleteness(dataset, 'career_history');
    expect(result.missingRequired.map((item) => item.label)).toContain('自己PR');
  });

  it('未入力項目には遷移先セクションが付く', () => {
    const dataset = makeDataset({ highlights: [] });
    const result = evaluateCompleteness(dataset, 'career_history');
    expect(result.missingRequired[0].section).toBe('highlights');
  });

  it('スキルシートはスキル 5 件以上を必須にする', () => {
    const result = evaluateCompleteness(makeDataset(), 'skill_sheet');
    expect(result.missingRequired.map((item) => item.label)).toContain(
      'スキル（5 件以上）'
    );
  });
});

describe('evaluateOverallCompleteness', () => {
  it('重複する未入力項目は 1 つにまとめる', () => {
    const dataset = makeDataset({ profile: null, highlights: [] });
    const result = evaluateOverallCompleteness(dataset);
    const labels = result.missingRequired.map((item) => item.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toContain('氏名');
  });

  it('スコアは 0〜100 に収まる', () => {
    const result = evaluateOverallCompleteness(makeDataset());
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
