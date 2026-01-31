/** @jsxImportSource react */
import { test, expect, describe } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { ToolStatusPanel } from "../../../ui/components/ToolStatusPanel";

describe("ToolStatusPanel Component", () => {
  test("renders with no active tool", () => {
    const { lastFrame } = render(<ToolStatusPanel currentTool={null} history={[]} />);
    const output = lastFrame();
    
    expect(output).toContain("Tool Status");
  });

  test("displays current tool execution", () => {
    const currentTool = {
      name: "read_file",
      status: "running" as const,
      input: { path: "/test.txt" },
    };
    
    const { lastFrame } = render(<ToolStatusPanel currentTool={currentTool} history={[]} />);
    const output = lastFrame();
    
    expect(output).toContain("read_file");
    expect(output).toContain("running");
  });

  test("shows tool history", () => {
    const history = [
      { name: "read_file", status: "done" as const, input: { path: "/test.txt" } },
      { name: "write_file", status: "done" as const, input: { path: "/out.txt" } },
    ];
    
    const { lastFrame } = render(<ToolStatusPanel currentTool={null} history={history} />);
    const output = lastFrame();
    
    expect(output).toContain("read_file");
    expect(output).toContain("write_file");
  });

  test("limits history display", () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      name: `tool_${i}`,
      status: "done" as const,
      input: {},
    }));
    
    const { lastFrame } = render(<ToolStatusPanel currentTool={null} history={history} maxHistory={5} />);
    const output = lastFrame();
    
    const matches = output.match(/tool_/g);
    expect(matches?.length).toBeLessThanOrEqual(5);
  });

  test("displays error status", () => {
    const currentTool = {
      name: "bash",
      status: "error" as const,
      input: { command: "invalid" },
    };
    
    const { lastFrame } = render(<ToolStatusPanel currentTool={currentTool} history={[]} />);
    const output = lastFrame();
    
    expect(output).toContain("error");
  });

  test("handles pending status", () => {
    const currentTool = {
      name: "write_file",
      status: "pending" as const,
      input: { path: "/file.txt" },
    };
    
    const { lastFrame } = render(<ToolStatusPanel currentTool={currentTool} history={[]} />);
    const output = lastFrame();
    
    expect(output).toContain("pending");
  });
});
