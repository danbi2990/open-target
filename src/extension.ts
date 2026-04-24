import { TextDecoder } from "node:util";
import * as vscode from "vscode";
import { COMMANDS, createCommandHandlers } from "./commands";
import { findMarkdownHeadingLocation } from "./markdownHeadings";
import {
  isUriTarget,
  parseLocalTargetLocation,
  resolveLocalTargetPath,
} from "./targetResolution";
import { ActiveLinkContext, LinkHost } from "./types";

function getActiveLinkContext(): ActiveLinkContext | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }

  return {
    languageId: editor.document.languageId,
    documentPath: editor.document.uri.fsPath,
    lineText: editor.document.lineAt(editor.selection.active.line).text,
    cursorCharacter: editor.selection.active.character,
  };
}

function getWorkspacePath(documentPath: string): string | undefined {
  return vscode.workspace.getWorkspaceFolder(vscode.Uri.file(documentPath))?.uri.fsPath;
}

function resolveTargetUri(target: string, documentPath: string): vscode.Uri {
  if (isUriTarget(target)) {
    return vscode.Uri.parse(target);
  }

  return vscode.Uri.file(
    resolveLocalTargetPath(target, documentPath, {
      workspacePath: getWorkspacePath(documentPath),
    }),
  );
}

const textDecoder = new TextDecoder();

function createSelection(
  line: number,
  character: number,
): vscode.TextDocumentShowOptions {
  const selection = new vscode.Range(line, character, line, character);

  return { selection };
}

async function createHeadingSelection(
  targetUri: vscode.Uri,
  fragment: string,
): Promise<vscode.TextDocumentShowOptions | undefined> {
  if (targetUri.scheme !== "file") {
    return undefined;
  }

  try {
    const fileContents = await vscode.workspace.fs.readFile(targetUri);
    const headingLocation = findMarkdownHeadingLocation(
      textDecoder.decode(fileContents),
      fragment,
    );
    if (!headingLocation) {
      return undefined;
    }

    return createSelection(headingLocation.line, headingLocation.character);
  } catch {
    return undefined;
  }
}

async function createOpenOptions(
  target: string,
  targetUri: vscode.Uri,
): Promise<vscode.TextDocumentShowOptions | undefined> {
  if (isUriTarget(target)) {
    return undefined;
  }

  const location = parseLocalTargetLocation(target);
  if (!location.line) {
    if (!location.fragment) {
      return undefined;
    }

    return createHeadingSelection(targetUri, location.fragment);
  }

  const line = Math.max(location.line - 1, 0);
  const character = Math.max((location.column ?? 1) - 1, 0);

  return createSelection(line, character);
}

function createHost(): LinkHost {
  return {
    getActiveLinkContext,
    async openTarget(target: string, documentPath: string): Promise<void> {
      const targetUri = resolveTargetUri(target, documentPath);
      const openOptions = await createOpenOptions(target, targetUri);

      if (targetUri.scheme === "http" || targetUri.scheme === "https") {
        await vscode.env.openExternal(targetUri);
        return;
      }

      await vscode.commands.executeCommand("vscode.open", targetUri, openOptions);
    },
    showWarningMessage(message: string): void {
      void vscode.window.showWarningMessage(message);
    },
  };
}

export function activate(context: vscode.ExtensionContext): void {
  const host = createHost();
  const handlers = createCommandHandlers(host);

  const openTargetDisposable = vscode.commands.registerCommand(
    COMMANDS.openTargetUnderCursor,
    handlers.openTargetUnderCursor,
  );

  context.subscriptions.push(openTargetDisposable);
}

export function deactivate(): void {}
