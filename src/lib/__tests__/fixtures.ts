/** テスト用のデータ組み立てヘルパー。 */

import type {
  CareerApplication,
  CareerCertification,
  CareerDataset,
  CareerEducation,
  CareerExperience,
  CareerHighlight,
  CareerPreference,
  CareerProfile,
  CareerProject,
  CareerSkill,
} from '../../types/career';
import { DEFAULT_TARGET_INCOME } from '../../types/career';

export const makeProfile = (
  overrides: Partial<CareerProfile> = {}
): CareerProfile => ({
  id: 'prof_1',
  userId: 'user_1',
  fullName: '山田 太郎',
  fullNameKana: 'ヤマダ タロウ',
  birthDate: '1992-04-10',
  gender: '',
  email: 'taro@example.com',
  phone: '090-0000-0000',
  postalCode: '150-0001',
  address: '東京都渋谷区1-1-1',
  nearestStation: '渋谷駅',
  headline: '決済基盤のSRE兼バックエンドリード',
  currentCompany: '株式会社サンプル',
  currentJobTitle: 'テックリード',
  yearsOfExperience: 8,
  currentAnnualIncome: 7_000_000,
  targetAnnualIncome: DEFAULT_TARGET_INCOME,
  jobChangeTargetDate: null,
  githubUrl: 'https://github.com/example',
  portfolioUrl: '',
  linkedinUrl: '',
  blogUrl: '',
  ...overrides,
});

export const makeSkill = (overrides: Partial<CareerSkill> = {}): CareerSkill => ({
  id: 'skill_1',
  userId: 'user_1',
  category: 'language',
  name: 'TypeScript',
  level: 4,
  yearsOfExperience: 6,
  lastUsedOn: '2026-06-01',
  isCore: true,
  note: '',
  sortOrder: 0,
  ...overrides,
});

export const makeExperience = (
  overrides: Partial<CareerExperience> = {}
): CareerExperience => ({
  id: 'exp_1',
  userId: 'user_1',
  companyName: '株式会社サンプル',
  employmentType: 'full_time',
  startedOn: '2020-04-01',
  endedOn: null,
  jobTitle: 'テックリード',
  department: 'プラットフォーム部',
  industry: 'SaaS',
  headcount: 300,
  annualIncome: 7_000_000,
  businessDescription: 'BtoB SaaS の開発',
  achievements: '',
  sortOrder: 0,
  ...overrides,
});

export const makeProject = (
  overrides: Partial<CareerProject> = {}
): CareerProject => ({
  id: 'proj_1',
  userId: 'user_1',
  experienceId: 'exp_1',
  name: '決済基盤リプレース',
  startedOn: '2023-04-01',
  endedOn: '2024-09-30',
  role: 'テックリード',
  teamSize: 8,
  industry: 'フィンテック',
  overview: 'モノリスからマイクロサービスへの移行',
  responsibilities: '設計・実装・運用',
  challenge: 'リリースが月次で障害検知が遅い',
  action: 'Kubernetes への移行と CI/CD 整備',
  result: 'リリース頻度を日次化',
  impactMetric: 'p95 1.2s → 180ms',
  techStack: ['TypeScript', 'AWS', 'Kubernetes'],
  phases: ['basic_design', 'implementation', 'management'],
  isHighlighted: true,
  sortOrder: 0,
  ...overrides,
});

export const makeEducation = (
  overrides: Partial<CareerEducation> = {}
): CareerEducation => ({
  id: 'edu_1',
  userId: 'user_1',
  schoolName: 'サンプル大学',
  faculty: '工学部情報工学科',
  degree: '学士',
  startedOn: '2011-04-01',
  endedOn: '2015-03-31',
  status: '卒業',
  note: '',
  sortOrder: 0,
  ...overrides,
});

export const makeCertification = (
  overrides: Partial<CareerCertification> = {}
): CareerCertification => ({
  id: 'cert_1',
  userId: 'user_1',
  name: '応用情報技術者',
  issuer: 'IPA',
  acquiredOn: '2018-06-01',
  expiresOn: null,
  score: '',
  note: '',
  sortOrder: 0,
  ...overrides,
});

export const makeHighlight = (
  overrides: Partial<CareerHighlight> = {}
): CareerHighlight => ({
  id: 'pr_1',
  userId: 'user_1',
  kind: 'summary',
  title: '標準版',
  body: '8年間のWebアプリケーション開発経験があります。',
  isDefault: true,
  sortOrder: 0,
  ...overrides,
});

export const makePreference = (
  overrides: Partial<CareerPreference> = {}
): CareerPreference => ({
  id: 'pref_1',
  userId: 'user_1',
  desiredJobTitles: ['バックエンドエンジニア'],
  desiredRoles: [],
  desiredIndustries: ['SaaS'],
  desiredProjectTypes: [],
  desiredTechStack: ['TypeScript', 'AWS'],
  avoidTechStack: [],
  desiredPhases: [],
  desiredTeamStyle: '',
  incomeFloor: 8_000_000,
  desiredIncomeMin: 9_000_000,
  desiredIncomeIdeal: DEFAULT_TARGET_INCOME,
  desiredLocations: ['東京都'],
  remotePreference: 'full_remote',
  maxCommuteMinutes: null,
  acceptableOvertimeHours: 20,
  minHolidays: 120,
  sideJobRequired: false,
  flextimeRequired: true,
  desiredBenefits: ['書籍購入補助'],
  desiredCompanySizes: [],
  desiredEmploymentTypes: ['full_time'],
  mustHaveConditions: [],
  niceToHaveConditions: [],
  dealBreakers: [],
  jobChangeReason: '',
  note: '',
  ...overrides,
});

export const makeApplication = (
  overrides: Partial<CareerApplication> = {}
): CareerApplication => ({
  id: 'app_1',
  userId: 'user_1',
  companyName: '株式会社ターゲット',
  jobTitle: 'バックエンドエンジニア',
  source: 'エージェント',
  agentName: '',
  status: 'applied',
  appliedOn: '2026-07-01',
  nextAction: '',
  nextActionOn: null,
  incomeRangeMin: 9_000_000,
  incomeRangeMax: 12_000_000,
  offeredIncome: null,
  jobUrl: '',
  location: '東京都港区',
  remotePolicy: 'full_remote',
  industry: 'SaaS',
  techStack: ['TypeScript', 'AWS'],
  benefits: ['書籍購入補助'],
  memo: '',
  ...overrides,
});

export const makeDataset = (
  overrides: Partial<CareerDataset> = {}
): CareerDataset => ({
  profile: makeProfile(),
  skills: [makeSkill()],
  experiences: [makeExperience()],
  projects: [makeProject()],
  educations: [makeEducation()],
  certifications: [makeCertification()],
  highlights: [makeHighlight()],
  preference: makePreference(),
  ...overrides,
});
