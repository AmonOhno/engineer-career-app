/**
 * 福利厚生マスタ。
 *
 * 求人票でよく見る一般的な項目をコード化して持つ。自由記述だけだと
 * 「住宅手当」「家賃補助」のような表記ゆれでマッチ度が当たらないため、
 * 選択式の項目（マスタ）に寄せる。マスタに無いものは自由記述で補う。
 *
 * 純粋関数のみ。
 */

import type { BenefitCategory, BenefitCode } from '../../types/career';

export interface BenefitMasterItem {
  code: BenefitCode;
  label: string;
  category: BenefitCategory;
  /** 表記ゆれの吸収に使う別名。小文字・前後空白除去で比較する。 */
  aliases: string[];
}

export const BENEFIT_CATEGORY_LABEL: Record<BenefitCategory, string> = {
  compensation: '報酬・手当',
  work_style: '働き方',
  leave: '休暇',
  growth: '学習・成長',
  welfare: '生活・健康',
};

/** 福利厚生マスタ本体。表示順はこの配列の順。 */
export const BENEFIT_MASTER: BenefitMasterItem[] = [
  // --- 報酬・手当 ---
  {
    code: 'housing_allowance',
    label: '住宅手当・家賃補助',
    category: 'compensation',
    aliases: ['住宅手当', '家賃補助', '住宅補助', '家賃手当'],
  },
  {
    code: 'commuting_allowance',
    label: '通勤交通費支給',
    category: 'compensation',
    aliases: ['通勤手当', '交通費支給', '交通費全額支給', '通勤交通費'],
  },
  {
    code: 'remote_allowance',
    label: 'リモート・在宅勤務手当',
    category: 'compensation',
    aliases: ['在宅手当', 'リモート手当', '在宅勤務手当', '光熱費補助'],
  },
  {
    code: 'family_allowance',
    label: '家族手当・扶養手当',
    category: 'compensation',
    aliases: ['家族手当', '扶養手当', '配偶者手当'],
  },
  {
    code: 'retirement_plan',
    label: '退職金制度',
    category: 'compensation',
    aliases: ['退職金', '退職金あり'],
  },
  {
    code: 'defined_contribution',
    label: '確定拠出年金（企業型DC）',
    category: 'compensation',
    aliases: ['確定拠出年金', '企業型DC', '401k'],
  },
  {
    code: 'stock_options',
    label: 'ストックオプション・株式報酬',
    category: 'compensation',
    aliases: ['ストックオプション', 'SO', 'RSU', '株式報酬'],
  },
  {
    code: 'employee_stock_plan',
    label: '従業員持株会',
    category: 'compensation',
    aliases: ['持株会', '従業員持株制度'],
  },
  {
    code: 'bonus',
    label: '賞与（年2回など）',
    category: 'compensation',
    aliases: ['賞与', 'ボーナス', '賞与年2回'],
  },

  // --- 働き方 ---
  {
    code: 'flextime',
    label: 'フレックスタイム制',
    category: 'work_style',
    aliases: ['フレックス', 'スーパーフレックス', 'コアタイムなし'],
  },
  {
    code: 'discretionary_work',
    label: '裁量労働制',
    category: 'work_style',
    aliases: ['裁量労働', '専門業務型裁量労働制'],
  },
  {
    code: 'remote_work',
    label: 'リモートワーク可',
    category: 'work_style',
    aliases: ['リモート可', '在宅勤務可', 'テレワーク', 'フルリモート'],
  },
  {
    code: 'side_job_allowed',
    label: '副業可',
    category: 'work_style',
    aliases: ['副業OK', '兼業可', '副業許可'],
  },
  {
    code: 'short_time_work',
    label: '時短勤務制度',
    category: 'work_style',
    aliases: ['時短勤務', '短時間勤務'],
  },
  {
    code: 'device_choice',
    label: 'PC・開発端末の選択自由',
    category: 'work_style',
    aliases: ['PC選択自由', '開発端末支給', 'MacBook支給'],
  },
  {
    code: 'casual_dress',
    label: '服装自由',
    category: 'work_style',
    aliases: ['服装自由', '私服OK'],
  },

  // --- 休暇 ---
  {
    code: 'two_day_weekend',
    label: '完全週休2日制',
    category: 'leave',
    aliases: ['完全週休二日制', '週休2日', '土日祝休み'],
  },
  {
    code: 'hourly_paid_leave',
    label: '有給の時間・半日単位取得',
    category: 'leave',
    aliases: ['時間単位有給', '半休制度', '半日有給'],
  },
  {
    code: 'refresh_leave',
    label: 'リフレッシュ休暇',
    category: 'leave',
    aliases: ['リフレッシュ休暇', '特別休暇'],
  },
  {
    code: 'childcare_leave',
    label: '育児休業・産前産後休業',
    category: 'leave',
    aliases: ['育休', '産休', '育児休暇', '産前産後休暇'],
  },
  {
    code: 'nursing_care_leave',
    label: '介護休業',
    category: 'leave',
    aliases: ['介護休暇', '介護休業制度'],
  },
  {
    code: 'sick_leave',
    label: '傷病休暇・慶弔休暇',
    category: 'leave',
    aliases: ['慶弔休暇', '病気休暇', '傷病休暇'],
  },

  // --- 学習・成長 ---
  {
    code: 'book_purchase',
    label: '書籍購入補助',
    category: 'growth',
    aliases: ['書籍購入支援', '書籍代補助', '技術書購入補助'],
  },
  {
    code: 'conference_support',
    label: 'カンファレンス参加費補助',
    category: 'growth',
    aliases: ['カンファレンス参加支援', '勉強会参加費補助', '登壇支援'],
  },
  {
    code: 'certification_support',
    label: '資格取得支援（受験料補助）',
    category: 'growth',
    aliases: ['資格取得支援', '資格支援', '受験料補助', '資格手当'],
  },
  {
    code: 'training_program',
    label: '研修制度・メンター制度',
    category: 'growth',
    aliases: ['研修制度', 'メンター制度', '新人研修'],
  },
  {
    code: 'oss_support',
    label: 'OSS・技術発信の支援',
    category: 'growth',
    aliases: ['OSS活動支援', '技術ブログ支援', '登壇費用補助'],
  },

  // --- 生活・健康 ---
  {
    code: 'social_insurance',
    label: '社会保険完備',
    category: 'welfare',
    aliases: ['社保完備', '各種社会保険完備', '社会保険'],
  },
  {
    code: 'health_checkup',
    label: '健康診断・人間ドック補助',
    category: 'welfare',
    aliases: ['健康診断', '人間ドック', '定期健診'],
  },
  {
    code: 'mental_health_care',
    label: '産業医・メンタルヘルスケア',
    category: 'welfare',
    aliases: ['産業医面談', 'メンタルヘルス', 'カウンセリング'],
  },
  {
    code: 'meal_support',
    label: '食事補助・社員食堂',
    category: 'welfare',
    aliases: ['食事補助', '社員食堂', 'ランチ補助'],
  },
  {
    code: 'childcare_support',
    label: '託児所・保育費補助',
    category: 'welfare',
    aliases: ['託児所', '保育費補助', 'ベビーシッター補助'],
  },
  {
    code: 'relocation_support',
    label: '引越し・転居費用支援',
    category: 'welfare',
    aliases: ['引越し支援', '転居費用補助', '赴任手当'],
  },
];

const BY_CODE = new Map(BENEFIT_MASTER.map((item) => [item.code, item]));

/** マスタの項目をカテゴリ順にまとめたもの。画面のチップ表示に使う。 */
export const BENEFITS_BY_CATEGORY: {
  category: BenefitCategory;
  label: string;
  items: BenefitMasterItem[];
}[] = (Object.keys(BENEFIT_CATEGORY_LABEL) as BenefitCategory[]).map(
  (category) => ({
    category,
    label: BENEFIT_CATEGORY_LABEL[category],
    items: BENEFIT_MASTER.filter((item) => item.category === category),
  })
);

/** コードに対応するマスタ項目。未知のコードは undefined。 */
export const findBenefit = (code: string): BenefitMasterItem | undefined =>
  BY_CODE.get(code as BenefitCode);

/** コードの表示名。未知のコードはコードをそのまま返す。 */
export const benefitLabel = (code: string): string =>
  findBenefit(code)?.label ?? code;

export const isBenefitCode = (value: string): value is BenefitCode =>
  BY_CODE.has(value as BenefitCode);

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[\s・･/／]/g, '').trim();

/**
 * 自由記述をマスタコードに寄せる。ラベル・別名との部分一致で判定する。
 * 対応するマスタが無ければ null（自由記述のまま扱う）。
 */
export const toBenefitCode = (input: string): BenefitCode | null => {
  const text = normalize(input);
  if (!text) return null;
  if (isBenefitCode(input)) return input;

  for (const item of BENEFIT_MASTER) {
    const candidates = [item.label, ...item.aliases].map(normalize);
    if (candidates.some((candidate) => candidate === text)) return item.code;
  }
  for (const item of BENEFIT_MASTER) {
    const candidates = [item.label, ...item.aliases].map(normalize);
    if (candidates.some((candidate) => text.includes(candidate))) return item.code;
  }
  return null;
};

/**
 * マスタ選択と自由記述をひとつの比較用リストにまとめる。
 * 自由記述はマスタに寄せられるものはコードへ、寄せられないものは
 * 正規化した文字列のまま返す。重複は取り除く。
 */
export const mergeBenefitKeys = (codes: string[], freeTexts: string[]): string[] => {
  const keys = new Set<string>();
  codes.forEach((code) => {
    if (code.trim()) keys.add(code.trim());
  });
  freeTexts.forEach((text) => {
    const code = toBenefitCode(text);
    if (code) {
      keys.add(code);
      return;
    }
    const normalized = normalize(text);
    if (normalized) keys.add(normalized);
  });
  return [...keys];
};
