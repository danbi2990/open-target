export interface MarkdownHeadingLocation {
  character: number;
  line: number;
}

function decodeHeadingFragment(fragment: string): string {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}

function stripMarkdownFormatting(headingText: string): string {
  return headingText
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_`~]/g, "");
}

function createBaseHeadingSlug(headingText: string): string {
  return stripMarkdownFormatting(headingText)
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function createHeadingSlug(
  headingText: string,
  slugCounts: Map<string, number>,
): string | undefined {
  const baseSlug = createBaseHeadingSlug(headingText);
  if (!baseSlug) {
    return undefined;
  }

  const count = slugCounts.get(baseSlug) ?? 0;
  slugCounts.set(baseSlug, count + 1);

  if (count === 0) {
    return baseSlug;
  }

  return `${baseSlug}-${count}`;
}

function findAtxHeading(lineText: string): { character: number; headingText: string } | undefined {
  const match = /^(#{1,6})[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$/.exec(lineText);
  if (!match) {
    return undefined;
  }

  return {
    character: match[1].length + 1,
    headingText: match[2].trim(),
  };
}

function findSetextHeading(
  lineText: string,
  underlineText: string | undefined,
): { character: number; headingText: string } | undefined {
  if (!underlineText || !/^[=-]+\s*$/.test(underlineText.trim())) {
    return undefined;
  }

  const headingText = lineText.trim();
  if (!headingText) {
    return undefined;
  }

  const character = lineText.search(/\S/);
  return {
    character: Math.max(character, 0),
    headingText,
  };
}

export function findMarkdownHeadingLocation(
  documentText: string,
  fragment: string,
): MarkdownHeadingLocation | undefined {
  const targetSlug = createBaseHeadingSlug(decodeHeadingFragment(fragment));
  if (!targetSlug) {
    return undefined;
  }

  const lines = documentText.split(/\r?\n/u);
  const slugCounts = new Map<string, number>();

  for (let index = 0; index < lines.length; index += 1) {
    const atxHeading = findAtxHeading(lines[index]);
    const setextHeading = atxHeading
      ? undefined
      : findSetextHeading(lines[index], lines[index + 1]);
    const heading = atxHeading ?? setextHeading;
    if (!heading) {
      continue;
    }

    const slug = createHeadingSlug(heading.headingText, slugCounts);
    if (slug !== targetSlug) {
      continue;
    }

    return {
      line: index,
      character: heading.character,
    };
  }

  return undefined;
}
