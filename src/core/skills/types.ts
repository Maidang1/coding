export enum SkillScope {
  Repo = "Repo",
  User = "User",
  System = "System",
  Admin = "Admin",
}

export interface SkillMetadata {
  name: string;
  description: string;
  shortDescription?: string;
  interface?: SkillInterface;
  dependencies?: SkillDependencies;
  path: string;
  scope: SkillScope;
}

export interface SkillInterface {
  displayName?: string;
  shortDescription?: string;
  iconSmall?: string;
  iconLarge?: string;
  brandColor?: string;
  defaultPrompt?: string;
}

export interface SkillDependencies {
  tools: SkillToolDependency[];
}

export interface SkillToolDependency {
  type: string;
  value: string;
  description?: string;
  transport?: string;
  command?: string;
  url?: string;
}

export interface SkillError {
  path: string;
  message: string;
}

export interface SkillLoadOutcome {
  skills: SkillMetadata[];
  errors: SkillError[];
  disabledPaths: Set<string>;
}

export interface SkillRoot {
  path: string;
  scope: SkillScope;
}
