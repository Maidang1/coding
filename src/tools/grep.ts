import { ToolResult, createSafeTool } from "./types";

interface GrepInput {
  pattern: string;
  path: string;
  flags?: string;
}

interface GrepMatch {
  lineNumber: number;
  content: string;
}

async function grepImpl(input: GrepInput): Promise<ToolResult<GrepMatch[]>> {
  try {
    const file = Bun.file(input.path);

    if (!(await file.exists())) {
      return {
        success: false,
        error: `File not found: ${input.path}`,
      };
    }

    const content = await file.text();
    const lines = content.split("\n");
    const matches: GrepMatch[] = [];

    let regex: RegExp;
    try {
      regex = new RegExp(input.pattern, input.flags || "");
    } catch (error) {
      return {
        success: false,
        error: `Invalid regular expression: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    lines.forEach((line, index) => {
      if (regex.test(line)) {
        matches.push({
          lineNumber: index + 1,
          content: line,
        });
      }
    });

    return {
      success: true,
      data: matches,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to grep file: ${errorMessage}`,
    };
  }
}

export const definition = createSafeTool({
  name: "grep",
  description:
    "Searches for a pattern in a file using regular expressions and returns matching lines with line numbers",
  inputSchema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "The regular expression pattern to search for",
      },
      path: {
        type: "string",
        description: "The path to the file to search",
      },
      flags: {
        type: "string",
        description: "Optional regex flags (e.g., 'i' for case-insensitive)",
      },
    },
    required: ["pattern", "path"],
  },
});

export async function grep(
  input: GrepInput
): Promise<ToolResult<GrepMatch[]>> {
  return grepImpl(input);
}
