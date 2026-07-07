// Barrel de compatibilidad para los consumidores existentes de filePreview.

export type { FilePreview, FilePreviewType, StructuredToolResult } from "./filePreviewTypes";
export { detectFileType, detectLanguage, extractFilename, looksBinary, parseStructuredToolResult } from "./fileType";
export { detectDiff, formatSize } from "./format";
export { parseSearchResults } from "./searchResults";
