import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { writeFile, definition } from "../../tools/write_file";
import { DangerLevel } from "../../tools/types";

const TEST_DIR = "/tmp/claude-cli-test";
const TEST_FILE = `${TEST_DIR}/test-write.txt`;

describe("write_file tool", () => {
  beforeEach(async () => {
    await Bun.$`mkdir -p ${TEST_DIR}`.quiet();
  });

  afterEach(async () => {
    await Bun.$`rm -rf ${TEST_DIR}`.quiet();
  });

  describe("definition", () => {
    test("has correct name", () => {
      expect(definition.name).toBe("write_file");
    });

    test("has description", () => {
      expect(definition.description).toBeTruthy();
    });

    test("has input_schema", () => {
      expect(definition.input_schema).toBeDefined();
      expect(definition.input_schema.properties.path).toBeDefined();
      expect(definition.input_schema.properties.content).toBeDefined();
    });

    test("is marked as dangerous", () => {
      expect(definition.dangerLevel).toBe(DangerLevel.dangerous);
    });
  });

  describe("writeFile function", () => {
    test("creates new file with content", async () => {
      const result = await writeFile({
        path: TEST_FILE,
        content: "Hello, World!",
      });

      expect(result.success).toBe(true);
      expect(result.data).toContain("wrote");

      const content = await Bun.file(TEST_FILE).text();
      expect(content).toBe("Hello, World!");
    });

    test("overwrites existing file", async () => {
      await Bun.write(TEST_FILE, "Old content");

      const result = await writeFile({
        path: TEST_FILE,
        content: "New content",
      });

      expect(result.success).toBe(true);

      const content = await Bun.file(TEST_FILE).text();
      expect(content).toBe("New content");
    });

    test("creates parent directory if it doesn't exist", async () => {
      const nestedPath = `${TEST_DIR}/nested/dir/file.txt`;

      const result = await writeFile({
        path: nestedPath,
        content: "Nested file",
      });

      expect(result.success).toBe(true);

      const content = await Bun.file(nestedPath).text();
      expect(content).toBe("Nested file");
    });

    test("writes empty content", async () => {
      const result = await writeFile({
        path: TEST_FILE,
        content: "",
      });

      expect(result.success).toBe(true);

      const content = await Bun.file(TEST_FILE).text();
      expect(content).toBe("");
    });

    test("returns error for invalid path", async () => {
      const result = await writeFile({
        path: "/root/cannot-write-here.txt",
        content: "test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test("handles multiline content", async () => {
      const multiline = "Line 1\nLine 2\nLine 3";

      const result = await writeFile({
        path: TEST_FILE,
        content: multiline,
      });

      expect(result.success).toBe(true);

      const content = await Bun.file(TEST_FILE).text();
      expect(content).toBe(multiline);
    });
  });
});
