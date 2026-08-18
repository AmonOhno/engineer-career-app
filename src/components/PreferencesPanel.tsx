/**
 * 希望条件の編集画面。
 * 「業務内容の希望」と「業務内容以外の希望」を分けて持つ。
 */

import { useEffect, useState } from 'react';
import { useCareerStore, emptyPreference } from '../stores/careerStore';
import { useDraftState } from '../stores/draftStore';
import type {
  BenefitCode,
  CareerPreference,
  EmploymentType,
  ProjectPhase,
  RemotePreference,
} from '../types/career';
import {
  EMPLOYMENT_TYPE_LABEL,
  PROJECT_PHASE_LABEL,
  REMOTE_PREFERENCE_LABEL,
} from '../lib/format';
import { BenefitSelector } from './BenefitSelector';
import {
  Button,
  Card,
  Checkbox,
  ChipToggles,
  Field,
  ManYenInput,
  NumberInput,
  Select,
  TagInput,
  TextArea,
  TextInput,
} from './ui';

const REMOTE_OPTIONS = (
  Object.keys(REMOTE_PREFERENCE_LABEL) as RemotePreference[]
).map((value) => ({ value, label: REMOTE_PREFERENCE_LABEL[value] }));

const PHASE_OPTIONS = (Object.keys(PROJECT_PHASE_LABEL) as ProjectPhase[]).map(
  (value) => ({ value, label: PROJECT_PHASE_LABEL[value] })
);

const EMPLOYMENT_OPTIONS = (
  Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]
).map((value) => ({ value, label: EMPLOYMENT_TYPE_LABEL[value] }));

export const PreferencesPanel = ({ userId }: { userId: string }) => {
  const preference = useCareerStore((s) => s.preference);
  const savePreference = useCareerStore((s) => s.savePreference);
  const loading = useCareerStore((s) => s.loading);

  // 下書きストアに保持する。タブを切り替えて戻っても入力内容が残る。
  const [form, setForm, hasDraft] = useDraftState<CareerPreference>(
    'preferences:form',
    () => preference ?? emptyPreference(userId)
  );
  const [saved, setSaved] = useState(false);

  // 取得完了でフォームを読み直す。編集中の下書きがある場合は上書きしない。
  useEffect(() => {
    if (hasDraft || !preference) return;
    setForm(preference);
  }, [hasDraft, preference]);

  const update = <K extends keyof CareerPreference>(
    key: K,
    value: CareerPreference[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    await savePreference(form);
    setSaved(true);
  };

  return (
    <>
      <Card
        title="業務内容の希望条件"
        description="応募先とのマッチ度計算と、履歴書の本人希望記入欄に使う。"
      >
        <div className="grid">
          <Field label="希望職種" hint="カンマ区切り">
            <TagInput
              value={form.desiredJobTitles}
              onChange={(v) => update('desiredJobTitles', v)}
              placeholder="バックエンドエンジニア, SRE, テックリード"
            />
          </Field>
          <Field label="希望する役割" hint="カンマ区切り">
            <TagInput
              value={form.desiredRoles}
              onChange={(v) => update('desiredRoles', v)}
              placeholder="設計主導, チームリード, 技術選定"
            />
          </Field>
          <Field label="希望業界" hint="カンマ区切り">
            <TagInput
              value={form.desiredIndustries}
              onChange={(v) => update('desiredIndustries', v)}
              placeholder="SaaS, フィンテック, ヘルスケア"
            />
          </Field>
          <Field label="希望プロジェクト" hint="カンマ区切り">
            <TagInput
              value={form.desiredProjectTypes}
              onChange={(v) => update('desiredProjectTypes', v)}
              placeholder="自社プロダクト開発, 基盤刷新, 新規立ち上げ"
            />
          </Field>
          <Field label="希望技術スタック" hint="カンマ区切り">
            <TagInput
              value={form.desiredTechStack}
              onChange={(v) => update('desiredTechStack', v)}
              placeholder="TypeScript, Go, AWS, Kubernetes"
            />
          </Field>
          <Field label="避けたい技術・環境" hint="カンマ区切り">
            <TagInput
              value={form.avoidTechStack}
              onChange={(v) => update('avoidTechStack', v)}
              placeholder="常駐SES, レガシーVB"
            />
          </Field>
          <Field label="希望する開発スタイル" wide>
            <TextInput
              value={form.desiredTeamStyle}
              onChange={(v) => update('desiredTeamStyle', v)}
              placeholder="少人数チームで裁量が大きく、設計から関われる"
            />
          </Field>
        </div>
        <Field label="担当したい工程" wide>
          <ChipToggles
            value={form.desiredPhases}
            onChange={(v) => update('desiredPhases', v)}
            options={PHASE_OPTIONS}
          />
        </Field>
      </Card>

      <Card
        title="業務内容以外の希望条件"
        description="年収の下限はマッチ度計算で絶対条件として扱われる。"
      >
        <div className="grid">
          <Field label="理想年収" hint="目標は 1000 万円">
            <ManYenInput
              value={form.desiredIncomeIdeal}
              onChange={(v) => update('desiredIncomeIdeal', v ?? 0)}
            />
          </Field>
          <Field label="希望年収（下限）">
            <ManYenInput
              value={form.desiredIncomeMin}
              onChange={(v) => update('desiredIncomeMin', v)}
            />
          </Field>
          <Field label="絶対に下回れない年収">
            <ManYenInput
              value={form.incomeFloor}
              onChange={(v) => update('incomeFloor', v)}
            />
          </Field>
          <Field label="希望勤務地" hint="カンマ区切り">
            <TagInput
              value={form.desiredLocations}
              onChange={(v) => update('desiredLocations', v)}
              placeholder="東京都, リモート"
            />
          </Field>
          <Field label="勤務形態">
            <Select
              value={form.remotePreference}
              onChange={(v) => update('remotePreference', v)}
              options={REMOTE_OPTIONS}
            />
          </Field>
          <Field label="通勤時間の上限（分）">
            <NumberInput
              value={form.maxCommuteMinutes}
              onChange={(v) => update('maxCommuteMinutes', v)}
            />
          </Field>
          <Field label="許容できる残業時間（月/時間）">
            <NumberInput
              value={form.acceptableOvertimeHours}
              onChange={(v) => update('acceptableOvertimeHours', v)}
            />
          </Field>
          <Field label="年間休日の下限（日）">
            <NumberInput
              value={form.minHolidays}
              onChange={(v) => update('minHolidays', v)}
            />
          </Field>
          <Field label="希望する企業規模" hint="カンマ区切り">
            <TagInput
              value={form.desiredCompanySizes}
              onChange={(v) => update('desiredCompanySizes', v)}
              placeholder="スタートアップ, 100〜500名"
            />
          </Field>
        </div>
        <Field label="希望する雇用形態" wide>
          <ChipToggles
            value={form.desiredEmploymentTypes}
            onChange={(v) => update('desiredEmploymentTypes', v)}
            options={EMPLOYMENT_OPTIONS}
          />
        </Field>
        <div className="inline-checks">
          <Checkbox
            label="副業可であること"
            checked={form.sideJobRequired}
            onChange={(v) => update('sideJobRequired', v)}
          />
          <Checkbox
            label="フレックス / 裁量労働であること"
            checked={form.flextimeRequired}
            onChange={(v) => update('flextimeRequired', v)}
          />
        </div>
      </Card>

      <Card
        title="福利厚生の希望"
        description="一般的な項目はマスタから選ぶ。応募先の福利厚生と突き合わせてマッチ度に反映される。"
      >
        <BenefitSelector
          value={form.desiredBenefitCodes}
          onChange={(v) => update('desiredBenefitCodes', v as BenefitCode[])}
        />
        <div className="grid">
          <Field
            label="その他の希望（マスタにない項目）"
            hint="カンマ区切り"
            wide
          >
            <TagInput
              value={form.desiredBenefits}
              onChange={(v) => update('desiredBenefits', v)}
              placeholder="社内 ISUCON, 技術顧問との1on1"
            />
          </Field>
        </div>
      </Card>

      <Card
        title="みなし残業（固定残業代）の希望"
        description="同じ提示年収でも、みなし残業の時間数で実質の条件は変わる。許容上限を超える求人は未充足条件として警告する。"
      >
        <div className="grid">
          <Field
            label="許容できるみなし残業時間（月/時間）"
            hint="未入力なら 20 時間以内を一般的な水準として採点する"
          >
            <NumberInput
              value={form.maxFixedOvertimeHours}
              onChange={(v) => update('maxFixedOvertimeHours', v)}
            />
          </Field>
        </div>
        <div className="inline-checks">
          <Checkbox
            label="みなし残業ありの求人も受け入れる"
            checked={form.allowFixedOvertime}
            onChange={(v) => update('allowFixedOvertime', v)}
          />
          <Checkbox
            label="超過分が別途支給されること"
            checked={form.requireOvertimePayBeyondFixed}
            onChange={(v) => update('requireOvertimePayBeyondFixed', v)}
          />
        </div>
      </Card>

      <Card
        title="優先順位と転職理由"
        description="絶対条件を満たさない求人は、応募管理でマッチ度の警告が出る。"
      >
        <div className="grid">
          <Field label="絶対条件（Must）" hint="カンマ区切り" wide>
            <TagInput
              value={form.mustHaveConditions}
              onChange={(v) => update('mustHaveConditions', v)}
              placeholder="フルリモート, 自社プロダクト"
            />
          </Field>
          <Field label="あれば嬉しい条件（Want）" hint="カンマ区切り" wide>
            <TagInput
              value={form.niceToHaveConditions}
              onChange={(v) => update('niceToHaveConditions', v)}
            />
          </Field>
          <Field label="受け入れられない条件（NG）" hint="カンマ区切り" wide>
            <TagInput
              value={form.dealBreakers}
              onChange={(v) => update('dealBreakers', v)}
              placeholder="客先常駐, みなし残業45時間超"
            />
          </Field>
          <Field label="転職理由" wide hint="面接と書類で一貫させるために書いておく">
            <TextArea
              rows={3}
              value={form.jobChangeReason}
              onChange={(v) => update('jobChangeReason', v)}
            />
          </Field>
          <Field label="メモ" wide>
            <TextArea
              rows={3}
              value={form.note}
              onChange={(v) => update('note', v)}
            />
          </Field>
        </div>
        <div className="form-footer">
          <Button onClick={handleSave} disabled={loading}>
            保存する
          </Button>
          {saved && <span className="saved-note">保存しました</span>}
        </div>
      </Card>
    </>
  );
};
