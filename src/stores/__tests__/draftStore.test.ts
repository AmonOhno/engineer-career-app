/**
 * 下書きストアのテスト。
 * タブ切り替え（パネルのアンマウント）をまたいで入力内容が残ることを保証する。
 */

import { useDraftStore } from '../draftStore';

const STORAGE_KEY = 'career-compass:drafts';

const readPersisted = (): { ownerId: string | null; drafts: Record<string, unknown> } =>
  JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{"ownerId":null,"drafts":{}}');

beforeEach(() => {
  sessionStorage.clear();
  useDraftStore.setState({ ownerId: null, drafts: {} });
});

describe('useDraftStore', () => {
  it('下書きを保存し、キーで取り出せる', () => {
    const { setDraft } = useDraftStore.getState();
    setDraft('profile:form', { fullName: '山田 太郎' });

    expect(useDraftStore.getState().drafts['profile:form']).toEqual({
      fullName: '山田 太郎',
    });
  });

  it('保存した下書きは sessionStorage に永続化される', () => {
    useDraftStore.getState().setDraft('skills:form', { name: 'TypeScript' });

    expect(readPersisted().drafts['skills:form']).toEqual({ name: 'TypeScript' });
  });

  it('複数のパネルの下書きを同時に保持する', () => {
    const { setDraft } = useDraftStore.getState();
    setDraft('profile:form', { fullName: '山田 太郎' });
    setDraft('applications:form', { companyName: '株式会社サンプル' });

    expect(Object.keys(useDraftStore.getState().drafts).sort()).toEqual([
      'applications:form',
      'profile:form',
    ]);
  });

  it('既存キーへの保存は上書きになる', () => {
    const { setDraft } = useDraftStore.getState();
    setDraft('profile:form', { fullName: '山田' });
    setDraft('profile:form', { fullName: '山田 太郎' });

    expect(useDraftStore.getState().drafts['profile:form']).toEqual({
      fullName: '山田 太郎',
    });
  });

  it('clearDraft は該当キーだけを消す', () => {
    const { setDraft, clearDraft } = useDraftStore.getState();
    setDraft('profile:form', { fullName: '山田 太郎' });
    setDraft('skills:form', { name: 'TypeScript' });

    clearDraft('profile:form');

    expect('profile:form' in useDraftStore.getState().drafts).toBe(false);
    expect(useDraftStore.getState().drafts['skills:form']).toEqual({
      name: 'TypeScript',
    });
    expect(readPersisted().drafts).toEqual({ 'skills:form': { name: 'TypeScript' } });
  });

  it('clearDrafts はすべての下書きを消す', () => {
    const { setDraft, clearDrafts } = useDraftStore.getState();
    setDraft('profile:form', { fullName: '山田 太郎' });
    setDraft('skills:form', { name: 'TypeScript' });

    clearDrafts();

    expect(useDraftStore.getState().drafts).toEqual({});
    expect(readPersisted().drafts).toEqual({});
  });

  it('持ち主が変わったら下書きを破棄する', () => {
    const { setOwner, setDraft } = useDraftStore.getState();
    setOwner('user-a');
    setDraft('profile:form', { fullName: '山田 太郎' });

    useDraftStore.getState().setOwner('user-b');

    expect(useDraftStore.getState().ownerId).toBe('user-b');
    expect(useDraftStore.getState().drafts).toEqual({});
  });

  it('同じ持ち主なら下書きを保持する', () => {
    const { setOwner, setDraft } = useDraftStore.getState();
    setOwner('user-a');
    setDraft('profile:form', { fullName: '山田 太郎' });

    useDraftStore.getState().setOwner('user-a');

    expect(useDraftStore.getState().drafts['profile:form']).toEqual({
      fullName: '山田 太郎',
    });
  });

  it('ログアウト（持ち主が null）でも下書きを破棄する', () => {
    const { setOwner, setDraft } = useDraftStore.getState();
    setOwner('user-a');
    setDraft('profile:form', { fullName: '山田 太郎' });

    useDraftStore.getState().setOwner(null);

    expect(useDraftStore.getState().drafts).toEqual({});
  });
});
