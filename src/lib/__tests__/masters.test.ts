/** 福利厚生マスタとみなし残業評価のテスト。 */

import {
  BENEFITS_BY_CATEGORY,
  BENEFIT_MASTER,
  benefitLabel,
  describeFixedOvertime,
  isBenefitCode,
  mergeBenefitKeys,
  scoreFixedOvertime,
  toBenefitCode,
} from '../masters';

describe('福利厚生マスタ', () => {
  it('コードが重複していない', () => {
    const codes = BENEFIT_MASTER.map((item) => item.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('すべての項目がいずれかの分類に属する', () => {
    const grouped = BENEFITS_BY_CATEGORY.flatMap((group) => group.items);
    expect(grouped).toHaveLength(BENEFIT_MASTER.length);
  });

  it('コードからラベルを引ける', () => {
    expect(benefitLabel('housing_allowance')).toBe('住宅手当・家賃補助');
  });

  it('未知のコードはそのまま返す', () => {
    expect(benefitLabel('unknown_code')).toBe('unknown_code');
    expect(isBenefitCode('unknown_code')).toBe(false);
  });

  it('自由記述をマスタコードに寄せる（表記ゆれの吸収）', () => {
    expect(toBenefitCode('住宅手当')).toBe('housing_allowance');
    expect(toBenefitCode('家賃補助')).toBe('housing_allowance');
    expect(toBenefitCode('フレックス')).toBe('flextime');
    expect(toBenefitCode('書籍購入補助')).toBe('book_purchase');
    expect(toBenefitCode('交通費全額支給')).toBe('commuting_allowance');
  });

  it('マスタに無い記述は null を返す', () => {
    expect(toBenefitCode('社内 ISUCON')).toBeNull();
    expect(toBenefitCode('')).toBeNull();
  });

  it('マスタ選択と自由記述をまとめると重複が消える', () => {
    expect(mergeBenefitKeys(['housing_allowance'], ['家賃補助'])).toEqual([
      'housing_allowance',
    ]);
  });

  it('マスタに無い自由記述はそのまま比較対象に残る', () => {
    const keys = mergeBenefitKeys(['flextime'], ['社内 ISUCON']);
    expect(keys).toHaveLength(2);
    expect(keys).toContain('flextime');
  });
});

describe('scoreFixedOvertime', () => {
  it('未確認は判定不能（null）', () => {
    expect(scoreFixedOvertime('unknown', null, true, 20)).toBeNull();
  });

  it('みなし残業なしは満点', () => {
    expect(scoreFixedOvertime('none', null, true, 20)).toBe(100);
  });

  it('みなし残業ありを受け入れない希望なら 0 点', () => {
    expect(scoreFixedOvertime('included', 10, false, null)).toBe(0);
  });

  it('時間数が不明なら中間の点になる', () => {
    expect(scoreFixedOvertime('included', null, true, 20)).toBe(60);
  });

  it('許容上限の範囲内なら 70 点以上', () => {
    expect(scoreFixedOvertime('included', 0, true, 20)).toBe(100);
    expect(scoreFixedOvertime('included', 10, true, 20)).toBe(85);
    expect(scoreFixedOvertime('included', 20, true, 20)).toBe(70);
  });

  it('許容上限を超えると 60 点未満に下がる', () => {
    expect(scoreFixedOvertime('included', 30, true, 20)).toBeLessThan(60);
    expect(scoreFixedOvertime('included', 45, true, 20)).toBeLessThan(
      scoreFixedOvertime('included', 30, true, 20)!
    );
  });

  it('超過が大きくても 0 未満にはならない', () => {
    expect(scoreFixedOvertime('included', 200, true, 20)).toBe(0);
  });

  it('許容上限が未設定なら一般的な目安（20 / 45 時間）で採点する', () => {
    expect(scoreFixedOvertime('included', 20, true, null)).toBe(85);
    expect(scoreFixedOvertime('included', 45, true, null)).toBe(60);
    expect(scoreFixedOvertime('included', 46, true, null)).toBe(25);
  });
});

describe('describeFixedOvertime', () => {
  it('未確認・なしはそのまま説明する', () => {
    expect(describeFixedOvertime('unknown', null, null, false)).toBe(
      'みなし残業: 未確認'
    );
    expect(describeFixedOvertime('none', null, null, false)).toBe(
      'みなし残業: なし'
    );
  });

  it('ありのときは時間数・固定残業代・超過分の扱いを並べる', () => {
    expect(describeFixedOvertime('included', 45, 900_000, true)).toBe(
      'みなし残業: あり / 45 時間/月 / 90 万円/月 / 超過分は別途支給'
    );
    expect(describeFixedOvertime('included', 20, null, false)).toBe(
      'みなし残業: あり / 20 時間/月 / 超過分の支給は未確認'
    );
  });
});
