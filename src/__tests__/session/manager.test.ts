import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { mkdir, rm, readdir } from "node:fs/promises";
import { join } from "node:path";
import { SessionManager, type Session } from "../../session/manager";

describe("SessionManager", () => {
  const testSessionDir = "/tmp/claude-cli-test-sessions";
  let manager: SessionManager;

  beforeEach(async () => {
    // Create clean test directory
    await rm(testSessionDir, { recursive: true, force: true });
    await mkdir(testSessionDir, { recursive: true });
    manager = new SessionManager(testSessionDir);
  });

  afterEach(async () => {
    // Clean up
    await rm(testSessionDir, { recursive: true, force: true });
  });

  describe("save()", () => {
    test("should save a session to JSON file", async () => {
      const session: Session = {
        id: "test-session-1",
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" },
        ],
        toolCalls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await manager.save(session);

      expect(result.success).toBe(true);
      
      // Verify file was created
      const filePath = join(testSessionDir, `${session.id}.json`);
      const file = Bun.file(filePath);
      expect(await file.exists()).toBe(true);
      
      // Verify content
      const content = await file.json();
      expect(content.id).toBe(session.id);
      expect(content.messages).toHaveLength(2);
    });

    test("should overwrite existing session with same id", async () => {
      const session1: Session = {
        id: "test-session-1",
        messages: [{ role: "user", content: "First" }],
        toolCalls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const session2: Session = {
        id: "test-session-1",
        messages: [{ role: "user", content: "Second" }],
        toolCalls: [],
        createdAt: session1.createdAt,
        updatedAt: new Date().toISOString(),
      };

      await manager.save(session1);
      const result = await manager.save(session2);

      expect(result.success).toBe(true);
      
      const loaded = await manager.load("test-session-1");
      expect(loaded.success).toBe(true);
      if (loaded.success) {
        expect(loaded.data.messages[0].content).toBe("Second");
      }
    });

    test("should handle save errors gracefully", async () => {
      // Create manager with invalid directory path
      const invalidManager = new SessionManager("/invalid/path/that/cannot/be/created");
      
      const session: Session = {
        id: "test-session",
        messages: [],
        toolCalls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await invalidManager.save(session);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("load()", () => {
    test("should load an existing session", async () => {
      const session: Session = {
        id: "test-load",
        messages: [{ role: "user", content: "Test message" }],
        toolCalls: [
          {
            id: "tool-1",
            name: "read_file",
            input: { path: "/test.txt" },
            result: { success: true, data: "test content" },
          },
        ],
        createdAt: "2026-01-31T10:00:00Z",
        updatedAt: "2026-01-31T10:05:00Z",
      };

      await manager.save(session);
      const result = await manager.load("test-load");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("test-load");
        expect(result.data.messages).toHaveLength(1);
        expect(result.data.toolCalls).toHaveLength(1);
        expect(result.data.createdAt).toBe("2026-01-31T10:00:00Z");
      }
    });

    test("should return error for non-existent session", async () => {
      const result = await manager.load("non-existent-session");
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    test("should handle corrupted JSON files gracefully", async () => {
      const filePath = join(testSessionDir, "corrupted.json");
      await Bun.write(filePath, "{ invalid json }");

      const result = await manager.load("corrupted");
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("list()", () => {
    test("should list all sessions", async () => {
      const session1: Session = {
        id: "session-1",
        messages: [],
        toolCalls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const session2: Session = {
        id: "session-2",
        messages: [],
        toolCalls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await manager.save(session1);
      await manager.save(session2);

      const result = await manager.list();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data.map((s) => s.id)).toContain("session-1");
        expect(result.data.map((s) => s.id)).toContain("session-2");
      }
    });

    test("should return empty array when no sessions exist", async () => {
      const result = await manager.list();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    test("should skip non-JSON files", async () => {
      await Bun.write(join(testSessionDir, "not-a-json.txt"), "text file");
      await Bun.write(join(testSessionDir, "session-1.json"), JSON.stringify({
        id: "session-1",
        messages: [],
        toolCalls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const result = await manager.list();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].id).toBe("session-1");
      }
    });

    test("should handle empty directory", async () => {
      const result = await manager.list();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("delete()", () => {
    test("should delete an existing session", async () => {
      const session: Session = {
        id: "to-delete",
        messages: [],
        toolCalls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await manager.save(session);
      const deleteResult = await manager.delete("to-delete");

      expect(deleteResult.success).toBe(true);
      
      // Verify file is gone
      const loadResult = await manager.load("to-delete");
      expect(loadResult.success).toBe(false);
    });

    test("should return error when deleting non-existent session", async () => {
      const result = await manager.delete("non-existent");
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });
  });

  describe("Session structure", () => {
    test("should preserve all session fields", async () => {
      const session: Session = {
        id: "full-session",
        messages: [
          { role: "user", content: "User message" },
          { role: "assistant", content: "Assistant response" },
        ],
        toolCalls: [
          {
            id: "tc-1",
            name: "read_file",
            input: { path: "/file.txt" },
            result: { success: true, data: "content" },
          },
        ],
        createdAt: "2026-01-31T10:00:00Z",
        updatedAt: "2026-01-31T10:10:00Z",
      };

      await manager.save(session);
      const result = await manager.load("full-session");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(session);
      }
    });
  });
});
