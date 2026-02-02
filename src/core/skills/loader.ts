import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import {
  type SkillMetadata,
  type SkillLoadOutcome,
  type SkillRoot,
  type SkillInterface,
  type SkillDependencies,
  type SkillToolDependency,
  SkillScope,
} from "./types";

const SKILLS_FILENAME = "SKILL.md";
const SKILLS_METADATA_DIR = "agents";
const SKILLS_METADATA_FILENAME = "openai.yaml";
const MAX_SCAN_DEPTH = 6;
const MAX_SKILLS_DIRS_PER_ROOT = 2000;

export function loadSkillsFromRoots(roots: SkillRoot[]): SkillLoadOutcome {
  const outcome: SkillLoadOutcome = {
    skills: [],
    errors: [],
    disabledPaths: new Set(),
  };

  for (const root of roots) {
    discoverSkillsUnderRoot(root.path, root.scope, outcome);
  }

  // Deduplicate by path
  const seen = new Set<string>();
  outcome.skills = outcome.skills.filter((skill) => {
    if (seen.has(skill.path)) return false;
    seen.add(skill.path);
    return true;
  });

  // Sort
  outcome.skills.sort((a, b) => {
    const rankDiff = scopeRank(a.scope) - scopeRank(b.scope);
    if (rankDiff !== 0) return rankDiff;
    const nameDiff = a.name.localeCompare(b.name);
    if (nameDiff !== 0) return nameDiff;
    return a.path.localeCompare(b.path);
  });

  return outcome;
}

function scopeRank(scope: SkillScope): number {
  switch (scope) {
    case SkillScope.Repo:
      return 0;
    case SkillScope.User:
      return 1;
    case SkillScope.System:
      return 2;
    case SkillScope.Admin:
      return 3;
    default:
      return 4;
  }
}

function discoverSkillsUnderRoot(
  rootDir: string,
  scope: SkillScope,
  outcome: SkillLoadOutcome,
) {
  let resolvedRoot: string;
  try {
    resolvedRoot = fs.realpathSync(rootDir);
  } catch (e) {
    return;
  }

  if (!fs.statSync(resolvedRoot).isDirectory()) return;

  const queue: { path: string; depth: number }[] = [
    { path: resolvedRoot, depth: 0 },
  ];
  const visitedDirs = new Set<string>();
  visitedDirs.add(resolvedRoot);
  let truncated = false;

  const followSymlinks = [
    SkillScope.Repo,
    SkillScope.User,
    SkillScope.Admin,
  ].includes(scope);

  while (queue.length > 0) {
    const { path: currentPath, depth } = queue.shift()!;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (e) {
      continue;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      const fullPath = path.join(currentPath, entry.name);

      if (entry.isSymbolicLink()) {
        if (!followSymlinks) continue;
        try {
          const resolvedPath = fs.realpathSync(fullPath);
          if (fs.statSync(resolvedPath).isDirectory()) {
            enqueueDir(queue, visitedDirs, resolvedPath, depth + 1);
          }
        } catch (e) {}
        continue;
      }

      if (entry.isDirectory()) {
        try {
          const resolvedPath = fs.realpathSync(fullPath);
          enqueueDir(queue, visitedDirs, resolvedPath, depth + 1);
        } catch (e) {}
        continue;
      }

      if (entry.isFile() && entry.name === SKILLS_FILENAME) {
        try {
          const skill = parseSkillFile(fullPath, scope);
          outcome.skills.push(skill);
        } catch (e: any) {
          if (scope !== SkillScope.System) {
            outcome.errors.push({ path: fullPath, message: e.message });
          }
        }
      }
    }

    if (visitedDirs.size >= MAX_SKILLS_DIRS_PER_ROOT) {
      truncated = true;
      break;
    }
  }
}

function enqueueDir(
  queue: { path: string; depth: number }[],
  visited: Set<string>,
  dir: string,
  depth: number,
) {
  if (depth > MAX_SCAN_DEPTH) return;
  if (visited.has(dir)) return;
  visited.add(dir);
  queue.push({ path: dir, depth });
}

function parseSkillFile(filePath: string, scope: SkillScope): SkillMetadata {
  const content = fs.readFileSync(filePath, "utf-8");
  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) {
    throw new Error("Missing YAML frontmatter");
  }

  const parsed: any = yaml.load(frontmatter);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid YAML frontmatter");
  }

  if (!parsed.name || !parsed.description) {
    throw new Error("Missing required fields: name, description");
  }

  const { interface: skillInterface, dependencies } =
    loadSkillMetadata(filePath);

  return {
    name: sanitizeSingleLine(parsed.name),
    description: sanitizeSingleLine(parsed.description),
    shortDescription: parsed.metadata?.["short-description"]
      ? sanitizeSingleLine(parsed.metadata["short-description"])
      : undefined,
    interface: skillInterface,
    dependencies,
    path: filePath,
    scope,
  };
}

function loadSkillMetadata(skillPath: string): {
  interface?: SkillInterface;
  dependencies?: SkillDependencies;
} {
  const skillDir = path.dirname(skillPath);
  const metadataPath = path.join(
    skillDir,
    SKILLS_METADATA_DIR,
    SKILLS_METADATA_FILENAME,
  );

  if (!fs.existsSync(metadataPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(metadataPath, "utf-8");
    const parsed: any = yaml.load(content);
    if (!parsed || typeof parsed !== "object") return {};

    return {
      interface: resolveInterface(parsed.interface, skillDir),
      dependencies: resolveDependencies(parsed.dependencies),
    };
  } catch (e) {
    return {};
  }
}

function resolveInterface(
  iface: any,
  skillDir: string,
): SkillInterface | undefined {
  if (!iface) return undefined;
  return {
    displayName: iface.display_name,
    shortDescription: iface.short_description,
    iconSmall: resolveAssetPath(skillDir, iface.icon_small),
    iconLarge: resolveAssetPath(skillDir, iface.icon_large),
    brandColor: iface.brand_color,
    defaultPrompt: iface.default_prompt,
  };
}

function resolveAssetPath(
  skillDir: string,
  assetPath?: string,
): string | undefined {
  if (!assetPath) return undefined;
  return path.join(skillDir, assetPath);
}

function resolveDependencies(deps: any): SkillDependencies | undefined {
  if (!deps || !Array.isArray(deps.tools)) return undefined;
  const tools: SkillToolDependency[] = [];
  for (const t of deps.tools) {
    if (t.type && t.value) {
      tools.push({
        type: t.type,
        value: t.value,
        description: t.description,
        transport: t.transport,
        command: t.command,
        url: t.url,
      });
    }
  }
  if (tools.length === 0) return undefined;
  return { tools };
}

function extractFrontmatter(content: string): string | null {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== "---") return null;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line && line.trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return null;
  return lines.slice(1, end).join("\n");
}

function sanitizeSingleLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
