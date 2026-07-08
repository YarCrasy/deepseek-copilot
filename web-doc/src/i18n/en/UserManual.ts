import type { PageContent } from "../Types";

export const userManual: PageContent = {
  navTitle: "User manual",
  title: "User manual",
  description: "How to configure and use DeepSeek Copilot.",
  lead: "The basic workflow is configure the API key, choose model settings, then ask questions from the sidebar.",
  sections: [
    {
      title: "Daily workflow",
      items: [
        "Open the DeepSeek Copilot activity bar item.",
        "Set the API key in Settings. The key is stored in VS Code Secret Storage.",
        "Choose model, thinking mode, reasoning effort, and tool execution modes.",
        "Type ./ or ../ in the input to autocomplete workspace paths.",
        "Review pending tool calls before execution unless a tool is configured for safe auto approval.",
        "Use Stop generation to cancel. The cancelled prompt returns to the input and is not kept in history.",
      ],
    },
  ],
};
