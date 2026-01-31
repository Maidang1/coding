import type { ToolResult } from "../tools/types";
import { join } from "node:path";
import { readdir, mkdir } from "node:fs/promises";
import { homedir } from "node:os";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result: ToolResult<unknown>;
}

export interface Session {
  id: string;
  messages: Message[];
  toolCalls: ToolCall[];
  createdAt: string;
  updatedAt: string;
}

export class SessionManager {
  private readonly sessionDir: string;

  constructor(sessionDir?: string) {
    this.sessionDir = sessionDir || join(homedir(), ".claude-cli", "sessions");
  }

  async save(session: Session): Promise<ToolResult<void>> {
    try {
      await mkdir(this.sessionDir, { recursive: true });
      
      const filePath = join(this.sessionDir, `${session.id}.json`);
      await Bun.write(filePath, JSON.stringify(session, null, 2));
      
      return { success: true, data: undefined };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: `Failed to save session: ${message}` };
    }
  }

  async load(sessionId: string): Promise<ToolResult<Session>> {
    try {
      const filePath = join(this.sessionDir, `${sessionId}.json`);
      const file = Bun.file(filePath);
      
      if (!(await file.exists())) {
        return { success: false, error: `Session ${sessionId} not found` };
      }
      
      const session = await file.json();
      return { success: true, data: session as Session };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: `Failed to load session: ${message}` };
    }
  }

  async list(): Promise<ToolResult<Session[]>> {
    try {
      await mkdir(this.sessionDir, { recursive: true });
      
      const files = await readdir(this.sessionDir);
      const jsonFiles = files.filter((file) => file.endsWith(".json"));
      
      const sessions: Session[] = [];
      for (const file of jsonFiles) {
        const sessionId = file.replace(".json", "");
        const result = await this.load(sessionId);
        if (result.success) {
          sessions.push(result.data);
        }
      }
      
      return { success: true, data: sessions };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: `Failed to list sessions: ${message}` };
    }
  }

  async delete(sessionId: string): Promise<ToolResult<void>> {
    try {
      const filePath = join(this.sessionDir, `${sessionId}.json`);
      const file = Bun.file(filePath);
      
      if (!(await file.exists())) {
        return { success: false, error: `Session ${sessionId} not found` };
      }
      
      await Bun.write(filePath, "");
      const unlinkResult = await Bun.spawn(["rm", filePath]).exited;
      
      if (unlinkResult !== 0) {
        return { success: false, error: `Failed to delete session file` };
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: `Failed to delete session: ${message}` };
    }
  }

  getSessionDir(): string {
    return this.sessionDir;
  }
}
