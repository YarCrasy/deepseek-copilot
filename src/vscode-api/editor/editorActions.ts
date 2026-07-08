import * as vscode from "vscode";
import { logError } from "@/shared/logging/logger";
import type { PathCompletionItem } from "@/adapters";

export async function openWorkspaceFile(filePath: string, line?: number): Promise<void> {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, filePath);
    const document = await vscode.workspace.openTextDocument(fileUri);
    const editor = await vscode.window.showTextDocument(document);

    if (line !== undefined) {
      const targetLine = Math.max(0, line - 1);
      const position = new vscode.Position(targetLine, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    }
  } catch (err) {
    logError(`[EditorActions] Error opening file '${filePath}'`, err);
  }
}

export async function insertCodeIntoActiveEditor(code: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await vscode.window.showInformationMessage("Open an editor to insert code from DeepSeek Copilot.");
    return;
  }

  await editor.edit((editBuilder) => {
    for (const selection of editor.selections) {
      editBuilder.replace(selection, code);
    }
  });
}

export async function getPathCompletionItems(query: string): Promise<PathCompletionItem[]> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder || !isRelativePathQuery(query)) {
    return [];
  }

  const normalizedQuery = query.replace(/\\/g, "/");
  const slashIndex = normalizedQuery.lastIndexOf("/");
  const directoryQuery = slashIndex >= 0 ? normalizedQuery.slice(0, slashIndex + 1) : "./";
  const namePrefix = slashIndex >= 0 ? normalizedQuery.slice(slashIndex + 1).toLowerCase() : normalizedQuery.toLowerCase();
  const directoryUri = resolveWorkspacePath(workspaceFolder.uri, directoryQuery);

  try {
    const entries = await vscode.workspace.fs.readDirectory(directoryUri);
    return entries
      .filter(([name]) => !name.startsWith(".") && name.toLowerCase().startsWith(namePrefix))
      .map(([name, type]) => {
        const isDirectory = type === vscode.FileType.Directory;
        return {
          label: isDirectory ? `${name}/` : name,
          path: `${directoryQuery}${name}${isDirectory ? "/" : ""}`,
          type: isDirectory ? "directory" : "file",
        } satisfies PathCompletionItem;
      })
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.label.localeCompare(b.label);
      })
      .slice(0, 50);
  } catch {
    return [];
  }
}

function isRelativePathQuery(query: string): boolean {
  return query.startsWith("./") || query.startsWith("../");
}

function resolveWorkspacePath(root: vscode.Uri, query: string): vscode.Uri {
  const segments: string[] = [];
  for (const segment of query.split("/")) {
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  return vscode.Uri.joinPath(root, ...segments);
}
