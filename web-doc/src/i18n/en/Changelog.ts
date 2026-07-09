import type { PageContent } from "../Types";

export const changelog: PageContent = {
  navTitle: "Changelog",
  title: "Changelog",
  description: "Relevant changes and preview status.",
  lead: "This page summarizes the human-facing changes for the first Marketplace preview.",
  sections: [
    {
      title: "0.1.0 preview",
      items: [
        "Migrated the extension to the layered src architecture.",
        "Removed Ollama and all provider selection from the product surface.",
        "Added React webview chat, History, Settings, and tool configuration.",
        "Added path autocomplete in the chat input with VS Code-style file icons.",
        "Improved cancellation so stopped prompts return to the input and are not kept in conversation context.",
        "Added global webview tooltips styled with VS Code theme variables.",
        "Prepared Marketplace metadata, MIT license, README, VSIX packaging, and documentation.",
        "Adopted the unique Marketplace identity yarcrasy.yrs-dpsk-copilot and the descriptive display name Yar's Deepseek copilot - A VS Code copilot specialized on Deepseek.",
      ],
    },
  ],
};
