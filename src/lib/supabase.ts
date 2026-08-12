/**
 * Supabase クライアントと認証セッションのストア。
 *
 * 環境変数は Vite の規約に従い `VITE_` プレフィックスで受け取る。
 * 未設定のまま起動すると画面が真っ白になって原因が分からないため、
 * ここで明示的に落として理由を伝える。
 */

import { createClient } from '@supabase/supabase-js';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // 値そのものはログに出さない（設定済みか否かだけを伝える）
  throw new Error(
    '[設定エラー] Supabase の接続情報が未設定です。' +
      `.env に VITE_SUPABASE_URL（${supabaseUrl ? 'Set' : 'Not Set'}）と ` +
      `VITE_SUPABASE_ANON_KEY（${supabaseAnonKey ? 'Set' : 'Not Set'}）を設定してください。`
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

interface AuthState {
  session: Session | null;
  userId: string | null;
  client: SupabaseClient;
  setSession: (session: Session | null) => void;
  refreshSession: () => Promise<Session | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  userId: null,
  client: supabase,

  setSession: (session) => {
    set({ session, userId: session?.user?.id ?? null });
  },

  refreshSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) console.error('Session refresh error:', error.message);

    get().setSession(session);
    return session;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, userId: null });
  },
}));
