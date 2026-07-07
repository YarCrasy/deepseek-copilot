import * as vscode from "vscode";
import { createDeepSeekProvider } from "@/deepseek-api/ProviderFactory";
import { HistoryManager, SettingsManager, SecretsManager } from "@/infrastructure/storage";
import { logWarning } from "@/shared/logging/logger";
import type { AppConfig, ChatMessage, Conversation, ConversationMessage, StoredToolCall, ToolDefinition, ToolExecutionModes, WebviewToHandlerMessage } from "@/adapters";
import { createSystemMessage, mapReasoningEffort } from "@/adapters/chat";
import { BUILT_IN_TOOLS, ToolExecutor, ToolRegistry } from "@/core/tools";
import { ConversationState } from "./chat/conversationState";
import { buildFileContext } from "./chat/fileContext";
import { PartialStreamError, sendMessageStreaming } from "./chat/streaming";
import { getAvailableToolMetadata } from "./chat/toolMetadata";
import { ToolCallSession } from "./chat/toolCalls/ToolCallSession";
import type { SendMessagePayload } from "./chat/types";

interface SaveAssistantResultOptions {
  userMessage: ConversationMessage;
  content: string;
  reasoning?: string;
  model: string;
  toolCalls?: StoredToolCall[];
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
      case "streamResponse":
        if (message.done && message.content) {
          webviewView.webview.postMessage({
            type: "addMessage",
            message: { role: "assistant", content: message.content },
          });
        }
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
    const apiKey = await SecretsManager.getApiKey(this.context);

    if (!apiKey) {
      webviewView.webview.postMessage({
        type: "streamError",
        error: "API key no configurada. Ve a Settings -> API Key.",
      });
      return;
    }

    const providerConfig: AppConfig = {
      ...config,
      apiKey,
      model: payload.modelId || config.model,
      thinkingMode: payload.reasoning !== "off",
      reasoningEffort: mapReasoningEffort(payload.reasoning),
    };

    const provider = createDeepSeekProvider(providerConfig);
    this.abortController = new AbortController();

    const userMessage = this.conversationState.createMessage("user", payload.text);
    const messages = this.buildMessages(payload);

    webviewView.webview.postMessage({
      type: "addMessage",
      message: { role: "user", content: userMessage.content },
    });
    webviewView.webview.postMessage({ type: "showTyping" });

    try {
      const allTools = this.toolRegistry.getDefinitionsForAPI();
      const toolExecutionModes = getEffectiveToolExecutionModes(config.toolExecutionModes, allTools);
      const tools: ToolDefinition[] = allTools.filter((tool) => toolExecutionModes[tool.function.name] !== "disabled");
      if (tools.length > 0) {
        const result = await this.toolCallSession.run({
          messages,
          tools,
          providerConfig,
          webviewView,
          toolExecutionModes,
          signal: this.abortController.signal,
          isCancelling: () => this.isCancelling,
        });
        if (result) {
          if (!this.isCancelling) {
            await this.saveAssistantResult({
              userMessage,
              content: result.content,
              reasoning: result.reasoning,
              model: providerConfig.model,
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
          webviewView.webview.postMessage({ type: "streamDone", cancelled: true });
        }
        return;
      }

      this.handleSendError(err, webviewView);
    } finally {
      this.isCancelling = false;
      this.abortController = null;
    }
  }

  private buildMessages(payload: SendMessagePayload): ChatMessage[] {
    let userContent = payload.text;
    if (payload.referencedFiles?.length) {
      userContent = `${buildFileContext(payload.referencedFiles)}

---

${payload.text}`;
    }

    return [createSystemMessage(), ...this.conversationState.getApiMessages(), { role: "user", content: userContent }];
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

  private handleSendError(err: unknown, webviewView: vscode.WebviewView): void {
    if (isCancellationError(err)) {
      if (!this.isCancelling) {
        webviewView.webview.postMessage({ type: "streamDone", cancelled: true });
      }
      return;
    }

    webviewView.webview.postMessage({
      type: "streamError",
      error: getErrorMessage(err),
    });
  }

  private cancelGeneration(webviewView: vscode.WebviewView): void {
    this.isCancelling = true;
    this.toolCallSession.cancel();
    this.abortController?.abort();
    this.abortController = null;
    webviewView.webview.postMessage({ type: "streamDone", cancelled: true });
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
  return err instanceof Error ? err.message : "Error inesperado al conectar con la API";
}

function getEffectiveToolExecutionModes(savedModes: ToolExecutionModes | undefined, tools: ToolDefinition[]): ToolExecutionModes {
  return Object.fromEntries(tools.map((tool) => [tool.function.name, savedModes?.[tool.function.name] ?? "enabled"]));
}
