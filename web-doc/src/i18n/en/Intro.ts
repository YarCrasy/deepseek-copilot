import type { PageContent } from "../Types";

export const intro: PageContent = {
  navTitle: "Intro",
  title: "Introduction",
  description: "Introduction to Yar's DeepSeek Copilot.",
  lead: "Yar's DeepSeek Copilot is DeepSeek-only by design. It provides a focused assistant inside VS Code without provider switching.",
  sections: [
    {
      title: "Current beta scope",
      items: [
        "Sidebar chat with responses, reasoning, and tool calls streamed and rendered in chronological order.",
        "Thinking mode can be enabled or disabled without disabling tools.",
        "The chat, read-only, workspace, full-access, and approve-for-me modes control read, search, edit, patch, terminal access, and delegated approval.",
        "Path autocomplete appears after typing ./ or ../, and auto context can include the active editor and Git changes.",
        "Settings and global history are stored under ~/.yrs-dpsk-copilot/ with configurable retention, native deletion confirmation, and Undo.",
      ],
    },
    {
      title: "Non-affiliation",
      items: [
        "This is an independent third-party extension. It is not affiliated with, endorsed by, sponsored by, or officially maintained by DeepSeek.",
      ],
    },
  ],
};
