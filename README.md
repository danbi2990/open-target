# Open Target

Open Target is a VS Code extension that opens the best matching link, URL, or
file path on the current line with a command or keyboard shortcut.

Built for file-based conversations with AI agents inside VS Code: when an
agent mentions a path, URL, or Markdown target in its response, Open Target
lets you jump there immediately instead of manually navigating through your
workspace.

## Why I Built It

I made this extension to make navigation easier when working with AI agents
that communicate through file references. In that workflow, the agent often
answers with paths like `src/app.ts`, `README.md#setup`, or
`/absolute/path/file.ts:42`. Opening those targets should feel instant, not
like copy-paste busywork.

## Features

- Open inline Markdown links like `[Guide](./docs/guide.md)`
- Open plain URLs like `https://example.com/docs`
- Open local file paths like `src/app.ts`
- Open file locations like `src/app.ts:42` and `src/app.ts:42:7`
- Open Markdown heading targets like `README.md#getting-started`
- Prefer the target under the cursor when a line contains multiple targets
- If the cursor is not on a target, fall back to the first valid target on the same line
- Work in Markdown and non-Markdown files
- Resolve relative paths from the current file, with a workspace-folder fallback

## Relative Path Resolution

Local relative paths are resolved in this order:

1. The current document's directory
2. The current document's containing workspace folder root, if the first path does not exist

In a multi-root workspace, the fallback uses the workspace folder that contains
the active document, not a global workspace root.

## Commands

- `open-target.openTargetUnderCursor`

## Default Keybinding

- `Cmd+Enter` / `Ctrl+Enter`: open the best matching target on the current line

## Next Likely Steps

- Support reference-style markdown links
- Handle titles and escaped parentheses more robustly
- Improve relative path resolution across more non-workspace file cases
