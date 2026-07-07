import type { PageContent } from "../types";

export const technicalDecisions: PageContent = {
  navTitle: "Technical decisions",
  title: "Technical decisions",
  description: "Architecture decisions for DeepSeek Copilot.",
  lead: "The extension is structured to keep VS Code APIs, DeepSeek API code, core tool logic, and React UI separated.",
  sections: [
    {
      title: "Rules",
      items: [
        "core must not import vscode, React, or concrete HTTP clients.",
        "deepseek-api owns DeepSeek protocol details, streaming, models, and tool-call requests.",
        "vscode-api owns activation, commands, webviews, workspace, files, and terminal adapters.",
        "ui/chat owns the React webview and communicates only through the shared message contract.",
        "web-doc uses Astro and must support English, Spanish, and Chinese.",
      ],
    },
  ],
};
