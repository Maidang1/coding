/** @jsxImportSource react */
import { test, expect, describe } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { Input } from "../../../ui/components/Input";

describe("Input Component", () => {
  test("renders input prompt", () => {
    const { lastFrame } = render(<Input value="" onChange={() => {}} onSubmit={() => {}} />);
    const output = lastFrame();
    
    expect(output).toContain(">");
  });

  test("displays current value", () => {
    const { lastFrame } = render(<Input value="test input" onChange={() => {}} onSubmit={() => {}} />);
    const output = lastFrame();
    
    expect(output).toContain("test input");
  });

  test("calls onChange when value changes", () => {
    let currentValue = "";
    const onChange = (value: string) => {
      currentValue = value;
    };
    
    const { stdin } = render(<Input value="" onChange={onChange} onSubmit={() => {}} />);
    stdin.write("hello");
    
    expect(currentValue).toBe("hello");
  });

  test("calls onSubmit when Enter pressed", () => {
    let submitted = false;
    const onSubmit = () => {
      submitted = true;
    };
    
    const { stdin } = render(<Input value="test" onChange={() => {}} onSubmit={onSubmit} />);
    stdin.write("\r");
    
    expect(submitted).toBe(true);
  });

  test("handles empty input", () => {
    const { lastFrame } = render(<Input value="" onChange={() => {}} onSubmit={() => {}} />);
    const output = lastFrame();
    
    expect(output).toBeDefined();
  });

  test("shows placeholder when empty", () => {
    const { lastFrame } = render(
      <Input value="" onChange={() => {}} onSubmit={() => {}} placeholder="Type a message..." />
    );
    const output = lastFrame();
    
    expect(output).toContain("Type a message...");
  });
});
