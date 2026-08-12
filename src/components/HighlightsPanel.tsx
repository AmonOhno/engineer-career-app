/** 自己PR・職務要約・志望動機などの文章ブロックの編集画面。 */

import { useState } from 'react';
import { useCareerStore, useCareerDataset } from '../stores/careerStore';
import type { CareerHighlight, HighlightKind } from '../types/career';
import { HIGHLIGHT_KIND_LABEL } from '../lib/format';
import { createId } from '../lib/ids';
import {
  buildMotivationDraft,
  buildSelfPrDraft,
  buildSummaryDraft,
} from '../lib/drafts';
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  Select,
  TextArea,
  TextInput,
} from './ui';

const KIND_OPTIONS = (Object.keys(HIGHLIGHT_KIND_LABEL) as HighlightKind[]).map(
  (value) => ({ value, label: HIGHLIGHT_KIND_LABEL[value] })
);

const emptyHighlight = (userId: string): CareerHighlight => ({
  id: createId('highlight'),
  userId,
  kind: 'summary',
  title: '',
  body: '',
  isDefault: true,
  sortOrder: 0,
});

export const HighlightsPanel = ({ userId }: { userId: string }) => {
  const highlights = useCareerStore((s) => s.highlights);
  const saveHighlight = useCareerStore((s) => s.saveHighlight);
  const deleteHighlight = useCareerStore((s) => s.deleteHighlight);
  const dataset = useCareerDataset();

  const [form, setForm] = useState<CareerHighlight>(() => emptyHighlight(userId));
  const [editingId, setEditingId] = useState<string | null>(null);

  const update = <K extends keyof CareerHighlight>(
    key: K,
    value: CareerHighlight[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(emptyHighlight(userId));
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.body.trim()) return;
    await saveHighlight(form);
    reset();
  };

  /** 登録済みのスキル・プロジェクトから下書きを流し込む。 */
  const generateDraft = () => {
    const draft =
      form.kind === 'summary'
        ? buildSummaryDraft(dataset)
        : form.kind === 'motivation'
          ? buildMotivationDraft(dataset)
          : buildSelfPrDraft(dataset);
    update('body', draft);
  };

  return (
    <>
      <Card
        title={editingId ? '文章を編集' : '文章を追加'}
        description="「下書きを生成」で、登録済みのスキル・プロジェクトから叩き台を作れる。"
      >
        <div className="grid">
          <Field label="種別">
            <Select
              value={form.kind}
              onChange={(v) => update('kind', v)}
              options={KIND_OPTIONS}
            />
          </Field>
          <Field label="タイトル" hint="応募先ごとに書き分けるときの識別用">
            <TextInput
              value={form.title}
              onChange={(v) => update('title', v)}
              placeholder="標準版 / SaaS企業向け"
            />
          </Field>
        </div>
        <Field label="本文" wide>
          <TextArea
            rows={10}
            value={form.body}
            onChange={(v) => update('body', v)}
          />
        </Field>
        <div className="form-footer">
          <Checkbox
            label="この種別の既定として書類生成に使う"
            checked={form.isDefault}
            onChange={(v) => update('isDefault', v)}
          />
          <div className="form-footer__buttons">
            <Button variant="ghost" onClick={generateDraft}>
              下書きを生成
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={reset}>
                キャンセル
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={!form.body.trim()}>
              {editingId ? '更新する' : '追加する'}
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`登録済みの文章（${highlights.length} 件）`}>
        {highlights.length === 0 && (
          <EmptyState message="まだ文章が登録されていない。まずは職務要約から。" />
        )}
        {highlights.map((highlight) => (
          <div key={highlight.id} className="record">
            <div className="record__head">
              <div>
                <strong>
                  {highlight.isDefault && <span className="badge">既定</span>}
                  {HIGHLIGHT_KIND_LABEL[highlight.kind]}
                  {highlight.title && ` ／ ${highlight.title}`}
                </strong>
              </div>
              <div className="table__actions">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setForm(highlight);
                    setEditingId(highlight.id);
                  }}
                >
                  編集
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteHighlight(highlight.id)}
                >
                  削除
                </Button>
              </div>
            </div>
            <p className="record__body record__body--pre">{highlight.body}</p>
          </div>
        ))}
      </Card>
    </>
  );
};
