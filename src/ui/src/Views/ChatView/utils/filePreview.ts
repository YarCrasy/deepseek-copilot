// Compatibility barrel for existing filePreview consumers.

export type { FilePreview, FilePreviewType, StructuredToolResult } from "./filePreviewTypes";
export { detectFileType, detectLanguage, extractFilename, looksBinary, parseStructuredToolResult } from "./fileType";
export { detectDiff, formatSize } from "./format";
export { parseSearchResults } from "./searchResults";
