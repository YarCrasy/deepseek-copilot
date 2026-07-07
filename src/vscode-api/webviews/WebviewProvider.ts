import * as vscode from "vscode";
import { ChatHandler } from "./handlers/ChatHandler";
import { SettingsHandler } from "./handlers/SettingsHandler";
import { HistoryHandler } from "./handlers/HistoryHandler";
import { getDevViewContent } from "./utils/devViewRenderer";
import { getHtmlContent } from "./utils/htmlRenderer";
import { HistoryManager } from "@/infrastructure/storage";
import { logError, logWarning } from "@/shared/logging/logger";
import type { PathCompletionItem, WebviewToHandlerMessage } from "@/adapters";

export class WebviewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  public static readonly viewType = "deepseek-copilot.chatView";

  private readonly chatHandler: ChatHandler;
  private readonly settingsHandler: SettingsHandler;
  private readonly historyHandler: HistoryHandler;
  private readonly disposables: vscode.Disposable[] = [];
  private webviewView?: vscode.WebviewView;
  private pendingDroppedUris: vscode.Uri[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
  ) {
    const historyManager = new HistoryManager(this._context);
    this.chatHandler = new ChatHandler(this._context, historyManager);
    this.settingsHandler = new SettingsHandler(this._context);
    this.historyHandler = new HistoryHandler(
      historyManager,
      (conversation) => this.chatHandler.loadConversation(conversation),
      (id) => this.chatHandler.forgetConversation(id),
    );

    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("deepseek-copilot")) {
          void this.refreshSettings();
        }
      }),
    );
  }

  public async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    this.webviewView = webviewView;
    const webviewDistUri = vscode.Uri.joinPath(this._extensionUri, "dist", "webview");
    const codiconsDistUri = vscode.Uri.joinPath(this._extensionUri, "node_modules", "@vscode", "codicons", "dist");
    const devServerUrl = process.env.DEEPSEEK_COPILOT_WEBVIEW_DEV_SERVER;
    const codiconFontUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(codiconsDistUri, "codicon.ttf"));

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [webviewDistUri, codiconsDistUri],
      portMapping: [
        {
          webviewPort: 5175,
          extensionHostPort: 5175,
        },
      ],
    };

    const useDevServer = devServerUrl ? await this.isDevServerAvailable(devServerUrl) : false;
    webviewView.webview.html =
      devServerUrl && useDevServer
        ? getDevViewContent({ webview: webviewView.webview, devServerUrl, codiconFontUri })
        : getHtmlContent(webviewView.webview, webviewDistUri, codiconsDistUri);

    webviewView.webview.onDidReceiveMessage((message: unknown) => {
      if (isWebviewToHandlerMessage(message)) {
        this._routeMessage(message, webviewView);
      } else {
        logWarning("[WebviewProvider] Ignoring malformed webview message");
      }
    });

    await this.flushPendingDroppedUris();
  }

  public dispose(): void {
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
    this.webviewView = undefined;
    this.pendingDroppedUris = [];
  }

  public async addUrisToChat(uris: vscode.Uri[]): Promise<void> {
    if (uris.length === 0) {
      return;
    }

    await vscode.commands.executeCommand("workbench.view.extension.deepseek-copilot-sidebar");

    if (!this.webviewView) {
      this.pendingDroppedUris.push(...uris);
      return;
    }

    await Promise.all(uris.map((uri) => this.handleFileDrop(uri.toString(), this.webviewView!)));
  }

  private async refreshSettings(): Promise<void> {
    if (!this.webviewView) {
      return;
    }

    await this.settingsHandler.postCurrentConfig(this.webviewView);
  }

  private async flushPendingDroppedUris(): Promise<void> {
    if (!this.webviewView || this.pendingDroppedUris.length === 0) {
      return;
    }

    const uris = this.pendingDroppedUris;
    this.pendingDroppedUris = [];
    await Promise.all(uris.map((uri) => this.handleFileDrop(uri.toString(), this.webviewView!)));
  }

  private async isDevServerAvailable(devServerUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 750);
      try {
        const response = await fetch(devServerUrl, { signal: controller.signal });
        return response.ok;
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      logWarning(`[WebviewProvider] Webview dev server unavailable at ${devServerUrl}; falling back to built webview.`);
      return false;
    }
  }

  private _routeMessage(message: WebviewToHandlerMessage, webviewView: vscode.WebviewView): void {
    switch (message.type) {
      // ── Chat ──
      case "sendMessage":
      case "cancelGeneration":
      case "streamResponse":
      case "getAvailableTools":
      case "executeToolCall":
      case "newConversation":
        this.chatHandler.handle(message, webviewView);
        break;

      // ── Drag & Drop (FASE 4.3) ──
      case "processFileDrop":
        this.handleFileDrop(message.uri, webviewView);
        break;

      case "getPathCompletions":
        void this.handlePathCompletions(message.requestId, message.query, webviewView);
        break;

      // ── Configuración ──
      case "getConfig":
      case "saveConfig":
      case "resetConfig":
      case "testConnection":
      case "getProviders":
        this.settingsHandler.handle(message, webviewView);
        break;

      // ── Historial ──
      case "getHistory":
      case "deleteConversation":
      case "loadConversation":
        this.historyHandler.handle(message, webviewView);
        break;

      // ── File Preview (FASE 4.3) ──
      case "openFile":
        this.handleOpenFile(message.path, message.line);
        break;

      default:
        logWarning(`[WebviewProvider] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Abre un archivo en el editor, opcionalmente en una línea específica.
   */
  private async handleOpenFile(filePath: string, line?: number): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }
      const rootPath = workspaceFolders[0].uri;
      const fileUri = vscode.Uri.joinPath(rootPath, filePath);

      const document = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(document);

      if (line !== undefined) {
        const targetLine = Math.max(0, line - 1); // VS Code usa 0-based
        const position = new vscode.Position(targetLine, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
      }
    } catch (err) {
      logError(`[WebviewProvider] Error opening file '${filePath}'`, err);
    }
  }

  private async handlePathCompletions(requestId: number, query: string, webviewView: vscode.WebviewView): Promise<void> {
    const items = await getPathCompletionItems(query);
    await webviewView.webview.postMessage({ type: "pathCompletions", requestId, query, items });
  }

  /**
   * Procesa un archivo/carpeta soltado desde el VS Code Explorer.
   * Lee el contenido si es archivo < 1MB, o devuelve solo metadatos.
   *
   * Maneja diferentes formatos de URI que puede enviar la webview:
   * - file:///ruta/absoluta
   * - vscode-file://vscode-app/ruta/absoluta (arrastrado desde el explorer)
   * - /ruta/absoluta (Unix)
   * - C:\\ruta\\absoluta (Windows)
   */
  private async handleFileDrop(uriStr: string, webviewView: vscode.WebviewView): Promise<void> {
    try {
      // Normalizar URI: convertir a vscode.Uri válido
      const uri = this.normalizeDropUri(uriStr);

      const stat = await vscode.workspace.fs.stat(uri);
      const isDir = stat.type === vscode.FileType.Directory;

      // Obtener ruta relativa al workspace, o absoluta si no hay workspace
      let relativePath: string;
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        relativePath = vscode.workspace.asRelativePath(uri);
      } else {
        relativePath = uri.fsPath;
      }

      const name = uri.path.split("/").pop() || uri.fsPath.split(/[/\\]/).pop() || "unknown";

      if (isDir) {
        webviewView.webview.postMessage({
          type: "fileDropResult",
          files: [
            {
              path: relativePath,
              name,
              content: "",
              language: "",
              type: "directory" as const,
              size: stat.size,
            },
          ],
        });
        return;
      }

      let content = "";
      const MAX_SIZE = 1024 * 1024; // 1 MB
      if (stat.size < MAX_SIZE) {
        const buf = await vscode.workspace.fs.readFile(uri);
        content = Buffer.from(buf).toString("utf-8");
      }

      const ext = uri.path.split(".").pop() || "";

      webviewView.webview.postMessage({
        type: "fileDropResult",
        files: [
          {
            path: relativePath,
            name,
            content,
            language: ext,
            type: "file" as const,
            size: stat.size,
          },
        ],
      });
    } catch (err) {
      logError("[WebviewProvider] Error handling file drop", err);
    }
  }

  /**
   * Convierte una cadena URI en un vscode.Uri válido,
   * soportando formatos que envía la webview al arrastrar desde el explorador.
   */
  private normalizeDropUri(uriStr: string): vscode.Uri {
    const trimmedUri = uriStr.trim();

    // 1. Esquema interno de VS Code al arrastrar desde el Explorer.
    if (trimmedUri.startsWith("vscode-file://")) {
      const parsed = vscode.Uri.parse(trimmedUri);
      return vscode.Uri.file(this.normalizeFilePath(parsed.path));
    }

    // 2. Esquema file:// estándar
    if (trimmedUri.startsWith("file://")) {
      return vscode.Uri.parse(trimmedUri);
    }

    // 3. Workspaces remotos de VS Code.
    if (trimmedUri.startsWith("vscode-remote://")) {
      return vscode.Uri.parse(trimmedUri);
    }

    // 4. Ruta absoluta Unix (empieza con /)
    if (trimmedUri.startsWith("/")) {
      return vscode.Uri.file(trimmedUri);
    }

    // 5. Ruta absoluta Windows (ej: C:\\users\\...)
    if (/^[a-zA-Z]:[\\/]/.test(trimmedUri)) {
      return vscode.Uri.file(trimmedUri);
    }

    // 6. Fallback: parseo directo
    return vscode.Uri.parse(trimmedUri);
  }

  private normalizeFilePath(path: string): string {
    const decodedPath = decodeURIComponent(path);
    if (/^\/[a-zA-Z]:[\\/]/.test(decodedPath)) {
      return decodedPath.slice(1);
    }
    return decodedPath;
  }
}

const WEBVIEW_MESSAGE_TYPES = new Set<WebviewToHandlerMessage["type"]>([
  "getConfig",
  "saveConfig",
  "resetConfig",
  "testConnection",
  "getProviders",
  "sendMessage",
  "cancelGeneration",
  "streamResponse",
  "copyCode",
  "insertCode",
  "selectModel",
  "newConversation",
  "getHistory",
  "loadConversation",
  "deleteConversation",
  "executeToolCall",
  "processFileDrop",
  "getPathCompletions",
  "getAvailableTools",
  "openFile",
]);

function isWebviewToHandlerMessage(message: unknown): message is WebviewToHandlerMessage {
  if (!message || typeof message !== "object") {
    return false;
  }
  const type = (message as { type?: unknown }).type;
  return typeof type === "string" && WEBVIEW_MESSAGE_TYPES.has(type as WebviewToHandlerMessage["type"]);
}

async function getPathCompletionItems(query: string): Promise<PathCompletionItem[]> {
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
