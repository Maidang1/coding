import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { grep, definition } from "../../tools/grep";
import { DangerLevel } from "../../tools/types";

const TEST_DIR = "/tmp/claude-cli-test-grep";
const TEST_FILE = `${TEST_DIR}/test.txt`;

describe("grep tool", () => {
  beforeEach(async () => {
    await Bun.$`mkdir -p ${TEST_DIR}`.quiet();
    await Bun.write(
      TEST_FILE,
      "Line 1: Hello World\nLine 2: Hello Universe\nLine 3: Goodbye World\nLine 4: test"
    );
  });

  afterEach(async () => {
    await Bun.$`rm -rf ${TEST_DIR}`.quiet();
  });

  describe("definition", () => {
    test("has correct name", () => {
      expect(definition.name).toBe("grep");
    });

    test("has description", () => {
      expect(definition.description).toBeTruthy();
    });

    test("has input_schema", () => {
      expect(definition.input_schema).toBeDefined();
      expect(definition.input_schema.properties.pattern).toBeDefined();
      expect(definition.input_schema.properties.path).toBeDefined();
    });

    test("is marked as safe", () => {
      expect(definition.dangerLevel).toBe(DangerLevel.safe);
    });
  });

  describe("grep function", () => {
    test("finds matches with simple pattern", async () => {
      const result = await grep({
        pattern: "Hello",
        path: TEST_FILE,
      });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
      expect(result.data?.[0].content).toContain("Hello World");
      expect(result.data?.[1].content).toContain("Hello Universe");
    });

    test("returns line numbers", async () => {
      const result = await grep({
        pattern: "World",
        path: TEST_FILE,
      });

      expect(result.success).toBe(true);
      expect(result.data?.[0].lineNumber).toBe(1);
      expect(result.data?.[1].lineNumber).toBe(3);
    });

    test("returns empty array when no matches", async () => {
      const result = await grep({
        pattern: "NotFound",
        path: TEST_FILE,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test("supports case-insensitive flag", async () => {
      const result = await grep({
        pattern: "hello",
        path: TEST_FILE,
        flags: "i",
      });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
    });

    test("supports regex patterns", async () => {
      const result = await grep({
        pattern: "Line \\d+:",
        path: TEST_FILE,
      });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(4);
    });

    test("returns error for invalid regex", async () => {
      const result = await grep({
        pattern: "[invalid",
        path: TEST_FILE,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    test("returns error for nonexistent file", async () => {
      const result = await grep({
        pattern: "test",
        path: "/nonexistent/file.txt",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test("handles empty file", async () => {
      const emptyFile = `${TEST_DIR}/empty.txt`;
      await Bun.write(emptyFile, "");

      const result = await grep({
        pattern: "test",
        path: emptyFile,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
