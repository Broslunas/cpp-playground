export interface CompilerSettings {
  optimization: string; // "-O0" | "-O1" | "-O2" | "-O3" | "-Os" | "-Ofast"
  sanitizers: string[]; // "address", "undefined", "leak", "thread"
  warnings: string[]; // "Wall", "Wextra", "Wpedantic", "Werror"
  customFlags: string;
}

export type SupportedLanguage = "cpp" | "python" | "html" | "javascript" | "typescript" | "bash";

export type PlaygroundLayout = "standard" | "two-column" | "columns" | "vertical" | "custom";

export type PanelId = "editor" | "stdin" | "output";

export interface CustomLayoutConfig {
  type: "linear" | "split";
  direction: "row" | "column";
  order: PanelId[];
  primaryPanel: PanelId;
  primaryPosition: "start" | "end";
  secondaryDirection: "row" | "column";
  secondaryOrder: [PanelId, PanelId];
  hiddenPanels: PanelId[];
  splitPrimaryPercent?: number;
  splitSecondaryPercent?: number;
  linearPercents?: number[];
}

export interface LanguageDefinition {
  id: SupportedLanguage;
  name: string;
  extension: string;
  defaultCode: string;
  defaultCompiler: string;
  defaultStandard: string;
  compilers: CompilerOption[];
  hasCompilerSettings?: boolean;
  isWebPreview?: boolean;
}

export type ProjectVisibility = "private" | "unlisted" | "public";

export interface Project {
  id: string;
  name: string;
  language?: SupportedLanguage;
  code: string;
  stdin: string;
  compiler: string;
  options: string;
  settings?: CompilerSettings;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
  isCloud?: boolean;
  visibility?: ProjectVisibility;
  publicCode?: boolean; // Solo si true expone el código a visitantes en perfiles públicos
  featured?: boolean;
  collectionIds?: string[];
  exerciseNumber?: number;
}

export type ProfileVisibility = "public" | "unlisted" | "private";

export interface UserPreferences {
  theme: "dark" | "black";
  editorTheme: "one-dark" | "dracula" | "nord";
  fontSize: number;
  tabSize: 2 | 4;
  showLineNumbers: boolean;
  autoSave: boolean;
  emailNotifications: boolean;
  productUpdates: boolean;
}

export interface WebAuthnCredential {
  id: string;
  publicKey: string; // base64url
  counter: number;
  transports?: string[];
  createdAt: number;
  name: string;
}

export interface UserSecurityConfig {
  totpEnabled: boolean;
  totpSecretEncrypted?: string;
  recoveryCodesRemaining: number;
  passkeysCount: number;
  activeSessionsCount: number;
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  discord?: string;
  youtube?: string;
}

export interface AuthUser {
  id: string;
  githubId?: string;
  username: string;
  name: string;
  avatarUrl: string;
  email?: string;
  isEmailPublic?: boolean;
  bio?: string;
  website?: string;
  githubUrl?: string;
  socials?: SocialLinks;
  availableForCollaboration?: boolean;
  profileVisibility?: ProfileVisibility;
  showActivity?: boolean;
  featuredProjectIds?: string[];
  collections?: { id: string; name: string }[];
  preferences?: UserPreferences;
  security?: UserSecurityConfig;
}

export interface PublicUserProfile {
  username: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  website?: string;
  githubUrl?: string;
  publicEmail?: string;
  socials?: SocialLinks;
  availableForCollaboration: boolean;
  profileVisibility: ProfileVisibility;
  showActivity: boolean;
  featuredProjects: PublicProjectCard[];
  collections: { id: string; name: string; projectCount: number }[];
  stats: {
    publicProjectsCount: number;
    joinedAt: number;
  };
}

export interface PublicProjectCard {
  id: string;
  name: string;
  language: SupportedLanguage;
  compiler: string;
  options: string;
  updatedAt: number;
  publicCode: boolean;
  code?: string; // Solo presente si publicCode === true
  stdin?: string;
}

export type CloudSyncState = "idle" | "saving" | "synced" | "error" | "offline";

export interface CompileRequest {
  language?: SupportedLanguage;
  code: string;
  stdin?: string;
  compiler?: string;
  options?: string;
  settings?: CompilerSettings;
  args?: string;
}

export interface CompileResponse {
  stdout: string;
  stderr: string;
  compilerOutput: string;
  exitCode: number;
  time?: string;
  executionTimeMs?: number;
  error?: string;
}

export interface CompilerOption {
  id: string;
  name: string;
  version: string;
  standards: string[];
}

export interface CodeTemplate {
  id: string;
  title: string;
  language?: SupportedLanguage;
  category:
    | "basics"
    | "cpp20"
    | "cpp23"
    | "dsa"
    | "testing"
    | "python-features"
    | "python-advanced"
    | "html-demos"
    | "js-basics"
    | "js-advanced";
  description: string;
  standard: string;
  code: string;
  stdin?: string;
}

export interface ExerciseTestCase {
  label?: string;
  stdin: string;
  expectedOutput: string;
}

export interface CppExercise {
  number: number;
  title: string;
  description: string;
  hints: string[];
  solution: string;
  testCases: ExerciseTestCase[];
}


