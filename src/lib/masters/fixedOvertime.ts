/**
 * みなし残業（固定残業代）マスタと評価。
 *
 * 提示年収が同じでも「みなし残業 45 時間込み」かどうかで実質の条件は大きく変わる。
 * 自由記述に埋もれさせず、有無・時間数・固定残業代・超過分の扱いを項目として持つ。
 *
 * 純粋関数のみ。
 */

import type { FixedOvertimeType } from '../../types/career';

export const FIXED_OVERTIME_TYPE_LABEL: Record<FixedOvertimeType, string> = {
  unknown: '未確認',
  none: 'なし',
  included: 'あり（固定残業代込み）',
};

/**
 * 許容上限が未設定のときに使う目安（月/時間）。
 * 20 時間以内は一般的、45 時間は労働基準法の原則的な上限。
 */
export const FIXED_OVERTIME_COMMON_HOURS = 20;
export const FIXED_OVERTIME_LEGAL_HOURS = 45;

/**
 * みなし残業の充足度を 0〜100 で返す。判定材料が無ければ null。
 *
 * - 未確認: null（マッチ度の計算から除外する）
 * - なし: 100
 * - あり: 希望の許容上限に対する超過度合いで減点する。
 *   上限が未設定の場合は一般的な目安（20 時間 / 45 時間）で採点する。
 */
export const scoreFixedOvertime = (
  type: FixedOvertimeType,
  hours: number | null,
  allowFixedOvertime: boolean,
  maxHours: number | null
): number | null => {
  if (type === 'unknown') return null;
  if (type === 'none') return 100;
  // 以降は「みなし残業あり」
  if (!allowFixedOvertime) return 0;
  if (hours == null) return 60; // あることは分かるが時間数が不明

  if (maxHours == null || maxHours <= 0) {
    if (hours <= FIXED_OVERTIME_COMMON_HOURS) return 85;
    if (hours <= FIXED_OVERTIME_LEGAL_HOURS) return 60;
    return 25;
  }

  if (hours <= maxHours) {
    // 上限に近づくほど下げる（上限ちょうどで 70、0 時間で 100）
    return 100 - Math.round((hours / maxHours) * 30);
  }
  // 上限超過。超過幅が上限と同じだけあれば 0 になる
  return Math.max(0, Math.round(60 - ((hours - maxHours) / maxHours) * 60));
};

/** みなし残業の内容を 1 行で説明する。画面と警告の文言に使う。 */
export const describeFixedOvertime = (
  type: FixedOvertimeType,
  hours: number | null,
  allowance: number | null,
  paidBeyond: boolean
): string => {
  if (type === 'unknown') return 'みなし残業: 未確認';
  if (type === 'none') return 'みなし残業: なし';

  const parts = ['みなし残業: あり'];
  if (hours != null) parts.push(`${hours} 時間/月`);
  if (allowance != null) {
    parts.push(`${Math.round(allowance / 10_000)} 万円/月`);
  }
  parts.push(paidBeyond ? '超過分は別途支給' : '超過分の支給は未確認');
  return parts.join(' / ');
};
