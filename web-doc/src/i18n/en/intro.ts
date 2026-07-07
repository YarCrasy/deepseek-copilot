import type { PageContent } from "../types";

export const intro: PageContent = {
  navTitle: "Intro",
  title: "Introduction",
  description: "Introduction to DeepSeek Copilot.",
  lead: "DeepSeek Copilot is DeepSeek-only by design. It provides a focused assistant inside VS Code without provider switching.",
  sections: [
    {
      title: "Current beta scope",
      items: [
        "Sidebar chat with streaming responses.",
        "Thinking mode can be enabled or disabled without disabling tools.",
        "Workspace tools can read files, list directories, search content, create files, and run terminal commands.",
        "Path autocomplete appears in the input after typing ./ or ../.",
        "Pending tool calls remain visible when switching between Chat, History, and Settings.",
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
