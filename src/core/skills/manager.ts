import path from 'path';
import fs from 'fs';
import { type SkillLoadOutcome, SkillScope, type SkillRoot } from './types';
import { loadSkillsFromRoots } from './loader';

export class SkillsManager {
    private cacheByCwd: Map<string, SkillLoadOutcome> = new Map();
    private codexHome: string;

    constructor(codexHome: string) {
        this.codexHome = codexHome;
    }

    public getSkillsForCwd(cwd: string, forceReload: boolean = false): SkillLoadOutcome {
        if (!forceReload && this.cacheByCwd.has(cwd)) {
            return this.cacheByCwd.get(cwd)!;
        }

        const roots = this.resolveRoots(cwd);
        const outcome = loadSkillsFromRoots(roots);
        this.cacheByCwd.set(cwd, outcome);
        return outcome;
    }

    public clearCache() {
        this.cacheByCwd.clear();
    }

    private resolveRoots(cwd: string): SkillRoot[] {
        const roots: SkillRoot[] = [];

        // 1. Repo scope: .codex/skills in project root
        const projectRoot = this.findProjectRoot(cwd);
        if (projectRoot) {
            roots.push({
                path: path.join(projectRoot, '.codex', 'skills'),
                scope: SkillScope.Repo
            });
             roots.push({
                path: path.join(projectRoot, '.agents', 'skills'),
                scope: SkillScope.Repo
            });
        }

        // 2. User scope: ~/.codex/skills
        roots.push({
            path: path.join(this.codexHome, 'skills'),
            scope: SkillScope.User
        });

        // 3. System scope: ~/.codex/skills/.system
        roots.push({
            path: path.join(this.codexHome, 'skills', '.system'),
            scope: SkillScope.System
        });

        return roots;
    }

    private findProjectRoot(cwd: string): string | null {
        let current = cwd;
        try {
            // resolve symlinks first
            current = fs.realpathSync(current);
        } catch(e) {}

        while (true) {
            if (fs.existsSync(path.join(current, '.git')) || fs.existsSync(path.join(current, '.codex'))) {
                return current;
            }
            const parent = path.dirname(current);
            if (parent === current) return null;
            current = parent;
        }
    }
}
