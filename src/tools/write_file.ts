import { ToolResult, createDangerousTool } from "./types";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

interface WriteFileInput {
  path: string;
  content: string;
}

async function writeFileImpl(
  input: WriteFileInput
): Promise<ToolResult<string>> {
  try {
    const dir = dirname(input.path);
    await mkdir(dir, { recursive: true });
    await Bun.write(input.path, input.content);

    const size = input.content.length;
    return {
      success: true,
      data: `Successfully wrote ${size} bytes to ${input.path}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to write file: ${errorMessage}`,
    };
  }
}

export const definition = createDangerousTool({
  name: "write_file",
  description:
    "Writes content to a file, creating it if it doesn't exist or overwriting if it does. Creates parent directories as needed.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file to write",
      },
      content: {
        type: "string",
        description: "The content to write to the file",
      },
    },
    required: ["path", "content"],
  },
});

export async function writeFile(
  input: WriteFileInput
): Promise<ToolResult<string>> {
  return writeFileImpl(input);
}
