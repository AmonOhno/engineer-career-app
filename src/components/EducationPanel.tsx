/** 学歴と資格の登録画面。履歴書の年表欄に転記される。 */

import { useState } from 'react';
import { useCareerStore } from '../stores/careerStore';
import type { CareerCertification, CareerEducation } from '../types/career';
import { formatPeriod, formatYearMonth } from '../lib/format';
import { createId } from '../lib/ids';
import { Button, Card, EmptyState, Field, TextInput } from './ui';

const emptyEducation = (userId: string): CareerEducation => ({
  id: createId('education'),
  userId,
  schoolName: '',
  faculty: '',
  degree: '',
  startedOn: null,
  endedOn: null,
  status: '卒業',
  note: '',
  sortOrder: 0,
});

const emptyCertification = (userId: string): CareerCertification => ({
  id: createId('certification'),
  userId,
  name: '',
  issuer: '',
  acquiredOn: null,
  expiresOn: null,
  score: '',
  note: '',
  sortOrder: 0,
});

export const EducationPanel = ({ userId }: { userId: string }) => {
  const educations = useCareerStore((s) => s.educations);
  const certifications = useCareerStore((s) => s.certifications);
  const saveEducation = useCareerStore((s) => s.saveEducation);
  const deleteEducation = useCareerStore((s) => s.deleteEducation);
  const saveCertification = useCareerStore((s) => s.saveCertification);
  const deleteCertification = useCareerStore((s) => s.deleteCertification);

  const [education, setEducation] = useState<CareerEducation>(() =>
    emptyEducation(userId)
  );
  const [educationEditing, setEducationEditing] = useState<string | null>(null);
  const [certification, setCertification] = useState<CareerCertification>(() =>
    emptyCertification(userId)
  );
  const [certificationEditing, setCertificationEditing] = useState<string | null>(
    null
  );

  const submitEducation = async () => {
    if (!education.schoolName.trim()) return;
    await saveEducation(education);
    setEducation(emptyEducation(userId));
    setEducationEditing(null);
  };

  const submitCertification = async () => {
    if (!certification.name.trim()) return;
    await saveCertification(certification);
    setCertification(emptyCertification(userId));
    setCertificationEditing(null);
  };

  return (
    <>
      <Card title={educationEditing ? '学歴を編集' : '学歴を追加'}>
        <div className="grid">
          <Field label="学校名">
            <TextInput
              value={education.schoolName}
              onChange={(v) => setEducation({ ...education, schoolName: v })}
            />
          </Field>
          <Field label="学部・学科">
            <TextInput
              value={education.faculty}
              onChange={(v) => setEducation({ ...education, faculty: v })}
            />
          </Field>
          <Field label="学位">
            <TextInput
              value={education.degree}
              onChange={(v) => setEducation({ ...education, degree: v })}
            />
          </Field>
          <Field label="入学日">
            <TextInput
              type="date"
              value={education.startedOn ?? ''}
              onChange={(v) => setEducation({ ...education, startedOn: v || null })}
            />
          </Field>
          <Field label="卒業日">
            <TextInput
              type="date"
              value={education.endedOn ?? ''}
              onChange={(v) => setEducation({ ...education, endedOn: v || null })}
            />
          </Field>
          <Field label="区分" hint="卒業 / 中退 / 在学中">
            <TextInput
              value={education.status}
              onChange={(v) => setEducation({ ...education, status: v })}
            />
          </Field>
        </div>
        <div className="form-footer">
          <div className="form-footer__buttons">
            {educationEditing && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEducation(emptyEducation(userId));
                  setEducationEditing(null);
                }}
              >
                キャンセル
              </Button>
            )}
            <Button
              onClick={submitEducation}
              disabled={!education.schoolName.trim()}
            >
              {educationEditing ? '更新する' : '追加する'}
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`学歴（${educations.length} 件）`}>
        {educations.length === 0 && <EmptyState message="まだ学歴が登録されていない。" />}
        {educations.map((item) => (
          <div key={item.id} className="record">
            <div className="record__head">
              <div>
                <strong>
                  {item.schoolName} {item.faculty}
                </strong>
                <span className="record__meta">
                  {formatPeriod(item.startedOn, item.endedOn)} ／ {item.status}
                </span>
              </div>
              <div className="table__actions">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEducation(item);
                    setEducationEditing(item.id);
                  }}
                >
                  編集
                </Button>
                <Button variant="danger" onClick={() => deleteEducation(item.id)}>
                  削除
                </Button>
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card title={certificationEditing ? '資格を編集' : '資格を追加'}>
        <div className="grid">
          <Field label="名称">
            <TextInput
              value={certification.name}
              onChange={(v) => setCertification({ ...certification, name: v })}
              placeholder="AWS Certified Solutions Architect – Professional"
            />
          </Field>
          <Field label="発行元">
            <TextInput
              value={certification.issuer}
              onChange={(v) => setCertification({ ...certification, issuer: v })}
            />
          </Field>
          <Field label="取得日">
            <TextInput
              type="date"
              value={certification.acquiredOn ?? ''}
              onChange={(v) =>
                setCertification({ ...certification, acquiredOn: v || null })
              }
            />
          </Field>
          <Field label="有効期限">
            <TextInput
              type="date"
              value={certification.expiresOn ?? ''}
              onChange={(v) =>
                setCertification({ ...certification, expiresOn: v || null })
              }
            />
          </Field>
          <Field label="スコア" hint="TOEIC 等">
            <TextInput
              value={certification.score}
              onChange={(v) => setCertification({ ...certification, score: v })}
            />
          </Field>
        </div>
        <div className="form-footer">
          <div className="form-footer__buttons">
            {certificationEditing && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCertification(emptyCertification(userId));
                  setCertificationEditing(null);
                }}
              >
                キャンセル
              </Button>
            )}
            <Button
              onClick={submitCertification}
              disabled={!certification.name.trim()}
            >
              {certificationEditing ? '更新する' : '追加する'}
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`資格（${certifications.length} 件）`}>
        {certifications.length === 0 && (
          <EmptyState message="まだ資格が登録されていない。" />
        )}
        {certifications.map((item) => (
          <div key={item.id} className="record">
            <div className="record__head">
              <div>
                <strong>{item.name}</strong>
                <span className="record__meta">
                  {formatYearMonth(item.acquiredOn)}
                  {item.issuer && ` ／ ${item.issuer}`}
                  {item.score && ` ／ ${item.score}`}
                </span>
              </div>
              <div className="table__actions">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCertification(item);
                    setCertificationEditing(item.id);
                  }}
                >
                  編集
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteCertification(item.id)}
                >
                  削除
                </Button>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
};
