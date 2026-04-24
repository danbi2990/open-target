import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export interface LocalTargetLocation {
  column?: number;
  fragment?: string;
  line?: number;
  path: string;
}

export interface ResolveLocalTargetPathOptions {
  pathExists?: (targetPath: string) => boolean;
  workspacePath?: string;
}

const FRAGMENT_LINE_PATTERN = /^L(\d+)(?:-L\d+)?$/i;
const PATH_LOCATION_PATTERN = /^(.*?)(?::(\d+)(?:-\d+)?(?::(\d+))?)$/;

function splitTargetFragment(target: string): {
  fragment?: string;
  pathWithoutFragment: string;
} {
  const fragmentIndex = target.indexOf("#");
  if (fragmentIndex < 0) {
    return { pathWithoutFragment: target };
  }

  return {
    pathWithoutFragment: target.slice(0, fragmentIndex),
    fragment: target.slice(fragmentIndex + 1),
  };
}

function parseLineFragment(fragment: string | undefined): {
  column?: number;
  fragment?: string;
  line?: number;
} {
  if (!fragment) {
    return {};
  }

  const match = FRAGMENT_LINE_PATTERN.exec(fragment);
  if (!match) {
    return { fragment };
  }

  return {
    line: Number.parseInt(match[1], 10),
  };
}

function parsePathLocation(pathText: string): LocalTargetLocation {
  const match = PATH_LOCATION_PATTERN.exec(pathText);
  if (!match) {
    return { path: pathText };
  }

  const [, targetPath, lineText, columnText] = match;
  if (!lineText) {
    return { path: pathText };
  }

  return {
    path: targetPath,
    line: Number.parseInt(lineText, 10),
    ...(columnText ? { column: Number.parseInt(columnText, 10) } : {}),
  };
}

export function isUriTarget(target: string): boolean {
  if (/^[a-zA-Z]:[\\/]/.test(target)) {
    return false;
  }

  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(target);
}

export function parseLocalTargetLocation(target: string): LocalTargetLocation {
  const { pathWithoutFragment, fragment } = splitTargetFragment(target);
  const pathFields = parsePathLocation(pathWithoutFragment);
  const fragmentFields = parseLineFragment(fragment);
  return { ...pathFields, ...fragmentFields };
}

export function resolveLocalTargetPath(
  target: string,
  documentPath: string,
  options: ResolveLocalTargetPathOptions = {},
): string {
  const location = parseLocalTargetLocation(target);
  if (!location.path) {
    return documentPath;
  }

  if (location.path.startsWith("~/")) {
    return path.join(os.homedir(), location.path.slice(2));
  }

  const baseDirectory = path.dirname(documentPath);
  const documentRelativePath = path.resolve(baseDirectory, location.path);

  if (
    !options.workspacePath ||
    !shouldTryWorkspaceFallback(location.path)
  ) {
    return documentRelativePath;
  }

  const workspaceRelativePath = path.resolve(options.workspacePath, location.path);
  if (workspaceRelativePath === documentRelativePath) {
    return documentRelativePath;
  }

  const pathExists = options.pathExists ?? fs.existsSync;
  if (!pathExists(documentRelativePath) && pathExists(workspaceRelativePath)) {
    return workspaceRelativePath;
  }

  return documentRelativePath;
}

function shouldTryWorkspaceFallback(targetPath: string): boolean {
  if (!targetPath) {
    return false;
  }

  if (path.isAbsolute(targetPath) || /^[a-zA-Z]:[\\/]/.test(targetPath)) {
    return false;
  }

  return !targetPath.startsWith("~/");
}
