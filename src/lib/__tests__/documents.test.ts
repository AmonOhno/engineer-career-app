import {
  buildCareerHistoryMarkdown,
  buildResumeMarkdown,
  buildSkillSheetMarkdown,
  buildWishSection,
  calculateAge,
  generateDocument,
  markdownToHtml,
} from '../documents';
import {
  buildEducationRows,
  buildExperienceRows,
} from '../documents/chronology';
import {
  makeApplication,
  makeDataset,
  makeEducation,
  makeExperience,
  makeHighlight,
  makePreference,
  makeProfile,
  makeProject,
} from './fixtures';

const ASOF = new Date('2026-08-12T00:00:00Z');

describe('calculateAge', () => {
  it('誕生日を迎えていれば満年齢がそのまま', () => {
    expect(calculateAge('1992-04-10', ASOF)).toBe(34);
  });

  it('誕生日前なら 1 引く', () => {
    expect(calculateAge('1992-12-31', ASOF)).toBe(33);
  });

  it('未入力なら null', () => {
    expect(calculateAge(null, ASOF)).toBeNull();
  });
});

describe('chronology', () => {
  it('学歴は入学と卒業の 2 行になり、年月順に並ぶ', () => {
    const rows = buildEducationRows([
      makeEducation({ startedOn: '2011-04-01', endedOn: '2015-03-31' }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ year: 2011, month: 4 });
    expect(rows[0].text).toContain('入学');
    expect(rows[1].text).toContain('卒業');
  });

  it('在職中の職歴には「現在に至る」を付ける', () => {
    const rows = buildExperienceRows([makeExperience({ endedOn: null })]);
    expect(rows[rows.length - 1].text).toBe('現在に至る');
  });

  it('退職済みなら退職行が入り、「現在に至る」は付かない', () => {
    const rows = buildExperienceRows([
      makeExperience({ startedOn: '2016-04-01', endedOn: '2020-03-31' }),
    ]);
    expect(rows.map((row) => row.text)).toEqual([
      expect.stringContaining('入社'),
      '一身上の都合により退職',
    ]);
  });

  it('正社員以外は雇用形態を括弧書きにする', () => {
    const rows = buildExperienceRows([
      makeExperience({ employmentType: 'freelance', endedOn: null }),
    ]);
    expect(rows[0].text).toContain('業務委託');
  });
});

describe('buildResumeMarkdown', () => {
  it('氏名・生年月日・学歴職歴・資格・自己PR が含まれる', () => {
    const dataset = makeDataset({
      highlights: [
        makeHighlight({ kind: 'self_pr', body: '課題を数値で捉えて改善します。' }),
      ],
    });
    const markdown = buildResumeMarkdown(dataset, { asOf: ASOF });

    expect(markdown).toContain('# 履歴書');
    expect(markdown).toContain('山田 太郎');
    expect(markdown).toContain('満 34 歳');
    expect(markdown).toContain('サンプル大学');
    expect(markdown).toContain('応用情報技術者');
    expect(markdown).toContain('課題を数値で捉えて改善します。');
    expect(markdown).toContain('以上');
  });

  it('プロフィール未登録でも例外にならない', () => {
    const markdown = buildResumeMarkdown(
      makeDataset({
        profile: null,
        educations: [],
        certifications: [],
        highlights: [],
      }),
      { asOf: ASOF }
    );
    expect(markdown).toContain('# 履歴書');
    expect(markdown).toContain('特になし');
  });
});

describe('buildWishSection', () => {
  it('希望条件から本人希望記入欄を組み立てる', () => {
    const text = buildWishSection(makeDataset());
    expect(text).toContain('希望職種: バックエンドエンジニア');
    expect(text).toContain('900 万円以上');
    expect(text).toContain('フルリモート希望');
    expect(text).toContain('貴社規定に従います。');
  });

  it('希望条件が未登録なら定型文だけを返す', () => {
    expect(buildWishSection(makeDataset({ preference: null }))).toBe(
      '貴社規定に従います。'
    );
  });

  it('条件が空配列なら定型文だけを返す', () => {
    const preference = makePreference({
      desiredJobTitles: [],
      desiredLocations: [],
      desiredIncomeMin: null,
      incomeFloor: null,
      remotePreference: 'any',
      mustHaveConditions: [],
    });
    expect(buildWishSection(makeDataset({ preference }))).toBe(
      '貴社規定に従います。'
    );
  });
});

describe('buildCareerHistoryMarkdown', () => {
  it('会社の下にプロジェクトがぶら下がる', () => {
    const markdown = buildCareerHistoryMarkdown(makeDataset(), { asOf: ASOF });
    const companyIndex = markdown.indexOf('株式会社サンプル');
    const projectIndex = markdown.indexOf('決済基盤リプレース');

    expect(companyIndex).toBeGreaterThan(-1);
    expect(projectIndex).toBeGreaterThan(companyIndex);
    expect(markdown).toContain('**成果**: リリース頻度を日次化 / p95 1.2s → 180ms');
  });

  it('会社に紐づかないプロジェクトは「その他」にまとまる', () => {
    const dataset = makeDataset({
      projects: [makeProject({ experienceId: null, name: '個人開発アプリ' })],
    });
    const markdown = buildCareerHistoryMarkdown(dataset, { asOf: ASOF });
    expect(markdown).toContain('その他（個人開発・社外活動）');
    expect(markdown).toContain('個人開発アプリ');
  });

  it('主力プロジェクトが先に並ぶ', () => {
    const dataset = makeDataset({
      projects: [
        makeProject({
          id: 'proj_old',
          name: '通常案件',
          isHighlighted: false,
          startedOn: '2025-01-01',
        }),
        makeProject({ id: 'proj_main', name: '主力案件', isHighlighted: true }),
      ],
    });
    const markdown = buildCareerHistoryMarkdown(dataset, { asOf: ASOF });
    expect(markdown.indexOf('主力案件')).toBeLessThan(markdown.indexOf('通常案件'));
  });
});

describe('buildSkillSheetMarkdown', () => {
  it('分類ごとの表と案件一覧が出る', () => {
    const markdown = buildSkillSheetMarkdown(makeDataset(), { asOf: ASOF });
    expect(markdown).toContain('# スキルシート');
    expect(markdown).toContain('### 言語');
    expect(markdown).toContain('TypeScript');
    expect(markdown).toContain('決済基盤リプレース');
  });
});

describe('generateDocument', () => {
  it('種別と氏名からタイトルを組み立てる', () => {
    const result = generateDocument('career_history', makeDataset(), { asOf: ASOF });
    expect(result.title).toBe('職務経歴書_山田 太郎');
    expect(result.markdown).toContain('# 職務経歴書');
  });

  it('応募先を指定するとタイトルに企業名が入る', () => {
    const result = generateDocument('resume', makeDataset(), {
      asOf: ASOF,
      application: makeApplication({ companyName: '株式会社ターゲット' }),
    });
    expect(result.title).toContain('株式会社ターゲット');
    expect(result.markdown).toContain('株式会社ターゲット 御中');
  });

  it('氏名未入力でもタイトルが壊れない', () => {
    const result = generateDocument(
      'skill_sheet',
      makeDataset({ profile: makeProfile({ fullName: '' }) }),
      { asOf: ASOF }
    );
    expect(result.title).toBe('スキルシート');
  });
});

describe('markdownToHtml', () => {
  it('見出し・表・箇条書きを変換する', () => {
    const html = markdownToHtml(
      ['# 見出し', '', '| A | B |', '| --- | --- |', '| 1 | 2 |', '', '- 項目'].join(
        '\n'
      )
    );
    expect(html).toContain('<h1>見出し</h1>');
    expect(html).toContain('<th>A</th>');
    expect(html).toContain('<td>1</td>');
    expect(html).toContain('<li>項目</li>');
  });

  it('HTML をエスケープしつつ <br> と強調だけ通す', () => {
    const html = markdownToHtml('**強調**と<script>alert(1)</script>と改行<br>後ろ');
    expect(html).toContain('<strong>強調</strong>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('改行<br>後ろ');
  });
});
