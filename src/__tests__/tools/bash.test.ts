import { test, expect, describe } from "bun:test";
import { bash, definition } from "../../tools/bash";
import { DangerLevel } from "../../tools/types";

describe("bash tool", () => {
  describe("definition", () => {
    test("has correct name", () => {
      expect(definition.name).toBe("bash");
    });

    test("has description", () => {
      expect(definition.description).toBeTruthy();
    });

    test("has input_schema", () => {
      expect(definition.input_schema).toBeDefined();
      expect(definition.input_schema.properties.command).toBeDefined();
    });

    test("is marked as dangerous", () => {
      expect(definition.dangerLevel).toBe(DangerLevel.dangerous);
    });
  });

  describe("bash function", () => {
    test("executes simple command successfully", async () => {
      const result = await bash({ command: "echo 'Hello World'" });

      expect(result.success).toBe(true);
      expect(result.data?.stdout).toContain("Hello World");
      expect(result.data?.exitCode).toBe(0);
    });

    test("captures stderr", async () => {
      const result = await bash({ command: ">&2 echo 'Error message'" });

      expect(result.success).toBe(true);
      expect(result.data?.stderr).toContain("Error message");
    });

    test("returns non-zero exit code for failed commands", async () => {
      const result = await bash({ command: "exit 42" });

      expect(result.success).toBe(true);
      expect(result.data?.exitCode).toBe(42);
    });

    test("executes command in specified cwd", async () => {
      const result = await bash({ command: "pwd", cwd: "/tmp" });

      expect(result.success).toBe(true);
      expect(result.data?.stdout).toContain("/tmp");
    });

    test("handles command not found", async () => {
      const result = await bash({ command: "nonexistentcommand12345" });

      expect(result.success).toBe(true);
      expect(result.data?.exitCode).not.toBe(0);
    });

    test("handles multiline output", async () => {
      const result = await bash({ command: "echo 'line1'; echo 'line2'" });

      expect(result.success).toBe(true);
      expect(result.data?.stdout).toContain("line1");
      expect(result.data?.stdout).toContain("line2");
    });

    test("respects timeout for long-running commands", async () => {
      const start = Date.now();
      const result = await bash({
        command: "sleep 100",
        timeout: 500,
      });
      const duration = Date.now() - start;

      expect(result.success).toBe(false);
      expect(result.error).toContain("timed out");
      expect(duration).toBeLessThan(2000);
    });

    test("returns stdout and stderr together", async () => {
      const result = await bash({
        command: "echo 'out' && >&2 echo 'err'",
      });

      expect(result.success).toBe(true);
      expect(result.data?.stdout).toBeTruthy();
      expect(result.data?.stderr).toBeTruthy();
    });
  });
});
