export interface SendMessagePayload {
  text: string;
  modelId: string;
  reasoning: string;
  referencedFiles?: Array<{ path: string; content?: string; type: "file" | "directory" }>;
}
