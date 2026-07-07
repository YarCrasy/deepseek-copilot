// tools/definitions/searchContent.ts — Buscar texto en el proyecto

import { exec } from "child_process";
import { promisify } from "util";
import type { ToolDefinition } from "@/adapters";
import type { RegisteredTool, ToolMetadata } from "../types";
import { getToolWorkspaceHost } from "../toolWorkspace";
import { createStructuredResult } from "./structuredResult";

const execAsync = promisify(exec);
const MAX_SEARCH_RESULTS = 50;

async function handleSearchContent(args: Record<string, unknown>): Promise<string> {
  const query = args.query as string;
  const filePattern = args.filePattern as string | undefined;

  if (!query) {
    return "Error: query parameter is required";
  }

  let rootPath = "";
  try {
    const workspaceRoot = getToolWorkspaceHost().getRootPath();
    if (!workspaceRoot) {
      return "Error: No workspace folder open";
    }

    rootPath = workspaceRoot;

    // Construir comando ripgrep (rg viene incluido con VS Code)
    let cmd = `rg --no-heading --line-number --max-count 50 -i`;
    if (filePattern) {
      cmd += ` --glob '${filePattern.replace(/'/g, "'\\''")}'`;
    }
    cmd += ` -- '${query.replace(/'/g, "'\\''")}' '${rootPath.replace(/'/g, "'\\''")}'`;

    const { stdout } = await execAsync(cmd, {
      maxBuffer: 1024 * 1024,
      timeout: 15_000,
    });

    if (!stdout.trim()) {
      return `No results found for query: '${query}'`;
    }

    return createSearchResultPayload(query, parseRipgrepResults(stdout, rootPath));
  } catch (err: unknown) {
    // rg returns exit code 1 when no matches found (no output)
    const rgError = getRipgrepError(err);
    if (rgError.code === 1 && (!rgError.stdout || rgError.stdout === "")) {
      return `No results found for query: '${query}'`;
    }
    // Return partial results if available
    if (rgError.stdout) {
      return createSearchResultPayload(query, parseRipgrepResults(rgError.stdout, rootPath), true);
    }
    return `Error searching content: ${getErrorMessage(err)}`;
  }
}

function getRipgrepError(err: unknown): { code?: number; stdout?: string } {
  if (!err || typeof err !== "object") {
    return {};
  }
  const record = err as { code?: unknown; stdout?: unknown };
  return {
    code: typeof record.code === "number" ? record.code : undefined,
    stdout: typeof record.stdout === "string" ? record.stdout : undefined,
  };
}

function createSearchResultPayload(query: string, results: Array<{ file: string; line: number; text: string }>, forcedTruncated = false): string {
  const visibleResults = results.slice(0, MAX_SEARCH_RESULTS);
  return createStructuredResult("searchResults", {
    query,
    results: visibleResults,
    truncated: forcedTruncated || results.length > visibleResults.length,
  });
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function parseRipgrepResults(stdout: string, rootPath: string): Array<{ file: string; line: number; text: string }> {
  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?):(\d+):(.*)$/);
      if (!match) {
        return null;
      }
      return {
        file: normalizePath(match[1], rootPath),
        line: Number.parseInt(match[2], 10),
        text: match[3].trim(),
      };
    })
    .filter((result): result is { file: string; line: number; text: string } => result !== null);
}

function normalizePath(filePath: string, rootPath: string): string {
  return filePath.startsWith(rootPath) ? filePath.slice(rootPath.length).replace(/^[/\\]/, "") : filePath;
}

export const searchContentDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "search_content",
    description: "Search for text in project files using ripgrep. Returns file, line, and matching content.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Text to search for. Not treated as a regex by default.",
        },
        filePattern: {
          type: "string",
          description: "File pattern filter, for example *.ts or *.md.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
};

export const searchContentHandler: RegisteredTool["handler"] = handleSearchContent;

export const searchContentMetadata: ToolMetadata = {
  dangerLevel: "safe",
  requiresConfirmation: false,
};
