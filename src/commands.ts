import { findBestLinkInLine } from "./markdownLinks";
import { LinkHost } from "./types";

export const COMMANDS = {
  openTargetUnderCursor: "open-target.openTargetUnderCursor",
} as const;

export function createCommandHandlers(host: LinkHost): {
  openTargetUnderCursor(): Promise<void>;
} {
  return {
    async openTargetUnderCursor(): Promise<void> {
      const context = host.getActiveLinkContext();
      if (!context) {
        host.showWarningMessage("No active text editor");
        return;
      }

      const linkMatch = findBestLinkInLine(
        context.lineText,
        context.cursorCharacter,
      );
      if (!linkMatch) {
        host.showWarningMessage("No target found on the current line");
        return;
      }

      await host.openTarget(linkMatch.target, context.documentPath);
    },
  };
}
