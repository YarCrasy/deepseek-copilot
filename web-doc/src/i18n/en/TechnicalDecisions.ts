import type { PageContent } from "../Types";

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
        "deepseekApi owns DeepSeek protocol details, streaming, models, and tool-call requests.",
        "vscodeApi owns activation, commands, webviews, workspace, files, and terminal adapters.",
        "ui owns the React webview and communicates only through the shared message contract.",
        "web-doc uses Astro and must support English, Spanish, and Chinese.",
        "Source folders use camelCase and source implementation files use PascalCase.",
        "Tooling, generated output, routing files, and barrel files keep their ecosystem-required names, such as package.json, index.ts, and Astro route files.",
      ],
    },
  ],
};
