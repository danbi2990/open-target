import { LinkMatch } from "./types";
import { isUriTarget, parseLocalTargetLocation } from "./targetResolution";

const INLINE_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const URL_PATTERN = /https?:\/\/[^\s<>"'`\])]+/g;
const PATH_TOKEN_PATTERN = /[^\s<>"'`()\[\]{}]+/g;
const TRAILING_PATH_PUNCTUATION_PATTERN = /[.,;!?]+$/;
const COMMON_TLD_PATTERN =
  /^[a-z0-9-]+\.(?:ai|app|biz|co|com|dev|edu|fr|gov|info|io|jp|kr|me|net|org|uk|us|xyz)$/;

function collectMarkdownLinks(lineText: string): LinkMatch[] {
  const links: LinkMatch[] = [];

  for (const match of lineText.matchAll(INLINE_LINK_PATTERN)) {
    const text = match[1];
    const target = match[2];
    const fullMatchIndex = match.index ?? -1;
    if (fullMatchIndex < 0) {
      continue;
    }

    const textStart = fullMatchIndex + 1;
    const textEnd = textStart + text.length;
    const targetStart = fullMatchIndex + match[0].indexOf("(") + 1;
    const targetEnd = targetStart + target.length;
    links.push({
      kind: "markdown",
      text,
      target,
      textStart: Math.min(textStart, targetStart),
      textEnd: Math.max(textEnd, targetEnd),
    });
  }

  return links;
}

function collectUrls(lineText: string): LinkMatch[] {
  const links: LinkMatch[] = [];

  for (const match of lineText.matchAll(URL_PATTERN)) {
    const text = match[0];
    const fullMatchIndex = match.index ?? -1;
    if (fullMatchIndex < 0) {
      continue;
    }

    const textStart = fullMatchIndex;
    const textEnd = textStart + text.length;
    links.push({
      kind: "url",
      text,
      target: text,
      textStart,
      textEnd,
    });
  }

  return links;
}

function overlapsExistingLink(
  textStart: number,
  textEnd: number,
  existingLinks: LinkMatch[],
): boolean {
  return existingLinks.some(
    (link) => textStart < link.textEnd && textEnd > link.textStart,
  );
}

function trimPathToken(token: string): string {
  return token.replace(TRAILING_PATH_PUNCTUATION_PATTERN, "");
}

function isFilePathLike(candidate: string): boolean {
  if (!candidate || isUriTarget(candidate)) {
    return false;
  }

  const location = parseLocalTargetLocation(candidate);
  const normalizedCandidate = location.path;

  if (/^[a-zA-Z]:[\\/]/.test(normalizedCandidate)) {
    return true;
  }

  if (
    normalizedCandidate.startsWith("./") ||
    normalizedCandidate.startsWith("../") ||
    normalizedCandidate.startsWith("~/") ||
    normalizedCandidate.startsWith("/")
  ) {
    return true;
  }

  if (
    normalizedCandidate.includes("/") ||
    normalizedCandidate.includes("\\")
  ) {
    return true;
  }

  if (
    normalizedCandidate.startsWith(".") &&
    normalizedCandidate.length > 1
  ) {
    return true;
  }

  if (COMMON_TLD_PATTERN.test(normalizedCandidate)) {
    return false;
  }

  return /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+$/.test(normalizedCandidate);
}

function collectFilePaths(
  lineText: string,
  existingLinks: LinkMatch[],
): LinkMatch[] {
  const links: LinkMatch[] = [];

  for (const match of lineText.matchAll(PATH_TOKEN_PATTERN)) {
    const originalToken = match[0];
    const candidate = trimPathToken(originalToken);
    const fullMatchIndex = match.index ?? -1;
    if (fullMatchIndex < 0 || !candidate || !isFilePathLike(candidate)) {
      continue;
    }

    const textStart = fullMatchIndex;
    const textEnd = textStart + candidate.length;
    if (overlapsExistingLink(textStart, textEnd, existingLinks)) {
      continue;
    }

    links.push({
      kind: "filePath",
      text: candidate,
      target: candidate,
      textStart,
      textEnd,
    });
  }

  return links;
}

export function findBestLinkInLine(
  lineText: string,
  cursorCharacter: number,
): LinkMatch | undefined {
  const markdownLinks = collectMarkdownLinks(lineText);
  const urlLinks = collectUrls(lineText);
  const filePathLinks = collectFilePaths(lineText, [
    ...markdownLinks,
    ...urlLinks,
  ]);
  const allLinks = [...markdownLinks, ...urlLinks, ...filePathLinks].sort(
    (left, right) => left.textStart - right.textStart,
  );

  const cursorLink = allLinks.find(
    (link) =>
      cursorCharacter >= link.textStart && cursorCharacter < link.textEnd,
  );
  if (cursorLink) {
    return cursorLink;
  }

  return allLinks[0];
}
