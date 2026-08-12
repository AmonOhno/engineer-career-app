/**
 * キャリアデータの Zustand ストア。
 *
 * Supabase を直接叩く（API サーバーは無い）。ミューテーション後は変更した
 * リソースの fetch アクションだけを呼ぶ。全件再取得の関数は持たない。
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { supabase, useAuthStore } from '../lib/supabase';
import { toCamelCase, toSnakeCase } from '../lib/caseConvert';
import { describeSupabaseError } from '../lib/supabaseError';
import type {
  CareerApplication,
  CareerCertification,
  CareerDataset,
  CareerDocument,
  CareerEducation,
  CareerExperience,
  CareerHighlight,
  CareerPreference,
  CareerProfile,
  CareerProject,
  CareerSkill,
} from '../types/career';
import { DEFAULT_TARGET_INCOME } from '../types/career';
import { createId } from '../lib/ids';

const TABLE = {
  profiles: 'career_profiles',
  skills: 'career_skills',
  experiences: 'career_experiences',
  projects: 'career_projects',
  educations: 'career_educations',
  certifications: 'career_certifications',
  highlights: 'career_highlights',
  preferences: 'career_preferences',
  applications: 'career_applications',
  documents: 'career_documents',
} as const;

interface CareerState {
  profile: CareerProfile | null;
  skills: CareerSkill[];
  experiences: CareerExperience[];
  projects: CareerProject[];
  educations: CareerEducation[];
  certifications: CareerCertification[];
  highlights: CareerHighlight[];
  preference: CareerPreference | null;
  applications: CareerApplication[];
  documents: CareerDocument[];

  loading: boolean;
  error: string | null;
  clearError: () => void;

  fetchProfile: () => Promise<CareerProfile | null>;
  saveProfile: (profile: Partial<CareerProfile>) => Promise<void>;

  fetchSkills: () => Promise<CareerSkill[]>;
  saveSkill: (skill: Partial<CareerSkill>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;

  fetchExperiences: () => Promise<CareerExperience[]>;
  saveExperience: (experience: Partial<CareerExperience>) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;

  fetchProjects: () => Promise<CareerProject[]>;
  saveProject: (project: Partial<CareerProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  fetchEducations: () => Promise<CareerEducation[]>;
  saveEducation: (education: Partial<CareerEducation>) => Promise<void>;
  deleteEducation: (id: string) => Promise<void>;

  fetchCertifications: () => Promise<CareerCertification[]>;
  saveCertification: (certification: Partial<CareerCertification>) => Promise<void>;
  deleteCertification: (id: string) => Promise<void>;

  fetchHighlights: () => Promise<CareerHighlight[]>;
  saveHighlight: (highlight: Partial<CareerHighlight>) => Promise<void>;
  deleteHighlight: (id: string) => Promise<void>;

  fetchPreference: () => Promise<CareerPreference | null>;
  savePreference: (preference: Partial<CareerPreference>) => Promise<void>;

  fetchApplications: () => Promise<CareerApplication[]>;
  saveApplication: (application: Partial<CareerApplication>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;

  fetchDocuments: () => Promise<CareerDocument[]>;
  saveDocument: (document: Partial<CareerDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

/** 未登録ユーザー向けの初期プロフィール。DB には保存しない。 */
export const emptyProfile = (userId: string): CareerProfile => ({
  id: createId('profile'),
  userId,
  fullName: '',
  fullNameKana: '',
  birthDate: null,
  gender: '',
  email: '',
  phone: '',
  postalCode: '',
  address: '',
  nearestStation: '',
  headline: '',
  currentCompany: '',
  currentJobTitle: '',
  yearsOfExperience: null,
  currentAnnualIncome: null,
  targetAnnualIncome: DEFAULT_TARGET_INCOME,
  jobChangeTargetDate: null,
  githubUrl: '',
  portfolioUrl: '',
  linkedinUrl: '',
  blogUrl: '',
});

/** 未登録ユーザー向けの初期希望条件。DB には保存しない。 */
export const emptyPreference = (userId: string): CareerPreference => ({
  id: createId('preference'),
  userId,
  desiredJobTitles: [],
  desiredRoles: [],
  desiredIndustries: [],
  desiredProjectTypes: [],
  desiredTechStack: [],
  avoidTechStack: [],
  desiredPhases: [],
  desiredTeamStyle: '',
  incomeFloor: null,
  desiredIncomeMin: null,
  desiredIncomeIdeal: DEFAULT_TARGET_INCOME,
  desiredLocations: [],
  remotePreference: 'any',
  maxCommuteMinutes: null,
  acceptableOvertimeHours: null,
  minHolidays: null,
  sideJobRequired: false,
  flextimeRequired: false,
  desiredBenefits: [],
  desiredCompanySizes: [],
  desiredEmploymentTypes: [],
  mustHaveConditions: [],
  niceToHaveConditions: [],
  dealBreakers: [],
  jobChangeReason: '',
  note: '',
});

/**
 * ストアの状態から書類生成用のデータセットを組み立てる。
 * 毎回新しいオブジェクトを返すため、購読には必ず `useCareerDataset` を使う
 * （素の selector として渡すと zustand v5 では毎レンダーで別参照になり再描画が止まらない）。
 */
export const selectDataset = (state: CareerState): CareerDataset => ({
  profile: state.profile,
  skills: state.skills,
  experiences: state.experiences,
  projects: state.projects,
  educations: state.educations,
  certifications: state.certifications,
  highlights: state.highlights,
  preference: state.preference,
});

export const useCareerStore = create<CareerState>((set, get) => {
  /** 一覧テーブルの取得。失敗時は現在の値を維持する。 */
  const fetchList = async <T>(
    table: string,
    stateKey: keyof CareerState,
    orderBy: { column: string; ascending: boolean }[]
  ): Promise<T[]> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return [];

    try {
      let query = supabase.from(table).select('*').eq('user_id', userId);
      orderBy.forEach(({ column, ascending }) => {
        query = query.order(column, { ascending });
      });
      const { data, error } = await query;
      if (error) throw error;

      const rows = toCamelCase(data || []) as T[];
      set({ [stateKey]: rows } as unknown as Partial<CareerState>);
      return rows;
    } catch (error) {
      set({ error: describeSupabaseError(error) });
      return (get()[stateKey] as T[]) ?? [];
    }
  };

  /** 単一レコード（プロフィール・希望条件）の取得。未登録なら null。 */
  const fetchSingleton = async <T>(
    table: string,
    stateKey: keyof CareerState
  ): Promise<T | null> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;

      const row = data ? (toCamelCase(data) as T) : null;
      set({ [stateKey]: row } as unknown as Partial<CareerState>);
      return row;
    } catch (error) {
      set({ error: describeSupabaseError(error) });
      return (get()[stateKey] as T | null) ?? null;
    }
  };

  /** id 付きで upsert し、成功したら対象リソースだけ再取得する。 */
  const upsertRow = async (
    table: string,
    row: Record<string, unknown>,
    refresh: () => Promise<unknown>,
    conflictTarget?: string
  ): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    set({ loading: true, error: null });
    try {
      const payload = toSnakeCase({ ...row, userId });
      const { error } = await supabase
        .from(table)
        .upsert(payload, conflictTarget ? { onConflict: conflictTarget } : undefined);
      if (error) throw error;
      await refresh();
    } catch (error) {
      set({ error: describeSupabaseError(error) });
    } finally {
      set({ loading: false });
    }
  };

  const deleteRow = async (
    table: string,
    id: string,
    refresh: () => Promise<unknown>
  ): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      await refresh();
    } catch (error) {
      set({ error: describeSupabaseError(error) });
    } finally {
      set({ loading: false });
    }
  };

  return {
    profile: null,
    skills: [],
    experiences: [],
    projects: [],
    educations: [],
    certifications: [],
    highlights: [],
    preference: null,
    applications: [],
    documents: [],

    loading: false,
    error: null,
    clearError: () => set({ error: null }),

    // --- プロフィール ---
    fetchProfile: () => fetchSingleton<CareerProfile>(TABLE.profiles, 'profile'),
    saveProfile: async (profile) => {
      const { userId } = useAuthStore.getState();
      if (!userId) return;
      const current = get().profile;
      const merged = {
        ...(current ?? emptyProfile(userId)),
        ...profile,
        id: current?.id ?? profile.id ?? createId('profile'),
      };
      await upsertRow(TABLE.profiles, merged, get().fetchProfile, 'user_id');
    },

    // --- スキル ---
    fetchSkills: () =>
      fetchList<CareerSkill>(TABLE.skills, 'skills', [
        { column: 'sort_order', ascending: true },
        { column: 'level', ascending: false },
      ]),
    saveSkill: async (skill) => {
      await upsertRow(
        TABLE.skills,
        { ...skill, id: skill.id ?? createId('skill') },
        get().fetchSkills
      );
    },
    deleteSkill: (id) => deleteRow(TABLE.skills, id, get().fetchSkills),

    // --- 職歴 ---
    fetchExperiences: () =>
      fetchList<CareerExperience>(TABLE.experiences, 'experiences', [
        { column: 'started_on', ascending: false },
      ]),
    saveExperience: async (experience) => {
      await upsertRow(
        TABLE.experiences,
        { ...experience, id: experience.id ?? createId('experience') },
        get().fetchExperiences
      );
    },
    deleteExperience: (id) =>
      deleteRow(TABLE.experiences, id, get().fetchExperiences),

    // --- プロジェクト ---
    fetchProjects: () =>
      fetchList<CareerProject>(TABLE.projects, 'projects', [
        { column: 'started_on', ascending: false },
      ]),
    saveProject: async (project) => {
      await upsertRow(
        TABLE.projects,
        { ...project, id: project.id ?? createId('project') },
        get().fetchProjects
      );
    },
    deleteProject: (id) => deleteRow(TABLE.projects, id, get().fetchProjects),

    // --- 学歴 ---
    fetchEducations: () =>
      fetchList<CareerEducation>(TABLE.educations, 'educations', [
        { column: 'started_on', ascending: true },
      ]),
    saveEducation: async (education) => {
      await upsertRow(
        TABLE.educations,
        { ...education, id: education.id ?? createId('education') },
        get().fetchEducations
      );
    },
    deleteEducation: (id) => deleteRow(TABLE.educations, id, get().fetchEducations),

    // --- 資格 ---
    fetchCertifications: () =>
      fetchList<CareerCertification>(TABLE.certifications, 'certifications', [
        { column: 'acquired_on', ascending: true },
      ]),
    saveCertification: async (certification) => {
      await upsertRow(
        TABLE.certifications,
        { ...certification, id: certification.id ?? createId('certification') },
        get().fetchCertifications
      );
    },
    deleteCertification: (id) =>
      deleteRow(TABLE.certifications, id, get().fetchCertifications),

    // --- 自己PR等 ---
    fetchHighlights: () =>
      fetchList<CareerHighlight>(TABLE.highlights, 'highlights', [
        { column: 'kind', ascending: true },
        { column: 'sort_order', ascending: true },
      ]),
    saveHighlight: async (highlight) => {
      await upsertRow(
        TABLE.highlights,
        { ...highlight, id: highlight.id ?? createId('highlight') },
        get().fetchHighlights
      );
    },
    deleteHighlight: (id) => deleteRow(TABLE.highlights, id, get().fetchHighlights),

    // --- 希望条件 ---
    fetchPreference: () =>
      fetchSingleton<CareerPreference>(TABLE.preferences, 'preference'),
    savePreference: async (preference) => {
      const { userId } = useAuthStore.getState();
      if (!userId) return;
      const current = get().preference;
      const merged = {
        ...(current ?? emptyPreference(userId)),
        ...preference,
        id: current?.id ?? preference.id ?? createId('preference'),
      };
      await upsertRow(TABLE.preferences, merged, get().fetchPreference, 'user_id');
    },

    // --- 応募管理 ---
    fetchApplications: () =>
      fetchList<CareerApplication>(TABLE.applications, 'applications', [
        { column: 'next_action_on', ascending: true },
        { column: 'created_at', ascending: false },
      ]),
    saveApplication: async (application) => {
      await upsertRow(
        TABLE.applications,
        { ...application, id: application.id ?? createId('application') },
        get().fetchApplications
      );
    },
    deleteApplication: (id) =>
      deleteRow(TABLE.applications, id, get().fetchApplications),

    // --- 生成書類 ---
    fetchDocuments: () =>
      fetchList<CareerDocument>(TABLE.documents, 'documents', [
        { column: 'generated_at', ascending: false },
      ]),
    saveDocument: async (document) => {
      await upsertRow(
        TABLE.documents,
        { ...document, id: document.id ?? createId('document') },
        get().fetchDocuments
      );
    },
    deleteDocument: (id) => deleteRow(TABLE.documents, id, get().fetchDocuments),
  };
});

/** 書類生成用データセットの購読。浅い比較で不要な再描画を防ぐ。 */
export const useCareerDataset = (): CareerDataset =>
  useCareerStore(useShallow(selectDataset));
