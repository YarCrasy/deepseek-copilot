import type { FilePreviewType, StructuredToolResult } from "./filePreviewTypes";

const CODE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "swift",
  "c",
  "cpp",
  "h",
  "hpp",
  "cs",
  "php",
  "vue",
  "svelte",
  "html",
  "css",
  "scss",
  "less",
  "json",
  "yaml",
  "yml",
  "xml",
  "md",
  "sql",
  "sh",
  "bash",
  "zsh",
  "fish",
  "dockerfile",
]);

const BINARY_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "bmp", "ico", "pdf", "zip", "tar", "gz", "rar", "exe", "dll", "eot", "ttf", "woff", "woff2"]);

export function detectFileType(filename: string, content: string): FilePreviewType {
  if (!content) {return "text";}
  if (content.startsWith("Error:")) {return "error";}
  if (content.startsWith("No results found")) {return "text";}

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (BINARY_EXTENSIONS.has(ext)) {return "binary";}
  if (CODE_EXTENSIONS.has(ext)) {return "code";}
  return "text";
}

export function parseStructuredToolResult(content: string): StructuredToolResult | null {
  try {
    const parsed = JSON.parse(content) as Partial<StructuredToolResult>;
    return typeof parsed.toolResultVersion === "number" && typeof parsed.type === "string" ? (parsed as StructuredToolResult) : null;
  } catch {
    return null;
  }
}

export function detectLanguage(filename: string): string | undefined {
  const basename = extractFilename(filename).toLowerCase();
  const filenameMap: Record<string, string> = {
    dockerfile: "dockerfile",
    makefile: "makefile",
    "package.json": "json",
    "tsconfig.json": "json",
  };
  if (filenameMap[basename]) {return filenameMap[basename];}

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    php: "php",
    vue: "vue",
    svelte: "svelte",
    html: "html",
    css: "css",
    scss: "scss",
    less: "less",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    md: "markdown",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "fish",
  };
  return langMap[ext];
}

export function extractFilename(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

export function looksBinary(content: string): boolean {
  if (!content) {return false;}
  const checkLen = Math.min(content.length, 4096);
  for (let i = 0; i < checkLen; i++) {
    const code = content.charCodeAt(i);
    if (code === 0 || code === 65533) {return true;}
  }
  return false;
}
