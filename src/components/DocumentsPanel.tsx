/**
 * 書類生成画面。登録済みデータから履歴書・職務経歴書・スキルシートを作る。
 * 出力は Markdown プレビュー / 印刷（PDF 化）/ ダウンロード / 保存。
 */

import { useMemo, useState } from 'react';
import { useCareerStore, useCareerDataset } from '../stores/careerStore';
import type { DocumentKind } from '../types/career';
import {
  DOCUMENT_KIND_LABEL,
  buildPrintableHtml,
  generateDocument,
} from '../lib/documents';
import { evaluateCompleteness } from '../lib/completeness';
import { copyToClipboard, downloadTextFile, printHtml } from '../lib/download';
import { Button, Card, EmptyState, Field, Select } from './ui';

const KIND_OPTIONS = (Object.keys(DOCUMENT_KIND_LABEL) as DocumentKind[]).map(
  (value) => ({ value, label: DOCUMENT_KIND_LABEL[value] })
);

export const DocumentsPanel = ({ userId }: { userId: string }) => {
  const dataset = useCareerDataset();
  const applications = useCareerStore((s) => s.applications);
  const documents = useCareerStore((s) => s.documents);
  const saveDocument = useCareerStore((s) => s.saveDocument);
  const deleteDocument = useCareerStore((s) => s.deleteDocument);

  const [kind, setKind] = useState<DocumentKind>('career_history');
  const [applicationId, setApplicationId] = useState<string>('');
  const [notice, setNotice] = useState<string>('');

  const application =
    applications.find((item) => item.id === applicationId) ?? null;

  const completeness = useMemo(
    () => evaluateCompleteness(dataset, kind),
    [dataset, kind]
  );

  const generated = useMemo(
    () => generateDocument(kind, dataset, { application }),
    [kind, dataset, application]
  );

  const applicationOptions = [
    { value: '', label: '（応募先を指定しない）' },
    ...applications.map((item) => ({
      value: item.id,
      label: `${item.companyName}${item.jobTitle ? ` / ${item.jobTitle}` : ''}`,
    })),
  ];

  const handlePrint = () => {
    const ok = printHtml(buildPrintableHtml(generated.title, generated.markdown));
    setNotice(
      ok
        ? '印刷ダイアログを開いた。「PDF に保存」で PDF 化できる。'
        : 'ポップアップがブロックされた。ブラウザの設定を確認する。'
    );
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(generated.markdown);
    setNotice(ok ? 'Markdown をコピーした。' : 'コピーに失敗した。');
  };

  const handleSave = async () => {
    await saveDocument({
      userId,
      kind,
      title: generated.title,
      format: 'markdown',
      content: generated.markdown,
      applicationId: applicationId || null,
      generatedAt: new Date().toISOString(),
    });
    setNotice('生成した書類を保存した。');
  };

  return (
    <>
      <Card
        title="書類を生成する"
        description="登録済みの情報から自動生成する。応募先を指定すると志望動機と本人希望記入欄がその企業向けになる。"
      >
        <div className="grid">
          <Field label="書類の種類">
            <Select value={kind} onChange={setKind} options={KIND_OPTIONS} />
          </Field>
          <Field label="応募先">
            <Select
              value={applicationId}
              onChange={setApplicationId}
              options={applicationOptions}
            />
          </Field>
        </div>

        <div className={`callout${completeness.ready ? ' callout--ok' : ''}`}>
          <strong>
            必須項目の充足度: {completeness.score}%
            {completeness.ready ? '（生成可能）' : ''}
          </strong>
          {completeness.missingRequired.length > 0 && (
            <ul>
              {completeness.missingRequired.map((item) => (
                <li key={item.label}>{item.label} が未入力</li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-footer">
          <div className="form-footer__buttons">
            <Button variant="ghost" onClick={handleCopy}>
              Markdown をコピー
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                downloadTextFile(`${generated.title}.md`, generated.markdown, 'text/markdown;charset=utf-8')
              }
            >
              .md をダウンロード
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                downloadTextFile(
                  `${generated.title}.html`,
                  buildPrintableHtml(generated.title, generated.markdown),
                  'text/html;charset=utf-8'
                )
              }
            >
              .html をダウンロード
            </Button>
            <Button onClick={handlePrint}>印刷 / PDF 保存</Button>
            <Button variant="ghost" onClick={handleSave}>
              この内容を保存
            </Button>
          </div>
        </div>
        {notice && <p className="saved-note">{notice}</p>}
      </Card>

      <Card title="プレビュー" description={generated.title}>
        <pre className="preview">{generated.markdown}</pre>
      </Card>

      <Card title={`保存済みの書類（${documents.length} 件）`}>
        {documents.length === 0 && (
          <EmptyState message="まだ保存された書類はない。" />
        )}
        {documents.map((document) => (
          <div key={document.id} className="record">
            <div className="record__head">
              <div>
                <strong>{document.title}</strong>
                <span className="record__meta">
                  {DOCUMENT_KIND_LABEL[document.kind]} ／{' '}
                  {new Date(document.generatedAt).toLocaleString('ja-JP')}
                </span>
              </div>
              <div className="table__actions">
                <Button
                  variant="ghost"
                  onClick={() =>
                    printHtml(buildPrintableHtml(document.title, document.content))
                  }
                >
                  印刷
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    downloadTextFile(
                      `${document.title}.md`,
                      document.content,
                      'text/markdown;charset=utf-8'
                    )
                  }
                >
                  ダウンロード
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteDocument(document.id)}
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
