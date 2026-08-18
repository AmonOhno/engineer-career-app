/**
 * `useDraftState` のテスト。
 *
 * タブ切り替えではアクティブなパネルだけが描画される（＝非アクティブな
 * パネルはアンマウントされる）ため、アンマウント → 再マウントで入力内容が
 * 残ることを、実際にコンポーネントを描画して確認する。
 */

import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useDraftStore, useDraftState } from '../draftStore';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

interface Form {
  name: string;
  note: string;
}

const initialForm = (): Form => ({ name: '', note: '' });

/** 描画中の値と setter をテスト側に渡すだけのパネル。 */
const seen: { form: Form; setForm: (next: Form | ((prev: Form) => Form)) => void } = {
  form: initialForm(),
  setForm: () => undefined,
};

const Panel = () => {
  const [form, setForm] = useDraftState<Form>('test:form', initialForm);
  seen.form = form;
  seen.setForm = setForm;
  return <span>{form.name}</span>;
};

let container: HTMLDivElement;
let root: Root;

const mount = (element: ReactElement) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(element);
  });
};

const unmount = () => {
  act(() => {
    root.unmount();
  });
  container.remove();
};

beforeEach(() => {
  sessionStorage.clear();
  useDraftStore.setState({ ownerId: null, drafts: {} });
});

describe('useDraftState', () => {
  it('下書きが無ければ初期値を返す', () => {
    mount(<Panel />);
    expect(seen.form).toEqual({ name: '', note: '' });
    unmount();
  });

  it('アンマウント → 再マウントしても入力内容が残る', () => {
    mount(<Panel />);
    act(() => {
      seen.setForm((prev) => ({ ...prev, name: '株式会社サンプル' }));
    });
    expect(container.textContent).toBe('株式会社サンプル');

    // タブ切り替えでパネルがアンマウントされる
    unmount();

    // タブを戻して再マウント
    mount(<Panel />);
    expect(seen.form).toEqual({ name: '株式会社サンプル', note: '' });
    expect(container.textContent).toBe('株式会社サンプル');
    unmount();
  });

  it('関数形式の更新は直前の下書きを引き継ぐ', () => {
    mount(<Panel />);
    act(() => {
      seen.setForm((prev) => ({ ...prev, name: 'A' }));
    });
    act(() => {
      seen.setForm((prev) => ({ ...prev, note: 'B' }));
    });
    expect(seen.form).toEqual({ name: 'A', note: 'B' });
    unmount();
  });

  it('持ち主が変わると下書きは破棄され、初期値に戻る', () => {
    mount(<Panel />);
    act(() => {
      seen.setForm({ name: '株式会社サンプル', note: '' });
    });
    unmount();

    act(() => {
      useDraftStore.getState().setOwner('user-b');
    });

    mount(<Panel />);
    expect(seen.form).toEqual({ name: '', note: '' });
    unmount();
  });
});
