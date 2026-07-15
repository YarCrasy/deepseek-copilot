import type { AssistantTimelineEvent, ChatMessage, Conversation, ConversationMessage, StoredToolCall } from "@/adapters";
import { createConversationTitle } from "./ConversationTitle";

export interface ConversationStore {
  save(conversation: Conversation): Promise<void>;
}

export interface SaveConversationTurnOptions {
  userMessage: ConversationMessage;
  assistantMessage: ConversationMessage;
  model: string;
}

export interface SaveConversationMessagesOptions {
  messages: ConversationMessage[];
  model: string;
}

export class ConversationState {
  private activeConversation: Conversation | null = null;

  constructor(private readonly conversationStore: ConversationStore) {}

  load(conversation: Conversation): void {
    this.activeConversation = conversation;
  }

  reset(): void {
    this.activeConversation = null;
  }

  forget(id: string): void {
    if (this.activeConversation?.id === id) {
      this.reset();
    }
  }

  getApiMessages(): ChatMessage[] {
    return toApiMessages(this.activeConversation?.messages ?? []);
  }

  createMessage(role: ConversationMessage["role"], content: string, extra: Pick<ConversationMessage, "timeline" | "toolCalls"> = {}): ConversationMessage {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      createdAt: Date.now(),
      ...extra,
    };
  }

  async saveTurn(options: SaveConversationTurnOptions): Promise<void> {
    await this.saveMessages({
      messages: [options.userMessage, options.assistantMessage],
      model: options.model,
    });
  }

  async saveMessages(options: SaveConversationMessagesOptions): Promise<void> {
    if (options.messages.length === 0) {
      return;
    }

    const now = Date.now();
    const existing = this.activeConversation;
    const nextMessages = [...(existing?.messages ?? []), ...options.messages];
    const conversation: Conversation = {
      id: existing?.id ?? `conversation-${now}`,
      title: createConversationTitle(nextMessages, existing?.title),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      model: options.model,
      messages: nextMessages,
    };

    this.activeConversation = conversation;
    await this.conversationStore.save(conversation);
  }
}

function toApiMessages(messages: ConversationMessage[]): ChatMessage[] {
  return messages.flatMap((message) => {
    if (message.role === "error") {
      return [];
    }

    if (message.role === "tool") {
      return [
        {
          role: "tool" as const,
          content: message.content,
          tool_call_id: message.toolCallId,
          name: message.toolName,
        },
      ];
    }

    const apiMessage: ChatMessage = {
      role: message.role,
      content: message.content,
    };

    if (message.role === "assistant") {
      apiMessage.reasoning_content = collectTimelineText(message.timeline, "reasoning") || null;
      apiMessage.tool_calls = toApiToolCalls(message.toolCalls);
    }

    const toolResults = (message.toolCalls ?? [])
      .filter((toolCall) => toolCall.result !== undefined)
      .map((toolCall) => ({
        role: "tool" as const,
        content: toolCall.result ?? "",
        tool_call_id: toolCall.toolCallId,
        name: toolCall.toolName,
      }));

    return [apiMessage, ...toolResults];
  });
}

function collectTimelineText(timeline: AssistantTimelineEvent[] | undefined, type: "reasoning" | "content"): string {
  return (timeline ?? [])
    .filter((event): event is Extract<AssistantTimelineEvent, { type: "reasoning" | "content" }> => event.type === type)
    .map((event) => event.content)
    .join("");
}

function toApiToolCalls(toolCalls: StoredToolCall[] | undefined): ChatMessage["tool_calls"] {
  return toolCalls?.map((toolCall) => ({
    id: toolCall.toolCallId,
    type: "function" as const,
    function: {
      name: toolCall.toolName,
      arguments: toolCall.arguments,
    },
  }));
}
