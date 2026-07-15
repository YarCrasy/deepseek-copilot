import type { AssistantTimelineEvent } from "@/adapters";

export interface StreamedAssistantResult {
  content: string;
  reasoning: string;
  timeline: AssistantTimelineEvent[];
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
