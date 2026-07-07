import React from "react";
import type { ChatMessage, ToolCallGroup } from "../../ChatViewTypes";
import { escapeHtml, renderRichText } from "../../utils/renderRichText";

interface MessageArticlesProps {
  messages: ChatMessage[];
  renderToolCallGroups?: (groups: ToolCallGroup[]) => React.ReactNode;
}

function MessageArticles({ messages, renderToolCallGroups }: MessageArticlesProps) {
  return (
    <>
      {messages.map((message) => {
        const isEmptyAssistantWithTools = message.role === "assistant" && !message.content?.trim() && message.toolCalls && message.toolCalls.length > 0;
        const html = buildMessageHtml(message);
        const toolCallGroups = buildMessageToolCallGroups(message);
        const showToolCallsBeforeMessage = message.role === "assistant" && toolCallGroups.length > 0;

        return (
          <React.Fragment key={message.id}>
            {showToolCallsBeforeMessage ? renderToolCallGroups?.(toolCallGroups) : null}
            {!isEmptyAssistantWithTools && (
              <article className={`message ${message.role}`}>
                <div className={message.role === "error" ? "errorMessage" : "messageContent"} dangerouslySetInnerHTML={{ __html: html }} />
              </article>
            )}
            {!showToolCallsBeforeMessage && toolCallGroups.length > 0 ? renderToolCallGroups?.(toolCallGroups) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

function buildMessageHtml(message: ChatMessage): string {
  if (message.role === "error") {
    return `<p>${escapeHtml(message.content)}</p>`;
  }

  return [
    message.reasoning?.trim()
      ? [
          '<details class="reasoning-block" open>',
          '<summary class="reasoning-toggle">Thinking...</summary>',
          `<div class="reasoning-content">${escapeHtml(message.reasoning).replace(/\n/g, "<br />")}</div>`,
          "</details>",
        ].join("")
      : "",
    renderRichText(message.content, message.role),
  ].join("");
}

function buildMessageToolCallGroups(message: ChatMessage): ToolCallGroup[] {
  if (!message.toolCalls?.length) {
    return [];
  }

  const grouped = new Map<number, ToolCallGroup>();
  let fallbackRound = 1;

  message.toolCalls.forEach((toolCall, index) => {
    const round = toolCall.round && toolCall.round > 0 ? toolCall.round : fallbackRound;
    if (!grouped.has(round)) {
      grouped.set(round, {
        id: `tool-message-${message.id}-round-${round}`,
        round,
        expanded: false,
        toolCalls: [],
      });
      if (!toolCall.round || toolCall.round <= 0) {
        fallbackRound += 1;
      }
    }

    grouped.get(round)!.toolCalls.push({
      toolCallId: toolCall.toolCallId || `${message.id}-${index}`,
      toolName: toolCall.toolName,
      arguments: toolCall.arguments,
      status: toolCall.rejected ? "rejected" : toolCall.isError ? "error" : "completed",
      result: toolCall.result,
      round,
      requiresConfirmation: toolCall.requiresConfirmation ?? false,
      dangerLevel: toolCall.dangerLevel,
      dangerConfirmed: toolCall.dangerConfirmed,
    });
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([, group]) => group);
}

export default MessageArticles;
