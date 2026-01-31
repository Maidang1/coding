/** @jsxImportSource react */
import { test, expect, describe } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { App } from "../../ui/App";

describe("App Component", () => {
  test("renders basic TUI shell", () => {
    const { lastFrame } = render(<App />);
    const output = lastFrame();

    expect(output).toContain("Claude CLI Agent");
    expect(output).toContain("Press Ctrl+C to exit");
  });

  test("displays title", () => {
    const { lastFrame } = render(<App />);
    const output = lastFrame();

    expect(output).toContain("Claude CLI Agent");
  });

  test("renders without crashing", () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
