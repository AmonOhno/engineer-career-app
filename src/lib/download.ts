/** ブラウザ側の副作用（ダウンロード・印刷・クリップボード）をまとめる。 */

/** テキストをファイルとしてダウンロードさせる。 */
export const downloadTextFile = (
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8'
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/**
 * HTML を別ウィンドウで開いて印刷ダイアログを出す。
 * ブラウザの「PDF に保存」で PDF 化する想定。
 */
export const printHtml = (html: string): boolean => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  // 描画完了を待ってから印刷する
  printWindow.setTimeout(() => printWindow.print(), 300);
  return true;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
