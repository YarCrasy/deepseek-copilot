import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";
import { compactText, truncateText } from "@/shared/utils";

const execFileAsync = promisify(execFile);
const AUTO_CONTEXT_BUDGET = 10_000;
const ACTIVE_EDITOR_BUDGET = 4_000;
const GIT_STATUS_BUDGET = 1_500;
const GIT_DIFF_BUDGET = 4_500;

export async function buildAutoContext(explicitContextLength = 0): Promise<string> {
  const budget = Math.max(0, AUTO_CONTEXT_BUDGET - explicitContextLength);
  if (budget < 500) {
    return "";
  }

  const sections = compactText([
    buildActiveEditorContext(Math.min(ACTIVE_EDITOR_BUDGET, budget)),
    await buildGitContext(Math.max(0, budget - ACTIVE_EDITOR_BUDGET)),
  ]);

  if (sections.length === 0) {
    return "";
  }

  return truncateText(`Auto context:
${sections.join("\n\n")}`, budget);
}

export async function buildGitReviewContext(): Promise<string> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return "No workspace folder is open.";
  }

  const status = await runGit(workspaceFolder.uri.fsPath, ["status", "--short"], 4_000);
  const diff = await runGit(workspaceFolder.uri.fsPath, ["diff", "--", "."], 18_000);
  const staged = await runGit(workspaceFolder.uri.fsPath, ["diff", "--cached", "--", "."], 18_000);

  if (!status && !diff && !staged) {
    return "No current Git changes were detected.";
  }

  return compactText([
    status ? `Git status:\n\`\`\`\n${status}\n\`\`\`` : "",
    diff ? `Git diff:\n\`\`\`diff\n${diff}\n\`\`\`` : "",
    staged ? `Git staged diff:\n\`\`\`diff\n${staged}\n\`\`\`` : "",
  ]).join("\n\n");
}

function buildActiveEditorContext(budget: number): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor || budget <= 0 || editor.document.isUntitled) {
    return "";
  }

  const relativePath = getRelativePath(editor.document.uri);
  const selectionText = editor.document.getText(editor.selection);
  const hasSelection = selectionText.trim().length > 0;
  const content = hasSelection ? selectionText : editor.document.getText();
  const rangeLabel = hasSelection
    ? `selection ${editor.selection.start.line + 1}:${editor.selection.start.character + 1}-${editor.selection.end.line + 1}:${editor.selection.end.character + 1}`
    : "active file";

  return truncateText(`[Active editor: ${relativePath} (${rangeLabel})]
\`\`\`${getLanguageId(editor.document, relativePath)}
${content}
\`\`\``, budget);
}

async function buildGitContext(budget: number): Promise<string> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder || budget <= 0) {
    return "";
  }

  const status = await runGit(workspaceFolder.uri.fsPath, ["status", "--short"], GIT_STATUS_BUDGET);
  const diffBudget = Math.max(0, Math.min(GIT_DIFF_BUDGET, budget - status.length - 80));
  const diff = diffBudget > 0 ? await runGit(workspaceFolder.uri.fsPath, ["diff", "--", "."], diffBudget) : "";
  const staged = diffBudget > 0 ? await runGit(workspaceFolder.uri.fsPath, ["diff", "--cached", "--", "."], diffBudget) : "";

  return truncateText(
    compactText([
      status ? `[Git status]\n\`\`\`\n${status}\n\`\`\`` : "",
      diff ? `[Git diff]\n\`\`\`diff\n${diff}\n\`\`\`` : "",
      staged ? `[Git staged diff]\n\`\`\`diff\n${staged}\n\`\`\`` : "",
    ]).join("\n\n"),
    budget,
  );
}

async function runGit(cwd: string, args: string[], budget: number): Promise<string> {
  if (budget <= 0) {
    return "";
  }

  try {
    const { stdout } = await execFileAsync("git", ["-C", cwd, ...args], {
      timeout: 1500,
      maxBuffer: 200_000,
    });
    return truncateText(stdout.trim(), budget);
  } catch {
    return "";
  }
}

function getRelativePath(uri: vscode.Uri): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  return workspaceFolder ? vscode.workspace.asRelativePath(uri, false) : uri.fsPath;
}

function getLanguageId(document: vscode.TextDocument, path: string): string {
  if (document.languageId && document.languageId !== "plaintext") {
    return document.languageId;
  }
  return path.split(".").pop() || "";
}
