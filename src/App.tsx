/**
 * Career Compass — エンジニア転職の現在地・希望条件の管理と書類自動生成。
 *
 * 認証は資産シミュレーターと同じ Supabase セッションを共有する。
 */

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from './lib/supabase';
import { useCareerStore } from './stores/careerStore';
import { Dashboard } from './components/Dashboard';
import { ProfilePanel } from './components/ProfilePanel';
import { SkillsPanel } from './components/SkillsPanel';
import { ExperiencePanel } from './components/ExperiencePanel';
import { EducationPanel } from './components/EducationPanel';
import { HighlightsPanel } from './components/HighlightsPanel';
import { PreferencesPanel } from './components/PreferencesPanel';
import { ApplicationsPanel } from './components/ApplicationsPanel';
import { DocumentsPanel } from './components/DocumentsPanel';
import { LoginScreen } from './components/LoginScreen';
import './App.css';

const TABS = [
  { id: 'dashboard', label: 'ダッシュボード' },
  { id: 'profile', label: 'プロフィール' },
  { id: 'skills', label: 'スキル' },
  { id: 'experience', label: '職歴・案件' },
  { id: 'education', label: '学歴・資格' },
  { id: 'highlights', label: '自己PR' },
  { id: 'preferences', label: '希望条件' },
  { id: 'applications', label: '応募管理' },
  { id: 'documents', label: '書類生成' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const isTabId = (value: string): value is TabId =>
  TABS.some((tab) => tab.id === value);

function App() {
  const { session, client, setSession, refreshSession, signOut } = useAuthStore();
  const error = useCareerStore((s) => s.error);
  const clearError = useCareerStore((s) => s.clearError);

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // 認証状態の監視
  useEffect(() => {
    let isMounted = true;

    refreshSession().then((currentSession) => {
      if (isMounted) setSession(currentSession);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client, setSession, refreshSession]);

  // ログイン後の初回読み込み。以降はミューテーションごとに
  // 該当リソースの fetch アクションだけが走る。
  const loadedUserRef = useRef<string | null>(null);
  useEffect(() => {
    const userId = session?.user?.id ?? null;
    if (!userId || loadedUserRef.current === userId) return;
    loadedUserRef.current = userId;

    const store = useCareerStore.getState();
    Promise.all([
      store.fetchProfile(),
      store.fetchSkills(),
      store.fetchExperiences(),
      store.fetchProjects(),
      store.fetchEducations(),
      store.fetchCertifications(),
      store.fetchHighlights(),
      store.fetchPreference(),
      store.fetchApplications(),
      store.fetchDocuments(),
    ]).catch(() => {
      // 個々の fetch でエラーは store の error に載るため、ここでは握りつぶす
    });
  }, [session]);

  if (!session) return <LoginScreen />;

  const userId = session.user.id;

  const navigate = (tab: string) => {
    if (isTabId(tab)) setActiveTab(tab);
  };

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">Career Compass</h1>
          <p className="app__subtitle">
            年収 1000 万円までの現在地・希望条件・応募状況を 1 か所で管理する
          </p>
        </div>
        <button type="button" className="button button--ghost" onClick={signOut}>
          ログアウト
        </button>
      </header>

      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab${activeTab === tab.id ? ' tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="alert">
          <span>{error}</span>
          <button type="button" className="linkish" onClick={clearError}>
            閉じる
          </button>
        </div>
      )}

      <main className="app__main">
        {activeTab === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {activeTab === 'profile' && <ProfilePanel userId={userId} />}
        {activeTab === 'skills' && <SkillsPanel userId={userId} />}
        {activeTab === 'experience' && <ExperiencePanel userId={userId} />}
        {activeTab === 'education' && <EducationPanel userId={userId} />}
        {activeTab === 'highlights' && <HighlightsPanel userId={userId} />}
        {activeTab === 'preferences' && <PreferencesPanel userId={userId} />}
        {activeTab === 'applications' && <ApplicationsPanel userId={userId} />}
        {activeTab === 'documents' && <DocumentsPanel userId={userId} />}
      </main>
    </div>
  );
}

export default App;
