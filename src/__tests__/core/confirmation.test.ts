import { test, expect, describe } from "bun:test";
import { ConfirmationManager } from "../../core/confirmation";

describe("ConfirmationManager", () => {
  test("initializes with no pending confirmation", () => {
    const manager = new ConfirmationManager();
    expect(manager.getPendingConfirmation()).toBeNull();
  });

  test("requestConfirmation returns a Promise", async () => {
    const manager = new ConfirmationManager();
    const promise = manager.requestConfirmation("write_file", "Write to /test.txt");
    expect(promise).toBeInstanceOf(Promise);
  });

  test("getPendingConfirmation returns details when confirmation is pending", () => {
    const manager = new ConfirmationManager();
    manager.requestConfirmation("write_file", "Write to /test.txt");
    
    const pending = manager.getPendingConfirmation();
    expect(pending).not.toBeNull();
    expect(pending?.toolName).toBe("write_file");
    expect(pending?.description).toBe("Write to /test.txt");
  });

  test("confirm() resolves promise with true", async () => {
    const manager = new ConfirmationManager();
    const promise = manager.requestConfirmation("bash", "Execute command");
    manager.confirm();
    
    const result = await promise;
    expect(result).toBe(true);
  });

  test("reject() resolves promise with false", async () => {
    const manager = new ConfirmationManager();
    const promise = manager.requestConfirmation("edit_file", "Edit file");
    manager.reject();
    
    const result = await promise;
    expect(result).toBe(false);
  });

  test("confirm() clears pending confirmation", () => {
    const manager = new ConfirmationManager();
    manager.requestConfirmation("write_file", "Test");
    expect(manager.getPendingConfirmation()).not.toBeNull();
    
    manager.confirm();
    expect(manager.getPendingConfirmation()).toBeNull();
  });

  test("reject() clears pending confirmation", () => {
    const manager = new ConfirmationManager();
    manager.requestConfirmation("bash", "Test");
    expect(manager.getPendingConfirmation()).not.toBeNull();
    
    manager.reject();
    expect(manager.getPendingConfirmation()).toBeNull();
  });

  test("only allows one pending confirmation at a time", async () => {
    const manager = new ConfirmationManager();
    const promise1 = manager.requestConfirmation("write_file", "Write 1");
    const promise2 = manager.requestConfirmation("bash", "Execute");
    
    const pending = manager.getPendingConfirmation();
    expect(pending?.toolName).toBe("bash");
    expect(pending?.description).toBe("Execute");
    
    manager.confirm();
    const result = await promise2;
    expect(result).toBe(true);
  });

  test("multiple confirmations can be handled sequentially", async () => {
    const manager = new ConfirmationManager();
    
    const promise1 = manager.requestConfirmation("write_file", "Write 1");
    manager.confirm();
    const result1 = await promise1;
    expect(result1).toBe(true);
    expect(manager.getPendingConfirmation()).toBeNull();
    
    const promise2 = manager.requestConfirmation("bash", "Execute");
    manager.reject();
    const result2 = await promise2;
    expect(result2).toBe(false);
    expect(manager.getPendingConfirmation()).toBeNull();
  });
});
