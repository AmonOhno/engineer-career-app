/** 履歴書の「学歴・職歴」欄に並べる年表行の組み立て。 */

import type { CareerEducation, CareerExperience } from '../../types/career';
import { EMPLOYMENT_TYPE_LABEL } from '../format';

export interface ChronologyRow {
  /** 西暦。日付未入力の行は null。 */
  year: number | null;
  month: number | null;
  text: string;
}

const splitYearMonth = (
  date: string | null | undefined
): { year: number | null; month: number | null } => {
  if (!date) return { year: null, month: null };
  const [y, m] = date.split('-');
  const year = Number(y);
  const month = Number(m);
  return {
    year: Number.isFinite(year) ? year : null,
    month: Number.isFinite(month) ? month : null,
  };
};

const sortRows = (rows: ChronologyRow[]): ChronologyRow[] =>
  [...rows].sort((a, b) => {
    const ay = a.year ?? 9999;
    const by = b.year ?? 9999;
    if (ay !== by) return ay - by;
    return (a.month ?? 99) - (b.month ?? 99);
  });

/** 学歴の年表行。入学と卒業をそれぞれ 1 行にする。 */
export const buildEducationRows = (
  educations: CareerEducation[]
): ChronologyRow[] => {
  const rows: ChronologyRow[] = [];

  educations.forEach((education) => {
    const name = [education.schoolName, education.faculty]
      .filter((part) => part.trim().length > 0)
      .join(' ');
    if (!name) return;

    const start = splitYearMonth(education.startedOn);
    if (start.year) rows.push({ ...start, text: `${name} 入学` });

    const end = splitYearMonth(education.endedOn);
    if (end.year) {
      rows.push({ ...end, text: `${name} ${education.status || '卒業'}` });
    }
  });

  return sortRows(rows);
};

/** 職歴の年表行。在職中の会社には「現在に至る」を添える。 */
export const buildExperienceRows = (
  experiences: CareerExperience[]
): ChronologyRow[] => {
  const rows: ChronologyRow[] = [];

  experiences.forEach((experience) => {
    if (!experience.companyName.trim()) return;

    const employment = EMPLOYMENT_TYPE_LABEL[experience.employmentType];
    const suffix =
      experience.employmentType === 'full_time' ? '' : `（${employment}）`;

    const start = splitYearMonth(experience.startedOn);
    if (start.year) {
      rows.push({ ...start, text: `${experience.companyName} 入社${suffix}` });
    }

    const end = splitYearMonth(experience.endedOn);
    if (end.year) {
      rows.push({ ...end, text: '一身上の都合により退職' });
    }
  });

  const sorted = sortRows(rows);
  const hasCurrent = experiences.some(
    (experience) => experience.companyName.trim() && !experience.endedOn
  );
  if (hasCurrent) sorted.push({ year: null, month: null, text: '現在に至る' });

  return sorted;
};
