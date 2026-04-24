import assert from "node:assert/strict";
import test from "node:test";
import { findMarkdownHeadingLocation } from "../src/markdownHeadings";

test("findMarkdownHeadingLocation finds an atx heading from a fragment", () => {
  const documentText = [
    "# Intro",
    "",
    "## Getting Started",
    "More text",
  ].join("\n");

  assert.deepEqual(findMarkdownHeadingLocation(documentText, "getting-started"), {
    line: 2,
    character: 3,
  });
});

test("findMarkdownHeadingLocation decodes percent-encoded fragments", () => {
  const documentText = "## Getting Started";

  assert.deepEqual(findMarkdownHeadingLocation(documentText, "getting%20started"), {
    line: 0,
    character: 3,
  });
});

test("findMarkdownHeadingLocation supports duplicate heading slugs", () => {
  const documentText = [
    "## Overview",
    "",
    "## Overview",
  ].join("\n");

  assert.deepEqual(findMarkdownHeadingLocation(documentText, "overview-1"), {
    line: 2,
    character: 3,
  });
});

test("findMarkdownHeadingLocation ignores simple markdown formatting in headings", () => {
  const documentText = "## Install `open-target`";

  assert.deepEqual(
    findMarkdownHeadingLocation(documentText, "install-open-target"),
    {
      line: 0,
      character: 3,
    },
  );
});

test("findMarkdownHeadingLocation supports setext headings", () => {
  const documentText = [
    "Getting Started",
    "===============",
    "",
    "Body text",
  ].join("\n");

  assert.deepEqual(findMarkdownHeadingLocation(documentText, "getting-started"), {
    line: 0,
    character: 0,
  });
});

test("findMarkdownHeadingLocation returns undefined when the fragment is missing", () => {
  assert.equal(findMarkdownHeadingLocation("# Intro", "missing"), undefined);
});
