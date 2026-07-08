// Compatibility barrel for existing filePreview consumers.

export type { FilePreview, FilePreviewType, StructuredToolResult } from "./FilePreviewTypes";
export { detectFileType, detectLanguage, extractFilename, looksBinary, parseStructuredToolResult } from "./FileType";
export { detectDiff, formatSize } from "./Format";
export { parseSearchResults } from "./SearchResults";
