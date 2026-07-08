export interface StreamedAssistantResult {
  content: string;
  reasoning: string;
}

export class PartialStreamError extends Error {
  constructor(
    message: string,
    readonly partial: StreamedAssistantResult,
  ) {
    super(message);
    this.name = "PartialStreamError";
  }
}
