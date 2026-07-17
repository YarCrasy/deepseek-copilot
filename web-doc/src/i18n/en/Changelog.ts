import type { PageContent } from "../Types";

export const changelog: PageContent = {
  navTitle: "Changelog",
  title: "Changelog",
  description: "Relevant changes and preview status.",
  lead: "Version 0.1.1 hardens chronological tool execution, terminal processes, API streaming, context, and workspace history.",
  sections: [
    {
      title: "0.1.1 reliability and security",
      items: [
        "Replaced text control markers with a native chronological assistant timeline for reasoning, content, and tool groups.",
        "Unified tool states and fixed rejection, cancellation, host acknowledgement, stale pending calls, duplicate calls, and maximum-round termination.",
        "Added real process-tree cancellation and structured non-interactive terminal results with bounded output and platform-aware danger analysis.",
        "Hardened SSE, response validation, URL joining, timeouts, Retry-After retries, and React stream batching.",
        "Moved settings and history to ~/.yrs-dpsk-copilot/. History uses one validated JSON file per conversation and no separate index.",
        "Added multi-root conversation association, context pruning, staged Git context, binary detection, delimited references, AGENTS.md limits, and optimistic file hashes.",
        "Fixed history deletion so deleting the active conversation clears Chat view while deleting another conversation leaves the current chat untouched.",
        "Completed the accessibility and UX pass with modal focus management, controlled autoscroll, streaming drafts, localized UI, workspace permissions, recoverable settings, and paginated history.",
      ],
    },
    {
      title: "0.1.0 preview",
      items: [
        "Introduced the layered source architecture, React chat webview, History, Settings, tool configuration, path autocomplete, and Marketplace packaging.",
        "Focused the product on DeepSeek and stored API keys in VS Code Secret Storage.",
      ],
    },
  ],
};
