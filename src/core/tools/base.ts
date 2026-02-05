import type Anthropic from "@anthropic-ai/sdk";

export type ToolExecutionResult =
  | string
  | {
      content: string;
      filesChanged?: string[];
      preview?: string;
    };

export abstract class Tool {
  abstract name: string;
  abstract description: string;

  abstract getSchema(): Anthropic.Tool;
  abstract execute(input: any): Promise<ToolExecutionResult> | ToolExecutionResult;

  getPreview?(input: any): string;
}
