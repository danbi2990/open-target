export interface LinkMatch {
  kind: "filePath" | "markdown" | "url";
  target: string;
  text: string;
  textEnd: number;
  textStart: number;
}

export interface ActiveLinkContext {
  cursorCharacter: number;
  documentPath: string;
  lineText: string;
  languageId: string;
}

export interface LinkHost {
  getActiveLinkContext(): ActiveLinkContext | undefined;
  openTarget(target: string, documentPath: string): Promise<void>;
  showWarningMessage(message: string): void;
}
