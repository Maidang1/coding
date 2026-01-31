/** @jsxImportSource react */
import { test, expect, describe } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { Confirmation } from "../../../ui/components/Confirmation";

describe("Confirmation Component", () => {
  test("renders when confirmation is present", () => {
    const confirmation = {
      toolName: "write_file",
      description: "Write to /test.txt",
    };
    const { lastFrame } = render(
      <Confirmation confirmation={confirmation} onConfirm={() => {}} onReject={() => {}} />
    );
    const output = lastFrame();

    expect(output).toContain("write_file");
    expect(output).toContain("/test.txt");
  });

  test("does not render when confirmation is null", () => {
    const { lastFrame } = render(
      <Confirmation confirmation={null} onConfirm={() => {}} onReject={() => {}} />
    );
    const output = lastFrame();

    expect(output?.trim()).toBe("");
  });

  test("displays tool name", () => {
    const confirmation = {
      toolName: "bash",
      description: "Execute command",
    };
    const { lastFrame } = render(
      <Confirmation confirmation={confirmation} onConfirm={() => {}} onReject={() => {}} />
    );
    const output = lastFrame();

    expect(output).toContain("bash");
  });

  test("displays description", () => {
    const confirmation = {
      toolName: "edit_file",
      description: "Replace text in /src/main.ts",
    };
    const { lastFrame } = render(
      <Confirmation confirmation={confirmation} onConfirm={() => {}} onReject={() => {}} />
    );
    const output = lastFrame();

    expect(output).toContain("Replace text in /src/main.ts");
  });

  test("shows prompt text", () => {
    const confirmation = {
      toolName: "write_file",
      description: "Create file",
    };
    const { lastFrame } = render(
      <Confirmation confirmation={confirmation} onConfirm={() => {}} onReject={() => {}} />
    );
    const output = lastFrame();

    expect(output?.toLowerCase()).toContain("confirm");
  });

  test("calls onConfirm when 'y' key is pressed", () => {
    let confirmed = false;
    const onConfirm = () => {
      confirmed = true;
    };

    const confirmation = {
      toolName: "write_file",
      description: "Test",
    };
    const { stdin } = render(
      <Confirmation confirmation={confirmation} onConfirm={onConfirm} onReject={() => {}} />
    );

    stdin.write("y");
    expect(confirmed).toBe(true);
  });

  test("calls onReject when 'n' key is pressed", () => {
    let rejected = false;
    const onReject = () => {
      rejected = true;
    };

    const confirmation = {
      toolName: "bash",
      description: "Test",
    };
    const { stdin } = render(
      <Confirmation confirmation={confirmation} onConfirm={() => {}} onReject={onReject} />
    );

    stdin.write("n");
    expect(rejected).toBe(true);
  });

  test("does not call callbacks when confirmation is null", () => {
    let confirmed = false;
    let rejected = false;

    const { stdin } = render(
      <Confirmation
        confirmation={null}
        onConfirm={() => {
          confirmed = true;
        }}
        onReject={() => {
          rejected = true;
        }}
      />
    );

    stdin.write("y");
    stdin.write("n");

    expect(confirmed).toBe(false);
    expect(rejected).toBe(false);
  });

  test("displays dangerous operation warning", () => {
    const confirmation = {
      toolName: "write_file",
      description: "Overwrite important file",
    };
    const { lastFrame } = render(
      <Confirmation confirmation={confirmation} onConfirm={() => {}} onReject={() => {}} />
    );
    const output = lastFrame();

    expect(output?.toLowerCase()).toContain("dangerous");
  });
});
