# Changelog

## Unreleased

- Renamed the extension from `Open Markdown Link` to `Open Target`
- Added support for resolving relative paths from the containing workspace folder when the document-relative path does not exist
- Refined the README and Marketplace metadata around AI-agent navigation workflows
- Added an extension icon for Marketplace presentation

## 0.0.4

- Prefer the link under the cursor when a line contains multiple links

## 0.0.3

- Changed behavior to open the first link on the current line even when the cursor is not on the link

## 0.0.2

- Added support for plain URLs under the cursor
- Added a default `Cmd+Enter` / `Ctrl+Enter` keybinding

## 0.0.1

- Initial scaffold for opening a markdown link under the cursor
- Added inline link parsing and command skeleton
- Added unit tests for parser and command flow
