/** 保有スキルの登録画面。レベル・経験年数・最終使用年月まで持つ。 */

import { useState } from 'react';
import { useCareerStore } from '../stores/careerStore';
import type { CareerSkill, SkillCategory } from '../types/career';
import { SKILL_CATEGORY_LABEL, SKILL_LEVEL_LABEL } from '../lib/format';
import { createId } from '../lib/ids';
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  NumberInput,
  Select,
  TextInput,
} from './ui';

const CATEGORY_OPTIONS = (
  Object.keys(SKILL_CATEGORY_LABEL) as SkillCategory[]
).map((value) => ({ value, label: SKILL_CATEGORY_LABEL[value] }));

const LEVEL_OPTIONS = [1, 2, 3, 4, 5].map((level) => ({
  value: String(level),
  label: `${level}: ${SKILL_LEVEL_LABEL[level]}`,
}));

const emptySkill = (userId: string): CareerSkill => ({
  id: createId('skill'),
  userId,
  category: 'language',
  name: '',
  level: 3,
  yearsOfExperience: null,
  lastUsedOn: null,
  isCore: false,
  note: '',
  sortOrder: 0,
});

export const SkillsPanel = ({ userId }: { userId: string }) => {
  const skills = useCareerStore((s) => s.skills);
  const saveSkill = useCareerStore((s) => s.saveSkill);
  const deleteSkill = useCareerStore((s) => s.deleteSkill);

  const [form, setForm] = useState<CareerSkill>(() => emptySkill(userId));
  const [editingId, setEditingId] = useState<string | null>(null);

  const update = <K extends keyof CareerSkill>(key: K, value: CareerSkill[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(emptySkill(userId));
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    await saveSkill(form);
    reset();
  };

  const startEdit = (skill: CareerSkill) => {
    setForm(skill);
    setEditingId(skill.id);
  };

  const grouped = CATEGORY_OPTIONS.map((option) => ({
    category: option.value,
    label: option.label,
    items: skills.filter((skill) => skill.category === option.value),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <Card
        title={editingId ? 'スキルを編集' : 'スキルを追加'}
        description="「主力」に設定したスキルは職務経歴書の冒頭（活かせる経験）に出力される。"
      >
        <div className="grid">
          <Field label="分類">
            <Select
              value={form.category}
              onChange={(v) => update('category', v)}
              options={CATEGORY_OPTIONS}
            />
          </Field>
          <Field label="技術名">
            <TextInput
              value={form.name}
              onChange={(v) => update('name', v)}
              placeholder="TypeScript / AWS / Kubernetes"
            />
          </Field>
          <Field label="レベル">
            <Select
              value={String(form.level)}
              onChange={(v) => update('level', Number(v))}
              options={LEVEL_OPTIONS}
            />
          </Field>
          <Field label="実務経験年数">
            <NumberInput
              value={form.yearsOfExperience}
              onChange={(v) => update('yearsOfExperience', v)}
              step={0.5}
            />
          </Field>
          <Field label="最終使用年月" hint="2 年以上前だと書類での訴求力が落ちる">
            <TextInput
              type="date"
              value={form.lastUsedOn ?? ''}
              onChange={(v) => update('lastUsedOn', v || null)}
            />
          </Field>
          <Field label="備考">
            <TextInput value={form.note} onChange={(v) => update('note', v)} />
          </Field>
        </div>
        <div className="form-footer">
          <Checkbox
            label="主力スキルとして書類の前面に出す"
            checked={form.isCore}
            onChange={(v) => update('isCore', v)}
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

      <Card title={`登録済みスキル（${skills.length} 件）`}>
        {skills.length === 0 && <EmptyState message="まだスキルが登録されていない。" />}
        {grouped.map((group) => (
          <div key={group.category} className="list-group">
            <h3 className="list-group__title">{group.label}</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>技術</th>
                  <th>レベル</th>
                  <th>経験年数</th>
                  <th>最終使用</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {group.items.map((skill) => (
                  <tr key={skill.id}>
                    <td>
                      {skill.isCore && <span className="badge">主力</span>}
                      {skill.name}
                    </td>
                    <td>{SKILL_LEVEL_LABEL[skill.level] ?? skill.level}</td>
                    <td>
                      {skill.yearsOfExperience != null
                        ? `${skill.yearsOfExperience} 年`
                        : '—'}
                    </td>
                    <td>{skill.lastUsedOn ?? '—'}</td>
                    <td className="table__actions">
                      <Button variant="ghost" onClick={() => startEdit(skill)}>
                        編集
                      </Button>
                      <Button variant="danger" onClick={() => deleteSkill(skill.id)}>
                        削除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Card>
    </>
  );
};
