/**
 * キャリア設計アプリのドメイン型。
 *
 * DB は snake_case、フロントは camelCase。変換は `lib/caseConvert.ts` の
 * `toCamelCase` / `toSnakeCase` を通す。このファイルには型定義のみを置く。
 */

/** 年収目標のデフォルト値（円）。1000 万円。 */
export const DEFAULT_TARGET_INCOME = 10_000_000;

// ---------------------------------------------------------------------------
// 現在地ステータス
// ---------------------------------------------------------------------------

/** 基本情報。ユーザーごとに 1 レコード。 */
export interface CareerProfile {
  id: string;
  userId: string;
  fullName: string;
  fullNameKana: string;
  birthDate: string | null;
  gender: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  nearestStation: string;
  /** 履歴書冒頭に載せる一行キャッチ（例: 「SRE 兼バックエンドリード。可用性 99.99% を維持」）。 */
  headline: string;
  currentCompany: string;
  currentJobTitle: string;
  /** エンジニア経験年数。 */
  yearsOfExperience: number | null;
  /** 現年収（円）。 */
  currentAnnualIncome: number | null;
  /** 目標年収（円）。既定は 1000 万円。 */
  targetAnnualIncome: number;
  /** 転職希望時期。 */
  jobChangeTargetDate: string | null;
  githubUrl: string;
  portfolioUrl: string;
  linkedinUrl: string;
  blogUrl: string;
  createdAt?: string;
}

export type SkillCategory =
  | 'language'
  | 'framework'
  | 'cloud'
  | 'database'
  | 'infra'
  | 'data'
  | 'security'
  | 'tool'
  | 'domain'
  | 'management';

/** 保有スキル。 */
export interface CareerSkill {
  id: string;
  userId: string;
  category: SkillCategory;
  name: string;
  /** 1: 学習中 〜 5: 他者を指導できる。 */
  level: number;
  yearsOfExperience: number | null;
  /** 最終使用年月（YYYY-MM-01 で保持）。ブランクの判定に使う。 */
  lastUsedOn: string | null;
  /** 書類で前面に出すスキル。 */
  isCore: boolean;
  note: string;
  sortOrder: number;
}

export type EmploymentType =
  | 'full_time'
  | 'contract'
  | 'dispatch'
  | 'freelance'
  | 'part_time'
  | 'internship';

/** 職歴（会社単位）。 */
export interface CareerExperience {
  id: string;
  userId: string;
  companyName: string;
  employmentType: EmploymentType;
  startedOn: string;
  /** null は在籍中。 */
  endedOn: string | null;
  jobTitle: string;
  department: string;
  industry: string;
  /** 会社規模（従業員数）。 */
  headcount: number | null;
  /** その会社での年収（円）。年収推移の可視化に使う。 */
  annualIncome: number | null;
  businessDescription: string;
  achievements: string;
  sortOrder: number;
}

/** 開発フェーズ。職務経歴書の担当工程欄に使う。 */
export type ProjectPhase =
  | 'requirements'
  | 'basic_design'
  | 'detail_design'
  | 'implementation'
  | 'test'
  | 'release'
  | 'operation'
  | 'management';

/** 経験プロジェクト。課題・施策・成果（STAR）で保持する。 */
export interface CareerProject {
  id: string;
  userId: string;
  /** 紐づく職歴。未紐づけ（個人開発等）は null。 */
  experienceId: string | null;
  name: string;
  startedOn: string;
  endedOn: string | null;
  /** 役割（例: テックリード、バックエンドエンジニア）。 */
  role: string;
  teamSize: number | null;
  industry: string;
  overview: string;
  responsibilities: string;
  /** 課題（Situation / Task）。 */
  challenge: string;
  /** 施策（Action）。 */
  action: string;
  /** 成果（Result）。 */
  result: string;
  /** 定量成果（例: 「レスポンス 1.2s → 180ms」）。高年収帯の評価軸。 */
  impactMetric: string;
  techStack: string[];
  phases: ProjectPhase[];
  /** 職務経歴書で先頭に出す主力プロジェクト。 */
  isHighlighted: boolean;
  sortOrder: number;
}

/** 学歴。 */
export interface CareerEducation {
  id: string;
  userId: string;
  schoolName: string;
  faculty: string;
  degree: string;
  startedOn: string | null;
  endedOn: string | null;
  /** 卒業 / 中退 / 在学中 など。 */
  status: string;
  note: string;
  sortOrder: number;
}

/** 資格・免許。 */
export interface CareerCertification {
  id: string;
  userId: string;
  name: string;
  issuer: string;
  acquiredOn: string | null;
  expiresOn: string | null;
  /** スコア（TOEIC 等）。 */
  score: string;
  note: string;
  sortOrder: number;
}

/** 自己PR・職務要約などの文章ブロックの種別。 */
export type HighlightKind =
  | 'summary'
  | 'self_pr'
  | 'motivation'
  | 'strength'
  | 'future';

/** 自己PR等の文章ブロック。応募先ごとに書き分けられるよう複数保持する。 */
export interface CareerHighlight {
  id: string;
  userId: string;
  kind: HighlightKind;
  title: string;
  body: string;
  /** 書類生成時に既定で使うブロック。kind ごとに 1 件。 */
  isDefault: boolean;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// 希望条件
// ---------------------------------------------------------------------------

export type RemotePreference = 'full_remote' | 'hybrid' | 'onsite' | 'any';

/** 希望条件。業務内容とそれ以外をまとめてユーザーごとに 1 レコード。 */
export interface CareerPreference {
  id: string;
  userId: string;

  // --- 業務内容における希望条件 ---
  desiredJobTitles: string[];
  desiredRoles: string[];
  desiredIndustries: string[];
  desiredProjectTypes: string[];
  desiredTechStack: string[];
  avoidTechStack: string[];
  desiredPhases: ProjectPhase[];
  /** 希望する開発スタイル（例: 「スクラム / 少人数の裁量大きめ」）。 */
  desiredTeamStyle: string;

  // --- 業務内容以外の希望条件 ---
  /** 提示されたら受ける最低ライン（円）。 */
  incomeFloor: number | null;
  desiredIncomeMin: number | null;
  /** 理想年収（円）。既定は 1000 万円。 */
  desiredIncomeIdeal: number;
  desiredLocations: string[];
  remotePreference: RemotePreference;
  maxCommuteMinutes: number | null;
  acceptableOvertimeHours: number | null;
  minHolidays: number | null;
  sideJobRequired: boolean;
  flextimeRequired: boolean;
  desiredBenefits: string[];
  desiredCompanySizes: string[];
  desiredEmploymentTypes: EmploymentType[];

  // --- 優先度づけ ---
  /** 絶対条件。1 つでも満たさない求人はマッチ度 0 扱い。 */
  mustHaveConditions: string[];
  niceToHaveConditions: string[];
  dealBreakers: string[];

  /** 転職理由。面接・職務経歴書で一貫させるために保持する。 */
  jobChangeReason: string;
  note: string;
}

// ---------------------------------------------------------------------------
// 応募管理
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'document_screening'
  | 'interview_1'
  | 'interview_2'
  | 'interview_final'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'declined';

/** 応募・選考の 1 件。 */
export interface CareerApplication {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  /** 応募経路（エージェント / 直接応募 / スカウト など）。 */
  source: string;
  agentName: string;
  status: ApplicationStatus;
  appliedOn: string | null;
  nextAction: string;
  nextActionOn: string | null;
  /** 求人票の提示レンジ下限（円）。 */
  incomeRangeMin: number | null;
  /** 求人票の提示レンジ上限（円）。 */
  incomeRangeMax: number | null;
  /** 実際のオファー年収（円）。 */
  offeredIncome: number | null;
  jobUrl: string;
  location: string;
  remotePolicy: RemotePreference | '';
  industry: string;
  techStack: string[];
  benefits: string[];
  memo: string;
}

// ---------------------------------------------------------------------------
// 生成書類
// ---------------------------------------------------------------------------

export type DocumentKind = 'resume' | 'career_history' | 'skill_sheet';
export type DocumentFormat = 'markdown' | 'html' | 'text';

/** 生成した書類のスナップショット。 */
export interface CareerDocument {
  id: string;
  userId: string;
  kind: DocumentKind;
  title: string;
  format: DocumentFormat;
  content: string;
  /** 応募先ごとに書き分けた場合の紐づけ。 */
  applicationId: string | null;
  generatedAt: string;
}

/** 書類生成に必要なデータ一式。 */
export interface CareerDataset {
  profile: CareerProfile | null;
  skills: CareerSkill[];
  experiences: CareerExperience[];
  projects: CareerProject[];
  educations: CareerEducation[];
  certifications: CareerCertification[];
  highlights: CareerHighlight[];
  preference: CareerPreference | null;
}
