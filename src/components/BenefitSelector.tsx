/**
 * 福利厚生マスタからの選択 UI。
 * 希望条件（希望する福利厚生）と応募管理（求人票に記載の福利厚生）で共用する。
 */

import type { BenefitCode } from '../types/career';
import { BENEFITS_BY_CATEGORY } from '../lib/masters';
import { ChipToggles } from './ui';

export const BenefitSelector = ({
  value,
  onChange,
}: {
  value: BenefitCode[];
  onChange: (value: BenefitCode[]) => void;
}) => (
  <div className="benefit-groups">
    {BENEFITS_BY_CATEGORY.map((group) => (
      <div key={group.category} className="benefit-group">
        <span className="benefit-group__label">{group.label}</span>
        <ChipToggles
          value={value}
          onChange={onChange}
          options={group.items.map((item) => ({
            value: item.code,
            label: item.label,
          }))}
        />
      </div>
    ))}
  </div>
);
