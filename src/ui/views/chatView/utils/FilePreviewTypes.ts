export type FilePreviewType = "code" | "search_results" | "diff" | "binary" | "text" | "error";

export interface FilePreview {
  type: FilePreviewType;
  language?: string;
  content: string;
  metadata?: Record<string, string>;
}

export type StructuredToolResult =
  | {
      toolResultVersion: number;
      type: "file";
      path: string;
      content: string;
      size: number;
      binary?: boolean;
      truncated?: boolean;
      previewSize?: number;
    }
  | {
      toolResultVersion: number;
      type: "fileWrite";
      path: string;
      summary: string;
      overwritten: boolean;
      diff?: string;
      diffTruncated?: boolean;
      diffStats?: {
        additions: number;
        deletions: number;
      };
      binary?: boolean;
      beforeSize?: number;
      afterSize?: number;
    }
  | {
      toolResultVersion: number;
      type: "fileEdit" | "filePatch";
      path: string;
      summary: string;
      diff: string;
      diffTruncated?: boolean;
      diffStats?: {
        additions: number;
        deletions: number;
      };
      beforeSize?: number;
      afterSize?: number;
    }
  | {
      toolResultVersion: number;
      type: "SearchResults";
      query: string;
      results: Array<{ file: string; line: number; text: string }>;
      truncated?: boolean;
    };
