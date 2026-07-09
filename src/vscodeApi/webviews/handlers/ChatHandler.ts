import * as vscode from "vscode";
import { PERMISSION_MODE_ALLOWED_TOOLS } from "@/adapters";
import { createDeepSeekProvider } from "@/deepseekApi/ProviderFactory";
import { appendProjectInstructionsToSystemPrompt, loadProjectInstructions } from "@/vscodeApi/configuration/ProjectInstructions";
import { HistoryManager, SettingsManager, SecretsManager } from "@/vscodeApi/storage";
import { GOAL_STORAGE_KEY } from "@/shared/constants";
import { logWarning } from "@/shared/logging/Logger";
import type { AppConfig, ChatMessage, Conversation, ConversationMessage, PermissionMode, StoredToolCall, ToolDefinition, ToolExecutionModes, WebviewToHandlerMessage } from "@/adapters";
import { createSystemMessage, mapReasoningEffort } from "@/adapters/deepseek/Chat";
import { BUILT_IN_TOOLS, ToolExecutor, ToolRegistry } from "@/core/tools";
import { buildFileContext } from "@/core/context/FileReferences";
import { ConversationState } from "@/core/chat/ConversationState";
import { PartialStreamError } from "@/core/errors/PartialStreamError";
import { buildAutoContext, buildGitReviewContext } from "./chat/FileContext";
import { StreamEventEmitter } from "./chat/StreamEventEmitter";
import { sendMessageStreaming } from "./chat/Streaming";
import { getAvailableToolMetadata } from "./chat/ToolMetadata";
import { ToolCallSession } from "./chat/toolCalls/ToolCallSession";
import type { SendMessagePayload } from "./chat/Types";

interface SaveAssistantResultOptions {
  userMessage: ConversationMessage;
  content: string;
  reasoning?: string;
  model: string;
  toolCalls?: StoredToolCall[];
}

interface ParsedSlashCommand {
  name: string;
  args: string[];
}

export class ChatHandler {
  private abortController: AbortController | null = null;
  private isCancelling = false;
  private readonly conversationState: ConversationState;
  private readonly toolRegistry: ToolRegistry;
  private readonly toolCallSession: ToolCallSession;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly historyManager: HistoryManager,
  ) {
    this.conversationState = new ConversationState(this.historyManager);
    this.toolRegistry = new ToolRegistry();
    for (const tool of BUILT_IN_TOOLS) {
      this.toolRegistry.register(tool);
    }

    this.toolCallSession = new ToolCallSession(new ToolExecutor(this.toolRegistry));
  }

  handle(message: WebviewToHandlerMessage, webviewView: vscode.WebviewView): void {
    switch (message.type) {
      case "sendMessage":
        void this.sendMessage(
          {
            text: message.text,
            modelId: message.modelId,
            reasoning: message.reasoning,
            referencedFiles: message.referencedFiles,
          },
          webviewView,
        );
        break;
      case "cancelGeneration":
        this.cancelGeneration(webviewView);
        break;
      case "executeToolCall":
        this.toolCallSession.handleUserAction({
          toolCallId: message.toolCallId,
          action: message.action,
          trustForSession: message.trustForSession,
        });
        break;
      case "getAvailableTools":
        this.handleGetAvailableTools(webviewView);
        break;
      case "newConversation":
        this.conversationState.reset();
        this.toolCallSession.resetSessionTrust();
        webviewView.webview.postMessage({ type: "clearChat" });
        break;
      default:
        logWarning(`[ChatHandler] Unknown message: ${message.type}`);
    }
  }

  loadConversation(conversation: Conversation): void {
    this.conversationState.load(conversation);
  }

  forgetConversation(id: string): void {
    this.conversationState.forget(id);
  }

  private async sendMessage(payload: SendMessagePayload, webviewView: vscode.WebviewView): Promise<void> {
    const config = SettingsManager.load();
    if (await this.handleSlashCommand(payload, config, webviewView)) {
      return;
    }

    const requestedThinkingMode = payload.reasoning !== "off";
    const requestedModel = payload.modelId || config.model;
    const apiKey = await SecretsManager.getApiKey(this.context);

    if (!apiKey) {
      webviewView.webview.postMessage({
        type: "streamError",
        error: "API key is not configured. Open Settings -> API Key.",
      });
      return;
    }

    const providerConfig: AppConfig = {
      ...config,
      apiKey,
      model: requestedModel,
      thinkingMode: requestedThinkingMode,
      reasoningEffort: mapReasoningEffort(payload.reasoning),
    };

    const provider = createDeepSeekProvider(providerConfig);
    this.abortController = new AbortController();
    const stream = new StreamEventEmitter(webviewView);

    const userMessage = this.conversationState.createMessage("user", payload.text);
    const messages = await this.buildMessages(payload, config, webviewView);

    webviewView.webview.postMessage({
      type: "addMessage",
      message: { role: "user", content: userMessage.content },
    });
    stream.showTyping();

    try {
      const allTools = this.toolRegistry.getDefinitionsForAPI();
      const toolExecutionModes = getEffectiveToolExecutionModes(config.toolExecutionModes, allTools);
      const toolProviderConfig: AppConfig = {
        ...providerConfig,
        thinkingMode: true,
        reasoningEffort: providerConfig.reasoningEffort ?? "high",
      };
      const tools = getToolsForPermissionMode(config.permissionMode, allTools).filter((tool) => toolExecutionModes[tool.function.name] !== "disabled");
      if (tools.length > 0) {
        const result = await this.toolCallSession.run({
          messages,
          tools,
          providerConfig: toolProviderConfig,
          webviewView,
          toolExecutionModes,
          exposeReasoning: providerConfig.thinkingMode,
          signal: this.abortController.signal,
          isCancelling: () => this.isCancelling,
        });
        if (result) {
          if (!this.isCancelling) {
            await this.saveAssistantResult({
              userMessage,
              content: result.content,
              reasoning: result.reasoning,
              model: toolProviderConfig.model,
              toolCalls: result.toolCalls as StoredToolCall[] | undefined,
            });
          }
        }
      } else {
        const result = await sendMessageStreaming({
          messages,
          payload,
          config,
          provider,
          webviewView,
          signal: this.abortController.signal,
        });
        await this.saveAssistantResult({ userMessage, content: result.content, reasoning: result.reasoning, model: providerConfig.model });
      }
    } catch (err: unknown) {
      if (err instanceof PartialStreamError) {
        if (!this.isCancelling) {
          await this.saveAssistantResult({
            userMessage,
            content: err.partial.content,
            reasoning: err.partial.reasoning,
            model: providerConfig.model,
          });
        }
        if (!this.isCancelling) {
          stream.done({ cancelled: true });
        }
        return;
      }

      this.handleSendError(err, stream);
    } finally {
      this.isCancelling = false;
      this.abortController = null;
    }
  }

  private async buildMessages(payload: SendMessagePayload, config: AppConfig, webviewView: vscode.WebviewView): Promise<ChatMessage[]> {
    const contextBlocks: string[] = [];
    if (payload.referencedFiles?.length) {
      contextBlocks.push(buildFileContext(payload.referencedFiles));
    }

    if (config.autoContext) {
      const explicitContextLength = contextBlocks.join("\n\n").length;
      const autoContext = await buildAutoContext(explicitContextLength);
      if (autoContext) {
        contextBlocks.push(autoContext);
      }
    }

    const userContent = contextBlocks.length
      ? `${contextBlocks.join("\n\n")}

---

${payload.text}`
      : payload.text;

    const projectInstructions = await loadProjectInstructions();
    webviewView.webview.postMessage({
      type: "projectInstructionsStatus",
      sources: projectInstructions.sources,
      homeAgentsAllowed: projectInstructions.homeAgentsAllowed,
    });

    const systemMessage = createSystemMessage();
    return [
      {
        ...systemMessage,
        content: appendProjectInstructionsToSystemPrompt(systemMessage.content ?? "", projectInstructions.content),
      },
      ...this.conversationState.getApiMessages(),
      { role: "user", content: userContent },
    ];
  }

  private async handleSlashCommand(payload: SendMessagePayload, config: AppConfig, webviewView: vscode.WebviewView): Promise<boolean> {
    const command = parseSlashCommand(payload.text);
    if (!command) {
      return false;
    }

    switch (command.name) {
      case "status":
        await this.postCommandTurn(webviewView, payload.text, await this.buildStatusMessage(config));
        return true;
      case "tools":
        this.postCommandTurn(webviewView, payload.text, this.buildToolsMessage(config));
        return true;
      case "mode":
        await this.handleModeCommand(command.args, payload.text, webviewView);
        return true;
      case "auto-context":
        await this.handleAutoContextCommand(command.args, payload.text, webviewView);
        return true;
      case "review":
        this.postCommandTurn(webviewView, payload.text, await buildGitReviewContext());
        return true;
      case "goal":
        await this.handleGoalCommand(command.args, payload.text, webviewView);
        return true;
      case "summarize":
        this.postCommandTurn(webviewView, payload.text, this.buildConversationSummary());
        return true;
      case "clear-context":
        this.conversationState.reset();
        this.toolCallSession.resetSessionTrust();
        webviewView.webview.postMessage({ type: "clearChat" });
        this.postCommandTurn(webviewView, payload.text, "Conversation context cleared.");
        return true;
      default:
        this.postCommandTurn(
          webviewView,
          payload.text,
          `Unknown command: /${command.name}\n\nAvailable commands: /status, /review, /goal [text], /tools, /mode chat|read-only|workspace|full-access, /auto-context on|off, /clear-context, /summarize.`,
        );
        return true;
    }
  }

  private async buildStatusMessage(config: AppConfig): Promise<string> {
    const apiKey = await SecretsManager.getApiKey(this.context);
    const tools = this.getEnabledTools(config);
    const thinkingMode = config.thinkingMode ? "on" : "off";
    return [
      "Status",
      `- API key: ${apiKey ? "configured" : "missing"}`,
      `- Model: ${config.model}`,
      `- Thinking mode: ${thinkingMode}`,
      `- Permission mode: ${config.permissionMode}`,
      `- Auto context: ${config.autoContext ? "on" : "off"}`,
      `- Tools available: ${config.thinkingMode ? tools.length : "0 (thinking mode required)"}`,
    ].join("\n");
  }

  private buildToolsMessage(config: AppConfig): string {
    const allTools = this.toolRegistry.getDefinitionsForAPI();
    const enabledTools = new Set((config.thinkingMode ? this.getEnabledTools(config) : []).map((tool) => tool.function.name));
    const toolExecutionModes = getEffectiveToolExecutionModes(config.toolExecutionModes, allTools);
    const lines = allTools.map((tool) => {
      const name = tool.function.name;
      const availability = config.thinkingMode ? (enabledTools.has(name) ? toolExecutionModes[name] : "unavailable") : "unavailable (thinking mode required)";
      return `- ${name}: ${availability}`;
    });

    return [`Tools for mode '${config.permissionMode}'`, ...lines].join("\n");
  }

  private async handleModeCommand(args: string[], rawText: string, webviewView: vscode.WebviewView): Promise<void> {
    const mode = normalizePermissionMode(args[0]);
    if (!isPermissionMode(mode)) {
      this.postCommandTurn(webviewView, rawText, "Usage: /mode chat|read|read-only|workspace|full|full-access");
      return;
    }

    await SettingsManager.save({ permissionMode: mode });
    await this.postConfigLoaded(webviewView);
    this.postCommandTurn(webviewView, rawText, `Permission mode set to '${mode}'.`);
  }

  private async handleAutoContextCommand(args: string[], rawText: string, webviewView: vscode.WebviewView): Promise<void> {
    const value = args[0];
    if (value !== "on" && value !== "off") {
      this.postCommandTurn(webviewView, rawText, "Usage: /auto-context on|off");
      return;
    }

    const enabled = value === "on";
    await SettingsManager.save({ autoContext: enabled });
    await this.postConfigLoaded(webviewView);
    this.postCommandTurn(webviewView, rawText, `Auto context ${enabled ? "enabled" : "disabled"}.`);
  }

  private async handleGoalCommand(args: string[], rawText: string, webviewView: vscode.WebviewView): Promise<void> {
    const goal = args.join(" ").trim();
    if (goal.length > 0) {
      await this.context.workspaceState.update(GOAL_STORAGE_KEY, goal);
      this.postCommandTurn(webviewView, rawText, `Goal set:\n${goal}`);
      return;
    }

    const currentGoal = this.context.workspaceState.get<string>(GOAL_STORAGE_KEY);
    this.postCommandTurn(webviewView, rawText, currentGoal ? `Current goal:\n${currentGoal}` : "No goal is set.");
  }

  private buildConversationSummary(): string {
    const messages = this.conversationState.getApiMessages().filter((message) => message.role !== "system");
    if (messages.length === 0) {
      return "No conversation context to summarize.";
    }

    const recent = messages.slice(-6).map((message) => {
      const content = typeof message.content === "string" ? message.content.replace(/\s+/g, " ").trim() : "";
      return `- ${message.role}: ${content.slice(0, 220)}${content.length > 220 ? "..." : ""}`;
    });

    return [`Conversation summary (${messages.length} context messages):`, ...recent].join("\n");
  }

  private async postConfigLoaded(webviewView: vscode.WebviewView): Promise<void> {
    const freshConfig = SettingsManager.load();
    const apiKey = await SecretsManager.getApiKey(this.context);
    webviewView.webview.postMessage({
      type: "configLoaded",
      config: { ...freshConfig, apiKey: apiKey || "" },
    });
  }

  private postCommandTurn(webviewView: vscode.WebviewView, userText: string, assistantText: string): void {
    webviewView.webview.postMessage({
      type: "addMessage",
      message: { role: "user", content: userText },
    });
    webviewView.webview.postMessage({
      type: "addMessage",
      message: { role: "assistant", content: assistantText },
    });
  }

  private getEnabledTools(config: AppConfig): ToolDefinition[] {
    const allTools = this.toolRegistry.getDefinitionsForAPI();
    const toolExecutionModes = getEffectiveToolExecutionModes(config.toolExecutionModes, allTools);
    return getToolsForPermissionMode(config.permissionMode, allTools).filter((tool) => toolExecutionModes[tool.function.name] !== "disabled");
  }

  private async saveAssistantResult({ userMessage, content, reasoning, model, toolCalls }: SaveAssistantResultOptions): Promise<void> {
    await this.conversationState.saveMessages({
      messages: [
        userMessage,
        this.conversationState.createMessage("assistant", content, {
          reasoning,
          toolCalls,
        }),
      ],
      model,
    });
  }

  private handleSendError(err: unknown, stream: StreamEventEmitter): void {
    if (isCancellationError(err)) {
      if (!this.isCancelling) {
        stream.done({ cancelled: true });
      }
      return;
    }

    stream.error(getErrorMessage(err));
  }

  private cancelGeneration(webviewView: vscode.WebviewView): void {
    this.isCancelling = true;
    this.toolCallSession.cancel();
    this.abortController?.abort();
    this.abortController = null;
    new StreamEventEmitter(webviewView).done({ cancelled: true });
  }

  private handleGetAvailableTools(webviewView: vscode.WebviewView): void {
    webviewView.webview.postMessage({
      type: "availableTools",
      tools: getAvailableToolMetadata(this.toolRegistry.getDefinitionsForAPI()),
    });
  }

}

export default ChatHandler;

function isCancellationError(err: unknown): boolean {
  return err instanceof Error && (err.name === "AbortError" || err.name === "Canceled");
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error while connecting to the API";
}

function getEffectiveToolExecutionModes(savedModes: ToolExecutionModes | undefined, tools: ToolDefinition[]): ToolExecutionModes {
  return Object.fromEntries(tools.map((tool) => [tool.function.name, savedModes?.[tool.function.name] ?? "enabled"]));
}

function getToolsForPermissionMode(permissionMode: PermissionMode, tools: ToolDefinition[]): ToolDefinition[] {
  const allowedToolNames = PERMISSION_MODE_ALLOWED_TOOLS[permissionMode];
  if (allowedToolNames === null) {
    return tools;
  }

  return tools.filter((tool) => allowedToolNames.includes(tool.function.name));
}

function parseSlashCommand(text: string): ParsedSlashCommand | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }

  const [rawName, ...args] = trimmed.slice(1).split(/\s+/).filter(Boolean);
  return {
    name: (rawName || "").toLowerCase(),
    args,
  };
}

function isPermissionMode(value: unknown): value is PermissionMode {
  return value === "chat" || value === "read-only" || value === "workspace" || value === "full-access";
}

function normalizePermissionMode(value: string | undefined): string | undefined {
  if (value === "read") {
    return "read-only";
  }
  if (value === "full") {
    return "full-access";
  }
  return value;
}
