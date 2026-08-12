/**
 * リソース ID の発行。ID はクライアント側で `<prefix>_<uuid>` 形式を発行する
 * （既存の勘定科目・仕訳と同じ運用）。
 */

export const ID_PREFIX = {
  profile: 'prof',
  skill: 'skill',
  experience: 'exp',
  project: 'proj',
  education: 'edu',
  certification: 'cert',
  highlight: 'pr',
  preference: 'pref',
  application: 'app',
  document: 'doc',
} as const;

export type ResourceKind = keyof typeof ID_PREFIX;

const randomUuid = (): string => {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
    return cryptoRef.randomUUID();
  }
  // randomUUID が無い環境（古い Safari 等）向けのフォールバック
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const createId = (kind: ResourceKind): string =>
  `${ID_PREFIX[kind]}_${randomUuid()}`;
