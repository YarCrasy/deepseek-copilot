import type { VsCodeApi } from "@webview/VsCodeApi";
import type { StructuredToolResult } from "../../views/chatView/utils/FilePreview";
import { detectFileType, detectLanguage, extractFilename, formatSize, looksBinary, parseSearchResults } from "../../views/chatView/utils/FilePreview";

type StructuredFileResult = Extract<StructuredToolResult, { type: "file" }>;
type SearchResult = { file: string; line: number; text: string };
type DiffStats = { additions: number; deletions: number };
type WriteMetadata = { binary?: boolean; beforeSize?: number; afterSize?: number };
type DiffPreviewOptions = WriteMetadata & {
  summary?: string;
  path?: string;
  stats?: DiffStats;
  truncated?: boolean;
};

export function renderFilePreview(argsStr: string, result: string) {
  const filename = extractPreviewFilename(argsStr);
  const fileType = detectFileType(filename, result);
  const language = detectLanguage(filename);
  const isBinary = fileType === "binary" || looksBinary(result);

  if (isBinary) {
    return renderBinaryHeader(filename, result.length, "Binary content cannot be previewed as text.");
  }

  if (fileType === "code") {
    return renderCodePreview({ filename, language, size: result.length, content: truncate(result, 8000) });
  }

  return (
    <div className="filePreview textPreview">
      <div className="filePreviewHeader">
        <span className="filePreviewName">{filename}</span>
        <span className="filePreviewSize">{formatSize(result.length)}</span>
      </div>
      <pre className="filePreviewText">
        <code>{truncate(result, 2000)}</code>
      </pre>
    </div>
  );
}

export function renderSearchPreview(result: string, status: string, vscode: VsCodeApi | null) {
  const results = parseSearchResults(result);
  return results.length === 0 ? renderPlainResult(result, status) : renderSearchResults(results, vscode);
}

export function renderSearchResults(results: SearchResult[], vscode: VsCodeApi | null, truncated = false) {
  return (
    <div className="filePreview searchPreview">
      <div className="filePreviewHeader">
        <span className="filePreviewName">Search results</span>
        <span className="filePreviewSize">{results.length} results</span>
      </div>
      <div className="searchResultsList">
        {results.slice(0, 30).map((resultItem, index) => (
          <button
            key={index}
            className="searchResultItem"
            onClick={() => vscode?.postMessage({ type: "openFile", path: resultItem.file, line: resultItem.line })}
            data-tooltip={`Click to open ${resultItem.file}:${resultItem.line}`}
            data-tooltip-align="start"
          >
            <span className="searchResultFile">{resultItem.file}</span>
            <span className="searchResultLine">:{resultItem.line}</span>
            <span className="searchResultText">{resultItem.text}</span>
          </button>
        ))}
        {(results.length > 30 || truncated) && <div className="searchResultMore">... and {Math.max(results.length - 30, 0)} more results</div>}
      </div>
    </div>
  );
}

export function renderStructuredFilePreview(result: StructuredFileResult) {
  const filename = extractFilename(result.path);
  if (result.binary) {
    return renderBinaryHeader(filename, result.size, "Binary file detected. Text preview is unavailable.");
  }

  const language = detectLanguage(filename);
  return renderCodePreview({ filename, language, size: result.size, previewSize: result.previewSize, content: result.content, truncated: result.truncated });
}

export function renderWriteSummary(summary: string, path: string, metadata: WriteMetadata = {}) {
  return (
    <div className="filePreview writePreview">
      <div className="filePreviewHeader">
        <span className="filePreviewName">{path}</span>
        {metadata.beforeSize !== undefined && <span className="filePreviewSize">before {formatSize(metadata.beforeSize)}</span>}
        {metadata.afterSize !== undefined && <span className="filePreviewSize">after {formatSize(metadata.afterSize)}</span>}
        {metadata.binary && <span className="filePreviewType">binary source</span>}
      </div>
      <div className="writeSummary">{summary}</div>
      {metadata.binary && <div className="filePreviewNotice">Previous file was binary, so no text diff is available.</div>}
    </div>
  );
}

export function renderDiffPreview(result: string, options: DiffPreviewOptions | string = {}) {
  const normalizedOptions: DiffPreviewOptions = typeof options === "string" ? { summary: options } : options;
  const parsed = parseDiff(result);
  const stats = normalizedOptions.stats || parsed.stats;
  const summary = normalizedOptions.summary || normalizedOptions.path || "File changed";

  return (
    <div className="filePreview diffPreview">
      <div className="filePreviewHeader">
        <span className="filePreviewName">{summary}</span>
        <span className="filePreviewSize">+{stats.additions}</span>
        <span className="filePreviewSize">-{stats.deletions}</span>
        {normalizedOptions.afterSize !== undefined && <span className="filePreviewSize">{formatSize(normalizedOptions.afterSize)}</span>}
        {(normalizedOptions.truncated || parsed.truncated) && <span className="filePreviewType">truncated</span>}
      </div>
      <div className="diffContent">{parsed.lines.map(renderDiffLine)}</div>
      {(normalizedOptions.truncated || parsed.truncated) && <div className="filePreviewNotice">Diff preview is truncated. The file operation still completed.</div>}
    </div>
  );
}

export function renderPlainResult(result: string, status: string) {
  const isError = status === "error";
  return (
    <details className="toolCallResult" open={isError}>
      <summary>{isError ? "Error" : "Result"}</summary>
      <pre className={isError ? "errorText" : ""}>{truncate(result, 1000)}</pre>
    </details>
  );
}

function extractPreviewFilename(argsStr: string): string {
  try {
    const args = JSON.parse(argsStr) as { path?: string };
    return extractFilename(args.path || "file");
  } catch {
    return "file";
  }
}

function renderBinaryHeader(filename: string, size: number, message: string) {
  return (
    <div className="filePreview binaryPreview">
      <div className="filePreviewHeader">
        <span className="filePreviewName">{filename}</span>
        <span className="filePreviewSize">{formatSize(size)}</span>
        <span className="filePreviewType">binary</span>
      </div>
      <div className="filePreviewNotice">{message}</div>
    </div>
  );
}

function renderCodePreview(options: { filename: string; language?: string; size: number; previewSize?: number; content: string; truncated?: boolean }) {
  const { filename, language, size, previewSize, content, truncated } = options;
  return (
    <div className="filePreview codePreview">
      <div className="filePreviewHeader">
        <span className="filePreviewName">{filename}</span>
        {language && <span className="filePreviewLang">{language}</span>}
        <span className="filePreviewSize">{formatSize(size)}</span>
        {truncated && <span className="filePreviewType">preview {formatSize(previewSize || content.length)}</span>}
        {truncated && <span className="filePreviewType">truncated</span>}
      </div>
      <pre className="filePreviewCode">
        <code className={`language-${language || "text"}`}>{renderHighlightedCode(content, language)}</code>
      </pre>
      {truncated && <div className="filePreviewNotice">Only the first {formatSize(previewSize || content.length)} is shown.</div>}
    </div>
  );
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.substring(0, maxLength)}...\n[truncated, ${value.length} chars]` : value;
}

function renderHighlightedCode(code: string, language?: string) {
  return <>{code.split("\n").map((line, index) => renderHighlightedLine(line, index, language))}</>;
}

function renderHighlightedLine(line: string, index: number, language?: string) {
  const tokens = tokenizeLine(line, language);
  return (
    <span key={index} className="codeLine">
      {tokens.map((token, tokenIndex) => (
        <span key={tokenIndex} className={token.className}>
          {token.text}
        </span>
      ))}
      {"\n"}
    </span>
  );
}

function tokenizeLine(line: string, language?: string): Array<{ text: string; className?: string }> {
  if (!language) return [{ text: line }];
  const pattern =
    /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|import|export|from|if|else|for|while|class|interface|type|async|await|try|catch|new|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b|\/\/.*$|#.*$)/g;
  const tokens: Array<{ text: string; className?: string }> = [];
  let cursor = 0;

  for (const match of line.matchAll(pattern)) {
    if (match.index === undefined) continue;
    if (match.index > cursor) tokens.push({ text: line.slice(cursor, match.index) });
    tokens.push({ text: match[0], className: getTokenClass(match[0]) });
    cursor = match.index + match[0].length;
  }

  if (cursor < line.length) tokens.push({ text: line.slice(cursor) });
  return tokens;
}

function getTokenClass(token: string): string {
  if (token.startsWith("//") || token.startsWith("#")) return "syntaxComment";
  if (/^["'`]/.test(token)) return "syntaxString";
  if (/^\d/.test(token)) return "syntaxNumber";
  return "syntaxKeyword";
}

type ParsedDiffLine = {
  text: string;
  kind: "add" | "remove" | "header" | "hunk" | "context" | "note";
  oldLine?: number;
  newLine?: number;
};

function parseDiff(content: string): { lines: ParsedDiffLine[]; stats: DiffStats; truncated: boolean } {
  let oldLine = 0;
  let newLine = 0;
  const stats: DiffStats = { additions: 0, deletions: 0 };
  let truncated = false;

  const lines = content.split("\n").map((text) => {
    const hunk = text.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      oldLine = Number.parseInt(hunk[1], 10);
      newLine = Number.parseInt(hunk[2], 10);
      return { text, kind: "hunk" as const };
    }

    if (text.startsWith("--- ") || text.startsWith("+++ ")) {
      return { text, kind: "header" as const };
    }

    if (text.startsWith("... diff truncated")) {
      truncated = true;
      return { text, kind: "note" as const };
    }

    if (text.startsWith("+")) {
      const line = { text, kind: "add" as const, newLine };
      newLine += 1;
      stats.additions += 1;
      return line;
    }

    if (text.startsWith("-")) {
      const line = { text, kind: "remove" as const, oldLine };
      oldLine += 1;
      stats.deletions += 1;
      return line;
    }

    const line = { text, kind: "context" as const, oldLine, newLine };
    oldLine += 1;
    newLine += 1;
    return line;
  });

  return { lines, stats, truncated };
}

function renderDiffLine(line: ParsedDiffLine, index: number) {
  const className = `diffLine ${getDiffLineClass(line.kind)}`;
  return (
    <div key={index} className={className}>
      <span className="diffLineNumber">{line.oldLine ?? ""}</span>
      <span className="diffLineNumber">{line.newLine ?? ""}</span>
      <span className="diffLineText">{line.text}</span>
    </div>
  );
}

function getDiffLineClass(kind: ParsedDiffLine["kind"]): string {
  if (kind === "add") return "diffAdd";
  if (kind === "remove") return "diffRemove";
  if (kind === "header") return "diffHeader";
  if (kind === "hunk") return "diffHunk";
  if (kind === "note") return "diffNote";
  return "diffContext";
}
