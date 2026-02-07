import { describe, expect, it } from "bun:test";

import {
  formatConfirmPreview,
  formatConfirmReason,
  shouldShowConfirmReason,
} from "./confirm";

describe("confirm formatter", () => {
  it("normalizes generic reason", () => {
    expect(formatConfirmReason("Command execution requires confirmation")).toBe(
      "Needs approval",
    );
  });

  it("normalizes command preview", () => {
    expect(formatConfirmPreview("Run command:\n  npm run test\n")).toBe(
      "cmd: npm run test",
    );
  });

  it("hides generic reason when command preview exists", () => {
    expect(
      shouldShowConfirmReason(
        "Command execution requires confirmation",
        "Run command: bun test",
      ),
    ).toBe(false);
  });

  it("shows non-generic reason", () => {
    expect(shouldShowConfirmReason("Path write required", undefined)).toBe(true);
  });
});
