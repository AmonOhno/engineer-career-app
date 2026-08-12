/** 応募管理。希望条件とのマッチ度と、提示年収の比較を出す。 */

import { useState } from 'react';
import { useCareerStore } from '../stores/careerStore';
import type {
  ApplicationStatus,
  CareerApplication,
  RemotePreference,
} from '../types/career';
import {
  APPLICATION_STATUS_LABEL,
  REMOTE_PREFERENCE_LABEL,
  formatManYen,
} from '../lib/format';
import { createId } from '../lib/ids';
import { evaluateMatch } from '../lib/matching';
import {
  Button,
  Card,
  EmptyState,
  Field,
  ManYenInput,
  ScoreBar,
  Select,
  TagInput,
  TextArea,
  TextInput,
} from './ui';

const STATUS_OPTIONS = (
  Object.keys(APPLICATION_STATUS_LABEL) as ApplicationStatus[]
).map((value) => ({ value, label: APPLICATION_STATUS_LABEL[value] }));

const REMOTE_OPTIONS: { value: RemotePreference | ''; label: string }[] = [
  { value: '', label: '未確認' },
  ...(Object.keys(REMOTE_PREFERENCE_LABEL) as RemotePreference[]).map(
    (value) => ({ value, label: REMOTE_PREFERENCE_LABEL[value] })
  ),
];

const emptyApplication = (userId: string): CareerApplication => ({
  id: createId('application'),
  userId,
  companyName: '',
  jobTitle: '',
  source: '',
  agentName: '',
  status: 'wishlist',
  appliedOn: null,
  nextAction: '',
  nextActionOn: null,
  incomeRangeMin: null,
  incomeRangeMax: null,
  offeredIncome: null,
  jobUrl: '',
  location: '',
  remotePolicy: '',
  industry: '',
  techStack: [],
  benefits: [],
  memo: '',
});

export const ApplicationsPanel = ({ userId }: { userId: string }) => {
  const applications = useCareerStore((s) => s.applications);
  const preference = useCareerStore((s) => s.preference);
  const saveApplication = useCareerStore((s) => s.saveApplication);
  const deleteApplication = useCareerStore((s) => s.deleteApplication);

  const [form, setForm] = useState<CareerApplication>(() =>
    emptyApplication(userId)
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const update = <K extends keyof CareerApplication>(
    key: K,
    value: CareerApplication[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(emptyApplication(userId));
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.companyName.trim()) return;
    await saveApplication(form);
    reset();
  };

  return (
    <>
      <Card
        title={editingId ? '応募先を編集' : '応募先を追加'}
        description="求人票の提示レンジを入れると、希望条件とのマッチ度が出る。"
      >
        <div className="grid">
          <Field label="企業名">
            <TextInput
              value={form.companyName}
              onChange={(v) => update('companyName', v)}
            />
          </Field>
          <Field label="ポジション">
            <TextInput
              value={form.jobTitle}
              onChange={(v) => update('jobTitle', v)}
            />
          </Field>
          <Field label="ステータス">
            <Select
              value={form.status}
              onChange={(v) => update('status', v)}
              options={STATUS_OPTIONS}
            />
          </Field>
          <Field label="応募経路">
            <TextInput
              value={form.source}
              onChange={(v) => update('source', v)}
              placeholder="エージェント / スカウト / 直接応募"
            />
          </Field>
          <Field label="担当エージェント">
            <TextInput
              value={form.agentName}
              onChange={(v) => update('agentName', v)}
            />
          </Field>
          <Field label="応募日">
            <TextInput
              type="date"
              value={form.appliedOn ?? ''}
              onChange={(v) => update('appliedOn', v || null)}
            />
          </Field>
          <Field label="提示レンジ（下限）">
            <ManYenInput
              value={form.incomeRangeMin}
              onChange={(v) => update('incomeRangeMin', v)}
            />
          </Field>
          <Field label="提示レンジ（上限）">
            <ManYenInput
              value={form.incomeRangeMax}
              onChange={(v) => update('incomeRangeMax', v)}
            />
          </Field>
          <Field label="オファー年収">
            <ManYenInput
              value={form.offeredIncome}
              onChange={(v) => update('offeredIncome', v)}
            />
          </Field>
          <Field label="勤務地">
            <TextInput
              value={form.location}
              onChange={(v) => update('location', v)}
            />
          </Field>
          <Field label="リモート可否">
            <Select
              value={form.remotePolicy}
              onChange={(v) => update('remotePolicy', v)}
              options={REMOTE_OPTIONS}
            />
          </Field>
          <Field label="業界">
            <TextInput
              value={form.industry}
              onChange={(v) => update('industry', v)}
            />
          </Field>
          <Field label="技術スタック" hint="カンマ区切り">
            <TagInput
              value={form.techStack}
              onChange={(v) => update('techStack', v)}
            />
          </Field>
          <Field label="福利厚生" hint="カンマ区切り">
            <TagInput
              value={form.benefits}
              onChange={(v) => update('benefits', v)}
            />
          </Field>
          <Field label="次アクション">
            <TextInput
              value={form.nextAction}
              onChange={(v) => update('nextAction', v)}
              placeholder="一次面接 / 職務経歴書の提出"
            />
          </Field>
          <Field label="次アクション期日">
            <TextInput
              type="date"
              value={form.nextActionOn ?? ''}
              onChange={(v) => update('nextActionOn', v || null)}
            />
          </Field>
          <Field label="求人URL" wide>
            <TextInput
              type="url"
              value={form.jobUrl}
              onChange={(v) => update('jobUrl', v)}
            />
          </Field>
          <Field label="メモ" wide>
            <TextArea
              rows={3}
              value={form.memo}
              onChange={(v) => update('memo', v)}
            />
          </Field>
        </div>
        <div className="form-footer">
          <div className="form-footer__buttons">
            {editingId && (
              <Button variant="ghost" onClick={reset}>
                キャンセル
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={!form.companyName.trim()}>
              {editingId ? '更新する' : '追加する'}
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`応募一覧（${applications.length} 件）`}>
        {applications.length === 0 && (
          <EmptyState message="まだ応募先が登録されていない。" />
        )}
        {applications.map((application) => {
          const match = evaluateMatch(preference, application);
          return (
            <div key={application.id} className="record">
              <div className="record__head">
                <div>
                  <strong>
                    <span className="badge badge--status">
                      {APPLICATION_STATUS_LABEL[application.status]}
                    </span>
                    {application.companyName}
                  </strong>
                  <span className="record__meta">
                    {application.jobTitle}
                    {application.incomeRangeMax != null &&
                      ` ／ 提示 ${formatManYen(application.incomeRangeMin)} 〜 ${formatManYen(
                        application.incomeRangeMax
                      )}`}
                    {application.offeredIncome != null &&
                      ` ／ オファー ${formatManYen(application.offeredIncome)}`}
                  </span>
                </div>
                <div className="table__actions">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setForm(application);
                      setEditingId(application.id);
                    }}
                  >
                    編集
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => deleteApplication(application.id)}
                  >
                    削除
                  </Button>
                </div>
              </div>

              {match.score != null && (
                <div className="match">
                  <div className="match__head">
                    <span>希望条件とのマッチ度</span>
                    <strong>{match.score}%</strong>
                  </div>
                  <ScoreBar score={match.score} />
                  <div className="match__factors">
                    {match.factors
                      .filter((factor) => factor.score != null)
                      .map((factor) => (
                        <span key={factor.label} className="match__factor">
                          {factor.label}: {factor.score}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {match.unmetMustHaves.length > 0 && (
                <p className="record__body record__body--warn">
                  未充足の条件: {match.unmetMustHaves.join(' / ')}
                </p>
              )}

              {application.nextAction && (
                <p className="record__body">
                  次アクション: {application.nextAction}
                  {application.nextActionOn && `（${application.nextActionOn}）`}
                </p>
              )}
            </div>
          );
        })}
      </Card>
    </>
  );
};
