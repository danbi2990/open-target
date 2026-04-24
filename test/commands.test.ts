import assert from "node:assert/strict";
import test from "node:test";
import { createCommandHandlers } from "../src/commands";
import { ActiveLinkContext, LinkHost } from "../src/types";

function createHost(context?: ActiveLinkContext): {
  host: LinkHost;
  opened: Array<{ documentPath: string; target: string }>;
  warnings: string[];
} {
  const opened: Array<{ documentPath: string; target: string }> = [];
  const warnings: string[] = [];

  return {
    host: {
      getActiveLinkContext(): ActiveLinkContext | undefined {
        return context;
      },
      async openTarget(target: string, documentPath: string): Promise<void> {
        opened.push({ target, documentPath });
      },
      showWarningMessage(message: string): void {
        warnings.push(message);
      },
    },
    opened,
    warnings,
  };
}

test("openTargetUnderCursor warns when there is no active text editor", async () => {
  const fixture = createHost();
  const handlers = createCommandHandlers(fixture.host);

  await handlers.openTargetUnderCursor();

  assert.deepEqual(fixture.opened, []);
  assert.deepEqual(fixture.warnings, ["No active text editor"]);
});

test("openTargetUnderCursor opens a markdown link in a markdown file", async () => {
  const fixture = createHost({
    languageId: "markdown",
    documentPath: "/tmp/note.md",
    lineText: "[Docs](https://example.com) and [Other](https://other.example)",
    cursorCharacter: 999,
  });
  const handlers = createCommandHandlers(fixture.host);

  await handlers.openTargetUnderCursor();

  assert.deepEqual(fixture.warnings, []);
  assert.deepEqual(fixture.opened, [
    {
      target: "https://example.com",
      documentPath: "/tmp/note.md",
    },
  ]);
});

test("openTargetUnderCursor opens a plain url in a non-markdown file", async () => {
  const fixture = createHost({
    languageId: "plaintext",
    documentPath: "/tmp/note.txt",
    lineText: "See https://example.com/docs for details",
    cursorCharacter: 12,
  });
  const handlers = createCommandHandlers(fixture.host);

  await handlers.openTargetUnderCursor();

  assert.deepEqual(fixture.warnings, []);
  assert.deepEqual(fixture.opened, [
    {
      target: "https://example.com/docs",
      documentPath: "/tmp/note.txt",
    },
  ]);
});

test("openTargetUnderCursor opens a plain file path on the current line", async () => {
  const fixture = createHost({
    languageId: "plaintext",
    documentPath: "/tmp/note.txt",
    lineText: "Open src/extension.ts for details",
    cursorCharacter: 8,
  });
  const handlers = createCommandHandlers(fixture.host);

  await handlers.openTargetUnderCursor();

  assert.deepEqual(fixture.warnings, []);
  assert.deepEqual(fixture.opened, [
    {
      target: "src/extension.ts",
      documentPath: "/tmp/note.txt",
    },
  ]);
});

test("openTargetUnderCursor passes through file paths with line and column suffixes", async () => {
  const fixture = createHost({
    languageId: "plaintext",
    documentPath: "/tmp/note.txt",
    lineText: "Open src/extension.ts:20:5 for details",
    cursorCharacter: 10,
  });
  const handlers = createCommandHandlers(fixture.host);

  await handlers.openTargetUnderCursor();

  assert.deepEqual(fixture.warnings, []);
  assert.deepEqual(fixture.opened, [
    {
      target: "src/extension.ts:20:5",
      documentPath: "/tmp/note.txt",
    },
  ]);
});

test("openTargetUnderCursor prefers the target under the cursor when multiple targets exist", async () => {
  const fixture = createHost({
    languageId: "markdown",
    documentPath: "/tmp/note.md",
    lineText: "[Docs](https://example.com) and [Other](https://other.example)",
    cursorCharacter: 33,
  });
  const handlers = createCommandHandlers(fixture.host);

  await handlers.openTargetUnderCursor();

  assert.deepEqual(fixture.warnings, []);
  assert.deepEqual(fixture.opened, [
    {
      target: "https://other.example",
      documentPath: "/tmp/note.md",
    },
  ]);
});

test("openTargetUnderCursor warns when no target is on the current line", async () => {
  const fixture = createHost({
    languageId: "markdown",
    documentPath: "/tmp/note.md",
    lineText: "Read without links",
    cursorCharacter: 0,
  });
  const handlers = createCommandHandlers(fixture.host);

  await handlers.openTargetUnderCursor();

  assert.deepEqual(fixture.opened, []);
  assert.deepEqual(fixture.warnings, ["No target found on the current line"]);
});
