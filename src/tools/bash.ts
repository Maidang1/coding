import { ToolResult, createDangerousTool } from "./types";

interface BashInput {
  command: string;
  cwd?: string;
  timeout?: number;
}

interface BashOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function bashImpl(input: BashInput): Promise<ToolResult<BashOutput>> {
  try {
    const timeoutMs = input.timeout || 30000;

    const proc = Bun.spawn(["sh", "-c", input.command], {
      cwd: input.cwd,
      stdout: "pipe",
      stderr: "pipe",
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        proc.kill();
        reject(new Error(`Command timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const resultPromise = Promise.all([
      proc.exited,
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    const [exitCode, stdout, stderr] = await Promise.race([
      resultPromise,
      timeoutPromise,
    ]);

    return {
      success: true,
      data: {
        stdout,
        stderr,
        exitCode,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to execute command: ${errorMessage}`,
    };
  }
}

export const definition = createDangerousTool({
  name: "bash",
  description:
    "Executes a bash command and returns stdout, stderr, and exit code. Dangerous - can modify system state.",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The bash command to execute",
      },
      cwd: {
        type: "string",
        description: "Working directory for command execution (optional)",
      },
      timeout: {
        type: "number",
        description: "Timeout in milliseconds (default: 30000)",
      },
    },
    required: ["command"],
  },
});

export async function bash(input: BashInput): Promise<ToolResult<BashOutput>> {
  return bashImpl(input);
}
