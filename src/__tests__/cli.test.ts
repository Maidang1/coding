import { test, expect, describe } from "bun:test";
import { spawnSync } from "bun";
import { readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

describe("CLI Entry Point", () => {
  const cliPath = join(import.meta.dir, "../../bin/claude-cli");
  const packageJsonPath = join(import.meta.dir, "../../package.json");

  function getBunPath(): string {
    try {
      return execSync("which bun", { encoding: "utf-8" }).trim();
    } catch {
      return "bun";
    }
  }

  describe("--help flag", () => {
    test("displays usage information", () => {
      const bun = getBunPath();
      const result = spawnSync([bun, cliPath, "--help"], {
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: "test-key",
        },
      });

      const output = result.stdout.toString();
      expect(output).toContain("claude-cli");
      expect(output).toContain("Usage");
      expect(output).toContain("--help");
      expect(output).toContain("--version");
    });
  });

  describe("--version flag", () => {
    test("displays version from package.json", () => {
      const bun = getBunPath();
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      const expectedVersion = packageJson.version;

      const result = spawnSync([bun, cliPath, "--version"], {
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: "test-key",
        },
      });

      const output = result.stdout.toString();
      expect(output).toContain(expectedVersion);
    });
  });

  describe("API Key validation", () => {
    test("exits with error when ANTHROPIC_API_KEY is missing", () => {
      const bun = getBunPath();
      const result = spawnSync([bun, cliPath], {
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: undefined,
        },
      });

      const stderr = result.stderr.toString();
      expect(result.exitCode).toBe(1);
      expect(stderr).toContain("ANTHROPIC_API_KEY");
    });

    test("does not error when ANTHROPIC_API_KEY is present", () => {
      const bun = getBunPath();
      const result = spawnSync([bun, cliPath, "--help"], {
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: "sk-test-key",
        },
      });

      expect(result.exitCode).toBe(0);
    });
  });

  describe("Flag handling", () => {
    test("--help takes precedence over missing API key", () => {
      const bun = getBunPath();
      const result = spawnSync([bun, cliPath, "--help"], {
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: undefined,
        },
      });

      const output = result.stdout.toString();
      expect(output).toContain("Usage");
    });

    test("--version takes precedence over missing API key", () => {
      const bun = getBunPath();
      const result = spawnSync([bun, cliPath, "--version"], {
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: undefined,
        },
      });

      const output = result.stdout.toString();
      expect(output).toMatch(/\d+\.\d+\.\d+/);
    });

    test("unknown flags display help", () => {
      const bun = getBunPath();
      const result = spawnSync([bun, cliPath, "--unknown"], {
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: "test-key",
        },
      });

      const output = result.stdout.toString();
      expect(output).toContain("Usage");
    });
  });

  describe("Environment variable requirements", () => {
    test("error message mentions ANTHROPIC_API_KEY", () => {
      const bun = getBunPath();
      const result = spawnSync([bun, cliPath], {
        env: {},
      });

      const stderr = result.stderr.toString();
      expect(stderr).toContain("ANTHROPIC_API_KEY");
    });
  });
});
