import assert from "node:assert/strict";
import os from "node:os";
import test from "node:test";
import {
  isUriTarget,
  parseLocalTargetLocation,
  resolveLocalTargetPath,
} from "../src/targetResolution";

test("isUriTarget returns true for external urls", () => {
  assert.equal(isUriTarget("https://example.com/docs"), true);
  assert.equal(isUriTarget("mailto:test@example.com"), true);
});

test("isUriTarget does not treat Windows absolute paths as uris", () => {
  assert.equal(isUriTarget("C:\\Users\\jake\\note.md"), false);
});

test("parseLocalTargetLocation extracts line and column from a relative path", () => {
  assert.deepEqual(parseLocalTargetLocation("./docs/guide.md:12:3"), {
    path: "./docs/guide.md",
    line: 12,
    column: 3,
  });
});

test("parseLocalTargetLocation extracts the start line from a relative path range", () => {
  assert.deepEqual(parseLocalTargetLocation("./docs/guide.md:12-18"), {
    path: "./docs/guide.md",
    line: 12,
  });
});

test("parseLocalTargetLocation extracts the start line and column from a range", () => {
  assert.deepEqual(parseLocalTargetLocation("./docs/guide.md:12-18:4"), {
    path: "./docs/guide.md",
    line: 12,
    column: 4,
  });
});

test("parseLocalTargetLocation extracts line and column from a Windows path", () => {
  assert.deepEqual(parseLocalTargetLocation("C:\\Users\\jake\\note.md:8:2"), {
    path: "C:\\Users\\jake\\note.md",
    line: 8,
    column: 2,
  });
});

test("parseLocalTargetLocation extracts a range and column from a Windows path", () => {
  assert.deepEqual(parseLocalTargetLocation("C:\\Users\\jake\\note.md:8-12:2"), {
    path: "C:\\Users\\jake\\note.md",
    line: 8,
    column: 2,
  });
});

test("parseLocalTargetLocation extracts a markdown heading fragment", () => {
  assert.deepEqual(parseLocalTargetLocation("./docs/guide.md#getting-started"), {
    path: "./docs/guide.md",
    fragment: "getting-started",
  });
});

test("parseLocalTargetLocation extracts a line number from a local file fragment", () => {
  assert.deepEqual(
    parseLocalTargetLocation("/tmp/project/Cargo.toml#L27"),
    {
      path: "/tmp/project/Cargo.toml",
      line: 27,
    },
  );
});

test("parseLocalTargetLocation extracts the start line from a line range fragment", () => {
  assert.deepEqual(
    parseLocalTargetLocation("/tmp/project/Cargo.toml#L27-L30"),
    {
      path: "/tmp/project/Cargo.toml",
      line: 27,
    },
  );
});

test("parseLocalTargetLocation supports current-document fragments", () => {
  assert.deepEqual(parseLocalTargetLocation("#getting-started"), {
    path: "",
    fragment: "getting-started",
  });
});

test("parseLocalTargetLocation leaves paths without a suffix unchanged", () => {
  assert.deepEqual(parseLocalTargetLocation("src/extension.ts"), {
    path: "src/extension.ts",
  });
});

test("resolveLocalTargetPath resolves relative paths from the current document", () => {
  assert.equal(
    resolveLocalTargetPath("./docs/guide.md", "/tmp/note.md"),
    "/tmp/docs/guide.md",
  );
});

test("resolveLocalTargetPath ignores line and column suffixes while resolving", () => {
  assert.equal(
    resolveLocalTargetPath("./docs/guide.md:12:3", "/tmp/note.md"),
    "/tmp/docs/guide.md",
  );
});

test("resolveLocalTargetPath ignores line range suffixes while resolving", () => {
  assert.equal(
    resolveLocalTargetPath("./docs/guide.md:12-18", "/tmp/note.md"),
    "/tmp/docs/guide.md",
  );
});

test("resolveLocalTargetPath ignores range and column suffixes while resolving", () => {
  assert.equal(
    resolveLocalTargetPath("./docs/guide.md:12-18:4", "/tmp/note.md"),
    "/tmp/docs/guide.md",
  );
});

test("resolveLocalTargetPath ignores markdown fragments while resolving", () => {
  assert.equal(
    resolveLocalTargetPath("./docs/guide.md#getting-started", "/tmp/note.md"),
    "/tmp/docs/guide.md",
  );
});

test("resolveLocalTargetPath ignores line fragments while resolving", () => {
  assert.equal(
    resolveLocalTargetPath("/tmp/project/Cargo.toml#L27", "/tmp/note.md"),
    "/tmp/project/Cargo.toml",
  );
});

test("resolveLocalTargetPath keeps current-document fragments on the active file", () => {
  assert.equal(resolveLocalTargetPath("#getting-started", "/tmp/note.md"), "/tmp/note.md");
});

test("resolveLocalTargetPath expands home-relative paths", () => {
  assert.equal(
    resolveLocalTargetPath("~/docs/guide.md:12", "/tmp/note.md"),
    `${os.homedir()}/docs/guide.md`,
  );
});

test("resolveLocalTargetPath falls back to the workspace root when the document-relative path is missing", () => {
  const existingPaths = new Set(["/tmp/workspace/README.md"]);

  assert.equal(
    resolveLocalTargetPath("README.md", "/tmp/workspace/docs/note.md", {
      workspacePath: "/tmp/workspace",
      pathExists: (targetPath) => existingPaths.has(targetPath),
    }),
    "/tmp/workspace/README.md",
  );
});

test("resolveLocalTargetPath keeps the document-relative path when it exists", () => {
  const existingPaths = new Set([
    "/tmp/workspace/docs/README.md",
    "/tmp/workspace/README.md",
  ]);

  assert.equal(
    resolveLocalTargetPath("README.md", "/tmp/workspace/docs/note.md", {
      workspacePath: "/tmp/workspace",
      pathExists: (targetPath) => existingPaths.has(targetPath),
    }),
    "/tmp/workspace/docs/README.md",
  );
});
