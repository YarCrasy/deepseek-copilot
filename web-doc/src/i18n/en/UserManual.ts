import type { PageContent } from "../Types";

export const userManual: PageContent = {
  navTitle: "User manual",
  title: "User manual",
  description: "Configure and use chat, tools, permissions, context, and global history.",
  lead: "Configure the API key, choose a permission mode, then use DeepSeek from the sidebar with explicit control over every workspace operation.",
  sections: [
    {
      title: "Getting started",
      items: [
        "Open Yar's DeepSeek Copilot from the Activity Bar and enter the API key in Settings. The key is stored in VS Code Secret Storage.",
        "Choose the model, thinking mode, reasoning effort, response limit, and maximum tool rounds.",
        "Type ./ or ../ to autocomplete workspace paths, or use the Explorer and editor context-menu commands to attach files and exact selections.",
        "Use Stop generation to cancel the request and any running terminal process tree. The cancelled prompt returns to the input and is not stored as a completed turn.",
      ],
    },
    {
      title: "Permissions and tool states",
      items: [
        "chat exposes no workspace tools; read-only exposes read_file, list_directory, and search_content; workspace also allows file creation and edits; full-access additionally exposes terminal execution; approve-for-me exposes every non-disabled tool and delegates approval to DeepSeek.",
        "Each tool can be disabled, require manual approval, or use safe-only auto approval. The global Approve for me permission mode treats DeepSeek's tool calls as approval and bypasses heuristic confirmations, so use it only in trusted workspaces.",
        "Tool calls move through awaiting confirmation, running, and one terminal state: completed, rejected, cancelled, or error.",
        "The extension host acknowledges execute and reject actions before the webview commits the visible state.",
        "Tool calls in a round run sequentially. Identical repeated calls are skipped, and the configurable round limit stops execution loops.",
      ],
    },
    {
      title: "Terminal execution",
      items: [
        "Terminal commands are non-interactive: they cannot answer prompts or provide a TTY.",
        "The result records stdout, stderr, exit code, signal, timeout, cancellation, effective working directory, and shell.",
        "Output is bounded; when truncated, the beginning and end are retained and the omitted middle is marked.",
        "Outside Approve for me, unknown commands require caution. Chained Bash, PowerShell, and cmd segments, publishing, deployment, remote changes, package managers, redirects, and destructive operations are reviewed before execution.",
      ],
    },
    {
      title: "History and privacy",
      items: [
        "Settings are stored in ~/.yrs-dpsk-copilot/settings.json. The API key remains in VS Code Secret Storage.",
        "History is stored globally as one JSON file per conversation in ~/.yrs-dpsk-copilot/history/ and each entry shows its source workspace.",
        "History can be disabled and retention can be configured from 0 days (manual deletion only) to 3650 days. The default is 30 days.",
        "The history list is rebuilt directly from validated conversation files. Storage is capped at 100 conversations and 24 MiB.",
        "Deleting one conversation or all visible conversations uses a native VS Code confirmation and offers Undo. Deleting the active conversation also clears Chat view.",
        "Interrupted pending or running tools are restored as cancelled. Corrupt records are isolated in the history/corrupt directory.",
      ],
    },
    {
      title: "Context and slash commands",
      items: [
        "Auto context includes the active editor plus staged and unstaged Git changes with time and size limits.",
        "Referenced files and AGENTS.md instructions are size-limited, use workspace-relative labels, and are delimited as untrusted data.",
        "Conversation context is pruned to a bounded budget; large tool results, reasoning, and file contents are shortened from the middle.",
        "Use /context to inspect what a normal request would send. Other commands include /status, /tools, /mode, /auto-context, /review, /goal, /summarize, and /clear-context.",
      ],
    },
  ],
};
