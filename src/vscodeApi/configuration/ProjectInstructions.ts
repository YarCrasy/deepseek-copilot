import * as os from "os";
import * as vscode from "vscode";
import { CONFIG_SECTION, INCLUDE_HOME_AGENTS_KEY } from "@/shared/constants";

const AGENTS_FILE_NAME = "AGENTS.md";
const PROJECT_INSTRUCTIONS_HEADER = "## Project Instructions";

export interface ProjectInstructionSource {
  path: string;
  scope: "home" | "workspace" | "workspace-local";
  precedence: number;
  bytes: number;
}

export interface ProjectInstructionsResult {
  content: string;
  sources: ProjectInstructionSource[];
  homeAgentsAllowed: boolean;
}

interface CandidateSource {
  uri: vscode.Uri;
  scope: ProjectInstructionSource["scope"];
  precedence: number;
}

export async function loadProjectInstructions(): Promise<ProjectInstructionsResult> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const homeAgentsAllowed = isHomeAgentsAllowed();
  const candidates: CandidateSource[] = [];

  if (homeAgentsAllowed) {
    candidates.push({
      uri: vscode.Uri.joinPath(vscode.Uri.file(os.homedir()), ".deepseek-copilot", AGENTS_FILE_NAME),
      scope: "home",
      precedence: 0,
    });
  }

  if (workspaceFolder) {
    candidates.push(
      {
        uri: vscode.Uri.joinPath(workspaceFolder.uri, AGENTS_FILE_NAME),
        scope: "workspace",
        precedence: 10,
      },
      {
        uri: vscode.Uri.joinPath(workspaceFolder.uri, ".deepseek-copilot", AGENTS_FILE_NAME),
        scope: "workspace-local",
        precedence: 20,
      },
    );
  }

  const loaded = await Promise.all(candidates.map(readInstructionSource));
  const sources = loaded.filter((source): source is LoadedInstructionSource => source !== undefined).sort((a, b) => a.precedence - b.precedence);

  return {
    content: formatProjectInstructions(sources),
    sources: sources.map(({ content, ...source }) => source),
    homeAgentsAllowed,
  };
}

export function appendProjectInstructionsToSystemPrompt(systemPrompt: string, projectInstructions: string): string {
  if (!projectInstructions.trim()) {
    return systemPrompt;
  }

  return `${systemPrompt.trim()}

${projectInstructions}`;
}

interface LoadedInstructionSource extends ProjectInstructionSource {
  content: string;
}

async function readInstructionSource(candidate: CandidateSource): Promise<LoadedInstructionSource | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(candidate.uri);
    const content = new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
    if (!content) {
      return undefined;
    }

    return {
      path: candidate.uri.fsPath,
      scope: candidate.scope,
      precedence: candidate.precedence,
      bytes: bytes.byteLength,
      content,
    };
  } catch (err: unknown) {
    if (isFileNotFoundError(err)) {
      return undefined;
    }
    throw err;
  }
}

function formatProjectInstructions(sources: LoadedInstructionSource[]): string {
  if (sources.length === 0) {
    return "";
  }

  const sections = sources.map((source) => `### ${source.path}
${source.content}`);

  return `${PROJECT_INSTRUCTIONS_HEADER}
The following AGENTS.md instructions are ordered from lowest to highest precedence. When they conflict, follow the later, higher-precedence source.

${sections.join("\n\n")}`;
}

function isHomeAgentsAllowed(): boolean {
  return vscode.workspace.getConfiguration(CONFIG_SECTION).get<boolean>(INCLUDE_HOME_AGENTS_KEY, false) === true;
}

function isFileNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== "object") {
    return false;
  }

  const code = "code" in err ? String((err as { code?: unknown }).code) : "";
  const message = err instanceof Error ? err.message : "";
  return code === "FileNotFound" || code === "ENOENT" || message.includes("Unable to read file");
}
