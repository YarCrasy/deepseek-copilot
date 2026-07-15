import * as cp from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";
import { logError } from "@/shared/logging/Logger";
import { WebviewProvider } from "@/vscodeApi/webviews/WebviewProvider";

export interface ReferencedFilePayload {
  path: string;
  name: string;
  content?: string;
  language?: string;
  type: "file" | "directory";
  size?: number;
  selection?: { startLine: number; startCharacter: number; endLine: number; endCharacter: number };
}

const execFile = promisify(cp.execFile);
const MAX_REFERENCE_BYTES = 1024 * 1024;

export function registerChatCommands(context: vscode.ExtensionContext, provider: WebviewProvider): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("yrs-dpsk-copilot.addFileToChat", async (uri?: vscode.Uri, selectedUris?: vscode.Uri[]) => {
      const fallbackUri = vscode.window.activeTextEditor?.document.uri;
      await addUrisToChat(provider, collectCommandUris(uri ?? fallbackUri, selectedUris), "file");
    }),
    vscode.commands.registerCommand("yrs-dpsk-copilot.addFolderToChat", async (uri?: vscode.Uri, selectedUris?: vscode.Uri[]) => {
      await addUrisToChat(provider, collectCommandUris(uri, selectedUris), "directory");
    }),
    vscode.commands.registerCommand("yrs-dpsk-copilot.addSelectionToChat", async () => {
      await addActiveSelectionToChat(provider);
    }),
    vscode.commands.registerCommand("yrs-dpsk-copilot.newChat", async () => {
      await provider.startNewChat();
    }),
    vscode.commands.registerCommand("yrs-dpsk-copilot.reviewChanges", async () => {
      await reviewWorkspaceChanges(provider);
    }),
  );
}

async function addUrisToChat(provider: WebviewProvider, uris: vscode.Uri[], expectedType: "file" | "directory"): Promise<void> {
  const references: ReferencedFilePayload[] = [];

  for (const uri of uris) {
    const reference = await createReferenceFromUri(uri);
    if (reference && reference.type === expectedType) {
      references.push(reference);
    }
  }

  if (references.length === 0) {
    vscode.window.showInformationMessage(expectedType === "file" ? "Select a file to add to Yar's DeepSeek Copilot chat." : "Select a folder to add to Yar's DeepSeek Copilot chat.");
    return;
  }

  await provider.addReferencedFiles(references);
}

async function addActiveSelectionToChat(provider: WebviewProvider): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    vscode.window.showInformationMessage("Select code in an editor to add it to Yar's DeepSeek Copilot chat.");
    return;
  }

  const text = editor.document.getText(editor.selection);
  if (!text.trim()) {
    vscode.window.showInformationMessage("Select code in an editor to add it to Yar's DeepSeek Copilot chat.");
    return;
  }

  const path = getDisplayPath(editor.document.uri);
  const startLine = editor.selection.start.line + 1;
  const endLine = editor.selection.end.line + 1;

  await provider.addReferencedFiles([
    {
      path,
      name: `${getName(editor.document.uri)}:${startLine}${endLine === startLine ? "" : `-${endLine}`}`,
      content: text,
      language: editor.document.languageId,
      type: "file",
      size: Buffer.byteLength(text, "utf8"),
      selection: {
        startLine,
        startCharacter: editor.selection.start.character + 1,
        endLine,
        endCharacter: editor.selection.end.character + 1,
      },
    },
  ]);
}

async function reviewWorkspaceChanges(provider: WebviewProvider): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showInformationMessage("Open a workspace to review changes with Yar's DeepSeek Copilot.");
    return;
  }

  try {
    const [unstaged, staged] = await Promise.all([
      runGit(["diff", "--", "."], workspaceFolder.uri.fsPath),
      runGit(["diff", "--cached", "--", "."], workspaceFolder.uri.fsPath),
    ]);
    const content = [formatDiffSection("Staged changes", staged), formatDiffSection("Unstaged changes", unstaged)].filter(Boolean).join("\n\n");

    if (!content.trim()) {
      vscode.window.showInformationMessage("No Git changes found to review.");
      return;
    }

    await provider.setDraft("Review these workspace changes.");
    await provider.addReferencedFiles([
      {
        path: "git.diff",
        name: "git.diff",
        content: truncateContent(content),
        language: "diff",
        type: "file",
        size: Buffer.byteLength(content, "utf8"),
      },
    ]);
  } catch (err) {
    logError("[ChatCommands] Error collecting Git changes", err);
    vscode.window.showErrorMessage("Yar's DeepSeek Copilot could not collect Git changes for review.");
  }
}

function collectCommandUris(uri?: vscode.Uri, selectedUris?: vscode.Uri[]): vscode.Uri[] {
  const uris = selectedUris?.length ? selectedUris : uri ? [uri] : [];
  return [...new Map(uris.map((item) => [item.toString(), item])).values()];
}

async function createReferenceFromUri(uri: vscode.Uri): Promise<ReferencedFilePayload | null> {
  try {
    const stat = await vscode.workspace.fs.stat(uri);
    const isDirectory = stat.type === vscode.FileType.Directory;
    const path = getDisplayPath(uri);
    const name = getName(uri);

    if (isDirectory) {
      return {
        path,
        name,
        type: "directory",
        size: stat.size,
      };
    }

    if (stat.type !== vscode.FileType.File) {
      return null;
    }

    const content = stat.size <= MAX_REFERENCE_BYTES ? Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8") : undefined;
    return {
      path,
      name,
      content,
      language: getExtension(uri),
      type: "file",
      size: stat.size,
    };
  } catch (err) {
    logError(`[ChatCommands] Error creating reference for '${uri.toString()}'`, err);
    return null;
  }
}

async function runGit(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFile("git", args, { cwd, maxBuffer: MAX_REFERENCE_BYTES * 2, timeout: 5_000, encoding: "utf8" });
  return stdout;
}

function formatDiffSection(title: string, diff: string): string {
  return diff.trim() ? `# ${title}\n${diff.trim()}` : "";
}

function truncateContent(content: string): string {
  const buffer = Buffer.from(content, "utf8");
  if (buffer.byteLength <= MAX_REFERENCE_BYTES) {
    return content;
  }

  return `${buffer.subarray(0, MAX_REFERENCE_BYTES).toString("utf8")}\n\n[Diff truncated at 1 MB]`;
}

function getDisplayPath(uri: vscode.Uri): string {
  return vscode.workspace.workspaceFolders?.length ? vscode.workspace.asRelativePath(uri, false).replace(/\\/g, "/") : uri.fsPath;
}

function getName(uri: vscode.Uri): string {
  return uri.path.split("/").pop() || uri.fsPath.split(/[/\\]/).pop() || "unknown";
}

function getExtension(uri: vscode.Uri): string {
  const name = getName(uri);
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex + 1) : "";
}
