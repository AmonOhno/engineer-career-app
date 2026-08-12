/** 現在地ステータス（基本情報・年収・公開リンク）の編集画面。 */

import { useEffect, useState } from 'react';
import { useCareerStore, emptyProfile } from '../stores/careerStore';
import type { CareerProfile } from '../types/career';
import {
  Button,
  Card,
  Field,
  ManYenInput,
  NumberInput,
  TextArea,
  TextInput,
} from './ui';

export const ProfilePanel = ({ userId }: { userId: string }) => {
  const profile = useCareerStore((s) => s.profile);
  const saveProfile = useCareerStore((s) => s.saveProfile);
  const loading = useCareerStore((s) => s.loading);

  const [form, setForm] = useState<CareerProfile>(
    () => profile ?? emptyProfile(userId)
  );
  const [saved, setSaved] = useState(false);

  // 取得完了・ユーザー切り替えでフォームを読み直す
  useEffect(() => {
    setForm(profile ?? emptyProfile(userId));
  }, [profile, userId]);

  const update = <K extends keyof CareerProfile>(
    key: K,
    value: CareerProfile[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    await saveProfile(form);
    setSaved(true);
  };

  return (
    <>
      <Card
        title="基本情報"
        description="履歴書に転記される項目。ここが埋まっていないと書類は生成できない。"
      >
        <div className="grid">
          <Field label="氏名">
            <TextInput
              value={form.fullName}
              onChange={(v) => update('fullName', v)}
              placeholder="山田 太郎"
            />
          </Field>
          <Field label="フリガナ">
            <TextInput
              value={form.fullNameKana}
              onChange={(v) => update('fullNameKana', v)}
              placeholder="ヤマダ タロウ"
            />
          </Field>
          <Field label="生年月日">
            <TextInput
              type="date"
              value={form.birthDate ?? ''}
              onChange={(v) => update('birthDate', v || null)}
            />
          </Field>
          <Field label="性別（任意）">
            <TextInput value={form.gender} onChange={(v) => update('gender', v)} />
          </Field>
          <Field label="メールアドレス">
            <TextInput
              type="email"
              value={form.email}
              onChange={(v) => update('email', v)}
            />
          </Field>
          <Field label="電話番号">
            <TextInput
              type="tel"
              value={form.phone}
              onChange={(v) => update('phone', v)}
            />
          </Field>
          <Field label="郵便番号">
            <TextInput
              value={form.postalCode}
              onChange={(v) => update('postalCode', v)}
              placeholder="150-0001"
            />
          </Field>
          <Field label="住所" wide>
            <TextInput
              value={form.address}
              onChange={(v) => update('address', v)}
            />
          </Field>
          <Field label="最寄駅">
            <TextInput
              value={form.nearestStation}
              onChange={(v) => update('nearestStation', v)}
            />
          </Field>
        </div>
      </Card>

      <Card
        title="年収と目標"
        description="現年収と目標年収の差が、そのまま転職戦略の前提になる。"
      >
        <div className="grid">
          <Field label="現年収">
            <ManYenInput
              value={form.currentAnnualIncome}
              onChange={(v) => update('currentAnnualIncome', v)}
              placeholder="650"
            />
          </Field>
          <Field label="目標年収" hint="既定は 1000 万円">
            <ManYenInput
              value={form.targetAnnualIncome}
              onChange={(v) => update('targetAnnualIncome', v ?? 0)}
              placeholder="1000"
            />
          </Field>
          <Field label="転職希望時期">
            <TextInput
              type="date"
              value={form.jobChangeTargetDate ?? ''}
              onChange={(v) => update('jobChangeTargetDate', v || null)}
            />
          </Field>
          <Field label="エンジニア経験年数">
            <NumberInput
              value={form.yearsOfExperience}
              onChange={(v) => update('yearsOfExperience', v)}
              step={0.5}
            />
          </Field>
          <Field label="現在の勤務先">
            <TextInput
              value={form.currentCompany}
              onChange={(v) => update('currentCompany', v)}
            />
          </Field>
          <Field label="現在の役職・肩書">
            <TextInput
              value={form.currentJobTitle}
              onChange={(v) => update('currentJobTitle', v)}
              placeholder="テックリード / バックエンドエンジニア"
            />
          </Field>
        </div>
      </Card>

      <Card
        title="キャッチコピーと公開リンク"
        description="スカウトの提示額に効く項目。職務経歴書の冒頭にも使う。"
      >
        <div className="grid">
          <Field label="キャッチコピー" wide>
            <TextArea
              rows={2}
              value={form.headline}
              onChange={(v) => update('headline', v)}
              placeholder="決済基盤の SRE 兼バックエンドリード。可用性 99.99% を維持しながらリリース頻度を週次から日次へ。"
            />
          </Field>
          <Field label="GitHub">
            <TextInput
              type="url"
              value={form.githubUrl}
              onChange={(v) => update('githubUrl', v)}
            />
          </Field>
          <Field label="ポートフォリオ">
            <TextInput
              type="url"
              value={form.portfolioUrl}
              onChange={(v) => update('portfolioUrl', v)}
            />
          </Field>
          <Field label="技術ブログ">
            <TextInput
              type="url"
              value={form.blogUrl}
              onChange={(v) => update('blogUrl', v)}
            />
          </Field>
          <Field label="LinkedIn">
            <TextInput
              type="url"
              value={form.linkedinUrl}
              onChange={(v) => update('linkedinUrl', v)}
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
