import React from "react";
import rehypeSanitize from "rehype-sanitize";
import { refractor } from "refractor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, ToolCallGroup } from "../../views/chatView/ChatViewTypes";
import "./ChatMessages.css";

interface ChatMessagesProps {
  messages: ChatMessage[];
  renderToolCallGroups?: (groups: ToolCallGroup[]) => React.ReactNode;
}

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: {
    className?: string[] | string;
  };
  children?: HastNode[];
};

function ChatMessages({ messages, renderToolCallGroups }: ChatMessagesProps) {
  return (
    <>
      {messages.map((message) => {
        const isEmptyAssistantWithTools = message.role === "assistant" && !message.content?.trim() && message.toolCalls && message.toolCalls.length > 0;
        const toolCallGroups = buildMessageToolCallGroups(message);
        const showToolCallsBeforeMessage = message.role === "assistant" && toolCallGroups.length > 0;

        return (
          <React.Fragment key={message.id}>
            {showToolCallsBeforeMessage ? renderToolCallGroups?.(toolCallGroups) : null}
            {!isEmptyAssistantWithTools && (
              <article className={`message ${message.role}`}>
                <div className={message.role === "error" ? "errorMessage" : "messageContent"}>
                  <MessageBody message={message} />
                </div>
              </article>
            )}
            {!showToolCallsBeforeMessage && toolCallGroups.length > 0 ? renderToolCallGroups?.(toolCallGroups) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

function MessageBody({ message }: { message: ChatMessage }) {
  if (message.role === "error") {
    return <p>{message.content}</p>;
  }

  return (
    <>
      {message.reasoning?.trim() ? (
        <details className="reasoning-block" open>
          <summary className="reasoning-toggle">Thinking...</summary>
          <div className="reasoning-content">{message.reasoning}</div>
        </details>
      ) : null}
      {message.role === "user" ? <PlainText content={message.content} /> : <MarkdownMessage content={message.content} role={message.role} />}
    </>
  );
}

function PlainText({ content }: { content: string }) {
  return (
    <>
      {content.split("\n").map((line, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <br /> : null}
          {line}
        </React.Fragment>
      ))}
    </>
  );
}

function MarkdownMessage({ content, role }: { content: string; role: ChatMessage["role"] }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        code({ className, children, ...props }) {
          const languageId = getLanguageId(className);
          const languageLabel = getLanguageLabel(languageId);
          const code = extractText(children).replace(/\n$/, "");
          const isInline = !className;

          if (isInline) {
            return (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          }

          return (
            <div className="code-block" data-code-text={code}>
              <div className="code-block-header">
                <span className="lang-label">{languageLabel}</span>
                <span className="code-actions">
                  <button type="button" className="code-action-btn" data-code-action="copy">
                    Copy
                  </button>
                  {role === "assistant" ? (
                    <button type="button" className="code-action-btn" data-code-action="insert">
                      Insert
                    </button>
                  ) : null}
                </span>
              </div>
              <RefractorCode code={code} className={className} language={languageId} codeProps={props} />
            </div>
          );
        },
        pre({ children }) {
          return <>{children}</>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function RefractorCode({ code, className, language, codeProps }: { code: string; className?: string; language: string; codeProps: React.ComponentProps<"code"> }) {
  let children: React.ReactNode;

  try {
    const tree = refractor.highlight(code, normalizeRefractorLanguage(language)) as HastNode;
    children = tree.children?.map((node, index) => renderHastNode(node, index)) ?? code;
  } catch {
    children = code;
  }

  return (
    <code className={className} {...codeProps}>
      {children}
    </code>
  );
}

function renderHastNode(node: HastNode, key: React.Key): React.ReactNode {
  if (node.type === "text") {
    return node.value ?? "";
  }

  if (node.type !== "element") {
    return null;
  }

  const className = Array.isArray(node.properties?.className) ? node.properties.className.join(" ") : node.properties?.className;

  return (
    <span key={key} className={className}>
      {node.children?.map((child, index) => renderHastNode(child, index))}
    </span>
  );
}

function extractText(value: React.ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(extractText).join("");
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(value)) {
    return extractText(value.props.children);
  }
  return "";
}

function getLanguageId(className?: string): string {
  return className?.match(/language-([^\s]+)/)?.[1] || "text";
}

function getLanguageLabel(language: string): string {
  const labels: Record<string, string> = {
    "c#": "C#",
    cs: "C#",
    csharp: "C#",
    js: "JavaScript",
    javascript: "JavaScript",
    ts: "TypeScript",
    typescript: "TypeScript",
    html: "HTML",
    css: "CSS",
    json: "JSON",
    bash: "Bash",
    shell: "Shell",
    sh: "Shell",
    python: "Python",
    py: "Python",
  };
  return labels[language.toLowerCase()] || language;
}

function normalizeRefractorLanguage(language: string): string {
  const aliases: Record<string, string> = {
    "c#": "csharp",
    cs: "csharp",
    js: "javascript",
    jsx: "jsx",
    py: "python",
    sh: "bash",
    shell: "bash",
    ts: "typescript",
    tsx: "tsx",
    yml: "yaml",
  };
  return aliases[language.toLowerCase()] || language.toLowerCase();
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

export default ChatMessages;
