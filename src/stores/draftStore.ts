/**
 * 入力途中データ（下書き）の保管庫。
 *
 * App はアクティブなタブのパネルだけを描画するため、タブを切り替えると
 * パネルがアンマウントされ、ローカル state のフォーム内容が失われる。
 * フォームの値をこのストアに逃がすことで、タブ切り替え・リロードをまたいで
 * 入力内容を保持する。
 *
 * - 永続化先は sessionStorage（タブを閉じたら消える一時データ）。
 * - 下書きは「持ち主（ownerId = ユーザー ID）」に紐づく。別ユーザーで
 *   ログインし直した場合は破棄する。
 */

import { useRef } from 'react';
import { create } from 'zustand';

const STORAGE_KEY = 'career-compass:drafts';

interface PersistedDrafts {
  ownerId: string | null;
  drafts: Record<string, unknown>;
}

const emptyPersisted: PersistedDrafts = { ownerId: null, drafts: {} };

/** sessionStorage は環境やプライベートモードで使えないことがあるため常に握りつぶす。 */
const readStorage = (): PersistedDrafts => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPersisted;
    const parsed = JSON.parse(raw) as Partial<PersistedDrafts>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.drafts !== 'object') {
      return emptyPersisted;
    }
    return {
      ownerId: typeof parsed.ownerId === 'string' ? parsed.ownerId : null,
      drafts: (parsed.drafts ?? {}) as Record<string, unknown>,
    };
  } catch {
    return emptyPersisted;
  }
};

const writeStorage = (value: PersistedDrafts): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // 保存できなくてもメモリ上の下書きは生きているので、致命的ではない
  }
};

interface DraftState {
  /** 下書きの持ち主のユーザー ID。 */
  ownerId: string | null;
  /** 下書き本体。キーは `<パネル>:<フォーム名>`。 */
  drafts: Record<string, unknown>;

  setDraft: (key: string, value: unknown) => void;
  clearDraft: (key: string) => void;
  clearDrafts: () => void;
  /** 下書きの持ち主を設定する。別ユーザーに変わったら下書きを破棄する。 */
  setOwner: (ownerId: string | null) => void;
}

export const useDraftStore = create<DraftState>((set, get) => {
  const restored = readStorage();

  const persist = (next: PersistedDrafts) => {
    writeStorage(next);
    set(next);
  };

  return {
    ownerId: restored.ownerId,
    drafts: restored.drafts,

    setDraft: (key, value) =>
      persist({ ownerId: get().ownerId, drafts: { ...get().drafts, [key]: value } }),

    clearDraft: (key) => {
      const { [key]: _removed, ...rest } = get().drafts;
      persist({ ownerId: get().ownerId, drafts: rest });
    },

    clearDrafts: () => persist({ ownerId: get().ownerId, drafts: {} }),

    setOwner: (ownerId) => {
      const current = get().ownerId;
      if (current === ownerId) return;
      // 持ち主が変わったら（ログアウト・別ユーザー）下書きは持ち越さない
      persist({ ownerId, drafts: {} });
    },
  };
});

/** 現在の下書き値。無ければ undefined。 */
const peekDraft = <T>(key: string): T | undefined =>
  useDraftStore.getState().drafts[key] as T | undefined;

/**
 * `useState` と同じ使い勝手で、値を下書きストアに保持するフック。
 *
 * アンマウントされても値が残るため、タブを切り替えて戻っても入力内容が消えない。
 * 第 3 要素の `hasDraft` は「このキーの下書きが存在するか」で、サーバー取得値で
 * 編集中の内容を上書きしないための判定に使う。
 */
export const useDraftState = <T,>(
  key: string,
  createInitial: () => T
): [T, (next: T | ((prev: T) => T)) => void, boolean] => {
  const stored = useDraftStore((s) => s.drafts[key]) as T | undefined;
  const hasDraft = useDraftStore((s) => key in s.drafts);

  // 初期値の生成は 1 回だけ（createId 系を含むため毎レンダー呼ばない）
  const initialRef = useRef<{ value: T } | null>(null);
  if (initialRef.current === null) initialRef.current = { value: createInitial() };

  const value = hasDraft ? (stored as T) : initialRef.current.value;

  const setValue = (next: T | ((prev: T) => T)) => {
    const prev = key in useDraftStore.getState().drafts
      ? (peekDraft<T>(key) as T)
      : (initialRef.current as { value: T }).value;
    const resolved =
      typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
    useDraftStore.getState().setDraft(key, resolved);
  };

  return [value, setValue, hasDraft];
};
