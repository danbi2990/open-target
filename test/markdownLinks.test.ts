import assert from "node:assert/strict";
import test from "node:test";
import { findBestLinkInLine } from "../src/markdownLinks";

test("findBestLinkInLine returns the first inline markdown link on the line", () => {
  const lineText = "See [the docs](https://example.com/docs) today.";
  const link = findBestLinkInLine(lineText, 0);

  assert.deepEqual(link, {
    kind: "markdown",
    text: "the docs",
    target: "https://example.com/docs",
    textStart: 5,
    textEnd: 39,
  });
});

test("findBestLinkInLine returns the first link when the cursor is not on any link", () => {
  const lineText = "See [the docs](https://example.com/docs) today.";

  assert.equal(findBestLinkInLine(lineText, 0)?.target, "https://example.com/docs");
});

test("findBestLinkInLine handles multiple markdown links on one line", () => {
  const lineText = "[One](./one.md) and [Two](./two.md)";

  assert.equal(findBestLinkInLine(lineText, 0)?.target, "./one.md");
});

test("findBestLinkInLine returns a plain url when no markdown link comes first", () => {
  const lineText = "Visit https://example.com/docs now";
  const link = findBestLinkInLine(lineText, 20);

  assert.deepEqual(link, {
    kind: "url",
    text: "https://example.com/docs",
    target: "https://example.com/docs",
    textStart: 6,
    textEnd: 30,
  });
});

test("findBestLinkInLine returns a relative file path on the line", () => {
  const lineText = "Open src/extension.ts next";
  const link = findBestLinkInLine(lineText, 10);

  assert.deepEqual(link, {
    kind: "filePath",
    text: "src/extension.ts",
    target: "src/extension.ts",
    textStart: 5,
    textEnd: 21,
  });
});

test("findBestLinkInLine trims trailing punctuation from file paths", () => {
  const lineText = "Check docs/guide.md, then continue.";

  assert.equal(findBestLinkInLine(lineText, 8)?.target, "docs/guide.md");
});

test("findBestLinkInLine recognizes file paths with line and column suffixes", () => {
  const lineText = "Jump to src/extension.ts:20:5 now";

  assert.equal(
    findBestLinkInLine(lineText, 12)?.target,
    "src/extension.ts:20:5",
  );
});

test("findBestLinkInLine recognizes file paths with line ranges", () => {
  const lineText = "Jump to src/comm/ingest.rs:136-153 now";

  assert.equal(
    findBestLinkInLine(lineText, 12)?.target,
    "src/comm/ingest.rs:136-153",
  );
});

test("findBestLinkInLine recognizes file paths with line ranges and columns", () => {
  const lineText = "Jump to src/comm/ingest.rs:136-153:8 now";

  assert.equal(
    findBestLinkInLine(lineText, 12)?.target,
    "src/comm/ingest.rs:136-153:8",
  );
});

test("findBestLinkInLine recognizes local markdown anchors", () => {
  const lineText = "Read ./README.md#getting-started next";

  assert.equal(
    findBestLinkInLine(lineText, 10)?.target,
    "./README.md#getting-started",
  );
});

test("findBestLinkInLine recognizes absolute file paths with line fragments", () => {
  const lineText = "/Users/example/project/Cargo.toml#L27";

  assert.equal(
    findBestLinkInLine(lineText, 20)?.target,
    "/Users/example/project/Cargo.toml#L27",
  );
});

test("findBestLinkInLine keeps current-document markdown anchors in inline links", () => {
  const lineText = "See [the section](#getting-started) first";

  assert.equal(
    findBestLinkInLine(lineText, 20)?.target,
    "#getting-started",
  );
});

test("findBestLinkInLine does not treat bare domains as file paths", () => {
  assert.equal(findBestLinkInLine("Visit example.com today", 8), undefined);
});

test("findBestLinkInLine prefers the cursor link when multiple links exist", () => {
  const lineText = "[One](./one.md) and [Two](./two.md)";

  assert.equal(findBestLinkInLine(lineText, 21)?.target, "./two.md");
});

test("findBestLinkInLine treats the markdown target area as part of the cursor-selected link", () => {
  const lineText = "See [Docs](https://example.com/docs) now";

  assert.equal(
    findBestLinkInLine(lineText, 18)?.target,
    "https://example.com/docs",
  );
});

test("findBestLinkInLine falls back to the earliest link on the line", () => {
  const lineText = "https://first.example [Docs](https://second.example)";

  assert.equal(findBestLinkInLine(lineText, 999)?.target, "https://first.example");
});

test("findBestLinkInLine returns undefined when no link exists", () => {
  assert.equal(findBestLinkInLine("No links here", 3), undefined);
});
