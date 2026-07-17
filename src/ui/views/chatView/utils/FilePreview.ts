// Compatibility barrel for existing filePreview consumers.

export type { FilePreview, FilePreviewType, StructuredToolResult, TerminalCommandResult } from "./FilePreviewTypes";
export { detectFileType, detectLanguage, extractFilename, looksBinary, parseStructuredToolResult, parseTerminalCommandResult } from "./FileType";
export { detectDiff, formatSize } from "./Format";
export { parseSearchResults } from "./SearchResults";
