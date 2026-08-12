/** 職歴と経験プロジェクトの登録画面。プロジェクトは課題・施策・成果で持つ。 */

import { useState } from 'react';
import { useCareerStore } from '../stores/careerStore';
import type {
  CareerExperience,
  CareerProject,
  EmploymentType,
  ProjectPhase,
} from '../types/career';
import {
  EMPLOYMENT_TYPE_LABEL,
  PROJECT_PHASE_LABEL,
  formatManYen,
  formatPeriod,
} from '../lib/format';
import { createId } from '../lib/ids';
import {
  Button,
  Card,
  Checkbox,
  ChipToggles,
  EmptyState,
  Field,
  ManYenInput,
  NumberInput,
  Select,
  TagInput,
  TextArea,
  TextInput,
} from './ui';

const EMPLOYMENT_OPTIONS = (
  Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]
).map((value) => ({ value, label: EMPLOYMENT_TYPE_LABEL[value] }));

const PHASE_OPTIONS = (Object.keys(PROJECT_PHASE_LABEL) as ProjectPhase[]).map(
  (value) => ({ value, label: PROJECT_PHASE_LABEL[value] })
);

const emptyExperience = (userId: string): CareerExperience => ({
  id: createId('experience'),
  userId,
  companyName: '',
  employmentType: 'full_time',
  startedOn: '',
  endedOn: null,
  jobTitle: '',
  department: '',
  industry: '',
  headcount: null,
  annualIncome: null,
  businessDescription: '',
  achievements: '',
  sortOrder: 0,
});

const emptyProject = (userId: string): CareerProject => ({
  id: createId('project'),
  userId,
  experienceId: null,
  name: '',
  startedOn: '',
  endedOn: null,
  role: '',
  teamSize: null,
  industry: '',
  overview: '',
  responsibilities: '',
  challenge: '',
  action: '',
  result: '',
  impactMetric: '',
  techStack: [],
  phases: [],
  isHighlighted: false,
  sortOrder: 0,
});

const ExperienceForm = ({ userId }: { userId: string }) => {
  const experiences = useCareerStore((s) => s.experiences);
  const saveExperience = useCareerStore((s) => s.saveExperience);
  const deleteExperience = useCareerStore((s) => s.deleteExperience);

  const [form, setForm] = useState<CareerExperience>(() => emptyExperience(userId));
  const [editingId, setEditingId] = useState<string | null>(null);

  const update = <K extends keyof CareerExperience>(
    key: K,
    value: CareerExperience[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(emptyExperience(userId));
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.companyName.trim() || !form.startedOn) return;
    await saveExperience(form);
    reset();
  };

  return (
    <>
      <Card
        title={editingId ? '職歴を編集' : '職歴を追加'}
        description="会社ごとの在籍期間と年収。年収推移は交渉材料になるので入れておく。"
      >
        <div className="grid">
          <Field label="会社名">
            <TextInput
              value={form.companyName}
              onChange={(v) => update('companyName', v)}
            />
          </Field>
          <Field label="雇用形態">
            <Select
              value={form.employmentType}
              onChange={(v) => update('employmentType', v)}
              options={EMPLOYMENT_OPTIONS}
            />
          </Field>
          <Field label="入社日">
            <TextInput
              type="date"
              value={form.startedOn}
              onChange={(v) => update('startedOn', v)}
            />
          </Field>
          <Field label="退社日" hint="在職中は空欄">
            <TextInput
              type="date"
              value={form.endedOn ?? ''}
              onChange={(v) => update('endedOn', v || null)}
            />
          </Field>
          <Field label="役職">
            <TextInput
              value={form.jobTitle}
              onChange={(v) => update('jobTitle', v)}
            />
          </Field>
          <Field label="所属部署">
            <TextInput
              value={form.department}
              onChange={(v) => update('department', v)}
            />
          </Field>
          <Field label="業界">
            <TextInput
              value={form.industry}
              onChange={(v) => update('industry', v)}
            />
          </Field>
          <Field label="従業員数">
            <NumberInput
              value={form.headcount}
              onChange={(v) => update('headcount', v)}
            />
          </Field>
          <Field label="在籍時の年収">
            <ManYenInput
              value={form.annualIncome}
              onChange={(v) => update('annualIncome', v)}
            />
          </Field>
          <Field label="事業内容" wide>
            <TextArea
              rows={2}
              value={form.businessDescription}
              onChange={(v) => update('businessDescription', v)}
            />
          </Field>
          <Field label="在籍中の実績" wide>
            <TextArea
              rows={2}
              value={form.achievements}
              onChange={(v) => update('achievements', v)}
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
            <Button
              onClick={handleSubmit}
              disabled={!form.companyName.trim() || !form.startedOn}
            >
              {editingId ? '更新する' : '追加する'}
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`職歴（${experiences.length} 社）`}>
        {experiences.length === 0 && <EmptyState message="まだ職歴が登録されていない。" />}
        {experiences.map((experience) => (
          <div key={experience.id} className="record">
            <div className="record__head">
              <div>
                <strong>{experience.companyName}</strong>
                <span className="record__meta">
                  {formatPeriod(experience.startedOn, experience.endedOn)} ／{' '}
                  {EMPLOYMENT_TYPE_LABEL[experience.employmentType]}
                  {experience.jobTitle && ` ／ ${experience.jobTitle}`}
                  {experience.annualIncome != null &&
                    ` ／ ${formatManYen(experience.annualIncome)}`}
                </span>
              </div>
              <div className="table__actions">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setForm(experience);
                    setEditingId(experience.id);
                  }}
                >
                  編集
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteExperience(experience.id)}
                >
                  削除
                </Button>
              </div>
            </div>
            {experience.achievements && (
              <p className="record__body">{experience.achievements}</p>
            )}
          </div>
        ))}
      </Card>
    </>
  );
};

const ProjectForm = ({ userId }: { userId: string }) => {
  const experiences = useCareerStore((s) => s.experiences);
  const projects = useCareerStore((s) => s.projects);
  const saveProject = useCareerStore((s) => s.saveProject);
  const deleteProject = useCareerStore((s) => s.deleteProject);

  const [form, setForm] = useState<CareerProject>(() => emptyProject(userId));
  const [editingId, setEditingId] = useState<string | null>(null);

  const update = <K extends keyof CareerProject>(
    key: K,
    value: CareerProject[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(emptyProject(userId));
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await saveProject(form);
    reset();
  };

  const experienceOptions = [
    { value: '', label: '（個人開発・社外活動）' },
    ...experiences.map((experience) => ({
      value: experience.id,
      label: experience.companyName,
    })),
  ];

  return (
    <>
      <Card
        title={editingId ? 'プロジェクトを編集' : 'プロジェクトを追加'}
        description="課題 → 施策 → 成果の順で書く。成果は必ず数値を入れる（1000 万円レンジの評価軸）。"
      >
        <div className="grid">
          <Field label="プロジェクト名">
            <TextInput value={form.name} onChange={(v) => update('name', v)} />
          </Field>
          <Field label="所属会社">
            <Select
              value={form.experienceId ?? ''}
              onChange={(v) => update('experienceId', v || null)}
              options={experienceOptions}
            />
          </Field>
          <Field label="開始日">
            <TextInput
              type="date"
              value={form.startedOn}
              onChange={(v) => update('startedOn', v)}
            />
          </Field>
          <Field label="終了日" hint="継続中は空欄">
            <TextInput
              type="date"
              value={form.endedOn ?? ''}
              onChange={(v) => update('endedOn', v || null)}
            />
          </Field>
          <Field label="役割">
            <TextInput
              value={form.role}
              onChange={(v) => update('role', v)}
              placeholder="テックリード / バックエンド"
            />
          </Field>
          <Field label="チーム規模（名）">
            <NumberInput
              value={form.teamSize}
              onChange={(v) => update('teamSize', v)}
            />
          </Field>
          <Field label="業界">
            <TextInput
              value={form.industry}
              onChange={(v) => update('industry', v)}
            />
          </Field>
          <Field label="使用技術" hint="カンマ区切り">
            <TagInput
              value={form.techStack}
              onChange={(v) => update('techStack', v)}
              placeholder="TypeScript, AWS, Kubernetes"
            />
          </Field>
          <Field label="概要" wide>
            <TextArea
              rows={2}
              value={form.overview}
              onChange={(v) => update('overview', v)}
            />
          </Field>
          <Field label="担当業務" wide>
            <TextArea
              rows={2}
              value={form.responsibilities}
              onChange={(v) => update('responsibilities', v)}
            />
          </Field>
          <Field label="課題" wide>
            <TextArea
              rows={2}
              value={form.challenge}
              onChange={(v) => update('challenge', v)}
              placeholder="リリースが月次で、障害検知が顧客報告頼みだった"
            />
          </Field>
          <Field label="実施施策" wide>
            <TextArea
              rows={2}
              value={form.action}
              onChange={(v) => update('action', v)}
            />
          </Field>
          <Field label="成果" wide>
            <TextArea
              rows={2}
              value={form.result}
              onChange={(v) => update('result', v)}
            />
          </Field>
          <Field label="定量成果" wide hint="数値だけを抜き出して書く">
            <TextInput
              value={form.impactMetric}
              onChange={(v) => update('impactMetric', v)}
              placeholder="p95 レイテンシ 1.2s → 180ms / 障害検知時間 90 分 → 3 分"
            />
          </Field>
        </div>
        <Field label="担当工程" wide>
          <ChipToggles
            value={form.phases}
            onChange={(v) => update('phases', v)}
            options={PHASE_OPTIONS}
          />
        </Field>
        <div className="form-footer">
          <Checkbox
            label="主力プロジェクトとして書類の先頭に出す"
            checked={form.isHighlighted}
            onChange={(v) => update('isHighlighted', v)}
          />
          <div className="form-footer__buttons">
            {editingId && (
              <Button variant="ghost" onClick={reset}>
                キャンセル
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={!form.name.trim()}>
              {editingId ? '更新する' : '追加する'}
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`プロジェクト（${projects.length} 件）`}>
        {projects.length === 0 && (
          <EmptyState message="まだプロジェクトが登録されていない。" />
        )}
        {projects.map((project) => (
          <div key={project.id} className="record">
            <div className="record__head">
              <div>
                <strong>
                  {project.isHighlighted && <span className="badge">主力</span>}
                  {project.name}
                </strong>
                <span className="record__meta">
                  {formatPeriod(project.startedOn, project.endedOn)}
                  {project.role && ` ／ ${project.role}`}
                  {project.teamSize != null && ` ／ ${project.teamSize} 名`}
                </span>
              </div>
              <div className="table__actions">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setForm(project);
                    setEditingId(project.id);
                  }}
                >
                  編集
                </Button>
                <Button variant="danger" onClick={() => deleteProject(project.id)}>
                  削除
                </Button>
              </div>
            </div>
            {project.impactMetric ? (
              <p className="record__body record__body--metric">
                {project.impactMetric}
              </p>
            ) : (
              <p className="record__body record__body--warn">
                定量成果が未入力。数値が無いと年収レンジの引き上げに使いにくい。
              </p>
            )}
            {project.techStack.length > 0 && (
              <p className="record__tags">{project.techStack.join(' / ')}</p>
            )}
          </div>
        ))}
      </Card>
    </>
  );
};

export const ExperiencePanel = ({ userId }: { userId: string }) => {
  const [tab, setTab] = useState<'experience' | 'project'>('experience');

  return (
    <>
      <div className="subtabs">
        <button
          type="button"
          className={`subtab${tab === 'experience' ? ' subtab--active' : ''}`}
          onClick={() => setTab('experience')}
        >
          職歴
        </button>
        <button
          type="button"
          className={`subtab${tab === 'project' ? ' subtab--active' : ''}`}
          onClick={() => setTab('project')}
        >
          プロジェクト
        </button>
      </div>
      {tab === 'experience' ? (
        <ExperienceForm userId={userId} />
      ) : (
        <ProjectForm userId={userId} />
      )}
    </>
  );
};
