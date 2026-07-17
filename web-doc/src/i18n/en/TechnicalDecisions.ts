import type { PageContent } from "../Types";

export const technicalDecisions: PageContent = {
  navTitle: "Technical decisions",
  title: "Technical decisions",
  description: "Architecture, persistence, streaming, and execution decisions.",
  lead: "The extension separates domain state, DeepSeek transport, VS Code capabilities, and React rendering so safety rules remain authoritative in the extension host.",
  sections: [
    {
      title: "Layer boundaries",
      items: [
        "core owns provider-independent conversation, context, and tool-domain logic and does not import React or concrete HTTP clients.",
        "deepseekApi owns requests, response validation, SSE parsing, bounded retries, and tool-call orchestration.",
        "vscodeApi owns secrets, workspace access, storage, commands, terminal processes, confirmations, and host-webview routing.",
        "ui owns the React webview and changes authoritative tool state only after host messages.",
      ],
    },
    {
      title: "Chronological event model",
      items: [
        "Assistant presentation is persisted as typed reasoning, content, and tool-group events rather than control markers embedded in text.",
        "The same timeline contract renders live streams and restored history, preserving think -> tool -> think -> response order.",
        "Text deltas are grouped per animation frame and flushed before tool groups, completion, cancellation, or persistence.",
        "Message, event, conversation, and fallback tool-call IDs use crypto.randomUUID().",
      ],
    },
    {
      title: "Tools and terminal",
      items: [
        "Tool state has one native lifecycle ending in completed, rejected, cancelled, or error; rejection is not encoded as an execution error.",
        "Calls execute sequentially to preserve write order and independent approvals; duplicate name-and-argument calls are blocked by the orchestrator.",
        "Terminal uses spawn with process-tree cancellation, structured results, bounded head-and-tail output, and non-zero exit detection.",
        "Path authorization resolves real paths and existing ancestors to prevent symlink or junction escapes. Conversations retain their selected multi-root workspace URI.",
        "Confirmed file writes carry SHA-256 guards so edits and overwrites fail if disk content changes after preview.",
      ],
    },
    {
      title: "API, context, and persistence",
      items: [
        "SSE supports comments, CRLF, data fields with or without spaces, multiline events, decoder finalization, malformed JSON diagnostics, and reader cancellation.",
        "DeepSeek requests use normalized URLs, a 60-second per-attempt timeout, and at most three retries for transient failures while respecting Retry-After.",
        "Settings and conversation history live under ~/.yrs-dpsk-copilot/. History uses one validated JSON file per conversation and derives its list directly from those files.",
        "Context has aggregate budgets, binary detection, staged and unstaged Git data, bounded AGENTS.md sources, and explicit untrusted-data delimiters.",
      ],
    },
  ],
};
