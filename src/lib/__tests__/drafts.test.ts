import {
  buildMotivationDraft,
  buildNegotiationDraft,
  buildSelfPrDraft,
  buildSummaryDraft,
} from '../drafts';
import {
  makeApplication,
  makeDataset,
  makePreference,
  makeProfile,
  makeProject,
} from './fixtures';

describe('buildSummaryDraft', () => {
  it('経験年数・主力技術・直近案件を織り込む', () => {
    const draft = buildSummaryDraft(makeDataset());
    expect(draft).toContain('8年間');
    expect(draft).toContain('TypeScript');
    expect(draft).toContain('決済基盤リプレース');
    expect(draft).toContain('p95 1.2s → 180ms');
  });

  it('データが空でも文章として成立する', () => {
    const draft = buildSummaryDraft(
      makeDataset({ profile: null, skills: [], projects: [] })
    );
    expect(draft).toContain('ソフトウェア開発');
    expect(draft.length).toBeGreaterThan(0);
  });
});

describe('buildSelfPrDraft', () => {
  it('強み・実績・再現性の 3 ブロックになる', () => {
    const draft = buildSelfPrDraft(makeDataset());
    expect(draft).toContain('【強み】');
    expect(draft).toContain('【実績】');
    expect(draft).toContain('【再現性】');
  });

  it('課題・施策が未入力のプロジェクトは実績ブロックを作らない', () => {
    const draft = buildSelfPrDraft(
      makeDataset({
        projects: [
          makeProject({ challenge: '', action: '', result: '', impactMetric: '' }),
        ],
      })
    );
    expect(draft).not.toContain('【実績】');
  });
});

describe('buildMotivationDraft', () => {
  it('応募先を渡すと社名と業界が入る', () => {
    const draft = buildMotivationDraft(
      makeDataset(),
      makeApplication({ companyName: '株式会社ターゲット', industry: 'フィンテック' })
    );
    expect(draft).toContain('株式会社ターゲット');
    expect(draft).toContain('フィンテック');
  });

  it('応募先未指定なら「貴社」で組み立てる', () => {
    const draft = buildMotivationDraft(makeDataset());
    expect(draft).toContain('貴社');
  });

  it('転職理由が登録されていれば文章に含める', () => {
    const draft = buildMotivationDraft(
      makeDataset({
        preference: makePreference({ jobChangeReason: '技術選定の裁量が小さい' }),
      })
    );
    expect(draft).toContain('技術選定の裁量が小さい');
  });
});

describe('buildNegotiationDraft', () => {
  it('希望額と現年収、定量成果を並べる', () => {
    const draft = buildNegotiationDraft(makeDataset(), 10_000_000);
    expect(draft).toContain('1,000 万円');
    expect(draft).toContain('700 万円');
    expect(draft).toContain('p95 1.2s → 180ms');
  });

  it('定量成果が無ければ登録を促す文言になる', () => {
    const draft = buildNegotiationDraft(
      makeDataset({
        profile: makeProfile({ currentAnnualIncome: null }),
        projects: [makeProject({ impactMetric: '', result: '' })],
      }),
      10_000_000
    );
    expect(draft).toContain('自動で並びます');
  });
});
