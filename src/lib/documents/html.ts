/**
 * 生成した Markdown を印刷（PDF 化）用の HTML に変換する。
 *
 * 依存を増やさないため、書類生成側が出力する記法（見出し・表・箇条書き・
 * 引用・強調）だけを対象にした最小の変換にとどめる。
 */

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** エスケープ後にインライン記法（強調・改行）だけ戻す。 */
const renderInline = (text: string): string =>
  escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/&lt;br&gt;/g, '<br>');

const isTableRow = (line: string): boolean =>
  line.trim().startsWith('|') && line.trim().endsWith('|');

const isTableSeparator = (line: string): boolean =>
  /^\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|$/.test(line.trim());

const splitRow = (line: string): string[] =>
  line
    .trim()
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());

/** Markdown を HTML の本文断片に変換する。 */
export const markdownToHtml = (markdown: string): string => {
  const lines = markdown.split('\n');
  const out: string[] = [];
  let index = 0;

  const flushParagraph = (buffer: string[]) => {
    if (buffer.length === 0) return;
    out.push(`<p>${buffer.map(renderInline).join('<br>')}</p>`);
    buffer.length = 0;
  };

  const paragraph: string[] = [];

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flushParagraph(paragraph);
      index += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushParagraph(paragraph);
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (isTableRow(trimmed)) {
      flushParagraph(paragraph);
      const header = splitRow(trimmed);
      const hasSeparator =
        index + 1 < lines.length && isTableSeparator(lines[index + 1]);

      if (hasSeparator) {
        index += 2;
        const bodyRows: string[][] = [];
        while (index < lines.length && isTableRow(lines[index].trim())) {
          bodyRows.push(splitRow(lines[index].trim()));
          index += 1;
        }
        out.push('<table>');
        out.push(
          `<thead><tr>${header
            .map((cell) => `<th>${renderInline(cell)}</th>`)
            .join('')}</tr></thead>`
        );
        out.push('<tbody>');
        bodyRows.forEach((row) => {
          out.push(
            `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join('')}</tr>`
          );
        });
        out.push('</tbody></table>');
        continue;
      }
    }

    if (trimmed.startsWith('- ')) {
      flushParagraph(paragraph);
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      out.push(
        `<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`
      );
      continue;
    }

    if (trimmed.startsWith('> ')) {
      flushParagraph(paragraph);
      out.push(`<blockquote>${renderInline(trimmed.slice(2))}</blockquote>`);
      index += 1;
      continue;
    }

    paragraph.push(trimmed);
    index += 1;
  }

  flushParagraph(paragraph);
  return out.join('\n');
};

const PRINT_STYLE = `
  @page { size: A4; margin: 16mm 14mm; }
  body {
    font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif;
    color: #111827;
    line-height: 1.7;
    font-size: 10.5pt;
  }
  h1 { font-size: 18pt; border-bottom: 2px solid #111827; padding-bottom: 6px; }
  h2 { font-size: 13pt; margin-top: 20px; border-left: 4px solid #2563eb; padding-left: 8px; }
  h3 { font-size: 11.5pt; margin-top: 16px; }
  h4 { font-size: 11pt; margin-top: 12px; color: #1f2937; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
  th, td { border: 1px solid #9ca3af; padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; white-space: nowrap; }
  blockquote { margin: 8px 0; padding: 6px 12px; background: #f9fafb; border-left: 3px solid #9ca3af; }
  ul { margin: 4px 0 12px; padding-left: 20px; }
  p { margin: 6px 0; }
  h2, h3, h4 { break-after: avoid; }
  table, blockquote { break-inside: avoid; }
`;

/** 印刷用の完全な HTML ドキュメントを組み立てる。 */
export const buildPrintableHtml = (title: string, markdown: string): string =>
  [
    '<!doctype html>',
    '<html lang="ja">',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${PRINT_STYLE}</style>`,
    '</head>',
    '<body>',
    markdownToHtml(markdown),
    '</body>',
    '</html>',
  ].join('\n');
